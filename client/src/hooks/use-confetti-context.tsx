import { createContext, useState, useContext, ReactNode } from 'react';
import ConfettiCelebration from '../components/ConfettiCelebration';

type ConfettiTriggerType = 'goal-complete' | 'study-session-complete' | null;

interface ConfettiContextType {
  launchConfetti: (type: 'goal-complete' | 'study-session-complete') => void;
}

const ConfettiContext = createContext<ConfettiContextType | undefined>(undefined);

export function ConfettiProvider({ children }: { children: ReactNode }) {
  const [trigger, setTrigger] = useState<ConfettiTriggerType>(null);

  const launchConfetti = (type: 'goal-complete' | 'study-session-complete') => {
    setTrigger(type);
    // Reset the trigger after a short delay to allow it to be triggered again
    setTimeout(() => setTrigger(null), 100);
  };

  return (
    <ConfettiContext.Provider value={{ launchConfetti }}>
      <ConfettiCelebration trigger={trigger} />
      {children}
    </ConfettiContext.Provider>
  );
}

export function useConfetti() {
  const context = useContext(ConfettiContext);
  if (context === undefined) {
    throw new Error('useConfetti must be used within a ConfettiProvider');
  }
  return context;
}
