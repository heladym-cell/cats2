import React from 'react';
import { Play, Trash2 } from 'lucide-react';
import { MediaItem, MediaType } from '../types.ts';

interface MediaGridProps {
  items: MediaItem[];
  type: MediaType;
  isAdmin: boolean;
  onItemClick: (item: MediaItem) => void;
  onDelete: (id: string) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({ items, type, isAdmin, onItemClick, onDelete }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-[fadeIn_0.3s_ease-out]">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="group relative bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        >
          <div className="aspect-[4/3] bg-gray-100 relative">
            <div 
              onClick={() => onItemClick(item)}
              className="w-full h-full cursor-pointer"
            >
              {type === MediaType.PHOTO ? (
                <img 
                  src={item.url} 
                  alt={item.fileName} 
                  className="w-full h-full object-cover transition-opacity duration-300" 
                  loading="lazy" 
                />
              ) : (
                <div className="w-full h-full relative flex items-center justify-center bg-gray-900">
                  <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  <div className="z-10 bg-white/20 p-3 rounded-full backdrop-blur-md group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 text-white fill-current" />
                  </div>
                </div>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm('Удалить файл?')) onDelete(item.id);
                }}
                className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-sm z-20"
                title="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          {item.fileName && (
             <div className="p-2 bg-white border-t border-gray-50">
               <p className="text-xs text-gray-500 truncate">{item.fileName}</p>
             </div>
          )}
        </div>
      ))}
    </div>
  );
};