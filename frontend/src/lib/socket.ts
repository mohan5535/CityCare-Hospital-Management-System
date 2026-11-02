import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5002';
    const token = typeof window !== 'undefined' ? localStorage.getItem('hms_token') : null;

    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io] Connection Error:', err.message);
    });
  }

  return socket;
};

