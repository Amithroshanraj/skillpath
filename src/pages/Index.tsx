import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import logo from '@/assets/skillpath-logo.png';

export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated, isProfileCompleted, lastRoute, initialAssessmentResult, roadmapTopics } = useApp();
  const [showButton, setShowButton] = useState(false);

  // Check if user has any progress data
  const hasUserProgress = initialAssessmentResult !== null || (roadmapTopics && roadmapTopics.length > 0);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (lastRoute && lastRoute !== '/') navigate(lastRoute);
      else navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <img src={logo} alt="SkillPath" className="h-28 w-28 rounded-2xl" />
          <div className="absolute inset-0 rounded-2xl animate-pulse-ring border-2 border-accent opacity-0" />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text">SkillPath</h1>
          <p className="mt-2 text-muted-foreground text-sm">Your personalized career roadmap</p>
        </div>
      </motion.div>

      {!showButton && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 flex gap-1.5"
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-accent"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      )}

      {showButton && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleGetStarted}
          className="mt-12 rounded-xl gradient-primary px-10 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          Get Started
        </motion.button>
      )}
    </div>
  );
}
