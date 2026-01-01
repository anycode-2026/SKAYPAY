
import React, { useState } from 'react';
import { GameType, ExternalGame } from '../App';

interface GameGridProps {
  onGameSelect: (type: GameType) => void;
  externalGames?: ExternalGame[]; 
}

const GameGrid: React.FC<GameGridProps> = ({ onGameSelect, externalGames }) => {
  const [activeProvider, setActiveProvider] = useState<'JILI' | 'PGSoft' | 'CQ9' | 'JDB' | 'InOut'>('JILI');

  const getImageUrl = (name: string, seed: number, style: string) => {
      const prompt = `casino game icon ${name} ${style} logo vector graphic vivid colors minimal`;
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=300&height=300&nologo=true&seed=${seed}`;
  };

  // REDUCED TO 2 GAMES PER PROVIDER (TOTAL 10 DEFAULT)
  const providerGames = {
      JILI: [
          { id: 'superace', name: 'Super Ace', seed: 9999, style: 'golden playing cards royal flush' },
          { id: 'goldenempire', name: 'Golden Empire', seed: 1002, style: 'mayan temple aztec gold pyramid' },
      ],
      PGSoft: [
          { id: 'mahjongways2', name: 'Mahjong Ways', seed: 2001, style: 'chinese mahjong tiles red dragon' },
          { id: 'luckyneko', name: 'Lucky Neko', seed: 2002, style: 'japanese lucky cat gold coin maneki neko' },
      ],
      CQ9: [
          { id: 'jumphigh', name: 'Jump High', seed: 3001, style: 'neon disco ball party music notes' },
          { id: 'gugugu', name: 'Gu Gu Gu', seed: 3002, style: 'golden rooster chicken farm egg' },
      ],
      JDB: [
          { id: 'dragonmaster', name: 'Dragon Master', seed: 4001, style: 'warrior riding dragon fantasy sky' },
          { id: 'caishenfishing', name: 'Caishen Fish', seed: 4002, style: 'underwater god of wealth fishing net' },
      ],
      InOut: [
          { id: 'dragontigerlive', name: 'Dragon Tiger', seed: 5001, style: 'dragon vs tiger yin yang battle' },
          { id: '7up7down', name: '7 Up 7 Down', seed: 5002, style: 'two dice showing 7 casino table green' },
      ]
  };

  return (
    <div className="w-full">
        {/* GAMES PROVIDER NAVIGATION */}
        <div className="px-3 sticky top-0 z-30 bg-[#000a16]/95 backdrop-blur-md py-3 border-b border-white/5">
            <div className="flex overflow-x-auto scrollbar-hide gap-2">
                {['JILI', 'PGSoft', 'CQ9', 'JDB', 'InOut'].map((provider) => (
                    <button 
                        key={provider}
                        onClick={() => setActiveProvider(provider as any)}
                        className={`flex-shrink-0 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeProvider === provider 
                            ? 'bg-white text-black shadow-lg scale-105' 
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                        }`}
                    >
                        {provider}
                    </button>
                ))}
            </div>
        </div>

        {/* GAMES GRID */}
        <div className="px-3 py-4 space-y-3 min-h-[400px]">
            <div className="flex items-center justify-between pl-1">
                <h3 className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500 text-sm">grid_view</span> {activeProvider} Games
                </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500 key={activeProvider}">
                
                {/* RENDER EXTERNAL GAMES FOR THE ACTIVE SECTION */}
                {externalGames && externalGames.filter(g => g.provider === activeProvider).map(game => (
                    <div 
                        key={game.id}
                        onClick={() => onGameSelect(game.id as GameType)}
                        className="relative overflow-hidden rounded-xl bg-[#1a1a1a] border border-blue-500/30 group active:scale-95 transition-all cursor-pointer shadow-lg aspect-square"
                    >
                        <img 
                            src={game.image}
                            alt={game.title} 
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover p-0 z-10" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-90 z-20"></div>
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-bl-lg uppercase z-30 animate-pulse">NEW</div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-center z-30">
                            <p className="text-[9px] font-black text-white uppercase leading-tight tracking-wide drop-shadow-md truncate">
                                {game.title}
                            </p>
                        </div>
                    </div>
                ))}

                {/* RENDER DEFAULT GAMES */}
                {providerGames[activeProvider].map((game) => (
                    <div 
                        key={game.id}
                        onClick={() => onGameSelect(game.id as GameType)}
                        className="relative overflow-hidden rounded-xl bg-[#1a1a1a] border border-white/5 group active:scale-95 transition-all cursor-pointer shadow-lg aspect-square"
                    >
                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-700 text-[8px] font-black uppercase">{game.name.substring(0,2)}</span>
                        </div>
                        <img 
                            src={getImageUrl(game.name, game.seed, game.style)}
                            alt={game.name} 
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover p-0 z-10" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-90 z-20"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-center z-30">
                            <p className="text-[9px] font-black text-white uppercase leading-tight tracking-wide drop-shadow-md truncate">
                                {game.name}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default GameGrid;
