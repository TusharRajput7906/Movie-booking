import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BookingSuccess() {
  const navigate = useNavigate();
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, #1e1b4b, #0f172a 75%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#f8fafc',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      boxSizing: 'border-box',
    },
    card: {
      background: 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '24px',
      padding: '48px 32px',
      width: '100%',
      maxWidth: '440px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '20px',
    },
    checkmarkCircle: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: 'rgba(46, 204, 113, 0.15)',
      border: '2px solid #2ecc71',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '2.5rem',
      color: '#2ecc71',
      marginBottom: '10px',
      boxShadow: '0 0 20px rgba(46, 204, 113, 0.2)',
    },
    heading: {
      fontSize: '1.8rem',
      fontWeight: '800',
      margin: 0,
      background: 'linear-gradient(to right, #2ecc71, #2ecc71)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    subtext: {
      fontSize: '1rem',
      color: '#94a3b8',
      lineHeight: '1.5',
      margin: 0,
    },
    button: {
      background: isBtnHovered
        ? 'linear-gradient(to right, #4f46e5, #0284c7)'
        : 'linear-gradient(to right, #6366f1, #0ea5e9)',
      border: 'none',
      borderRadius: '12px',
      padding: '14px 28px',
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '0.95rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: isBtnHovered ? '0 10px 15px -3px rgba(99, 102, 241, 0.35)' : 'none',
      width: '100%',
      marginTop: '10px',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.checkmarkCircle}>
          ✓
        </div>
        <h2 style={styles.heading}>Booking Confirmed!</h2>
        <p style={styles.subtext}>
          Thank you for booking with us. Your ticket details have been sent to your email address.
        </p>
        <button
          onClick={() => navigate('/')}
          style={styles.button}
          onMouseEnter={() => setIsBtnHovered(true)}
          onMouseLeave={() => setIsBtnHovered(false)}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
