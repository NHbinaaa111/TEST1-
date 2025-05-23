import { useState, useEffect } from 'react';
import { Subject } from '@/lib/types';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface SubjectProgressProps {
  subjects: Subject[];
  onUpdateProgress?: () => void;
}

// Extended Subject Progress Event interface
interface SubjectProgressEvent extends CustomEvent {
  detail: {
    physics: number;
    chemistry: number;
    mathematics: number;
    timestamp: number;
  }
}

export default function SubjectProgress({ subjects, onUpdateProgress }: SubjectProgressProps) {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState({
    physics: 0,
    chemistry: 0,
    mathematics: 0
  });

  // Load progress data from localStorage on component mount
  useEffect(() => {
    if (user) {
      const cachedProgress = localStorage.getItem('chadjee_progress_cache');
      if (cachedProgress) {
        try {
          const parsed = JSON.parse(cachedProgress);
          setProgressData({
            physics: parsed.physics || 0,
            chemistry: parsed.chemistry || 0,
            mathematics: parsed.mathematics || 0
          });
        } catch (e) {
          console.error('Error parsing progress cache:', e);
        }
      }
    }
  }, [user]);

  // Listen for progress update events
  useEffect(() => {
    const handleProgressUpdate = (event: Event) => {
      const progressEvent = event as SubjectProgressEvent;
      setProgressData({
        physics: progressEvent.detail.physics,
        chemistry: progressEvent.detail.chemistry,
        mathematics: progressEvent.detail.mathematics
      });
    };

    window.addEventListener('subject-progress-updated', handleProgressUpdate);
    
    return () => {
      window.removeEventListener('subject-progress-updated', handleProgressUpdate);
    };
  }, []);
  
  // Default subjects that will always be displayed
  const defaultSubjects = [
    {
      id: 'physics',
      name: 'Physics',
      color: 'blue' as 'blue',
      progress: progressData.physics // Use dynamic progress data
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      color: 'green' as 'green',
      progress: progressData.chemistry // Use dynamic progress data
    },
    {
      id: 'mathematics',
      name: 'Mathematics',
      color: 'purple' as 'purple',
      progress: progressData.mathematics // Use dynamic progress data
    }
  ];
  
  // Merge existing subjects with default subjects, prioritizing existing data
  const mergedSubjects = defaultSubjects.map(defaultSubject => {
    const existingSubject = subjects.find(s => 
      s.name.toLowerCase() === defaultSubject.name.toLowerCase() ||
      s.id === defaultSubject.id
    );
    
    return existingSubject ? {
      ...defaultSubject,
      ...existingSubject,
      // Always use the latest progress value from progressData
      progress: defaultSubject.progress
    } : defaultSubject;
  });
  
  return (
    <div className="bg-[#252525] p-6 rounded-lg border border-[#3A3A3A]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">Progress by Subject</h3>
        <button className="text-[#00EEFF] text-sm hover:text-opacity-80 transition-duration-300">View All</button>
      </div>
      
      <div className="space-y-4">
        {mergedSubjects.map((subject) => (
          <div key={subject.id}>
            <div className="flex justify-between mb-1">
              <span className="text-sm">{subject.name}</span>
              <span className={`text-sm ${
                subject.color === 'blue' ? 'text-[#00EEFF]' : 
                subject.color === 'green' ? 'text-[#39FF14]' : 
                'text-[#BF40FF]'
              }`}>
                {subject.progress}%
              </span>
            </div>
            <ProgressBar 
              value={subject.progress} 
              color={(subject.color === 'blue' || subject.color === 'green' || subject.color === 'purple') 
                ? subject.color 
                : 'blue'} 
            />
          </div>
        ))}
      </div>
      
      {onUpdateProgress && (
        <Button 
          className="mt-6 w-full py-2 rounded-md border border-[#00EEFF] text-[#00EEFF] hover:bg-[#00EEFF] hover:bg-opacity-10 transition-all duration-300"
          variant="outline"
          onClick={onUpdateProgress}
        >
          Update Progress
        </Button>
      )}
    </div>
  );
}
