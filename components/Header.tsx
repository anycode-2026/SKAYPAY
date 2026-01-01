
import React, { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  isLoggedIn: boolean;
  username?: string;
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
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-40 bg-[#000d1a]/95 backdrop-blur-xl border-b border-white/5 px-3 md:px-6 py-2 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* LEFT: LOGO */}
        <div className="flex items-center cursor-pointer group" onClick={onLogoClick}>
          <img 
            src="https://aviator.digirg-demo.pp.ua/images/logo.png" 
            alt="Logo" 
            className="h-8 md:h-10 transition-transform group-hover:scale-105" 
          />
          <span className="ml-2 hidden sm:block text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase">
            SKY <span className="text-red-600">HIGH</span>
          </span>
        </div>

        {/* RIGHT: CONTROLS & USER */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {!isLoggedIn ? (
            // GUEST VIEW
            <div className="flex items-center gap-2">
              <button 
                onClick={onOpenLogin}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/10 transition-all"
              >
                Login
              </button>
              <button 
                onClick={onOpenRegister}
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-black text-xs uppercase hover:bg-red-700 shadow-lg shadow-red-900/30 transition-all animate-pulse"
              >
                Sign Up
              </button>
            </div>
          ) : (
            // LOGGED IN VIEW
            <div className="flex items-center gap-3 relative" ref={menuRef}>
              
              {/* SPEAKER TOGGLE (Restored Green/Red Style) */}
              {onToggleMute && (
                  <button 
                    onClick={onToggleMute}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all shadow-lg active:scale-95 ${!isMuted ? 'bg-green-500/20 border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}
                  >
                      <span className="material-symbols-outlined text-lg">
                          {isMuted ? 'volume_off' : 'volume_up'}
                      </span>
                  </button>
              )}

              {/* BALANCE PILL (Updated: Smaller text size, Bold) */}
              <div 
                onClick={onOpenDeposit}
                className="flex items-center gap-3 bg-gradient-to-r from-[#001b36] to-[#002540] border border-white/10 pl-4 pr-1.5 py-1.5 rounded-full cursor-pointer hover:border-blue-500/50 transition-all group shadow-[0_0_20px_rgba(0,0,0,0.4)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex flex-col items-end relative z-10">
                  <span className="text-sm md:text-base font-black text-white leading-none group-hover:text-blue-300 transition-colors tracking-wide font-mono">৳ {balance.toLocaleString()}</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-t from-blue-600 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-white/20 relative z-10">
                  <span className="material-symbols-outlined text-white text-[10px] font-black">add</span>
                </div>
              </div>

              {/* USER AVATAR - RED MAN ICON STYLE */}
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)] overflow-hidden relative group ${showMenu ? 'border-yellow-400 scale-105' : 'border-red-500'}`}
              >
                {/* Red Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-red-600 to-red-900"></div>
                
                {/* Man Icon */}
                <span className="material-symbols-outlined text-white text-2xl relative z-10 drop-shadow-md group-hover:scale-110 transition-transform">person</span>
                
                {/* Status Dot */}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-red-900 rounded-full z-20"></div>
              </button>

              {/* RICH DROPDOWN MENU */}
              {showMenu && (
                <div className="absolute right-0 top-14 w-72 bg-[#001529] rounded-2xl border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
                  
                  {/* Menu Header */}
                  <div className="p-5 bg-gradient-to-r from-red-900/40 to-blue-900/20 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-6xl">account_circle</span></div>
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Active Player</p>
                    <p className="text-lg text-white font-black truncate">{username || 'Player'}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">UID: {Math.floor(Math.random() * 900000) + 100000}</p>
                  </div>

                  {/* Quick Actions Grid */}
                  <div className="p-3 grid grid-cols-2 gap-2">
                      <button onClick={() => { onOpenDeposit(); setShowMenu(false); }} className="bg-green-900/10 hover:bg-green-900/20 border border-green-500/20 rounded-xl p-3 flex flex-col items-center gap-1 transition-all group">
                          <span className="material-symbols-outlined text-green-500 group-hover:scale-110 transition-transform">add_circle</span>
                          <span className="text-[10px] font-bold text-green-400 uppercase">Deposit</span>
                      </button>
                      <button onClick={() => { onOpenWithdraw(); setShowMenu(false); }} className="bg-orange-900/10 hover:bg-orange-900/20 border border-orange-500/20 rounded-xl p-3 flex flex-col items-center gap-1 transition-all group">
                          <span className="material-symbols-outlined text-orange-500 group-hover:scale-110 transition-transform">payments</span>
                          <span className="text-[10px] font-bold text-orange-400 uppercase">Withdraw</span>
                      </button>
                  </div>

                  {/* Menu List */}
                  <div className="px-2 pb-2 space-y-1">
                    <button onClick={() => { onOpenBetHistory(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all">
                        <span className="material-symbols-outlined text-purple-400">casino</span>
                        <span className="text-xs font-bold uppercase">My Bets</span>
                    </button>
                    
                    <button onClick={() => { onOpenHistory(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all">
                        <span className="material-symbols-outlined text-blue-400">receipt_long</span>
                        <span className="text-xs font-bold uppercase">Transactions</span>
                    </button>

                    {onOpenAgent && (
                        <button onClick={() => { onOpenAgent(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all">
                            <span className="material-symbols-outlined text-yellow-400">handshake</span>
                            <span className="text-xs font-bold uppercase">Agent Panel</span>
                        </button>
                    )}

                    {onOpenSupport && (
                        <button onClick={() => { onOpenSupport(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all">
                            <span className="material-symbols-outlined text-pink-400">support_agent</span>
                            <span className="text-xs font-bold uppercase">Support</span>
                        </button>
                    )}

                    {/* SKY PAY (Admin Control Replaced) */}
                    {onOpenAdmin && (
                        <button onClick={() => { onOpenAdmin(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-900/20 text-white transition-all border border-red-500/20 mt-1 shadow-[0_0_10px_rgba(220,38,38,0.1)] group">
                            <span className="material-symbols-outlined text-red-500 group-hover:scale-110 transition-transform">admin_panel_settings</span>
                            <span className="text-xs font-black uppercase tracking-wider text-red-500 group-hover:text-red-400">SKY PAY</span>
                        </button>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="p-3 border-t border-white/5 bg-black/20">
                    <button onClick={() => { onLogout(); setShowMenu(false); }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-red-600 hover:text-white text-gray-400 font-bold text-xs uppercase transition-all">
                        <span className="material-symbols-outlined text-sm">logout</span> Log Out
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
