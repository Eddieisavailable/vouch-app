import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import pg from 'pg';
import bcrypt from 'bcryptjs';

// Fallback logic so the app works in the preview environment immediately.
// If DATABASE_URL is set (e.g. Supabase, Neon), it uses PostgreSQL.
// Otherwise, it falls back to a local SQLite database that mimics the schema.

export let isPg = !!process.env.DATABASE_URL;
let pgPool: pg.Pool | null = null;
let sqliteDb: Database.Database | null = null;

if (isPg) {
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  // Use a local database file to persist between server restarts during development
  sqliteDb = new Database('local_vouch.db');
}

export async function query(text: string, params: any[] = []): Promise<any[]> {
  if (isPg && pgPool) {
    const res = await pgPool.query(text, params);
    return res.rows;
  } else if (sqliteDb) {
    // Replace Postgres style $1, $2 with SQLite style ?1, ?2 to support positional binding
    // and correctly handle multiple occurrences of the same parameter index.
    const sqliteText = text.replace(/\$(\d+)/g, '?$1');
    
    // Map positional array to an object {1: params[0], 2: params[1]} 
    // because better-sqlite3 treats ?1, ?2 as named parameters keyed by "1", "2"
    let argObj = {};
    if (params && params.length > 0) {
      params.forEach((val, idx) => { argObj[idx + 1] = val; });
    }
    
    if (text.trim().toUpperCase().startsWith('SELECT') || text.trim().toUpperCase().startsWith('WITH')) {
      const stmt = sqliteDb.prepare(sqliteText);
      return params && params.length > 0 ? stmt.all(argObj) : stmt.all();
    } else {
      const stmt = sqliteDb.prepare(sqliteText);
      const info = params && params.length > 0 ? stmt.run(argObj) : stmt.run();
      
      // If there's a RETURNING clause in the original query, standard sqlite driver run() doesn't return the row.
      // We will handle specific RETURNING cases by manually fetching the inserted/updated row, or executing it as a query.
      if (text.toUpperCase().includes('RETURNING *')) {
         const returningStmt = sqliteDb.prepare(sqliteText);
         // better-sqlite3 can return data from INSERT ... RETURNING using .get() or .all()
         return params && params.length > 0 ? returningStmt.all(argObj) : returningStmt.all();
      }
      return [info]; // Wrap info object
    }
  }
  return [];
}

export async function initDb() {
  console.log(`Initializing database... Using ${isPg ? 'PostgreSQL' : 'SQLite fallback'}`);

  // Schema mappings for SQLite vs Postgres
  const UUID_TYPE = isPg ? 'UUID' : 'TEXT';
  const JSONB_TYPE = isPg ? 'JSONB' : 'TEXT';
  const TIMESTAMP_TYPE = isPg ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
  const PRIMARY_KEY_UUID = isPg ? 'UUID PRIMARY KEY DEFAULT gen_random_uuid()' : 'TEXT PRIMARY KEY';

  const SERIAL_TYPE = isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      user_id ${PRIMARY_KEY_UUID},
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      unique_login_id VARCHAR(20) UNIQUE NOT NULL,
      user_type VARCHAR(20) NOT NULL,
      created_at ${TIMESTAMP_TYPE},
      is_approved BOOLEAN DEFAULT ${isPg ? 'false' : '0'},
      is_active BOOLEAN DEFAULT ${isPg ? 'true' : '1'},
      suspension_reason TEXT,
      password_reset_token VARCHAR(255),
      password_reset_expires TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      profile_id ${PRIMARY_KEY_UUID},
      user_id ${UUID_TYPE} REFERENCES users(user_id) ON DELETE CASCADE,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      county VARCHAR(100),
      city VARCHAR(100),
      phone_number VARCHAR(50),
      email VARCHAR(255),
      profile_photo_url VARCHAR(255),
      bio TEXT
    );

    CREATE TABLE IF NOT EXISTS tradespeople (
      tradesperson_id ${UUID_TYPE} PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      company_name VARCHAR(255),
      trades ${JSONB_TYPE} DEFAULT '[]',
      years_experience INTEGER DEFAULT 0,
      portfolio_photos ${JSONB_TYPE} DEFAULT '[]',
      service_areas ${JSONB_TYPE} DEFAULT '[]',
      hourly_rate_lrd DECIMAL DEFAULT 0,
      bio TEXT,
      created_at ${TIMESTAMP_TYPE},
      updated_at ${TIMESTAMP_TYPE}
    );

    CREATE TABLE IF NOT EXISTS employers (
      employer_id ${UUID_TYPE} PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      company_name VARCHAR(255),
      created_at ${TIMESTAMP_TYPE}
    );

    CREATE TABLE IF NOT EXISTS trade_categories (
      category_id ${SERIAL_TYPE},
      name VARCHAR(100) UNIQUE NOT NULL,
      icon_class VARCHAR(50),
      display_order INTEGER DEFAULT 0,
      created_at ${TIMESTAMP_TYPE}
    );

    CREATE TABLE IF NOT EXISTS jobs (
      job_id ${PRIMARY_KEY_UUID},
      employer_id ${UUID_TYPE} REFERENCES users(user_id) ON DELETE CASCADE,
      trade_category_id INTEGER REFERENCES trade_categories(category_id),
      title VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      county VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      budget_min_lrd DECIMAL NOT NULL,
      budget_max_lrd DECIMAL NOT NULL,
      status VARCHAR(50) DEFAULT 'open',
      urgency_level VARCHAR(20) DEFAULT 'normal',
      created_at ${TIMESTAMP_TYPE},
      updated_at ${TIMESTAMP_TYPE},
      approved_by ${UUID_TYPE} REFERENCES users(user_id),
      approved_at TIMESTAMP,
      expires_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bids (
      bid_id ${PRIMARY_KEY_UUID},
      job_id ${UUID_TYPE} REFERENCES jobs(job_id) ON DELETE CASCADE,
      tradesperson_id ${UUID_TYPE} REFERENCES users(user_id) ON DELETE CASCADE,
      proposed_price_lrd DECIMAL NOT NULL,
      estimated_days INTEGER NOT NULL,
      cover_message TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at ${TIMESTAMP_TYPE},
      updated_at ${TIMESTAMP_TYPE},
      accepted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      conversation_id ${PRIMARY_KEY_UUID},
      job_id ${UUID_TYPE} REFERENCES jobs(job_id) ON DELETE CASCADE,
      participant_ids ${JSONB_TYPE} NOT NULL,
      last_message_at ${TIMESTAMP_TYPE},
      created_at ${TIMESTAMP_TYPE}
    );

    CREATE TABLE IF NOT EXISTS messages (
      message_id ${PRIMARY_KEY_UUID},
      conversation_id ${UUID_TYPE} REFERENCES conversations(conversation_id) ON DELETE CASCADE,
      sender_id ${UUID_TYPE} REFERENCES users(user_id) ON DELETE CASCADE,
      message_text TEXT NOT NULL,
      is_read BOOLEAN DEFAULT ${isPg ? 'false' : '0'},
      read_at TIMESTAMP,
      created_at ${TIMESTAMP_TYPE}
    );

    CREATE TABLE IF NOT EXISTS notifications (
      notification_id ${PRIMARY_KEY_UUID},
      user_id ${UUID_TYPE} REFERENCES users(user_id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      link_url VARCHAR(255),
      is_read BOOLEAN DEFAULT ${isPg ? 'false' : '0'},
      read_at TIMESTAMP,
      created_at ${TIMESTAMP_TYPE},
      expires_at TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS reviews (
      review_id ${PRIMARY_KEY_UUID},
      job_id ${UUID_TYPE} REFERENCES jobs(job_id) ON DELETE CASCADE,
      reviewer_id ${UUID_TYPE} REFERENCES users(user_id) ON DELETE CASCADE,
      reviewee_id ${UUID_TYPE} REFERENCES users(user_id) ON DELETE CASCADE,
      reviewer_type VARCHAR(20),
      overall_rating INTEGER,
      quality_rating INTEGER,
      professionalism_rating INTEGER,
      timeliness_rating INTEGER,
      value_rating INTEGER,
      communication_rating INTEGER,
      testimonial_text TEXT,
      is_verified BOOLEAN DEFAULT ${isPg ? 'false' : '0'},
      verified_by ${UUID_TYPE} REFERENCES users(user_id),
      verified_at TIMESTAMP,
      created_at ${TIMESTAMP_TYPE},
      updated_at ${TIMESTAMP_TYPE}
    );

    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id ${PRIMARY_KEY_UUID},
      job_id ${UUID_TYPE} REFERENCES jobs(job_id) ON DELETE RESTRICT,
      payer_id ${UUID_TYPE} REFERENCES users(user_id) ON DELETE RESTRICT,
      payee_id ${UUID_TYPE} REFERENCES users(user_id) ON DELETE RESTRICT,
      amount_lrd DECIMAL NOT NULL,
      transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'milestone', 'release', 'refund'
      payment_method VARCHAR(50) DEFAULT 'cash', -- 'cash', 'mobile_money_future'
      status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
      notes TEXT,
      receipt_photo_url VARCHAR(255),
      created_at ${TIMESTAMP_TYPE},
      completed_at TIMESTAMP,
      verified_by ${UUID_TYPE} REFERENCES users(user_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS disputes (
      dispute_id ${PRIMARY_KEY_UUID},
      job_id ${UUID_TYPE} REFERENCES jobs(job_id) ON DELETE CASCADE,
      raised_by ${UUID_TYPE} REFERENCES users(user_id) ON DELETE CASCADE,
      against_user ${UUID_TYPE} REFERENCES users(user_id) ON DELETE CASCADE,
      dispute_type VARCHAR(50) NOT NULL, -- 'payment_issue', 'quality_issue', 'no_show', 'breach_of_agreement', 'other'
      description TEXT NOT NULL,
      evidence_urls ${JSONB_TYPE} DEFAULT '[]',
      status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'awaiting_response', 'resolved'
      resolution_notes TEXT,
      resolution_action VARCHAR(50), -- 'release_payment', 'refund_payment', 'partial_refund', 'no_action'
      created_at ${TIMESTAMP_TYPE},
      resolved_at TIMESTAMP,
      resolved_by ${UUID_TYPE} REFERENCES users(user_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS dispute_messages (
      message_id ${PRIMARY_KEY_UUID},
      dispute_id ${UUID_TYPE} REFERENCES disputes(dispute_id) ON DELETE CASCADE,
      sender_id ${UUID_TYPE} REFERENCES users(user_id) ON DELETE CASCADE,
      message_text TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT ${isPg ? 'false' : '0'},
      created_at ${TIMESTAMP_TYPE}
    );

    -- Phase 5
    CREATE TABLE IF NOT EXISTS verification_documents (
      document_id ${PRIMARY_KEY_UUID},
      user_id ${UUID_TYPE} REFERENCES users(user_id) ON DELETE CASCADE,
      document_type VARCHAR(50) NOT NULL,
      file_url VARCHAR(255) NOT NULL,
      file_type VARCHAR(50),
      verification_status VARCHAR(20) DEFAULT 'pending',
      submitted_at ${TIMESTAMP_TYPE},
      reviewed_by ${UUID_TYPE} REFERENCES users(user_id),
      reviewed_at TIMESTAMP,
      rejection_reason TEXT,
      expiration_date TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      setting_id ${PRIMARY_KEY_UUID},
      user_id ${UUID_TYPE} UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
      email_notifications_enabled BOOLEAN DEFAULT ${isPg ? 'false' : '0'},
      notify_bid_received BOOLEAN DEFAULT ${isPg ? 'true' : '1'},
      notify_bid_accepted BOOLEAN DEFAULT ${isPg ? 'true' : '1'},
      notify_job_completed BOOLEAN DEFAULT ${isPg ? 'true' : '1'},
      notify_payment_received BOOLEAN DEFAULT ${isPg ? 'true' : '1'},
      notify_review_received BOOLEAN DEFAULT ${isPg ? 'true' : '1'},
      notify_messages BOOLEAN DEFAULT ${isPg ? 'true' : '1'},
      created_at ${TIMESTAMP_TYPE},
      updated_at ${TIMESTAMP_TYPE}
    );
  `;

  if (isPg && pgPool) {
    await pgPool.query(schema);
  } else if (sqliteDb) {
    sqliteDb.exec(schema);
  }

  // Phase 3 migrations (wrapped in try/catches since ADD COLUMN IF NOT EXISTS requires careful handling)
  const usersColumns = [
    'overall_rating_avg DECIMAL DEFAULT 0', 'quality_rating_avg DECIMAL DEFAULT 0',
    'professionalism_rating_avg DECIMAL DEFAULT 0', 'timeliness_rating_avg DECIMAL DEFAULT 0',
    'value_rating_avg DECIMAL DEFAULT 0', 'communication_rating_avg DECIMAL DEFAULT 0',
    'total_reviews_count INTEGER DEFAULT 0', 'trust_score INTEGER DEFAULT 0',
    "verification_level VARCHAR(20) DEFAULT 'Basic'",
    'password_reset_token VARCHAR(255)', 'password_reset_expires TIMESTAMP',
    "permissions TEXT DEFAULT '[]'",
    'suspension_reason TEXT'
  ];

  for (const col of usersColumns) {
    try {
      if (isPg && pgPool) await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col}`);
      else if (sqliteDb) sqliteDb.exec(`ALTER TABLE users ADD COLUMN ${col}`);
    } catch (e) { /* ignore duplicate column errors in sqlite */ }
  }

  // Phase 5 migrations for messages & conversations
  try {
     if (isPg && pgPool) {
        await pgPool.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'");
        await pgPool.query("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_typing BOOLEAN DEFAULT false");
        await pgPool.query("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS typing_updated_at TIMESTAMP");
     } else if (sqliteDb) {
        sqliteDb.exec("ALTER TABLE messages ADD COLUMN attachments TEXT DEFAULT '[]'");
        sqliteDb.exec("ALTER TABLE conversations ADD COLUMN is_typing BOOLEAN DEFAULT 0");
        sqliteDb.exec("ALTER TABLE conversations ADD COLUMN typing_updated_at TIMESTAMP");
     }
  } catch (e) { }

  // Phase 5 Indexes
  try {
     const indexes = [
        "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
        "CREATE INDEX IF NOT EXISTS idx_users_unique_login_id ON users(unique_login_id)",
        "CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)",
        "CREATE INDEX IF NOT EXISTS idx_jobs_trade_category ON jobs(trade_category_id)",
        "CREATE INDEX IF NOT EXISTS idx_jobs_county ON jobs(county)",
        "CREATE INDEX IF NOT EXISTS idx_bids_job_id ON bids(job_id)",
        "CREATE INDEX IF NOT EXISTS idx_bids_tradesperson_id ON bids(tradesperson_id)",
        "CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)",
        "CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id)",
        "CREATE INDEX IF NOT EXISTS idx_transactions_job_id ON transactions(job_id)"
     ];
     for (const idx of indexes) {
        if (isPg && pgPool) await pgPool.query(idx);
        else if (sqliteDb) sqliteDb.exec(idx);
     }
  } catch(e) { }

  // Phase 3 full text search on Jobs
  try {
    if (isPg && pgPool) {
       await pgPool.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS search_vector tsvector`);
       await pgPool.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'LRD'`);
       await pgPool.query(`UPDATE jobs SET search_vector = to_tsvector('english', title || ' ' || description) WHERE search_vector IS NULL`);
       await pgPool.query(`CREATE INDEX IF NOT EXISTS jobs_search_idx ON jobs USING GIN(search_vector)`);
       // Trigger creation handles automatically updating search vectors
       await pgPool.query(`
          CREATE OR REPLACE FUNCTION jobs_search_trigger() RETURNS trigger AS $$
          BEGIN
            new.search_vector := to_tsvector('english', coalesce(new.title, '') || ' ' || coalesce(new.description, ''));
            return new;
          END
          $$ LANGUAGE plpgsql;
       `);
       await pgPool.query(`
          DROP TRIGGER IF EXISTS tsvectorupdate ON jobs;
          CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION jobs_search_trigger();
       `);
    } else {
       // local dev sqlite alternative using a simple text search, no real tsvector but we add a column to mock it
       try { if (sqliteDb) sqliteDb.exec(`ALTER TABLE jobs ADD COLUMN search_vector TEXT`); } catch(e){}
       try { if (sqliteDb) sqliteDb.exec(`ALTER TABLE jobs ADD COLUMN currency VARCHAR(3) DEFAULT 'LRD'`); } catch(e){}
    }
  } catch(e) { console.error('FTS Migration failed', e); }

  await seedAdmin();
  await seedTradeCategories();
  await migratePhase6();
}

async function migratePhase6() {
   console.log("Running Phase 6 Migrations...");
   // feedback table
   try {
      await query(`
         CREATE TABLE IF NOT EXISTS feedback (
            feedback_id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(user_id),
            category VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            page_url VARCHAR(255),
            user_agent TEXT,
            status VARCHAR(20) DEFAULT 'new',
            admin_response TEXT,
            responded_by UUID REFERENCES users(user_id),
            responded_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         )
      `);
   } catch(e) { console.error("Feedback table migration failed", e); }

   // favorites table
   try {
      await query(`
         CREATE TABLE IF NOT EXISTS favorites (
            favorite_id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(user_id),
            favorited_user_id UUID REFERENCES users(user_id),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, favorited_user_id)
         )
      `);
   } catch(e) { console.error("Favorites table migration failed", e); }

   try {
      await query(`
         CREATE TABLE IF NOT EXISTS favorite_jobs (
            favorite_id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(user_id),
            job_id UUID REFERENCES jobs(job_id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, job_id)
         )
      `);
   } catch(e) { console.error("Favorite jobs table migration failed", e); }

   // help_articles table
   try {
      await query(`
         CREATE TABLE IF NOT EXISTS help_articles (
            article_id UUID PRIMARY KEY,
            slug VARCHAR(100) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            category VARCHAR(50) NOT NULL,
            views_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         )
      `);
   } catch(e) { console.error("Help Articles table migration failed", e); }

   // verification_errors table
   try {
      await query(`
         CREATE TABLE IF NOT EXISTS verification_errors (
            error_id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
            document_type VARCHAR(50),
            error_message TEXT NOT NULL,
            user_agent TEXT,
            status VARCHAR(20) DEFAULT 'unreviewed',
            reviewed_by UUID REFERENCES users(user_id),
            reviewed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         )
      `);
   } catch(e) { console.error("Verification errors table migration failed", e); }

   // featured items columns
   try {
      if (isPg && pgPool) {
         await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE`);
         await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP`);
         await pgPool.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE`);
         await pgPool.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP`);
         await pgPool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE`);
      } else {
         try { if (sqliteDb) sqliteDb.exec(`ALTER TABLE users ADD COLUMN is_featured BOOLEAN DEFAULT 0`); } catch(e){}
         try { if (sqliteDb) sqliteDb.exec(`ALTER TABLE users ADD COLUMN featured_until TIMESTAMP`); } catch(e){}
         try { if (sqliteDb) sqliteDb.exec(`ALTER TABLE jobs ADD COLUMN is_featured BOOLEAN DEFAULT 0`); } catch(e){}
         try { if (sqliteDb) sqliteDb.exec(`ALTER TABLE jobs ADD COLUMN featured_until TIMESTAMP`); } catch(e){}
         try { if (sqliteDb) sqliteDb.exec(`ALTER TABLE reviews ADD COLUMN is_featured BOOLEAN DEFAULT 0`); } catch(e){}
      }
   } catch(e) {}
}

async function seedTradeCategories() {
  const trades = [
    { name: 'Electrical', icon: 'zap' },
    { name: 'Plumbing', icon: 'droplet' },
    { name: 'Carpentry', icon: 'hammer' },
    { name: 'Masonry', icon: 'brick-wall' },
    { name: 'Painting', icon: 'paint-roller' },
    { name: 'Welding', icon: 'flame' },
    { name: 'Mechanical', icon: 'wrench' },
    { name: 'Construction', icon: 'hard-hat' },
    { name: 'Roofing', icon: 'home' },
    { name: 'Tiling', icon: 'pipette' },
    { name: 'General', icon: 'briefcase' }
  ];

  try {
    const existing = await query("SELECT COUNT(*) as count FROM trade_categories");
    if (existing[0]?.count == 0) {
      for (let i = 0; i < trades.length; i++) {
        await query(
          "INSERT INTO trade_categories (name, icon_class, display_order) VALUES ($1, $2, $3)",
          [trades[i].name, trades[i].icon, i]
        );
      }
      console.log('Trade categories seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding trade categories:', err);
  }
}

async function seedAdmin() {
  try {
    const existingAdmins = await query("SELECT * FROM users WHERE username = 'admin' LIMIT 1");
    if (existingAdmins.length === 0) {
      const adminPass = await bcrypt.hash('Admin@Vouch2026!', 10);
      const adminId = uuidv4();
      
      const insertQuery = `
        INSERT INTO users (user_id, username, password_hash, unique_login_id, user_type, is_approved, is_active)
        VALUES ($1, $2, $3, $4, $5, ${isPg ? 'true' : '1'}, ${isPg ? 'true' : '1'})
        RETURNING *
      `;
      
      await query(insertQuery, [adminId, 'admin', adminPass, 'ADMIN001', 'admin']);
      
      // Also create empty profile
      const insertProfileQuery = `
        INSERT INTO user_profiles (profile_id, user_id, first_name, last_name)
        VALUES ($1, $2, $3, $4)
      `;
      await query(insertProfileQuery, [uuidv4(), adminId, 'System', 'Admin']);
      
      console.log('Admin user seeded successfully. Username: admin');
    }
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }
}

// Generate an 8-character unique login ID
export async function generateUniqueLoginId(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, 1, O, 0
    let isUnique = false;
    let loginId = '';
    
    while (!isUnique) {
        loginId = 'VH'; // Vouch prefix
        for (let i = 0; i < 6; i++) {
            loginId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const existing = await query("SELECT 1 FROM users WHERE unique_login_id = $1", [loginId]);
        if (existing.length === 0) {
            isUnique = true;
        }
    }
    
    return loginId;
}
