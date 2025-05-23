import { Subject, Topic } from '@/types';
import { generateId } from '@/lib/utils';

class ProgressServiceClass {
  private getLocalStorage<T>(key: string, initialValue: T): T {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error retrieving from localStorage', error);
      return initialValue;
    }
  }

  private setLocalStorage<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  }

  getAllSubjects(): Subject[] {
    return this.getLocalStorage<Subject[]>('chadjee_subjects', []);
  }

  addSubject(name: string): boolean {
    const subjects = this.getAllSubjects();
    
    // Check if subject already exists
    if (subjects.some(subject => subject.name.toLowerCase() === name.toLowerCase())) {
      return false;
    }
    
    const newSubject: Subject = {
      id: generateId(),
      name,
      completed: 0,
      total: 0,
      topics: []
    };
    
    this.setLocalStorage('chadjee_subjects', [...subjects, newSubject]);
    return true;
  }

  deleteSubject(subjectId: string): void {
    const subjects = this.getAllSubjects();
    const updatedSubjects = subjects.filter(subject => subject.id !== subjectId);
    this.setLocalStorage('chadjee_subjects', updatedSubjects);
  }

  addTopic(subjectId: string, name: string, difficulty: 'easy' | 'medium' | 'hard'): boolean {
    const subjects = this.getAllSubjects();
    const subjectIndex = subjects.findIndex(subject => subject.id === subjectId);
    
    if (subjectIndex === -1) return false;
    
    // Check if topic already exists in this subject
    if (subjects[subjectIndex].topics.some(topic => topic.name.toLowerCase() === name.toLowerCase())) {
      return false;
    }
    
    const newTopic: Topic = {
      id: generateId(),
      name,
      completed: false,
      difficulty
    };
    
    const updatedSubjects = [...subjects];
    updatedSubjects[subjectIndex] = {
      ...updatedSubjects[subjectIndex],
      topics: [...updatedSubjects[subjectIndex].topics, newTopic],
      total: updatedSubjects[subjectIndex].total + 1
    };
    
    this.setLocalStorage('chadjee_subjects', updatedSubjects);
    return true;
  }

  deleteTopic(subjectId: string, topicId: string): void {
    const subjects = this.getAllSubjects();
    const subjectIndex = subjects.findIndex(subject => subject.id === subjectId);
    
    if (subjectIndex === -1) return;
    
    const topic = subjects[subjectIndex].topics.find(t => t.id === topicId);
    
    if (!topic) return;
    
    const updatedSubjects = [...subjects];
    updatedSubjects[subjectIndex] = {
      ...updatedSubjects[subjectIndex],
      topics: updatedSubjects[subjectIndex].topics.filter(t => t.id !== topicId),
      total: updatedSubjects[subjectIndex].total - 1,
      completed: topic.completed 
        ? updatedSubjects[subjectIndex].completed - 1 
        : updatedSubjects[subjectIndex].completed
    };
    
    this.setLocalStorage('chadjee_subjects', updatedSubjects);
  }

  updateTopicStatus(subjectId: string, topicId: string, completed: boolean): void {
    const subjects = this.getAllSubjects();
    const subjectIndex = subjects.findIndex(subject => subject.id === subjectId);
    
    if (subjectIndex === -1) return;
    
    const topicIndex = subjects[subjectIndex].topics.findIndex(topic => topic.id === topicId);
    
    if (topicIndex === -1) return;
    
    const wasCompleted = subjects[subjectIndex].topics[topicIndex].completed;
    
    const updatedSubjects = [...subjects];
    updatedSubjects[subjectIndex] = {
      ...updatedSubjects[subjectIndex],
      topics: updatedSubjects[subjectIndex].topics.map(topic =>
        topic.id === topicId ? { ...topic, completed } : topic
      ),
      completed: wasCompleted && !completed
        ? updatedSubjects[subjectIndex].completed - 1
        : !wasCompleted && completed
        ? updatedSubjects[subjectIndex].completed + 1
        : updatedSubjects[subjectIndex].completed
    };
    
    this.setLocalStorage('chadjee_subjects', updatedSubjects);
  }

  // Initialize default subjects if they don't exist
  initializeDefaultSubjects(): void {
    const subjects = this.getAllSubjects();
    const defaultSubjects = ['Physics', 'Chemistry', 'Mathematics'];
    let updated = false;
    
    for (const subject of defaultSubjects) {
      if (!subjects.some(s => s.name.toLowerCase() === subject.toLowerCase())) {
        const newSubject: Subject = {
          id: generateId(),
          name: subject,
          completed: 0,
          total: 0,
          topics: []
        };
        subjects.push(newSubject);
        updated = true;
      }
    }
    
    if (updated) {
      this.setLocalStorage('chadjee_subjects', subjects);
    }
  }

  getProgress(): { physics: number; chemistry: number; mathematics: number; overall: number } {
    // Get stored progress first (if it exists)
    const storedProgress = this.getLocalStorage<{
      physics: number;
      chemistry: number;
      mathematics: number;
      overall: number;
      timestamp: number;
    } | null>('chadjee_progress_cache', null);
    
    // Only recalculate if we don't have stored progress or it's older than 5 minutes
    const currentTime = Date.now();
    const shouldRecalculate = !storedProgress || 
      (currentTime - storedProgress.timestamp > 5 * 60 * 1000); // 5 minutes
    
    if (!shouldRecalculate && storedProgress) {
      return {
        physics: storedProgress.physics,
        chemistry: storedProgress.chemistry,
        mathematics: storedProgress.mathematics,
        overall: storedProgress.overall
      };
    }
    
    // Ensure default subjects exist
    this.initializeDefaultSubjects();
    
    const subjects = this.getAllSubjects();
    
    const physics = subjects.find(s => s.name.toLowerCase().includes('physics'));
    const chemistry = subjects.find(s => s.name.toLowerCase().includes('chemistry'));
    const mathematics = subjects.find(s => s.name.toLowerCase().includes('math'));
    
    const physicsProgress = physics && physics.total > 0 
      ? Math.round((physics.completed / physics.total) * 100) 
      : 0;
    
    const chemistryProgress = chemistry && chemistry.total > 0 
      ? Math.round((chemistry.completed / chemistry.total) * 100) 
      : 0;
    
    const mathematicsProgress = mathematics && mathematics.total > 0 
      ? Math.round((mathematics.completed / mathematics.total) * 100) 
      : 0;
    
    const totalCompleted = subjects.reduce((sum, subject) => sum + subject.completed, 0);
    const totalTopics = subjects.reduce((sum, subject) => sum + subject.total, 0);
    
    const overallProgress = totalTopics > 0 
      ? Math.round((totalCompleted / totalTopics) * 100) 
      : 0;
    
    // Save the progress with timestamp
    const progressData = {
      physics: physicsProgress,
      chemistry: chemistryProgress,
      mathematics: mathematicsProgress,
      overall: overallProgress,
      timestamp: currentTime
    };
    
    this.setLocalStorage('chadjee_progress_cache', progressData);
    
    return {
      physics: physicsProgress,
      chemistry: chemistryProgress,
      mathematics: mathematicsProgress,
      overall: overallProgress
    };
  }

  resetAllProgress(): void {
    this.setLocalStorage('chadjee_subjects', []);
  }
  
  refreshProgressInLocalStorage(progress: { physics: number; chemistry: number; mathematics: number; overall: number }): void {
    // Force a refresh of the progress cache to ensure data is consistent
    const currentTime = Date.now();
    
    // Save the progress with current timestamp
    const progressData = {
      ...progress,
      timestamp: currentTime
    };
    
    // Clear existing cache and store fresh data
    this.setLocalStorage('chadjee_progress_cache', progressData);
    
    // Trigger a refresh of the progress bars across the app
    const refreshEvent = new CustomEvent('progress-updated', { detail: progress });
    window.dispatchEvent(refreshEvent);
  }
}

export const ProgressService = new ProgressServiceClass();
