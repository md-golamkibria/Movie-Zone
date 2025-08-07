import React from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import './TiltedCard.css';

const TiltedCard = ({ children }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [15, -15]); // Reduced from 30 to 15
  const rotateY = useTransform(x, [-100, 100], [-15, 15]); // Reduced from 30 to 15

  const springConfig = { stiffness: 300, damping: 20 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className="tilted-card-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="tilted-card-content">
        {children}
      </div>
    </motion.div>
  );
};

export default TiltedCard;