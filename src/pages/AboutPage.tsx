import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Users, Heart, Mail, Phone, MapPin, Award } from 'lucide-react';
import { SEO } from '@/components/SEO';

export const AboutPage: React.FC = () => {
    const values = [
        { icon: Shield, title: "Unwavering Trust", desc: "We believe trust is the primary currency of a thriving economy." },
        { icon: Target, title: "Precision Matching", desc: "Connecting the right skills with the right needs, every time." },
        { icon: Users, title: "Community Wealth", desc: "When tradespeople thrive, Liberian communities grow stronger." },
        { icon: Award, title: "Excellence", desc: "Setting a new standard for professional accountability in Liberia." }
    ];

    return (
        <div className="bg-white min-h-screen">
            <SEO 
                title="About Us | Our Mission to Build Trust in Liberia" 
                description="Learn the story of Vouch, our mission to empower skilled tradespeople in Liberia, and how we're solving the trust gap in the market."
            />

            {/* Hero */}
            <section className="relative py-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        <motion.h1 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter mb-8"
                        >
                            Building the <span className="text-blue-600">infrastructure</span> of trust.
                        </motion.h1>
                        <motion.p 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-2xl text-gray-500 font-medium leading-relaxed"
                        >
                            Vouch is more than a marketplace. We're a reputation engine for Liberia's most skilled professionals.
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* The Problem */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="bento-card p-12 bg-blue-600 text-white">
                            <h2 className="text-4xl font-bold mb-6 tracking-tight">The Problem We Solve</h2>
                            <p className="text-xl text-blue-100 leading-relaxed mb-8">
                                In Liberia, finding a reliable electrician or plumber often relies on word-of-mouth that can be hit or miss. For the tradesperson, years of hard work often yield no portable resume.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white/10 p-2 rounded-lg"><Target size={20} /></div>
                                    <p className="font-medium">Eliminating the "hit-or-miss" search for help.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-white/10 p-2 rounded-lg"><Target size={20} /></div>
                                    <p className="font-medium">Digitizing reputations for verified professionals.</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <h3 className="text-3xl font-black text-gray-900">Born in Monrovia.</h3>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Vouch was founded in early 2026 by a group of engineers and local entrepreneurs who saw the friction in the informal service economy. We realized that if we could verify identities and track performance transparently, we could unlock massive economic potential.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                We're starting in Montserrado, but our vision spans all 15 counties. Every verified badge on Vouch is a step toward a more professional, accountable Liberia.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Values */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-4xl font-black text-center text-gray-900 mb-16">The Values That Drive Us</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((v, i) => (
                            <motion.div 
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bento-card p-8 group border-t-4 border-t-white hover:border-t-blue-600"
                            >
                                <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                    <v.icon size={24} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 mb-3">{v.title}</h4>
                                <p className="text-gray-500 font-medium leading-relaxed">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact */}
            <section className="py-24 bg-gray-900 text-white rounded-[3rem] mx-4 mb-12 overflow-hidden relative">
                <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay"></div>
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                        <div>
                            <h2 className="text-5xl font-black tracking-tight mb-8">Let's talk about the future.</h2>
                            <p className="text-xl text-gray-400 font-medium mb-12">
                                Whether you're a skilled professional, an employer, or interested in partnership, we'd love to hear from you.
                            </p>
                            <div className="space-y-6">
                                <a href="mailto:support@vouch.lr" className="flex items-center gap-4 text-2xl font-bold hover:text-blue-400 transition-colors">
                                    <div className="bg-white/10 p-4 rounded-2xl"><Mail /></div>
                                    support@vouch.lr
                                </a>
                                <div className="flex items-center gap-4 text-2xl font-bold">
                                    <div className="bg-white/10 p-4 rounded-2xl"><Phone /></div>
                                    +231 (0) 770 000 000
                                </div>
                                <div className="flex items-center gap-4 text-2xl font-bold">
                                    <div className="bg-white/10 p-4 rounded-2xl"><MapPin /></div>
                                    Tubman Blvd, Monrovia
                                </div>
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center justify-center">
                             <div className="text-[12rem] font-black text-white/5 select-none leading-none">VOUCH</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

