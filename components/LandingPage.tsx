
import React, { useState, useEffect } from 'react';
import { GameType, ExternalGame } from '../App';
import GameGrid from './GameGrid';

interface LandingPageProps {
  onPlay: (gameType?: GameType) => void;
  userBalance?: number;
  isLoggedIn?: boolean;
  externalGames?: ExternalGame[]; // Prop added
}

const LandingPage: React.FC<LandingPageProps> = ({ onPlay, userBalance, isLoggedIn, externalGames }) => {
  const [withdrawals, setWithdrawals] = useState([
    { user: '88***41', amt: '৳15,400', time: 'Just now' },
    { user: '01***19', amt: '৳2,500', time: '1m ago' },
    { user: '94***88', amt: '৳45,000', time: '3m ago' },
    { user: '17***50', amt: '৳8,200', time: '5m ago' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const prefixes = ['017', '019', '018', '013', '014', '016'];
      const newUser = prefixes[Math.floor(Math.random() * prefixes.length)] + '***' + Math.floor(10 + Math.random() * 89);
      const newAmtArr = [1200, 2500, 5000, 12000, 28000, 500, 900, 75000];
      const newAmt = '৳' + newAmtArr[Math.floor(Math.random() * newAmtArr.length)].toLocaleString();
      setWithdrawals(prev => [{ user: newUser, amt: newAmt, time: 'Just now' }, ...prev.slice(0, 3)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGameClick = (type: GameType) => {
      if (isLoggedIn === false) {
          onPlay('aviator'); // Trigger Login Modal
          return;
      }
      if ((userBalance || 0) <= 0) {
          alert("Insufficient Balance! Please Deposit to Play.");
          return;
      }
      onPlay(type);
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#000a16] pb-24 font-sans">
      {/* Hero Header - Original Style */}
      <div className="relative min-h-[35vh] flex items-center justify-center py-6 bg-gray-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#000d1a] via-transparent to-[#000a16] z-10"></div>
          <img 
            src="https://image.pollinations.ai/prompt/casino%20banner%20aviator%20plane%20flying%20neon%20city%20background?width=800&height=400&nologo=true" 
            className="w-full h-full object-cover opacity-30" 
            alt="background"
          />
        </div>

        <div className="relative z-20 text-center px-4 max-w-xl space-y-4">
          <div className="relative inline-block scale-90">
            <div className="relative w-32 h-32 mx-auto rounded-[24px] shadow-2xl border border-white/10 bg-gray-800 overflow-hidden">
                <img 
                src="https://image.pollinations.ai/prompt/aviator%20game%20logo%20red%20plane%20vector%20icon?width=200&height=200&nologo=true&seed=99" 
                className="w-full h-full object-cover" 
                alt="Hero Logo"
                />
            </div>
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black px-2.5 py-1 rounded-full border border-white/10 animate-pulse">LIVE</div>
          </div>

          <div className="space-y-0.5">
            <h1 className="text-4xl font-black text-white italic tracking-tighter leading-none">
              SKY <span className="text-red-600">HIGH</span>
            </h1>
            <p className="text-gray-400 text-[9px] font-black tracking-[0.2em] uppercase italic opacity-60">Professional Crash Protocol</p>
          </div>
          
          <button 
            onClick={() => onPlay('aviator')}
            className="px-12 py-3 font-black text-white bg-red-600 rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-red-900/40 text-sm uppercase tracking-widest"
          >
            PLAY AVIATOR
          </button>
        </div>
      </div>

      {/* NEW MODULAR GAME GRID COMPONENT */}
      <GameGrid onGameSelect={handleGameClick} externalGames={externalGames} />

      {/* Trust Box */}
      <div className="mt-4 mx-3 p-4 bg-[#001529]/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between mb-3 px-1">
           <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-500 text-base">verified</span>
              <h3 className="text-white font-black text-[10px] uppercase tracking-widest">Recent Payouts</h3>
           </div>
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="space-y-2 relative z-10">
          {withdrawals.map((w, i) => (
            <div key={i} className={`flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5`}>
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-600/10 flex items-center justify-center text-blue-500">
                    <span className="material-symbols-outlined text-xs">account_balance_wallet</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white">{w.user}</p>
                    <p className="text-[7px] text-gray-500 font-bold">{w.time}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-green-500 font-black text-[10px]">{w.amt}</p>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
