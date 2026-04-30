# Deployment Guide

This guide will walk you through deploying Vouch! to Render.com (Backend) and Vercel (Frontend). Since Vouch uses Express and Vite, we can either deploy as a monolithic Full-Stack application on Render, or deploy the frontend separately on Vercel and the backend on Render. 

This guide covers deploying the **monolithic Full-Stack application on Render**, which simplifies CORS and API configurations.

## 1. Prepare for Deployment

Make sure your environment variables are set up securely in Render. You will need:
- \`DATABASE_URL\` (Your PostgreSQL connection string)
- \`CLOUDINARY_CLOUD_NAME\`, \`CLOUDINARY_API_KEY\`, \`CLOUDINARY_API_SECRET\`
- \`JWT_SECRET\` (Generate a long ranodm string)
- \`VITE_APP_URL\` (The URL of your live app, e.g., \`https://vouch-app.onrender.com\`)
- \`SMTP_HOST\`, \`SMTP_PORT\`, \`SMTP_USER\`, \`SMTP_PASS\`, \`FROM_EMAIL\` (For email notifications)

## 2. Deploying on Render.com (Full-Stack)

Since we injected Vite inside our Express \`server.ts\` file, this single repository acts as a single Web Service in production.

1. **Sign up / Login** to [Render.com](https://render.com).
2. Create a **New Web Service**.
3. Connect your GitHub repository where you exported the code from AI Studio.
4. Set the following details:
   - **Environment:** \`Node\`
   - **Build Command:** \`npm install && npm run build\`
   - **Start Command:** \`npm run start\` (or \`node dist/server.cjs\` depending on how you build your \`server.ts\` file)
     *Note: Ensure your \`package.json\` starts the server using the compiled server file or run \`tsx server.ts\`.*
5. **Environment Variables**: Add all the variables from step 1 into the "Environment Variables" section on Render.
6. Click **Create Web Service**.

Render will install dependencies, run the Vite build, and then start the server. Render handles SSL automatically.

## 3. Database Updates & Migrations

When running the SQLite version, the local file is maintained. However, in production with PostgreSQL, you need to ensure \`DATABASE_URL\` points to a managed PostgreSQL database (Render Provides one for free in the dashboard!).

The \`src/backend/db.ts\` will run migrations and table creations automatically if they do not exist.

## 4. Backups and Monitoring
- Enable **automated backups** within your Managed PostgreSQL Database settings in Render.
- If using Sentry or NewRelic, append their configuration inside the \`server.ts\` initialization.
- Google Analytics is ready; just inject your Google Tag ID into the \`index.html\` file before deploying.

## 5. Caching and SEO
By default, \`vite-plugin-pwa\` is enabled in the Vite config. Check \`vite.config.ts\`. Service workers will be compiled in the \`dist/\` folder. No further action needed for PWA.
