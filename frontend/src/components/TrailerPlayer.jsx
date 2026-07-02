import { useState, useEffect } from 'react';

export default function TrailerPlayer({ videoId }) {
  const [playing, setPlaying] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const height = windowWidth < 768 ? '200px' : '315px';

  const styles = {
    fallbackContainer: {
      height,
      backgroundColor: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
    },
    fallbackText: {
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '500',
    },
    thumbnailContainer: {
      position: 'relative',
      cursor: 'pointer',
      borderRadius: '12px',
      overflow: 'hidden',
      height,
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    },
    thumbnail: {
      width: '100%',
      height,
      objectFit: 'cover',
      display: 'block',
    },
    overlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s',
    },
    iframe: {
      width: '100%',
      height,
      border: 'none',
      display: 'block',
      borderRadius: '12px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    }
  };

  if (!videoId) {
    return (
      <div style={styles.fallbackContainer}>
        <span style={styles.fallbackText}>Trailer not available</span>
      </div>
    );
  }

  if (!playing) {
    return (
      <div 
        style={styles.thumbnailContainer} 
        onClick={() => setPlaying(true)}
      >
        <img
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt="Click to play trailer"
          style={styles.thumbnail}
          loading="lazy"
        />
        <div style={styles.overlay}>
          <span>▶ Play Trailer</span>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
      style={styles.iframe}
      sandbox="allow-scripts allow-same-origin allow-presentation"
      allow="autoplay; fullscreen"
      title="Movie Trailer"
    />
  );
}
