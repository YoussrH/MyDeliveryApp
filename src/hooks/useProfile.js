// hooks/useProfile.js
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useProfile = () => {
  const { api, livreurInfo, obtenirInfoLivreur } = useAuth();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const mettreAJourProfil = useCallback(async (donnees) => {
    try {
      setChargement(true);
      setErreur(null);
      
      const response = await api.put('/livreur/mon-profil', donnees);
      
      if (response.data?.success) {
        await obtenirInfoLivreur(); // Refresh livreur info
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      setErreur(err.message);
      console.error('Profile update error:', err);
      return false;
    } finally {
      setChargement(false);
    }
  }, [api, obtenirInfoLivreur]);



  return {
    livreurInfo,
    chargement,
    erreur,
    mettreAJourProfil,
  };
};