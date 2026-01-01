
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 px-4 bg-[#000a16]">
      <div className="max-w-5xl mx-auto bg-[#001529] rounded-[32px] border border-white/5 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Blurs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-start">
          
          {/* Brand & Short Intro */}
          <div className="md:w-1/3 space-y-4 text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-2">
                 <img src="https://aviator.digirg-demo.pp.ua/images/logo.png" className="h-8" alt="SkyHigh" />
                 <span className="text-xl font-black text-white italic tracking-tighter">SKY <span className="text-red-600">HIGH</span></span>
             </div>
             <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
               The ultimate Provably Fair multiplayer crash game. Watch the multiplier rise, hold your nerve, and cash out before the plane flies away. Secure, fast, and 100% transparent.
             </p>
             <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                <span className="text-2xl font-black text-gray-700 border-2 border-gray-700 rounded px-2 opacity-50">18+</span>
                <div className="px-3 py-1 rounded-lg border border-green-500/20 bg-green-500/5 text-[9px] font-bold text-green-500 uppercase tracking-wider">
                   System Verified
                </div>
             </div>
          </div>

          {/* Policies Grid (Compact Box Style) */}
          <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
             
             {/* Privacy Box */}
             <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                <h4 className="text-white font-bold text-[11px] uppercase mb-1.5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500"><span className="material-symbols-outlined text-sm">security</span></span>
                    Privacy Policy
                </h4>
                <p className="text-[9px] text-gray-500 leading-tight group-hover:text-gray-400 transition-colors">
                  We use military-grade encryption to safeguard your betting logs and financial data. Your personal information is strictly confidential and never shared with third parties.
                </p>
             </div>

             {/* Fair Play Box */}
             <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                <h4 className="text-white font-bold text-[11px] uppercase mb-1.5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-yellow-600/10 flex items-center justify-center text-yellow-500"><span className="material-symbols-outlined text-sm">gavel</span></span>
                    Provably Fair
                </h4>
                <p className="text-[9px] text-gray-500 leading-tight group-hover:text-gray-400 transition-colors">
                  Every round hash is generated beforehand. You can verify the fairness of every flight outcome in the History tab. The game result is 100% random and tamper-proof.
                </p>
             </div>

             {/* Terms Box */}
             <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                <h4 className="text-white font-bold text-[11px] uppercase mb-1.5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-600/10 flex items-center justify-center text-red-500"><span className="material-symbols-outlined text-sm">policy</span></span>
                    Terms of Use
                </h4>
                <p className="text-[9px] text-gray-500 leading-tight group-hover:text-gray-400 transition-colors">
                  By accessing Sky High, you agree to fair play rules. Multi-accounting, using bot software, or exploiting glitches is strictly prohibited and results in a permanent ban.
                </p>
             </div>

             {/* Responsible Gaming */}
             <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                <h4 className="text-white font-bold text-[11px] uppercase mb-1.5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-600/10 flex items-center justify-center text-green-500"><span className="material-symbols-outlined text-sm">verified_user</span></span>
                    Responsible Gaming
                </h4>
                <p className="text-[9px] text-gray-500 leading-tight group-hover:text-gray-400 transition-colors">
                  Gambling involves risk. Only bet what you can afford to lose. We provide tools to set deposit limits and self-exclusion to help you stay in control.
                </p>
             </div>

          </div>
        </div>

        {/* Bottom Compact Bar */}
        <div className="mt-8 pt-5 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 opacity-60 hover:opacity-100 transition-opacity">
           <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center md:text-left">
              &copy; 2025 Sky High Network. All rights reserved.
           </div>
           <div className="flex gap-3">
              {['facebook', 'telegram', 'twitter'].map(i => (
                 <a href="#" key={i} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5">
                    <span className="material-symbols-outlined text-xs">{i === 'telegram' ? 'send' : 'share'}</span>
                 </a>
              ))}
           </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
