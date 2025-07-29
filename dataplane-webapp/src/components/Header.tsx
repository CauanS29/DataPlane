import React, { useEffect } from 'react';
import { useAppStore } from '@/store';
import { Brain, BarChart3, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { LogoIcon } from './icons';
import Image from 'next/image';

const Header: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    isAuthenticated,
    testApiConnection 
  } = useAppStore();

  const handleViewChange = (view: 'prediction' | 'dashboard') => {
    setCurrentView(view);
  };

  // Testa conexão quando o componente monta
  useEffect(() => {
    testApiConnection();
  }, [testApiConnection]);

  const handleTestConnection = async () => {
    const isConnected = await testApiConnection();
    if (isConnected) {
      toast.success('API conectada com sucesso!');
    } else {
      toast.error('Erro ao conectar com a API. Verifique a configuração.');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e título */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image src={LogoIcon} alt="DataPlane" className="w-10 h-10" />
            </div>
          </div>

          {/* Navegação */}
          <nav className="flex space-x-8">
            <button
              onClick={() => handleViewChange('prediction')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'prediction'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Brain className="w-4 h-4 mr-2" />
              Predição
            </button>
            <button
              onClick={() => handleViewChange('dashboard')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </button>
          </nav>

          {/* Status da API */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTestConnection}
                className="flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors hover:bg-gray-50"
              >
                {isAuthenticated ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isAuthenticated 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isAuthenticated ? 'API Conectada' : 'API Desconectada'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 