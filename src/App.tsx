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
import { AppProvider } from './context/AppContext';

export default function App() {
  console.log('--- App component starting render now (final check) ---');
  console.log('--- App component starting render now ---');
  console.log('--- App component starting render ---');
  console.log('Starting App component render...');
  console.log('App component rendering...');
  console.log('Rendering App...');
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

