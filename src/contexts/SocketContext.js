// LivreurSocketContext.js
import React, { createContext, useContext,useCallback, useEffect, useState, useRef } from 'react'; // Import useRef
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const LivreurSocketContext = createContext();

export const LivreurSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { utilisateur, token, chargement } = useAuth(); // Correctly destructure utilisateur and token, add chargement

  // Use a ref to store the current socket instance to prevent stale closures
  const socketRef = useRef(null);

  useEffect(() => {
    // --- Logging for debugging ---
    console.log('LivreurSocketContext useEffect triggered.');
    console.log('Auth Status:');
    console.log('  utilisateur:', utilisateur ? 'Present' : 'Absent');
    console.log('  utilisateur.id:', utilisateur?.id);
    console.log('  token:', token ? 'Present' : 'Absent');
    console.log('  chargement (AuthContext):', chargement);
    // --- End Logging ---

    // Condition to skip socket creation:
    // 1. Auth is still loading.
    // 2. User is not authenticated, or is authenticated but not a livreur, or livreur ID is missing.
    if (chargement || !utilisateur || !token || utilisateur.role !== 'livreur' || !utilisateur.id) {
      console.log('Skipping socket initialization: Auth not ready or user is not a livreur.');
      if (socketRef.current) {
        console.log('Disconnecting existing socket during skip check.');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // If a socket already exists and it's for the same user, do nothing
    // This prevents re-creating the socket if dependencies haven't truly changed meaningfully
    if (socketRef.current && socketRef.current.connected && socketRef.current.query.userId === utilisateur.id) {
        console.log('Socket already connected for this user, skipping re-initialization.');
        return;
    }

    const socketUrl = 'http://localhost:5000';
    console.log('Attempting to connect to socket URL:', socketUrl);

    const newSocket = io(socketUrl, {
      auth: { token: token }, // Use the 'token' from AuthContext
      query: { userId: utilisateur.id, role: 'livreur' },
      transports: ['websocket'], // Prefer WebSocket for stability
      autoConnect: false // Don't auto-connect yet, we'll manually connect
    });

    socketRef.current = newSocket; // Store the new socket in the ref
    setSocket(newSocket); // Also update state for direct usage if needed

    newSocket.on('connect', () => {
      console.log('Socket Connected! ID:', newSocket.id);
      newSocket.emit('subscribe-livreur', utilisateur.id);
      console.log('Emitted "subscribe-livreur" for ID:', utilisateur.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message, err.data);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket Disconnected:', reason);
      // Optional: Clear notifications on disconnect if desired
      // setNotifications([]);
    });

    newSocket.on('livraison-assigned', (notification) => {
      console.log('Received "livraison-assigned" notification:', notification);
      setNotifications(prev => [{
        ...notification,
        read: false,
        lue: false, // Ensure 'lue' is also set for consistency with your NotificationsScreen
        date: new Date(notification.date)
      }, ...prev]);
    });

    newSocket.on('subscription-success', (data) => {
        console.log('Livreur subscription successful:', data);
    });

    newSocket.on('subscription-error', (error) => {
        console.error('Livreur subscription error from server:', error);
    });

    newSocket.connect(); // Manually connect the socket

    return () => {
      console.log('LivreurSocketContext cleanup: Disconnecting socket and clearing ref.');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, [utilisateur, token, chargement]); // Depend on utilisateur, token, and chargement

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true, lue: true } : n) // Also set 'lue'
    );
  }, []);

  // Add markAllAsRead as it's used in NotificationsScreen
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, lue: true })));
  }, []);

  return (
    <LivreurSocketContext.Provider value={{ socket, notifications, markAsRead, markAllAsRead }}>
      {children}
    </LivreurSocketContext.Provider>
  );
};

export const useLivreurSocket = () => useContext(LivreurSocketContext);