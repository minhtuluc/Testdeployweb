import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingChat from './FloatingChat';

const CustomerLayout = ({ children }) => {
  return (
    <div style={styles.layout}>
      <Navbar />
      <main style={styles.main}>
        {children}
      </main>
      <Footer />
      <FloatingChat />
    </div>
  );
};

const styles = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-white)',
  },
  main: {
    flex: 1,
  }
};

export default CustomerLayout;
