// File: context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { utilisateur, estLivreur, token, estAuthentifie } = useAuth();

  useEffect(() => {
    if (!estAuthentifie || !estLivreur || !token) return;

    const newSocket = io('http://192.168.1.16:5000', {
      withCredentials: true,
      transports: ['websocket'],
      auth: { token }
    });

    setSocket(newSocket);

    // Subscribe to livreur notifications
    newSocket.emit('subscribe-livreur', utilisateur.id);

    // Listen for new notifications
    newSocket.on('livraison:assigned', (notification) => {
      setNotifications(prev => [{
        ...notification,
        id: Date.now().toString(),
        lue: false,
        type: 'nouvelle_commande'
      }, ...prev]);
    });

    newSocket.on('livraison:unassigned', (notification) => {
      setNotifications(prev => [{
        ...notification,
        id: Date.now().toString(),
        lue: false,
        type: 'commande_retiree'
      }, ...prev]);
    });

    return () => {
      if (newSocket) {
        newSocket.off('livraison:assigned');
        newSocket.off('livraison:unassigned');
        newSocket.disconnect();
      }
    };
  }, [estAuthentifie, estLivreur, token, utilisateur?.id]);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, lue: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, lue: true }))
    );
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      notifications, 
      setNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};