import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { Layout } from './components/Layout';
import { AdminInit } from './views/AdminInit';
import { Login } from './views/Login';
import { Home } from './views/Home';
import { CategoryView } from './views/CategoryView';
import { GalleryView } from './views/GalleryView';

const AppRoutes: React.FC = () => {
  const { isInitialized } = useAuth();

  // If app is not initialized with an admin, force init screen
  if (!isInitialized) {
    return <AdminInit />;
  }

  // Authenticated (User or Guest)
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/category/:categoryId" element={<CategoryView />} />
        <Route path="/gallery/:galleryId" element={<GalleryView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;