import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Send, UserCircle, MessageSquare, Paperclip, X, Image as ImageIcon, Search, ArrowLeft, MoreVertical, ShieldCheck, Zap, Briefcase, FileText } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';

export const Messages: React.FC = () => {
  const { auth } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('id');

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
      const interval = setInterval(() => fetchMessagesIfNew(activeId), 5000);
      return () => clearInterval(interval);
    }
  }, [activeId]);

  useEffect(() => {
    const handleViewportResize = () => {
      if (window.visualViewport) {
        scrollToBottom();
      }
    };
    window.visualViewport?.addEventListener('resize', handleViewportResize);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportResize);
  }, []);

  useEffect(() => {
     if (searchQuery.length > 2) {
        const delay = setTimeout(() => {
           api.get(`/conversations/search?q=${searchQuery}`).then(res => setSearchResults(res.data));
        }, 500);
        return () => clearTimeout(delay);
     } else {
        setSearchResults([]);
     }
  }, [searchQuery]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data);
    } catch(err) { console.error(err); }
  };

  const fetchMessages = async (convoId: string) => {
    try {
      const res = await api.get(`/conversations/${convoId}/messages`);
      setMessages(res.data);
      scrollToBottom();
      setConversations(prev => prev.map(c => c.conversation_id === convoId ? {...c, unread_count: 0} : c));
    } catch(err) { console.error(err); }
  };

  const fetchMessagesIfNew = async (convoId: string) => {
      const res = await api.get(`/conversations/${convoId}/messages`);
      if (res.data.length !== messages.length) {
        setMessages(res.data);
        scrollToBottom();
      }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const activeConvo = conversations.find(c => c.conversation_id === activeId);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
      if (activeId && !isTyping) {
         setIsTyping(true);
         api.put(`/conversations/${activeId}/typing`, { is_typing: true }).catch(() => {});
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
         setIsTyping(false);
         if (activeId) api.put(`/conversations/${activeId}/typing`, { is_typing: false }).catch(() => {});
      }, 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
         const newFiles: File[] = Array.from(e.target.files);
         if (attachments.length + newFiles.length > 5) {
            return toast.error("Maximum 5 attachments per message");
         }
         const validFiles = newFiles.filter((f: File) => f.size <= 10 * 1024 * 1024);
         if (validFiles.length < newFiles.length) toast.error("Some files exceed 10MB limit");
         setAttachments(prev => [...prev, ...validFiles].slice(0, 5));
      }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || !activeId) return;

    setUploading(true);
    let attachmentUrls: string[] = [];

    try {
      for (const file of attachments) {
         const fd = new FormData();
         fd.append('image', file); // keeping key as 'image' to match backend upload route but it handles docs now
         const uploadRes = await api.post('/upload/message-attachment', fd);
         attachmentUrls.push(uploadRes.data.secure_url);
      }

      const sent = await api.post(`/conversations/messages`, {
        conversation_id: activeId,
        message_text: inputText,
        attachments: attachmentUrls
      });
      
      setMessages(prev => [...prev, sent.data]);
      setInputText('');
      setAttachments([]);
      scrollToBottom();
      setIsTyping(false);
      api.put(`/conversations/${activeId}/typing`, { is_typing: false }).catch(() => {});
    } catch(err) {
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const renderAttachments = (msgAttachments: any, isMe: boolean) => {
      let urls: string[] = [];
      if (typeof msgAttachments === 'string' && msgAttachments.length > 0) {
         try { urls = JSON.parse(msgAttachments); } catch(e) {}
      } else if (Array.isArray(msgAttachments)) {
         urls = msgAttachments;
      }
      if (!urls || urls.length === 0) return null;

      return (
         <div className={`flex flex-wrap gap-2 mt-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {urls.map((url, i) => {
               const isDoc = url.includes('/vouch/messages/') && !url.match(/\.(jpg|jpeg|png|webp|gif|avif)$|w_\d+/);
               // Note: Cloudinary URLs for raw resources often have /raw/upload/ and sometimes we don't have the extension in the URL if we didn't specify it.
               // A better check might be to see if it's an image.
               const isLikelyImage = url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|avif|heic)$/) || url.includes('w_');

               if (!isLikelyImage) {
                  return (
                     <a key={i} href={url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-3 rounded-2xl border ${isMe ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-100 text-vouch-blue'} hover:scale-105 transition-transform`}>
                        <FileText size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">View Document</span>
                     </a>
                  );
               }

               return (
                  <div key={i} className="relative cursor-pointer group" onClick={() => setLightbox(url)}>
                     <img src={url} alt="Attachment" className="w-32 h-32 object-cover rounded-2xl border border-white/20 shadow-sm transition-transform group-hover:scale-105" />
                     <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors rounded-2xl"></div>
                  </div>
               );
            })}
         </div>
      );
  };

  const isOtherParticipantTyping = activeConvo?.is_typing === true && (new Date().getTime() - new Date(activeConvo?.typing_updated_at).getTime() < 5000);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100dvh-132px)] lg:h-[calc(100vh-180px)] md:min-h-[600px] flex flex-col md:flex-row overflow-hidden lg:bento-card border-none lg:mt-2 -mt-6">
       <SEO title="Messages | Vouch Secure Communication" description="Securely chat with and hire verified tradespeople in Liberia." />

       {/* Conversation List Sidebar */}
       <div className={`w-full md:w-80 lg:w-96 flex-col bg-white border-r border-gray-100 ${activeId && !searchQuery ? 'hidden md:flex' : 'flex'} h-full shrink-0`}>
         <div className="p-4 md:p-8 space-y-4 md:space-y-6 shrink-0">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Inbox</h2>
                <div className="p-2 bg-gray-50 text-gray-400 rounded-xl">
                    <MessageSquare size={20} />
                </div>
            </div>
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-vouch-blue transition-colors" size={18} />
               <input 
                  type="text" 
                  placeholder="Filter conversations..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 h-12 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold outline-none focus:border-vouch-blue focus:bg-white transition-all placeholder:text-gray-400"
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
            <AnimatePresence mode="popLayout">
            {searchQuery ? (
               searchResults.length === 0 ? <div className="p-8 text-center text-sm text-gray-400 font-bold uppercase tracking-widest">No messages match</div> : 
               searchResults.map(res => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={res.message_id} 
                    onClick={() => { setSearchParams({ id: res.conversation_id }); setSearchQuery(''); }} 
                    className="p-5 hover:bg-gray-50 rounded-3xl cursor-pointer border border-transparent hover:border-gray-100 transition-all group"
                  >
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-vouch-blue uppercase tracking-widest">{res.sender_name}</span>
                        <span className="text-[10px] font-bold text-gray-300">{new Date(res.created_at).toLocaleDateString()}</span>
                     </div>
                     <p className="text-sm font-medium text-gray-700 line-clamp-2 italic">"{res.message_text}"</p>
                  </motion.div>
               ))
            ) : (
               conversations.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mx-auto">
                        <Zap size={32} />
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No Active Chats</p>
                </div>
               ) : 
               conversations.map(c => (
                 <a key={c.conversation_id} href={`/messages?id=${c.conversation_id}`} 
                   className={`flex items-center p-5 rounded-3xl cursor-pointer transition-all border-2 mb-1 group ${activeId === c.conversation_id ? 'bg-vouch-blue border-vouch-blue text-white shadow-xl shadow-blue-900/10' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                   <div className="relative">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 shadow-sm border-2 overflow-hidden ${activeId === c.conversation_id ? 'bg-white/10 border-white/20 text-white' : 'bg-blue-50 border-white text-vouch-blue'}`}>
                        {c.other_participant?.profile_photo_url ? (
                           <img src={c.other_participant.profile_photo_url} alt={c.other_participant.username} className="w-full h-full object-cover" />
                        ) : (
                           c.other_participant?.username[0].toUpperCase()
                        )}
                       </div>
                       {c.unread_count > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-coral rounded-full border-2 border-white shadow-lg"></div>}
                   </div>
                   
                   <div className="flex-1 min-w-0 ml-4">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`text-base font-black truncate tracking-tight ${activeId === c.conversation_id ? 'text-white' : 'text-gray-900'}`}>{c.other_participant?.username}</h3>
                        <span className={`text-[10px] font-bold ${activeId === c.conversation_id ? 'text-blue-100' : 'text-gray-400'}`}>{new Date(c.last_message_at || c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className={`text-xs font-medium truncate opacity-70 mb-1`}>
                        {c.is_typing === true && (new Date().getTime() - new Date(c.typing_updated_at).getTime() < 5000) ? 
                           <span className={activeId === c.conversation_id ? 'text-blue-100' : 'text-vouch-blue'}>Typing...</span> : 
                           (c.is_typing ? 'Drafting...' : (c.last_message_preview || "Say hello!"))
                        }
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-widest truncate ${activeId === c.conversation_id ? 'text-white/40' : 'text-gray-300 font-mono'}`}>
                         @{c.job_title}
                      </div>
                   </div>
                 </a>
               ))
            )}
            </AnimatePresence>
         </div>
       </div>

       {/* Chat Area Viewport */}
       <div className={`flex-1 flex flex-col bg-gray-50/50 relative overflow-hidden ${!activeId ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
          {!activeId ? (
            <div className="max-w-xs w-full text-center space-y-6">
              <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mx-auto text-vouch-blue">
                <MessageSquare size={48} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Professional Inbox</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">Maintain clear project records by communicating through Vouch Secure Chats.</p>
              </div>
            </div>
          ) : (
            <>
               {/* Context Header */}
               <div className="p-4 md:p-8 bg-white border-b border-gray-100 flex items-center justify-between gap-2 md:gap-4 z-20 shrink-0">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                   <Link to="/messages" className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-900"><ArrowLeft size={24} /></Link>
                   <div className="relative">
                       <div className="w-10 h-10 md:w-12 md:h-12 bg-vouch-blue rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-lg overflow-hidden shrink-0">
                           {activeConvo?.other_participant?.profile_photo_url ? (
                              <img src={activeConvo.other_participant.profile_photo_url} alt={activeConvo.other_participant.username} className="w-full h-full object-cover" />
                           ) : (
                              activeConvo?.other_participant?.username[0].toUpperCase()
                           )}
                       </div>
                       <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-success border-2 border-white rounded-full"></div>
                   </div>
                   <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={`/user/${activeConvo?.other_participant?.user_id}`} className="text-base md:text-lg font-black text-gray-900 hover:text-vouch-blue transition-colors truncate">
                            {activeConvo?.other_participant?.username}
                        </Link>
                        <ShieldCheck size={16} className="text-vouch-blue shrink-0" />
                      </div>
                      <div className="flex items-center gap-1 md:gap-2">
                        <Briefcase size={12} className="text-gray-400 shrink-0" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Project: {activeConvo?.job_title}</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                   {activeConvo?.job_id && (
                     <Link to={`/jobs/${activeConvo.job_id}`} className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-vouch-blue transition-all">
                        <FileText size={14} /> Full Spec
                     </Link>
                   )}
                   <button className="p-2 md:p-3 bg-gray-50 text-gray-400 hover:text-vouch-blue rounded-xl xl:hidden transition-colors">
                      <MoreVertical size={20} />
                   </button>
                </div>
              </div>
              
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 space-y-4 md:space-y-6 scroll-smooth">
                 {messages.map((m, idx) => {
                    const isMe = m.sender_id === auth.user?.user_id;
                    const nextIsMe = messages[idx + 1]?.sender_id === auth.user?.user_id;
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={m.message_id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-[85%] md:max-w-[70%] rounded-[2rem] p-5 shadow-2xl shadow-blue-900/5 ${isMe ? 'bg-vouch-blue text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm'}`}>
                           {m.message_text && <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">{m.message_text}</p>}
                           {renderAttachments(m.attachments, isMe)}
                           <div className={`text-[10px] mt-2 font-black tracking-widest uppercase opacity-40 ${isMe ? 'text-white' : 'text-gray-400'}`}>
                             {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </div>
                      </motion.div>
                    );
                 })}

                 {isOtherParticipantTyping && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center gap-2 bg-white/80 backdrop-blur-sm self-start px-4 py-2 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-black text-vouch-blue uppercase tracking-widest">{activeConvo?.other_participant?.username} is typing</span>
                        <span className="flex gap-1">
                            <motion.div animate={{scale:[1, 1.5, 1]}} transition={{repeat:Infinity, duration:1.5}} className="w-1 h-1 bg-vouch-blue rounded-full" />
                            <motion.div animate={{scale:[1, 1.5, 1]}} transition={{repeat:Infinity, duration:1.5, delay:0.2}} className="w-1 h-1 bg-vouch-blue rounded-full" />
                            <motion.div animate={{scale:[1, 1.5, 1]}} transition={{repeat:Infinity, duration:1.5, delay:0.4}} className="w-1 h-1 bg-vouch-blue rounded-full" />
                        </span>
                    </motion.div>
                 )}
                 <div ref={messagesEndRef} />
              </div>

              {/* Secure Input Dock */}
              <div className="p-4 md:p-8 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] relative z-10 w-full shrink-0 origin-bottom">
                <AnimatePresence>
                {attachments.length > 0 && (
                   <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex gap-4 mb-4 pb-4 border-b border-gray-50 overflow-x-auto overflow-y-hidden"
                   >
                      {attachments.map((file, idx) => {
                         const isImage = file.type.startsWith('image/');
                         return (
                            <div key={idx} className="relative flex-shrink-0">
                               {isImage ? (
                                  <img src={URL.createObjectURL(file)} alt="preview" className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-2xl border-4 border-gray-100 shadow-sm" />
                               ) : (
                                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-2xl border-4 border-gray-100 flex flex-col items-center justify-center gap-1 text-gray-400">
                                     <FileText size={24} />
                                     <span className="text-[8px] font-black uppercase text-center px-2 line-clamp-1">{file.name}</span>
                                  </div>
                               )}
                               <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-coral text-white rounded-xl p-1.5 md:p-2 shadow-xl hover:scale-110 transition-transform" type="button">
                                  <X size={14} />
                               </button>
                            </div>
                         );
                      })}
                   </motion.div>
                )}
                </AnimatePresence>

                <form onSubmit={handleSend} className="flex gap-2 md:gap-4 items-end mx-auto">
                  <input type="file" multiple accept="image/*, application/pdf, .doc, .docx, .txt" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="p-3 md:p-4 bg-gray-50 text-gray-400 hover:text-vouch-blue hover:bg-blue-50 rounded-2xl transition-all shrink-0"
                  >
                     <Paperclip size={22} />
                  </button>
                  <div className="flex-1 relative">
                    <textarea 
                        value={inputText} 
                        onChange={handleInputChange}
                        placeholder="Type a message..." 
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.25rem] md:rounded-3xl px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-medium outline-none focus:border-vouch-blue focus:bg-white transition-all ring-0 resize-none min-h-[48px] md:min-h-[56px] max-h-32"
                        rows={1}
                        onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                        }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={(!inputText.trim() && attachments.length === 0) || uploading} 
                    className="bg-vouch-blue text-white w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-2xl flex items-center justify-center hover:bg-gray-900 disabled:opacity-50 transition-all shadow-xl shadow-blue-900/10 shrink-0"
                  >
                    {uploading ? (
                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <Send size={20} className="md:w-6 md:h-6" />
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
       </div>

       {/* Conversation Details Panel */}
       {activeId && (
         <div className="hidden xl:flex flex-col w-80 bg-white border-l border-gray-100 overflow-y-auto">
            <div className="p-8 pb-6 border-b border-gray-50 flex flex-col items-center text-center">
               <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 text-4xl font-black mb-4 mx-auto relative overflow-hidden">
                  {activeConvo?.other_participant?.profile_photo_url ? (
                     <img src={activeConvo.other_participant.profile_photo_url} alt={activeConvo.other_participant.username} className="w-full h-full object-cover" />
                  ) : (
                     activeConvo?.other_participant?.username[0].toUpperCase()
                  )}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                     <div className="w-5 h-5 bg-success rounded-lg"></div>
                  </div>
               </div>
               <Link to={`/user/${activeConvo?.other_participant?.user_id}`} className="text-xl font-black tracking-tight text-gray-900 hover:text-vouch-blue transition-colors">
                  {activeConvo?.other_participant?.username}
               </Link>
               <div className="flex items-center gap-1 justify-center mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-vouch-blue" /> Verified Identity
               </div>
            </div>
            
            <div className="p-8 space-y-6 flex-1">
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Project Link</h4>
                  {activeConvo?.job_id ? (
                     <div className="p-4 bg-gray-50 rounded-2xl">
                        <div className="text-sm font-black text-gray-900 mb-2 truncate" title={activeConvo.job_title}>{activeConvo.job_title}</div>
                        <Link to={`/jobs/${activeConvo.job_id}`} className="text-[10px] uppercase font-black tracking-widest text-vouch-blue hover:underline flex items-center gap-1">
                           View Full Details <ArrowLeft size={12} className="rotate-180" />
                        </Link>
                     </div>
                  ) : (
                     <div className="text-[10px] font-medium text-gray-400">Direct Message Channel</div>
                  )}
               </div>
               
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Actions</h4>
                  <div className="space-y-2">
                     <Link to={`/user/${activeConvo?.other_participant?.user_id}`} className="w-full flex items-center gap-3 p-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-all group">
                        <UserCircle size={18} className="text-gray-400 group-hover:text-vouch-blue" /> View Profile
                     </Link>
                     <button className="w-full flex items-center text-left gap-3 p-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-all group">
                        <Search size={18} className="text-gray-400 group-hover:text-vouch-blue" /> Search Messages
                     </button>
                  </div>
               </div>
            </div>
         </div>
       )}

       {/* Gallery Overlay */}
       <AnimatePresence>
       {lightbox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-8 backdrop-blur-xl"
            onClick={() => setLightbox(null)}
          >
             <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors bg-white/10 p-3 rounded-2xl">
                 <X size={32} />
             </button>
             <motion.img 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={lightbox} 
                alt="Full preview" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
             />
          </motion.div>
       )}
       </AnimatePresence>
    </div>
  );
};
