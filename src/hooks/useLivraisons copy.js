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
    service: false,
    details: false
  });
  const [erreur, setErreur] = useState(null);

  const fetchData = useCallback(async (endpoint, operation, transformFn, params = {}) => {
    try {
      setChargement(prev => ({ ...prev, [operation]: true }));
      setErreur(null);

      const response = await api.get(endpoint, { params });
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

  const obtenirLivraisonsDisponibles = useCallback(async () => {
    const data = await fetchData('/livraisons/disponibles', 'disponibles', (res) => {
      return res.data.map(item => ({
        ...item,
        colis: item.colis || []
      }));
    });
    setLivraisonsDisponibles(data);
    return data;
  }, [fetchData]);

  const obtenirLivraisonsAujourdhui = useCallback(async () => {
    const data = await fetchData('/livraisons/mes-livraisons/aujourdhui', 'livraisons', (res) => {
      return res.data.map(item => ({
        ...item,
        colis: item.colis || [],
        date_livraison: item.date_livraison || item.colis?.[0]?.date_livraison
      }));
    });
    setLivraisons(data);
    return data;
  }, [fetchData]);

  const obtenirMesLivraisons = useCallback(async () => {
    const data = await fetchData('/livraisons/mes-livraisons', 'livraisons', (res) => {
      return res.data.map(item => ({
        ...item,
        colis: item.colis || [],
        date_livraison: item.date_livraison || item.colis?.[0]?.date_livraison
      }));
    });
    setLivraisons(data);
    return data;
  }, [fetchData]);

  const obtenirLivraisonsParDate = useCallback(async (dateDebut, dateFin) => {
    try {
      setChargement(prev => ({ ...prev, livraisons: true }));
      setErreur(null);
  
      // Format dates properly
      const params = {};
      if (dateDebut) {
        const startDate = new Date(dateDebut);
        startDate.setHours(0, 0, 0, 0);
        params.dateDebut = startDate.toISOString();
      }
      if (dateFin) {
        const endDate = new Date(dateFin);
        endDate.setHours(23, 59, 59, 999);
        params.dateFin = endDate.toISOString();
      }
  
      // Change this endpoint to the correct one
      const response = await api.get('/livraisons/mes-livraisons/par-date', { params });
      
      if (response.data?.success) {
        const data = response.data.data.map(item => ({
          ...item,
          colis: item.colis || [],
          date_livraison: item.date_livraison || item.colis?.[0]?.date_livraison
        }));
        setLivraisons(data);
        return data;
      }
      throw new Error(response.data?.message || 'Échec de la récupération des livraisons');
    } catch (err) {
      setErreur(err.message);
      console.error('Erreur lors de la récupération des livraisons par date:', err);
      throw err;
    } finally {
      setChargement(prev => ({ ...prev, livraisons: false }));
    }
  }, [api]);

  const obtenirLivraisonsParLivreur = useCallback(async (livreurId) => {
    const data = await fetchData(`/livraisons/livreur/${livreurId}`, 'livraisons', (res) => {
      return res.data.map(item => ({
        ...item,
        colis: item.colis || [],
        date_livraison: item.date_livraison || item.colis?.[0]?.date_livraison
      }));
    });
    setLivraisons(data);
    return data;
  }, [fetchData]);

 
  const mettreAJourStatutLivraison = useCallback(async (commandeId, nouveauStatut) => {
    const previousLivraisons = [...livraisons];
    try {
      setChargement(prev => ({ ...prev, statut: true }));
      setErreur(null);
  
      // Optimistic update
      setLivraisons(prev => prev.map(liv => 
        liv.id === commandeId 
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
  
      // Updated API call to match backend
      const response = await api.put(`/livraisons/${commandeId}/statut`, { 
        statut: nouveauStatut,
        livreur_id: livreurInfo?.utilisateur_id 
      });
      
      if (response.data?.success) {
        // If successful, update with the actual response data
        const updatedLivraison = response.data.data;
        setLivraisons(prev => prev.map(liv => 
          liv.id === commandeId ? updatedLivraison : liv
        ));
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
  }, [api, livraisons, livreurInfo]);

  const obtenirLivraisonParId = useCallback(async (id) => {
    try {
      setChargement(prev => ({ ...prev, details: true }));
      setErreur(null);
  
      const response = await api.get(`/livraisons/obtenirLivraisonParId/${id}`);
      if (response.data?.success) {
        return {
          ...response.data.data,
          date_livraison: response.data.data.date_livraison || response.data.data.colis?.[0]?.date_livraison
        };
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

  const obtenirStatistiques = useCallback(async () => {
    const data = await fetchData('/livraisons/mes-statistiques', 'statistiques');
    setStatistiques(data);
    return data;
  }, [fetchData]);

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
    
    obtenirLivraisonsDisponibles,
    obtenirLivraisonsAujourdhui,
    obtenirMesLivraisons,
    obtenirLivraisonsParDate,
    obtenirLivraisonsParLivreur,
    obtenirLivraisonParId,
    
    mettreAJourStatutLivraison,
    updateServiceStatus,
    
    obtenirStatistiques,
    refetch: obtenirLivraisonsAujourdhui


  };
};