import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.column}>
          <h2 style={styles.logo}>BookHaven</h2>
          <p style={styles.desc}>Company BookHaven Inc.</p>
          <div style={styles.badges}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" style={styles.badge} />
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" style={styles.badge} />
          </div>
        </div>

        <div style={styles.column}>
          <h3 style={styles.title}>Legal</h3>
          <Link to="#" style={styles.link}>Terms and Conditions</Link>
          <Link to="#" style={styles.link}>Privacy</Link>
          <Link to="#" style={styles.link}>Returns</Link>
          <Link to="#" style={styles.link}>Modern Slavery Statement</Link>
        </div>

        <div style={styles.column}>
          <h3 style={styles.title}>Important</h3>
          <Link to="#" style={styles.link}>Careers</Link>
          <Link to="#" style={styles.link}>Help</Link>
          <Link to="#" style={styles.link}>Delivery</Link>
          <Link to="#" style={styles.link}>Store locations</Link>
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: '#f1f5f9',
    padding: '60px 0',
    marginTop: '60px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '40px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '200px',
  },
  logo: {
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '-1px',
    marginBottom: '10px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    display: 'inline-block',
  },
  desc: {
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  badges: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
  },
  badge: {
    height: '35px',
    cursor: 'pointer',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '10px',
    color: 'var(--text-main)',
  },
  link: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    transition: 'color 0.2s',
  }
};

export default Footer;
