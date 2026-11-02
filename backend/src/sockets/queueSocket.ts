import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { setQueueSocketIO } from '../services/queueService';
import { resolveDoctorIdentifier } from '../utils/doctorResolver';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
}

export const setupSocketHandlers = (io: Server) => {
  setQueueSocketIO(io);

  // Socket Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      // Allow anonymous connection strictly for public doctor token board rooms
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string; role: string };
      socket.userId = decoded.id;
      socket.role = decoded.role;
      next();
    } catch (err) {
      // Invalided token allowed as unauthenticated viewer
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    // If authenticated, join user-specific room for private alerts (token called, waitlist offers)
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join doctor's live queue room
    socket.on('join_doctor_queue', async (doctorId: string) => {
      if (doctorId) {
        socket.join(`doctor_queue:${doctorId}`);
        try {
          const resolved = await resolveDoctorIdentifier(doctorId);
          if (resolved && resolved.userId.toString() !== doctorId) {
            socket.join(`doctor_queue:${resolved.userId.toString()}`);
          }
        } catch {}
      }
    });

    socket.on('leave_doctor_queue', async (doctorId: string) => {
      if (doctorId) {
        socket.leave(`doctor_queue:${doctorId}`);
        try {
          const resolved = await resolveDoctorIdentifier(doctorId);
          if (resolved && resolved.userId.toString() !== doctorId) {
            socket.leave(`doctor_queue:${resolved.userId.toString()}`);
          }
        } catch {}
      }
    });

    // WebRTC Teleconsultation Signaling (Section 13)
    socket.on('join_consultation_room', ({ roomId, appointmentId }: { roomId: string; appointmentId: string }) => {
      if (!roomId) return;
      socket.join(`consultation:${roomId}`);
      // Notify other peer in room
      socket.to(`consultation:${roomId}`).emit('peer_joined', { userId: socket.userId });
    });

    socket.on('webrtc_offer', ({ roomId, sdp }: { roomId: string; sdp: any }) => {
      socket.to(`consultation:${roomId}`).emit('webrtc_offer', { sdp, senderId: socket.userId });
    });

    socket.on('webrtc_answer', ({ roomId, sdp }: { roomId: string; sdp: any }) => {
      socket.to(`consultation:${roomId}`).emit('webrtc_answer', { sdp, senderId: socket.userId });
    });

    socket.on('webrtc_ice_candidate', ({ roomId, candidate }: { roomId: string; candidate: any }) => {
      socket.to(`consultation:${roomId}`).emit('webrtc_ice_candidate', {
        candidate,
        senderId: socket.userId,
      });
    });

    socket.on('disconnect', () => {
      // Clean up
    });
  });
};

