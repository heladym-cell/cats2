export enum UserRole {
  ADMIN = 'ADMIN',
  GUEST = 'GUEST',
}

export interface User {
  username: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  coverImage?: string; // Base64 string for thumbnail
  createdAt: number;
}

export interface Gallery {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  coverImage?: string; // Base64 string for thumbnail
  createdAt: number;
}

export enum MediaType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
}

// Интерфейс для хранения в БД
export interface MediaItemStorage {
  id: string;
  galleryId: string;
  type: MediaType;
  blob: Blob; // Бинарные данные
  fileName: string;
  createdAt: number;
}

// Интерфейс для использования в UI
export interface MediaItem extends Omit<MediaItemStorage, 'blob'> {
  url: string; // Blob URL для отображения
  blob?: Blob; // Опционально, если нужно для скачивания/редактирования
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'complete' | 'error';
}