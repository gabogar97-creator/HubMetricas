/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PrioritizationQueue } from './pages/PrioritizationQueue';
import { Projects } from './pages/Projects';
import { Admin } from './pages/Admin';
import { Logs } from './pages/Logs';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { AppProvider } from './context/AppContext';
import { UIProvider } from './context/UIContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  console.log('--- App component starting render now (final check) ---');
  console.log('--- App component starting render now ---');
  console.log('--- App component starting render ---');
  console.log('Starting App component render...');
  console.log('App component rendering...');
  console.log('Rendering App...');
  return (
    <AuthProvider>
      <UIProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="queue" element={<PrioritizationQueue />} />
                <Route path="projects" element={<Projects />} />
                <Route path="admin" element={<Admin />} />
                <Route path="logs" element={<Logs />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </UIProvider>
    </AuthProvider>
  );
}

