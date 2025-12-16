import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserRole, Category } from '../types.ts';
import { Plus, Trash2, FolderOpen, Cat, Pencil, ImagePlus } from 'lucide-react';
import { Modal } from '../components/Modal.tsx';
import { ImageCropper } from '../components/ImageCropper.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const { categories, addCategory, deleteCategory, updateCategory } = useData();
  const { user } = useAuth();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catCover, setCatCover] = useState<string>('');
  
  // Cropper State
  const [cropImage, setCropImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  const openCreateModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setCatCover('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description);
    setCatCover(cat.coverImage || '');
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
    // Reset input
    if (e.target) e.target.value = '';
  };

  const handleCropConfirm = (croppedBase64: string) => {
    setCatCover(croppedBase64);
    setCropImage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (catName) {
      if (editingCategory) {
        updateCategory(editingCategory.id, catName, catDesc, catCover);
      } else {
        addCategory(catName, catDesc, catCover);
      }
      setCatName('');
      setCatDesc('');
      setCatCover('');
      setIsModalOpen(false);
      setEditingCategory(null);
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
          aspectRatio={16/9} 
        />
      )}

      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Категории</h2>
          <p className="text-gray-500 mt-1">Просмотр коллекций котов по категориям</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span>Новая категория</span>
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <EmptyState 
          icon={Cat}
          title="Категорий пока нет"
          description={isAdmin ? "Создайте первую категорию, чтобы начать структурировать галерею." : "Попросите администратора создать категорию!"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/category/${cat.id}`}
              className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              <div className="h-48 bg-gray-100 relative overflow-hidden">
                 {cat.coverImage ? (
                  <img src={cat.coverImage} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                    <FolderOpen className="h-16 w-16 text-indigo-200" />
                  </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                 <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1 shadow-black drop-shadow-md">{cat.name}</h3>
                    <p className="text-white/80 text-sm line-clamp-1">{cat.description}</p>
                 </div>
              </div>
              
              <div className="p-4 flex justify-between items-center bg-white">
                 <span className="text-xs font-medium text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                   Смотреть галереи <span>→</span>
                 </span>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => openEditModal(cat, e)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                        title="Редактировать"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm('Удалить эту категорию и все ее содержимое?')) deleteCategory(cat.id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCategory ? "Редактировать категорию" : "Создать категорию"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Название</label>
            <input
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Описание</label>
            <textarea
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Обложка категории</label>
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
              {catCover ? (
                <>
                  <img src={catCover} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
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
            {catCover && (
               <button 
                type="button" 
                onClick={() => setCatCover('')} 
                className="text-xs text-red-500 mt-1 hover:underline"
              >
                Удалить обложку
              </button>
            )}
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
            {editingCategory ? "Сохранить" : "Создать"}
          </button>
        </form>
      </Modal>
    </div>
  );
};