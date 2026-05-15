import { useCallback, useRef, useEffect, useState } from 'react';
import './App.css';
import useAudioPlayer from './useAudioPlayer';
import useSpotifyPlayer from './useSpotifyPlayer';
import useTheme from './useTheme';
import { login as spotifyLogin, handleCallback, isLoggedIn as isSpotifyLoggedIn, logout as spotifyLogout } from './spotify/auth.js';
import { fetchPlaylistTracks as fetchSpotifyTracks, fetchMyPlaylists as fetchSpotifyPlaylists } from './spotify/api.js';
import { login as appleLogin, logout as appleLogout, isLoggedIn as isAppleLoggedIn } from './apple/auth.js';
import { fetchMyPlaylists as fetchApplePlaylists, fetchPlaylistTracks as fetchAppleTracks } from './apple/api.js';
import { searchYouTube, getSavedApiKey, setSavedApiKey } from './youtube/api.js';

import progressBarStars from '../assets/progress_bar_stars.png';

function useResize(corner) {
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    let lastX = e.screenX;
    let lastY = e.screenY;

    const onMouseMove = (e) => {
      const dx = e.screenX - lastX;
      const dy = e.screenY - lastY;
      lastX = e.screenX;
      lastY = e.screenY;
      window.cupid?.resize({ dx, dy, corner });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [corner]);

  return onMouseDown;
}

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function MarqueeText({ className, text }) {
  const outerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const outer = outerRef.current;
    const textEl = textRef.current;
    if (!outer || !textEl) return;
    setShouldScroll(textEl.offsetWidth > outer.clientWidth);
  }, [text]);

  return (
    <div className={`${className} marquee-container`} ref={outerRef}>
      <span ref={textRef} className="marquee-measure">{text}</span>
      <span className={shouldScroll ? 'marquee-scroll' : ''}>
        {text}
        {shouldScroll && <span className="marquee-gap">{text}</span>}
      </span>
    </div>
  );
}

export default function App() {
  const [source, setSource] = useState('local');
  const [spotifyConnected, setSpotifyConnected] = useState(isSpotifyLoggedIn());
  const [appleConnected, setAppleConnected] = useState(isAppleLoggedIn());
  const [streamTracks, setStreamTracks] = useState([]);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [applePlaylists, setApplePlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [musicService, setMusicService] = useState('spotify');
  const [shuffle, setShuffle] = useState(false);
  const [youtubeQuery, setYoutubeQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [searchingYoutube, setSearchingYoutube] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(getSavedApiKey());

  const local = useAudioPlayer(shuffle);
  const streaming = useSpotifyPlayer(streamTracks, shuffle);
  const player = source === 'streaming' ? streaming : local;

  const {
    track,
    isPlaying,
    progress,
    duration,
    currentTime,
    togglePlay,
    next,
    prev,
    seek,
    setIsPlaying,
  } = player;

  const { theme, toggleTheme, assets } = useTheme();

  const [recordFrame, setRecordFrame] = useState(0);
  const [needleFrame, setNeedleFrame] = useState(0);
  const [isPink, setIsPink] = useState(theme === 'pink');
  const [swapping, setSwapping] = useState(false);
  const [needleLifted, setNeedleLifted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(null);
  const seekRef = useRef(null);

  const loadSpotifyPlaylists = useCallback((silent = false) => {
    setLoadingPlaylists(true);
    fetchSpotifyPlaylists()
      .then((p) => { setSpotifyPlaylists(p); setSettingsError(null); })
      .catch((err) => { if (!silent) setSettingsError(err.message); })
      .finally(() => setLoadingPlaylists(false));
  }, []);

  const loadApplePlaylists = useCallback(() => {
    setLoadingPlaylists(true);
    fetchApplePlaylists().then(setApplePlaylists).catch((err) => setSettingsError(err.message)).finally(() => setLoadingPlaylists(false));
  }, []);

  useEffect(() => {
    if (isSpotifyLoggedIn()) loadSpotifyPlaylists(true);
    if (isAppleLoggedIn()) loadApplePlaylists();
  }, [loadSpotifyPlaylists, loadApplePlaylists]);

  const loadPlaylist = useCallback(async (id, service) => {
    setLoadingPlaylist(true);
    try {
      const fetcher = service === 'apple' ? fetchAppleTracks : fetchSpotifyTracks;
      const tracks = await fetcher(id);
      setStreamTracks(tracks);
      setSource('streaming');
    } catch (err) {
      setSettingsError(err.message);
    } finally {
      setLoadingPlaylist(false);
    }
  }, []);

  const handleYoutubeSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!youtubeQuery.trim()) return;
    setSearchingYoutube(true);
    try {
      const results = await searchYouTube(youtubeQuery);
      setYoutubeResults(results);
    } catch (err) {
      setSettingsError(err.message);
    } finally {
      setSearchingYoutube(false);
    }
  }, [youtubeQuery]);

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e) => {
      const rect = seekRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverProgress(pct);
      seek(pct);
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [dragging, seek]);

  const currentFrames = isPink ? assets.recordFramesA : assets.recordFramesB;
  const incomingFrames = isPink ? assets.recordFramesB : assets.recordFramesA;

  useEffect(() => {
    if (!isPlaying || swapping) return;
    const interval = setInterval(() => {
      setRecordFrame((f) => (f + 1) % currentFrames.length);
      setNeedleFrame((f) => (f + 1) % assets.needlePlayFrames.length);
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying, swapping, currentFrames.length]);

  const prevTrackRef = useRef(track?.title);
  useEffect(() => {
    if (prevTrackRef.current === track?.title) return;
    prevTrackRef.current = track?.title;
    setNeedleLifted(true);
    setTimeout(() => setSwapping(true), 400);
    setTimeout(() => { setIsPink((p) => !p); setRecordFrame(0); setSwapping(false); }, 1000);
    setTimeout(() => { setNeedleLifted(false); setNeedleFrame(0); }, 1100);
  }, [track?.title]);

  const resizeTL = useResize('top-left');
  const resizeTR = useResize('top-right');
  const resizeBL = useResize('bottom-left');
  const resizeBR = useResize('bottom-right');

  return (
    <div className={`player ${theme === 'blue' ? 'theme-blue' : ''}`}>
      <img src={assets.frame} className="layer" alt="" draggable={false} />
      <div className="window-title">cupid player</div>
      <img src={assets.recordPlayer} className="record-player" alt="" draggable={false} />
      <img src={currentFrames[recordFrame]} className={`record-player ${swapping ? 'record-slide-out' : ''}`} alt="" draggable={false} />
      {swapping && <img src={incomingFrames[0]} className="record-player record-slide-in" alt="" draggable={false} />}
      <img src={needleLifted ? assets.needleChangeFrames[0] : assets.needlePlayFrames[needleFrame]} className="record-player" alt="" draggable={false} />

      {track?.art && (
        <div className="album-mask">
          <img src={track.art} className="album-art" alt="" draggable={false} />
        </div>
      )}
      <img src={assets.albumFrame} className="layer album-frame-layer" alt="" draggable={false} />

      <div className="now-playing">
        <div className="track-info">
          <div className="now-playing-label">now playing...</div>
          <MarqueeText className="track-title" text={track?.title || 'No track'} />
          <div className="track-artist">by {track?.artist || ''}</div>
        </div>
      </div>

      <div className="time-display">
        <span className="time-current">{formatTime(currentTime)}</span>
        <span className="time-remaining">{formatTime(duration - currentTime)}</span>
      </div>

      <div className="progress-seek" ref={seekRef} onMouseDown={(e) => {
        setDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        seek(pct);
      }} />

      <div className="btn btn-prev" onClick={prev} />
      <div className="btn btn-play" onClick={togglePlay} />
      <div className="btn btn-next" onClick={next} />
      <div className="btn btn-settings" onClick={() => setShowSettings(!showSettings)} />

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-panel-inner">
            <div className="settings-label">theme</div>
            <div className="settings-theme-row">
              <button className={`settings-theme-btn ${theme === 'pink' ? 'active' : ''}`} onClick={toggleTheme}>pink</button>
              <button className={`settings-theme-btn ${theme === 'blue' ? 'active' : ''}`} onClick={toggleTheme}>blue</button>
            </div>
            <div className="settings-label">music</div>
            <div className="settings-theme-row">
              <button className={`settings-theme-btn ${musicService === 'spotify' ? 'active' : ''}`} onClick={() => setMusicService('spotify')}>spotify</button>
              <button className={`settings-theme-btn ${musicService === 'apple' ? 'active' : ''}`} onClick={() => setMusicService('apple')}>apple</button>
              <button className={`settings-theme-btn ${musicService === 'youtube' ? 'active' : ''}`} onClick={() => setMusicService('youtube')}>youtube</button>
            </div>

            {musicService === 'youtube' && (
              <div className="youtube-search-container">
                <form onSubmit={handleYoutubeSearch} className="youtube-search-form">
                  <input type="text" className="youtube-search-input" placeholder="Search..." value={youtubeQuery} onChange={(e) => setYoutubeQuery(e.target.value)} />
                  <button type="submit" className="settings-theme-btn">{searchingYoutube ? '...' : 'search'}</button>
                </form>
                <div className="settings-playlist-list">
                  {Array.isArray(youtubeResults) && youtubeResults.map((t) => (
                    <button key={t.id || Math.random()} className="settings-playlist-item" onClick={() => { setStreamTracks([t]); setSource('streaming'); if (typeof setIsPlaying === 'function') setIsPlaying(true); }}>
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {settingsError && <div className="settings-error">{settingsError}</div>}
          </div>
        </div>
      )}
      <div className="resize-handle top-left" onMouseDown={resizeTL} />
      <div className="resize-handle top-right" onMouseDown={resizeTR} />
      <div className="resize-handle bottom-left" onMouseDown={resizeBL} />
      <div className="resize-handle bottom-right" onMouseDown={resizeBR} />
    </div>
  );
}
