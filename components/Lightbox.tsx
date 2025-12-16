import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem, MediaType } from '../types.ts';

interface LightboxProps {
  item: MediaItem;
  totalItems: number;
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ 
  item, 
  totalItems, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onClose]);

  useEffect(() => {
    if (item.type === MediaType.VIDEO && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [item]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-[110] p-2 hover:bg-white/10 rounded-full"
      >
        <X className="h-8 w-8" />
      </button>

      {totalItems > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-white/5 hover:bg-white/20 p-3 rounded-full transition-all z-[110] backdrop-blur-sm"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-white/5 hover:bg-white/20 p-3 rounded-full transition-all z-[110] backdrop-blur-sm"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}
      
      <div 
        className="relative max-w-full max-h-[90vh] flex flex-col items-center justify-center w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === MediaType.PHOTO ? (
          <img 
            src={item.url} 
            alt="Full size" 
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <video 
            ref={videoRef}
            src={item.url} 
            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
            controls 
            playsInline
          />
        )}
        {item.fileName && (
          <div className="mt-4 text-white/70 font-medium tracking-wide bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
            {item.fileName} <span className="text-white/40 mx-2">•</span> {currentIndex + 1} из {totalItems}
          </div>
        )}
      </div>
    </div>
  );
};