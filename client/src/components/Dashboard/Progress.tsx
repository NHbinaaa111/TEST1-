import { useEffect, useState } from 'react';
import { ProgressService } from '@/services/ProgressService';
import { Subject } from '@/types';

const Progress = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  
  useEffect(() => {
    const loadedSubjects = ProgressService.getAllSubjects();
    setSubjects(loadedSubjects);
    
    // Calculate overall progress
    const progress = ProgressService.getProgress();
    setOverallProgress(progress.overall);
    
    // Listen for progress update events
    const handleProgressUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{physics: number; chemistry: number; mathematics: number; overall: number}>;
      
      // Update overall progress
      if (customEvent.detail?.overall) {
        setOverallProgress(customEvent.detail.overall);
      }
      
      // Update subjects
      const updatedSubjects = ProgressService.getAllSubjects();
      setSubjects(updatedSubjects);
    };
    
    window.addEventListener('progress-updated', handleProgressUpdate);
    
    return () => {
      window.removeEventListener('progress-updated', handleProgressUpdate);
    };
  }, []);
  
  const getTopicsByDifficulty = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return { easy: 0, medium: 0, hard: 0 };
    
    const easy = subject.topics.filter(t => t.difficulty === 'easy').length;
    const medium = subject.topics.filter(t => t.difficulty === 'medium').length;
    const hard = subject.topics.filter(t => t.difficulty === 'hard').length;
    
    return { easy, medium, hard };
  };
  
  const getCompletedByDifficulty = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return { easy: 0, medium: 0, hard: 0 };
    
    const easy = subject.topics.filter(t => t.difficulty === 'easy' && t.completed).length;
    const medium = subject.topics.filter(t => t.difficulty === 'medium' && t.completed).length;
    const hard = subject.topics.filter(t => t.difficulty === 'hard' && t.completed).length;
    
    return { easy, medium, hard };
  };

  return (
    <div id="dashboard-progress" className="dashboard-view p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-orbitron font-bold mb-2">Progress Tracker</h2>
        <p className="text-gray-400">Monitor your preparation journey</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A] flex flex-col items-center">
          <div className="text-4xl font-rajdhani font-bold text-[#00EEFF] mb-4">
            {subjects.length ? Math.round((subjects.reduce((acc, s) => acc + s.completed, 0) / subjects.reduce((acc, s) => acc + s.total, 0)) * 100) : 0}%
          </div>
          <div className="text-gray-400 text-sm mb-4">Overall Completion</div>
          <div className="w-full h-4 bg-[#2A2A2A] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#0FFF50] via-[#00EEFF] to-[#5E17EB] progress-bar-fill"
              style={{width: `${overallProgress}%`}}
            ></div>
          </div>
        </div>
        
        <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
          <h3 className="font-orbitron font-semibold mb-4">Topics Completed</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#121212] rounded-lg text-center">
              <div className="text-3xl font-rajdhani font-bold text-[#5E17EB]">
                {subjects.reduce((acc, s) => acc + s.completed, 0)}
              </div>
              <div className="text-xs text-gray-400">Topics Done</div>
            </div>
            <div className="p-4 bg-[#121212] rounded-lg text-center">
              <div className="text-3xl font-rajdhani font-bold text-[#00EEFF]">
                {subjects.reduce((acc, s) => acc + s.total, 0) - subjects.reduce((acc, s) => acc + s.completed, 0)}
              </div>
              <div className="text-xs text-gray-400">Topics Left</div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
          <h3 className="font-orbitron font-semibold mb-4">Difficulty Breakdown</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-400">Easy</span>
                <span className="text-xs text-gray-400">
                  {subjects.reduce((acc, s) => {
                    const completed = getCompletedByDifficulty(s.id);
                    return acc + completed.easy;
                  }, 0)} / 
                  {subjects.reduce((acc, s) => {
                    const topics = getTopicsByDifficulty(s.id);
                    return acc + topics.easy;
                  }, 0)}
                </span>
              </div>
              <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-400 progress-bar-fill"
                  style={{
                    width: `${subjects.reduce((acc, s) => {
                      const completed = getCompletedByDifficulty(s.id);
                      const topics = getTopicsByDifficulty(s.id);
                      return topics.easy ? (completed.easy / topics.easy) * 100 : 0;
                    }, 0) / (subjects.length || 1)}%`
                  }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-yellow-400">Medium</span>
                <span className="text-xs text-gray-400">
                  {subjects.reduce((acc, s) => {
                    const completed = getCompletedByDifficulty(s.id);
                    return acc + completed.medium;
                  }, 0)} / 
                  {subjects.reduce((acc, s) => {
                    const topics = getTopicsByDifficulty(s.id);
                    return acc + topics.medium;
                  }, 0)}
                </span>
              </div>
              <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 progress-bar-fill"
                  style={{
                    width: `${subjects.reduce((acc, s) => {
                      const completed = getCompletedByDifficulty(s.id);
                      const topics = getTopicsByDifficulty(s.id);
                      return topics.medium ? (completed.medium / topics.medium) * 100 : 0;
                    }, 0) / (subjects.length || 1)}%`
                  }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-400">Hard</span>
                <span className="text-xs text-gray-400">
                  {subjects.reduce((acc, s) => {
                    const completed = getCompletedByDifficulty(s.id);
                    return acc + completed.hard;
                  }, 0)} / 
                  {subjects.reduce((acc, s) => {
                    const topics = getTopicsByDifficulty(s.id);
                    return acc + topics.hard;
                  }, 0)}
                </span>
              </div>
              <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-400 progress-bar-fill"
                  style={{
                    width: `${subjects.reduce((acc, s) => {
                      const completed = getCompletedByDifficulty(s.id);
                      const topics = getTopicsByDifficulty(s.id);
                      return topics.hard ? (completed.hard / topics.hard) * 100 : 0;
                    }, 0) / (subjects.length || 1)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A] mb-8">
        <h3 className="font-orbitron font-semibold mb-6">Subject-wise Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Always show the three core subjects */}
          <div className="bg-[#121212] p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Physics</h4>
              <div className="text-sm text-gray-400">
                {subjects.find(s => s.name.toLowerCase().includes('physics'))?.completed || 0} / 
                {subjects.find(s => s.name.toLowerCase().includes('physics'))?.total || 0}
              </div>
            </div>
            <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden mb-4">
              <div 
                className="h-full progress-bar-fill bg-[#0FFF50]"
                style={{
                  width: `${
                    subjects.find(s => s.name.toLowerCase().includes('physics'))?.total
                    ? (subjects.find(s => s.name.toLowerCase().includes('physics'))?.completed || 0) / 
                      (subjects.find(s => s.name.toLowerCase().includes('physics'))?.total || 1) * 100
                    : 0
                  }%`
                }}
              ></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="p-2 bg-[#2A2A2A] rounded mb-1">
                  <span className="text-green-400">
                    {subjects.find(s => s.name.toLowerCase().includes('physics')) 
                      ? getCompletedByDifficulty(subjects.find(s => s.name.toLowerCase().includes('physics'))?.id || "").easy 
                      : 0}/
                    {subjects.find(s => s.name.toLowerCase().includes('physics')) 
                      ? getTopicsByDifficulty(subjects.find(s => s.name.toLowerCase().includes('physics'))?.id || "").easy 
                      : 0}
                  </span>
                </div>
                <div className="text-gray-400">Easy</div>
              </div>
              <div>
                <div className="p-2 bg-[#2A2A2A] rounded mb-1">
                  <span className="text-yellow-400">
                    {subjects.find(s => s.name.toLowerCase().includes('physics')) 
                      ? getCompletedByDifficulty(subjects.find(s => s.name.toLowerCase().includes('physics'))?.id || "").medium 
                      : 0}/
                    {subjects.find(s => s.name.toLowerCase().includes('physics')) 
                      ? getTopicsByDifficulty(subjects.find(s => s.name.toLowerCase().includes('physics'))?.id || "").medium 
                      : 0}
                  </span>
                </div>
                <div className="text-gray-400">Medium</div>
              </div>
              <div>
                <div className="p-2 bg-[#2A2A2A] rounded mb-1">
                  <span className="text-red-400">
                    {subjects.find(s => s.name.toLowerCase().includes('physics')) 
                      ? getCompletedByDifficulty(subjects.find(s => s.name.toLowerCase().includes('physics'))?.id || "").hard 
                      : 0}/
                    {subjects.find(s => s.name.toLowerCase().includes('physics')) 
                      ? getTopicsByDifficulty(subjects.find(s => s.name.toLowerCase().includes('physics'))?.id || "").hard 
                      : 0}
                  </span>
                </div>
                <div className="text-gray-400">Hard</div>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Chemistry</h4>
              <div className="text-sm text-gray-400">
                {subjects.find(s => s.name.toLowerCase().includes('chemistry'))?.completed || 0} / 
                {subjects.find(s => s.name.toLowerCase().includes('chemistry'))?.total || 0}
              </div>
            </div>
            <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden mb-4">
              <div 
                className="h-full progress-bar-fill bg-[#00EEFF]"
                style={{
                  width: `${
                    subjects.find(s => s.name.toLowerCase().includes('chemistry'))?.total
                    ? (subjects.find(s => s.name.toLowerCase().includes('chemistry'))?.completed || 0) / 
                      (subjects.find(s => s.name.toLowerCase().includes('chemistry'))?.total || 1) * 100
                    : 0
                  }%`
                }}
              ></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="p-2 bg-[#2A2A2A] rounded mb-1">
                  <span className="text-green-400">
                    {subjects.find(s => s.name.toLowerCase().includes('chemistry')) 
                      ? getCompletedByDifficulty(subjects.find(s => s.name.toLowerCase().includes('chemistry'))?.id || "").easy 
                      : 0}/
                    {subjects.find(s => s.name.toLowerCase().includes('chemistry')) 
                      ? getTopicsByDifficulty(subjects.find(s => s.name.toLowerCase().includes('chemistry'))?.id || "").easy 
                      : 0}
                  </span>
                </div>
                <div className="text-gray-400">Easy</div>
              </div>
              <div>
                <div className="p-2 bg-[#2A2A2A] rounded mb-1">
                  <span className="text-yellow-400">
                    {subjects.find(s => s.name.toLowerCase().includes('chemistry')) 
                      ? getCompletedByDifficulty(subjects.find(s => s.name.toLowerCase().includes('chemistry'))?.id || "").medium 
                      : 0}/
                    {subjects.find(s => s.name.toLowerCase().includes('chemistry')) 
                      ? getTopicsByDifficulty(subjects.find(s => s.name.toLowerCase().includes('chemistry'))?.id || "").medium 
                      : 0}
                  </span>
                </div>
                <div className="text-gray-400">Medium</div>
              </div>
              <div>
                <div className="p-2 bg-[#2A2A2A] rounded mb-1">
                  <span className="text-red-400">
                    {subjects.find(s => s.name.toLowerCase().includes('chemistry')) 
                      ? getCompletedByDifficulty(subjects.find(s => s.name.toLowerCase().includes('chemistry'))?.id || "").hard 
                      : 0}/
                    {subjects.find(s => s.name.toLowerCase().includes('chemistry')) 
                      ? getTopicsByDifficulty(subjects.find(s => s.name.toLowerCase().includes('chemistry'))?.id || "").hard 
                      : 0}
                  </span>
                </div>
                <div className="text-gray-400">Hard</div>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Mathematics</h4>
              <div className="text-sm text-gray-400">
                {subjects.find(s => s.name.toLowerCase().includes('math'))?.completed || 0} / 
                {subjects.find(s => s.name.toLowerCase().includes('math'))?.total || 0}
              </div>
            </div>
            <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden mb-4">
              <div 
                className="h-full progress-bar-fill bg-[#5E17EB]"
                style={{
                  width: `${
                    subjects.find(s => s.name.toLowerCase().includes('math'))?.total
                    ? (subjects.find(s => s.name.toLowerCase().includes('math'))?.completed || 0) / 
                      (subjects.find(s => s.name.toLowerCase().includes('math'))?.total || 1) * 100
                    : 0
                  }%`
                }}
              ></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="p-2 bg-[#2A2A2A] rounded mb-1">
                  <span className="text-green-400">
                    {subjects.find(s => s.name.toLowerCase().includes('math')) 
                      ? getCompletedByDifficulty(subjects.find(s => s.name.toLowerCase().includes('math'))?.id || "").easy 
                      : 0}/
                    {subjects.find(s => s.name.toLowerCase().includes('math')) 
                      ? getTopicsByDifficulty(subjects.find(s => s.name.toLowerCase().includes('math'))?.id || "").easy 
                      : 0}
                  </span>
                </div>
                <div className="text-gray-400">Easy</div>
              </div>
              <div>
                <div className="p-2 bg-[#2A2A2A] rounded mb-1">
                  <span className="text-yellow-400">
                    {subjects.find(s => s.name.toLowerCase().includes('math')) 
                      ? getCompletedByDifficulty(subjects.find(s => s.name.toLowerCase().includes('math'))?.id || "").medium 
                      : 0}/
                    {subjects.find(s => s.name.toLowerCase().includes('math')) 
                      ? getTopicsByDifficulty(subjects.find(s => s.name.toLowerCase().includes('math'))?.id || "").medium 
                      : 0}
                  </span>
                </div>
                <div className="text-gray-400">Medium</div>
              </div>
              <div>
                <div className="p-2 bg-[#2A2A2A] rounded mb-1">
                  <span className="text-red-400">
                    {subjects.find(s => s.name.toLowerCase().includes('math')) 
                      ? getCompletedByDifficulty(subjects.find(s => s.name.toLowerCase().includes('math'))?.id || "").hard 
                      : 0}/
                    {subjects.find(s => s.name.toLowerCase().includes('math')) 
                      ? getTopicsByDifficulty(subjects.find(s => s.name.toLowerCase().includes('math'))?.id || "").hard 
                      : 0}
                  </span>
                </div>
                <div className="text-gray-400">Hard</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
          <h3 className="font-orbitron font-semibold mb-4">Study Suggestions</h3>
          <div className="space-y-3">
            {subjects.length > 0 ? (
              <>
                <div className="p-3 bg-[#121212] rounded-lg border-l-4 border-[#00EEFF]">
                  <h4 className="text-sm font-medium mb-1">Focus on Hard Topics</h4>
                  <p className="text-xs text-gray-400">
                    You've completed only {Math.round(subjects.reduce((acc, s) => {
                      const completed = getCompletedByDifficulty(s.id);
                      const topics = getTopicsByDifficulty(s.id);
                      return topics.hard ? (completed.hard / topics.hard) * 100 : 0;
                    }, 0) / (subjects.length || 1))}% of hard topics. Consider allocating more time to these.
                  </p>
                </div>
                
                <div className="p-3 bg-[#121212] rounded-lg border-l-4 border-[#0FFF50]">
                  <h4 className="text-sm font-medium mb-1">Balanced Approach</h4>
                  <p className="text-xs text-gray-400">
                    Maintain a balance between subjects. {
                      subjects.find(s => (s.total ? (s.completed / s.total) : 0) === 
                        Math.min(...subjects.map(s => s.total ? (s.completed / s.total) : 0)))?.name
                    } needs more attention.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-gray-400">
                Add subjects in Study Planner to get suggestions.
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
          <h3 className="font-orbitron font-semibold mb-4">Revision Strategy</h3>
          <div className="space-y-2">
            <div className="flex items-center p-3 bg-[#121212] rounded-lg">
              <div className="flex-grow">
                <div className="text-sm mb-1">Spaced Repetition</div>
                <div className="text-xs text-gray-400">Revisit completed topics at increasing intervals</div>
              </div>
              <div className="text-[#0FFF50]">
                <i className="fas fa-check-circle"></i>
              </div>
            </div>
            <div className="flex items-center p-3 bg-[#121212] rounded-lg">
              <div className="flex-grow">
                <div className="text-sm mb-1">Active Recall</div>
                <div className="text-xs text-gray-400">Test yourself rather than passive re-reading</div>
              </div>
              <div className="text-[#0FFF50]">
                <i className="fas fa-check-circle"></i>
              </div>
            </div>
            <div className="flex items-center p-3 bg-[#121212] rounded-lg">
              <div className="flex-grow">
                <div className="text-sm mb-1">Interleaved Practice</div>
                <div className="text-xs text-gray-400">Mix different subjects and problem types</div>
              </div>
              <div className="text-[#0FFF50]">
                <i className="fas fa-check-circle"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
