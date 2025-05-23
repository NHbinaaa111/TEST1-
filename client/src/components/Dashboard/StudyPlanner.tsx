import { useState, useEffect } from 'react';
import { ProgressService } from '@/services/ProgressService';
import { useToast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  completed: number;
  total: number;
  topics: Topic[];
}

interface Topic {
  id: string;
  name: string;
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

const StudyPlanner = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = () => {
    const savedSubjects = ProgressService.getAllSubjects();
    setSubjects(savedSubjects);
    
    // If we have subjects but none selected, select the first one
    if (savedSubjects.length > 0 && !selectedSubject) {
      setSelectedSubject(savedSubjects[0].id);
    }
  };

  const handleAddSubject = () => {
    if (!newSubject.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subject name",
        variant: "destructive"
      });
      return;
    }

    const success = ProgressService.addSubject(newSubject);
    
    if (success) {
      toast({
        title: "Success",
        description: "Subject added successfully!",
      });
      setNewSubject('');
      loadSubjects();
    } else {
      toast({
        title: "Error",
        description: "Subject already exists",
        variant: "destructive"
      });
    }
  };

  const handleAddTopic = () => {
    if (!newTopic.trim() || !selectedSubject) {
      toast({
        title: "Error",
        description: "Please enter a topic name and select a subject",
        variant: "destructive"
      });
      return;
    }

    const success = ProgressService.addTopic(selectedSubject, newTopic, selectedDifficulty);
    
    if (success) {
      toast({
        title: "Success",
        description: "Topic added successfully!",
      });
      setNewTopic('');
      loadSubjects();
    } else {
      toast({
        title: "Error",
        description: "Topic already exists in this subject",
        variant: "destructive"
      });
    }
  };

  const handleToggleTopic = (subjectId: string, topicId: string, completed: boolean) => {
    ProgressService.updateTopicStatus(subjectId, topicId, completed);
    loadSubjects();
    
    // Force a refresh of the progress data in localStorage
    const progress = ProgressService.getProgress();
    ProgressService.refreshProgressInLocalStorage(progress);
    
    // Show toast notification
    toast({
      title: completed ? "Topic Completed" : "Topic Marked as Incomplete",
      description: "Your progress has been updated",
    });
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (confirm('Are you sure you want to delete this subject and all its topics?')) {
      ProgressService.deleteSubject(subjectId);
      
      // If the deleted subject was selected, reset selectedSubject
      if (selectedSubject === subjectId) {
        const remainingSubjects = subjects.filter(s => s.id !== subjectId);
        setSelectedSubject(remainingSubjects.length > 0 ? remainingSubjects[0].id : null);
      }
      
      loadSubjects();
      
      toast({
        title: "Success",
        description: "Subject deleted successfully!",
      });
    }
  };

  const handleDeleteTopic = (subjectId: string, topicId: string) => {
    ProgressService.deleteTopic(subjectId, topicId);
    loadSubjects();
    
    toast({
      title: "Success",
      description: "Topic deleted successfully!",
    });
  };

  return (
    <div id="dashboard-planner" className="dashboard-view p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-orbitron font-bold mb-2">Study Planner</h2>
        <p className="text-gray-400">Organize your study subjects and track topics</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A] mb-6">
            <h3 className="font-orbitron font-semibold mb-4">Add New Subject</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="subject-name" className="block text-sm font-medium text-gray-300 mb-2">Subject Name</label>
                <div className="flex">
                  <input 
                    type="text" 
                    id="subject-name" 
                    className="flex-grow px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]" 
                    placeholder="e.g. Physics, Chemistry"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                  />
                  <button 
                    onClick={handleAddSubject}
                    className="px-4 py-2 rounded-r-md bg-[#5E17EB] text-white font-medium neon-purple-glow hover:bg-opacity-90 transition duration-300"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
            <h3 className="font-orbitron font-semibold mb-4">Your Subjects</h3>
            {subjects.length > 0 ? (
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <div 
                    key={subject.id} 
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedSubject === subject.id ? 'bg-[#5E17EB] bg-opacity-20 border border-[#5E17EB]' : 'bg-[#121212] border border-[#3A3A3A] hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedSubject(subject.id)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{subject.name}</div>
                      <button 
                        className="text-gray-400 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(subject.id);
                        }}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Progress</span>
                      <span>{subject.completed} / {subject.total} topics ({subject.total ? Math.round((subject.completed/subject.total) * 100) : 0}%)</span>
                    </div>
                    <div className="h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#5E17EB] to-[#00EEFF] progress-bar-fill" 
                        style={{width: `${subject.total ? (subject.completed/subject.total) * 100 : 0}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                No subjects added yet. Add a subject to get started.
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A] mb-6">
            <h3 className="font-orbitron font-semibold mb-4">Add New Topic</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="topic-subject" className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <select 
                  id="topic-subject" 
                  className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]"
                  value={selectedSubject || ''}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={subjects.length === 0}
                >
                  {subjects.length === 0 ? (
                    <option value="">No subjects available</option>
                  ) : (
                    subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="topic-name" className="block text-sm font-medium text-gray-300 mb-2">Topic Name</label>
                <input 
                  type="text" 
                  id="topic-name" 
                  className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]" 
                  placeholder="e.g. Kinematics, Chemical Bonding"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  disabled={!selectedSubject}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="difficulty-easy" 
                      name="difficulty" 
                      className="mr-2" 
                      checked={selectedDifficulty === 'easy'}
                      onChange={() => setSelectedDifficulty('easy')}
                    />
                    <label htmlFor="difficulty-easy" className="text-sm text-gray-300">Easy</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="difficulty-medium" 
                      name="difficulty" 
                      className="mr-2" 
                      checked={selectedDifficulty === 'medium'}
                      onChange={() => setSelectedDifficulty('medium')}
                    />
                    <label htmlFor="difficulty-medium" className="text-sm text-gray-300">Medium</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="difficulty-hard" 
                      name="difficulty" 
                      className="mr-2" 
                      checked={selectedDifficulty === 'hard'}
                      onChange={() => setSelectedDifficulty('hard')}
                    />
                    <label htmlFor="difficulty-hard" className="text-sm text-gray-300">Hard</label>
                  </div>
                </div>
              </div>
              <div>
                <button 
                  onClick={handleAddTopic}
                  disabled={!selectedSubject}
                  className={`px-6 py-2 rounded-md font-medium transition duration-300 ${
                    !selectedSubject 
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                      : 'bg-[#5E17EB] text-white neon-purple-glow hover:bg-opacity-90'
                  }`}
                >
                  Add Topic
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
            <h3 className="font-orbitron font-semibold mb-4">
              {selectedSubject && subjects.find(s => s.id === selectedSubject)
                ? `Topics in ${subjects.find(s => s.id === selectedSubject)?.name || ''}`
                : 'Topics'
              }
            </h3>
            
            {selectedSubject ? (
              subjects.find(s => s.id === selectedSubject)?.topics.length ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {subjects.find(s => s.id === selectedSubject)?.topics.map((topic) => (
                    <div key={topic.id} className="flex items-center p-3 bg-[#121212] rounded-lg">
                      <input 
                        type="checkbox" 
                        checked={topic.completed} 
                        onChange={(e) => handleToggleTopic(selectedSubject, topic.id, e.target.checked)}
                        className="form-checkbox h-5 w-5 text-[#5E17EB] rounded border-[#3A3A3A] bg-[#2A2A2A] mr-3"
                      />
                      <div className="flex-grow">
                        <div className={`text-sm ${topic.completed ? 'line-through text-gray-400' : ''}`}>
                          {topic.name}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`text-xs bg-opacity-20 px-2 py-1 rounded ${
                          topic.difficulty === 'easy' ? 'bg-green-500 text-green-500' : 
                          topic.difficulty === 'medium' ? 'bg-yellow-500 text-yellow-500' : 
                          'bg-red-500 text-red-500'
                        }`}>
                          {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
                        </div>
                        <button 
                          className="text-gray-400 hover:text-red-500 p-1"
                          onClick={() => handleDeleteTopic(selectedSubject, topic.id)}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  No topics added to this subject yet.
                </div>
              )
            ) : (
              <div className="text-center py-6 text-gray-400">
                Select a subject to view its topics.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPlanner;
