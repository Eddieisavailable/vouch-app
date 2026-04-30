import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { UserCircle, MessageSquare } from 'lucide-react';
import api from '@/services/api';
import { FeedbackModal } from '@/components/FeedbackModal';

export const JobBids: React.FC = () => {
  const { jobId } = useParams<{jobId: string}>();
  const navigate = useNavigate();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'confirm' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchBids();
  }, [jobId]);

  const fetchBids = () => {
    setLoading(true);
    api.get(`/bids/job/${jobId}`)
      .then(res => setBids(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleAccept = (bidId: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Accept Bid?',
      message: 'This will finalize the tradesperson choice and notify them. All other pending bids for this job will be automatically rejected.',
      onConfirm: async () => {
        try {
          await api.put(`/bids/${bidId}/accept`);
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Bid Accepted!',
            message: 'You have successfully hired a tradesperson for this job. You can now start messaging them.'
          });
          fetchBids();
        } catch (err) {
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to accept the bid.'
          });
        }
      }
    });
  };

  const handleReject = (bidId: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Reject Bid?',
      message: 'Are you sure you want to reject this bid?',
      onConfirm: async () => {
        try {
          await api.put(`/bids/${bidId}/reject`);
          fetchBids();
        } catch (err) {
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to reject the bid.'
          });
        }
      }
    });
  };

  const handleMessage = async (tradespersonId: string) => {
     try {
        const res = await api.post('/conversations', { job_id: jobId, tradesperson_id: tradespersonId });
        navigate(`/messages?id=${res.data.conversation_id}`);
     } catch (err) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: 'Failed to start conversation'
        });
     }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to="/my-jobs" className="text-blue-600 hover:underline mb-2 inline-block">&larr; Back to My Jobs</Link>
        <h1 className="text-3xl font-bold text-gray-900">Review Bids</h1>
      </div>

      <div className="space-y-4">
        {bids.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-xl shadow-sm border border-gray-200">
             No bids received for this job yet.
          </div>
        ) : (
          bids.map(bid => (
            <div key={bid.bid_id} className={`bg-white p-6 rounded-xl shadow-sm border relative ${bid.status === 'accepted' ? 'border-green-400 ring-1 ring-green-400' : 'border-gray-200'}`}>
              
              {bid.status === 'accepted' && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-bl-xl rounded-tr-xl">
                  Accepted
                </div>
              )}
              {bid.status === 'rejected' && (
                <div className="absolute top-0 right-0 bg-gray-500 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-bl-xl rounded-tr-xl">
                  Rejected
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                     {bid.profile_photo_url ? (
                        <img src={bid.profile_photo_url} alt={bid.username} className="w-full h-full object-cover" />
                     ) : (
                        <div className="text-vouch-blue font-black text-xl">{bid.username[0].toUpperCase()}</div>
                     )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">
                      <Link to={`/user/${bid.tradesperson_id}`} className="hover:text-blue-600 hover:underline">{bid.username}</Link>
                    </h3>
                    {bid.company_name && <p className="text-sm text-gray-500">{bid.company_name}</p>}
                    <p className="text-xs text-gray-400">{new Date(bid.created_at).toLocaleDateString()}</p>
                    <div className="mt-3 text-gray-700 bg-gray-50 p-3 flex-1 rounded-lg italic">"{bid.cover_message}"</div>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end">
                   <div className="text-2xl font-black text-green-700">{bid.proposed_price_lrd.toLocaleString()}</div>
                   <div className="text-sm text-gray-500 mb-4">{bid.estimated_days} days estimated</div>
                   
                   {bid.status === 'pending' && (
                     <div className="flex gap-2">
                       <button onClick={() => handleReject(bid.bid_id)} className="px-4 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50 text-sm">Reject</button>
                       <button onClick={() => handleAccept(bid.bid_id)} className="px-4 py-2 bg-green-600 rounded font-medium text-white hover:bg-green-700 shadow-sm text-sm">Accept Bid</button>
                     </div>
                   )}

                   {bid.status === 'accepted' && (
                      <button onClick={() => handleMessage(bid.tradesperson_id)} className="px-4 py-2 bg-blue-600 rounded-md font-medium text-white hover:bg-blue-700 shadow-sm flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Message
                      </button>
                   )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <FeedbackModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
};
