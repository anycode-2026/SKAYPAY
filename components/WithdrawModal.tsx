
import React, { useState, useEffect } from 'react';

interface WithdrawModalProps {
  balance: number;
  onClose: () => void;
  onSuccess: (amount: number, method: string, phone: string) => void;
  userPin?: string; // Current user PIN status
  onSetPin: (pin: string) => void; // Handler to set new PIN
}

type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'usdt' | 'btc';
type ModalView = 'setup_pin' | 'form' | 'verify_pin' | 'processing' | 'success';

// --- HELPER COMPONENT (Moved Outside to fix Focus/Keyboard Issue) ---
const PinInput = ({ val, setVal, placeholder, autoFocus }: {val: string, setVal: (s:string)=>void, placeholder: string, autoFocus?: boolean}) => (
    <input 
      type="tel" 
      maxLength={6}
      value={val}
      onChange={(e) => setVal(e.target.value.replace(/[^0-9]/g, ''))}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-2xl font-black text-center text-white tracking-[0.5em] outline-none focus:border-blue-500 transition-all placeholder-gray-700"
    />
);

const WithdrawModal: React.FC<WithdrawModalProps> = ({ balance, onClose, onSuccess, userPin, onSetPin }) => {
  // State Management
  const [view, setView] = useState<ModalView>('form');
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('bkash');
  const [accountInfo, setAccountInfo] = useState('');
  const [error, setError] = useState<string>('');
  
  // PIN States
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [inputPin, setInputPin] = useState('');

  const isCrypto = method === 'usdt' || method === 'btc';

  // Initial Check: If User has no PIN, force Setup
  useEffect(() => {
      if (!userPin) {
          setView('setup_pin');
      }
  }, [userPin]);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  const getMethodColor = (m: PaymentMethod) => {
      switch(m) {
          case 'bkash': return 'from-pink-600 to-rose-600';
          case 'nagad': return 'from-orange-500 to-red-500';
          case 'rocket': return 'from-purple-600 to-indigo-600';
          case 'upay': return 'from-blue-500 to-cyan-500';
          case 'usdt': return 'from-emerald-500 to-teal-600';
          case 'btc': return 'from-yellow-500 to-orange-600';
          default: return 'from-gray-600 to-gray-700';
      }
  };

  // --- HANDLERS ---

  const handleSetNewPin = () => {
      if (newPin.length !== 6 || confirmPin.length !== 6) return showError("PIN must be 6 digits");
      if (newPin !== confirmPin) return showError("PINs do not match");
      
      onSetPin(newPin); // Update Parent State / LocalStorage
      setView('form'); // Move to Withdrawal Form
      showError("PIN Set Successfully!"); // Using error msg bar for success feedback temporarily
  };

  const handleWithdrawRequest = () => {
    const val = parseInt(amount);
    if (!val || val <= 0) return showError("Enter valid amount");
    if (val > balance) return showError("Insufficient Balance");
    if (val < 500) return showError("Minimum withdrawal is ৳500");
    if (!accountInfo) return showError(isCrypto ? "Enter Wallet Address" : "Enter Phone Number");
    
    if (!isCrypto && accountInfo.length < 11) return showError("Enter valid 11-digit Phone Number");
    if (isCrypto && accountInfo.length < 20) return showError("Invalid Wallet Address");

    // Proceed to Verification
    setView('verify_pin');
    setInputPin('');
  };

  const verifyAndSubmit = () => {
      if (inputPin !== userPin && inputPin !== newPin) { 
          return showError("Incorrect PIN");
      }
      
      setView('processing');
      setTimeout(() => {
          onSuccess(parseInt(amount), method, accountInfo);
          setView('success');
      }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-[380px] bg-[#001529] rounded-[32px] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Dynamic Header based on View */}
        <div className={`p-6 pb-8 bg-gradient-to-br ${view === 'form' ? getMethodColor(method) : 'from-blue-900 to-black'} relative overflow-hidden transition-colors duration-500`}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">
                        {view === 'setup_pin' ? 'Security Setup' : view === 'verify_pin' ? 'Confirm Payout' : view === 'success' ? 'Success' : 'Withdraw'}
                    </h2>
                    <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-1">
                        {view === 'setup_pin' ? 'Protect your funds' : `Available: ৳${balance.toLocaleString()}`}
                    </p>
                </div>
                <button onClick={onClose} className="bg-black/20 p-2 rounded-full hover:bg-black/40 transition-colors text-white">
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
        </div>

        <div className="p-6 -mt-4 bg-[#001529] rounded-t-[24px] relative z-20">
          
          {error && (
            <div className="absolute top-0 left-0 right-0 -mt-12 mx-6">
                <div className="bg-red-600 text-white text-[10px] font-black uppercase p-3 rounded-xl text-center shadow-lg animate-in slide-in-from-top-2 fade-in">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">error</span> {error}
                </div>
            </div>
          )}

          {/* VIEW 1: PIN SETUP */}
          {view === 'setup_pin' && (
              <div className="space-y-6 text-center animate-in slide-in-from-right">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-blue-500/30">
                      <span className="material-symbols-outlined text-3xl text-blue-500">lock_reset</span>
                  </div>
                  <div>
                      <h3 className="text-white font-bold mb-1">Set Withdrawal PIN</h3>
                      <p className="text-xs text-gray-500">Create a 6-digit PIN to secure your funds.</p>
                  </div>
                  <div className="space-y-3">
                      <PinInput val={newPin} setVal={setNewPin} placeholder="Enter 6-Digit PIN" autoFocus={true} />
                      <PinInput val={confirmPin} setVal={setConfirmPin} placeholder="Confirm PIN" />
                  </div>
                  <button onClick={handleSetNewPin} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest shadow-lg">
                      Save & Continue
                  </button>
              </div>
          )}

          {/* VIEW 2: WITHDRAWAL FORM */}
          {view === 'form' && (
            <div className="space-y-6 animate-in slide-in-from-right">
              {/* Method Selection */}
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest pl-1">Select Wallet</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bkash', 'nagad', 'rocket', 'upay', 'usdt', 'btc'] as PaymentMethod[]).map(m => (
                    <button 
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`relative overflow-hidden p-2 py-3 rounded-xl border transition-all group flex flex-col items-center gap-1 ${
                          method === m 
                          ? 'border-white/20 bg-white/5 shadow-inner' 
                          : 'border-white/5 bg-black/20 hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white p-1 relative z-10 ${method === m ? 'scale-110' : 'grayscale group-hover:grayscale-0'} transition-all`}>
                             {m === 'bkash' ? <img src="https://seeklogo.com/images/B/bkash-logo-FBB258B90F-seeklogo.com.png" className="w-full h-full object-contain" /> :
                              m === 'nagad' ? <img src="https://seeklogo.com/images/N/nagad-logo-7A70CCFEE0-seeklogo.com.png" className="w-full h-full object-contain" /> :
                              m === 'rocket' ? <img src="https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png" className="w-full h-full object-contain" /> :
                              m === 'usdt' ? <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className="w-full h-full object-contain" /> :
                              m === 'btc' ? <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" className="w-full h-full object-contain" /> :
                              <span className="material-symbols-outlined text-blue-500 text-lg">account_balance_wallet</span>}
                      </div>
                      <span className={`text-[9px] font-black uppercase relative z-10 ${method === m ? 'text-white' : 'text-gray-500'}`}>{m}</span>
                      {method === m && <div className={`absolute inset-0 bg-gradient-to-r ${getMethodColor(m)} opacity-10`}></div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest pl-1">Amount & {isCrypto ? 'Address' : 'Number'}</label>
                
                <div className="bg-black/40 rounded-2xl p-4 border border-white/10 ring-1 ring-white/5 flex items-center gap-2 mb-2">
                  <span className="text-2xl font-black text-gray-500">৳</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-3xl font-black text-white outline-none placeholder-gray-700 tabular-nums"
                  />
                  <button onClick={() => setAmount(Math.floor(balance).toString())} className="px-3 py-1.5 rounded-lg bg-white/10 text-[9px] font-black text-blue-400 uppercase">MAX</button>
                </div>

                <div className="bg-black/40 rounded-2xl p-4 border border-white/10">
                    <input 
                    type={isCrypto ? "text" : "tel"}
                    placeholder={isCrypto ? "Wallet Address..." : "01XXXXXXXXX"}
                    value={accountInfo}
                    onChange={(e) => setAccountInfo(e.target.value)}
                    className={`w-full bg-transparent font-black text-center text-white outline-none placeholder-gray-700 ${isCrypto ? 'text-xs break-all' : 'text-xl tracking-widest'}`}
                    />
                </div>
              </div>

              <button 
                onClick={handleWithdrawRequest}
                className={`w-full py-4 rounded-2xl bg-gradient-to-r ${getMethodColor(method)} text-white font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group`}
              >
                Confirm & Verify <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          )}

          {/* VIEW 3: PIN VERIFICATION */}
          {view === 'verify_pin' && (
              <div className="space-y-6 animate-in slide-in-from-right">
                  <div className="text-center">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Confirming Transaction</p>
                      <h3 className="text-2xl font-black text-white">৳ {parseInt(amount).toLocaleString()}</h3>
                      <p className="text-xs text-blue-400 font-bold mt-1">To: {accountInfo}</p>
                  </div>
                  
                  <div className="bg-yellow-900/10 border border-yellow-600/20 p-4 rounded-2xl text-center">
                      <span className="material-symbols-outlined text-yellow-500 text-2xl mb-2">lock</span>
                      <p className="text-white font-bold text-sm mb-2">Security Verification</p>
                      <PinInput val={inputPin} setVal={setInputPin} placeholder="Enter 6-Digit PIN" autoFocus={true} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setView('form'); setError(''); }} className="py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-black text-xs uppercase hover:bg-white/10 transition-all">Back</button>
                    <button onClick={verifyAndSubmit} className="py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase shadow-lg active:scale-95 transition-all">Submit</button>
                  </div>
              </div>
          )}

          {/* VIEW 4: PROCESSING */}
          {view === 'processing' && (
            <div className="py-8 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className={`absolute inset-0 border-4 border-t-transparent rounded-full animate-spin border-${method === 'bkash' ? 'pink' : method === 'nagad' ? 'orange' : method === 'usdt' ? 'emerald' : method === 'btc' ? 'yellow' : 'blue'}-500`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-gray-600">lock</span>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-black text-lg uppercase italic tracking-tighter">Processing</h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Verifying PIN & Balance...</p>
              </div>
            </div>
          )}

          {/* VIEW 5: SUCCESS */}
          {view === 'success' && (
            <div className="py-6 text-center space-y-6 animate-in zoom-in duration-300">
               <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_#22c55e] animate-bounce">
                  <span className="material-symbols-outlined text-black text-4xl font-black">check</span>
               </div>
               <div className="space-y-2">
                  <h3 className="text-white font-black text-2xl uppercase italic tracking-tighter">Withdrawal Sent</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed px-4">
                    Your withdrawal of <span className="text-white">৳{parseInt(amount).toLocaleString()}</span> has been submitted to Admin.
                  </p>
               </div>
               <button 
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-white/10 border border-white/10 text-white font-black text-xs uppercase hover:bg-white/20 transition-all"
               >
                   Close
               </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
