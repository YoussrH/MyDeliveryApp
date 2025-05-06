// hooks/useQRScanner.js
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useQRScanner = () => {
  const { api } = useAuth();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [resultat, setResultat] = useState(null);

  const scannerQRCode = useCallback(async (qrData) => {
    try {
      setChargement(true);
      setErreur(null);
      setResultat(null);
      
      const response = await api.post('/expiditions/colis/scanner-qr', {
        code: qrData
      });
      
      if (response.data?.success) {
        setResultat(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'QR code processing failed');
      }
    } catch (err) {
      setErreur(err.message);
      console.error('QR scanning error:', err);
      return null;
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