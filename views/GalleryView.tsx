import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, MediaType, UploadProgress, MediaItem, MediaItemStorage } from '../types';
import { ArrowLeft, Upload, Trash2, X, Play, ChevronLeft, ChevronRight, Image as ImageIcon, Film, Layers } from 'lucide-react';
import { Modal } from '../components/Modal';

export const GalleryView: React.FC = () => {
  const { galleryId } = useParams<{ galleryId: string }>();
  const { galleries, mediaItems, addMedia, deleteMedia } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const gallery = galleries.find(g => g.id === galleryId);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter State
  const [filter, setFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');

  // Lightbox State
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isAdmin = user?.role === UserRole.ADMIN;
  
  // Filter media
  const allMedia = useMemo(() => mediaItems.filter(m => m.galleryId === galleryId), [mediaItems, galleryId]);
  const photos = useMemo(() => allMedia.filter(m => m.type === MediaType.PHOTO), [allMedia]);
  const videos = useMemo(() => allMedia.filter(m => m.type === MediaType.VIDEO), [allMedia]);
  
  // Unified list for lightbox navigation
  const unifiedMediaList = useMemo(() => {
    if (filter === 'PHOTO') return photos;
    if (filter === 'VIDEO') return videos;
    return [...photos, ...videos];
  }, [filter, photos, videos]);

  useEffect(() => {
    if (previewItem?.type === MediaType.VIDEO && videoRef.current) {
      videoRef.current.play().catch(error => console.log("Autoplay prevented:", error));
    }
  }, [previewItem]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!previewItem) return;
    const currentIndex = unifiedMediaList.findIndex(m => m.id === previewItem.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % unifiedMediaList.length;
    setPreviewItem(unifiedMediaList[nextIndex]);
  }, [unifiedMediaList, previewItem]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!previewItem) return;
    const currentIndex = unifiedMediaList.findIndex(m => m.id === previewItem.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + unifiedMediaList.length) % unifiedMediaList.length;
    setPreviewItem(unifiedMediaList[prevIndex]);
  }, [unifiedMediaList, previewItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewItem) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') setPreviewItem(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewItem, handleNext, handlePrev]);

  if (!gallery) return <div className="text-center mt-10 text-gray-500">Галерея не найдена</div>;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !galleryId) return;

    const files = Array.from(e.target.files) as File[];
    
    const newUploads = files.map(f => ({
      fileName: f.name,
      progress: 0,
      status: 'pending' as const
    }));
    setUploads(newUploads);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.type.startsWith('image') ? MediaType.PHOTO : MediaType.VIDEO;

      setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: 'pending', progress: 10 } : u));

      try {
        await new Promise(r => setTimeout(r, 100)); // UI delay
        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, progress: 40 } : u));

        const newItem: MediaItemStorage = {
          id: crypto.randomUUID(),
          galleryId,
          type,
          blob: file,     
          fileName: file.name,
          createdAt: Date.now()
        };

        await addMedia(newItem);

        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: 'complete', progress: 100 } : u));
      } catch (err) {
        console.error(err);
        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: 'error', progress: 0 } : u));
      }
    }
  };

  const handleCloseUpload = () => {
    setIsUploadModalOpen(false);
    setUploads([]);
  };

  const MediaGrid = ({ items, type }: { items: MediaItem[], type: MediaType }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <div key={item.id} className="group relative bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <div className="aspect-[4/3] bg-gray-100 relative">
            <div 
              onClick={() => setPreviewItem(item)}
              className="w-full h-full cursor-pointer"
            >
              {type === MediaType.PHOTO ? (
                <img src={item.url} alt="Cat" className="w-full h-full object-cover" loading="lazy" />
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
                  if(confirm('Удалить файл?')) deleteMedia(item.id);
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

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate(`/category/${gallery.categoryId}`)} 
        className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Назад в категорию
      </button>

      <div className="flex flex-col gap-6 border-b border-gray-200 pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{gallery.title}</h2>
            {gallery.description && <p className="text-gray-500 mt-1">{gallery.description}</p>}
          </div>
          
          {isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Upload className="h-5 w-5" />
              <span>Добавить фото/видео</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', icon: Layers, label: 'Все', count: allMedia.length },
            { id: 'PHOTO', icon: ImageIcon, label: 'Фото', count: photos.length },
            { id: 'VIDEO', icon: Film, label: 'Видео', count: videos.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === tab.id
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded ml-1 ${filter === tab.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {(filter === 'ALL' || filter === 'PHOTO') && photos.length > 0 && (
        <section className="animate-[fadeIn_0.3s_ease-out]">
          <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">Фотографии</h3>
          <MediaGrid items={photos} type={MediaType.PHOTO} />
        </section>
      )}

      {(filter === 'ALL' || filter === 'VIDEO') && videos.length > 0 && (
        <section className="animate-[fadeIn_0.3s_ease-out]">
           <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4 mt-8">Видео</h3>
          <MediaGrid items={videos} type={MediaType.VIDEO} />
        </section>
      )}

      {allMedia.length === 0 && (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200 mx-auto max-w-2xl">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Пустая галерея</h3>
          <p className="text-gray-500 mt-1">Здесь пока ничего нет.</p>
        </div>
      )}

      <Modal isOpen={isUploadModalOpen} onClose={handleCloseUpload} title="Загрузка медиа">
        <div className="space-y-4">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              multiple 
              accept="image/*,video/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-gray-900 font-medium">Нажмите для выбора файлов</p>
            <p className="text-xs text-gray-500 mt-1">Поддерживаются JPG, PNG, MP4</p>
          </div>

          {uploads.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {uploads.map((u, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                  <div className="flex-1 truncate font-medium text-gray-700">{u.fileName}</div>
                  <div className="w-24 flex justify-end">
                    {u.status === 'complete' ? (
                      <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">Готово</span>
                    ) : u.status === 'error' ? (
                      <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full">Ошибка</span>
                    ) : (
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${u.progress}%` }}></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Lightbox */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewItem(null)}
        >
          <button 
            onClick={() => setPreviewItem(null)}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-[110] p-2 hover:bg-white/10 rounded-full"
          >
            <X className="h-8 w-8" />
          </button>

          {unifiedMediaList.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-white/5 hover:bg-white/20 p-3 rounded-full transition-all z-[110] backdrop-blur-sm"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button 
                onClick={handleNext}
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
            {previewItem.type === MediaType.PHOTO ? (
              <img 
                src={previewItem.url} 
                alt="Full size" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <video 
                ref={videoRef}
                key={previewItem.id}
                src={previewItem.url} 
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
                controls 
                autoPlay 
                playsInline
              />
            )}
            {previewItem.fileName && (
              <div className="mt-4 text-white/70 font-medium tracking-wide bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                {previewItem.fileName} <span className="text-white/40 mx-2">•</span> {unifiedMediaList.findIndex(m => m.id === previewItem?.id) + 1} из {unifiedMediaList.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};