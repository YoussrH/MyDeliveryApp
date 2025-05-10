import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

export const useLivraisons = () => {
  const { api, livreurInfo, estAuthentifie } = useAuth();
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
  
  // Track all active requests for cancellation
  const activeRequests = useRef(new Set());

  const fetchData = useCallback(async (endpoint, operation, transformFn, params = {}) => {
    const source = axios.CancelToken.source();
    activeRequests.current.add(source);
  
    try {
      // Skip if not authenticated - don't throw error, just return empty
      if (!estAuthentifie) {
        return transformFn ? transformFn({ data: [] }) : [];
      }
  
      setChargement(prev => ({ ...prev, [operation]: true }));
      setErreur(null);
  
      const response = await api.get(endpoint, { 
        params,
        cancelToken: source.token 
      });
  
      if (response.data?.success) {
        return transformFn ? transformFn(response.data) : response.data.data || [];
      }
      throw new Error(response.data?.message || 'Request failed');
    } catch (err) {
      // Only process non-cancellation errors
      if (!axios.isCancel(err)) {
        setErreur(err.message);
        console.error(`API Error (${operation}):`, err);
        throw err;
      }
      // For cancellation errors, just return empty data
      return transformFn ? transformFn({ data: [] }) : [];
    } finally {
      activeRequests.current.delete(source);
      setChargement(prev => ({ ...prev, [operation]: false }));
    }
  }, [api, estAuthentifie]);
  // Clean up all requests on unmount or auth change
  useEffect(() => {
    return () => {
      activeRequests.current.forEach(source => {
        source.cancel('Component unmounted or auth changed');
      });
      activeRequests.current.clear();
    };
  }, [estAuthentifie]);

  // Get available deliveries
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

  // Get today's deliveries
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

  // Get all deliveries
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

  // Get deliveries by date range
  const obtenirLivraisonsParDate = useCallback(async (dateDebut, dateFin) => {
    const source = axios.CancelToken.source();
    activeRequests.current.add(source);

    try {
      setChargement(prev => ({ ...prev, livraisons: true }));
      setErreur(null);

      if (!estAuthentifie) {
        throw new axios.Cancel('User not authenticated');
      }

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

      const response = await api.get('/livraisons/mes-livraisons/par-date', { 
        params,
        cancelToken: source.token 
      });
      
      if (response.data?.success) {
        const data = response.data.data.map(item => ({
          ...item,
          colis: item.colis || [],
          date_livraison: item.date_livraison || item.colis?.[0]?.date_livraison
        }));
        setLivraisons(data);
        return data;
      }
      throw new Error(response.data?.message || 'Failed to get deliveries by date');
    } catch (err) {
      if (!axios.isCancel(err)) {
        setErreur(err.message);
        console.error('Error getting deliveries by date:', err);
      }
      throw err;
    } finally {
      activeRequests.current.delete(source);
      setChargement(prev => ({ ...prev, livraisons: false }));
    }
  }, [api, estAuthentifie]);

  // Get statistics
  const obtenirStatistiques = useCallback(async () => {
    const data = await fetchData('/livraisons/mes-statistiques', 'statistiques');
    setStatistiques(data);
    return data;
  }, [fetchData]);

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

  const signalerProblemeLivraison = useCallback(async (commandeId, type, notes) => {
    const source = axios.CancelToken.source();
    activeRequests.current.add(source);
  
    try {
      setChargement(prev => ({ ...prev, signalement: true }));
      setErreur(null);
  
      console.log('Preparing problem report:', {
        commandeId,
        type,
        notes
      });
  
      const response = await api.post(
        `/livraisons/signaler-probleme/${commandeId}`,
        {
          type,
          notes: notes || ''
        },
        {
          cancelToken: source.token,
          timeout: 10000
        }
      );
  
      console.log('Server response:', response.data);
  
      if (response.data?.success) {
        return true;
      }
  
      console.error('Unexpected server response:', response.data);
      throw new Error(response.data?.message || 'Échec du signalement');
  
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error('Error reporting problem:', {
          error: err,
          response: err.response?.data,
          request: {
            commandeId,
            type,
            notes
          }
        });
  
        setErreur({
          message: err.response?.data?.message || err.message,
          details: err.response?.data?.details,
          status: err.response?.status
        });
  
        if (err.response?.status === 400) {
          throw new Error(err.response.data.message || 'Données invalides envoyées au serveur');
        } else if (err.response?.status === 403) {
          throw new Error('Vous n\'êtes pas autorisé à signaler un problème pour cette commande');
        } else if (err.response?.status === 404) {
          throw new Error('Commande introuvable');
        } else {
          throw err;
        }
      }
    } finally {
      activeRequests.current.delete(source);
      setChargement(prev => ({ ...prev, signalement: false }));
    }
  }, [api]);

  // Load initial data
  useEffect(() => {
    let isMounted = true;
    const source = axios.CancelToken.source();
    activeRequests.current.add(source);

    const loadData = async () => {
      if (livreurInfo?.utilisateur_id && estAuthentifie) {
        try {
          const [todayDeliveries, stats] = await Promise.all([
            obtenirLivraisonsAujourdhui(),
            obtenirStatistiques()
          ]);
          
          if (isMounted) {
            setLivraisons(todayDeliveries);
            setStatistiques(stats);
          }
        } catch (err) {
          if (isMounted && !axios.isCancel(err)) {
            console.error('Error loading initial data:', err);
          }
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      source.cancel('Component unmounted');
      activeRequests.current.delete(source);
    };
  }, [livreurInfo, obtenirLivraisonsAujourdhui, obtenirStatistiques, estAuthentifie]);

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
    obtenirStatistiques,
    obtenirLivraisonsParLivreur,
    obtenirLivraisonParId,
    signalerProblemeLivraison,
    mettreAJourStatutLivraison,
    updateServiceStatus,
    refetch: obtenirLivraisonsAujourdhui
  };
};