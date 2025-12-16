import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/');
    } else {
      setError("Неверное имя пользователя или пароль.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Вход для администратора</h1>
          <p className="text-gray-500 text-center mt-2">Введите учетные данные для управления галереей.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя пользователя</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль администратора"
            />
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
};