
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BetRecord } from './BetHistoryModal'; 

interface LiveBet {
  id: string;
  user: string;
  amount: number;
  multiplier?: number;
  payout?: number;
  status: 'betting' | 'cashed' | 'lost';
  isHighRoller?: boolean;
  targetMultiplier?: number; // Internal target for simulation
}

interface GameViewProps {
  balance: number;
  setBalance: (newBalance: number | ((prev: number) => number)) => void;
  onRecordBet: (bet: { amount: number; multiplier: number; status: 'win' | 'loss'; payout: number }) => void;
  forcedCrashPoint: number | null; 
  onConsumeCrashPoint: () => void; 
  isMuted?: boolean; 
  queueVoice: (text: string) => void; 
  myBetHistory: BetRecord[]; 
}

const generateInitialHistory = () => {
  return Array.from({ length: 18 }, () => {
    const r = Math.random();
    if (r < 0.4) return parseFloat((1.01 + Math.random() * 0.9).toFixed(2));
    if (r < 0.8) return parseFloat((2.0 + Math.random() * 8.0).toFixed(2));
    return parseFloat((10.0 + Math.random() * 90.0).toFixed(2));
  }).reverse();
};

const formatCurrencyShort = (amt: number) => {
    if (amt >= 10000000) return (amt / 10000000).toFixed(2) + ' Cr';
    if (amt >= 100000) return (amt / 100000).toFixed(2) + ' L';
    if (amt >= 1000) return (amt / 1000).toFixed(1) + 'k';
    return amt.toString();
};

const GameView: React.FC<GameViewProps> = ({ 
  balance, 
  setBalance, 
  onRecordBet, 
  forcedCrashPoint, 
  onConsumeCrashPoint, 
  isMuted = false, 
  queueVoice, 
  myBetHistory 
}) => {
  // Game State
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<'betting' | 'flying' | 'crashed'>('betting');
  const [countdown, setCountdown] = useState(5);
  const [history, setHistory] = useState<number[]>(generateInitialHistory());
  const [winModal, setWinModal] = useState<{show: boolean, amount: number} | null>(null);
  
  // Betting State
  const [bet, setBet] = useState({ 
    amount: 100, 
    active: false, 
    autoCashOut: 2.0, 
    useAuto: false, 
    cashedOut: false,
    waitingNext: false 
  });

  // Live Data State
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'top' | 'my'>('all');
  const [totalPool, setTotalPool] = useState(0);

  // Refs for Game Loop
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crashPoint = useRef(1.5);
  const crashProcessed = useRef(false);
  const visualMultiplierRef = useRef(1.00);
  const pendingRigRef = useRef<number | null>(null);
  
  // Audio Refs (Background Music & SFX)
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<{ [key: string]: HTMLAudioElement } | null>(null);

  // Update rig point if prop changes
  useEffect(() => {
     if(forcedCrashPoint !== null) {
         pendingRigRef.current = forcedCrashPoint;
     }
  }, [forcedCrashPoint]);

  // --- AUDIO SYSTEM (Music & SFX) ---
  useEffect(() => {
      // 1. Background Music
      if (!musicRef.current) {
          // Deep Space / Sci-Fi Tension Track
          musicRef.current = new Audio('https://cdn.pixabay.com/audio/2022/03/24/audio_3829030224.mp3'); 
          musicRef.current.loop = true;
          musicRef.current.volume = 0.3; // Lower volume for background
      }

      // 2. Sound Effects
      if (!sfxRef.current) {
          sfxRef.current = {
            bet: new Audio('https://cdn.pixabay.com/audio/2024/08/07/audio_1c53e02553.mp3'), // Crisp Coin/Click
            takeoff: new Audio('https://cdn.pixabay.com/audio/2022/03/24/audio_3497d3942c.mp3'), // Sci-Fi Whoosh
            crash: new Audio('https://cdn.pixabay.com/audio/2021/08/09/audio_9678822839.mp3'), // Explosion/Impact
            cashout: new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3') // Win/Coins
          };
          // Preload
          Object.values(sfxRef.current).forEach((audio) => {
              const a = audio as HTMLAudioElement;
              a.volume = 0.5;
              a.preload = 'auto';
          });
      }

      const audio = musicRef.current;

      if (gameState === 'flying' && !isMuted) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
              playPromise.catch((e) => {
                  console.log("Auto-play prevented, waiting for interaction", e);
              });
          }
      } else {
          audio.pause();
          if (gameState === 'betting') audio.currentTime = 0; 
      }

      return () => {
          audio.pause();
      };
  }, [gameState, isMuted]);

  // SFX Player Helper
  const playSfx = useCallback((type: 'bet' | 'takeoff' | 'crash' | 'cashout') => {
    if (isMuted || !sfxRef.current) return;
    const audio = sfxRef.current[type];
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }
  }, [isMuted]);

  // Mute logic sync for music
  useEffect(() => {
      if (musicRef.current) {
          if (isMuted) musicRef.current.pause();
          else if (gameState === 'flying') musicRef.current.play().catch(() => {});
      }
  }, [isMuted, gameState]);


  // --- GAME LOGIC ---

  const generateSimulatedBets = () => {
    const newBets: LiveBet[] = [];
    const prefixes = ['017', '019', '018', '016', '013'];
    const count = 15 + Math.floor(Math.random() * 15);
    let pool = 0;
    for (let i = 0; i < count; i++) {
      const isHigh = Math.random() > 0.90;
      const amt = isHigh ? 
          [5000, 10000, 20000][Math.floor(Math.random() * 3)] : 
          [100, 200, 500, 1000][Math.floor(Math.random() * 4)];
      
      const target = 1.1 + (Math.random() * Math.random() * 10); 
      
      pool += amt;
      newBets.push({
        id: Math.random().toString(36).substr(2, 5),
        user: prefixes[Math.floor(Math.random() * prefixes.length)] + '***' + Math.floor(10 + Math.random() * 89),
        amount: amt,
        status: 'betting',
        isHighRoller: isHigh,
        targetMultiplier: target
      });
    }
    newBets.sort((a, b) => b.amount - a.amount);
    setLiveBets(newBets);
    setTotalPool(pool);
  };

  // Main Game Loop
  useEffect(() => {
    let interval: any;
    
    // Betting Phase
    if (gameState === 'betting') {
      visualMultiplierRef.current = 1.00;
      crashProcessed.current = false; 
      
      if (countdown === 5) {
        generateSimulatedBets();
        queueVoice("Please place your bet");
      }

      if (countdown > 0) {
        interval = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      } else {
        // Start Flight
        // Determine Crash Point
        if (pendingRigRef.current !== null) {
          crashPoint.current = pendingRigRef.current;
          onConsumeCrashPoint(); 
          pendingRigRef.current = null; 
        } else {
          const rand = Math.random();
          if (rand < 0.45) crashPoint.current = 1.00 + Math.random(); 
          else if (rand < 0.75) crashPoint.current = 2.00 + Math.random() * 8.0;
          else if (rand < 0.90) crashPoint.current = 10.00 + Math.random() * 90.0;
          else crashPoint.current = 100.00 + Math.random() * 900.0;
        }

        setGameState('flying');
        setMultiplier(1.00);
        visualMultiplierRef.current = 1.00;
        
        queueVoice("Taking off");
        playSfx('takeoff'); // SFX: Takeoff
        
        setBet(b => ({
          ...b,
          active: b.waitingNext ? true : b.active,
          waitingNext: false,
          cashedOut: false
        }));
      }
    } 
    // Flying Phase
    else if (gameState === 'flying') {
      interval = setInterval(() => {
        setMultiplier(prev => {
          // Growth Logic
          const growthBase = 0.006; 
          const growthFactor = Math.log10(Math.max(1, prev)) * 0.01; 
          const next = prev + (prev * (growthBase + growthFactor));
          
          // Real-time Bot Updates
          setLiveBets(current => {
              return current.map(b => {
                  if (b.status === 'betting' && b.targetMultiplier && next >= b.targetMultiplier) {
                      return {
                          ...b,
                          status: 'cashed',
                          multiplier: b.targetMultiplier,
                          payout: Math.floor(b.amount * b.targetMultiplier)
                      };
                  }
                  return b;
              });
          });

          // Auto Cashout Logic
          if (bet.active && !bet.cashedOut && bet.useAuto && next >= bet.autoCashOut) {
            handleCashOutInternal(next);
          }

          // Crash Check
          if (next >= crashPoint.current) {
            if (!crashProcessed.current) {
               crashProcessed.current = true; 
               setGameState('crashed');
               
               // Specific voice sequence: Crash -> Place Bet
               queueVoice("Plane Crashed");
               playSfx('crash'); // SFX: Crash
               
               setHistory(h => [parseFloat(next.toFixed(2)), ...h.slice(0, 18)]);
               
               if (bet.active && !bet.cashedOut) {
                 onRecordBet({ amount: bet.amount, multiplier: next, status: 'loss', payout: 0 });
               }

               setLiveBets(current => current.map(b => b.status === 'betting' ? { ...b, status: 'lost' } : b));
               setBet(b => ({ ...b, active: false })); 
               
               setTimeout(() => {
                 setGameState('betting');
                 setCountdown(5);
               }, 3000);
            }
            return next; 
          }
          return next;
        });
      }, 20); 
    }

    return () => {
      if (interval) {
        clearInterval(interval);
        clearTimeout(interval);
      }
    };
  }, [gameState, countdown, bet.waitingNext, bet.active, bet.useAuto, bet.autoCashOut, forcedCrashPoint, queueVoice, onRecordBet, onConsumeCrashPoint, playSfx]);


  const handleCashOutInternal = (currentMult: number) => {
    if (bet.active && !bet.cashedOut) {
      const winAmount = bet.amount * currentMult;
      setBalance(prev => prev + winAmount);
      onRecordBet({ amount: bet.amount, multiplier: currentMult, status: 'win', payout: winAmount });
      setBet(b => ({ ...b, cashedOut: true, active: false })); 
      setWinModal({ show: true, amount: parseFloat(winAmount.toFixed(2)) });
      queueVoice("Cash out successful"); 
      playSfx('cashout'); // SFX: Cashout
      setTimeout(() => {
        setBet(b => ({ ...b, cashedOut: false, waitingNext: false })); 
        setWinModal(null);
      }, 2000); // Wait a bit longer to show win
    }
  };

  // --- USER ACTIONS ---
  const handlePlaceBet = () => {
    // Ensure music context is ready on user interaction
    if (musicRef.current && musicRef.current.paused && !isMuted && gameState === 'flying') {
        musicRef.current.play().catch(() => {});
    }

    if (balance < bet.amount) {
      alert("Insufficient Balance");
      return;
    }
    setBalance(prev => prev - bet.amount); 
    playSfx('bet'); // SFX: Bet Placed
    if (gameState === 'betting') {
      setBet(b => ({ ...b, active: true, waitingNext: false, cashedOut: false }));
    } else {
      setBet(b => ({ ...b, waitingNext: true, cashedOut: false }));
    }
  };

  const handleCancelBet = () => {
    if (!bet.active && !bet.waitingNext) return;
    setBalance(prev => prev + bet.amount); 
    playSfx('bet'); // SFX: Bet Cancel (reuse click)
    setBet(b => ({ ...b, active: false, waitingNext: false }));
  };

  const handleManualCashOut = () => {
      if (gameState === 'flying') {
          handleCashOutInternal(multiplier);
      }
  };

  // --- CANVAS RENDERING ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const targetMult = gameState === 'flying' ? multiplier : 1.00;
      visualMultiplierRef.current += (targetMult - visualMultiplierRef.current) * 0.15;
      
      // FIXED SPEED: Keeps background movement "Normal" and steady regardless of multiplier
      const speedFactor = gameState === 'flying' ? 3 : 0.5; 
      
      const scrollOffset = (Date.now() / 20) * speedFactor % 40;
      
      ctx.save();
      
      // Professional Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      
      // Vertical Lines (Moving)
      for (let x = -40; x < canvas.width; x += 40) {
          const drawX = x - scrollOffset;
          ctx.beginPath();
          ctx.moveTo(drawX, 0);
          ctx.lineTo(drawX, canvas.height);
          ctx.stroke();
      }
      
      // Horizontal Lines (Static)
      for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
      }
      ctx.restore();

      if (gameState === 'flying') {
        // Curve visualization
        const visualProgress = Math.min(1, Math.log10(visualMultiplierRef.current) / 4);
        const startX = 60, startY = canvas.height - 30;
        const targetX = canvas.width - 60, targetY = 30;
        const x = startX + (visualProgress * (targetX - startX));
        const y = startY - (visualProgress * (startY - targetY));
        
        ctx.shadowBlur = 25; ctx.shadowColor = 'rgba(220, 38, 38, 0.8)';
        const grad = ctx.createLinearGradient(0, canvas.height, x, y);
        grad.addColorStop(0, 'rgba(220, 38, 38, 0)'); grad.addColorStop(1, 'rgba(220, 38, 38, 1)');
        
        ctx.beginPath(); ctx.strokeStyle = grad; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.moveTo(0, canvas.height); ctx.lineTo(x, y); ctx.stroke();
        ctx.shadowBlur = 0;

        // Plane
        ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.atan2(startY - targetY, targetX - startX));
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.ellipse(0, 0, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(4, -22); ctx.lineTo(15, 0); ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(24, 0, 3, 0, Math.PI * 2); ctx.fill(); // Propeller center
        ctx.restore();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [gameState, multiplier]);

  // Filters
  const displayedBets = activeTab === 'all' ? liveBets : 
                        activeTab === 'top' ? liveBets.filter(b => b.amount >= 5000) : 
                        myBetHistory.map(b => ({
                            id: b.id,
                            user: 'YOU',
                            amount: b.amount,
                            multiplier: b.multiplier,
                            payout: b.payout,
                            status: b.status === 'win' ? 'cashed' : 'lost', // MAP STATUS CORRECTLY
                            isHighRoller: false
                        })); 

  return (
    <div className="w-full max-w-[400px] mx-auto px-2 py-2 space-y-2 relative">
      {/* History Bar */}
      <div className="flex gap-1.5 p-2 bg-black/50 rounded-xl overflow-x-auto scrollbar-hide border border-white/5 shadow-inner">
        {history.map((val, i) => (
          <div key={i} className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all ${val > 10 ? 'border-red-500/60 bg-red-500/5 text-red-400' : val > 2 ? 'border-purple-500/40 bg-purple-500/5 text-purple-400' : 'text-blue-400 border-blue-500/40 bg-blue-500/5'}`}>{val.toFixed(2)}x</div>
        ))}
      </div>

      {/* Game Canvas with PROFESSIONAL BACKGROUND */}
      <div className="relative bg-[#0b0f19] rounded-[24px] border border-white/10 overflow-hidden shadow-2xl h-[180px]">
        
        {/* NEW TOP POSITIONED WIN MODAL */}
        {winModal && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none w-64 animate-in slide-in-from-top-4 fade-in zoom-in duration-300">
               <div className="bg-[#001529]/95 backdrop-blur-xl border-2 border-green-500/50 p-2 rounded-full text-center shadow-[0_0_50px_rgba(34,197,94,0.6)] relative overflow-hidden flex items-center gap-3 pr-6 pl-2">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce shrink-0">
                      <span className="material-symbols-outlined text-black text-2xl">check</span>
                  </div>
                  <div className="flex flex-col items-start">
                      <h2 className="text-[10px] font-black text-green-400 uppercase tracking-widest leading-none">YOU WON!</h2>
                      <p className="text-xl font-black text-white drop-shadow-sm leading-none">৳ {winModal.amount.toLocaleString()}</p>
                  </div>
               </div>
            </div>
        )}

        {/* CSS Background Grid Overlay */}
        <div className="absolute inset-0 z-0" style={{
            backgroundImage: 'radial-gradient(circle at 50% 100%, #1e293b 0%, #000000 100%)',
        }}></div>
        <div className="absolute inset-0 z-0 opacity-20" style={{
             backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
             backgroundSize: '20px 20px'
        }}></div>

        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          {gameState === 'betting' ? (
            <div className="text-center bg-black/60 px-8 py-4 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="w-8 h-1 bg-red-500 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.4em] mb-1">Next Round</p>
              <h2 className="text-5xl font-black text-white italic leading-none tabular-nums">{countdown}s</h2>
            </div>
          ) : gameState === 'flying' ? (
            <div className="text-center">
              <h1 className="text-[74px] font-black text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] leading-none">{multiplier.toFixed(2)}x</h1>
            </div>
          ) : (
            <div className="text-center animate-in zoom-in duration-200">
              <h2 className="text-xl font-black text-red-600 uppercase mb-1 tracking-tight drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">FLEW AWAY</h2>
              <div className="text-4xl font-black text-white bg-red-600 px-10 py-2.5 rounded-2xl border-2 border-red-500 shadow-[0_0_40px_rgba(220,38,38,0.4)]">{multiplier.toFixed(2)}x</div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} width={450} height={180} className="w-full h-full relative z-10" />
      </div>

      {/* Betting Controls (COMPACT & PREMIUM) */}
      <div className="bg-[#001b36]/95 backdrop-blur-xl p-3 rounded-[32px] border border-white/10 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white font-black text-[9px] uppercase tracking-widest flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isMuted ? 'bg-gray-600' : 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]'}`}></span> 
            {isMuted ? 'SOUND OFF' : 'MUSIC ON'}
          </span>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
            <span className="text-[8px] text-gray-500 font-black uppercase">Auto</span>
            <button onClick={() => { setBet(b => ({...b, useAuto: !b.useAuto})); }} className={`w-8 h-4 rounded-full relative transition-colors ${bet.useAuto ? 'bg-green-600' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${bet.useAuto ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/40 rounded-2xl p-2 border border-white/5 ring-1 ring-white/5">
            <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Bet (৳)</p>
            <input type="number" value={bet.amount === 0 ? '' : bet.amount} onChange={(e) => { const val = e.target.value === '' ? 0 : parseInt(e.target.value); setBet(b => ({...b, amount: val})); }} className="w-full bg-transparent text-lg font-black text-white outline-none tabular-nums" />
          </div>
          <div className={`bg-black/40 rounded-2xl p-2 border border-white/5 ring-1 ring-white/5 transition-opacity ${!bet.useAuto && 'opacity-20 pointer-events-none'}`}>
            <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Auto Cashout (x)</p>
            <input type="number" step="0.1" value={bet.autoCashOut} onChange={(e) => setBet(b => ({...b, autoCashOut: parseFloat(e.target.value)}))} className="w-full bg-transparent text-lg font-black text-white outline-none tabular-nums" />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setBet(b => ({...b, amount: Math.max(10, b.amount / 2)}))} className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl py-2 text-[8px] font-black uppercase text-gray-400 border border-white/5">1/2</button>
          <button onClick={() => setBet(b => ({...b, amount: b.amount * 2}))} className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl py-2 text-[8px] font-black uppercase text-gray-400 border border-white/5">x2</button>
          <button onClick={() => setBet(b => ({...b, amount: 100}))} className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl py-2 text-[8px] font-black uppercase text-gray-400 border border-white/5">Min</button>
          <button onClick={() => setBet(b => ({...b, amount: 5000}))} className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl py-2 text-[8px] font-black uppercase text-gray-400 border border-white/5">Max</button>
        </div>

        {gameState === 'flying' && bet.active && !bet.cashedOut ? (
          <button 
            onClick={handleManualCashOut}
            className="w-full h-[50px] rounded-[16px] bg-gradient-to-r from-yellow-500 to-orange-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] active:scale-95 transition-all relative overflow-hidden group border border-yellow-300 flex flex-row items-center justify-between px-6"
          >
            <div className="flex flex-col items-start">
                <p className="text-[10px] font-black text-yellow-900 uppercase tracking-widest">CASH OUT</p>
                <p className="text-[9px] text-white font-bold opacity-90">@{multiplier.toFixed(2)}x</p>
            </div>
            <p className="text-xl font-black text-white drop-shadow-md tabular-nums">৳ {Math.floor(bet.amount * multiplier).toLocaleString()}</p>
          </button>
        ) : bet.waitingNext || (gameState === 'betting' && bet.active) ? (
          <button 
            onClick={handleCancelBet}
            className="w-full py-3 bg-red-600/20 border border-red-500/50 rounded-[16px] text-red-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
          >
            CANCEL BET
          </button>
        ) : (
          <button 
            onClick={handlePlaceBet}
            disabled={bet.active}
            className={`w-full py-3 rounded-[16px] font-black text-sm uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border-t border-white/20 ${bet.active ? 'bg-green-900/50 border-green-800 cursor-not-allowed opacity-80' : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'}`}
          >
            {bet.active ? (
                <>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-white">BET ACTIVE</span>
                </>
            ) : (
                <span className="text-white">PLACE BET</span>
            )}
          </button>
        )}
      </div>

      {/* Live Bets Panel - Real Time Updates */}
      <div className="bg-[#001529] rounded-[24px] border border-white/5 overflow-hidden">
          <div className="flex bg-black/40 p-1 m-2 rounded-xl">
              <button onClick={() => setActiveTab('all')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>All Bets</button>
              <button onClick={() => setActiveTab('top')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'top' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>High Rollers</button>
              <button onClick={() => setActiveTab('my')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'my' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>My Bets</button>
          </div>
          
          <div className="px-4 pb-2 flex justify-between text-[8px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-2">
              <span>User</span>
              <span>Bet / Win</span>
          </div>

          <div className="h-[200px] overflow-y-auto px-2 space-y-1 custom-scroll pb-2">
              {displayedBets.map((b, i) => (
                  <div key={i} className={`flex justify-between items-center p-2 rounded-lg transition-colors duration-300 ${
                      b.status === 'cashed' ? 'bg-green-500/10 border border-green-500/20' : 
                      b.status === 'lost' ? 'bg-red-500/10 border border-red-500/20' :
                      b.user === 'YOU' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/5 border border-white/5'
                  }`}>
                      <div className="flex items-center gap-2">
                          {b.isHighRoller && <span className="material-symbols-outlined text-yellow-500 text-xs">diamond</span>}
                          <p className={`text-[10px] font-bold ${b.user === 'YOU' ? 'text-blue-400' : 'text-gray-300'}`}>{b.user}</p>
                      </div>
                      <div className="text-right">
                          <p className={`text-[10px] font-black ${
                              b.status === 'cashed' ? 'text-green-500' : 
                              b.status === 'lost' ? 'text-red-500 line-through opacity-70' : 'text-white'
                          }`}>৳{formatCurrencyShort(b.amount)}</p>
                          
                          {b.status === 'cashed' && (
                              <p className="text-[9px] font-black text-green-400 bg-green-900/30 px-1.5 rounded inline-block mt-0.5">
                                  {b.multiplier}x (+৳{formatCurrencyShort(b.payout || 0)})
                              </p>
                          )}
                          
                          {b.status === 'lost' && (
                              <p className="text-[9px] font-bold text-red-500/70 mt-0.5">CRASHED</p>
                          )}
                      </div>
                  </div>
              ))}
          </div>
          
          <div className="bg-[#000a16] p-2 text-center border-t border-white/5">
              <p className="text-[9px] text-gray-500 font-bold uppercase">Total Pool: <span className="text-green-500">৳{formatCurrencyShort(totalPool)}</span></p>
          </div>
      </div>
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default GameView;
