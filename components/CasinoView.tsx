
import React, { useState, useEffect, useRef } from 'react';
import { GameType, ExternalGame } from '../App';

interface CasinoViewProps {
  gameType: GameType;
  balance: number;
  setBalance: (newBalance: number | ((prev: number) => number)) => void;
  isMuted?: boolean;
  onClose: () => void;
  externalGames?: ExternalGame[]; // Added prop
}

// --- HELPER COMPONENTS ---
const JackpotTicker = ({ value }: { value: number }) => (
    <div className="w-full bg-gradient-to-r from-red-900 via-red-700 to-red-900 border-y-2 border-yellow-500 shadow-[0_0_25px_rgba(220,38,38,0.6)] py-2 text-center relative overflow-hidden shrink-0 z-20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-20 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_3s_infinite]"></div>
        <p className="text-[9px] text-yellow-300 font-black uppercase tracking-[0.4em] relative z-10 drop-shadow-sm mb-0.5">Grand Jackpot</p>
        <p className="text-2xl md:text-4xl font-black text-white relative z-10 drop-shadow-[0_3px_0_rgba(0,0,0,0.5)] font-mono tracking-tighter leading-none">
            ৳{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <style>{`
            @keyframes shimmer { 100% { transform: translateX(100%) skewX(12deg); } }
        `}</style>
    </div>
);

// --- SUPER ACE TYPES & LOGIC ---
const CARD_SUITS = ['♠️', '♥️', '♣️', '♦️'];
const ROYALS = ['J', 'Q', 'K', 'A'];

type SuperAceSymbol = {
    id: string;
    val: string;
    isGold: boolean;
    isWild: boolean;
    isScatter: boolean;
    suit?: string;
};

// --- SUPER ACE COMPONENT ---
const SuperAceGame: React.FC<{
    balance: number, 
    setBalance: (n: any) => void, 
    onClose: () => void, 
    playSfx: (t: any) => void 
}> = ({ balance, setBalance, onClose, playSfx }) => {
    // 5 Columns x 4 Rows
    const [grid, setGrid] = useState<SuperAceSymbol[][]>([]);
    const [multiplierLevel, setMultiplierLevel] = useState(0); 
    const [bet, setBet] = useState(10);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winAmount, setWinAmount] = useState(0);
    const [autoSpin, setAutoSpin] = useState(false);
    const [turbo, setTurbo] = useState(false);
    const [freeSpins, setFreeSpins] = useState(0);
    const [showFreeSpinModal, setShowFreeSpinModal] = useState(false);
    
    // New Feature States
    const [currentWin, setCurrentWin] = useState(0);
    const [freeSpinTotalWin, setFreeSpinTotalWin] = useState(0);
    const [showTotalWinModal, setShowTotalWinModal] = useState(false);
    const [collectingWin, setCollectingWin] = useState(false);

    // Jackpot State
    const [jackpot, setJackpot] = useState(124500.50);
    const [showJackpotWin, setShowJackpotWin] = useState(false);
    const [jackpotWinAmount, setJackpotWinAmount] = useState(0);

    // Initial Grid & Jackpot Simulation
    useEffect(() => {
        generateGrid(true);
        // Simulate other players adding to jackpot
        const interval = setInterval(() => {
            setJackpot(prev => prev + Math.random() * 0.5);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Auto Spin & Free Spin Logic
    useEffect(() => {
        let timer: any;
        if (!isSpinning && !showTotalWinModal && !collectingWin && !showJackpotWin) {
            if (freeSpins > 0) {
                timer = setTimeout(() => handleSpin(true), 800); // Fast auto trigger free spin
            } else if (autoSpin && balance >= bet) {
                timer = setTimeout(() => handleSpin(false), 800); // Auto trigger regular spin
            } else if (autoSpin && balance < bet) {
                setAutoSpin(false); // Stop if no balance
            }
        }
        return () => clearTimeout(timer);
    }, [isSpinning, freeSpins, autoSpin, balance, bet, showTotalWinModal, collectingWin, showJackpotWin]);

    const generateSymbol = (): SuperAceSymbol => {
        const rand = Math.random();
        const isGold = Math.random() > 0.8;
        let val = '';
        let isWild = false;
        let isScatter = false;
        let suit = '';

        if (rand > 0.95) { val = 'SCATTER'; isScatter = true; } 
        else if (rand > 0.92) { val = 'WILD'; isWild = true; } 
        else if (rand > 0.6) {
            val = ROYALS[Math.floor(Math.random() * ROYALS.length)];
            suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
        } else {
            val = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
            suit = val;
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            val,
            isGold: ['J','Q','K','A'].includes(val) ? isGold : false,
            isWild,
            isScatter,
            suit
        };
    };

    const generateGrid = (initial = false) => {
        const newGrid = [];
        for(let col=0; col<5; col++) {
            const column = [];
            for(let row=0; row<4; row++) {
                column.push(generateSymbol());
            }
            newGrid.push(column);
        }
        if(!initial) setGrid(newGrid);
        return newGrid; // Return for check
    };

    const handleSpin = (isFree = false) => {
        if (!isFree && balance < bet) return alert("Insufficient Balance");
        
        if (!isFree) {
            setBalance((b: number) => b - bet);
            // Contribute to jackpot
            setJackpot(prev => prev + (bet * 0.05));
        }
        
        setIsSpinning(true);
        setCurrentWin(0); // Reset current spin win visual
        if(!isFree) setMultiplierLevel(0); 
        playSfx('spin');

        // Spin Duration: EXACTLY 1 Second
        const duration = 1000; 

        setTimeout(() => {
            const newGrid = generateGrid();
            setIsSpinning(false);
            
            // Jackpot Trigger Check (Random for demo, typically complex server logic)
            // 0.05% chance on any spin
            if (!isFree && Math.random() < 0.0005) {
                const winJP = jackpot;
                setJackpotWinAmount(winJP);
                setShowJackpotWin(true);
                playSfx('win');
                setJackpot(100000); // Reset base
                
                setTimeout(() => {
                    setBalance((b: number) => b + winJP);
                    setShowJackpotWin(false);
                }, 5000); // Show celebration for 5s
                return; // Skip normal win logic for this rare event to focus on JP
            }

            // Logic: Count Scatters for Free Spins
            let scatterCount = 0;
            newGrid.flat().forEach(s => { if(s.isScatter) scatterCount++; });

            if (scatterCount >= 3 && !isFree) {
                setTimeout(() => {
                    setFreeSpins(prev => prev + 10);
                    setShowFreeSpinModal(true);
                    playSfx('win');
                    setTimeout(() => setShowFreeSpinModal(false), 2000);
                }, 500);
            }

            // Logic: Win Simulation
            const isWin = Math.random() > 0.60; 
            if (isWin) {
                const winBase = bet * (Math.random() * 3 + 0.2);
                const mult = [1, 2, 3, 5][multiplierLevel];
                let finalWin = Math.floor(winBase * mult);
                
                // Big Win logic for demo
                if(Math.random() > 0.95) finalWin += 500;

                setCurrentWin(finalWin);
                setWinAmount(finalWin);
                
                if (isFree) {
                    setFreeSpinTotalWin(prev => prev + finalWin);
                } else {
                    // Normal spin, add to balance after short delay to show "collect"
                    setTimeout(() => {
                        setBalance((b: number) => b + finalWin);
                        setTimeout(() => setCurrentWin(0), 1500); // Clear toolbar after a bit
                    }, 500);
                }
                
                setMultiplierLevel(prev => Math.min(prev + 1, 3)); 
                playSfx('win');
            } else {
                if(!isFree) setMultiplierLevel(0);
                setCurrentWin(0);
            }

            // Decrement Free Spin
            if(isFree) {
                setFreeSpins(prev => {
                    const left = Math.max(0, prev - 1);
                    if (left === 0) {
                        // End of Free Spins
                        setTimeout(() => {
                            setShowTotalWinModal(true);
                            playSfx('win');
                        }, 1000);
                    }
                    return left;
                });
            }

        }, duration);
    };

    // Handle Total Win Collection
    useEffect(() => {
        if (showTotalWinModal) {
            setCollectingWin(true);
            // Simulate collecting animation time
            setTimeout(() => {
                setBalance((b: number) => b + freeSpinTotalWin);
                setFreeSpinTotalWin(0);
                setShowTotalWinModal(false);
                setCollectingWin(false);
            }, 3000);
        }
    }, [showTotalWinModal]);

    const MultiplierBox = ({ val, active }: { val: number, active: boolean }) => (
        <div className={`flex flex-col items-center justify-center w-14 h-9 md:w-16 md:h-10 rounded-lg border-2 transition-all duration-300 ${
            active 
            ? 'bg-gradient-to-b from-yellow-300 to-yellow-600 border-white shadow-[0_0_15px_#fbbf24] scale-110' 
            : 'bg-black/60 border-yellow-900/50 opacity-60'
        }`}>
            <span className={`text-sm font-black ${active ? 'text-black' : 'text-yellow-600'}`}>x{val}</span>
        </div>
    );

    const Card = ({ sym }: { sym: SuperAceSymbol }) => {
        const isRoyal = ['J','Q','K','A'].includes(sym.val);
        const bgColor = sym.isGold 
            ? 'bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-700 border-yellow-300' 
            : 'bg-white border-gray-300';
        
        return (
            <div className={`relative w-full h-full rounded-lg border-[2px] md:border-[3px] flex items-center justify-center shadow-lg overflow-hidden ${
                sym.isWild ? 'bg-purple-900 border-purple-400' : 
                sym.isScatter ? 'bg-red-900 border-yellow-400' : 
                bgColor
            }`}>
                {sym.isWild ? (
                    <div className="text-center">
                        <span className="text-2xl md:text-3xl">🃏</span>
                        <p className="text-[6px] md:text-[8px] font-black text-white bg-purple-600 px-1 rounded mt-1">WILD</p>
                    </div>
                ) : sym.isScatter ? (
                    <div className="text-center">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-full border-4 border-yellow-600 flex items-center justify-center shadow-inner">
                            <span className="text-lg md:text-2xl font-black text-yellow-800">$</span>
                        </div>
                        <p className="text-[6px] md:text-[8px] font-black text-yellow-300 mt-1 uppercase">Scatter</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        {isRoyal && (
                            <div className={`absolute top-0.5 left-1 text-[8px] md:text-xs font-black ${sym.suit === '♥️' || sym.suit === '♦️' ? 'text-red-600' : 'text-black'}`}>
                                {sym.val}
                            </div>
                        )}
                        <div className={`text-3xl md:text-4xl ${sym.suit === '♥️' || sym.suit === '♦️' ? 'text-red-600' : 'text-black'} drop-shadow-sm`}>
                            {sym.suit || sym.val}
                        </div>
                        {sym.isGold && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none animate-pulse"></div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="absolute inset-0 bg-[#2b0c0c] flex flex-col font-sans select-none overflow-hidden">
            {/* CSS for rolling animation - Downward */}
            <style>{`
                @keyframes rollDown {
                    0% { transform: translateY(-100%); filter: blur(8px); }
                    100% { transform: translateY(0); filter: blur(0); }
                }
                .reel-rolling {
                    animation: rollDown 0.2s linear infinite;
                }
                /* Create a blurred strip effect */
                .blur-strip {
                    background: linear-gradient(to bottom, 
                        rgba(255,255,255,0.8) 0%, 
                        rgba(255,215,0,0.5) 20%, 
                        rgba(255,255,255,0.8) 40%, 
                        rgba(255,0,0,0.5) 60%, 
                        rgba(255,255,255,0.8) 100%);
                    filter: blur(8px);
                }
            `}</style>

            {/* JACKPOT TICKER */}
            <JackpotTicker value={jackpot} />

            {/* TOP BAR */}
            <div className="h-14 md:h-16 bg-gradient-to-b from-[#4a0e0e] to-[#2b0c0c] border-b border-[#ffd700]/30 flex justify-between items-center px-4 shadow-xl z-20 shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="bg-black/40 p-1.5 rounded-full border border-white/10 hover:bg-white/10"><span className="material-symbols-outlined text-white text-lg">arrow_back</span></button>
                    <div className="flex flex-col">
                        <span className="text-yellow-400 font-black text-base md:text-lg italic tracking-tighter leading-none drop-shadow-md" style={{ fontFamily: 'serif' }}>SuperAce</span>
                        <span className="text-[8px] text-yellow-600 font-bold uppercase tracking-widest">Jackpot Legend</span>
                    </div>
                </div>
                {freeSpins > 0 && (
                    <div className="bg-red-600 px-3 py-1 rounded-full border border-yellow-400 animate-pulse shadow-[0_0_15px_#ef4444]">
                        <span className="text-white font-black text-xs uppercase">Free Spins: {freeSpins}</span>
                    </div>
                )}
            </div>

            {/* GAME AREA */}
            <div className="flex-grow relative flex flex-col items-center justify-start pt-2 bg-[url('https://img.freepik.com/free-vector/luxury-background-with-gold-details_23-2148962299.jpg')] bg-cover bg-center overflow-hidden">
                
                {/* Multiplier Bar */}
                <div className="w-full max-w-md px-6 mb-2 flex justify-between items-center gap-2">
                    <MultiplierBox val={1} active={multiplierLevel === 0} />
                    <MultiplierBox val={2} active={multiplierLevel === 1} />
                    <MultiplierBox val={3} active={multiplierLevel === 2} />
                    <MultiplierBox val={5} active={multiplierLevel === 3} />
                </div>

                {/* 5x4 Grid Container */}
                <div className="bg-[#1a0505]/90 p-2 md:p-3 rounded-xl border-4 border-[#ffd700] shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    <div className="grid grid-cols-5 gap-1 md:gap-1.5 w-[320px] h-[240px] md:w-[400px] md:h-[300px]">
                        {grid.map((col, cIdx) => (
                            <div key={cIdx} className="relative h-full overflow-hidden rounded-lg bg-black/50">
                                {isSpinning ? (
                                    <div className="absolute inset-0 w-full h-[200%] -top-[100%] reel-rolling">
                                        {/* Simulated blurred strip for rolling effect */}
                                        <div className="w-full h-1/2 blur-strip"></div>
                                        <div className="w-full h-1/2 blur-strip"></div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1 md:gap-1.5 h-full animate-in slide-in-from-top-4 duration-300">
                                        {col.map((sym, rIdx) => (
                                            <div key={sym.id} className="flex-1">
                                                <Card sym={sym} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Win Overlay (Flash) */}
                    {currentWin > 0 && !isSpinning && !showTotalWinModal && !showJackpotWin && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 animate-in zoom-in duration-300 rounded-lg pointer-events-none">
                            <div className="text-center">
                                <h2 className="text-4xl md:text-5xl font-black text-yellow-400 drop-shadow-[0_5px_0_#b45309] italic animate-bounce">WIN!</h2>
                                <p className="text-2xl md:text-3xl font-black text-white mt-2 drop-shadow-md">৳ {currentWin}</p>
                            </div>
                        </div>
                    )}

                    {/* Free Spin Start Notification */}
                    {showFreeSpinModal && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40 animate-in zoom-in duration-300 pointer-events-none">
                            <div className="text-center p-6 bg-gradient-to-b from-purple-900 to-black border-2 border-yellow-400 rounded-2xl shadow-[0_0_50px_#a855f7]">
                                <h2 className="text-3xl font-black text-white uppercase italic">FREE GAMES</h2>
                                <p className="text-5xl font-black text-yellow-400 my-2 drop-shadow-lg">10</p>
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Spins Awarded</p>
                            </div>
                        </div>
                    )}

                    {/* Total Win Modal (End of Free Spins) */}
                    {showTotalWinModal && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 animate-in zoom-in duration-500">
                            <div className="text-center p-8 relative">
                                <div className="absolute inset-0 bg-yellow-500/20 blur-[50px] rounded-full animate-pulse"></div>
                                <h2 className="relative text-4xl font-black text-white uppercase italic drop-shadow-md mb-4">Total Win</h2>
                                <div className="relative text-5xl md:text-6xl font-black text-yellow-400 tracking-tighter drop-shadow-[0_5px_0_#b45309] animate-pulse">
                                    ৳ {freeSpinTotalWin.toLocaleString()}
                                </div>
                                <div className="mt-6 flex justify-center gap-2">
                                    <span className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></span>
                                    <span className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce delay-200"></span>
                                </div>
                                <p className="mt-4 text-xs font-bold text-yellow-200 uppercase tracking-widest">Collecting...</p>
                            </div>
                        </div>
                    )}

                    {/* JACKPOT WIN OVERLAY */}
                    {showJackpotWin && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 animate-in zoom-in duration-500">
                            <div className="text-center relative">
                                <div className="absolute inset-0 bg-red-600/30 blur-[80px] rounded-full animate-pulse"></div>
                                <h2 className="text-5xl md:text-6xl font-black text-yellow-300 uppercase italic drop-shadow-[0_0_10px_red] animate-bounce mb-4">
                                    JACKPOT
                                </h2>
                                <div className="bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 bg-clip-text text-transparent text-4xl md:text-6xl font-black tracking-tighter drop-shadow-sm">
                                    ৳ {jackpotWinAmount.toLocaleString()}
                                </div>
                                <p className="text-white font-bold uppercase mt-6 tracking-widest text-sm animate-pulse">Grand Prize Won!</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* WIN TOOLBAR */}
            <div className={`bg-black/90 border-t-2 border-yellow-600/50 py-1 flex items-center justify-center transition-all duration-300 ${currentWin > 0 || freeSpinTotalWin > 0 ? 'h-10 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
                <span className="text-yellow-500 font-black text-sm uppercase mr-2">WIN:</span>
                <span className="text-white font-black text-lg">৳ {(currentWin > 0 ? currentWin : freeSpinTotalWin).toLocaleString()}</span>
            </div>

            {/* BOTTOM CONTROL BAR */}
            <div className="h-24 bg-gradient-to-t from-black to-[#2b0c0c] border-t border-[#ffd700]/30 px-4 py-2 flex items-center justify-between shrink-0 z-30 relative">
                
                {/* Left: Balance & Bet */}
                <div className="flex flex-col gap-1">
                    <div className="bg-black/60 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 w-28 md:w-32">
                        <span className="text-[8px] text-gray-400 uppercase">Credit</span>
                        <span className="text-[10px] md:text-xs font-bold text-white ml-auto">৳{balance.toLocaleString()}</span>
                    </div>
                    <div className="bg-black/60 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 w-28 md:w-32">
                        <span className="text-[8px] text-gray-400 uppercase">Bet</span>
                        <div className="flex items-center ml-auto gap-2">
                            <button onClick={() => setBet(Math.max(10, bet - 10))} disabled={isSpinning || freeSpins > 0} className="text-yellow-500 hover:text-white disabled:opacity-50">-</button>
                            <input 
                                type="number" 
                                min="1"
                                value={bet} 
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val) && val > 0) setBet(val);
                                }}
                                className="w-12 bg-transparent text-[10px] md:text-xs font-bold text-white text-center outline-none border-b border-white/10 focus:border-yellow-500 appearance-none m-0 p-0"
                                disabled={isSpinning || freeSpins > 0}
                            />
                            <button onClick={() => setBet(bet + 10)} disabled={isSpinning || freeSpins > 0} className="text-yellow-500 hover:text-white disabled:opacity-50">+</button>
                        </div>
                    </div>
                </div>

                {/* Center: SPIN Button */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                    <button 
                        onClick={() => handleSpin(false)}
                        disabled={isSpinning || freeSpins > 0 || autoSpin || collectingWin || showJackpotWin}
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-[#ffd700] shadow-[0_0_20px_#eab308] flex items-center justify-center relative active:scale-95 transition-all ${isSpinning || autoSpin ? 'bg-gray-800' : 'bg-gradient-to-b from-yellow-400 to-orange-600'}`}
                    >
                        {isSpinning || autoSpin ? (
                            <span className={`material-symbols-outlined text-white text-3xl ${isSpinning ? 'animate-spin' : ''}`}>{autoSpin ? 'autoplay' : 'refresh'}</span>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">cached</span>
                            </div>
                        )}
                        {freeSpins > 0 && <div className="absolute -top-2 bg-red-600 text-[8px] font-black px-2 rounded-full border border-white">FREE</div>}
                    </button>
                </div>

                {/* Right: Turbo & Auto */}
                <div className="flex flex-col gap-2 items-end">
                    <button onClick={() => setTurbo(!turbo)} className={`flex items-center gap-1 ${turbo ? 'text-yellow-400' : 'text-gray-500'}`}>
                        <span className="material-symbols-outlined text-lg md:text-xl">speed</span>
                        <span className="text-[8px] md:text-[9px] font-bold uppercase">Turbo {turbo ? 'ON' : 'OFF'}</span>
                    </button>
                    <button onClick={() => setAutoSpin(!autoSpin)} disabled={freeSpins > 0} className={`flex items-center gap-1 ${autoSpin ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className="material-symbols-outlined text-lg md:text-xl">autoplay</span>
                        <span className="text-[8px] md:text-[9px] font-bold uppercase">{autoSpin ? 'Stop' : 'Auto'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Advanced Fishing Types (Existing)
type Fish = { 
    id: number; 
    x: number; 
    y: number; 
    type: 'small' | 'medium' | 'big'; 
    hp: number; 
    maxHp: number;
    speed: number; 
    vx: number; 
    vy: number; 
    angle: number; 
    visual: string; 
    score: number;
};
type Bullet = { id: number; x: number; y: number; vx: number; vy: number; rotation: number; active: boolean };
type Particle = { id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; val?: string };

const CasinoView: React.FC<CasinoViewProps> = ({ gameType, balance, setBalance, isMuted, onClose, externalGames }) => {
  const audioCtx = useRef<AudioContext | null>(null);

  // --- CHECK IF EXTERNAL GAME ---
  if (gameType.startsWith('ext_')) {
      const extGame = externalGames?.find(g => g.id === gameType);
      if (extGame) {
          return (
              <div className="fixed inset-0 z-[9999] bg-black flex flex-col h-screen w-screen overflow-hidden">
                  {/* External Game Header */}
                  <div className="flex justify-between items-center px-4 py-2 bg-[#111] border-b border-gray-800 shrink-0 h-14">
                      <button onClick={onClose} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-all"><span className="material-symbols-outlined">arrow_back</span></button>
                      <span className="text-white font-bold truncate max-w-[200px]">{extGame.title}</span>
                      <div className="w-8"></div>
                  </div>
                  <div className="flex-grow w-full h-full relative bg-[#000]">
                      <iframe 
                        src={extGame.url} 
                        className="absolute inset-0 w-full h-full border-none" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; payment"
                        sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
                        loading="eager"
                        referrerPolicy="no-referrer"
                      ></iframe>
                  </div>
              </div>
          );
      }
  }

  // --- SHARED AUDIO ---
  const playSfx = (type: 'shoot' | 'hit' | 'kill' | 'win' | 'spin' | 'click') => {
      if (isMuted) return;
      try {
          if(!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          if(audioCtx.current.state === 'suspended') audioCtx.current.resume();
          const ctx = audioCtx.current;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          if (type === 'shoot') {
              osc.type = 'square';
              osc.frequency.setValueAtTime(200, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
              gain.gain.setValueAtTime(0.05, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
              osc.start(); osc.stop(ctx.currentTime + 0.1);
          } else if (type === 'hit') {
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(100, ctx.currentTime);
              gain.gain.setValueAtTime(0.05, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
              osc.start(); osc.stop(ctx.currentTime + 0.05);
          } else if (type === 'kill') {
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(100, ctx.currentTime);
              osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
              osc.start(); osc.stop(ctx.currentTime + 0.2);
          } else if (type === 'spin') {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(200, ctx.currentTime);
              gain.gain.setValueAtTime(0.02, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
              osc.start(); osc.stop(ctx.currentTime + 0.1);
          } else if (type === 'win') {
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(400, ctx.currentTime);
              osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
              osc.start(); osc.stop(ctx.currentTime + 0.5);
          }
      } catch (e) {}
  };

  if (gameType === 'superace') {
      return <SuperAceGame balance={balance} setBalance={setBalance} onClose={onClose} playSfx={playSfx} />;
  }

  // --- GENERIC/OTHER GAMES STATE ---
  const [betAmount, setBetAmount] = useState(10);
  const [resultOverlay, setResultOverlay] = useState<{ type: 'win' | 'loss', amount?: number, text?: string } | null>(null);
  
  // Generic Jackpot State
  const [genericJackpot, setGenericJackpot] = useState(85000 + Math.random() * 20000);
  const [showGenericJackpotWin, setShowGenericJackpotWin] = useState(false);

  // Slot (Generic)
  const [reelSymbols, setReelSymbols] = useState<string[]>(['🎰', '🎰', '🎰']);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Fishing
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const gameLoopRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Logic Mapper
  const getGameCategory = (type: GameType): 'fishing' | 'slot' | 'cards' | 'wheel' | 'color' | 'mines' => {
      if (['jackpotfishing', 'megafishing', 'dinotycoon', 'dragonmaster', 'caishenfishing', 'moneycoming'].includes(type)) return 'fishing';
      if (['goldenempire', 'fortunegems', 'boxingking', 'mahjongways2', 'luckyneko', 'treasuresofaztec', 'ganeshagold', 'caishenwins', 'dragonhatch', 'medusa2', 'honeytrap', 'jumphigh', 'gugugu', 'goodfortune', 'zeus', 'hercules', 'goldeneggs', 'ravejump', 'wonderland', 'firequeen', 'godofwar', 'fivedragons', 'lucky777', 'birdsparty', 'kong', 'mjolnir', 'billionaire', 'moneybagsman', 'superniubi'].includes(type)) return 'slot';
      if (['blackjack', 'baccarat', 'dragontiger', 'teenpatti', 'tongits', 'poker', 'andarbahar', 'hilo', 'dragontigerlive', 'redblack'].includes(type)) return 'cards';
      if (['fruitwheel', 'roulette', 'wheel'].includes(type)) return 'wheel';
      if (['colorgame', 'luckydice', 'dice', '7up7down', 'benzbmw', 'cointoss', 'rockpaperscissors', 'animalrun'].includes(type)) return 'color';
      if (['mines', 'minesweeper'].includes(type)) return 'mines';
      return 'slot'; 
  };

  const category = getGameCategory(gameType);

  // --- GENERIC JACKPOT SIMULATION ---
  useEffect(() => {
      if (category !== 'slot') return;
      const interval = setInterval(() => {
          setGenericJackpot(p => p + Math.random() * 2);
      }, 2500);
      return () => clearInterval(interval);
  }, [category]);

  // --- THEME ASSETS (Generic Slot) ---
  const getSlotAssets = () => {
      const name = gameType.toLowerCase();
      if(name.includes('boxing')) return { bg: 'bg-red-900', icons: ['🥊', '🔔', '🏆', '🥋'], wild: '👑' };
      if(name.includes('dragon')) return { bg: 'bg-orange-900', icons: ['🐲', '🔥', '💎', '📜'], wild: '🐉' };
      if(name.includes('lucky') || name.includes('neko')) return { bg: 'bg-pink-900', icons: ['🐱', '🎏', '🍣', '🌸'], wild: '😽' };
      if(name.includes('fortune') || name.includes('gems')) return { bg: 'bg-emerald-900', icons: ['💎', '💠', '🔷', '🔸'], wild: '💎' };
      if(name.includes('god') || name.includes('zeus')) return { bg: 'bg-blue-900', icons: ['⚡', '🏛️', '🛡️', '🍇'], wild: '⚡' };
      return { bg: 'bg-purple-900', icons: ['🍒', '🍋', '🍇', '🍉'], wild: '7️⃣' };
  };

  const slotTheme = getSlotAssets();

  // --- FISHING ENGINE ---
  useEffect(() => {
      if (category !== 'fishing') return;

      const fishImages = [
          'https://cdn-icons-png.flaticon.com/512/3065/3065876.png', // Small
          'https://cdn-icons-png.flaticon.com/512/2970/2970073.png', // Medium
          'https://cdn-icons-png.flaticon.com/512/1998/1998610.png', // Big
          'https://cdn-icons-png.flaticon.com/512/2504/2504937.png'  // Boss
      ];

      const spawnFish = (id: number) => {
          const isLeft = Math.random() > 0.5;
          const typeRand = Math.random();
          let type: Fish['type'] = 'small';
          let hp = 3; 
          let visual = fishImages[0];
          let score = 2;
          let size = 40;

          if (typeRand > 0.9) { type='big'; hp=15; visual=fishImages[2]; score=10; size=70; }
          else if (typeRand > 0.6) { type='medium'; hp=8; visual=fishImages[1]; score=5; size=55; }

          return {
              id: id + Date.now(),
              x: isLeft ? -50 : window.innerWidth + 50,
              y: Math.random() * (window.innerHeight - 200) + 50,
              type,
              hp,
              maxHp: hp,
              speed: (Math.random() * 1.5 + 0.5) * (isLeft ? 1 : -1),
              vx: (Math.random() * 1.5 + 0.5) * (isLeft ? 1 : -1),
              vy: (Math.random() - 0.5) * 0.5,
              angle: 0,
              visual,
              score,
              size
          };
      };

      setFishes(Array.from({length: 5}).map((_, i) => spawnFish(i)));

      const loop = () => {
          setFishes(prev => {
              const updated = [];
              for (const f of prev) {
                  f.x += f.vx;
                  f.y += f.vy;
                  if (f.x > -100 && f.x < window.innerWidth + 100) {
                      updated.push(f);
                  }
              }
              if (updated.length < 8 && Math.random() < 0.02) updated.push(spawnFish(Math.random()));
              return updated;
          });

          setBullets(prevBullets => {
              const activeBullets: Bullet[] = [];
              prevBullets.forEach(b => {
                  if (!b.active) return;
                  b.x += b.vx;
                  b.y += b.vy;
                  if (b.x >= 0 && b.x <= window.innerWidth && b.y >= 0 && b.y <= window.innerHeight) {
                      activeBullets.push(b);
                  }
              });
              return activeBullets; 
          });
          
          setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.2, life: p.life - 1 })).filter(p => p.life > 0));

          gameLoopRef.current = requestAnimationFrame(loop);
      };
      
      gameLoopRef.current = requestAnimationFrame(loop);
      return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [category]);

  // Separate collision logic
  useEffect(() => {
      if(category !== 'fishing') return;
      const interval = setInterval(() => {
          setBullets(currBullets => {
              let bulletsChanged = false;
              const newBullets = currBullets.map(b => {
                  if(!b.active) return b;
                  
                  let hitFishId = -1;
                  setFishes(currFishes => {
                      let fishesChanged = false;
                      const newFishes = currFishes.map(f => {
                          if (hitFishId !== -1) return f;
                          const dx = b.x - (f.x + 30);
                          const dy = b.y - (f.y + 30);
                          const dist = Math.sqrt(dx*dx + dy*dy);
                          
                          if (dist < 40) {
                              hitFishId = f.id;
                              playSfx('hit');
                              const newHp = f.hp - 1;
                              if (newHp <= 0) {
                                  playSfx('kill');
                                  const win = f.score * betAmount;
                                  setBalance(bal => bal + win);
                                  setParticles(p => [...p, 
                                      { id: Date.now(), x: f.x, y: f.y, vx: 0, vy: -2, life: 40, color: 'gold', val: `+৳${win}` },
                                      { id: Date.now()+1, x: f.x, y: f.y, vx: 2, vy: -3, life: 30, color: 'orange' },
                                      { id: Date.now()+2, x: f.x, y: f.y, vx: -2, vy: -3, life: 30, color: 'orange' }
                                  ]);
                                  fishesChanged = true;
                                  return null;
                              } else {
                                  fishesChanged = true;
                                  return { ...f, hp: newHp, x: f.x - 5 };
                              }
                          }
                          return f;
                      }).filter(Boolean) as Fish[];
                      
                      return fishesChanged ? newFishes : currFishes;
                  });

                  if (hitFishId !== -1) {
                      bulletsChanged = true;
                      return { ...b, active: false };
                  }
                  return b;
              });
              return bulletsChanged ? newBullets : currBullets;
          });
      }, 16);
      return () => clearInterval(interval);
  }, [category, betAmount]);

  const fireFishingBullet = (e: React.MouseEvent | React.TouchEvent) => {
      if (balance < betAmount) return alert("Insufficient Balance");
      setBalance(b => b - betAmount);
      playSfx('shoot');

      const rect = containerRef.current?.getBoundingClientRect();
      if(!rect) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      
      const startX = rect.width / 2;
      const startY = rect.height;
      const angle = Math.atan2(clientY - rect.top - startY, clientX - rect.left - startX);
      
      setCannonAngle((angle * 180 / Math.PI) + 90);

      const speed = 15;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      setBullets(prev => [...prev, {
          id: Date.now(),
          x: startX,
          y: startY,
          vx,
          vy,
          rotation: angle + Math.PI/2,
          active: true
      }]);
  };

  const handleGenericSlotSpin = () => {
      if (balance < betAmount) return alert("Insufficient Balance");
      setBalance(b => b - betAmount);
      // Contribute to Generic Jackpot
      setGenericJackpot(p => p + (betAmount * 0.05));
      
      setIsSpinning(true);
      playSfx('spin');
      
      let spins = 0;
      const interval = setInterval(() => {
          setReelSymbols(prev => prev.map(() => slotTheme.icons[Math.floor(Math.random() * slotTheme.icons.length)]));
          spins++;
          if (spins > 10) {
              clearInterval(interval);
              setIsSpinning(false);
              
              // Random Jackpot Chance
              if (Math.random() < 0.0005) {
                  const jpWin = genericJackpot;
                  setBalance(b => b + jpWin);
                  setShowGenericJackpotWin(true);
                  playSfx('win');
                  setGenericJackpot(50000); // Reset
                  setTimeout(() => setShowGenericJackpotWin(false), 4000);
                  return;
              }

              const isWin = Math.random() > 0.6;
              if (isWin) {
                  const winSym = slotTheme.wild;
                  setReelSymbols([winSym, winSym, winSym]);
                  const win = betAmount * 5;
                  setBalance(b => b + win);
                  playSfx('kill');
                  setResultOverlay({ type: 'win', amount: win, text: 'BIG WIN' });
              } else {
                  setReelSymbols([slotTheme.icons[0], slotTheme.icons[1], slotTheme.icons[2]]);
              }
              setTimeout(() => setResultOverlay(null), 2000);
          }
      }, 100);
  };

  // --- GENERIC RENDER ---
  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-black flex flex-col z-[9999] font-sans select-none overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-4 py-3 bg-[#111]/90 backdrop-blur-md border-b border-white/10 shrink-0 z-50">
            <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full"><span className="material-symbols-outlined text-lg">arrow_back</span></button>
            <div className="text-center">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">{gameType.replace(/([A-Z])/g, ' $1')}</h2>
                <div className="flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">Pro Room</span>
                </div>
            </div>
            <div className="bg-[#000] px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500 text-sm">account_balance_wallet</span>
                <span className="text-white font-black text-xs">৳{balance.toLocaleString()}</span>
            </div>
        </div>

        {/* GENERIC JACKPOT TICKER (Only for slots) */}
        {category === 'slot' && <JackpotTicker value={genericJackpot} />}

        {/* GAME CANVAS */}
        <div 
            ref={containerRef}
            className={`flex-grow relative w-full overflow-hidden ${category === 'fishing' ? 'cursor-crosshair' : ''}`}
            onClick={category === 'fishing' ? fireFishingBullet : undefined}
            style={{
                backgroundImage: category === 'fishing' ? 'url(https://img.freepik.com/free-vector/underwater-background-vector-blue-marine-life_53876-113063.jpg)' : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: category === 'slot' ? '#1a0524' : '#0f0f0f'
            }}
        >
            {category === 'slot' && <div className={`absolute inset-0 opacity-80 ${slotTheme.bg}`}></div>}

            {/* FISHING LAYER */}
            {category === 'fishing' && (
                <>
                    {bullets.map(b => (
                        <div key={b.id} className="absolute w-4 h-8 bg-yellow-400 rounded-full shadow-[0_0_10px_orange]" style={{ left: b.x, top: b.y, transform: `translate(-50%, -50%) rotate(${b.rotation}rad)` }} />
                    ))}
                    {fishes.map(f => (
                        <div key={f.id} className="absolute transition-transform duration-100 ease-linear" style={{ left: f.x, top: f.y, width: f.type === 'big' ? '80px' : f.type === 'medium' ? '60px' : '40px', transform: `scaleX(${f.vx > 0 ? -1 : 1})` }}>
                            <img src={f.visual} className="w-full h-full object-contain drop-shadow-lg" />
                            {f.hp < f.maxHp && (<div className="absolute -top-2 left-0 w-full h-1 bg-red-900 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${(f.hp/f.maxHp)*100}%` }}></div></div>)}
                        </div>
                    ))}
                    {particles.map(p => (
                        p.val ? (<div key={p.id} className="absolute text-yellow-400 font-black text-sm animate-bounce" style={{ left: p.x, top: p.y }}>{p.val}</div>) : (<div key={p.id} className="absolute w-2 h-2 rounded-full" style={{ left: p.x, top: p.y, backgroundColor: p.color }} />)
                    ))}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 z-20 pointer-events-none transition-transform duration-75" style={{ transform: `translateX(-50%) rotate(${cannonAngle}deg)` }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/9992/9992367.png" className="w-full h-full object-contain drop-shadow-2xl" />
                    </div>
                </>
            )}

            {/* GENERIC SLOT LAYER */}
            {category === 'slot' && (
                <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                    <div className="w-[90%] max-w-sm aspect-[4/3] bg-gradient-to-b from-[#333] to-[#000] p-4 rounded-3xl border-[6px] border-yellow-600 shadow-[0_0_50px_rgba(234,179,8,0.3)] relative overflow-hidden">
                        <div className="h-full bg-white rounded-xl overflow-hidden flex gap-1 p-2 border-inner shadow-inner relative">
                            {reelSymbols.map((s, i) => (
                                <div key={i} className="flex-1 bg-gradient-to-b from-gray-100 to-gray-300 rounded-lg border-x-2 border-gray-400 flex items-center justify-center text-6xl relative overflow-hidden shadow-lg">
                                    <div className={`transition-all duration-100 ${isSpinning ? 'blur-sm scale-y-150 opacity-50 translate-y-10' : 'scale-100 translate-y-0'}`}>{s}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleGenericSlotSpin} disabled={isSpinning} className={`mt-8 w-24 h-24 rounded-full border-[6px] border-[#222] shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center active:scale-95 transition-all ${isSpinning ? 'bg-gray-600' : 'bg-gradient-to-br from-green-500 to-green-700 animate-pulse'}`}>
                        <span className="text-white font-black text-xl uppercase italic drop-shadow-md">{isSpinning ? '...' : 'SPIN'}</span>
                    </button>
                </div>
            )}

            {/* CARD/COLOR PLACEHOLDER */}
            {(category === 'cards' || category === 'color' || category === 'mines' || category === 'wheel') && (
                <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
                    <span className="material-symbols-outlined text-6xl opacity-50 animate-bounce">{category === 'cards' ? 'style' : category === 'color' ? 'palette' : category === 'mines' ? 'bomb' : 'casino'}</span>
                    <h2 className="text-2xl font-black uppercase tracking-widest">{gameType}</h2>
                    <button onClick={() => { if(balance < betAmount) return alert("Low Balance"); setBalance(b => b - betAmount); playSfx('click'); setTimeout(() => { const win = Math.random() > 0.5; if(win) { const w = betAmount * 2; setBalance(b => b + w); playSfx('win'); setResultOverlay({type:'win', amount: w, text: 'YOU WON'}); } else { setResultOverlay({type:'loss', text: 'YOU LOST'}); } setTimeout(() => setResultOverlay(null), 1500); }, 1000); }} className="px-8 py-3 bg-blue-600 rounded-full font-bold uppercase shadow-lg active:scale-95">Place Bet ৳{betAmount}</button>
                </div>
            )}

            {resultOverlay && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                    <div className="text-center">
                        <h1 className={`text-6xl font-black italic uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] ${resultOverlay.type === 'win' ? 'text-yellow-400 animate-bounce' : 'text-gray-400'}`}>{resultOverlay.text}</h1>
                        {resultOverlay.amount && <p className="text-3xl font-black text-white mt-2">৳ {resultOverlay.amount.toLocaleString()}</p>}
                    </div>
                </div>
            )}

            {/* GENERIC JACKPOT WIN OVERLAY */}
            {showGenericJackpotWin && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 animate-in zoom-in duration-500">
                    <div className="text-center relative">
                        <div className="absolute inset-0 bg-red-600/30 blur-[80px] rounded-full animate-pulse"></div>
                        <h2 className="text-5xl md:text-6xl font-black text-yellow-300 uppercase italic drop-shadow-[0_0_10px_red] animate-bounce mb-4">
                            JACKPOT
                        </h2>
                        <div className="bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 bg-clip-text text-transparent text-4xl md:text-6xl font-black tracking-tighter drop-shadow-sm">
                            ৳ {genericJackpot.toLocaleString()}
                        </div>
                        <p className="text-white font-bold uppercase mt-6 tracking-widest text-sm animate-pulse">Grand Prize Won!</p>
                    </div>
                </div>
            )}
        </div>

        {/* BOTTOM CONTROLS (Unified) */}
        <div className="shrink-0 bg-[#111] p-4 border-t border-white/10 z-[60] safe-pb">
            <div className="flex items-center justify-between max-w-md mx-auto gap-4">
                <div className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between px-1">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Stake Amount</span>
                        <span className="text-[9px] text-white font-bold">৳ {betAmount}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[10, 50, 100, 500].map(amt => (
                            <button key={amt} onClick={() => { setBetAmount(amt); playSfx('click'); }} className={`py-2 rounded-lg text-[10px] font-black transition-all ${betAmount === amt ? 'bg-yellow-600 text-white' : 'bg-[#222] text-gray-500'}`}>{amt}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        <style>{` .safe-pb { padding-bottom: env(safe-area-inset-bottom, 1rem); } `}</style>
    </div>
  );
};

export default CasinoView;
