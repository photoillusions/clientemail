
import React, { useRef, useEffect, useCallback } from 'react';
import { CameraIcon } from './icons/CameraIcon.tsx';

interface CameraProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please ensure permissions are granted.");
        onClose();
      }
    };
    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
      }
    }
  }, [onCapture]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="relative w-full max-w-2xl aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
      <div className="flex items-center space-x-4 mt-6">
        <button
          onClick={handleCapture}
          className="p-4 bg-blue-600 rounded-full text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-transform transform hover:scale-110"
          aria-label="Capture photo"
        >
          <CameraIcon className="w-8 h-8" />
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
