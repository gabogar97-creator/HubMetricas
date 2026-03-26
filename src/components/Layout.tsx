import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Layout() {
  console.log('--- Layout component starting render now (final check 2) ---');
  console.log('--- Layout component starting render now (final check) ---');
  console.log('--- Layout component starting render now ---');
  console.log('--- Layout component starting render ---');
  console.log('Starting Layout component render...');
  console.log('Layout component rendering...');
  console.log('Rendering Layout...');
  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans text-sm">
      <Sidebar />
      <main className="ml-[220px] flex-1 flex flex-col min-h-screen">
        <Topbar />
        <div className="p-7 animate-[fadeIn_0.2s_ease]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
