
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from './components/Button';
import { ImageCanvas } from './components/ImageCanvas';
import { ImageCropper } from './components/ImageCropper';
import { editImageWithGemini, generateImageWithGemini } from './services/geminiService';
import { ImageVersion, AppStatus, AppMode, AspectRatio, ImageSize, Theme } from './types';
import { applyWatermark } from './utils/watermark';

const PRESET_EDIT_PROMPTS = [
  { icon: 'fa-user-slash', label: 'Isolated', prompt: 'Remove background completely, leave only the product on pure white.' },
  { icon: 'fa-wand-magic-sparkles', label: 'Auto Fix', prompt: 'Adjust brightness and contrast for a professional, high-end commercial look.' },
  { icon: 'fa-camera-retro', label: 'Retro', prompt: 'Apply a high-end professional retro film filter to the product photo.' },
  { icon: 'fa-bolt', label: 'Shadows', prompt: 'Add realistic, professional soft drop shadows to the product.' },
];

const ASPECT_RATIOS: AspectRatio[] = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];
const IMAGE_SIZES: ImageSize[] = ["1K", "2K", "4K"];

const TRIAL_LIMIT = 3;

const PAYMENT_INFO = {
  btc: "16RcuFNJ8uaJ8wo6Egu6BTDmvZocUxkpMC",
  eth: "0x8943cced9dae2e4552820834d14134362ad6d46a",
  paypal: "cheruiyootsambu@gmail.com",
  payoneer: "cheruiyootsambu@gmail.com"
};

const PLAN_CLASSES = [
  { id: 'pro', name: 'PRO_VERSION', price: '$9.99', perks: ['NO_WATERMARK', 'UNLIMITED_EDITS', '2K_EXPORT'] },
  { id: 'elite', name: 'ELITE_VERSION', price: '$24.99', perks: ['4K_EXPORT', 'PRIORITY_NODES', 'BATCH_ACCESS'] },
  { id: 'lifetime', name: 'LIFETIME_VERSION', price: '$99.00', perks: ['PERMANENT_ACCESS', 'ALL_FUTURE_TOOLS'] }
];

export default function App() {
  const [mode, setMode] = useState<AppMode>('EDIT');
  const [history, setHistory] = useState<ImageVersion[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('pk-theme') as Theme) || 'matrix');
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem('pk-premium') === 'true');
  const [usageCount, setUsageCount] = useState(() => parseInt(localStorage.getItem('pk-usage') || '0', 10));
  const [showPayModal, setShowPayModal] = useState(false);
  const [isCropping, setIsCropping] = useState(false);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [imageSize, setImageSize] = useState<ImageSize>("1K");
  const [hasApiKey, setHasApiKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUrl = useMemo(() => {
    if (historyIndex >= 0 && historyIndex < history.length) {
      return history[historyIndex].url;
    }
    return null;
  }, [history, historyIndex]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pk-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('pk-usage', usageCount.toString());
  }, [usageCount]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const addToHistory = (version: ImageVersion) => {
    setHistory(prev => {
      const currentTimeline = prev.slice(historyIndex);
      return [version, ...currentTimeline];
    });
    setHistoryIndex(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg("SECURITY_ALERT: INVALID_MIME_TYPE");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const initialVersion: ImageVersion = {
          id: crypto.randomUUID(),
          url: url,
          prompt: 'SOURCE_INGESTED',
          timestamp: Date.now()
        };
        setOriginalUrl(url);
        setHistory([initialVersion]);
        setHistoryIndex(0);
        setMimeType(file.type);
        setMode('EDIT');
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedUrl: string) => {
    const newVersion: ImageVersion = {
      id: crypto.randomUUID(),
      url: croppedUrl,
      prompt: 'MANUAL_CROP_ADJUSTMENT',
      timestamp: Date.now()
    };
    addToHistory(newVersion);
    setIsCropping(false);
  };

  const executeAction = useCallback(async () => {
    const cleanPrompt = prompt.trim().replace(/[<>]/g, "");
    if (!cleanPrompt) return;

    if (!isPremium && usageCount >= TRIAL_LIMIT) {
      setShowPayModal(true);
      return;
    }
    
    setStatus(AppStatus.PROCESSING);
    setErrorMsg(null);
    
    try {
      let resultUrl: string;
      if (mode === 'EDIT' && currentUrl) {
        resultUrl = await editImageWithGemini({
          imageUri: currentUrl,
          prompt: cleanPrompt,
          mimeType: mimeType
        });
      } else {
        if (mode === 'GENERATE' && !hasApiKey) {
          throw new Error("BILLING_KEY_REQUIRED_FOR_SYNTHESIS");
        }
        resultUrl = await generateImageWithGemini({
          prompt: cleanPrompt,
          aspectRatio,
          imageSize
        });
      }

      if (!isPremium) {
        resultUrl = await applyWatermark(resultUrl);
      }

      const newVersion: ImageVersion = {
        id: crypto.randomUUID(),
        url: resultUrl,
        prompt: cleanPrompt,
        timestamp: Date.now()
      };

      addToHistory(newVersion);
      setUsageCount(prev => prev + 1);
      if (mode === 'GENERATE' && history.length === 0) setOriginalUrl(resultUrl);
      setStatus(AppStatus.IDLE);
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'NEURAL_FAULT');
      setStatus(AppStatus.ERROR);
    }
  }, [mode, currentUrl, prompt, mimeType, aspectRatio, imageSize, hasApiKey, historyIndex, isPremium, usageCount]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeAction();
  };

  const handleUpgrade = (planId: string) => {
    setIsPremium(true);
    localStorage.setItem('pk-premium', 'true');
    setShowPayModal(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("ADDRESS_COPIED");
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-50 glass px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center text-black shadow-lg">
            <i className="fa-solid fa-scissors text-xl"></i>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-[var(--primary)] tracking-[0.2em] matrix-text-glow uppercase">PicKut</h1>
            <p className="text-[10px] mono opacity-50 tracking-widest uppercase">
              {isPremium ? 'PREMIUM_LICENSE_ACTIVE' : `TRIAL_PHASE_${usageCount}_OF_${TRIAL_LIMIT}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 bg-black/40 border border-white/10 rounded-xl p-1">
          <button onClick={() => { setMode('EDIT'); setIsCropping(false); }} className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all ${mode === 'EDIT' ? 'bg-[var(--primary)] text-black' : 'opacity-40 hover:opacity-100'}`}>EDIT</button>
          <button onClick={() => { setMode('GENERATE'); setIsCropping(false); }} className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all ${mode === 'GENERATE' ? 'bg-[var(--primary)] text-black' : 'opacity-40 hover:opacity-100'}`}>CREATE</button>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {!isPremium && (
            <button onClick={() => setShowPayModal(true)} className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[10px] font-bold tracking-tighter hover:scale-105 transition-transform">
              <i className="fa-solid fa-crown"></i> UPGRADE_NOW
            </button>
          )}
          <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)} className="bg-black/20 border border-white/10 rounded-lg text-[10px] mono p-2 outline-none cursor-pointer">
            <option value="matrix">MATRIX</option>
            <option value="clean">CLEAN</option>
            <option value="solar">SOLAR</option>
          </select>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="relative h-full flex flex-col">
            {isCropping && currentUrl ? (
              <ImageCropper 
                imageSrc={currentUrl} 
                onCropComplete={handleCropComplete} 
                onCancel={() => setIsCropping(false)} 
              />
            ) : currentUrl ? (
              <div className="relative group">
                <ImageCanvas currentUrl={currentUrl} originalUrl={originalUrl} />
                <button 
                  onClick={() => setIsCropping(true)}
                  className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-bold border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:border-[var(--primary)]/50"
                >
                  <i className="fa-solid fa-crop-simple mr-2"></i> PRECISE_CROP
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-square md:aspect-[16/10] glass-card rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)]/50 transition-all group overflow-hidden">
                <i className="fa-solid fa-upload text-4xl mb-6 opacity-20 group-hover:text-[var(--primary)]"></i>
                <h3 className="text-lg font-bold tracking-widest uppercase">Select Source Image</h3>
              </div>
            )}
            {!isPremium && currentUrl && !isCropping && (
              <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-400 text-black text-[9px] font-black rounded uppercase">TRIAL_WATERMARK_ACTIVE</div>
            )}
          </section>

          {!isCropping && (
            <section className="flex flex-col gap-4">
              <form onSubmit={handleManualSubmit} className="relative group">
                <div className="relative flex flex-col sm:flex-row gap-2">
                  <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter instructions..." disabled={status === AppStatus.PROCESSING} className="flex-1 bg-black/60 border border-white/10 focus:border-[var(--primary)]/50 rounded-2xl px-6 py-5 text-base mono outline-none" />
                  <Button type="submit" isLoading={status === AppStatus.PROCESSING} className="rounded-xl px-12 py-5">EXECUTE</Button>
                </div>
              </form>
            </section>
          )}

          {mode === 'EDIT' && currentUrl && !isCropping && (
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_EDIT_PROMPTS.map((preset, idx) => (
                <button key={idx} onClick={() => setPrompt(preset.prompt)} className="flex flex-col items-center gap-2 p-4 glass-card rounded-2xl group transition-all hover:border-[var(--primary)]/40">
                  <i className={`fa-solid ${preset.icon} text-lg opacity-40 group-hover:opacity-100`}></i>
                  <span className="text-[9px] mono font-bold uppercase">{preset.label}</span>
                </button>
              ))}
            </section>
          )}
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card rounded-3xl overflow-hidden flex flex-col max-h-[600px] border-white/10">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-widest text-[10px]">Neural Registry</h3>
              <span className="mono text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded">{history.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {history.map((item, index) => (
                <button key={item.id} onClick={() => { setHistoryIndex(index); setIsCropping(false); }} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${historyIndex === index ? 'border-[var(--primary)]/40 bg-[var(--primary)]/5' : 'border-white/5 hover:border-white/10'}`}>
                  <img src={item.url} className="w-12 h-12 rounded-lg object-cover" alt="Node" />
                  <div className="flex-1 overflow-hidden"><p className="text-[10px] font-semibold truncate opacity-80">{item.prompt}</p></div>
                </button>
              ))}
            </div>
            {currentUrl && <div className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
              <Button variant="secondary" className="flex-1 py-4 text-xs font-black" onClick={() => setIsCropping(!isCropping)}>
                {isCropping ? 'EXIT_CROP' : 'ADJUST_CROP'}
              </Button>
              <Button variant="primary" className="flex-1 py-4 text-xs font-black" onClick={() => { const link = document.createElement('a'); link.href = currentUrl; link.download = 'pickut_export.png'; link.click(); }}>EXPORT_DATA</Button>
            </div>}
          </div>

          <div className="glass-card border-[var(--primary)]/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary)] opacity-5 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <h4 className="mono text-[10px] font-black mb-4 flex items-center gap-2 text-[var(--primary)] uppercase tracking-widest">
              <i className="fa-solid fa-crown"></i> {isPremium ? 'PREMIUM_UNLOCKED' : 'GO_PREMIUM'}
            </h4>
            <div className="text-[10px] space-y-3 mono opacity-60">
              <p>• Remove all Watermarks from refined images.</p>
              <p>• Unlimited neural processing cycles.</p>
              <p>• Early access to 4K/8K synthesis nodes.</p>
              {!isPremium && (
                <Button variant="primary" className="w-full mt-4 !text-[10px] py-3" onClick={() => setShowPayModal(true)}>GET_FULL_ACCESS</Button>
              )}
            </div>
          </div>
        </aside>
      </main>

      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="glass-card max-w-2xl w-full rounded-3xl p-6 md:p-10 border-[var(--primary)]/30 relative">
            <button onClick={() => setShowPayModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2"><i className="fa-solid fa-xmark text-xl"></i></button>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black uppercase tracking-widest text-[var(--primary)] mb-2">Service Delivery Tiers</h2>
              <p className="text-xs opacity-50 uppercase tracking-widest">Select your professional plan</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {PLAN_CLASSES.map(plan => (
                <div key={plan.id} className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center">
                  <h4 className="text-[10px] mono font-bold text-[var(--primary)] mb-1">{plan.name}</h4>
                  <p className="text-2xl font-black mb-4">{plan.price}</p>
                  <ul className="text-[9px] mono opacity-50 space-y-2 flex-1 mb-6">
                    {plan.perks.map(p => <li key={p}>- {p}</li>)}
                  </ul>
                  <Button variant="secondary" className="w-full" onClick={() => handleUpgrade(plan.id)}>SELECT_PLAN</Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-black/40 rounded-3xl border border-white/10">
              <div>
                <h4 className="text-[10px] mono font-bold text-[var(--primary)] mb-3 uppercase">Financial Gateways</h4>
                <div className="space-y-4">
                  <div className="text-[9px] mono">
                    <p className="opacity-40 mb-1">BITCOIN_SEG_WIT</p>
                    <div className="flex items-center justify-between bg-black p-2 rounded border border-white/5">{PAYMENT_INFO.btc.slice(0, 20)}... <button onClick={() => copyToClipboard(PAYMENT_INFO.btc)}><i className="fa-solid fa-copy"></i></button></div>
                  </div>
                  <div className="text-[9px] mono">
                    <p className="opacity-40 mb-1">ETH_ERC20</p>
                    <div className="flex items-center justify-between bg-black p-2 rounded border border-white/5">{PAYMENT_INFO.eth.slice(0, 20)}... <button onClick={() => copyToClipboard(PAYMENT_INFO.eth)}><i className="fa-solid fa-copy"></i></button></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] mono font-bold text-[var(--primary)] mb-3 uppercase">Traditional Rails</h4>
                  <p className="text-[9px] mono mb-1 opacity-40">PAYPAL_AND_PAYONEER</p>
                  <p className="text-[10px] mono p-2 bg-black rounded border border-white/5">{PAYMENT_INFO.paypal}</p>
                </div>
                <p className="text-[8px] mono opacity-30 italic mt-4">Security protocols: manual validation required after transfer.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="p-10 text-center border-t border-white/5 mt-auto">
        <p className="mono text-[10px] opacity-40 uppercase tracking-[0.4em] mb-2">
          PicKut Labs // Secure Infrastructure // {new Date().getFullYear()}
        </p>
        <p className="mono text-[10px] uppercase tracking-widest">
          Built by <a href="mailto:llakterian@gmail.com" className="text-[var(--primary)] hover:matrix-text-glow underline">Llakterian</a>
        </p>
      </footer>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
    </div>
  );
}
