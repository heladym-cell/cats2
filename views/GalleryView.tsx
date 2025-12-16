import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserRole, MediaType, UploadProgress, MediaItem, MediaItemStorage } from '../types.ts';
import { ArrowLeft, Upload, Layers, Image as ImageIcon, Film } from 'lucide-react';
import { MediaGrid } from '../components/MediaGrid.tsx';
import { Lightbox } from '../components/Lightbox.tsx';
import { UploadModal } from '../components/UploadModal.tsx';
import { EmptyState } from '../components/EmptyState.tsx';

export const GalleryView: React.FC = () => {
  const { galleryId } = useParams<{ galleryId: string }>();
  const { galleries, mediaItems, addMedia, deleteMedia } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const gallery = galleries.find(g => g.id === galleryId);
  const isAdmin = user?.role === UserRole.ADMIN;

  // --- State ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  // --- Filter Logic ---
  const allMedia = useMemo(() => mediaItems.filter(m => m.galleryId === galleryId), [mediaItems, galleryId]);
  const photos = useMemo(() => allMedia.filter(m => m.type === MediaType.PHOTO), [allMedia]);
  const videos = useMemo(() => allMedia.filter(m => m.type === MediaType.VIDEO), [allMedia]);
  
  const unifiedMediaList = useMemo(() => {
    if (filter === 'PHOTO') return photos;
    if (filter === 'VIDEO') return videos;
    return allMedia; // Default sort by add order
  }, [filter, photos, videos, allMedia]);

  // --- Actions ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !galleryId) return;

    const files = Array.from(e.target.files) as File[];
    
    // Init Progress
    const newUploads = files.map(f => ({
      fileName: f.name,
      progress: 0,
      status: 'pending' as const
    }));
    setUploads(newUploads);

    // Process
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.type.startsWith('image') ? MediaType.PHOTO : MediaType.VIDEO;

      setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, progress: 10 } : u));

      try {
        await new Promise(r => setTimeout(r, 100)); // Sim delay
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

  const closeUpload = () => {
    setIsUploadModalOpen(false);
    setUploads([]);
  };

  // --- Lightbox Navigation ---
  const handleNext = useCallback(() => {
    if (!previewItem) return;
    const currentIndex = unifiedMediaList.findIndex(m => m.id === previewItem.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % unifiedMediaList.length;
    setPreviewItem(unifiedMediaList[nextIndex]);
  }, [unifiedMediaList, previewItem]);

  const handlePrev = useCallback(() => {
    if (!previewItem) return;
    const currentIndex = unifiedMediaList.findIndex(m => m.id === previewItem.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + unifiedMediaList.length) % unifiedMediaList.length;
    setPreviewItem(unifiedMediaList[prevIndex]);
  }, [unifiedMediaList, previewItem]);

  if (!gallery) return <div className="text-center mt-10 text-gray-500">Галерея не найдена</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-6 border-b border-gray-200 pb-6">
        <button 
          onClick={() => navigate(`/category/${gallery.categoryId}`)} 
          className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Назад в категорию
        </button>

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

        {/* Tabs */}
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

      {/* Content */}
      {allMedia.length === 0 ? (
        <EmptyState 
          icon={Layers} 
          title="Пустая галерея" 
          description="Здесь пока ничего нет." 
        />
      ) : (
        <div className="space-y-8">
           {(filter === 'ALL' || filter === 'PHOTO') && photos.length > 0 && (
            <section>
              <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">Фотографии</h3>
              <MediaGrid items={photos} type={MediaType.PHOTO} isAdmin={isAdmin} onItemClick={setPreviewItem} onDelete={deleteMedia} />
            </section>
           )}

           {(filter === 'ALL' || filter === 'VIDEO') && videos.length > 0 && (
            <section>
              <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">Видео</h3>
              <MediaGrid items={videos} type={MediaType.VIDEO} isAdmin={isAdmin} onItemClick={setPreviewItem} onDelete={deleteMedia} />
            </section>
           )}
        </div>
      )}

      {/* Modals */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={closeUpload} 
        onFileSelect={handleFileSelect} 
        uploads={uploads} 
      />

      {previewItem && (
        <Lightbox 
          item={previewItem} 
          totalItems={unifiedMediaList.length}
          currentIndex={unifiedMediaList.findIndex(m => m.id === previewItem.id)}
          onClose={() => setPreviewItem(null)} 
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </div>
  );
};