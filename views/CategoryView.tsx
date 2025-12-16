
import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Gallery } from '../types';
import { Plus, Trash2, ArrowLeft, Image as ImageIcon, Pencil, ImagePlus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { ImageCropper } from '../components/ImageCropper';

export const CategoryView: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { categories, galleries, addGallery, updateGallery, deleteGallery } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const category = categories.find(c => c.id === categoryId);
  const categoryGalleries = galleries.filter(g => g.categoryId === categoryId);
  const isAdmin = user?.role === UserRole.ADMIN;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [galCover, setGalCover] = useState('');
  
  // Cropper State
  const [cropImage, setCropImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!category) return <div className="text-center mt-10">Категория не найдена</div>;

  const openCreateModal = () => {
    setEditingGallery(null);
    setTitle('');
    setDesc('');
    setGalCover('');
    setIsModalOpen(true);
  };

  const openEditModal = (gal: Gallery, e: React.MouseEvent) => {
    e.preventDefault();
    setEditingGallery(gal);
    setTitle(gal.title);
    setDesc(gal.description || '');
    setGalCover(gal.coverImage || '');
    setIsModalOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleCropConfirm = (croppedBase64: string) => {
    setGalCover(croppedBase64);
    setCropImage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && categoryId) {
      if (editingGallery) {
        updateGallery(editingGallery.id, title, desc, galCover);
      } else {
        addGallery(categoryId, title, desc, galCover);
      }
      setTitle('');
      setDesc('');
      setGalCover('');
      setIsModalOpen(false);
      setEditingGallery(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cropper Modal Overlay */}
      {cropImage && (
        <ImageCropper 
          imageSrc={cropImage} 
          onConfirm={handleCropConfirm} 
          onCancel={() => setCropImage(null)}
          aspectRatio={1.5} // slightly taller for galleries than categories
        />
      )}

      <button onClick={() => navigate('/')} className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-1" /> Назад к категориям
      </button>

      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{category.name}</h2>
          <p className="text-gray-500 mt-1">{category.description}</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span>Новая галерея</span>
          </button>
        )}
      </div>

      {categoryGalleries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
           <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Галерей пока нет</h3>
          {isAdmin && <p className="text-gray-500">Создайте галерею, чтобы начать загружать фото.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryGalleries.map((gal) => (
            <Link 
              key={gal.id} 
              to={`/gallery/${gal.id}`}
              className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              <div className="h-64 bg-gray-100 relative overflow-hidden">
                {gal.coverImage ? (
                  <img src={gal.coverImage} alt={gal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300 bg-gray-50">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900">{gal.title}</h3>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => openEditModal(gal, e)}
                        className="text-gray-300 hover:text-indigo-500 transition-colors p-1"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm('Удалить эту галерею?')) deleteGallery(gal.id);
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                {gal.description && <p className="text-sm text-gray-500 mt-1">{gal.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingGallery ? "Редактировать галерею" : "Создать галерею"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Название</label>
            <input
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Описание</label>
            <textarea
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Обложка галереи</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors h-40 overflow-hidden relative group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageSelect}
              />
              {galCover ? (
                <>
                  <img src={galCover} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">Изменить</span>
                  </div>
                </>
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Нажмите для выбора фото</span>
                </>
              )}
            </div>
             {galCover && (
               <button 
                type="button" 
                onClick={() => setGalCover('')} 
                className="text-xs text-red-500 mt-1 hover:underline"
              >
                Удалить обложку
              </button>
            )}
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
            {editingGallery ? "Сохранить" : "Создать"}
          </button>
        </form>
      </Modal>
    </div>
  );
};
