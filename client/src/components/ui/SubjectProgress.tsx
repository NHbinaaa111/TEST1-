import React from 'react';

interface Subject {
  id: number | string;
  name: string;
  color: string;
  progress: number;
  totalTopics: number;
  completedTopics: number;
}

interface SubjectProgressProps {
  subjects: Subject[];
}

const SubjectProgress: React.FC<SubjectProgressProps> = ({ subjects }) => {
  
  // Default subjects if none provided
  const defaultSubjects: Subject[] = [
    {
      id: 1,
      name: 'Physics',
      color: 'blue',
      progress: 0,
      totalTopics: 0,
      completedTopics: 0
    },
    {
      id: 2,
      name: 'Chemistry',
      color: 'green',
      progress: 0,
      totalTopics: 0,
      completedTopics: 0
    },
    {
      id: 3,
      name: 'Mathematics',
      color: 'purple',
      progress: 0,
      totalTopics: 0,
      completedTopics: 0
    }
  ];
  
  // Merge default subjects with provided subjects
  const mergedSubjects = defaultSubjects.map(defaultSubj => {
    const foundSubj = subjects.find(s => 
      s.name.toLowerCase() === defaultSubj.name.toLowerCase() || 
      s.name.toLowerCase().includes(defaultSubj.name.toLowerCase())
    );
    
    if (foundSubj) {
      return {
        ...defaultSubj,
        ...foundSubj,
        progress: foundSubj.progress !== undefined ? foundSubj.progress : 
          (foundSubj.totalTopics > 0 ? (foundSubj.completedTopics / foundSubj.totalTopics) * 100 : 0)
      };
    }
    return defaultSubj;
  });
  
  // Calculate overall progress based on all subjects
  const calculateOverallProgress = (): number => {
    const totalTopics = mergedSubjects.reduce((sum, subj) => sum + subj.totalTopics, 0);
    const completedTopics = mergedSubjects.reduce((sum, subj) => sum + subj.completedTopics, 0);
    
    if (totalTopics === 0) return 0;
    return Math.round((completedTopics / totalTopics) * 100);
  };
  
  const overallProgress = calculateOverallProgress();
  
  // Get CSS classes and styles based on subject color
  const getColorStyles = (color: string) => {
    const neonColors: Record<string, { bg: string, text: string, border: string }> = {
      blue: {
        bg: 'bg-[#1E1E1E]',
        text: 'text-[#00EEFF]',
        border: 'border-[#00EEFF]'
      },
      green: {
        bg: 'bg-[#1E1E1E]',
        text: 'text-[#39FF14]',
        border: 'border-[#39FF14]'
      },
      purple: {
        bg: 'bg-[#1E1E1E]',
        text: 'text-[#BF40FF]',
        border: 'border-[#BF40FF]'
      },
      red: {
        bg: 'bg-[#1E1E1E]',
        text: 'text-[#FF1744]',
        border: 'border-[#FF1744]'
      }
    };
    
    return neonColors[color] || neonColors.blue;
  };
  
  // Get progress bar color class
  const getProgressBarColor = (color: string): string => {
    const progressColors: Record<string, string> = {
      blue: 'bg-[#00EEFF]',
      green: 'bg-[#39FF14]',
      purple: 'bg-[#BF40FF]',
      red: 'bg-[#FF1744]'
    };
    
    return progressColors[color] || progressColors.blue;
  };
  
  return (
    <div className="bg-[#252525] p-6 rounded-lg border border-[#1E1E1E]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Progress by Subject</h3>
        <div className="text-sm">
          <span className="text-[#39FF14]">
            {overallProgress}%
          </span> overall
        </div>
      </div>
      
      <div className="space-y-4">
        {mergedSubjects.map(subject => {
          const colorStyles = getColorStyles(subject.color);
          const progressBarColor = getProgressBarColor(subject.color);
          
          return (
            <div key={subject.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className={`font-medium ${colorStyles.text}`}>
                  {subject.name}
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  {subject.completedTopics}/{subject.totalTopics} topics completed
                </div>
              </div>
              
              <div className={`h-2 w-full rounded-full ${colorStyles.bg}`}>
                <div 
                  className={`h-full rounded-full ${progressBarColor}`}
                  style={{ width: `${subject.progress || 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectProgress;