import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

export const JobTimeline: React.FC<{ status: string }> = ({ status }) => {
  const stages = [
    { key: 'open', label: 'Posted' },
    { key: 'in_progress', label: 'Bid Accepted' },
    { key: 'work_started', label: 'Work Started' },
    { key: 'awaiting_completion', label: 'Work Finished' },
    { key: 'awaiting_payment', label: 'Verified' },
    { key: 'payment_confirmed', label: 'Paid' },
    { key: 'completed', label: 'Finalized' }
  ];

  // Helper map to find index of current status
  const getStatusIndex = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending_approval': return -1;
      case 'open': return 0;
      case 'in_progress': return 1;
      case 'work_started': return 2;
      case 'awaiting_completion': return 3;
      case 'awaiting_payment': return 4;
      case 'payment_pending': return 4; // Same step as awaiting payment from timeline perspective
      case 'payment_confirmed': return 5;
      case 'completed': return 6;
      case 'cancelled': return -1;
      case 'disputed': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStatusIndex(status);

  if (currentIndex === -1) return null; // Don't show timeline for pending or cancelled/disputed fully

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between w-full relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded"></div>
        <div 
           className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 rounded transition-all duration-500" 
           style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        ></div>
        
        {stages.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-colors
                ${isCompleted ? 'border-green-500 text-green-500' : 'border-gray-300 text-gray-300'}
                ${isCurrent ? 'ring-4 ring-green-100 shadow-lg' : ''}
              `}>
                {isCompleted ? <CheckCircle size={16} className="fill-current bg-white rounded-full"/> : <div className="w-2 h-2 rounded-full bg-gray-300"/>}
              </div>
              <div className="absolute top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap text-center">
                {stage.label}
              </div>
              {/* Optional: Always show label for mobile if needed, but keeping it simple for stepper */}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 px-1">
         {stages.map((stage, idx) => (
             <span key={`text-${stage.key}`} className={`text-[10px] sm:text-xs font-medium w-16 text-center ${idx <= currentIndex ? 'text-green-800' : 'text-gray-400'}`}>
               {stage.label}
             </span>
         ))}
      </div>
    </div>
  );
};
