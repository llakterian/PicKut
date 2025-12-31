
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null); // null for free crop
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  
  // Crop area in normalized coordinates (0-1)
  const [crop, setCrop] = useState({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startCrop = useRef({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => setImg(image);
  }, [imageSrc]);

  const getMousePos = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  const handleMouseDown = (e: React.MouseEvent, type: typeof dragType) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    startPos.current = getMousePos(e);
    startCrop.current = { ...crop };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragType) return;
      const currentPos = getMousePos(e);
      const dx = currentPos.x - startPos.current.x;
      const dy = currentPos.y - startPos.current.y;

      let newCrop = { ...startCrop.current };

      if (dragType === 'move') {
        newCrop.x = Math.max(0, Math.min(1 - newCrop.width, startCrop.current.x + dx));
        newCrop.y = Math.max(0, Math.min(1 - newCrop.height, startCrop.current.y + dy));
      } else {
        if (dragType.includes('w')) {
          const newX = Math.max(0, Math.min(startCrop.current.x + startCrop.current.width - 0.05, startCrop.current.x + dx));
          newCrop.width = startCrop.current.x + startCrop.current.width - newX;
          newCrop.x = newX;
        }
        if (dragType.includes('e')) {
          newCrop.width = Math.max(0.05, Math.min(1 - startCrop.current.x, startCrop.current.width + dx));
        }
        if (dragType.includes('n')) {
          const newY = Math.max(0, Math.min(startCrop.current.y + startCrop.current.height - 0.05, startCrop.current.y + dy));
          newCrop.height = startCrop.current.y + startCrop.current.height - newY;
          newCrop.y = newY;
        }
        if (dragType.includes('s')) {
          newCrop.height = Math.max(0.05, Math.min(1 - startCrop.current.y, startCrop.current.height + dy));
        }

        if (aspectRatio) {
          // Adjust to maintain aspect ratio
          // This is a simplified version: adjust height based on width and center/bound it
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            const realW = newCrop.width * containerRect.width;
            const targetRealH = realW / aspectRatio;
            newCrop.height = targetRealH / containerRect.height;
            
            // Ensure within bounds
            if (newCrop.y + newCrop.height > 1) {
              newCrop.height = 1 - newCrop.y;
              const targetRealW = (newCrop.height * containerRect.height) * aspectRatio;
              newCrop.width = targetRealW / containerRect.width;
            }
          }
        }
      }
      setCrop(newCrop);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, aspectRatio]);

  const handleCrop = () => {
    if (!img || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sourceX = crop.x * img.width;
    const sourceY = crop.y * img.height;
    const sourceW = crop.width * img.width;
    const sourceH = crop.height * img.height;

    canvas.width = sourceW;
    canvas.height = sourceH;
    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);
    
    onCropComplete(canvas.toDataURL('image/png'));
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="flex items-center justify-between px-2">
        <div className="flex gap-2">
          {[
            { label: 'FREE', value: null },
            { label: '1:1', value: 1 },
            { label: '4:3', value: 4/3 },
            { label: '16:9', value: 16/9 }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setAspectRatio(preset.value);
                // Reset crop to a sensible centered default when ratio changes
                setCrop({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
              }}
              className={`px-3 py-1.5 rounded-lg text-[9px] mono border transition-all ${aspectRatio === preset.value ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-white' : 'border-white/5 opacity-50'}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} className="!py-2 !px-4">CANCEL</Button>
          <Button variant="primary" onClick={handleCrop} className="!py-2 !px-4">APPLY_CROP</Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative flex-1 bg-black/60 rounded-3xl overflow-hidden border border-white/10 select-none cursor-crosshair"
        style={{ minHeight: '400px' }}
      >
        {img && (
          <>
            <img src={imageSrc} className="w-full h-full object-contain opacity-40" alt="Cropping" />
            <div 
              className="absolute border-2 border-[var(--primary)] shadow-[0_0_20px_rgba(0,255,65,0.3)]"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
              }}
            >
              {/* Image Preview inside crop area */}
              <div className="w-full h-full overflow-hidden relative">
                 <img 
                  src={imageSrc} 
                  className="absolute"
                  style={{
                    width: `${100 / crop.width}%`,
                    height: `${100 / crop.height}%`,
                    left: `${-crop.x * (100 / crop.width)}%`,
                    top: `${-crop.y * (100 / crop.height)}%`,
                    objectFit: 'contain'
                  }}
                  alt="Crop Preview"
                />
                
                {/* Movement handle */}
                <div 
                  className="absolute inset-0 cursor-move"
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
                />

                {/* Grid overlay */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                  <div className="border-r border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-b border-white"></div>
                  <div className="border-r border-white"></div>
                  <div className="border-r border-white"></div>
                  <div></div>
                </div>
              </div>

              {/* Resize handles */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-[var(--primary)] cursor-nw-resize" onMouseDown={(e) => handleMouseDown(e, 'nw')} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--primary)] cursor-ne-resize" onMouseDown={(e) => handleMouseDown(e, 'ne')} />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[var(--primary)] cursor-sw-resize" onMouseDown={(e) => handleMouseDown(e, 'sw')} />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--primary)] cursor-se-resize" onMouseDown={(e) => handleMouseDown(e, 'se')} />
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
