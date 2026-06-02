import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, LogOut, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ showBack = false, backTo = '/rooms', title = null }) => {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/');
  };

  return (
    <header style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 1.5rem',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {showBack && (
            <button className="btn-ghost" onClick={() => navigate(backTo)}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Logo mark */}
            <div style={{
              width: 30, height: 30,
              background: 'var(--accent)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 800, fontSize: '0.85rem',
              color: '#fff',
            }}>CC</div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--text-primary)',
            }}>
              {title || 'CampusConnect'}
            </span>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <motion.button
            className="btn-ghost"
            onClick={toggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </motion.button>
          {localStorage.getItem('token') && (
            <motion.button
              className="btn-ghost"
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              title="Logout"
              style={{ color: 'var(--accent)' }}
            >
              <LogOut size={18} />
            </motion.button>
          )}
        </div>
      </div>
      {/* Accent stripe */}
      <div className="campus-stripe" />
    </header>
  );
};

export default Navbar;