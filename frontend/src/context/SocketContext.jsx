import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('user:online', user._id);

    socket.on('users:online', (users) => setOnlineUsers(users));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinRoom = (roomId) => socketRef.current?.emit('room:join', roomId);
  const sendMessage = (roomId, message) => socketRef.current?.emit('message:send', { roomId, message });
  const onReceiveMessage = (cb) => socketRef.current?.on('message:receive', cb);
  const offReceiveMessage = (cb) => socketRef.current?.off('message:receive', cb);
  const emitTyping = (roomId, typing) => {
    if (typing) socketRef.current?.emit('typing:start', { roomId, userId: user?._id });
    else socketRef.current?.emit('typing:stop', { roomId, userId: user?._id });
  };
  const onNotification = (cb) => socketRef.current?.on('notification:new', cb);
  const offNotification = (cb) => socketRef.current?.off('notification:new', cb);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers, joinRoom, sendMessage, onReceiveMessage, offReceiveMessage, emitTyping, onNotification, offNotification }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
