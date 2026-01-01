
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModals from './components/AuthModals';
import GameView from './components/GameView';
import CasinoView from './components/CasinoView';
import LandingPage from './components/LandingPage';
import DepositModal from './components/DepositModal';
import WithdrawModal from './components/WithdrawModal';
import HistoryModal from './components/HistoryModal';
import BetHistoryModal, { BetRecord } from './components/BetHistoryModal';
import AdminPanel from './components/AdminPanel'; 
import PromoModal from './components/PromoModal'; 
import SupportModal, { ChatMessage } from './components/SupportModal';
import AgentPanel from './components/AgentPanel'; 

export interface Transaction {
  id: string;
  userEmail?: string; 
  type: 'deposit' | 'withdraw' | 'agent_withdraw' | 'commission' | 'admin_adjustment' | 'admin_agent_adjustment';
  amount: number;
  method: string;
  phone?: string; 
  status: 'pending' | 'success' | 'failed';
  date: string;
}

export interface AgentApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  photo: string; 
  password?: string; 
}

export interface UserData {
  email: string;
  uid: string;
  password?: string; 
  name: string;
  balance: number;
  transactions: Transaction[];
  betHistory: BetRecord[];
  isPinned?: boolean;
  isSuspended?: boolean;
  isAgent?: boolean;
  isAgentPending?: boolean;
  agentApplication?: AgentApplicationData; 
  agentBalance?: number;
  referralCode?: string;
  promoCodes?: string[]; 
  referredBy?: string; 
  referralMethod?: 'link' | 'promo'; 
  referredUsers?: { email: string; uid: string; method: 'link' | 'promo'; date: string }[]; 
  agentChatHistory?: ChatMessage[];
  userAgentChat?: ChatMessage[];
  withdrawalPin?: string; 
  isPinResetPending?: boolean; 
}

export interface ExternalGame {
    id: string;
    title: string;
    image: string;
    url: string; 
    provider: string; 
}

export interface AdminSettings {
  siteTitle: string;
  announcement: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber?: string; 
  upayNumber?: string;   
  bankDetails?: string;  
  usdtAddress: string;
  btcAddress: string;
  forcedCrashPoint: number | null;
  externalGames: ExternalGame[]; 
}

export type GameType = string; 

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeModal, setActiveModal] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [activeGameType, setActiveGameType] = useState<GameType>('aviator');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBetHistory, setShowBetHistory] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [showPromo, setShowPromo] = useState(false); 
  const [showSupport, setShowSupport] = useState(false);
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState<string | null>(null);
  const [supportMessages, setSupportMessages] = useState<ChatMessage[]>([]);

  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    siteTitle: 'SKY HIGH',
    announcement: 'Welcome to the most trusted betting platform!',
    bkashNumber: '01700000000',
    nagadNumber: '01900000000',
    rocketNumber: '',
    upayNumber: '',
    bankDetails: '',
    usdtAddress: 'TJ...USDT...TRC20',
    btcAddress: 'bc1...BTC...Address',
    forcedCrashPoint: null,
    externalGames: [] 
  });

  // --- GLOBAL AUDIO UNLOCKER (FIXES SOUND ISSUES) ---
  useEffect(() => {
    const unlockAudio = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.resume();
            // Play a silent utterance to force the browser to active TTS
            const u = new SpeechSynthesisUtterance("");
            u.volume = 0;
            window.speechSynthesis.speak(u);
        }
        // Create a dummy audio context to unlock WebAudio
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            ctx.resume().then(() => ctx.close());
        }
    };
    // Listen for any interaction to unlock sound
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    
    return () => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // --- ROBUST VOICE SYSTEM ---
  const queueVoice = (text: string) => {
    if (isGlobalMuted) return;
    // If Admin Panel is open, ONLY allow "Boss" messages
    if (showAdminPanel && !text.includes("Boss")) return;
    
    if (!window.speechSynthesis) return;

    // Force cancel previous to ensure new message plays immediately (critical for game sync)
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1.0;
    utterance.rate = 1.1; 
    utterance.pitch = 1.2; // Female pitch target
    
    // Select Voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
        v.name.includes('Google US English') || 
        v.name.includes('Samantha') || 
        v.name.includes('Zira') ||
        v.name.includes('Female')
    );
    
    if (femaleVoice) utterance.voice = femaleVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  // --- ADMIN PANEL WELCOME & CHECKS ---
  useEffect(() => {
      if (showAdminPanel) {
          queueVoice("Welcome Admin Boss");
          // Check Pending Logic...
      }
  }, [showAdminPanel]);

  useEffect(() => {
    const savedSettings = localStorage.getItem('skyhigh_admin_settings');
    if (savedSettings) setAdminSettings(JSON.parse(savedSettings));

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCodeFromUrl(ref);

    setTimeout(() => setIsAppLoading(false), 2000);

    const savedUser = localStorage.getItem('skyhigh_current_user');
    if (savedUser) {
       const user = JSON.parse(savedUser);
       const db = getUsersDB();
       const dbUser = db[user.email];
       if (dbUser && dbUser.isSuspended) {
          localStorage.removeItem('skyhigh_current_user');
          setCurrentUser(null);
          alert("Account Suspended by Admin");
       } else if (dbUser) {
          setCurrentUser(dbUser);
       } else {
          setCurrentUser(user); 
       }
    }
    
    const savedChat = localStorage.getItem('skyhigh_support_chat');
    if (savedChat) {
        setSupportMessages(JSON.parse(savedChat));
    }
  }, []);

  useEffect(() => {
      localStorage.setItem('skyhigh_admin_settings', JSON.stringify(adminSettings));
  }, [adminSettings]);

  const getUsersDB = (): Record<string, UserData> => {
    const db = localStorage.getItem('skyhigh_users_db');
    return db ? JSON.parse(db) : {};
  };

  const saveUserDB = (db: Record<string, UserData>) => {
    localStorage.setItem('skyhigh_users_db', JSON.stringify(db));
  };

  const updateCurrentUser = (updater: (prev: UserData) => UserData) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = updater(prev);
      if (updated.email && !updated.email.startsWith('google_')) {
        const db = getUsersDB();
        db[updated.email] = updated;
        saveUserDB(db);
      }
      localStorage.setItem('skyhigh_current_user', JSON.stringify(updated));
      return updated;
    });
  };

  const generateUID = () => Math.floor(10000000 + Math.random() * 90000000).toString();

  const handleAuthAction = (type: 'login' | 'register' | 'google', data: any) => {
    // Immediate Voice Feedback on Auth
    if(window.speechSynthesis) window.speechSynthesis.resume();

    const db = getUsersDB();
    let referringAgentEmail: string | null = null;
    let method: 'link' | 'promo' = 'link';

    if (referralCodeFromUrl) {
        const agent = Object.values(db).find(u => u.referralCode === referralCodeFromUrl && u.isAgent);
        if (agent) { referringAgentEmail = agent.email; method = 'link'; }
    }

    if (type === 'register' && data.promoCode) {
        const code = data.promoCode.trim().toUpperCase();
        const agent = Object.values(db).find(u => u.isAgent && u.promoCodes?.includes(code));
        if (agent) { referringAgentEmail = agent.email; method = 'promo'; }
    }

    if (type === 'google') {
      const email = data.email || `google_${Math.floor(Math.random()*10000)}@gmail.com`;
      const name = data.name || "Google User";
      const user = db[email];
      if (user && user.isSuspended) { alert("This account has been suspended by Admin."); return; }

      if (user) {
         setCurrentUser(user);
         localStorage.setItem('skyhigh_current_user', JSON.stringify(user));
         queueVoice("Welcome back");
      } else {
          const uid = generateUID();
          const newUser: UserData = {
            email: email, uid: uid, name: name, balance: 0, transactions: [], betHistory: [],
            isPinned: false, isSuspended: false,
            referredBy: referringAgentEmail || undefined,
            referralMethod: referringAgentEmail ? method : undefined
          };
          if(referringAgentEmail) {
              const agent = db[referringAgentEmail];
              if(agent) {
                  const refEntry = { email: email, uid: uid, method: method, date: new Date().toLocaleDateString() };
                  agent.referredUsers = [...(agent.referredUsers || []), refEntry as any];
                  db[referringAgentEmail] = agent;
              }
          }
          db[email] = newUser;
          saveUserDB(db);
          setCurrentUser(newUser);
          localStorage.setItem('skyhigh_current_user', JSON.stringify(newUser));
          queueVoice("Welcome to Sky High"); 
          setTimeout(() => setShowPromo(true), 1000);
      }
      setActiveModal(null);
      enterGame('aviator');
      return;
    }

    if (type === 'register') {
      if (db[data.email]) { alert("Account already exists! Please login."); return; }
      const uid = generateUID();
      const newUser: UserData = {
        email: data.email, uid: uid, password: data.password, name: data.fullname,
        balance: 0, transactions: [], betHistory: [], isPinned: false, isSuspended: false,
        referredBy: referringAgentEmail || undefined,
        referralMethod: referringAgentEmail ? method : undefined
      };
      if(referringAgentEmail) {
          const agent = db[referringAgentEmail];
          if(agent) {
              const refEntry = { email: data.email, uid: uid, method: method, date: new Date().toLocaleDateString() };
              agent.referredUsers = [...(agent.referredUsers || []), refEntry as any];
              db[referringAgentEmail] = agent;
          }
      }
      db[data.email] = newUser;
      saveUserDB(db);
      setCurrentUser(newUser);
      localStorage.setItem('skyhigh_current_user', JSON.stringify(newUser));
      setActiveModal(null);
      enterGame('aviator');
      queueVoice("Welcome to Sky High"); 
      setTimeout(() => setShowPromo(true), 1000);
    } 
    else if (type === 'login') {
      const user = db[data.email];
      if (user && user.password === data.password) {
        if (user.isSuspended) { alert("This account has been suspended by Admin."); return; }
        setCurrentUser(user);
        localStorage.setItem('skyhigh_current_user', JSON.stringify(user));
        if(user.isAgent) queueVoice("Welcome back Agent");
        else queueVoice("Welcome back");
        setActiveModal(null);
        enterGame('aviator');
      } else {
        alert("Invalid Email or Password");
      }
    }
  };

  const handleUserManagement = (action: string, payload: any) => {
      // ... (Existing implementation remains same)
      const db = getUsersDB();
      const email = payload.email;
      
      if (action === 'clear_all_agent_data') {
          Object.keys(db).forEach(key => {
              if (db[key].isAgent) {
                  db[key].agentBalance = 0;
                  db[key].referredUsers = [];
                  db[key].transactions = db[key].transactions.filter(t => t.type !== 'commission' && t.type !== 'agent_withdraw');
              }
          });
          saveUserDB(db);
          alert("All Agent Data Cleared!");
          return;
      }

      if (!db[email]) return;

      if (action === 'delete') {
          delete db[email];
          saveUserDB(db);
          if (currentUser?.email === email) handleLogout();
      } else if (action === 'toggle_suspend') {
          db[email].isSuspended = !db[email].isSuspended;
          saveUserDB(db);
          if (currentUser?.email === email) handleLogout(); 
      } else if (action === 'add_balance') {
          const amount = parseFloat(payload.amount);
          if (!isNaN(amount)) {
              db[email].balance = (db[email].balance || 0) + amount;
              db[email].transactions.unshift({
                  id: 'ADM-' + Date.now(), type: 'admin_adjustment', amount: amount, method: 'Admin Panel', status: 'success', date: new Date().toLocaleString()
              });
              saveUserDB(db);
              if (currentUser?.email === email) updateCurrentUser(prev => db[email]);
          }
      } else if (action === 'reset_password') {
          if(payload.newPassword) {
              db[email].password = payload.newPassword;
              saveUserDB(db);
              alert("Password Reset Successfully!");
          }
      } else if (action === 'update_agent_balance') {
          const amount = parseFloat(payload.amount);
          if (!isNaN(amount)) {
              db[email].agentBalance = (db[email].agentBalance || 0) + amount;
              // Log the transaction
              db[email].transactions.unshift({
                  id: 'AG-ADM-' + Date.now(), 
                  type: 'admin_agent_adjustment', 
                  amount: Math.abs(amount), // Show positive for log, sign logic handled in balance
                  method: amount > 0 ? 'Admin Bonus' : 'Admin Deduction', 
                  status: 'success', 
                  date: new Date().toLocaleString()
              });
              saveUserDB(db);
              if (currentUser?.email === email) updateCurrentUser(prev => db[email]);
          }
      } else if (action === 'pin_user') {
          db[email].isPinned = !db[email].isPinned;
          saveUserDB(db);
      } else if (action === 'approve_agent') {
          db[email].isAgent = true;
          db[email].isAgentPending = false;
          if(!db[email].agentBalance) db[email].agentBalance = 0;
          if(!db[email].referredUsers) db[email].referredUsers = [];
          if(!db[email].promoCodes) db[email].promoCodes = []; 
          if(!db[email].referralCode) db[email].referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          
          saveUserDB(db);
          if (currentUser?.email === email) updateCurrentUser(prev => db[email]);
      } else if (action === 'reject_agent') {
          db[email].isAgent = false;
          db[email].isAgentPending = false;
          saveUserDB(db);
          if (currentUser?.email === email) updateCurrentUser(prev => db[email]);
      } else if (action === 'reset_pin') {
          db[email].withdrawalPin = undefined;
          db[email].isPinResetPending = false;
          saveUserDB(db);
          if (currentUser?.email === email) updateCurrentUser(prev => db[email]);
      } else if (action === 'reset_agent_pin') {
          db[email].withdrawalPin = undefined; 
          saveUserDB(db);
          if (currentUser?.email === email) updateCurrentUser(prev => db[email]);
      }
  };

  const enterGame = (gameType: GameType = 'aviator') => {
    setActiveGameType(gameType);
    setIsTransitioning(true);
    setTimeout(() => {
      setShowGame(true);
      setIsTransitioning(false);
    }, 1200);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('skyhigh_current_user');
    setShowGame(false);
  };

  // --- NEW HANDLER TO SET PIN ---
  const handleSetUserPin = (pin: string) => {
      updateCurrentUser(prev => ({...prev, withdrawalPin: pin}));
  };

  // Updated to accept phone/account info
  const addTransaction = (type: 'deposit' | 'withdraw', amount: number, method: string, phone?: string) => {
    if (!currentUser) return;
    if (type === 'withdraw' && currentUser.balance < amount) return;
    
    if (type === 'deposit') {
        queueVoice("Deposit successful. Wait for approval.");
    } else if (type === 'withdraw') {
        queueVoice("Withdrawal request successful. Sent to admin.");
    }

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      userEmail: currentUser.email,
      type, amount, method, phone, // Save the phone/account info here
      status: 'pending', date: new Date().toLocaleString(),
    };

    updateCurrentUser(prev => ({
      ...prev,
      balance: type === 'withdraw' ? prev.balance - amount : prev.balance,
      transactions: [newTx, ...prev.transactions]
    }));
  };

  const handleAdminAction = (txId: string, action: 'approve' | 'reject') => {
    // ... (Existing Implementation)
    const db = getUsersDB();
    let targetUserEmail = '';
    for (const email in db) {
        const tx = db[email].transactions.find(t => t.id === txId);
        if (tx) { targetUserEmail = email; break; }
    }
    if (!targetUserEmail) return;
    const user = db[targetUserEmail];
    const txIndex = user.transactions.findIndex(t => t.id === txId);
    const tx = user.transactions[txIndex];
    const newStatus = action === 'approve' ? 'success' : 'failed';
    user.transactions[txIndex] = { ...tx, status: newStatus };

    if (action === 'approve') {
        if (tx.type === 'deposit') {
            user.balance += tx.amount;
            if (user.referredBy) {
                const agent = db[user.referredBy];
                if (agent && agent.isAgent) {
                    const commission = tx.amount * 0.50; 
                    agent.agentBalance = (agent.agentBalance || 0) + commission;
                    const commTx: Transaction = {
                        id: 'COM-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                        userEmail: agent.email,
                        type: 'commission',
                        amount: commission,
                        method: `User: ${user.uid}`,
                        status: 'success',
                        date: new Date().toLocaleString()
                    };
                    agent.transactions.unshift(commTx);
                    db[user.referredBy] = agent; 
                }
            }
        }
    } else if (action === 'reject') {
        if (tx.type === 'withdraw') user.balance += tx.amount;
        if (tx.type === 'agent_withdraw') user.agentBalance = (user.agentBalance || 0) + tx.amount;
    }
    db[targetUserEmail] = user; 
    saveUserDB(db);
    if (currentUser?.email === targetUserEmail) updateCurrentUser(() => user);
  };

  // ... (Passthrough remaining handlers)
  const applyForAgent = (data: AgentApplicationData) => {
      updateCurrentUser(prev => ({ ...prev, isAgentPending: true, agentApplication: data }));
      queueVoice("Agent Application Submitted.");
  };

  const handleAgentPinAction = (action: 'set_pin' | 'request_reset', pin?: string) => {
      if(!currentUser) return;
      if (action === 'set_pin' && pin) {
          updateCurrentUser(prev => ({...prev, withdrawalPin: pin}));
          alert("PIN Secured Successfully!");
      } else if (action === 'request_reset') {
          updateCurrentUser(prev => ({...prev, isPinResetPending: true}));
          alert("Reset Request Sent to Admin!");
      }
  };

  const handleAgentTools = (action: 'create_promo', payload: string) => {
      if (!currentUser) return;
      if (action === 'create_promo') {
          const newCode = payload.toUpperCase();
          const db = getUsersDB();
          const exists = Object.values(db).some(u => u.promoCodes?.includes(newCode));
          if (exists) { alert("Code already taken!"); return; }
          updateCurrentUser(prev => ({ ...prev, promoCodes: [...(prev.promoCodes || []), newCode] }));
          alert("Promo Code Created!");
      }
  };

  const handleAgentWithdraw = (amount: number, method: string, phone: string) => {
      if(!currentUser || !currentUser.agentBalance || currentUser.agentBalance < amount) return;
      const newTx: Transaction = {
          id: 'AG-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          userEmail: currentUser.email, type: 'agent_withdraw', amount, method, phone, status: 'pending', date: new Date().toLocaleString()
      };
      updateCurrentUser(prev => ({
          ...prev, agentBalance: (prev.agentBalance || 0) - amount, transactions: [newTx, ...prev.transactions]
      }));
      queueVoice("Agent Withdrawal Request Received.");
  };

  const handleAgentChat = (text: string) => {
      if(!currentUser) return;
      const msg: ChatMessage = { id: Date.now().toString(), sender: 'Agent', text, timestamp: new Date().toLocaleTimeString(), isAdmin: false };
      updateCurrentUser(prev => ({ ...prev, agentChatHistory: [...(prev.agentChatHistory || []), msg] }));
  };
  
  const lookupUserByUID = (uid: string) => {
      const db = getUsersDB();
      return Object.values(db).find(u => u.uid === uid);
  };

  const handleAgentDirectMessage = (targetUid: string, text: string) => {
      const db = getUsersDB();
      const targetUser = Object.values(db).find(u => u.uid === targetUid);
      if(targetUser) {
          const msg: ChatMessage = {
              id: Date.now().toString(), sender: 'Agent', text: text, timestamp: new Date().toLocaleTimeString(), isAdmin: true 
          };
          targetUser.userAgentChat = [...(targetUser.userAgentChat || []), msg];
          db[targetUser.email] = targetUser;
          saveUserDB(db);
          alert("Message sent to user!");
      }
  };

  const handleSendMessage = (text: string, image?: string, target?: 'admin' | 'agent') => {
     if (!currentUser) return;
     if (target === 'agent' && currentUser.referredBy) {
         const db = getUsersDB();
         const agent = db[currentUser.referredBy];
         if (agent && agent.isAgent) {
             const msg: ChatMessage = {
                 id: Math.random().toString(), sender: 'User', text, image, timestamp: new Date().toLocaleTimeString(), isAdmin: false
             };
             updateCurrentUser(prev => ({ ...prev, userAgentChat: [...(prev.userAgentChat || []), msg] }));
             queueVoice("Message sent to Agent.");
         }
     } else {
         const newMessage: ChatMessage = {
             id: Math.random().toString(36).substr(2, 9),
             sender: currentUser.name || 'User',
             text, image, timestamp: new Date().toLocaleTimeString(), isAdmin: false
         };
         setSupportMessages(prev => {
             const updated = [...prev, newMessage];
             localStorage.setItem('skyhigh_support_chat', JSON.stringify(updated));
             return updated;
         });
         queueVoice("Support message received.");
     }
  };

  const handleAdminReply = (text: string) => { 
      const newMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9), sender: 'Support Team', text, timestamp: new Date().toLocaleTimeString(), isAdmin: true
      };
      setSupportMessages(prev => {
         const updated = [...prev, newMessage];
         localStorage.setItem('skyhigh_support_chat', JSON.stringify(updated));
         return updated;
      });
  };

  const handleAdminAgentReply = (agentEmail: string, text: string) => {
      const db = getUsersDB();
      if(db[agentEmail]) {
          const msg: ChatMessage = { id: Date.now().toString(), sender: 'Admin', text, timestamp: new Date().toLocaleTimeString(), isAdmin: true };
          db[agentEmail].agentChatHistory = [...(db[agentEmail].agentChatHistory || []), msg];
          saveUserDB(db);
      }
  };

  const handleClosePromo = () => {
      setShowPromo(false);
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-[#000a16] flex flex-col items-center justify-center p-4">
        <div className="relative mb-8">
          <img src="https://aviator.digirg-demo.pp.ua/images/logo.png" alt="Logo" className="h-24 w-auto animate-pulse" />
        </div>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">Loading System</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#000a16]">
      <Header 
        isLoggedIn={!!currentUser}
        username={currentUser?.uid} 
        balance={currentUser?.balance || 0}
        siteTitle={adminSettings.siteTitle}
        onOpenLogin={() => setActiveModal('login')}
        onOpenRegister={() => setActiveModal('register')}
        onLogout={handleLogout}
        onLogoClick={() => setShowGame(false)}
        onOpenDeposit={() => setShowDeposit(true)}
        onOpenWithdraw={() => setShowWithdraw(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenBetHistory={() => setShowBetHistory(true)}
        onOpenAdmin={() => setShowAdminPanel(true)} 
        onOpenSupport={() => setShowSupport(true)}
        onOpenAgent={() => setShowAgentPanel(true)} 
        isMuted={isGlobalMuted}
        onToggleMute={() => setIsGlobalMuted(!isGlobalMuted)}
      />

      <main className="flex-grow flex flex-col items-center justify-center relative">
        {isTransitioning && (
          <div className="absolute inset-0 z-[100] bg-[#000a16] flex flex-col items-center justify-center animate-in fade-in duration-300">
             <div className="w-16 h-16 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-6"></div>
             <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.5em] animate-pulse">Synchronizing Protocol</p>
          </div>
        )}
        
        {showGame && currentUser ? (
          activeGameType === 'aviator' ? (
            <GameView 
              balance={currentUser.balance} 
              setBalance={(newBal) => updateCurrentUser(prev => ({...prev, balance: typeof newBal === 'function' ? newBal(prev.balance) : newBal}))} 
              onRecordBet={(bet) => updateCurrentUser(prev => ({...prev, betHistory: [{...bet, id: Math.random().toString(), date: new Date().toLocaleTimeString()}, ...prev.betHistory].slice(50)}))} 
              myBetHistory={currentUser.betHistory} 
              forcedCrashPoint={adminSettings.forcedCrashPoint} 
              onConsumeCrashPoint={() => setAdminSettings(prev => ({...prev, forcedCrashPoint: null}))}
              isMuted={showAdminPanel || isGlobalMuted} 
              queueVoice={queueVoice} 
            />
          ) : (
            <CasinoView
              gameType={activeGameType}
              balance={currentUser.balance}
              setBalance={(newBal) => updateCurrentUser(prev => ({...prev, balance: typeof newBal === 'function' ? newBal(prev.balance) : newBal}))}
              isMuted={showAdminPanel || isGlobalMuted} 
              onClose={() => setShowGame(false)}
              externalGames={adminSettings.externalGames} 
            />
          )
        ) : (
          <LandingPage 
            onPlay={(gameType: GameType = 'aviator') => currentUser ? enterGame(gameType) : setActiveModal('login')} 
            userBalance={currentUser?.balance}
            isLoggedIn={!!currentUser}
            externalGames={adminSettings.externalGames} 
          />
        )}
      </main>

      {!showGame && <Footer />}

      <AuthModals activeModal={activeModal} onClose={() => setActiveModal(null)} onSwitch={(type) => setActiveModal(type)} onAuthAction={handleAuthAction} />
      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} onSuccess={(amt, method) => addTransaction('deposit', amt, method)} adminSettings={adminSettings} />}
      
      {/* UPDATED WITHDRAW MODAL WITH PIN LOGIC & PHONE PASSING */}
      {showWithdraw && (
          <WithdrawModal 
            balance={currentUser?.balance || 0} 
            onClose={() => setShowWithdraw(false)} 
            onSuccess={(amt, method, phone) => addTransaction('withdraw', amt, method, phone)}
            userPin={currentUser?.withdrawalPin}
            onSetPin={handleSetUserPin}
          />
      )}

      {showHistory && <HistoryModal transactions={currentUser?.transactions || []} onClose={() => setShowHistory(false)} />}
      {showBetHistory && <BetHistoryModal bets={currentUser?.betHistory || []} onClose={() => setShowBetHistory(false)} />}
      
      {showAgentPanel && currentUser && (
          <AgentPanel 
              user={currentUser}
              onClose={() => setShowAgentPanel(false)}
              onApply={applyForAgent}
              onWithdraw={handleAgentWithdraw}
              onChat={handleAgentChat}
              onPinAction={handleAgentPinAction}
              onAgentTools={handleAgentTools}
              onLookupUser={lookupUserByUID}
              onDirectMessage={handleAgentDirectMessage}
          />
      )}

      {showAdminPanel && (
        <AdminPanel 
          transactions={[]} 
          settings={adminSettings}
          onClose={() => setShowAdminPanel(false)}
          onAction={handleAdminAction}
          onUpdateSettings={setAdminSettings}
          queueVoice={(text) => { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); window.speechSynthesis.speak(u); }} // Dedicated Admin Voice Channel
          supportMessages={supportMessages}
          onAdminReply={handleAdminReply}
          onManageUsers={handleUserManagement}
          onAdminAgentReply={handleAdminAgentReply} 
        />
      )}

      {showPromo && (
        <PromoModal 
            onClose={handleClosePromo} 
            onClaim={() => { handleClosePromo(); setShowDeposit(true); }} 
            isReferral={!!referralCodeFromUrl} 
        />
      )}

      {showSupport && (
          <SupportModal 
            messages={supportMessages} 
            user={currentUser}
            onClose={() => setShowSupport(false)} 
            onSendMessage={handleSendMessage} 
          />
      )}
    </div>
  );
};

export default App;
