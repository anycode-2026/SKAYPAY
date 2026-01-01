
import React from 'react';

export interface BetRecord {
  id: string;
  amount: number;
  multiplier: number;
  status: 'win' | 'loss';
  payout: number;
  date: string;
}

interface BetHistoryModalProps {
  bets: BetRecord[];
  onClose: () => void;
}

const BetHistoryModal: React.FC<BetHistoryModalProps> = ({ bets, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#001b36] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        
        <div className="bg-[#001529] p-6 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-500">casino</span>
            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">My Bet History</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scroll">
          {bets.length === 0 ? (
            <div className="py-20 text-center space-y-4">
               <span className="material-symbols-outlined text-gray-700 text-6xl">analytics</span>
               <p className="text-gray-500 font-black text-sm uppercase">No Bets Placed Yet</p>
            </div>
          ) : (
            bets.map(bet => (
              <div key={bet.id} className={`bg-white/5 p-4 rounded-2xl border transition-all ${bet.status === 'win' ? 'border-green-500/20' : 'border-red-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bet.status === 'win' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      <span className="material-symbols-outlined">{bet.status === 'win' ? 'trending_up' : 'trending_down'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-white uppercase">৳{bet.amount.toLocaleString()}</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${bet.status === 'win' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                          {bet.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-500 font-bold">{bet.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${bet.status === 'win' ? 'text-green-500' : 'text-gray-400'}`}>
                      {bet.multiplier.toFixed(2)}x
                    </p>
                    <p className="text-[10px] font-black uppercase text-white">
                      Payout: ৳{bet.payout.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #6b21a8; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default BetHistoryModal;
