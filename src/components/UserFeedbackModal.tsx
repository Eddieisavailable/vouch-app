import React, { useState } from 'react';
import { X, Send, MessageSquare, Bug, Lightbulb, AlertTriangle } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface UserFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'bug_report', name: 'Report a Bug', icon: Bug, placeholder: "Describe the bug you found... What happened? What did you expect?" },
  { id: 'feature_request', name: 'Suggest a Feature', icon: Lightbulb, placeholder: "What feature would you like to see on Vouch? How would it help you?" },
  { id: 'general_feedback', name: 'General Feedback', icon: MessageSquare, placeholder: "What's on your mind? We'd love to hear your thoughts on the app." },
  { id: 'complaint', name: 'File a Complaint', icon: AlertTriangle, placeholder: "If you've had a negative experience, please let us know so we can address it." }
];

export const UserFeedbackModal: React.FC<UserFeedbackModalProps> = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/feedback', { category, message });
      toast.success("Thank you for your feedback! We review all submissions.");
      setMessage('');
      onClose();
    } catch (err) {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCat = CATEGORIES.find(c => c.id === category);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 bg-blue-600 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare size={20} />
                Send Feedback
              </h2>
              <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">What kind of feedback do you have?</label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                        category === cat.id 
                          ? 'border-blue-600 bg-blue-50 text-blue-700' 
                          : 'border-gray-100 hover:border-gray-200 text-gray-600'
                      }`}
                    >
                      <cat.icon size={18} />
                      <span className="text-xs font-bold">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="feedback-message" className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                <textarea
                  id="feedback-message"
                  required
                  maxLength={2000}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={selectedCat?.placeholder}
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-[10px] text-gray-400 font-mono">{message.length}/2000</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-200"
              >
                {submitting ? 'Submitting...' : (
                  <>
                    <Send size={18} />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
