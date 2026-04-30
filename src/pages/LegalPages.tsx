import React from 'react';
import { SEO } from '@/components/SEO';

const LegalLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-50 min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto">
            <div className="bento-card p-8 md:p-16 bg-white">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">{title}</h1>
                <p className="text-gray-400 font-mono text-xs mb-12 uppercase tracking-widest border-b pb-8">Last Updated: April 23, 2026</p>
                <div className="prose prose-blue max-w-none prose-h2:text-2xl prose-h2:font-black prose-h2:tracking-tight prose-h2:mt-12 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

export const TermsPage: React.FC = () => (
    <>
        <SEO title="Terms of Service | Vouch Liberia" description="Read our terms of service to understand your rights and responsibilities when using the Vouch platform." />
        <LegalLayout title="Terms of Service">
            <h2>1. Contractual Relationship</h2>
            <p>These Terms of Service ("Terms") govern the access or use by you, an individual, from within Liberia of applications, websites, content, products, and services (the "Services") made available by Vouch.</p>
            
            <h2>2. User Responsibilities</h2>
            <p>By using Vouch, you agree to:</p>
            <ul>
                <li>Provide accurate, current, and complete information during the registration process.</li>
                <li>Maintain the security of your account credentials.</li>
                <li>Conduct yourself professionally and ethically in all interactions on the platform.</li>
                <li>Abide by all local Liberian laws and regulations.</li>
            </ul>

            <h2>3. The Vouch Marketplace</h2>
            <p>Vouch is a technology platform that enables users of Vouch's applications or websites provided as part of the Services to arrange and schedule logistics and/or professional services with independent third-party providers. Vouch does not provide the services itself and is not a service contractor.</p>

            <h2>4. Payments & Fees</h2>
            <p>Users understand that use of the Services may result in charges for the services or goods you receive from a Third Party Provider. All payments made through Vouch are subject to a platform fee (which will be disclosed at the time of payment). Users agree to settle all payments through the platform's designated payment channels to ensure safety and record-keeping.</p>

            <h2>5. Dispute Resolution</h2>
            <p>Vouch provides a dispute resolution mechanism to help resolve conflicts between employers and tradespeople. However, the ultimate responsibility for the quality of work and payment lies between the parties. Any legal disputes shall be governed by the laws of the Republic of Liberia.</p>

            <h2>6. Account Termination</h2>
            <p>Vouch reserves the right to suspend or terminate accounts that violate these terms, specifically targeting fraud, identity spoofing, or repeated poor performance reported by the community.</p>
        </LegalLayout>
    </>
);

export const PrivacyPage: React.FC = () => (
    <>
        <SEO title="Privacy Policy | Vouch Liberia" description="Learn how Vouch collects, uses, and protects your personal data in compliance with Liberian privacy standards." />
        <LegalLayout title="Privacy Policy">
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
            <ul>
                <li><strong>Identity Data:</strong> Full name, national ID (for verification), and profile photos.</li>
                <li><strong>Contact Data:</strong> Phone number, email address, and service area.</li>
                <li><strong>Professional Data:</strong> Trade certificates, portfolio photos, and work history.</li>
                <li><strong>Usage Data:</strong> How you interact with our platform, including trust score metrics and reviews.</li>
            </ul>

            <h2>2. How We Use Your Data</h2>
            <p>We use the information we collect to:</p>
            <ul>
                <li>Provide, maintain, and improve our Services.</li>
                <li>Verify the identity of tradespeople and build Trust Scores.</li>
                <li>Facilitate communication between employers and tradespeople.</li>
                <li>Perform internal operations, including to prevent fraud and abuse of our Services.</li>
            </ul>

            <h2>3. Data Sharing</h2>
            <p>We do not sell your personal data. We share your information only as necessary to facilitate the platform's core function—connecting you with other users for work. Public profile information (excluding PII like phone numbers until a bid is accepted) is visible to all authenticated users.</p>

            <h2>4. Data Security</h2>
            <p>We implement robust security measures to protect your data. Sensitive documents uploaded for verification are stored securely and are only accessible by Vouch's administrative team.</p>

            <h2>5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information through your account settings or by contacting our support team.</p>
        </LegalLayout>
    </>
);

