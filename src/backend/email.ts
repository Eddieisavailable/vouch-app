import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getBaseTemplate = (content: string) => `
<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
   <div style="background-color: #1E40AF; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">Vouch</h1>
   </div>
   <div style="padding: 30px;">
      ${content}
   </div>
   <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
      <p>Vouch - Liberia's Marketplace for Skilled Tradespeople</p>
      <p>If you don't want to receive these emails, you can update your preferences in your account settings.</p>
   </div>
</div>
`;

export const sendEmail = async (to: string, subject: string, html: string) => {
   if (!process.env.SMTP_USER) {
      console.log('Sending mock email to', to, 'Subject:', subject);
      return false;
   }
   
   try {
      await transporter.sendMail({
         from: process.env.FROM_EMAIL || `"Vouch Notifications" <${process.env.SMTP_USER}>`,
         to,
         subject,
         html: getBaseTemplate(html)
      });
      return true;
   } catch(e) {
      console.error('Email send failed', e);
      return false;
   }
};

export const Templates = {
   AccountApproved: (name: string) => `
      <h2 style="color: #111827;">Welcome to Vouch, ${name}!</h2>
      <p style="color: #4b5563; line-height: 1.6;">Your account has been approved by our admin team. You can now start using Vouch to connect with verified tradespeople and employers.</p>
      <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background-color: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">Go to Dashboard</a>
   `,
   BidReceived: (jobTitle: string, bidderName: string, amount: number) => `
      <h2 style="color: #111827;">New Bid Received!</h2>
      <p style="color: #4b5563; line-height: 1.6;"><strong>${bidderName}</strong> has placed a bid of <strong>L$${amount}</strong> on your job: <em>${jobTitle}</em>.</p>
      <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/my-jobs" style="display: inline-block; background-color: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">View Bid</a>
   `,
   BidAccepted: (jobTitle: string) => `
      <h2 style="color: #111827;">Congratulations! Your bid was accepted.</h2>
      <p style="color: #4b5563; line-height: 1.6;">An employer has accepted your bid for the job: <em>${jobTitle}</em>. You can now start a conversation and arrange the next steps.</p>
      <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/messages" style="display: inline-block; background-color: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">Start Conversation</a>
   `,
   JobCompleted: (jobTitle: string) => `
      <h2 style="color: #111827;">Job Completed</h2>
      <p style="color: #4b5563; line-height: 1.6;">The job <em>${jobTitle}</em> has been marked as completed. Please take a moment to leave a review and release any remaining payments.</p>
      <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/my-jobs" style="display: inline-block; background-color: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">View Details & Leave Review</a>
   `,
   PaymentReceived: (amount: number, jobTitle: string) => `
      <h2 style="color: #111827;">Payment Processed</h2>
      <p style="color: #4b5563; line-height: 1.6;">A payment of <strong>L$${amount}</strong> has been logged for job: <em>${jobTitle}</em>.</p>
      <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/transactions" style="display: inline-block; background-color: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">View Transactions</a>
   `,
   ReviewReceived: (jobTitle: string) => `
      <h2 style="color: #111827;">You received a new review!</h2>
      <p style="color: #4b5563; line-height: 1.6;">Someone left you a review for the job: <em>${jobTitle}</em>. Check out your profile to see what they said.</p>
      <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/profile" style="display: inline-block; background-color: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">View Review</a>
   `,
   NewMessage: (sender: string) => `
      <h2 style="color: #111827;">New Message Received</h2>
      <p style="color: #4b5563; line-height: 1.6;"><strong>${sender}</strong> sent you a direct message.</p>
      <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/messages" style="display: inline-block; background-color: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">Read Message</a>
   `
};
