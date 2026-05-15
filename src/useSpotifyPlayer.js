import { useState, useEffect, useRef, useCallback } from 'react';

export default function useSpotifyPlayer(tracks, shuffle = false) {
  const audioRef = useRef(new Audio());
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);

  const audio = audioRef.current;

  const track = tracks[trackIndex] ?? {
    title: 'No track',
    artist: '',
    art: null,
    uri: null,
  };

  useEffect(() => {
    if (tracks.length === 0) return;
    const t = tracks[trackIndex];
    if (!t) return;

    let cancelled = false;
    setLoading(true);

    async function loadStream() {
      try {
        let url;
        const videoId = t.id || t.videoId;
        
        if (window.cupid && window.cupid.getStreamUrl) {
          url = await window.cupid.getStreamUrl(t.title, t.artist, videoId);
        } else {
          const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
          // Use the proxy-direct /stream endpoint
          url = `${BACKEND_URL}/stream?id=${videoId || ''}&title=${encodeURIComponent(t.title)}&artist=${encodeURIComponent(t.artist)}`;
        }

        if (cancelled) return;
        audio.src = url;
        audio.load();
        if (isPlaying) {
          audio.play().catch(() => {});
        }
      } catch (err) {
        console.error('[Streaming] Failed to get stream:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStream();
    return () => { cancelled = true; };
  }, [trackIndex, tracks]);

  useEffect(() => {
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    const onEnded = () => {
      setTrackIndex((prev) => (prev + 1) % tracks.length);
    };
    const onError = () => {
      console.error('[Audio Error]', audio.error);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [tracks.length]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const next = useCallback(() => {
    setTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const prev = useCallback(() => {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      setTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    }
    setIsPlaying(true);
  }, [tracks.length]);

  const seek = useCallback((fraction) => {
    if (audio.duration) {
      audio.currentTime = Math.min(fraction, 1) * audio.duration;
    }
  }, []);

  return {
    track,
    trackIndex,
    isPlaying,
    progress,
    duration,
    currentTime,
    togglePlay,
    next,
    prev,
    seek,
    loading,
    setIsPlaying,
  };
}
