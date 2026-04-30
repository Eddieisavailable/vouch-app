import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Logo & Brand */}
                    <div className="space-y-6">
                        <Link to="/dashboard" className="text-2xl font-black text-blue-600 tracking-tight">Vouch</Link>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            The infrastructure of trust for Liberia's service economy. Connecting skilled professionals with projects that matter.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div>
                        <h4 className="text-gray-900 font-bold mb-6 truncate uppercase tracking-widest text-xs">Platform</h4>
                        <ul className="space-y-4">
                            <li><Link to="/jobs" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">Find Jobs</Link></li>
                            <li><Link to="/leaderboard" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">Top Rankings</Link></li>
                            <li><Link to="/about" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">About Us</Link></li>
                            <li><Link to="/help" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">Help Center</Link></li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="text-gray-900 font-bold mb-6 truncate uppercase tracking-widest text-xs">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link to="/terms" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">Terms of Service</Link></li>
                            <li><Link to="/privacy" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-gray-900 font-bold mb-6 truncate uppercase tracking-widest text-xs">Contact</h4>
                        <ul className="space-y-4 text-gray-500 font-medium">
                            <li className="flex items-center gap-3">
                                <MapPin size={18} className="text-blue-600" /> Monrovia, Liberia
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-blue-600" /> support@vouch.lr
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-blue-600" /> +231 000 000 000
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-400 text-sm font-medium">
                        © {new Date().getFullYear()} Vouch Liberia. Built with trust in Monrovia.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-widest">
                        Designed for <span className="text-blue-600">Impact</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
