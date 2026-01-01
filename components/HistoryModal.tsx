
import React from 'react';
import { Transaction } from '../App';

interface HistoryModalProps {
  transactions: Transaction[];
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ transactions, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#001b36] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        
        <div className="bg-[#001529] p-6 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">history</span>
            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Transaction History</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scroll">
          {transactions.length === 0 ? (
            <div className="py-20 text-center space-y-4">
               <span className="material-symbols-outlined text-gray-700 text-6xl">receipt_long</span>
               <p className="text-gray-500 font-black text-sm uppercase">No Transactions Yet</p>
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    <span className="material-symbols-outlined">{tx.type === 'deposit' ? 'arrow_downward' : 'arrow_upward'}</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase">{tx.type} via {tx.method}</p>
                    <p className="text-[9px] text-gray-500 font-bold">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.type === 'deposit' ? 'text-green-500' : 'text-orange-500'}`}>
                    {tx.type === 'deposit' ? '+' : '-'} ৳{tx.amount}
                  </p>
                  <p className={`text-[9px] font-black uppercase ${tx.status === 'success' ? 'text-green-500' : 'text-yellow-500'}`}>{tx.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #1e3a8a; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default HistoryModal;
