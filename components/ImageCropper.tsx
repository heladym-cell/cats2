
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // width / height, default 16/9
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ 
  imageSrc, 
  onConfirm, 
  onCancel, 
  aspectRatio = 16/9 
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Helper to calculate rendered size
  const getRenderSize = () => {
    if (!containerRef.current || !imageRef.current) return { width: 0, height: 0 };
    
    const container = containerRef.current.getBoundingClientRect();
    const img = imageRef.current;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = container.width / container.height;

    let width, height;
    
    // Fit image to container initially (contain)
    // Actually, for a cropper, usually we want 'cover' behavior initially if possible, 
    // or 'contain' and let user zoom. Let's do 'contain' logic to determine base dimensions.
    if (imgRatio > containerRatio) {
      width = container.width;
      height = container.width / imgRatio;
    } else {
      height = container.height;
      width = container.height * imgRatio;
    }
    
    return { width, height };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setPan({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    const container = containerRef.current;
    
    if (!ctx || !img || !container) return;

    // High resolution output
    const resolution = 2; 
    const width = 800; // Output width
    const height = width / aspectRatio;

    canvas.width = width;
    canvas.height = height;

    const rect = container.getBoundingClientRect();
    const { width: renderWidth, height: renderHeight } = getRenderSize();

    // Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Coordinate mapping:
    // 1. Center canvas
    ctx.translate(width / 2, height / 2);
    
    // 2. Apply pan (scaled to output)
    // pan is in screen pixels. We need to convert screen pixels to output pixels.
    // The visual container width is `rect.width`. The output width is `width`.
    const scaleFactor = width / rect.width;
    ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);
    
    // 3. Apply Zoom
    ctx.scale(zoom, zoom);
    
    // 4. Draw Image
    // The image was rendered at `renderWidth` x `renderHeight` in the UI.
    // We draw it at that size (scaled up by resolution factor)
    ctx.drawImage(
      img, 
      (-renderWidth / 2) * scaleFactor, 
      (-renderHeight / 2) * scaleFactor, 
      renderWidth * scaleFactor, 
      renderHeight * scaleFactor
    );

    onConfirm(canvas.toDataURL('image/jpeg', 0.85));
  };

  // Bind events to window to handle dragging outside container
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove as any, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove as any);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-2xl bg-gray-900 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Move className="h-4 w-4 text-indigo-400" />
            Редактирование области
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center min-h-[300px] w-full select-none touch-none">
          {/* Container defining the viewport */}
          <div 
            ref={containerRef}
            className="relative overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] border-2 border-indigo-500/50"
            style={{ 
              width: '100%', 
              maxWidth: '600px',
              aspectRatio: `${aspectRatio}`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            {/* The Image */}
            <img 
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              className="absolute left-1/2 top-1/2 max-w-none origin-center pointer-events-none select-none"
              style={{
                width: imageLoaded ? `${getRenderSize().width}px` : 'auto',
                height: imageLoaded ? `${getRenderSize().height}px` : 'auto',
                transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
              onLoad={() => setImageLoaded(true)}
              draggable={false}
            />
            
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="w-full h-full border border-white/30 flex">
                    <div className="w-1/3 h-full border-r border-white/30"></div>
                    <div className="w-1/3 h-full border-r border-white/30"></div>
                </div>
                <div className="absolute inset-0 flex flex-col">
                    <div className="h-1/3 w-full border-b border-white/30"></div>
                    <div className="h-1/3 w-full border-b border-white/30"></div>
                </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-gray-900 border-t border-gray-800 space-y-4">
          <div className="flex items-center gap-4 max-w-md mx-auto">
            <ZoomOut className="h-5 w-5 text-gray-400" />
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.05" 
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <ZoomIn className="h-5 w-5 text-gray-400" />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Отмена
            </button>
            <button 
              onClick={handleCrop}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-900/20 transition-all"
            >
              <Check className="h-4 w-4" />
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
