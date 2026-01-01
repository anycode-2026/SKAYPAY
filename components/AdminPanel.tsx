
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, AdminSettings, UserData, ExternalGame } from '../App';
import { ChatMessage } from './SupportModal';

interface AdminPanelProps {
  transactions: Transaction[];
  settings: AdminSettings;
  onClose: () => void;
  onAction: (txId: string, action: 'approve' | 'reject') => void;
  onUpdateSettings: (newSettings: AdminSettings) => void;
  queueVoice: (text: string) => void;
  supportMessages: ChatMessage[];
  onAdminReply: (text: string) => void;
  onManageUsers: (action: string, payload: any) => void;
  onAdminAgentReply: (agentEmail: string, text: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  settings, 
  onClose, 
  onAction, 
  onUpdateSettings, 
  onManageUsers,
  supportMessages,
  onAdminReply,
  onAdminAgentReply
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'agents' | 'finance' | 'games' | 'chat' | 'settings'>('dashboard');
  
  // Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Data State
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<{tx: Transaction, user: UserData}[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null); // Track which user card is open
  const [fundInput, setFundInput] = useState(''); 

  // Transaction Detail View State
  const [viewingTransaction, setViewingTransaction] = useState<{tx: Transaction, user: UserData} | null>(null);

  // Agent Management State
  const [selectedAgentChat, setSelectedAgentChat] = useState<UserData | null>(null);
  const [agentReplyText, setAgentReplyText] = useState('');
  const [viewingApplication, setViewingApplication] = useState<UserData | null>(null);
  
  // Game Management State
  const [editingGame, setEditingGame] = useState<ExternalGame | null>(null);
  const [gameForm, setGameForm] = useState({
      title: '',
      url: '',
      provider: 'JILI',
      image: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null); // New Ref for HTML Upload

  // Settings State
  const [tempSettings, setTempSettings] = useState<AdminSettings>(settings);
  const [crashInput, setCrashInput] = useState('');

  // Chat State
  const [replyText, setReplyText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const agentChatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTempSettings(settings); }, [settings]);

  // Scroll chat to bottom
  useEffect(() => {
      if(activeTab === 'chat') {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      if(selectedAgentChat) {
          agentChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [activeTab, supportMessages, selectedAgentChat, allUsers]);

  const refreshData = () => {
    const db = localStorage.getItem('skyhigh_users_db');
    if (db) {
        const parsedDb: Record<string, UserData> = JSON.parse(db);
        let usersArray = Object.values(parsedDb);
        
        // Sorting: Pinned First, then High Balance
        usersArray.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.balance - a.balance;
        });

        setAllUsers(usersArray);
        
        // Update selected agent for chat if open
        if (selectedAgentChat) {
            const updatedAgent = usersArray.find(u => u.email === selectedAgentChat.email);
            if(updatedAgent) setSelectedAgentChat(updatedAgent);
        }

        const pending: {tx: Transaction, user: UserData}[] = [];
        usersArray.forEach(user => {
            user.transactions.forEach(tx => {
                if (tx.status === 'pending') pending.push({ tx, user });
            });
        });
        setPendingTransactions(pending);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'skaypay' && password === 'Skaypay@12') {
        setIsAuthenticated(true);
    } else {
        alert('Access Denied');
    }
  };

  // --- AGENT FUNCTIONS WRAPPER ---
  // Helper to ensure updates trigger UI refresh immediately
  const manageAgent = (action: string, payload: any) => {
      onManageUsers(action, payload);
      setTimeout(refreshData, 200); // Quick refresh after action
  };

  const handleAgentChatSend = () => {
      if(!selectedAgentChat || !agentReplyText.trim()) return;
      onAdminAgentReply(selectedAgentChat.email, agentReplyText);
      setAgentReplyText('');
  };

  // --- GAME MANAGEMENT FUNCTIONS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setGameForm(prev => ({ ...prev, image: reader.result as string }));
          reader.readAsDataURL(file);
      }
  };

  // NEW: HTML File Upload Handler
  const handleHtmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          // Basic check for HTML
          if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
              return alert("Please select a valid .html file (e.g., index.html)");
          }

          const reader = new FileReader();
          reader.onloadend = () => {
              // Set the Data URL as the Game URL
              setGameForm(prev => ({ ...prev, url: reader.result as string }));
              alert(`File "${file.name}" loaded successfully! You can now save.`);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveGame = () => {
      if(!gameForm.title || !gameForm.url || !gameForm.image) return alert("Fill all fields or upload required files!");
      
      let updatedGames = [...(settings.externalGames || [])];
      
      if (editingGame) {
          updatedGames = updatedGames.map(g => g.id === editingGame.id ? { ...g, ...gameForm } : g);
          setEditingGame(null);
          alert("Game Updated!");
      } else {
          const newGame: ExternalGame = {
              id: `ext_${Date.now()}`,
              ...gameForm
          };
          updatedGames.unshift(newGame);
          alert("Game Added Successfully!");
      }
      onUpdateSettings({ ...settings, externalGames: updatedGames });
      setGameForm({ title: '', url: '', provider: 'JILI', image: '' });
  };

  const handleEditGame = (game: ExternalGame) => {
      setEditingGame(game);
      setGameForm({ title: game.title, url: game.url, provider: game.provider, image: game.image });
      document.getElementById('game-form-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteGame = (id: string) => {
      if(confirm("Delete this game?")) {
          const updated = (settings.externalGames || []).filter(g => g.id !== id);
          onUpdateSettings({ ...settings, externalGames: updated });
      }
  };

  const handleCancelEdit = () => {
      setEditingGame(null);
      setGameForm({ title: '', url: '', provider: 'JILI', image: '' });
  };

  const handleSendReply = () => {
      if(!replyText.trim()) return;
      onAdminReply(replyText);
      setReplyText('');
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000] p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
              <span className="material-symbols-outlined text-6xl text-red-600 mb-4 animate-pulse">admin_panel_settings</span>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Sky<span className="text-red-600">Admin</span></h2>
              <p className="text-gray-500 text-xs tracking-[0.3em] font-bold mt-1">SECURE ACCESS</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="bg-[#111] rounded-2xl border border-gray-800 p-1 flex items-center">
                <span className="material-symbols-outlined text-gray-500 ml-3">person</span>
                <input type="text" placeholder="Admin ID" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-transparent p-4 text-white outline-none font-bold placeholder-gray-600" />
            </div>
            <div className="bg-[#111] rounded-2xl border border-gray-800 p-1 flex items-center">
                <span className="material-symbols-outlined text-gray-500 ml-3">key</span>
                <input type="password" placeholder="Passkey" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent p-4 text-white outline-none font-bold placeholder-gray-600" />
            </div>
            <button type="submit" className="w-full bg-red-600 py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg shadow-red-900/40 active:scale-95 transition-all">Unlock Panel</button>
          </form>
        </div>
      </div>
    );
  }

  const pendingAgents = allUsers.filter(u => u.isAgentPending);
  const activeAgents = allUsers.filter(u => u.isAgent);

  const paymentFields = [
      { key: 'bkashNumber', label: 'Bkash Number', icon: 'account_balance_wallet', color: 'text-pink-500' },
      { key: 'nagadNumber', label: 'Nagad Number', icon: 'account_balance_wallet', color: 'text-orange-500' },
      { key: 'rocketNumber', label: 'Rocket Number', icon: 'account_balance_wallet', color: 'text-purple-500' },
      { key: 'upayNumber', label: 'Upay Number', icon: 'account_balance_wallet', color: 'text-blue-500' },
      { key: 'usdtAddress', label: 'USDT (TRC20)', icon: 'currency_bitcoin', color: 'text-green-500' },
      { key: 'btcAddress', label: 'Bitcoin (BTC)', icon: 'currency_bitcoin', color: 'text-yellow-500' }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] text-white flex flex-col font-sans">
        
        {/* Header */}
        <div className="h-16 bg-[#111] border-b border-gray-800 flex items-center justify-between px-4 shrink-0 shadow-md">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h2 className="font-black text-lg italic tracking-tighter">ADMIN<span className="text-red-600">PANEL</span></h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-600 transition-all">
                <span className="material-symbols-outlined text-lg">power_settings_new</span>
            </button>
        </div>

        {/* Scrollable Navigation Tabs */}
        <div className="bg-[#0a0a0a] border-b border-gray-800">
            <div className="flex overflow-x-auto no-scrollbar py-2 px-2 gap-2">
                {[
                    { id: 'dashboard', icon: 'dashboard', label: 'Dash' },
                    { id: 'users', icon: 'group', label: 'Users' },
                    { id: 'agents', icon: 'badge', label: 'Agents', badge: pendingAgents.length },
                    { id: 'games', icon: 'sports_esports', label: 'Games' },
                    { id: 'finance', icon: 'payments', label: 'Money', badge: pendingTransactions.length },
                    { id: 'chat', icon: 'chat', label: 'Chat' },
                    { id: 'settings', icon: 'settings', label: 'Config' }
                ].map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => { setActiveTab(item.id as any); setSelectedAgentChat(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-all border ${
                            activeTab === item.id 
                            ? 'bg-red-600 border-red-500 text-white shadow-lg' 
                            : 'bg-[#111] border-gray-800 text-gray-400'
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">{item.icon}</span>
                        {item.label}
                        {item.badge ? <span className="ml-1 bg-white text-red-600 px-1.5 rounded-full text-[9px] font-black">{item.badge}</span> : null}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-black relative pb-20 custom-scroll">
            
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#111] p-4 rounded-2xl border border-gray-800">
                            <span className="material-symbols-outlined text-blue-500 text-2xl mb-2">groups</span>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Total Users</p>
                            <p className="text-2xl font-black text-white">{allUsers.length}</p>
                        </div>
                        <div className="bg-[#111] p-4 rounded-2xl border border-gray-800">
                            <span className="material-symbols-outlined text-green-500 text-2xl mb-2">account_balance</span>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">User Balance</p>
                            <p className="text-2xl font-black text-white truncate">৳{allUsers.reduce((a,b)=>a+b.balance,0).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Quick Rig */}
                    <div className="bg-red-900/10 p-5 rounded-3xl border border-red-900/30">
                        <h3 className="text-red-500 font-black uppercase text-sm mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined">rocket_launch</span> Aviator Rig
                        </h3>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                step="0.1" 
                                placeholder="Crash x" 
                                value={crashInput}
                                onChange={e => setCrashInput(e.target.value)}
                                className="flex-grow bg-black border border-gray-700 rounded-xl px-4 py-3 text-white font-bold text-center outline-none focus:border-red-500"
                            />
                            <button 
                                onClick={() => { 
                                    const val = parseFloat(crashInput); 
                                    if(val > 1) { 
                                        onUpdateSettings({...settings, forcedCrashPoint: val}); 
                                        alert("Crash Set!"); 
                                        setCrashInput('');
                                    }
                                }}
                                className="bg-red-600 px-6 rounded-xl font-black text-white uppercase text-xs shadow-lg"
                            >
                                SET
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* USERS MANAGEMENT */}
            {activeTab === 'users' && (
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className="text-gray-500 text-xs font-bold uppercase">All Registered Users ({allUsers.length})</h3>
                        <span className="text-[9px] text-gray-600">Tap to Manage</span>
                    </div>

                    {allUsers.map((u, i) => (
                        <div key={i} className={`bg-[#111] rounded-2xl border transition-all duration-300 overflow-hidden ${expandedUser === u.email ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-[#151515]' : 'border-gray-800'}`}>
                            
                            <div 
                                onClick={() => {
                                    if (expandedUser === u.email) setExpandedUser(null);
                                    else { setExpandedUser(u.email); setFundInput(''); }
                                }}
                                className="p-4 flex items-center justify-between cursor-pointer active:bg-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm relative ${u.isAgent ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                        {u.name.charAt(0).toUpperCase()}
                                        {u.isPinned && <div className="absolute -top-1 -right-1 text-[10px] bg-yellow-500 rounded-full w-4 h-4 flex items-center justify-center shadow-sm">⭐</div>}
                                        {u.isSuspended && <div className="absolute -bottom-1 -right-1 text-[10px] bg-red-600 rounded-full w-4 h-4 flex items-center justify-center shadow-sm">🚫</div>}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-white font-bold text-sm leading-tight">{u.name}</p>
                                            {u.isAgent && <span className="text-[8px] bg-blue-900 text-blue-300 px-1.5 rounded font-bold uppercase">AGT</span>}
                                        </div>
                                        <p className="text-gray-500 text-xs font-mono">{u.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-green-500 font-black text-sm">৳{u.balance.toLocaleString()}</p>
                                    <span className={`material-symbols-outlined text-gray-600 text-xl transition-transform duration-300 ${expandedUser === u.email ? 'rotate-180 text-blue-500' : ''}`}>expand_more</span>
                                </div>
                            </div>

                            {expandedUser === u.email && (
                                <div className="bg-black/40 border-t border-gray-800 p-4 space-y-4 animate-in slide-in-from-top-2">
                                    <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-700 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">key</span> Login Credentials</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-500 uppercase">Current:</span>
                                                <span className="text-xs text-yellow-500 font-mono font-bold bg-yellow-900/20 px-2 py-0.5 rounded select-all">{u.password}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Set New Password" className="flex-grow bg-black border border-gray-600 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500" id={`pass_input_${i}`} />
                                            <button onClick={() => { const input = document.getElementById(`pass_input_${i}`) as HTMLInputElement; if(input.value) { onManageUsers('reset_password', {email: u.email, newPassword: input.value}); input.value = ''; } }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg text-xs font-bold uppercase shadow-lg">Update</button>
                                        </div>
                                    </div>

                                    <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-700 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">account_balance_wallet</span> Add Funds / Advance</span>
                                            <span className="text-[10px] text-green-500 font-black">Current: ৳{u.balance}</span>
                                        </div>
                                        <input type="number" placeholder="Enter Amount" value={fundInput} onChange={(e) => setFundInput(e.target.value)} className="w-full bg-black border border-gray-600 rounded-lg px-3 py-3 text-white font-black outline-none focus:border-green-500" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => { if(!fundInput) return alert("Enter amount"); onManageUsers('add_balance', {email: u.email, amount: fundInput}); setFundInput(''); setTimeout(refreshData, 100); alert(`Added ৳${fundInput}`); }} className="bg-green-600 text-white py-3 rounded-lg text-xs font-black uppercase shadow-lg flex items-center justify-center gap-2"><span className="material-symbols-outlined text-base">add_circle</span> Add Funds</button>
                                            <button onClick={() => { if(!fundInput) return alert("Enter amount"); onManageUsers('add_balance', {email: u.email, amount: -Math.abs(parseFloat(fundInput))}); setFundInput(''); setTimeout(refreshData, 100); alert(`Deducted ৳${fundInput}`); }} className="bg-red-900/40 border border-red-600/30 text-red-400 py-3 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-2"><span className="material-symbols-outlined text-base">remove_circle</span> Deduct</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800">
                                        <button onClick={() => onManageUsers('pin_user', {email: u.email})} className={`py-2 rounded-lg text-[10px] font-bold uppercase border flex flex-col items-center gap-1 ${u.isPinned ? 'bg-yellow-600 border-yellow-500 text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}><span className="material-symbols-outlined text-lg">{u.isPinned ? 'star' : 'star_border'}</span>{u.isPinned ? 'Unpin' : 'Pin User'}</button>
                                        <button onClick={() => onManageUsers('toggle_suspend', {email: u.email})} className={`py-2 rounded-lg text-[10px] font-bold uppercase border flex flex-col items-center gap-1 ${u.isSuspended ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}><span className="material-symbols-outlined text-lg">{u.isSuspended ? 'lock_open' : 'lock'}</span>{u.isSuspended ? 'Unban' : 'Ban User'}</button>
                                        <button onClick={() => {if(confirm(`PERMANENTLY DELETE user ${u.email}?`)) onManageUsers('delete', {email: u.email})}} className="py-2 rounded-lg text-[10px] font-bold uppercase bg-red-900/20 border border-red-900/50 text-red-500 hover:bg-red-900 hover:text-white transition-colors flex flex-col items-center gap-1"><span className="material-symbols-outlined text-lg">delete_forever</span>Delete</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
                <div className="p-4 space-y-4">
                    <h3 className="text-gray-500 text-xs font-bold uppercase ml-2 mb-4">Payment Configuration</h3>
                    
                    {paymentFields.map(field => (
                        <div key={field.key} className="bg-[#111] p-4 rounded-2xl border border-gray-800">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`material-symbols-outlined text-lg ${field.color}`}>{field.icon}</span>
                                <label className="text-[10px] text-gray-400 font-bold uppercase">{field.label}</label>
                            </div>
                            <input 
                                type="text" 
                                value={(tempSettings as any)[field.key] || ''} 
                                onChange={e => setTempSettings({...tempSettings, [field.key]: e.target.value})}
                                placeholder={`Enter ${field.label}...`}
                                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white text-sm font-mono outline-none focus:border-blue-500"
                            />
                        </div>
                    ))}

                    <div className="bg-[#111] p-4 rounded-2xl border border-gray-800 mt-4">
                        <label className="text-[10px] text-gray-400 font-bold uppercase block mb-2">Announcement Banner</label>
                        <textarea 
                            value={tempSettings.announcement}
                            onChange={e => setTempSettings({...tempSettings, announcement: e.target.value})}
                            className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500"
                            rows={3}
                        />
                    </div>

                    <button onClick={() => { onUpdateSettings(tempSettings); alert("Settings Saved Successfully!"); }} className="w-full bg-blue-600 py-4 rounded-xl text-white font-black uppercase shadow-lg shadow-blue-900/30 active:scale-95 transition-all mt-4">
                        Save Configuration
                    </button>
                </div>
            )}

            {/* AGENT MANAGEMENT TAB */}
            {activeTab === 'agents' && !selectedAgentChat && (
                <div className="p-4 space-y-6">
                    {pendingAgents.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-yellow-500 font-black uppercase text-xs flex items-center gap-2">
                                <span className="material-symbols-outlined">pending_actions</span> Pending Requests ({pendingAgents.length})
                            </h3>
                            {pendingAgents.map((u, i) => (
                                <div key={i} className="bg-[#111] border border-yellow-600/30 rounded-2xl overflow-hidden p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-600/20 text-yellow-500 flex items-center justify-center font-bold">{u.name.charAt(0)}</div>
                                            <div>
                                                <p className="text-white font-bold">{u.name}</p>
                                                <p className="text-xs text-gray-400">{u.email}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setViewingApplication(u)} className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">View Details</button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => manageAgent('approve_agent', {email: u.email})} className="flex-1 bg-green-600 py-2 rounded-lg text-white font-black uppercase text-xs">Approve</button>
                                        <button onClick={() => manageAgent('reject_agent', {email: u.email})} className="flex-1 bg-red-900/30 text-red-500 border border-red-900 py-2 rounded-lg font-black uppercase text-xs">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-3">
                        <h3 className="text-blue-500 font-black uppercase text-xs flex items-center gap-2">
                            <span className="material-symbols-outlined">badge</span> Active Agents
                        </h3>
                        {activeAgents.length === 0 ? (
                            <p className="text-gray-600 text-xs text-center py-6">No active agents found.</p>
                        ) : (
                            activeAgents.map((u, i) => (
                                <div key={i} className={`bg-[#111] rounded-2xl border p-4 relative ${u.isPinned ? 'border-yellow-500' : 'border-gray-800'}`}>
                                    <button 
                                        onClick={() => setSelectedAgentChat(u)}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-lg z-10"
                                    >
                                        <span className="material-symbols-outlined text-sm">chat</span>
                                    </button>

                                    <div className="flex items-center gap-3 mb-4 pr-10">
                                        <div className="w-12 h-12 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">{u.name.charAt(0)}</div>
                                        <div>
                                            <p className="text-white font-bold">{u.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-mono">{u.email}</p>
                                            <p className="text-[10px] text-yellow-500 font-bold mt-1">CODE: {u.referralCode || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-black/40 p-3 rounded-xl border border-gray-700 mb-4 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">Agent Balance</span>
                                        <span className="text-lg font-black text-green-500">৳{u.agentBalance || 0}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <button 
                                            onClick={() => {
                                                const a = prompt("Add Agent Funds:"); 
                                                if(a && !isNaN(parseFloat(a))) {
                                                    manageAgent('update_agent_balance', {email: u.email, amount: a});
                                                    alert("Funds Added Successfully");
                                                }
                                            }} 
                                            className="bg-green-600/20 text-green-400 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-green-600/30 transition-colors"
                                        >
                                            + Add Fund
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const a = prompt("Deduct Agent Funds:"); 
                                                if(a && !isNaN(parseFloat(a))) {
                                                    manageAgent('update_agent_balance', {email: u.email, amount: -Math.abs(parseFloat(a))});
                                                    alert("Funds Deducted Successfully");
                                                }
                                            }} 
                                            className="bg-red-600/20 text-red-400 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-red-600/30 transition-colors"
                                        >
                                            - Deduct
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <button 
                                            onClick={() => {
                                                const p = prompt("Set New 6-Digit PIN:"); 
                                                if(p) { 
                                                    if(p.length===6) { 
                                                        manageAgent('reset_agent_pin', {email: u.email}); 
                                                        alert("PIN Reset! Agent must set new PIN."); 
                                                    } else alert("Must be 6 digits"); 
                                                }
                                            }} 
                                            className="bg-gray-800 text-gray-400 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-700 transition-colors"
                                        >
                                            Reset PIN
                                        </button>
                                        <button 
                                            onClick={() => manageAgent('pin_user', {email: u.email})} 
                                            className={`py-2 rounded-lg text-[10px] font-bold uppercase ${u.isPinned ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                        >
                                            {u.isPinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(confirm("Delete Agent? This action cannot be undone.")) 
                                                    manageAgent('delete', {email: u.email});
                                            }} 
                                            className="bg-red-900 text-red-200 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-red-800 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* DIRECT AGENT CHAT VIEW */}
            {(selectedAgentChat || activeTab === 'chat') && (
                <div className={`flex flex-col h-full pb-2 ${selectedAgentChat ? 'fixed inset-0 z-[110] bg-[#000]' : ''}`}>
                    {selectedAgentChat && (
                        <div className="bg-[#111] p-4 flex items-center gap-3 border-b border-gray-800">
                            <button onClick={() => setSelectedAgentChat(null)} className="text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
                            <div>
                                <h3 className="text-white font-bold">{selectedAgentChat.name}</h3>
                                <p className="text-[10px] text-blue-500 font-bold uppercase">Direct Agent Chat</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {(selectedAgentChat ? (selectedAgentChat.agentChatHistory || []) : supportMessages).length === 0 && (
                            <p className="text-center text-gray-600 text-xs mt-10">No messages found.</p>
                        )}
                        {(selectedAgentChat ? (selectedAgentChat.agentChatHistory || []) : supportMessages).map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.isAdmin || msg.sender === 'Admin' ? 'items-end' : 'items-start'}`}>
                                <span className="text-[9px] text-gray-500 px-1 mb-1">{msg.sender}</span>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.isAdmin || msg.sender === 'Admin' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-[#222] text-gray-300 rounded-tl-none border border-gray-700'}`}>
                                    {msg.image && <img src={msg.image} className="rounded-lg mb-2 w-full" />}
                                    <p>{msg.text}</p>
                                </div>
                                <span className="text-[9px] text-gray-600 mt-1 px-1">{msg.timestamp}</span>
                            </div>
                        ))}
                        <div ref={selectedAgentChat ? agentChatBottomRef : chatBottomRef}></div>
                    </div>

                    <div className="p-3 bg-[#111] border-t border-gray-800 flex gap-2">
                        <input 
                            type="text" 
                            value={selectedAgentChat ? agentReplyText : replyText} 
                            onChange={e => selectedAgentChat ? setAgentReplyText(e.target.value) : setReplyText(e.target.value)} 
                            placeholder={selectedAgentChat ? "Message Agent..." : "Type admin reply..."} 
                            className="flex-grow bg-black border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none"
                        />
                        <button onClick={selectedAgentChat ? handleAgentChatSend : handleSendReply} className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg active:scale-95">
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            )}

            {/* FINANCE */}
            {activeTab === 'finance' && (
                <div className="p-4 space-y-4">
                    {pendingTransactions.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                            <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                            <p className="text-xs font-bold uppercase">All Clear</p>
                        </div>
                    ) : (
                        pendingTransactions.map(({tx, user}, i) => (
                            <div key={i} onClick={() => setViewingTransaction({tx, user})} className="bg-[#111] p-4 rounded-2xl border border-yellow-600/30 relative overflow-hidden active:scale-95 transition-all cursor-pointer">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                                <div className="flex justify-between items-start mb-3 pl-2">
                                    <div>
                                        <p className="text-yellow-500 font-black uppercase text-xs">{tx.type} Request</p>
                                        <p className="text-white font-black text-2xl">৳{tx.amount}</p>
                                        <p className="text-gray-500 text-[10px] font-mono mt-1">{user.email}</p>
                                    </div>
                                    <div className="bg-white/10 px-2 py-1 rounded text-[10px] font-bold text-gray-300">
                                        View Details
                                    </div>
                                </div>
                                <div className="flex gap-3 pl-2">
                                    <button onClick={(e) => { e.stopPropagation(); onAction(tx.id, 'approve'); }} className="flex-1 bg-green-600 py-3 rounded-xl text-white font-black uppercase text-xs shadow-lg">Approve</button>
                                    <button onClick={(e) => { e.stopPropagation(); onAction(tx.id, 'reject'); }} className="flex-1 bg-red-900/30 text-red-400 border border-red-900 py-3 rounded-xl font-black uppercase text-xs">Reject</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* GAME MANAGEMENT */}
            {activeTab === 'games' && (
                <div className="p-4 space-y-6">
                    <div id="game-form-top" className="bg-[#111] p-5 rounded-3xl border border-gray-800 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-white font-black uppercase text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-yellow-500">add_circle</span> 
                                {editingGame ? 'Edit Game' : 'Add New Game'}
                            </h3>
                            {editingGame && (
                                <button onClick={handleCancelEdit} className="text-xs text-red-500 font-bold uppercase">Cancel</button>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] text-gray-500 font-bold uppercase ml-2">Provider Category</label>
                                <select 
                                    value={gameForm.provider} 
                                    onChange={e => setGameForm({...gameForm, provider: e.target.value})}
                                    className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white text-sm font-bold outline-none"
                                >
                                    <option value="JILI">JILI</option>
                                    <option value="PGSoft">PGSoft</option>
                                    <option value="CQ9">CQ9</option>
                                    <option value="JDB">JDB</option>
                                    <option value="InOut">Live Casino</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] text-gray-500 font-bold uppercase ml-2">Game Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Golden Empire" 
                                    value={gameForm.title}
                                    onChange={e => setGameForm({...gameForm, title: e.target.value})}
                                    className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white text-sm font-bold outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] text-gray-500 font-bold uppercase ml-2">Game URL (Iframe)</label>
                                <input 
                                    type="text" 
                                    placeholder="https://..." 
                                    value={gameForm.url}
                                    onChange={e => setGameForm({...gameForm, url: e.target.value})}
                                    className="w-full bg-black border border-gray-700 rounded-xl p-3 text-blue-400 text-xs font-mono outline-none"
                                />
                                
                                {/* NEW: HTML UPLOAD OPTION */}
                                <div className="text-center text-[10px] text-gray-500 font-bold my-2">- OR -</div>
                                
                                <div 
                                    onClick={() => htmlInputRef.current?.click()}
                                    className={`w-full p-3 border border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all ${gameForm.url.startsWith('data:text/html') ? 'bg-green-900/20 border-green-500' : 'bg-black/30 border-gray-700 hover:border-white/30'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-400">html</span>
                                        <span className={`text-[10px] font-bold uppercase ${gameForm.url.startsWith('data:text/html') ? 'text-green-500' : 'text-gray-400'}`}>
                                            {gameForm.url.startsWith('data:text/html') ? 'HTML File Uploaded' : 'Upload Game File (.html)'}
                                        </span>
                                    </div>
                                </div>
                                <input type="file" ref={htmlInputRef} accept=".html" className="hidden" onChange={handleHtmlUpload} />
                            </div>

                            <div>
                                <label className="text-[9px] text-gray-500 font-bold uppercase ml-2">Cover Image</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-24 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center bg-black/50 cursor-pointer overflow-hidden relative"
                                >
                                    {gameForm.image ? (
                                        <img src={gameForm.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            <span className="material-symbols-outlined">add_photo_alternate</span>
                                            <p className="text-[9px] uppercase font-bold">Tap to Upload</p>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            </div>

                            <button 
                                onClick={handleSaveGame}
                                className={`w-full py-4 rounded-xl font-black uppercase text-sm shadow-lg active:scale-95 transition-all ${editingGame ? 'bg-yellow-600 text-black' : 'bg-green-600 text-white'}`}
                            >
                                {editingGame ? 'Update Game' : 'Add Game to List'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-gray-500 text-xs font-bold uppercase ml-2">Added Games Library</h3>
                        {(settings.externalGames || []).length === 0 ? (
                            <p className="text-center text-gray-600 text-xs py-4">No games added yet.</p>
                        ) : (
                            (settings.externalGames || []).map((game, i) => (
                                <div key={i} className="bg-[#111] p-3 rounded-2xl border border-gray-800 flex items-center gap-3">
                                    <img src={game.image} className="w-16 h-16 rounded-xl object-cover bg-gray-800" />
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-gray-800 text-[9px] text-gray-400 px-1.5 rounded uppercase font-bold">{game.provider}</span>
                                            <h4 className="text-white font-bold text-sm truncate">{game.title}</h4>
                                        </div>
                                        <p className="text-[10px] text-gray-500 truncate font-mono mt-1">
                                            {game.url.startsWith('data:text/html') ? '[LOCAL HTML FILE]' : game.url}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => handleEditGame(game)} className="bg-blue-600/20 text-blue-500 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-base">edit</span>
                                        </button>
                                        <button onClick={() => handleDeleteGame(game.id)} className="bg-red-600/20 text-red-500 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-base">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

        </div>

        {/* APPLICATION DETAILS MODAL */}
        {viewingApplication && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-3xl p-6 relative">
                    <button onClick={() => setViewingApplication(null)} className="absolute top-4 right-4 bg-gray-800 p-2 rounded-full text-white hover:bg-red-600"><span className="material-symbols-outlined">close</span></button>
                    <h3 className="text-xl font-black text-white uppercase italic mb-6">Application Details</h3>
                    
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="w-full h-40 rounded-xl overflow-hidden bg-black border border-gray-700">
                            {viewingApplication.agentApplication?.photo ? (
                                <img src={viewingApplication.agentApplication.photo} className="w-full h-full object-contain" />
                            ) : <div className="flex items-center justify-center h-full text-gray-500">No Photo</div>}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#1a1a1a] p-3 rounded-lg">
                                <p className="text-[9px] text-gray-500 font-bold uppercase">Full Name</p>
                                <p className="text-white font-bold">{viewingApplication.agentApplication?.firstName} {viewingApplication.agentApplication?.lastName}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-3 rounded-lg">
                                <p className="text-[9px] text-gray-500 font-bold uppercase">Phone</p>
                                <p className="text-white font-bold">{viewingApplication.agentApplication?.phone}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-3 rounded-lg">
                                <p className="text-[9px] text-gray-500 font-bold uppercase">Location</p>
                                <p className="text-white text-xs">{viewingApplication.agentApplication?.city}, {viewingApplication.agentApplication?.state}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-3 rounded-lg border border-yellow-600/30">
                                <p className="text-[9px] text-yellow-500 font-bold uppercase">Requested Password</p>
                                <p className="text-white font-mono font-bold">{viewingApplication.agentApplication?.password}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TRANSACTION DETAILS MODAL */}
        {viewingTransaction && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                <div className="w-full max-w-sm bg-[#111] border border-gray-800 rounded-3xl p-6 relative animate-in zoom-in-95">
                    <button onClick={() => setViewingTransaction(null)} className="absolute top-4 right-4 bg-gray-800 p-2 rounded-full text-white hover:bg-red-600 transition-all"><span className="material-symbols-outlined">close</span></button>
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-yellow-500/30">
                            <span className="material-symbols-outlined text-3xl text-yellow-500">payments</span>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic">Transaction Details</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-700">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">User Email</p>
                            <p className="text-white text-sm font-mono break-all">{viewingTransaction.user.email}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-700">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Type</p>
                                <p className="text-yellow-500 font-bold uppercase text-xs">{viewingTransaction.tx.type}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-700">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Amount</p>
                                <p className="text-white font-black text-lg">৳{viewingTransaction.tx.amount}</p>
                            </div>
                        </div>

                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-blue-500/30">
                            <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Sent To / From</p>
                            <p className="text-white font-bold text-sm mb-1">{viewingTransaction.tx.method}</p>
                            <div className="bg-black/50 p-2 rounded border border-white/10 flex items-center justify-between">
                                <span className="text-yellow-400 font-mono font-bold text-sm tracking-wider select-all">{viewingTransaction.tx.phone || viewingTransaction.tx.id}</span>
                                <span className="material-symbols-outlined text-gray-500 text-sm">content_copy</span>
                            </div>
                            <p className="text-[9px] text-gray-500 mt-2 italic">This is the number/address provided by the user.</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { onAction(viewingTransaction.tx.id, 'approve'); setViewingTransaction(null); }} className="flex-1 bg-green-600 py-3 rounded-xl text-white font-black uppercase text-xs shadow-lg">Approve</button>
                            <button onClick={() => { onAction(viewingTransaction.tx.id, 'reject'); setViewingTransaction(null); }} className="flex-1 bg-red-900/30 text-red-400 border border-red-900 py-3 rounded-xl font-black uppercase text-xs">Reject</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .custom-scroll::-webkit-scrollbar { width: 4px; }
            .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        `}</style>
    </div>
  );
};

export default AdminPanel;
