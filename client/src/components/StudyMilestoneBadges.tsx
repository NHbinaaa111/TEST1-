import React, { useMemo } from 'react';
import { Award, Clock, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
// Using a simplified StudySession interface for the component
interface StudySession {
  id: string;
  taskName: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  date: string;
}

interface StudyMilestoneBadgesProps {
  studySessions: StudySession[];
}

interface Badge {
  id: string;
  icon: React.ReactNode;
  label: string;
  threshold: number;
  color: string;
  earned: boolean;
}

export default function StudyMilestoneBadges({ studySessions }: StudyMilestoneBadgesProps) {
  const totalHours = useMemo(() => {
    if (!studySessions?.length) return 0;
    
    // Sum all durations (in seconds) and convert to hours
    const totalSeconds = studySessions.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0);
    
    return Math.floor(totalSeconds / 3600); // Convert seconds to hours
  }, [studySessions]);
  
  const sessionCount = studySessions?.length || 0;
  
  const badges: Badge[] = [
    {
      id: 'beginner',
      icon: <Clock className="h-4 w-4" />,
      label: 'Beginner',
      threshold: 1,
      color: 'from-blue-500 to-blue-700',
      earned: totalHours >= 1
    },
    {
      id: 'determined',
      icon: <Zap className="h-4 w-4" />,
      label: 'Determined',
      threshold: 10,
      color: 'from-purple-500 to-purple-700',
      earned: totalHours >= 10
    },
    {
      id: 'dedicated',
      icon: <Star className="h-4 w-4" />,
      label: 'Dedicated',
      threshold: 50,
      color: 'from-orange-500 to-orange-700',
      earned: totalHours >= 50
    },
    {
      id: 'master',
      icon: <Award className="h-4 w-4" />,
      label: 'Master',
      threshold: 100,
      color: 'from-emerald-500 to-emerald-700',
      earned: totalHours >= 100
    }
  ];
  
  const earnedBadges = badges.filter(badge => badge.earned);
  
  if (earnedBadges.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {earnedBadges.map((badge, index) => (
        <motion.div
          key={badge.id}
          className={`flex items-center gap-1.5 bg-gradient-to-r ${badge.color} text-white px-2.5 py-1 rounded-full text-xs font-medium`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            delay: index * 0.1,
            type: 'spring', 
            stiffness: 260, 
            damping: 20
          }}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </motion.div>
      ))}
    </div>
  );
}