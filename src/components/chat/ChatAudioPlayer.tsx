import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Download } from 'lucide-react';

interface ChatAudioPlayerProps {
  src: string;
  isMe: boolean;
  fileName?: string;
  duration?: number;
}

export const ChatAudioPlayer: React.FC<ChatAudioPlayerProps> = ({
  src,
  isMe,
  fileName = 'Voice Note',
  duration: initialDuration
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio playback error:', err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = parseFloat(e.target.value);
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const cycleSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex flex-col gap-1.5 py-1 px-1 min-w-[240px] sm:min-w-[280px] max-w-full ${
      isMe ? 'text-white' : 'text-gray-900 dark:text-gray-100'
    }`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Header with audio label & speed */}
      <div className="flex items-center justify-between text-[11px] opacity-80 px-1">
        <span className="flex items-center gap-1.5 font-medium truncate">
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{fileName}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={cycleSpeed}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase transition ${
              isMe 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'bg-gray-100 dark:bg-[#1f3326] hover:bg-gray-200 dark:hover:bg-[#253f2f] text-[#0b4627] dark:text-emerald-400'
            }`}
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
          <a
            href={src}
            download={fileName || 'audio_message.mp3'}
            className={`p-1 rounded hover:opacity-100 transition ${isMe ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-[#0b4627] dark:hover:text-emerald-400'}`}
            title="Download Audio"
          >
            <Download className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Play Controls & Scrubber */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition active:scale-95 ${
            isMe
              ? 'bg-white text-[#0b4627] hover:bg-emerald-50'
              : 'bg-[#0b4627] hover:bg-[#0f5132] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Progress track & waveform look */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="relative flex items-center h-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none ${
                isMe
                  ? 'accent-white bg-white/30'
                  : 'accent-[#0b4627] dark:accent-emerald-400 bg-gray-200 dark:bg-[#263e30]'
              }`}
            />
          </div>

          <div className={`flex items-center justify-between text-[10px] font-mono mt-0.5 ${
            isMe ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : '0:00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
