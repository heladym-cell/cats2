import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category, Gallery, MediaItem, MediaItemStorage, MediaType } from '../types.ts';
import { storageService } from '../services/storage.ts';

interface DataContextType {
  categories: Category[];
  galleries: Gallery[];
  mediaItems: MediaItem[];
  isLoading: boolean;
  addCategory: (name: string, description: string, coverImage?: string) => void;
  updateCategory: (id: string, name: string, description: string, coverImage?: string) => void;
  addGallery: (categoryId: string, title: string, description?: string, coverImage?: string) => void;
  updateGallery: (id: string, title: string, description?: string, coverImage?: string) => void;
  addMedia: (item: MediaItemStorage) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  deleteGallery: (id: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Persistence Helpers (LocalStorage for Metadata) ---
  const saveCategories = (data: Category[]) => {
    setCategories(data);
    localStorage.setItem('pg_categories', JSON.stringify(data));
  };

  const saveGalleries = (data: Gallery[]) => {
    setGalleries(data);
    localStorage.setItem('pg_galleries', JSON.stringify(data));
  };

  // --- Load Data ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 1. Load Metadata
        const c = localStorage.getItem('pg_categories');
        const g = localStorage.getItem('pg_galleries');
        if (c) setCategories(JSON.parse(c));
        if (g) setGalleries(JSON.parse(g));

        // 2. Load Media from IndexedDB via Service
        const storedItems = await storageService.getAllMedia();
        
        // Convert Blobs to ObjectURLs for display
        const displayItems: MediaItem[] = storedItems.map(item => ({
          id: item.id,
          galleryId: item.galleryId,
          type: item.type,
          fileName: item.fileName,
          createdAt: item.createdAt,
          url: URL.createObjectURL(item.blob),
          blob: item.blob
        }));

        setMediaItems(displayItems);
      } catch (e) {
        console.error("Failed to load application data", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Cleanup URLs on unmount to prevent memory leaks
    return () => {
      setMediaItems(prevItems => {
        prevItems.forEach(item => URL.revokeObjectURL(item.url));
        return [];
      });
    };
  }, []);

  // --- Actions ---

  const addCategory = (name: string, description: string, coverImage?: string) => {
    const newCat: Category = {
      id: crypto.randomUUID(),
      name,
      description,
      coverImage,
      createdAt: Date.now(),
    };
    saveCategories([...categories, newCat]);
  };

  const updateCategory = (id: string, name: string, description: string, coverImage?: string) => {
    const updated = categories.map(c => 
      c.id === id ? { ...c, name, description, coverImage: coverImage || c.coverImage } : c
    );
    saveCategories(updated);
  };

  const addGallery = (categoryId: string, title: string, description?: string, coverImage?: string) => {
    const newGal: Gallery = {
      id: crypto.randomUUID(),
      categoryId,
      title,
      description,
      coverImage,
      createdAt: Date.now(),
    };
    saveGalleries([...galleries, newGal]);
  };

  const updateGallery = (id: string, title: string, description?: string, coverImage?: string) => {
    const updated = galleries.map(g => 
      g.id === id ? { ...g, title, description, coverImage: coverImage || g.coverImage } : g
    );
    saveGalleries(updated);
  };

  const addMedia = async (itemStorage: MediaItemStorage) => {
    // 1. Save to DB
    await storageService.saveMedia(itemStorage);

    // 2. Update UI State
    const displayItem: MediaItem = {
      ...itemStorage,
      url: URL.createObjectURL(itemStorage.blob),
      blob: undefined // Don't keep blob in memory state if not needed, but here we might keep ref if we want
    };

    setMediaItems(prev => [...prev, displayItem]);
  };

  const deleteMedia = async (id: string) => {
    // 1. Cleanup URL
    const item = mediaItems.find(m => m.id === id);
    if (item) URL.revokeObjectURL(item.url);

    // 2. Update State
    setMediaItems(prev => prev.filter(m => m.id !== id));

    // 3. Delete from DB
    await storageService.deleteMedia(id);
  };

  const deleteGallery = async (id: string) => {
    // Remove Metadata
    saveGalleries(galleries.filter(g => g.id !== id));
    
    // Find related media
    const mediaToDelete = mediaItems.filter(m => m.galleryId === id);
    const mediaIds = mediaToDelete.map(m => m.id);

    // Cleanup URLs
    mediaToDelete.forEach(m => URL.revokeObjectURL(m.url));

    // Update State
    setMediaItems(prev => prev.filter(m => m.galleryId !== id));

    // Delete from DB
    await storageService.deleteMany(mediaIds);
  };

  const deleteCategory = async (id: string) => {
    // Remove Metadata
    saveCategories(categories.filter(c => c.id !== id));
    
    const galleriesToDelete = galleries.filter(g => g.categoryId === id);
    const galleryIds = galleriesToDelete.map(g => g.id);
    saveGalleries(galleries.filter(g => g.categoryId !== id));

    // Find related media
    const mediaToDelete = mediaItems.filter(m => galleryIds.includes(m.galleryId));
    const mediaIds = mediaToDelete.map(m => m.id);
    
    // Cleanup URLs
    mediaToDelete.forEach(m => URL.revokeObjectURL(m.url));

    // Update State
    setMediaItems(prev => prev.filter(m => !galleryIds.includes(m.galleryId)));

    // Delete from DB
    await storageService.deleteMany(mediaIds);
  };

  return (
    <DataContext.Provider value={{
      categories, galleries, mediaItems, isLoading,
      addCategory, updateCategory,
      addGallery, updateGallery,
      addMedia, deleteMedia, 
      deleteGallery, deleteCategory
    }}>
      {children}
    </DataContext.Provider>
  );
};