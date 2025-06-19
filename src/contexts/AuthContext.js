import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [livreurInfo, setLivreurInfo] = useState(null);
  const [token, setToken] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
 const baseURL = 'http://192.168.1.110:5000';
  const initialized = useRef(false);

  // Create axios instance
  const api = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Track active requests
  const activeRequests = useRef(new Set());

  // Request interceptor
  api.interceptors.request.use(
    async (config) => {
      const source = axios.CancelToken.source();
      activeRequests.current.add(source);
      config.cancelToken = source.token;

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

// Updated deconnexionSilencieuse function
const deconnexionSilencieuse = async () => {
  try {
    // Cancel all active requests with a specific message
    activeRequests.current.forEach(source => {
      source.cancel('User not authenticated (logged out)');
    });
    activeRequests.current.clear();

    await SecureStore.deleteItemAsync('authToken');
    setUtilisateur(null);
    setLivreurInfo(null);
    setToken(null);
    setErreur(null);
  } catch (err) {
    if (!axios.isCancel(err)) {
      console.error('Silent logout error:', err);
    }
  }
};

// Updated response interceptor
api.interceptors.response.use(
  response => response,
  async (error) => {
    // Skip cancellation errors
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
       // Skip password change endpoint
       if (error.config?.url?.includes('changer-mot-de-passe')) {
        return Promise.reject(error);
      }
    // Only handle 401 errors for authenticated requests
    if (error.config?.headers?.Authorization && error.response?.status === 401) {
      await deconnexionSilencieuse();
    }
    return Promise.reject(error);
  }
);
  const motDePasseOublie = async (email) => {
    try {
      const response = await api.post('/mot-de-passe/mot-de-passe-oublie', { email });
      
      if (response.data?.succes) {
        return { succes: true };
      } else {
        return { 
          succes: false, 
          erreur: response.data?.message || "Échec de la demande" 
        };
      }
    } catch (err) {
      console.error("Password reset error:", err.response?.data);
      return {
        succes: false,
        erreur: err.response?.data?.message || "Erreur serveur"
      };
    }
  };

  const verifierCodeReinitialisation = async (email, code) => {
    try {
      const response = await api.post('/mot-de-passe/verifier-code-reinitialisation', { email, code });
      
      console.log("[DEBUG] Verification API response:", response.data);
      
      const isSuccess = response.data?.success || response.data?.succes;
      
      if (isSuccess) {
        return { 
          succes: true,
          token: response.data.token,
          message: response.data.message
        };
      }
      
      return { 
        succes: false, 
        erreur: response.data?.message || 'Code invalide ou expiré' 
      };
    } catch (err) {
      console.error('Code verification error:', err);
      return { 
        succes: false, 
        erreur: err.response?.data?.message || 'Erreur serveur' 
      };
    }
  };

  const changerMotDePasse = async (motDePasseActuel, nouveauMotDePasse) => {
    try {
      const response = await api.post('/mot-de-passe/livreur/changer-mot-de-passe', {
        motDePasseActuel,
        nouveauMotDePasse
      });
  
      // Handle successful response first
      if (response.data?.success) {
        // Force a re-authentication since the token might be invalidated
        await verifierAuthentification();
        return { 
          success: true,
          message: response.data.message 
        };
      }
      
      throw new Error(response.data?.error || "Échec du changement de mot de passe");
    } catch (err) {
      // Ignore 401 errors if the password change was successful
      if (err.response?.status === 401 && err.config?.url?.includes('changer-mot-de-passe')) {
        await verifierAuthentification();
        return {
          success: true,
          message: "Mot de passe changé avec succès (session rafraîchie)"
        };
      }
      
      console.error('Erreur changement mot de passe:', err);
      return {
        success: false,
        error: err.response?.data?.error || err.message || "Erreur serveur"
      };
    }
  };
  const reinitialiserMotDePasse = async (email, code, nouveauMotDePasse, token) => {
    try {
      console.log("[DEBUG] Making reset request with token:", token);
      const response = await api.post('/mot-de-passe/reinitialiser-mot-de-passe', { 
        email, 
        code,
        nouveau_mot_de_passe: nouveauMotDePasse,
        token
      });
      
      console.log("[DEBUG] Reset response:", response.data);
      
      if (response.data?.success) {
        return { 
          succes: true,
          message: response.data.message || "Mot de passe réinitialisé avec succès"
        };
      }
      
      return {
        succes: false,
        erreur: response.data?.error || "Échec de la réinitialisation"
      };
      
    } catch (err) {
      console.error("[ERROR] in reinitialiserMotDePasse:", err.response?.data);
      return {
        succes: false,
        erreur: err.response?.data?.error || "Erreur serveur"
      };
    }
  };

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
        
        if (response.data.utilisateur.role === 'livreur') {
          await obtenirInfoLivreur();
        }
      } else {
        await deconnexionSilencieuse();
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error('Verification error:', err);
        await deconnexionSilencieuse();
        // Only set error if we had a token (meaning we expected to be authenticated)
        if (await SecureStore.getItemAsync('authToken')) {
          setErreur(err.response?.data?.message || 'Session expirée');
        }
      }
    } finally {
      setChargement(false);
    }
  }, []);



  const deconnexion = async () => {
    try {
      await api.post('/auth/deconnexion');
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error('Logout API error:', err);
      }
    } finally {
      await deconnexionSilencieuse();
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

  // Initialize auth state on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('authToken');
        if (storedToken) {
          setToken(storedToken);
          await verifierAuthentification();
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setChargement(false);
      }
    };

    initializeAuth();

    return () => {
      // Cleanup on unmount
      activeRequests.current.forEach(source => {
        source.cancel('Component unmounted');
      });
      activeRequests.current.clear();
    };
  }, []);

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
        verifierAuthentification,
        obtenirInfoLivreur,
        motDePasseOublie,
        verifierCodeReinitialisation,
        reinitialiserMotDePasse,
        changerMotDePasse,
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