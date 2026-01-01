
import React, { useState, useRef, useEffect } from 'react';
import { UserData, AgentApplicationData, Transaction } from '../App';
import WithdrawModal from './WithdrawModal';

interface AgentPanelProps {
  user: UserData;
  onClose: () => void;
  onApply: (data: AgentApplicationData) => void;
  onWithdraw: (amount: number, method: string, phone: string) => void;
  onChat: (text: string) => void;
  onPinAction: (action: 'set_pin' | 'request_reset', pin?: string) => void;
  onAgentTools?: (action: 'create_promo', payload: string) => void;
  onLookupUser?: (uid: string) => UserData | undefined; 
  onDirectMessage?: (targetUid: string, text: string) => void; 
}

const AgentPanel: React.FC<AgentPanelProps> = ({ 
    user, onClose, onApply, onWithdraw, onChat, onPinAction, onAgentTools, 
    onLookupUser, onDirectMessage 
}) => {
  const [tab, setTab] = useState<'dashboard' | 'marketing' | 'users' | 'wallet' | 'chat'>('dashboard');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Login State
  const [isAgentLoggedIn, setIsAgentLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState(user.email);
  const [loginPass, setLoginPass] = useState('');
  
  // PIN States
  const [showPinSetup, setShowPinSetup] = useState(!user.withdrawalPin);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [verifyPin, setVerifyPin] = useState('');
  const [showPinVerifyModal, setShowPinVerifyModal] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<{amount: number, method: string, phone?: string} | null>(null);

  // Marketing Tools State
  const [newPromoCode, setNewPromoCode] = useState('');
  
  // Search User State
  const [searchUid, setSearchUid] = useState('');
  const [foundUser, setFoundUser] = useState<UserData | null>(null);
  const [directMsgText, setDirectMsgText] = useState('');

  // App Form
  const [appForm, setAppForm] = useState({
      firstName: '', lastName: '', phone: '', city: '', state: '', zip: '', photo: '', password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
     if(tab === 'chat' && isAgentLoggedIn) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tab, user.agentChatHistory, isAgentLoggedIn]);

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      // Optional: Add toast notification logic here
      alert("Copied to clipboard!");
  };

  const handleCreatePromo = () => {
      if(!newPromoCode.trim()) return;
      if(onAgentTools) onAgentTools('create_promo', newPromoCode);
      setNewPromoCode('');
  };

  const handleSearchUser = () => {
      if(!onLookupUser) return;
      if(!searchUid.trim()) return alert("Enter a UID");
      const result = onLookupUser(searchUid);
      if(result) {
          setFoundUser(result);
      } else {
          setFoundUser(null);
          alert("User not found!");
      }
  };

  const handleSendDirectMessage = () => {
      if(!foundUser || !directMsgText.trim() || !onDirectMessage) return;
      onDirectMessage(foundUser.uid, directMsgText);
      setDirectMsgText('');
      alert("Message Sent!");
  };

  const handleSetPin = () => {
      if (newPin.length !== 6 || confirmPin.length !== 6) return alert("PIN must be 6 digits");
      if (newPin !== confirmPin) return alert("PINs do not match");
      onPinAction('set_pin', newPin);
      setShowPinSetup(false);
  };

  const initiateWithdrawal = (amt: number, method: string, phone?: string) => {
      setPendingWithdrawal({amount: amt, method, phone});
      setShowWithdrawModal(false);
      setShowPinVerifyModal(true);
      setVerifyPin('');
  };

  const confirmWithdrawal = () => {
      if (verifyPin === user.withdrawalPin) {
          if (pendingWithdrawal) {
              onWithdraw(pendingWithdrawal.amount, pendingWithdrawal.method, pendingWithdrawal.phone || '0000');
              setShowPinVerifyModal(false);
              setPendingWithdrawal(null);
              setVerifyPin('');
              alert("Withdrawal Successful!");
          }
      } else {
          alert("Incorrect PIN");
          setVerifyPin('');
      }
  };

  const handleAgentLogin = () => {
      if(loginEmail !== user.email) return alert("Email must match your account.");
      if (user.agentApplication?.password && user.agentApplication.password !== loginPass) return alert("Invalid Agent Password");
      setIsAgentLoggedIn(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setAppForm(prev => ({...prev, photo: reader.result as string}));
          reader.readAsDataURL(file);
      }
  };

  const submitApplication = () => {
      if (!appForm.firstName || !appForm.lastName || !appForm.phone || !appForm.city || !appForm.photo || !appForm.password) {
          return alert("Please fill all required fields, including password and photo.");
      }
      
      setIsSubmitting(true);
      setTimeout(() => {
          onApply({ ...appForm, email: user.email });
          setIsSubmitting(false);
          onClose();
          alert("Application Submitted Successfully! Pending Admin Approval.");
      }, 2000);
  };

  const handleSendChat = () => {
      if (!chatInput.trim()) return;
      onChat(chatInput);
      setChatInput('');
  };

  // --- DERIVED DATA ---
  const totalReferrals = user.referredUsers?.length || 0;
  const totalCommission = user.transactions
    .filter(t => t.type === 'commission')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const withdrawalHistory = user.transactions.filter(t => t.type === 'agent_withdraw');
  const promoSignups = user.referredUsers?.filter(u => u.method === 'promo').length || 0;
  const linkSignups = user.referredUsers?.filter(u => u.method === 'link').length || 0;

  // --- STATE 1: APPLICATION ---
  if (!user.isAgent && !user.isAgentPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#000a16]/95 backdrop-blur-xl" onClick={onClose} />
        <div className="relative w-full max-w-2xl bg-[#0f172a] rounded-[32px] border border-blue-500/20 shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-300">
            
            {/* Sidebar / Banner */}
            <div className="md:w-1/3 bg-gradient-to-br from-blue-900 to-slate-900 p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Partner<br/><span className="text-blue-400">Program</span></h2>
                    <ul className="space-y-4 text-sm text-blue-100 font-medium">
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-yellow-400">monetization_on</span> 50% Lifetime RevShare</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-green-400">payments</span> Daily Payouts</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-purple-400">support_agent</span> Priority Support</li>
                    </ul>
                </div>
                <div className="relative z-10 mt-8">
                    <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Powered by Sky High</p>
                </div>
            </div>
            
            {/* Form */}
            <div className="md:w-2/3 flex flex-col h-full bg-[#0f172a]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">Agent Application</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scroll">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 font-bold uppercase">First Name</label>
                            <input type="text" value={appForm.firstName} onChange={e => setAppForm({...appForm, firstName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 font-bold uppercase">Last Name</label>
                            <input type="text" value={appForm.lastName} onChange={e => setAppForm({...appForm, lastName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500" />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] text-yellow-500 font-bold uppercase">Set Agent Password</label>
                        <input type="password" value={appForm.password} onChange={e => setAppForm({...appForm, password: e.target.value})} className="w-full bg-white/5 border border-yellow-500/30 rounded-xl p-3 text-white text-sm outline-none focus:border-yellow-500" placeholder="Required for Agent Login" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-bold uppercase">Phone Number</label>
                        <input type="tel" value={appForm.phone} onChange={e => setAppForm({...appForm, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 font-bold uppercase">City</label>
                            <input type="text" value={appForm.city} onChange={e => setAppForm({...appForm, city: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 font-bold uppercase">State</label>
                            <input type="text" value={appForm.state} onChange={e => setAppForm({...appForm, state: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 font-bold uppercase">Zip</label>
                            <input type="text" value={appForm.zip} onChange={e => setAppForm({...appForm, zip: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-400 font-bold uppercase">ID / Passport Photo</label>
                        <div onClick={() => fileInputRef.current?.click()} className="w-full h-28 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-blue-500 transition-all group">
                            {appForm.photo ? (
                                <img src={appForm.photo} className="h-full w-auto object-contain rounded-lg" />
                            ) : (
                                <div className="text-center group-hover:scale-105 transition-transform">
                                    <span className="material-symbols-outlined text-gray-500 text-3xl group-hover:text-blue-500">cloud_upload</span>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-2">Click to Upload</p>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                    </div>
                </div>

                <div className="p-6 border-t border-white/5">
                    <button onClick={submitApplication} disabled={isSubmitting} className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-sm shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Submit Application'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- PENDING STATE ---
  if (user.isAgentPending) {
     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
          <div className="relative w-full max-w-sm bg-[#0f172a] rounded-[32px] border border-white/10 p-8 text-center animate-in zoom-in-95">
              <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <span className="material-symbols-outlined text-4xl text-yellow-500">hourglass_top</span>
                  <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full border-t-yellow-500 animate-spin"></div>
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Under Review</h2>
              <p className="text-sm text-gray-400 font-medium leading-relaxed mb-8">
                  Your application is currently being reviewed by our administration team. This usually takes 1-24 hours.
              </p>
              <button onClick={onClose} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all">Close</button>
          </div>
        </div>
     );
  }

  // --- LOGIN ---
  if (user.isAgent && !isAgentLoggedIn) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-[#0f172a] rounded-[40px] border border-white/10 p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-900/50 rotate-3">
                        <span className="material-symbols-outlined text-3xl text-white">admin_panel_settings</span>
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Agent Portal</h2>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.3em]">Authorized Access Only</p>
                </div>
                <div className="space-y-4">
                    <div className="bg-black/40 rounded-2xl p-1 border border-white/10 flex items-center">
                        <span className="material-symbols-outlined text-gray-500 ml-3">person</span>
                        <input type="email" value={loginEmail} disabled className="w-full bg-transparent p-3 text-gray-400 text-sm font-bold outline-none" />
                    </div>
                    <div className="bg-black/40 rounded-2xl p-1 border border-white/10 flex items-center focus-within:border-blue-500 transition-colors">
                        <span className="material-symbols-outlined text-gray-500 ml-3">lock</span>
                        <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full bg-transparent p-3 text-white text-sm font-bold outline-none placeholder-gray-600" placeholder="Agent Password" />
                    </div>
                    <button onClick={handleAgentLogin} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-black uppercase text-xs shadow-xl shadow-blue-900/30 mt-2 transition-all active:scale-95">Access Dashboard</button>
                </div>
            </div>
        </div>
      );
  }

  // --- PIN SETUP ---
  if (showPinSetup && !user.isPinResetPending) {
      return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
              <div className="w-full max-w-sm bg-[#0f172a] border border-white/10 p-8 rounded-[32px] text-center space-y-6 animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/20">
                      <span className="material-symbols-outlined text-3xl">lock_clock</span>
                  </div>
                  <div>
                      <h3 className="text-white font-black text-xl uppercase">Secure Your Wallet</h3>
                      <p className="text-gray-400 text-xs mt-2">Set a 6-digit PIN for withdrawals.</p>
                  </div>
                  <div className="space-y-3">
                      <input type="tel" maxLength={6} placeholder="Enter 6-digit PIN" value={newPin} onChange={e => setNewPin(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-center text-xl font-black tracking-[0.5em] focus:border-red-500 outline-none transition-colors" />
                      <input type="tel" maxLength={6} placeholder="Confirm PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-center text-xl font-black tracking-[0.5em] focus:border-red-500 outline-none transition-colors" />
                  </div>
                  <button onClick={handleSetPin} className="w-full bg-red-600 py-4 rounded-xl text-white font-black uppercase tracking-wider shadow-lg hover:bg-red-500 transition-all">Save & Continue</button>
              </div>
          </div>
      );
  }

  // --- MAIN DASHBOARD LAYOUT ---
  return (
    <div className="fixed inset-0 z-50 bg-[#020617] text-white flex flex-col md:flex-row font-sans overflow-hidden">
         
         {/* Desktop Sidebar */}
         <div className="hidden md:flex w-72 bg-[#0f172a] border-r border-white/5 flex-col p-6 shadow-2xl relative z-20">
             <div className="mb-10 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                     <span className="material-symbols-outlined text-white">verified_user</span>
                 </div>
                 <div>
                     <h2 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">Agent<br/><span className="text-blue-500">Portal</span></h2>
                 </div>
             </div>
             
             <div className="mb-6 bg-black/20 p-4 rounded-2xl border border-white/5">
                 <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Your Agent ID</p>
                 <div className="flex justify-between items-center cursor-pointer group" onClick={() => copyToClipboard(user.referralCode || '')}>
                     <p className="text-xl font-mono font-black text-white tracking-widest group-hover:text-blue-400 transition-colors">{user.referralCode}</p>
                     <span className="material-symbols-outlined text-gray-600 text-sm group-hover:text-white transition-colors">content_copy</span>
                 </div>
             </div>

             <nav className="space-y-2 flex-grow">
                 {[
                     {id: 'dashboard', icon: 'dashboard', label: 'Overview'},
                     {id: 'marketing', icon: 'campaign', label: 'Marketing'},
                     {id: 'users', icon: 'group', label: 'My Users'},
                     {id: 'wallet', icon: 'account_balance_wallet', label: 'Wallet'},
                     {id: 'chat', icon: 'chat', label: 'Support'}
                 ].map((t) => (
                     <button 
                        key={t.id} 
                        onClick={() => setTab(t.id as any)} 
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase transition-all duration-300 ${tab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                     >
                         <span className="material-symbols-outlined text-lg">{t.icon}</span> {t.label}
                     </button>
                 ))}
             </nav>
             
             <button onClick={onClose} className="mt-auto w-full py-3 bg-red-900/10 hover:bg-red-900/20 border border-red-900/30 rounded-xl text-red-400 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all">
                 <span className="material-symbols-outlined text-sm">logout</span> Exit Panel
             </button>
         </div>

         {/* Mobile Bottom Nav */}
         <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/90 backdrop-blur-lg border-t border-white/10 px-6 py-2 flex justify-between z-50 pb-safe">
             {[
                 {id: 'dashboard', icon: 'dashboard'},
                 {id: 'marketing', icon: 'campaign'},
                 {id: 'wallet', icon: 'account_balance_wallet', special: true},
                 {id: 'users', icon: 'group'},
                 {id: 'chat', icon: 'chat'}
             ].map(t => (
                 <button 
                    key={t.id} 
                    onClick={() => setTab(t.id as any)} 
                    className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${tab === t.id ? (t.special ? 'bg-blue-500 text-white -translate-y-4 shadow-lg shadow-blue-500/40' : 'text-blue-400') : 'text-gray-500'}`}
                 >
                     <span className="material-symbols-outlined text-2xl">{t.icon}</span>
                 </button>
             ))}
         </div>

         {/* Content Area */}
         <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#020617] relative">
             
             {/* Mobile Header */}
             <div className="md:hidden p-4 flex justify-between items-center bg-[#0f172a] border-b border-white/5">
                 <div>
                     <h2 className="text-lg font-black text-white italic tracking-tighter">AGENT<span className="text-blue-500">HUB</span></h2>
                     <p className="text-[9px] text-gray-400 font-mono">ID: {user.referralCode}</p>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={() => setTab('chat')} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white"><span className="material-symbols-outlined text-sm">chat</span></button>
                     <button onClick={onClose} className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500"><span className="material-symbols-outlined text-sm">power_settings_new</span></button>
                 </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 custom-scroll">
                 
                 {/* DASHBOARD TAB */}
                 {tab === 'dashboard' && (
                     <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                         {/* Stats Grid */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {/* Balance Card */}
                             <div className="md:col-span-2 bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-[32px] border border-blue-500/30 relative overflow-hidden shadow-2xl">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>
                                 <div className="relative z-10 flex flex-col h-full justify-between">
                                     <div className="flex justify-between items-start">
                                         <div>
                                             <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">Commission Balance</p>
                                             <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">৳ {(user.agentBalance || 0).toLocaleString()}</h3>
                                         </div>
                                         <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                                             <span className="material-symbols-outlined text-white">account_balance</span>
                                         </div>
                                     </div>
                                     <div className="mt-6 flex gap-3">
                                         <button onClick={() => setShowWithdrawModal(true)} className="px-6 py-2.5 bg-white text-blue-900 rounded-xl font-black uppercase text-xs hover:bg-blue-50 transition-all shadow-lg active:scale-95">Withdraw Now</button>
                                         <button onClick={() => setTab('marketing')} className="px-6 py-2.5 bg-blue-800/50 text-white border border-blue-400/30 rounded-xl font-bold uppercase text-xs hover:bg-blue-800/70 transition-all">Promote</button>
                                     </div>
                                 </div>
                             </div>

                             {/* Stat Card Small */}
                             <div className="bg-[#0f172a] p-6 rounded-[32px] border border-white/5 flex flex-col justify-center shadow-lg">
                                 <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-xl flex items-center justify-center mb-3">
                                     <span className="material-symbols-outlined">groups</span>
                                 </div>
                                 <p className="text-gray-400 text-xs font-bold uppercase">Total Referrals</p>
                                 <p className="text-3xl font-black text-white">{totalReferrals}</p>
                                 <div className="mt-2 text-[10px] text-gray-500 flex gap-2">
                                     <span className="text-green-400 font-bold">+{promoSignups} Promo</span>
                                     <span>|</span>
                                     <span className="text-blue-400 font-bold">+{linkSignups} Link</span>
                                 </div>
                             </div>
                         </div>

                         {/* Charts / Graphs Area */}
                         <div className="bg-[#0f172a] p-6 rounded-[32px] border border-white/5 shadow-lg">
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-white font-bold text-sm uppercase">Earnings Overview</h3>
                                 <select className="bg-black/30 border border-white/10 text-white text-xs rounded-lg px-2 py-1 outline-none">
                                     <option>This Week</option>
                                     <option>This Month</option>
                                 </select>
                             </div>
                             {/* CSS Bar Chart Simulation */}
                             <div className="h-40 flex items-end justify-between gap-2">
                                 {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                                     <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                         <div className="w-full bg-blue-900/30 rounded-t-lg relative overflow-hidden transition-all group-hover:bg-blue-800/40" style={{height: `${h}%`}}>
                                             <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
                                         </div>
                                         <span className="text-[9px] text-gray-500 font-mono uppercase">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</span>
                                     </div>
                                 ))}
                             </div>
                         </div>

                         {/* Quick Links */}
                         <div className="grid grid-cols-2 gap-4">
                             <button onClick={() => setTab('users')} className="bg-[#0f172a] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all text-left group">
                                 <span className="material-symbols-outlined text-purple-500 mb-2 group-hover:scale-110 transition-transform">person_search</span>
                                 <p className="text-white font-bold text-xs uppercase">Lookup User</p>
                                 <p className="text-[9px] text-gray-500">Check stats & message</p>
                             </button>
                             <button onClick={() => setTab('wallet')} className="bg-[#0f172a] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all text-left group">
                                 <span className="material-symbols-outlined text-yellow-500 mb-2 group-hover:scale-110 transition-transform">history</span>
                                 <p className="text-white font-bold text-xs uppercase">Transactions</p>
                                 <p className="text-[9px] text-gray-500">View payout history</p>
                             </button>
                         </div>
                     </div>
                 )}

                 {/* MARKETING TAB */}
                 {tab === 'marketing' && (
                     <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                         
                         {/* Referral Link Card */}
                         <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-6 rounded-[32px] border border-purple-500/30">
                             <h3 className="text-white font-bold text-sm uppercase mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-purple-400">link</span> Default Referral Link</h3>
                             <div className="bg-black/40 p-1.5 rounded-xl flex items-center border border-white/10">
                                 <input type="text" readOnly value={`${window.location.origin}?ref=${user.referralCode}`} className="flex-grow bg-transparent px-3 text-xs text-gray-300 font-mono outline-none truncate" />
                                 <button onClick={() => copyToClipboard(`${window.location.origin}?ref=${user.referralCode}`)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all">Copy</button>
                             </div>
                             <p className="text-[9px] text-purple-300 mt-2 font-medium ml-1">Share this link to earn 50% commission on every deposit.</p>
                         </div>

                         {/* Promo Codes */}
                         <div className="bg-[#0f172a] p-6 rounded-[32px] border border-white/5">
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-white font-bold text-sm uppercase">My Promo Codes</h3>
                                 <button onClick={() => document.getElementById('new-promo-input')?.focus()} className="text-blue-500 text-xs font-bold uppercase hover:text-blue-400">+ New Code</button>
                             </div>

                             <div className="space-y-3">
                                 {user.promoCodes?.map((code, i) => (
                                     <div key={i} className="bg-black/30 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all">
                                         <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-white font-bold text-sm">#{i+1}</div>
                                             <div>
                                                 <p className="text-white font-black font-mono text-sm tracking-wider">{code}</p>
                                                 <p className="text-[9px] text-gray-500 uppercase font-bold">Active • 50% Bonus Offer</p>
                                             </div>
                                         </div>
                                         <button onClick={() => copyToClipboard(code)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                             <span className="material-symbols-outlined text-sm">content_copy</span>
                                         </button>
                                     </div>
                                 ))}
                                 {!user.promoCodes?.length && <p className="text-center text-gray-600 text-xs py-4">No custom codes yet.</p>}
                             </div>

                             <div className="mt-6 pt-6 border-t border-white/5">
                                 <label className="text-[9px] text-gray-500 font-bold uppercase mb-2 block">Create Custom Code</label>
                                 <div className="flex gap-2">
                                     <input id="new-promo-input" type="text" value={newPromoCode} onChange={e => setNewPromoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="e.g. WINBIG2025" className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 text-white text-sm font-bold uppercase tracking-widest outline-none focus:border-blue-500 transition-colors" />
                                     <button onClick={handleCreatePromo} className="px-6 bg-white text-black rounded-xl font-black uppercase text-xs hover:bg-gray-200 transition-colors">Create</button>
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}

                 {/* USERS TAB */}
                 {tab === 'users' && (
                     <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                         
                         {/* User Search */}
                         <div className="bg-[#0f172a] p-6 rounded-[32px] border border-white/5">
                             <h3 className="text-white font-bold text-sm uppercase mb-4">Find Player</h3>
                             <div className="flex gap-2">
                                 <div className="flex-grow bg-black/40 border border-white/10 rounded-xl flex items-center px-3 focus-within:border-blue-500 transition-colors">
                                     <span className="material-symbols-outlined text-gray-500">search</span>
                                     <input type="text" value={searchUid} onChange={e => setSearchUid(e.target.value)} placeholder="Enter Player UID" className="w-full bg-transparent p-3 text-white text-sm outline-none" />
                                 </div>
                                 <button onClick={handleSearchUser} className="bg-blue-600 px-6 rounded-xl text-white font-bold uppercase text-xs">Search</button>
                             </div>

                             {foundUser && (
                                 <div className="mt-4 bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl animate-in slide-in-from-top-2">
                                     <div className="flex items-start justify-between mb-4">
                                         <div className="flex items-center gap-3">
                                             <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                                                 {foundUser.name.charAt(0)}
                                             </div>
                                             <div>
                                                 <p className="text-white font-bold">{foundUser.name}</p>
                                                 <p className="text-xs text-blue-300 font-mono">UID: {foundUser.uid}</p>
                                                 <p className="text-[9px] text-gray-400 mt-0.5">{foundUser.email}</p>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <p className="text-[9px] text-gray-500 font-bold uppercase">Balance</p>
                                             <p className="text-lg font-black text-green-400">৳{foundUser.balance.toLocaleString()}</p>
                                         </div>
                                     </div>
                                     
                                     <div className="bg-black/40 p-1.5 rounded-xl flex gap-2">
                                         <input type="text" value={directMsgText} onChange={e => setDirectMsgText(e.target.value)} placeholder="Send private message..." className="flex-grow bg-transparent px-3 text-xs text-white outline-none" />
                                         <button onClick={handleSendDirectMessage} className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg font-bold uppercase text-[10px] transition-all">Send</button>
                                     </div>
                                 </div>
                             )}
                         </div>

                         {/* Recent Signups List */}
                         <div>
                             <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-2">Recent Referrals</h3>
                             <div className="space-y-2">
                                 {user.referredUsers && user.referredUsers.length > 0 ? (
                                     [...user.referredUsers].reverse().map((u, i) => (
                                         <div key={i} className="bg-[#0f172a] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                                             <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-xs group-hover:bg-gray-700 group-hover:text-white transition-colors">
                                                     {u.email.charAt(0).toUpperCase()}
                                                 </div>
                                                 <div>
                                                     <p className="text-white font-bold text-xs">{u.email}</p>
                                                     <p className="text-[9px] text-gray-500 font-mono">UID: {u.uid}</p>
                                                 </div>
                                             </div>
                                             <div className="text-right">
                                                 <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${u.method === 'promo' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                     {u.method}
                                                 </span>
                                                 <p className="text-[9px] text-gray-600 mt-1">{u.date}</p>
                                             </div>
                                         </div>
                                     ))
                                 ) : (
                                     <div className="text-center py-10 bg-[#0f172a] rounded-[32px] border border-white/5">
                                         <span className="material-symbols-outlined text-gray-600 text-4xl mb-2">person_off</span>
                                         <p className="text-gray-500 text-xs font-bold uppercase">No referrals yet</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                 )}

                 {/* WALLET TAB */}
                 {tab === 'wallet' && (
                     <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                         
                         {/* Card Visual */}
                         <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 opacity-20"><span className="material-symbols-outlined text-8xl text-white">credit_card</span></div>
                             <div className="relative z-10">
                                 <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Available Balance</p>
                                 <h2 className="text-5xl font-black text-white mb-8 tracking-tighter">৳ {(user.agentBalance || 0).toLocaleString()}</h2>
                                 
                                 <div className="flex gap-4">
                                     <button onClick={() => setShowWithdrawModal(true)} className="flex-1 bg-white text-black py-3 rounded-xl font-black uppercase text-xs hover:bg-gray-200 transition-colors shadow-lg">Withdraw Funds</button>
                                     <button onClick={() => setShowPinSetup(true)} className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                         <span className="material-symbols-outlined text-sm">lock</span>
                                     </button>
                                 </div>
                             </div>
                         </div>

                         {/* Stats Row */}
                         <div className="grid grid-cols-2 gap-4">
                             <div className="bg-[#0f172a] p-4 rounded-2xl border border-white/5">
                                 <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Total Earned</p>
                                 <p className="text-xl font-black text-green-500">৳ {totalCommission.toLocaleString()}</p>
                             </div>
                             <div className="bg-[#0f172a] p-4 rounded-2xl border border-white/5">
                                 <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Pending Payout</p>
                                 <p className="text-xl font-black text-yellow-500">৳ {user.transactions.filter(t => t.type === 'agent_withdraw' && t.status === 'pending').reduce((a,b)=>a+b.amount,0).toLocaleString()}</p>
                             </div>
                         </div>

                         {/* History List */}
                         <div>
                             <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-2">Recent Payouts</h3>
                             <div className="space-y-2">
                                 {withdrawalHistory.length > 0 ? (
                                     withdrawalHistory.map((t, i) => (
                                         <div key={i} className="bg-[#0f172a] p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                                             <div className="flex items-center gap-3">
                                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.status === 'success' ? 'bg-green-500/10 text-green-500' : t.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                                                     <span className="material-symbols-outlined text-lg">{t.status === 'success' ? 'check' : t.status === 'pending' ? 'schedule' : 'close'}</span>
                                                 </div>
                                                 <div>
                                                     <p className="text-white font-bold text-xs uppercase">{t.method}</p>
                                                     <p className="text-[9px] text-gray-500 font-mono">{t.date}</p>
                                                 </div>
                                             </div>
                                             <div className="text-right">
                                                 <p className="text-white font-black text-sm">৳{t.amount.toLocaleString()}</p>
                                                 <p className={`text-[8px] font-bold uppercase ${t.status === 'success' ? 'text-green-500' : t.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>{t.status}</p>
                                             </div>
                                         </div>
                                     ))
                                 ) : (
                                     <p className="text-center text-gray-600 text-xs py-6">No withdrawal history found.</p>
                                 )}
                             </div>
                         </div>
                     </div>
                 )}

                 {/* CHAT TAB */}
                 {tab === 'chat' && (
                     <div className="flex flex-col h-full bg-[#0f172a] rounded-[32px] border border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                         <div className="p-4 border-b border-white/5 bg-black/20 flex items-center gap-3">
                             <div className="relative">
                                 <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-white shadow-lg">
                                     <span className="material-symbols-outlined">support_agent</span>
                                 </div>
                                 <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f172a]"></div>
                             </div>
                             <div>
                                 <h3 className="text-white font-bold text-sm">Agent Support</h3>
                                 <p className="text-[9px] text-green-400 font-bold uppercase tracking-wider">Online • Priority</p>
                             </div>
                         </div>
                         
                         <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scroll bg-[#0a0a0a]">
                             {(!user.agentChatHistory || user.agentChatHistory.length === 0) && (
                                 <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-2">
                                     <span className="material-symbols-outlined text-4xl opacity-20">forum</span>
                                     <p className="text-xs uppercase font-bold tracking-widest">Start a conversation</p>
                                 </div>
                             )}
                             {user.agentChatHistory?.map((msg, i) => (
                                 <div key={i} className={`flex flex-col ${msg.sender === 'Agent' ? 'items-end' : 'items-start'}`}>
                                     <span className="text-[8px] text-gray-600 mb-1 px-2 uppercase font-bold">{msg.sender === 'Agent' ? 'You' : 'Admin'}</span>
                                     <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-md leading-relaxed ${msg.sender === 'Agent' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[#1e293b] text-gray-200 border border-white/5 rounded-tl-none'}`}>
                                         {msg.text}
                                     </div>
                                     <span className="text-[8px] text-gray-600 mt-1 px-2">{msg.timestamp}</span>
                                 </div>
                             ))}
                             <div ref={chatEndRef}></div>
                         </div>

                         <div className="p-4 bg-black/20 border-t border-white/5 flex gap-2">
                             <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="Type a message..." className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
                             <button onClick={handleSendChat} className="w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all">
                                 <span className="material-symbols-outlined text-xl">send</span>
                             </button>
                         </div>
                     </div>
                 )}

             </div>
         </div>

         {/* PIN VERIFICATION MODAL */}
         {showPinVerifyModal && (
             <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                 <div className="w-full max-w-sm bg-[#0f172a] border border-white/10 p-8 rounded-[32px] text-center space-y-6 animate-in zoom-in-95">
                     <span className="material-symbols-outlined text-4xl text-blue-500 mb-2">shield</span>
                     <h3 className="text-white font-black text-xl uppercase">Authorize Payout</h3>
                     <p className="text-gray-400 text-xs">Enter your 6-digit PIN to confirm.</p>
                     <input type="tel" maxLength={6} value={verifyPin} onChange={e => setVerifyPin(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white text-center text-3xl font-black tracking-[0.5em] focus:border-blue-500 outline-none transition-colors" />
                     <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => setShowPinVerifyModal(false)} className="py-3 rounded-xl border border-white/10 text-gray-400 font-bold uppercase text-xs hover:bg-white/5">Cancel</button>
                         <button onClick={confirmWithdrawal} className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs shadow-lg">Confirm</button>
                     </div>
                 </div>
             </div>
         )}

         {showWithdrawModal && <WithdrawModal balance={user.agentBalance || 0} onClose={() => setShowWithdrawModal(false)} onSuccess={(amt, method, phone) => { initiateWithdrawal(amt, method, phone); }} />}
         
         <style>{`
            .custom-scroll::-webkit-scrollbar { width: 4px; }
            .custom-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
            .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
         `}</style>
    </div>
  );
};

export default AgentPanel;
