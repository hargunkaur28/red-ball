import { io } from 'socket.io-client';

// Single shared socket instance
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : window.location.origin);

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

// Connection state helpers.
// Reads the access token from localStorage so the server's socket auth
// middleware can assign role/userId to the connection on establishment.
export const connectSocket = () => {
  const token = localStorage.getItem('accessToken');
  if (token) socket.auth = { token };
  if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
