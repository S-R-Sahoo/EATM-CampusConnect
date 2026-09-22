import React from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface MediaLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({ src, alt = 'Campus Media', onClose }) => {
  const [zoom, setZoom] = React.useState(1);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div 
        className="flex items-center justify-between text-white max-w-5xl mx-auto w-full py-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs sm:text-sm font-medium text-gray-300 truncate max-w-xs sm:max-w-md">
          {alt}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-gray-300">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <a
            href={src}
            download={alt || 'campus_photo.jpg'}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 text-xs font-medium"
            title="Download"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition ml-2"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main image container */}
      <div 
        className="flex-1 flex items-center justify-center overflow-auto p-2"
        onClick={onClose}
      >
        <img
          src={src}
          alt={alt}
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease' }}
          className="max-h-[82vh] max-w-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};
