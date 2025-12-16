import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { DataProvider } from './contexts/DataContext.tsx';
import { Layout } from './components/Layout.tsx';
import { AdminInit } from './views/AdminInit.tsx';
import { Login } from './views/Login.tsx';
import { Home } from './views/Home.tsx';
import { CategoryView } from './views/CategoryView.tsx';
import { GalleryView } from './views/GalleryView.tsx';

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