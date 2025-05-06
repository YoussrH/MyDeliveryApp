import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [livreurInfo, setLivreurInfo] = useState(null);
  const [token, setToken] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const baseURL = 'http://192.168.1.16:5000'; // Update with your backend URL
  
  // Create axios instance
  const api = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Request interceptor to add auth token
  api.interceptors.request.use(
    async (config) => {
      const storedToken = await SecureStore.getItemAsync('authToken');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle 401 errors
  api.interceptors.response.use(
    response => response,
    async (error) => {
      if (error.response?.status === 401) {
        await deconnexionSilencieuse();
      }
      return Promise.reject(error);
    }
  );

  // Fetch livreur profile
  const obtenirInfoLivreur = useCallback(async () => {
    try {
      if (!utilisateur || utilisateur.role !== 'livreur') return;
      
      const response = await api.get('/livreur/mon-profil');
      if (response.data?.success) {
        setLivreurInfo(response.data.livreur);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch livreur info');
      }
    } catch (err) {
      console.error('Error fetching livreur info:', err);
      setLivreurInfo(null);
      throw err;
    }
  }, [utilisateur]);

  // Verify authentication status
  const verifierAuthentification = useCallback(async () => {
    try {
      setChargement(true);
      setErreur(null);
      
      const storedToken = await SecureStore.getItemAsync('authToken');
      if (!storedToken) {
        await deconnexionSilencieuse();
        return;
      }

      const response = await api.get('/auth/utilisateur');
      
      if (response.data?.success && response.data.utilisateur) {
        setToken(storedToken);
        setUtilisateur(response.data.utilisateur);
        
        // If user is a delivery person, fetch their profile
        if (response.data.utilisateur.role === 'livreur') {
          await obtenirInfoLivreur();
        }
      } else {
        await deconnexionSilencieuse();
      }
    } catch (err) {
      console.error('Verification error:', err);
      await deconnexionSilencieuse();
      setErreur(err.response?.data?.message || 'Session expirée');
    } finally {
      setChargement(false);
    }
  }, []);

  // Silent logout (no API call)
  const deconnexionSilencieuse = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      setUtilisateur(null);
      setLivreurInfo(null);
      setToken(null);
    } catch (err) {
      console.error('Silent logout error:', err);
    }
  };

  // Login function for delivery persons
  const connexionLivreur = async (email, motDePasse) => {
    try {
      setChargement(true);
      setErreur(null);
      
      const response = await api.post('/auth/connexion-livreur', { 
        email, 
        mot_de_passe: motDePasse 
      });
  
      if (!response.data?.success || !response.data.token) {
        throw new Error(response.data?.message || 'Échec de la connexion');
      }

      // Verify user role
      if (response.data.utilisateur?.role !== 'livreur') {
        throw new Error('Accès réservé aux livreurs');
      }

      // Store token and user data
      await SecureStore.setItemAsync('authToken', response.data.token);
      setToken(response.data.token);
      setUtilisateur(response.data.utilisateur);
      
      // Fetch livreur profile
      await obtenirInfoLivreur();
      
      return { 
        succes: true, 
        utilisateur: response.data.utilisateur 
      };
    } catch (err) {
      console.error('Login error:', err);
      await deconnexionSilencieuse();
      setErreur(err.message);
      return { 
        succes: false, 
        erreur: err.message
      };
    } finally {
      setChargement(false);
    }
  };

  // Full logout (with API call)
  const deconnexion = async () => {
    try {
      await api.post('/auth/deconnexion');
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      await deconnexionSilencieuse();
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('authToken');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setChargement(false);
      }
    };

    initializeAuth();
  }, []);

  // Verify auth when token changes
  useEffect(() => {
    if (token) {
      verifierAuthentification();
    }
  }, [token, verifierAuthentification]);

  return (
    <AuthContext.Provider
      value={{
        utilisateur,
        livreurInfo,
        token,
        chargement,
        erreur,
        api,
        connexionLivreur,
        deconnexion,
        obtenirInfoLivreur,
        estAuthentifie: !!utilisateur,
        estLivreur: utilisateur?.role === 'livreur'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};