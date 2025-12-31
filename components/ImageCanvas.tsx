
import React, { useState } from 'react';

interface ImageCanvasProps {
  currentUrl: string;
  originalUrl: string | null;
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({ currentUrl, originalUrl }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div className="relative w-full aspect-square md:aspect-[16/10] bg-black/40 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <img 
        src={showOriginal && originalUrl ? originalUrl : currentUrl} 
        alt="Product View" 
        className={`w-full h-full object-contain p-8 transition-all duration-500 ease-out ${showOriginal ? 'brightness-110 contrast-110' : ''}`}
      />
      
      {originalUrl && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <button
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            className="bg-black/60 backdrop-blur-xl px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest text-[#00ff41] border border-[#00ff41]/40 shadow-[0_0_15px_rgba(0,255,65,0.2)] active:scale-95 transition-all hover:border-[#00ff41]"
          >
            HOLD TO COMPARE
          </button>
          <div className="px-3 py-1 bg-black/40 backdrop-blur text-[8px] uppercase tracking-tighter text-slate-500 rounded border border-white/5">
            {showOriginal ? 'ORIGINAL SOURCE' : 'REFINED VERSION'}
          </div>
        </div>
      )}

      {!originalUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
          <i className="fa-solid fa-microchip text-6xl mb-4 text-[#00ff41]/20"></i>
          <p className="mono text-sm tracking-widest">AWAITING INPUT_DATA...</p>
        </div>
      )}
    </div>
  );
};
