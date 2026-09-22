import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

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
          : 'Unable to access camera on this device.'
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCapturedBlob(null);
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

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setCapturedPhoto(dataUrl);
          setCapturedBlob(blob);
          stopTracks();
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedBlob(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `camera_snapshot_${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });
    stopTracks();
    onCapture(file);
    onClose();
  };

  const toggleFacingMode = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 bg-black/50 text-white z-10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Camera Snapshot</span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopTracks();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition"
            title="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Container */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black flex items-center justify-center overflow-hidden">
          {isLoading && !errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2 bg-black">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Starting camera...</p>
            </div>
          )}

          {errorMsg ? (
            <div className="p-6 text-center text-white space-y-3 max-w-xs">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs text-gray-300">{errorMsg}</p>
              {onFallbackToFilePicker && (
                <button
                  type="button"
                  onClick={() => {
                    stopTracks();
                    onClose();
                    onFallbackToFilePicker();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-xs transition"
                >
                  Choose From Files
                </button>
              )}
            </div>
          ) : capturedPhoto ? (
            /* Captured Snapshot Preview */
            <img
              src={capturedPhoto}
              alt="Snapshot"
              className="w-full h-full object-contain"
            />
          ) : (
            /* Live Camera Stream */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}

          {/* Switch Camera Button (Front / Back) */}
          {!capturedPhoto && !errorMsg && !isLoading && (
            <button
              type="button"
              onClick={toggleFacingMode}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition"
              title="Switch Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controls Footer */}
        <div className="p-4 bg-gray-950 flex items-center justify-center gap-6 border-t border-gray-800/80">
          {capturedPhoto ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0b4627] hover:bg-[#0f5132] text-white text-xs font-bold shadow-md transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Use Photo</span>
              </button>
            </>
          ) : (
            !errorMsg && (
              <button
                type="button"
                onClick={handleCapture}
                disabled={isLoading}
                className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 text-white shadow-lg transition active:scale-90 disabled:opacity-50"
                title="Take Photo"
              >
                <div className="w-10 h-10 rounded-full bg-white" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
