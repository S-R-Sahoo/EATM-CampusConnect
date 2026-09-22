import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw, Send, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, caption?: string) => void;
  onFallbackToFilePicker?: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  onFallbackToFilePicker
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [caption, setCaption] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (mode: 'user' | 'environment') => {
    stopTracks();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (modeErr) {
        // Fallback for laptop cameras that reject specific facingMode constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
      setIsLoading(false);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsLoading(false);
      setErrorMsg(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in your browser.'
          : 'Unable to access webcam on this computer.'
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        stopTracks();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCapturedBlob(null);
      setCaption('');
      startCamera(facingMode);
    } else {
      stopTracks();
    }

    return () => {
      stopTracks();
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image so it feels natural
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          setCapturedPhoto(dataUrl);
          setCapturedBlob(blob);
          stopTracks();
        }
      },
      'image/jpeg',
      0.95
    );
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setCaption('');
    startCamera(facingMode);
  };

  const handleConfirmAndSend = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `camera_snapshot_${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });
    stopTracks();
    onCapture(file, caption.trim() || undefined);
    onClose();
  };

  const toggleFacingMode = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0c1317] flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
      {/* WhatsApp Web Style Top App Bar */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full py-1 text-white z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              stopTracks();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition"
            title="Close camera"
          >
            <X className="w-6 h-6" />
          </button>
          <span className="font-semibold text-base">
            {capturedPhoto ? 'Preview Photo' : 'Take Photo'}
          </span>
        </div>

        {/* Switch camera (front / back) */}
        {!capturedPhoto && !errorMsg && !isLoading && (
          <button
            type="button"
            onClick={toggleFacingMode}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-2 text-xs font-semibold"
            title="Switch Camera"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Flip Camera</span>
          </button>
        )}
      </div>

      {/* Main Viewfinder / Photo Container (WhatsApp Web Large Viewport) */}
      <div className="flex-1 flex items-center justify-center overflow-hidden my-2 max-w-5xl mx-auto w-full relative">
        {isLoading && !errorMsg && (
          <div className="flex flex-col items-center justify-center text-white gap-3">
            <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-300">Connecting to camera...</p>
          </div>
        )}

        {errorMsg ? (
          <div className="p-8 text-center text-white space-y-4 max-w-md bg-gray-900/80 rounded-2xl border border-gray-800">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
            <p className="text-sm text-gray-300">{errorMsg}</p>
            {onFallbackToFilePicker && (
              <button
                type="button"
                onClick={() => {
                  stopTracks();
                  onClose();
                  onFallbackToFilePicker();
                }}
                className="px-5 py-2.5 bg-[#0b4627] hover:bg-[#0f5132] rounded-xl text-xs font-bold text-white shadow-md transition"
              >
                Choose Photo from Files
              </button>
            )}
          </div>
        ) : (
          <div className="relative w-full max-w-4xl h-full max-h-[72vh] aspect-[4/3] sm:aspect-[16/9] bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center">
            {capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Captured Snapshot"
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Web Style Bottom Dock */}
      <div className="max-w-3xl mx-auto w-full py-2 z-20">
        {capturedPhoto ? (
          /* Caption input and Send button */
          <div className="flex items-center gap-3 bg-[#1f2c34] border border-gray-700/60 rounded-2xl p-2 px-3 shadow-2xl">
            <button
              type="button"
              onClick={handleRetake}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title="Retake photo"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Retake</span>
            </button>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmAndSend();
              }}
              placeholder="Add a caption..."
              autoFocus
              className="flex-1 bg-transparent text-white placeholder:text-gray-400 text-sm px-2 py-1.5 focus:outline-none"
            />

            <button
              type="button"
              onClick={handleConfirmAndSend}
              className="w-11 h-11 rounded-full bg-[#0b4627] hover:bg-[#0f5132] text-white flex items-center justify-center shadow-lg transition active:scale-95 shrink-0"
              title="Send Photo"
            >
              <Send className="w-5 h-5 translate-x-0.5" />
            </button>
          </div>
        ) : (
          /* WhatsApp Circular Shutter Button */
          !errorMsg && (
            <div className="flex items-center justify-center py-2">
              <button
                type="button"
                onClick={handleCapture}
                disabled={isLoading}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-[#0b4627] hover:bg-[#0f5132] text-white shadow-2xl hover:scale-105 active:scale-90 transition disabled:opacity-40"
                title="Take Photo"
              >
                <Camera className="w-7 h-7" />
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};
