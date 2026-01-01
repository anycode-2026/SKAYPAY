
import React from 'react';

interface PromoModalProps {
  onClose: () => void;
  onClaim: () => void;
  isReferral?: boolean; // New prop
}

const PromoModal: React.FC<PromoModalProps> = ({ onClose, onClaim, isReferral }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-gradient-to-br from-purple-900 via-[#1a0b2e] to-indigo-900 rounded-[32px] border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.4)] p-1 overflow-hidden animate-in zoom-in-95 duration-500">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-600 hover:border-red-500 transition-all"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="bg-[#0f0518]/80 rounded-[28px] p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
             <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-purple-600 rounded-full blur-[60px]"></div>
             <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-pink-600 rounded-full blur-[60px]"></div>
          </div>

          <div className="relative z-10 space-y-4">
             <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl rotate-3 shadow-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-5xl text-white drop-shadow-md">card_giftcard</span>
             </div>

             <div className="space-y-1">
               <h3 className="text-pink-500 font-black text-xs uppercase tracking-[0.3em] animate-pulse">
                   {isReferral ? 'Sign Up for First User' : 'First User Offer'}
               </h3>
               <h2 className="text-4xl font-black text-white italic leading-none drop-shadow-lg">
                 50% <span className="text-yellow-400">BONUS</span>
               </h2>
               <p className="text-gray-300 text-sm font-bold pt-2 leading-relaxed">
                 {isReferral ? 'Join via Agent Link for 100% Verified Offer!' : 'First Deposit For 100% Best Offer!'}<br/>
                 <span className="text-purple-300 text-xs font-normal">Double your balance instantly.</span>
               </p>
             </div>

             <div className="pt-4">
               <button 
                 onClick={onClaim}
                 className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-black text-lg uppercase tracking-widest shadow-xl shadow-purple-900/50 hover:scale-105 active:scale-95 transition-all border border-white/20"
               >
                 CLAIM BONUS
               </button>
               <p className="text-[9px] text-gray-500 mt-3 font-bold uppercase tracking-wider">100% Working</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoModal;
