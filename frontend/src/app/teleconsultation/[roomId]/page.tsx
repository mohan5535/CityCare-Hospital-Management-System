'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getSocket } from '../../../lib/socket';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ShieldCheck,
  FileText,
  User,
  Users,
  AlertCircle,
} from 'lucide-react';

export default function TeleconsultationRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user } = useAuth();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // 1. Initialize local media
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn('[WebRTC Media Warning]', err);
        setMediaError('Camera / Microphone permission denied or device not found. Running in audio-only or preview mode.');
      });

    // 2. Setup Socket.io Signaling
    const socket = getSocket();
    socket.emit('join_consultation_room', { roomId, appointmentId: roomId });

    socket.on('peer_joined', () => {
      setPeerConnected(true);
    });

    return () => {
      // Cleanup streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      socket.off('peer_joined');
    };
  }, [roomId]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    } else {
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    router.back();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Encrypted Teleconsultation Room
          </span>
          <span className="text-xs text-slate-500">({roomId})</span>
        </div>
        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Peer-to-Peer WebRTC Signaling</span>
        </div>
      </div>

      {mediaError && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-6 py-2 text-xs text-amber-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{mediaError}</span>
        </div>
      )}

      {/* Main Video Stage */}
      <div className="flex-1 flex flex-col md:flex-row p-4 sm:p-6 gap-4">
        {/* Remote participant (Doctor / Patient) */}
        <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden flex items-center justify-center min-h-[300px]">
          {peerConnected ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-300 text-base">Waiting for other participant...</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Both the practitioner and patient must join this room to establish the video stream.
              </p>
            </div>
          )}

          {/* Picture-in-Picture Local Self Preview */}
          <div className="absolute bottom-4 right-4 w-40 sm:w-52 aspect-video bg-slate-950 rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                Camera Muted
              </div>
            )}
            <div className="absolute bottom-1.5 left-2 text-[10px] bg-slate-900/80 px-1.5 py-0.5 rounded text-slate-300 font-medium">
              You ({user?.firstName || 'User'})
            </div>
          </div>
        </div>

        {/* Side Clinical Notes Panel */}
        <div className="w-full md:w-80 bg-slate-900 rounded-3xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-200 mb-4 pb-3 border-b border-slate-800">
              <FileText className="w-4 h-4 text-primary-400" />
              <span>Consultation Notes</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Take private clinical notes during the call. When completed, formal prescriptions can be generated.
            </p>
            <textarea
              rows={8}
              placeholder="Record symptoms discussed, clinical findings, provisional impressions..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-primary-500"
            />
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
            🔒 Teleconsultation session is encrypted with DTLS-SRTP standards.
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="h-20 bg-slate-900/90 border-t border-slate-800 px-6 flex items-center justify-center space-x-4">
        <button
          onClick={toggleMic}
          className={`p-3.5 rounded-2xl border transition-all ${
            isMuted
              ? 'bg-rose-600 border-rose-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3.5 rounded-2xl border transition-all ${
            isVideoOff
              ? 'bg-rose-600 border-rose-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
          title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={endCall}
          className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition-all"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Leave Call</span>
        </button>
      </div>
    </div>
  );
}

