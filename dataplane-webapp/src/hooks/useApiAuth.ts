import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export const useApiAuth = () => {
  const { isAuthenticated, setAuthenticated, testApiConnection } = useAppStore();
  const [isChecking, setIsChecking] = useState(false);

  // Verifica autenticação quando o componente monta
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsChecking(true);
    try {
      const isConnected = await testApiConnection();
      return isConnected;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const refreshAuth = async () => {
    const isValid = await checkAuth();
    if (!isValid) {
      toast.error('API não está disponível. Verifique a configuração.');
    }
    return isValid;
  };

  return {
    isAuthenticated,
    isChecking,
    checkAuth,
    refreshAuth,
  };
}; 