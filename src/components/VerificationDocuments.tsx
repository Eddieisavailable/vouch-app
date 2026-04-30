import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { toast } from 'react-hot-toast';
import { Upload, FileText, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';

const DOC_TIERS = [
   { type: 'national_id', name: 'National ID / Passport', req: 'Required for Identity Verification. Scan or clear photo.' },
   { type: 'trade_certificate', name: 'Trade Certificate', req: 'Professional certification or diploma.' },
   { type: 'police_clearance', name: 'Police Clearance', req: 'Required for Trust Shield. PDF or JPG.' },
   { type: 'business_registration', name: 'Business Registration', req: 'CAC or equivalent for companies/agencies.' }
];

export const VerificationDocuments: React.FC = () => {
   const [docs, setDocs] = useState<any[]>([]);
   const [uploading, setUploading] = useState<string | null>(null);
   const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

   useEffect(() => {
      fetchDocs();
   }, []);

   const fetchDocs = async () => {
      try {
         const res = await api.get('/verification');
         setDocs(res.data);
      } catch(e) { }
   };

   const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fd = new FormData();
      fd.append('document', file);
      fd.append('document_type', type);

      setUploading(type);
      try {
         await api.post('/verification/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
         toast.success("Document uploaded successfully");
         fetchDocs();
      } catch(err: any) {
         toast.error(err.response?.data?.error || "Upload failed");
      } finally {
         setUploading(null);
      }
   };

   return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
         <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 mb-2 border-b pb-2">Verification Documents</h2>
            <p className="text-gray-500 text-sm">Upload these documents to earn higher verification badges and build trust with employers.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DOC_TIERS.map(tier => {
               // Get most recent doc for this type
               const userDoc = docs.find(d => d.document_type === tier.type);
               
               return (
                  <div key={tier.type} className="border border-gray-100 rounded-3xl p-6 bg-gray-50/30 flex flex-col h-full hover:border-blue-100 transition-all group">
                     {/* Header: Icon + Info + Badge */}
                     <div className="flex items-start justify-between gap-4 mb-auto">
                        <div className="flex gap-4">
                           <div className={`p-4 rounded-2xl flex-shrink-0 flex items-center justify-center ${userDoc?.verification_status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-white text-gray-400 shadow-sm'}`}>
                              <FileText size={24} />
                           </div>
                           <div className="min-w-0">
                              <div className="flex items-center flex-wrap gap-2 mb-1">
                                 <h3 className="font-black text-gray-900 leading-tight">{tier.name}</h3>
                                 {userDoc && (
                                    <div className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-black flex items-center gap-1
                                       ${userDoc.verification_status === 'approved' ? 'bg-green-500 text-white' : ''}
                                       ${userDoc.verification_status === 'pending' ? 'bg-yellow-400 text-white' : ''}
                                       ${userDoc.verification_status === 'rejected' ? 'bg-red-500 text-white' : ''}
                                    `}>
                                       {userDoc.verification_status === 'approved' && <CheckCircle size={10}/>}
                                       {userDoc.verification_status === 'pending' && <Clock size={10}/>}
                                       {userDoc.verification_status === 'rejected' && <XCircle size={10}/>}
                                       <span>{userDoc.verification_status}</span>
                                    </div>
                                 )}
                              </div>
                              <p className="text-[11px] text-gray-500 leading-relaxed font-medium line-clamp-2" title={tier.req}>{tier.req}</p>
                           </div>
                        </div>
                     </div>

                     {userDoc?.verification_status === 'rejected' && (
                        <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100 font-medium leading-relaxed">
                           <span className="font-black uppercase tracking-tighter">Issue: </span>{userDoc.rejection_reason}
                        </div>
                     )}

                     {/* Actions Section */}
                     <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-3">
                           {userDoc && (
                              <a href={userDoc.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white border border-gray-100 text-vouch-blue text-[10px] font-black uppercase tracking-widest hover:border-vouch-blue shadow-sm transition-all flex-shrink-0">
                                 <Eye size={14}/>
                                 <span>View</span>
                              </a>
                           )}

                           <div className="flex-1">
                              <input 
                                 type="file" 
                                 ref={el => fileInputRefs.current[tier.type] = el} 
                                 className="hidden" 
                                 accept="image/jpeg, image/png, image/webp, application/pdf, .doc, .docx" 
                                 onChange={e => handleUpload(e, tier.type)} 
                              />
                              <button 
                                 disabled={uploading === tier.type || userDoc?.verification_status === 'approved'}
                                 onClick={() => fileInputRefs.current[tier.type]?.click()}
                                 className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full flex items-center justify-center gap-2 shadow-sm
                                    ${userDoc?.verification_status === 'approved' 
                                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                                       : 'bg-vouch-blue text-white hover:bg-gray-900 active:scale-95'
                                    }
                                 `}
                              >
                                 <Upload size={14} className={uploading === tier.type ? 'animate-bounce' : ''} />
                                 {uploading === tier.type ? 'Processing...' : 
                                  (userDoc?.verification_status === 'rejected' ? 'Replace File' : 
                                  (userDoc?.verification_status === 'pending' ? 'Update File' : 'Upload File'))}
                              </button>
                           </div>
                        </div>
                        
                        <p className="text-[9px] text-gray-400 text-center font-black uppercase tracking-tighter opacity-60">
                           Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX
                        </p>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
};
