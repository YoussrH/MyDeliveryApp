// hooks/useQRScanner.js
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useQRScanner = () => {
  const { api } = useAuth();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [resultat, setResultat] = useState(null);

  const scannerQRCode = useCallback(async (qrData) => {
    setChargement(true);
    setErreur(null);
    
    try {
      const response = await api.post('/expeditions/colis/scanner-qr', {
        code: qrData
      });

      if (response.data.success) {
        setResultat(response.data.data);
      } else {
        setErreur(response.data.message || 'Erreur lors du scan du QR code');
      }
    } catch (error) {
      setErreur(error.response?.data?.message || 
               error.message || 
               'Erreur de connexion');
    } finally {
      setChargement(false);
    }
  }, [api]);

  return {
    scannerQRCode,
    resultat,
    chargement,
    erreur,
    reinitialiser: () => {
      setResultat(null);
      setErreur(null);
    }
  };
};