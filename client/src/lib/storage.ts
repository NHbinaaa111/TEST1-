import { 
  User, 
  Task, 
  Subject, 
  Topic, 
  Goal, 
  CalendarTask, 
  UserSettings,
  UserProfile
} from '@/lib/types';

// Storage Keys
const STORAGE_KEYS = {
  USERS: 'chadjee_users',
  CURRENT_USER: 'chadjee_current_user',
  TASKS: 'chadjee_tasks',
  SUBJECTS: 'chadjee_subjects',
  GOALS: 'chadjee_goals',
  CALENDAR: 'chadjee_calendar',
  SETTINGS: 'chadjee_settings',
  PROFILE: 'chadjee_profile'
};

// Initialize storage on first load
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  }
};

// User Management
export const getUsers = (): User[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
};

export const getUserByEmail = (email: string): User | undefined => {
  const users = getUsers();
  return users.find(user => user.email === email);
};

export const createUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
  const users = getUsers();
  
  // Check if user already exists
  if (users.some(u => u.email === user.email)) {
    throw new Error('User with this email already exists');
  }
  
  const newUser: User = {
    id: Date.now().toString(),
    ...user,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  // Initialize empty data for the new user
  setUserTasks(newUser.id, []);
  setUserSubjects(newUser.id, [
    {
      id: '1',
      name: 'Physics',
      progress: 0,
      color: 'blue',
      topics: []
    },
    {
      id: '2',
      name: 'Chemistry',
      progress: 0,
      color: 'green',
      topics: []
    },
    {
      id: '3',
      name: 'Mathematics',
      progress: 0,
      color: 'purple',
      topics: []
    }
  ]);
  setUserGoals(newUser.id, []);
  setUserCalendarTasks(newUser.id, []);
  setUserSettings(newUser.id, {
    theme: 'dark',
    accentColor: 'blue',
    enableAnimations: true
  });
  setUserProfile(newUser.id, {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    studyHours: 0,
    studyHoursGoal: 35
  });
  
  return newUser;
};

export const updateUser = (userId: string, updates: Partial<User>): User => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) {
    throw new Error('User not found');
  }
  
  users[index] = { ...users[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  // If this is the current user, update the current user as well
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(users[index]);
  }
  
  return users[index];
};

// Authentication
export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

export const login = (email: string, password: string): User => {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  setCurrentUser(user);
  return user;
};

export const logout = (): void => {
  setCurrentUser(null);
};

// Task Management
export const getUserTasks = (userId: string): Task[] => {
  const key = `${STORAGE_KEYS.TASKS}_${userId}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
};

export const setUserTasks = (userId: string, tasks: Task[]): void => {
  const key = `${STORAGE_KEYS.TASKS}_${userId}`;
  localStorage.setItem(key, JSON.stringify(tasks));
};

export const addTask = (userId: string, task: Omit<Task, 'id'>): Task => {
  const tasks = getUserTasks(userId);
  const newTask: Task = {
    id: Date.now().toString(),
    ...task
  };
  
  tasks.push(newTask);
  setUserTasks(userId, tasks);
  return newTask;
};

export const updateTask = (userId: string, taskId: string, updates: Partial<Task>): Task => {
  const tasks = getUserTasks(userId);
  const index = tasks.findIndex(t => t.id === taskId);
  
  if (index === -1) {
    throw new Error('Task not found');
  }
  
  tasks[index] = { ...tasks[index], ...updates };
  setUserTasks(userId, tasks);
  return tasks[index];
};

export const deleteTask = (userId: string, taskId: string): void => {
  let tasks = getUserTasks(userId);
  tasks = tasks.filter(t => t.id !== taskId);
  setUserTasks(userId, tasks);
};

// Subject & Topic Management
export const getUserSubjects = (userId: string): Subject[] => {
  const key = `${STORAGE_KEYS.SUBJECTS}_${userId}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
};

export const setUserSubjects = (userId: string, subjects: Subject[]): void => {
  const key = `${STORAGE_KEYS.SUBJECTS}_${userId}`;
  localStorage.setItem(key, JSON.stringify(subjects));
};

export const addSubject = (userId: string, subject: Omit<Subject, 'id' | 'topics'>): Subject => {
  const subjects = getUserSubjects(userId);
  const newSubject: Subject = {
    id: Date.now().toString(),
    ...subject,
    topics: []
  };
  
  subjects.push(newSubject);
  setUserSubjects(userId, subjects);
  return newSubject;
};

export const updateSubject = (userId: string, subjectId: string, updates: Partial<Subject>): Subject => {
  const subjects = getUserSubjects(userId);
  const index = subjects.findIndex(s => s.id === subjectId);
  
  if (index === -1) {
    throw new Error('Subject not found');
  }
  
  subjects[index] = { ...subjects[index], ...updates };
  setUserSubjects(userId, subjects);
  return subjects[index];
};

export const deleteSubject = (userId: string, subjectId: string): void => {
  let subjects = getUserSubjects(userId);
  subjects = subjects.filter(s => s.id !== subjectId);
  setUserSubjects(userId, subjects);
};

export const addTopic = (userId: string, subjectId: string, topic: Omit<Topic, 'id' | 'subjectId'>): Topic => {
  const subjects = getUserSubjects(userId);
  const subjectIndex = subjects.findIndex(s => s.id === subjectId);
  
  if (subjectIndex === -1) {
    throw new Error('Subject not found');
  }
  
  const newTopic: Topic = {
    id: Date.now().toString(),
    ...topic,
    subjectId
  };
  
  subjects[subjectIndex].topics.push(newTopic);
  setUserSubjects(userId, subjects);
  
  // Update subject progress
  updateSubjectProgress(userId, subjectId);
  
  return newTopic;
};

export const updateTopic = (userId: string, topicId: string, updates: Partial<Topic>): Topic => {
  const subjects = getUserSubjects(userId);
  let updatedTopic: Topic | null = null;
  let subjectId: string | null = null;
  
  const updatedSubjects = subjects.map(subject => {
    const topicIndex = subject.topics.findIndex(t => t.id === topicId);
    
    if (topicIndex !== -1) {
      const topics = [...subject.topics];
      topics[topicIndex] = { ...topics[topicIndex], ...updates };
      updatedTopic = topics[topicIndex];
      subjectId = subject.id;
      return { ...subject, topics };
    }
    
    return subject;
  });
  
  if (!updatedTopic || !subjectId) {
    throw new Error('Topic not found');
  }
  
  setUserSubjects(userId, updatedSubjects);
  
  // Update subject progress
  updateSubjectProgress(userId, subjectId);
  
  return updatedTopic;
};

export const deleteTopic = (userId: string, topicId: string): void => {
  const subjects = getUserSubjects(userId);
  let subjectId: string | null = null;
  
  const updatedSubjects = subjects.map(subject => {
    const topicIndex = subject.topics.findIndex(t => t.id === topicId);
    
    if (topicIndex !== -1) {
      subjectId = subject.id;
      return {
        ...subject,
        topics: subject.topics.filter(t => t.id !== topicId)
      };
    }
    
    return subject;
  });
  
  setUserSubjects(userId, updatedSubjects);
  
  // Update subject progress if we found and deleted the topic
  if (subjectId) {
    updateSubjectProgress(userId, subjectId);
  }
};

export const updateSubjectProgress = (userId: string, subjectId: string): void => {
  const subjects = getUserSubjects(userId);
  const subjectIndex = subjects.findIndex(s => s.id === subjectId);
  
  if (subjectIndex === -1) {
    return;
  }
  
  const subject = subjects[subjectIndex];
  const topicsCount = subject.topics.length;
  
  if (topicsCount === 0) {
    subject.progress = 0;
  } else {
    const completedTopics = subject.topics.filter(t => t.completed).length;
    subject.progress = Math.round((completedTopics / topicsCount) * 100);
  }
  
  subjects[subjectIndex] = subject;
  setUserSubjects(userId, subjects);
};

// Goal Management
export const getUserGoals = (userId: string): Goal[] => {
  const key = `${STORAGE_KEYS.GOALS}_${userId}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
};

export const setUserGoals = (userId: string, goals: Goal[]): void => {
  const key = `${STORAGE_KEYS.GOALS}_${userId}`;
  localStorage.setItem(key, JSON.stringify(goals));
};

export const addGoal = (userId: string, goal: Omit<Goal, 'id'>): Goal => {
  const goals = getUserGoals(userId);
  const newGoal: Goal = {
    id: Date.now().toString(),
    ...goal
  };
  
  goals.push(newGoal);
  setUserGoals(userId, goals);
  return newGoal;
};

export const updateGoal = (userId: string, goalId: string, updates: Partial<Goal>): Goal => {
  const goals = getUserGoals(userId);
  const index = goals.findIndex(g => g.id === goalId);
  
  if (index === -1) {
    throw new Error('Goal not found');
  }
  
  goals[index] = { ...goals[index], ...updates };
  setUserGoals(userId, goals);
  return goals[index];
};

export const deleteGoal = (userId: string, goalId: string): void => {
  let goals = getUserGoals(userId);
  goals = goals.filter(g => g.id !== goalId);
  setUserGoals(userId, goals);
};

// Calendar Tasks
export const getUserCalendarTasks = (userId: string): CalendarTask[] => {
  const key = `${STORAGE_KEYS.CALENDAR}_${userId}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
};

export const setUserCalendarTasks = (userId: string, tasks: CalendarTask[]): void => {
  const key = `${STORAGE_KEYS.CALENDAR}_${userId}`;
  localStorage.setItem(key, JSON.stringify(tasks));
};

export const addCalendarTask = (userId: string, task: Omit<CalendarTask, 'id'>): CalendarTask => {
  const tasks = getUserCalendarTasks(userId);
  const newTask: CalendarTask = {
    id: Date.now().toString(),
    ...task
  };
  
  tasks.push(newTask);
  setUserCalendarTasks(userId, tasks);
  return newTask;
};

export const deleteCalendarTask = (userId: string, taskId: string): void => {
  let tasks = getUserCalendarTasks(userId);
  tasks = tasks.filter(t => t.id !== taskId);
  setUserCalendarTasks(userId, tasks);
};

// User Settings
export const getUserSettings = (userId: string): UserSettings => {
  const key = `${STORAGE_KEYS.SETTINGS}_${userId}`;
  const defaultSettings: UserSettings = {
    theme: 'dark',
    accentColor: 'blue',
    enableAnimations: true
  };
  
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultSettings));
};

export const setUserSettings = (userId: string, settings: UserSettings): void => {
  const key = `${STORAGE_KEYS.SETTINGS}_${userId}`;
  localStorage.setItem(key, JSON.stringify(settings));
};

export const updateUserSettings = (userId: string, updates: Partial<UserSettings>): UserSettings => {
  const settings = getUserSettings(userId);
  const updatedSettings = { ...settings, ...updates };
  setUserSettings(userId, updatedSettings);
  return updatedSettings;
};

// User Profile
export const getUserProfile = (userId: string): UserProfile => {
  try {
    const key = `${STORAGE_KEYS.PROFILE}_${userId}`;
    const user = getUsers().find(u => u.id === userId);
    
    if (!user) {
      console.error(`User with ID ${userId} not found in local storage`); 
      throw new Error('User not found');
    }
    
    const defaultProfile: UserProfile = {
      id: userId,
      name: user.name,
      email: user.email,
      studyHours: 0,
      studyHoursGoal: 35,
      targetJeeYear: user.targetJeeYear || '2025'
    };
    
    // Get stored profile or use default
    const storedProfile = localStorage.getItem(key);
    let profile = storedProfile ? JSON.parse(storedProfile) : defaultProfile;
    
    // Ensure profile is always up-to-date with current user data
    profile.name = user.name;
    profile.email = user.email;
    
    // Make sure targetJeeYear is always in sync
    profile.targetJeeYear = user.targetJeeYear || profile.targetJeeYear || '2025';
    
    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    // Return a minimal valid profile to avoid app crashes
    return {
      studyHours: 0,
      studyHoursGoal: 35
    };
  }
};

export const setUserProfile = (userId: string, profile: UserProfile): void => {
  const key = `${STORAGE_KEYS.PROFILE}_${userId}`;
  localStorage.setItem(key, JSON.stringify(profile));
};

export const updateUserProfile = (userId: string, updates: Partial<UserProfile>): UserProfile => {
  try {
    const profile = getUserProfile(userId);
    const updatedProfile = { ...profile, ...updates };
    setUserProfile(userId, updatedProfile);
    
    // Update the user record with relevant fields
    const userUpdates: Partial<User> = {};
    
    if (updates.name) {
      userUpdates.name = updates.name;
    }
    
    if (updates.targetJeeYear) {
      userUpdates.targetJeeYear = updates.targetJeeYear;
      // Also save to localStorage for JEECountdown component
      localStorage.setItem("jee_target_year", updates.targetJeeYear);
    }
    
    // Only update user if we have changes
    if (Object.keys(userUpdates).length > 0) {
      updateUser(userId, userUpdates);
    }
    
    return updatedProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile');
  }
};

// Helper functions 
export const getOverallProgress = (userId: string): number => {
  const subjects = getUserSubjects(userId);
  
  if (subjects.length === 0) {
    return 0;
  }
  
  const totalProgress = subjects.reduce((acc, subject) => acc + subject.progress, 0);
  return Math.round(totalProgress / subjects.length);
};

export const getTodayTasks = (userId: string): Task[] => {
  const tasks = getUserTasks(userId);
  const today = new Date().toISOString().split('T')[0];
  
  return tasks.filter(task => task.date === today);
};

export const getCompletedTasksRatio = (userId: string): { completed: number, total: number } => {
  const todayTasks = getTodayTasks(userId);
  const total = todayTasks.length;
  const completed = todayTasks.filter(task => task.completed).length;
  
  return { completed, total };
};
