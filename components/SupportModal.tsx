
import React, { useState, useRef, useEffect } from 'react';
import { UserData } from '../App';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  image?: string;
  timestamp: string;
  isAdmin: boolean;
}

interface SupportModalProps {
  messages: ChatMessage[];
  user: UserData | null;
  onClose: () => void;
  onSendMessage: (text: string, image?: string, target?: 'admin' | 'agent') => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ messages, user, onClose, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatTab, setChatTab] = useState<'admin' | 'agent'>('admin');

  // If user has an agent, use userAgentChat data, otherwise use global messages (admin)
  const activeMessages = chatTab === 'admin' ? messages : (user?.userAgentChat || []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, user?.userAgentChat, chatTab]);

  const handleSend = () => {
    if (!inputText.trim() && !selectedImage) return;
    onSendMessage(inputText, selectedImage || undefined, chatTab);
    setInputText('');
    setSelectedImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const hasAgent = !!user?.referredBy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      {/* Mobile Full Screen / Desktop Modal */}
      <div className="relative w-full h-full md:h-[80vh] md:max-w-lg bg-[#0a0a0a] md:rounded-[40px] border-x md:border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="bg-[#111] p-6 border-b border-gray-800 shrink-0 shadow-lg z-10">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-pink-600/20 flex items-center justify-center border border-pink-500/30">
                            <span className="material-symbols-outlined text-pink-500 text-2xl">support_agent</span>
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#111] animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">Support Center</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Online</p>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center text-white/70 hover:text-white hover:bg-gray-700 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {hasAgent && (
                <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-xl">
                    <button onClick={() => setChatTab('admin')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${chatTab === 'admin' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Admin Support</button>
                    <button onClick={() => setChatTab('agent')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${chatTab === 'agent' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>My Agent</button>
                </div>
            )}
        </div>

        {/* Chat Area */}
        <div className="flex-grow overflow-y-auto p-5 space-y-6 bg-[#0a0a0a] custom-scroll">
           {activeMessages.length === 0 && (
               <div className="flex flex-col items-center justify-center h-full text-gray-600">
                   <span className="material-symbols-outlined text-5xl mb-4 opacity-20">chat_bubble</span>
                   <p className="text-xs uppercase font-bold tracking-widest">Start a secure conversation</p>
                   {chatTab === 'agent' && <p className="text-[10px] text-blue-500 mt-2">Chat directly with your Partner</p>}
               </div>
           )}
           {activeMessages.map((msg) => (
             <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? 'items-start' : 'items-end'}`}>
                <span className="text-[9px] text-gray-500 mb-1.5 px-1 uppercase font-bold">{msg.sender}</span>
                <div className={`max-w-[85%] rounded-3xl p-4 text-base leading-relaxed shadow-md ${
                    msg.isAdmin 
                    ? 'bg-[#1a1a1a] border border-gray-800 text-gray-200 rounded-tl-none' 
                    : (chatTab === 'agent' ? 'bg-blue-600' : 'bg-pink-600') + ' text-white rounded-tr-none shadow-lg'
                }`}>
                    {msg.image && (
                        <img src={msg.image} alt="Attachment" className="w-full rounded-2xl mb-3 border border-black/20" />
                    )}
                    {msg.text && <p>{msg.text}</p>}
                </div>
                <span className="text-[9px] text-gray-600 mt-1.5 px-2">{msg.timestamp}</span>
             </div>
           ))}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#111] border-t border-gray-800 shrink-0 pb-safe">
           {selectedImage && (
               <div className="mb-3 flex items-center gap-3 bg-[#1a1a1a] p-2 pr-4 rounded-xl border border-gray-700 w-fit">
                   <img src={selectedImage} className="w-12 h-12 object-cover rounded-lg" />
                   <div className="flex-grow">
                       <p className="text-[10px] text-gray-400 font-bold uppercase">Image Attached</p>
                   </div>
                   <button onClick={() => setSelectedImage(null)} className="text-red-500 hover:text-white p-1">
                       <span className="material-symbols-outlined text-lg">delete</span>
                   </button>
               </div>
           )}
           <div className="flex items-center gap-3">
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 rounded-full bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
               >
                   <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
               </button>
               <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
               />
               <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Message ${chatTab === 'agent' ? 'Agent' : 'Support'}...`}
                  className="flex-grow bg-black border border-gray-700 rounded-2xl px-5 py-3.5 text-base text-white focus:outline-none focus:border-pink-500 transition-colors placeholder-gray-600"
               />
               <button 
                  onClick={handleSend}
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${chatTab === 'agent' ? 'from-blue-600 to-indigo-700' : 'from-pink-600 to-purple-700'} text-white flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0`}
               >
                   <span className="material-symbols-outlined text-xl">send</span>
               </button>
           </div>
        </div>

      </div>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
      `}</style>
    </div>
  );
};

export default SupportModal;
