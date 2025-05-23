import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

// Create a type for confetti options for better type safety
type ConfettiOptions = {
  particleCount?: number;
  angle?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  gravity?: number;
  drift?: number;
  ticks?: number;
  origin?: {
    x?: number;
    y?: number;
  };
  colors?: string[];
  shapes?: Array<'square' | 'circle'>;
  scalar?: number;
  zIndex?: number;
  disableForReducedMotion?: boolean;
};

type ConfettiTriggerType = 'goal-complete' | 'study-session-complete' | null;

interface ConfettiCelebrationProps {
  trigger: ConfettiTriggerType;
  duration?: number; // in milliseconds
}

export default function ConfettiCelebration({ 
  trigger, 
  duration = 3000 
}: ConfettiCelebrationProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      
      // Configure confetti based on the trigger type
      const options = getConfettiOptions(trigger);
      
      // Launch confetti
      confetti(options);
      
      // Set timeout to reset the state after duration
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);
  
  // No visible UI - this component just triggers the confetti effect
  return null;
}

// Helper function to get confetti options based on trigger type
function getConfettiOptions(trigger: ConfettiTriggerType): ConfettiOptions {
  // Base options for all confetti types
  const baseOptions: ConfettiOptions = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  };
  
  // Customize based on trigger type
  switch (trigger) {
    case 'goal-complete':
      return {
        ...baseOptions,
        colors: ['#00EEFF', '#0FFF50', '#FFD700'],
        particleCount: 150,
        gravity: 0.8,
        scalar: 1.2
      };
    case 'study-session-complete':
      return {
        ...baseOptions,
        colors: ['#5E17EB', '#00EEFF', '#0FFF50'],
        particleCount: 100,
        angle: 90,
        spread: 60
      };
    default:
      return baseOptions;
  }
}

// This component is meant to be used through useConfetti from use-confetti-context.tsx
