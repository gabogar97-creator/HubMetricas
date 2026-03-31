/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Admin } from './pages/Admin';
import { Logs } from './pages/Logs';
import { Profile } from './pages/Profile';
import { AppProvider } from './context/AppContext';
import { UIProvider } from './context/UIContext';

export default function App() {
  console.log('--- App component starting render now (final check) ---');
  console.log('--- App component starting render now ---');
  console.log('--- App component starting render ---');
  console.log('Starting App component render...');
  console.log('App component rendering...');
  console.log('Rendering App...');
  return (
    <UIProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="admin" element={<Admin />} />
              <Route path="logs" element={<Logs />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </UIProvider>
  );
}

