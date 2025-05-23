import useLocalStorage from '@/hooks/useLocalStorage';
import { Task } from '@/types';
import { generateId, isToday, isThisWeek } from '@/lib/utils';

// A stateless service for task operations
class TaskServiceClass {
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

  getAllTasks(): Task[] {
    return this.getLocalStorage<Task[]>('chadjee_tasks', []);
  }

  getTodaysTasks(): Task[] {
    const tasks = this.getAllTasks();
    return tasks.filter(task => isToday(task.date));
  }

  getThisWeekTasks(): Task[] {
    const tasks = this.getAllTasks();
    return tasks.filter(task => isThisWeek(task.date));
  }

  getTasksByDate(date: string): Task[] {
    const tasks = this.getAllTasks();
    return tasks.filter(task => task.date === date);
  }

  getUpcomingTasks(): Task[] {
    const tasks = this.getAllTasks();
    const today = new Date().toISOString().split('T')[0];
    
    return tasks
      .filter(task => task.date > today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  getCompletedTasksCount(): number {
    const todaysTasks = this.getTodaysTasks();
    return todaysTasks.filter(task => task.completed).length;
  }

  addTask(task: Omit<Task, 'id'>): Task {
    const tasks = this.getAllTasks();
    const newTask: Task = {
      ...task,
      id: generateId()
    };
    
    this.setLocalStorage('chadjee_tasks', [...tasks, newTask]);
    return newTask;
  }

  deleteTask(taskId: string): void {
    const tasks = this.getAllTasks();
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    this.setLocalStorage('chadjee_tasks', updatedTasks);
  }

  updateTaskStatus(taskId: string, completed: boolean): void {
    const tasks = this.getAllTasks();
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed } : task
    );
    this.setLocalStorage('chadjee_tasks', updatedTasks);
  }

  resetAllTasks(): void {
    this.setLocalStorage('chadjee_tasks', []);
  }

  // JEE Exam Dates
  getExamDates(): { jeeMainsDate: string, jeeAdvancedDate: string } {
    const dates = this.getLocalStorage<{ jeeMainsDate: string, jeeAdvancedDate: string }>(
      'chadjee_exam_dates',
      { jeeMainsDate: '2024-01-24', jeeAdvancedDate: '2024-05-26' }
    );
    return dates;
  }

  updateExamDates(jeeMainsDate: string, jeeAdvancedDate: string): void {
    this.setLocalStorage('chadjee_exam_dates', { jeeMainsDate, jeeAdvancedDate });
  }

  // Countdown calculations
  getDaysUntilJEEMains(): number {
    const { jeeMainsDate } = this.getExamDates();
    const now = new Date();
    const targetDate = new Date(jeeMainsDate);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  getDaysUntilJEEAdvanced(): number {
    const { jeeAdvancedDate } = this.getExamDates();
    const now = new Date();
    const targetDate = new Date(jeeAdvancedDate);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  getHoursUntilJEEMains(): number {
    const { jeeMainsDate } = this.getExamDates();
    const now = new Date();
    const targetDate = new Date(jeeMainsDate);
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  }

  getMinutesUntilJEEMains(): number {
    const { jeeMainsDate } = this.getExamDates();
    const now = new Date();
    const targetDate = new Date(jeeMainsDate);
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  }

  getSecondsUntilJEEMains(): number {
    const { jeeMainsDate } = this.getExamDates();
    const now = new Date();
    const targetDate = new Date(jeeMainsDate);
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.floor((diffTime % (1000 * 60)) / 1000);
  }

  getHoursUntilJEEAdvanced(): number {
    const { jeeAdvancedDate } = this.getExamDates();
    const now = new Date();
    const targetDate = new Date(jeeAdvancedDate);
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  }

  getMinutesUntilJEEAdvanced(): number {
    const { jeeAdvancedDate } = this.getExamDates();
    const now = new Date();
    const targetDate = new Date(jeeAdvancedDate);
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  }

  getSecondsUntilJEEAdvanced(): number {
    const { jeeAdvancedDate } = this.getExamDates();
    const now = new Date();
    const targetDate = new Date(jeeAdvancedDate);
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.floor((diffTime % (1000 * 60)) / 1000);
  }
}

export const TaskService = new TaskServiceClass();
