export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  date: string;
  subject: string;
  startTime: string;
  endTime: string;
  description: string;
  completed: boolean;
}

export interface Topic {
  id: string;
  name: string;
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Subject {
  id: string;
  name: string;
  completed: number;
  total: number;
  topics: Topic[];
}

export interface Goal {
  id: string;
  title: string;
  deadline: string;
  type: 'weekly' | 'monthly';
  completed: boolean;
  createdAt: string;
}
