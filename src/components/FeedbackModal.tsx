import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'confirm' | 'error';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full mx-auto p-6 sm:p-8 text-center z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-8"
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors hidden sm:block p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-4">
              {type === 'success' && (
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              )}
              {type === 'confirm' && (
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-blue-600" />
                </div>
              )}
              {type === 'error' && (
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-8">{message}</p>

            <div className="flex flex-col gap-2">
              {type === 'confirm' ? (
                <>
                  <button
                    onClick={() => {
                      if (onConfirm) onConfirm();
                      onClose();
                    }}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                  >
                    {confirmText}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                  >
                    {cancelText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className={`w-full py-3 rounded-xl font-bold text-white transition shadow-lg ${
                    type === 'success' 
                      ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                      : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  }`}
                >
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
