import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Modal } from './Modal.tsx';
import { UploadProgress } from '../types.ts';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploads: UploadProgress[];
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onFileSelect, uploads }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Загрузка медиа">
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
            onChange={onFileSelect}
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
  );
};