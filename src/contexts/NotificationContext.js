import React, { createContext, useState, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { api, estLivreur } = useAuth();

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Update locally first for instant feedback
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, lue: true } : n
        )
      );
      
      // API call to mark as read in backend
      if (estLivreur) {
        await api.patch(`/livreur/notifications/${notificationId}/lue`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [api, estLivreur]);

  const markAllAsRead = useCallback(async () => {
    try {
      // Update locally first
      setNotifications(prev => 
        prev.map(n => ({ ...n, lue: true }))
      );
      
      // API call to mark all as read
      if (estLivreur) {
        await api.patch('/livreur/notifications/marquer-toutes-lues');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [api, estLivreur]);

  const fetchNotifications = useCallback(async () => {
    if (!estLivreur) return;
    
    try {
      setLoading(true);
      const response = await api.get('/livreur/notifications');
      if (response.data?.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [api, estLivreur]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        addNotification,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        clearNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};