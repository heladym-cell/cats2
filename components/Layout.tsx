import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Cat, User as UserIcon, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <Cat className="h-8 w-8 text-indigo-600" />
                <span className="font-bold text-xl tracking-tight text-gray-900">Кото-Галерея</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserIcon className="h-4 w-4" />
                    <span className="hidden sm:block">
                      {user.username === 'admin' ? 'Администратор' : 'Гость'}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Выйти"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Вход для администратора</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Кото-Галерея.
        </div>
      </footer>
    </div>
  );
};