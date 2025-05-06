// hooks/useLocation.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as Location from 'expo-location';

export const useLocation = () => {
  const { api } = useAuth();
  const [position, setPosition] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  // Start location tracking
  const demarrerSuivi = useCallback(async () => {
    try {
      setEnCours(true);
      setErreur(null);
      
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      // Start watching position
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10
        },
        (newLocation) => {
          setPosition(newLocation);
          // Optionally send to server
          api.post('/livreur/position', {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude
          }).catch(err => console.error('Failed to send location:', err));
        }
      );
    } catch (err) {
      setErreur(err.message);
      console.error('Location tracking error:', err);
    }
  }, [api]);

  // Stop location tracking
  const arreterSuivi = useCallback(() => {
    setEnCours(false);
    setPosition(null);
  }, []);

  // Get current position once
  const obtenirPositionActuelle = useCallback(async () => {
    try {
      setErreur(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      const location = await Location.getCurrentPositionAsync({});
      setPosition(location);
      return location;
    } catch (err) {
      setErreur(err.message);
      console.error('Error getting location:', err);
      return null;
    }
  }, []);

  return {
    position,
    erreur,
    enCours,
    demarrerSuivi,
    arreterSuivi,
    obtenirPositionActuelle
  };
};