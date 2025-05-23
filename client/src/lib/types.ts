export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  targetJeeYear?: string; // e.g. "2025", "2026", "2027"
}

export interface Subject {
  id: string;
  name: string;
  progress: number;
  color: 'blue' | 'green' | 'purple';
  topics: Topic[];
  totalTopics?: number;
  completedTopics?: number;
}

export interface Topic {
  id: string;
  name: string;
  completed: boolean;
  subjectId: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  subject?: string;
  subjectColor?: 'blue' | 'green' | 'purple';
}

export interface DailyTask {
  date: string;
  tasks: Task[];
}

export interface Goal {
  id: string;
  title: string;
  completed: boolean;
  deadline: string;
  type: 'weekly' | 'monthly';
}

export interface CalendarTask {
  id: string;
  date: string;
  subject: string;
  subjectColor: 'blue' | 'green' | 'purple';
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: 'blue' | 'green' | 'purple' | 'red';
  enableAnimations: boolean;
}

export interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  studyHours: number;
  studyHoursGoal: number;
  theme?: 'dark' | 'light' | 'system';
  accentColor?: 'blue' | 'green' | 'purple' | 'red';
  targetJeeYear?: string;
}

export interface Quote {
  text: string;
  author: string;
}
