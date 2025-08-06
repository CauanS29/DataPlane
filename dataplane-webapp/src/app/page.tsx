'use client';

import React from 'react';
import { useAppStore } from '@/store';
import Header from '@/components/Header';
import PredictionPage from '@/components/PredictionPage';
import DashboardPage from '@/components/DashboardPage';
import ChartsPage from '@/components/ChartsPage';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  const { currentView } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8">
        {currentView === 'prediction' ? (
          <PredictionPage />
        ) : currentView === 'charts' ? (
          <ChartsPage />
        ) : (
          <DashboardPage />
        )}
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}
