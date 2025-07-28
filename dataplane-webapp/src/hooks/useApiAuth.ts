import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import toast from 'react-hot-toast';

export const useApiAuth = () => {
  const { isAuthenticated, testApiConnection } = useAppStore();
  const [isChecking, setIsChecking] = useState(false);

  const checkAuth = useCallback(async () => {
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
  }, [testApiConnection]);

  // Verifica autenticação quando o componente monta
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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