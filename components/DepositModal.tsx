
import React, { useState } from 'react';
import { AdminSettings } from '../App';

interface DepositModalProps {
  onClose: () => void;
  onSuccess: (amount: number, method: string) => void;
  adminSettings?: AdminSettings;
}

type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'usdt' | 'btc';

const DepositModal: React.FC<DepositModalProps> = ({ onClose, onSuccess, adminSettings }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); 
  const [amount, setAmount] = useState(1000);
  const [method, setMethod] = useState<PaymentMethod>('bkash');
  const [txId, setTxId] = useState('');

  const getWallet = (m: PaymentMethod) => {
    if (!adminSettings) return 'Loading...';
    switch (m) {
      case 'bkash': return adminSettings.bkashNumber || 'Contact Admin';
      case 'nagad': return adminSettings.nagadNumber || 'Contact Admin';
      case 'rocket': return adminSettings.rocketNumber || 'Contact Admin';
      case 'upay': return adminSettings.upayNumber || 'Contact Admin';
      case 'usdt': return adminSettings.usdtAddress || 'Contact Admin';
      case 'btc': return adminSettings.btcAddress || 'Contact Admin';
      default: return 'SYSTEM SECURE';
    }
  };

  const startProcessing = () => {
    if (!txId) {
      alert("Please enter Transaction ID / Hash");
      return;
    }
    setStep(3);
    setTimeout(() => {
      onSuccess(amount, method.toUpperCase());
      setStep(4);
    }, 2800);
  };

  const isCrypto = method === 'usdt' || method === 'btc';
  const walletAddress = getWallet(method);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(walletAddress)}&color=000000&bgcolor=ffffff`;

  const renderMethodButton = (m: PaymentMethod, label: string, icon: string, colorClass: string) => (
    <button 
      key={m}
      onClick={() => setMethod(m)}
      className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-300 overflow-hidden group ${
        method === m 
        ? `border-${colorClass}-500 bg-${colorClass}-500/20 shadow-[0_0_15px_rgba(var(--${colorClass}-rgb),0.3)]` 
        : 'border-white/5 bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-black/40 border border-white/10 ${method === m ? 'scale-110' : 'grayscale group-hover:grayscale-0'} transition-all`}>
         {/* Use images if available, else icons */}
         {m === 'bkash' ? <img src="https://seeklogo.com/images/B/bkash-logo-FBB258B90F-seeklogo.com.png" className="w-6 h-6 object-contain" /> :
          m === 'nagad' ? <img src="https://seeklogo.com/images/N/nagad-logo-7A70CCFEE0-seeklogo.com.png" className="w-8 h-8 object-contain" /> :
          m === 'rocket' ? <img src="https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png" className="w-6 h-6 object-contain" /> :
          m === 'usdt' ? <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className="w-6 h-6 object-contain" /> :
          m === 'btc' ? <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" className="w-6 h-6 object-contain" /> :
          <span className="material-symbols-outlined text-white">{icon}</span>
         }
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${method === m ? 'text-white' : 'text-gray-500'}`}>{label}</span>
      {method === m && <div className={`absolute inset-0 bg-${colorClass}-500/5 pointer-events-none`}></div>}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-[380px] bg-[#000d1a] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {step !== 4 && (
          <div className="bg-[#001529] p-5 flex justify-between items-center border-b border-white/5">
            <h2 className="text-sm font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse"></span> DEPOSIT FUNDS
            </h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        )}

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest pl-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">payments</span> Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {renderMethodButton('bkash', 'Bkash', '', 'pink')}
                  {renderMethodButton('nagad', 'Nagad', '', 'orange')}
                  {renderMethodButton('rocket', 'Rocket', '', 'purple')}
                  {renderMethodButton('upay', 'Upay', 'account_balance_wallet', 'blue')}
                  {renderMethodButton('usdt', 'USDT', '', 'green')}
                  {renderMethodButton('btc', 'BTC', '', 'yellow')}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest pl-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">attach_money</span> Amount (BDT)
                </label>
                
                <div className="bg-black/40 rounded-2xl p-4 border border-white/10 ring-1 ring-white/5 relative group focus-within:border-blue-500 transition-all">
                  <div className="flex items-center">
                    <span className="text-2xl font-black text-blue-500 mr-2">৳</span>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-3xl font-black text-white outline-none placeholder-gray-700"
                      placeholder="0"
                    />
                  </div>
                  {/* Quick Select Amounts */}
                  <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                      {[500, 1000, 2000, 5000, 10000].map(val => (
                          <button 
                            key={val} 
                            onClick={() => setAmount(val)} 
                            className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
                          >
                              ৳{val}
                          </button>
                      ))}
                  </div>
                </div>
                
                {isCrypto && (
                    <div className="bg-yellow-900/10 border border-yellow-500/20 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-[9px] font-bold text-yellow-500 uppercase">Estimated USD</span>
                        <span className="text-sm font-black text-white">${(amount / 120).toFixed(2)}</span>
                    </div>
                )}
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-base shadow-xl shadow-blue-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                <span>NEXT STEP</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-6">
              
              {/* Payment Details Box */}
              <div className="bg-gradient-to-b from-[#1a1a1a] to-black rounded-3xl border border-white/10 p-5 text-center relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                
                {isCrypto ? (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="bg-white p-2 rounded-xl shadow-lg">
                            <img src={qrUrl} alt="Wallet QR" className="w-32 h-32 object-contain" />
                        </div>
                        <div className="space-y-1 w-full">
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Scan or Copy Address</p>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2 group cursor-pointer active:bg-white/10" onClick={() => navigator.clipboard.writeText(walletAddress)}>
                                <span className="text-[10px] font-mono text-yellow-500 break-all text-center leading-tight flex-grow">{walletAddress}</span>
                                <span className="material-symbols-outlined text-gray-500 text-sm">content_copy</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                            {method === 'bkash' ? <img src="https://seeklogo.com/images/B/bkash-logo-FBB258B90F-seeklogo.com.png" className="w-10 h-10 object-contain" /> :
                             method === 'nagad' ? <img src="https://seeklogo.com/images/N/nagad-logo-7A70CCFEE0-seeklogo.com.png" className="w-12 h-12 object-contain" /> :
                             <span className="material-symbols-outlined text-3xl text-gray-400">account_balance_wallet</span>
                            }
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Merchant Number</p>
                            <div 
                                onClick={() => navigator.clipboard.writeText(walletAddress)}
                                className="flex items-center justify-center gap-2 bg-white/5 py-2 px-4 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                            >
                                <span className="text-2xl font-black text-white tracking-widest tabular-nums">{walletAddress}</span>
                                <span className="material-symbols-outlined text-gray-500 text-sm">content_copy</span>
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-500 leading-relaxed px-4">
                            Please use the <span className="text-white font-bold">"Send Money"</span> or <span className="text-white font-bold">"Payment"</span> option in your app. Reference: <span className="text-blue-500 font-bold">DEPOSIT</span>
                        </p>
                    </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest pl-1">
                    {isCrypto ? 'Transaction Hash (TxID)' : 'Transaction ID (TrxID)'}
                </label>
                <input 
                  type="text" 
                  placeholder={isCrypto ? "Enter blockchain hash..." : "e.g. 9H7G6F5D4"}
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-sm font-bold text-center text-white focus:outline-none focus:border-blue-500 transition-all placeholder-gray-700"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="w-1/3 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-black text-[10px] uppercase hover:bg-white/10 transition-all">Back</button>
                <button onClick={startProcessing} className="flex-grow py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-black text-sm uppercase tracking-wider shadow-xl active:scale-95 transition-all">Confirm Payment</button>
              </div>
            </div>
          ) : step === 3 ? (
            <div className="py-14 text-center space-y-8">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-blue-500 animate-pulse">sync</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-black text-xl uppercase italic tracking-tighter">Verifying Transaction</h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Connecting to payment gateway...</p>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center space-y-6 animate-in zoom-in-90 duration-500">
               <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-50"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-700 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)] border-4 border-[#000d1a]">
                    <span className="material-symbols-outlined text-white text-5xl font-black">check</span>
                  </div>
               </div>
               <div className="space-y-2">
                  <h3 className="text-white font-black text-2xl uppercase italic tracking-tighter leading-none">Deposit Pending</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] leading-relaxed max-w-[250px] mx-auto">
                    Your request for <span className="text-white">৳{amount.toLocaleString()}</span> has been submitted. Funds will be added automatically within 5 minutes.
                  </p>
               </div>
               <button 
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs shadow-lg hover:bg-white/10 active:scale-95 transition-all uppercase tracking-[0.2em]"
               >
                 Close & Play
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
