import { io } from 'socket.io-client';

// Single shared socket instance
const socket = io(window.location.origin, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

// Connection state helpers
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
