import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '8px', style = {} }) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration: 0.8,
        ease: "easeInOut"
      }}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#e2e8f0', // slate-200
        ...style
      }}
    />
  );
};

export default Skeleton;
