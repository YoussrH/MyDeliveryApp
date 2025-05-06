import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useLivraisons = () => {
  const { api, livreurInfo } = useAuth();
  const [livraisons, setLivraisons] = useState([]);
  const [livraisonsDisponibles, setLivraisonsDisponibles] = useState([]);
  const [statistiques, setStatistiques] = useState(null);
  const [chargement, setChargement] = useState({
    livraisons: false,
    disponibles: false,
    statistiques: false,
    statut: false,
    service: false
  });
  const [erreur, setErreur] = useState(null);

  // Common fetch handler with operation-specific loading state
  const fetchData = useCallback(async (endpoint, operation, transformFn) => {
    try {
      setChargement(prev => ({ ...prev, [operation]: true }));
      setErreur(null);

      const response = await api.get(endpoint);
      if (response.data?.success) {
        return transformFn ? transformFn(response.data) : response.data.data || [];
      }
      throw new Error(response.data?.message || 'Échec de la requête');
    } catch (err) {
      setErreur(err.message);
      console.error(`Erreur API (${operation}):`, err);
      throw err;
    } finally {
      setChargement(prev => ({ ...prev, [operation]: false }));
    }
  }, [api]);

  // Fetch available deliveries


  // Fetch today's deliveries
  const obtenirLivraisonsAujourdhui = useCallback(async () => {
    const data = await fetchData('/livraisons/mes-livraisons/aujourdhui', 'livraisons', (res) => {
      return res.data.map(item => ({
        ...item,
        colis: item.colis || []
      }));
    });
    setLivraisons(data);
    return data;
  }, [fetchData]);

  // Fetch all deliveries
  const obtenirMesLivraisons = useCallback(async () => {
    const data = await fetchData('/livraisons/mes-livraisons', 'livraisons', (res) => {
      return res.data.map(item => ({
        ...item,
        colis: item.colis || []
      }));
    });
    setLivraisons(data);
    return data;
  }, [fetchData]);

  // Fetch deliveries by delivery person ID
  const obtenirLivraisonsParLivreur = useCallback(async (livreurId) => {
    const data = await fetchData(`/livraisons/livreur/${livreurId}`, 'livraisons', (res) => {
      return res.data.map(item => ({
        ...item,
        colis: item.colis || []
      }));
    });
    setLivraisons(data);
    return data;
  }, [fetchData]);


  // Update delivery status with optimistic update
  const mettreAJourStatutLivraison = useCallback(async (livraisonId, nouveauStatut) => {
    const previousLivraisons = [...livraisons];
    try {
      setChargement(prev => ({ ...prev, statut: true }));
      setErreur(null);

      // Optimistic update
      setLivraisons(prev => prev.map(liv => 
        liv.livraison_id === livraisonId 
          ? { 
              ...liv, 
              statut: nouveauStatut,
              colis: liv.colis.map(col => ({
                ...col,
                statut: nouveauStatut === 'livree' ? 'livree' : col.statut,
                ...(nouveauStatut === 'livree' && { date_livraison: new Date().toISOString() })
              }))
            } 
          : liv
      ));

      const response = await api.put(`/livraisons/${livraisonId}/statut`, { statut: nouveauStatut });
      
      if (response.data?.success) {
        return true;
      }
      
      // Rollback on failure
      setLivraisons(previousLivraisons);
      throw new Error(response.data?.message || 'Échec de la mise à jour du statut');
    } catch (err) {
      setErreur(err.message);
      console.error('Erreur mise à jour statut:', err);
      return false;
    } finally {
      setChargement(prev => ({ ...prev, statut: false }));
    }
  }, [api, livraisons]);
  const obtenirLivraisonParId = useCallback(async (id) => {
    try {
      setChargement(prev => ({ ...prev, details: true }));
      setErreur(null);
  
      const response = await api.get(`/livraisons/obtenirLivraisonParId/${id}`);
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Échec de la récupération des détails');
    } catch (err) {
      setErreur(err.message);
      console.error('Erreur récupération détails:', err);
      throw err;
    } finally {
      setChargement(prev => ({ ...prev, details: false }));
    }
  }, [api]);

  // Update delivery person service status
  const updateServiceStatus = useCallback(async (enService) => {
    try {
      setChargement(prev => ({ ...prev, service: true }));
      setErreur(null);

      const response = await api.put(`/livraisons/livreur/${livreurInfo?.utilisateur_id}/status`, { enService });
      
      if (response.data?.success) {
        return true;
      }
      throw new Error(response.data?.message || 'Échec de la mise à jour du statut de service');
    } catch (err) {
      setErreur(err.message);
      console.error('Erreur mise à jour statut service:', err);
      return false;
    } finally {
      setChargement(prev => ({ ...prev, service: false }));
    }
  }, [api, livreurInfo]);

  // Fetch delivery statistics
  const obtenirStatistiques = useCallback(async () => {
    const data = await fetchData('/livraisons/mes-statistiques', 'statistiques');
    setStatistiques(data);
    return data;
  }, [fetchData]);

  // Auto-fetch when livreurInfo is available
  useEffect(() => {
    if (livreurInfo?.utilisateur_id) {
      Promise.all([
        obtenirLivraisonsAujourdhui(),
        obtenirStatistiques()
      ]).catch(console.error);
    }
  }, [livreurInfo, obtenirLivraisonsAujourdhui, obtenirStatistiques]);

  return {
    livraisons,
    livraisonsDisponibles,
    statistiques,
    chargement,
    erreur,
    
    obtenirLivraisonsAujourdhui,
    obtenirMesLivraisons,
    obtenirLivraisonsParLivreur,
    obtenirLivraisonParId,
    mettreAJourStatutLivraison,
    updateServiceStatus,
    obtenirStatistiques,
    refetch: obtenirLivraisonsAujourdhui
  };
};