
import React, { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  isLoggedIn: boolean;
  username?: string; // This is now UID
  balance: number;
  siteTitle: string; 
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onLogout: () => void;
  onLogoClick: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenHistory: () => void;
  onOpenBetHistory: () => void;
  onOpenAdmin?: () => void; 
  onOpenSupport?: () => void;
  onOpenAgent?: () => void; 
  isMuted?: boolean;
  onToggleMute?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isLoggedIn, 
  username,
  balance,
  siteTitle,
  onOpenLogin, 
  onOpenRegister, 
  onLogout,
  onLogoClick,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenHistory,
  onOpenBetHistory,
  onOpenAdmin,
  onOpenSupport,
  onOpenAgent,
  isMuted,
  onToggleMute
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoggedIn) {
      setIsFetchingData(true);
      const timer = setTimeout(() => setIsFetchingData(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#000d1a]/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-white/5 px-4 md:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div 
          className="flex items-center cursor-pointer group"
          onClick={onLogoClick}
        >
          <img 
            src="https://aviator.digirg-demo.pp.ua/images/logo.png" 
            alt="Logo" 
            className="h-9 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" 
          />
          <span className="ml-2 hidden sm:block text-xl font-black tracking-tighter text-white uppercase italic">
            {siteTitle.split(' ')[0]} <span className="text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]">{siteTitle.split(' ').slice(1).join(' ')}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={onOpenRegister}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 uppercase tracking-wider"
              >
                Join Now
              </button>
              <button 
                onClick={onOpenLogin}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black border border-white/10 text-xs transition-all active:scale-95 uppercase tracking-wider"
              >
                Login
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 relative" ref={menuRef}>
              
              {/* Mute Toggle Button */}
              {onToggleMute && (
                  <button 
                    onClick={onToggleMute}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border border-white/10 transition-all active:scale-90 ${isMuted ? 'bg-red-900/20 text-red-500' : 'bg-green-900/20 text-green-500'}`}
                  >
                      <span className="material-symbols-outlined text-lg">{isMuted ? 'volume_off' : 'volume_up'}</span>
                  </button>
              )}

              <div 
                onClick={onOpenDeposit}
                className={`flex items-center gap-2 bg-[#001b36] hover:bg-[#002a4d] border border-white/10 px-4 py-1.5 rounded-full cursor-pointer transition-all active:scale-95 group shadow-inner ${isFetchingData ? 'animate-pulse' : ''}`}
              >
                <div className="flex flex-col items-start">
                  <span className="text-[8px] text-gray-500 font-bold uppercase leading-none mb-0.5">Balance</span>
                  {isFetchingData ? (
                    <div className="h-4 w-16 bg-white/10 rounded"></div>
                  ) : (
                    <span className="text-sm font-black text-white tabular-nums">৳ {balance.toLocaleString()}</span>
                  )}
                </div>
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                  <span className="material-symbols-outlined text-green-500 group-hover:text-white text-sm font-bold">add</span>
                </div>
              </div>
              
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-rose-900 flex items-center justify-center border-2 border-white/10 shadow-lg hover:shadow-red-500/20 transition-all active:scale-90 ${isFetchingData ? 'opacity-50' : ''}`}
              >
                <span className="material-symbols-outlined text-white text-2xl">person</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-14 w-60 bg-[#001529]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden ring-1 ring-white/10">
                  <div className="p-4 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Player UID</p>
                    <p className="text-xl text-white font-black italic tracking-widest">{username}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button onClick={() => { onOpenDeposit(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-600/10 text-green-500 transition-all text-sm font-bold">
                      <span className="material-symbols-outlined text-lg">add_circle</span> Deposit
                    </button>
                    <button onClick={() => { onOpenWithdraw(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-600/10 text-orange-500 transition-all text-sm font-bold">
                      <span className="material-symbols-outlined text-lg">account_balance_wallet</span> Withdraw
                    </button>
                    {onOpenAgent && (
                        <button onClick={() => { onOpenAgent(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-yellow-600/10 text-yellow-500 transition-all text-sm font-bold">
                            <span className="material-symbols-outlined text-lg">handshake</span> Agent Panel
                        </button>
                    )}
                    {onOpenSupport && (
                        <button onClick={() => { onOpenSupport(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-pink-600/10 text-pink-500 transition-all text-sm font-bold">
                            <span className="material-symbols-outlined text-lg">support_agent</span> Live Support
                        </button>
                    )}
                    <button onClick={() => { onOpenBetHistory(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-600/10 text-purple-500 transition-all text-sm font-bold">
                      <span className="material-symbols-outlined text-lg">casino</span> Bet History
                    </button>
                    <button onClick={() => { onOpenHistory(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-600/10 text-blue-500 transition-all text-sm font-bold">
                      <span className="material-symbols-outlined text-lg">history</span> Transactions
                    </button>
                    
                    {onOpenAdmin && (
                        <button onClick={() => { onOpenAdmin(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-900/20 text-red-500 transition-all text-sm font-bold border-t border-white/5 mt-1">
                          <span className="material-symbols-outlined text-lg">shield_person</span> [SKYPAY]
                        </button>
                    )}

                    <div className="my-1 border-t border-white/5"></div>
                    <button onClick={() => { onLogout(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-600/20 text-red-500 transition-all text-sm font-bold">
                      <span className="material-symbols-outlined text-lg">logout</span> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
