import { 
  users, 
  tasks, 
  subjects, 
  topics, 
  goals, 
  calendarTasks, 
  studySessions, 
  userSettings,
  testRecords,
  type User, 
  type InsertUser,
  type Task,
  type InsertTask,
  type Subject,
  type InsertSubject,
  type Topic,
  type InsertTopic,
  type Goal,
  type InsertGoal,
  type CalendarTask,
  type InsertCalendarTask,
  type StudySession,
  type InsertStudySession,
  type UserSettings,
  type InsertUserSettings,
  type TestRecord,
  type InsertTestRecord,
  moodEnum,
  energyEnum,
  testPerformanceEnum
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, isNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserResetToken(userId: number, token: string, expiry: Date): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  
  // Task methods
  getTasks(userId: number): Promise<Task[]>;
  getTaskById(taskId: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(taskId: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(taskId: number): Promise<boolean>;
  
  // Subject methods
  getSubjects(userId: number): Promise<Subject[]>;
  getSubjectById(subjectId: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(subjectId: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(subjectId: number): Promise<boolean>;
  
  // Topic methods
  getTopics(subjectId: number): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(topicId: number, topic: Partial<InsertTopic>): Promise<Topic | undefined>;
  deleteTopic(topicId: number): Promise<boolean>;
  
  // Goal methods
  getGoals(userId: number): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(goalId: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(goalId: number): Promise<boolean>;
  
  // Calendar Task methods
  getCalendarTasks(userId: number): Promise<CalendarTask[]>;
  createCalendarTask(calendarTask: InsertCalendarTask): Promise<CalendarTask>;
  deleteCalendarTask(calendarTaskId: number): Promise<boolean>;
  
  // Study Session methods
  getStudySessions(userId: number): Promise<StudySession[]>;
  getActiveStudySession(userId: number): Promise<StudySession | undefined>;
  createStudySession(studySession: InsertStudySession): Promise<StudySession>;
  updateStudySession(studySessionId: number, studySession: Partial<InsertStudySession>): Promise<StudySession | undefined>;
  deleteStudySession(studySessionId: number): Promise<boolean>;
  
  // User Settings methods
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createOrUpdateUserSettings(userSetting: InsertUserSettings): Promise<UserSettings>;
  
  // Test Record methods
  getTestRecords(userId: number): Promise<TestRecord[]>;
  getTestRecordById(testRecordId: number): Promise<TestRecord | undefined>;
  createTestRecord(testRecord: InsertTestRecord): Promise<TestRecord>;
  updateTestRecord(testRecordId: number, testRecord: Partial<InsertTestRecord>): Promise<TestRecord | undefined>;
  deleteTestRecord(testRecordId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      if (!email) {
        console.warn('getUserByEmail called with empty email');
        return undefined;
      }
      
      // Enhanced email normalization - more aggressive trimming and lowercase
      const normalizedEmail = email.toLowerCase().trim();
      
      // Simple direct query with better error handling
      const result = await db.select().from(users).where(eq(users.email, normalizedEmail));
      
      // Return first user or undefined
      return result.length > 0 ? result[0] : undefined;
    } catch (error: any) {
      // Enhanced error logging with more context
      console.error('Error in getUserByEmail:', error);
      
      // Check specifically for database connection issues or missing tables
      if (error.message?.includes('relation "users" does not exist') ||
          error.code === '42P01') {
        console.error('Users table does not exist - database setup required');
      } else if (error.code === 'ECONNREFUSED' || 
                error.code === 'ETIMEDOUT' || 
                (error.message && error.message.includes('connection'))) {
        console.error('Database connection error in getUserByEmail');
      }
      
      // Rethrow for proper handling up the chain
      throw error;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Basic email normalization
      const normalizedEmail = insertUser.email.trim().toLowerCase();
      
      // Create user with only fields defined in the schema
      const userToInsert = {
        email: normalizedEmail,
        password: insertUser.password,
        name: insertUser.name,
        targetJeeYear: insertUser.targetJeeYear
      };
      
      // Check if user already exists before trying to insert
      const existingUser = await this.getUserByEmail(normalizedEmail);
      if (existingUser) {
        const error = new Error(`User with email ${normalizedEmail} already exists`);
        error.name = 'DuplicateUserError';
        throw error;
      }
      
      // Simple reliable query with error handling
      const result = await db.insert(users).values(userToInsert).returning();
      
      if (!result || result.length === 0) {
        throw new Error('User creation failed - empty result');
      }
      
      console.log('User created successfully:', result[0].id);
      return result[0];
    } catch (error: any) {
      console.error('Error in createUser:', error);
      
      // Add more specific error types for better handling
      if (error.name === 'DuplicateUserError') {
        throw error;
      }
      
      // Database-specific duplicate key errors
      if (error.code === '23505' || // PostgreSQL unique violation
          (error.message && (
            error.message.includes('duplicate key') ||
            error.message.includes('UNIQUE constraint failed') ||
            error.message.includes('already exists')
          ))) {
        const duplicateError = new Error('Email already exists');
        duplicateError.name = 'DuplicateUserError';
        throw duplicateError;
      }
      
      // For database connection issues
      if (error.code === 'ECONNREFUSED' || 
          error.code === 'ETIMEDOUT' || 
          error.code === '08006' || 
          (error.message && error.message.includes('connection'))) {
        const connectionError = new Error('Database connection error, try again later');
        connectionError.name = 'DatabaseConnectionError';
        throw connectionError;
      }
      
      throw error;
    }
  }
  
  async updateUserResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    await db.update(users)
      .set({
        resetToken: token,
        resetTokenExpiry: expiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
  
  // Task methods
  async getTasks(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }
  
  async getTaskById(taskId: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    return task;
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }
  
  async updateTask(taskId: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db.update(tasks)
      .set(task)
      .where(eq(tasks.id, taskId))
      .returning();
    return updatedTask;
  }
  
  async deleteTask(taskId: number): Promise<boolean> {
    const [deleted] = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();
    return !!deleted;
  }
  
  // Subject methods
  async getSubjects(userId: number): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.userId, userId));
  }
  
  async getSubjectById(subjectId: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, subjectId));
    return subject;
  }
  
  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }
  
  async updateSubject(subjectId: number, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const [updatedSubject] = await db.update(subjects)
      .set(subject)
      .where(eq(subjects.id, subjectId))
      .returning();
    return updatedSubject;
  }
  
  async deleteSubject(subjectId: number): Promise<boolean> {
    const [deleted] = await db.delete(subjects).where(eq(subjects.id, subjectId)).returning();
    return !!deleted;
  }
  
  // Topic methods
  async getTopics(subjectId: number): Promise<Topic[]> {
    return await db.select().from(topics).where(eq(topics.subjectId, subjectId));
  }
  
  async createTopic(topic: InsertTopic): Promise<Topic> {
    const [newTopic] = await db.insert(topics).values(topic).returning();
    return newTopic;
  }
  
  async updateTopic(topicId: number, topic: Partial<InsertTopic>): Promise<Topic | undefined> {
    const [updatedTopic] = await db.update(topics)
      .set(topic)
      .where(eq(topics.id, topicId))
      .returning();
    return updatedTopic;
  }
  
  async deleteTopic(topicId: number): Promise<boolean> {
    const [deleted] = await db.delete(topics).where(eq(topics.id, topicId)).returning();
    return !!deleted;
  }
  
  // Goal methods
  async getGoals(userId: number): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
  }
  
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }
  
  async updateGoal(goalId: number, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updatedGoal] = await db.update(goals)
      .set(goal)
      .where(eq(goals.id, goalId))
      .returning();
    return updatedGoal;
  }
  
  async deleteGoal(goalId: number): Promise<boolean> {
    const [deleted] = await db.delete(goals).where(eq(goals.id, goalId)).returning();
    return !!deleted;
  }
  
  // Calendar Task methods
  async getCalendarTasks(userId: number): Promise<CalendarTask[]> {
    return await db.select().from(calendarTasks).where(eq(calendarTasks.userId, userId));
  }
  
  async createCalendarTask(calendarTask: InsertCalendarTask): Promise<CalendarTask> {
    const [newCalendarTask] = await db.insert(calendarTasks).values(calendarTask).returning();
    return newCalendarTask;
  }
  
  async deleteCalendarTask(calendarTaskId: number): Promise<boolean> {
    const [deleted] = await db.delete(calendarTasks).where(eq(calendarTasks.id, calendarTaskId)).returning();
    return !!deleted;
  }
  
  // Study Session methods
  async getStudySessions(userId: number): Promise<StudySession[]> {
    try {
      console.log(`Fetching study sessions for user ${userId}`);
      
      // Using Drizzle's standard query approach
      const sessions = await db.select().from(studySessions)
        .where(eq(studySessions.userId, userId))
        .orderBy(desc(studySessions.date), desc(studySessions.startTime));
      
      console.log(`Found ${sessions.length} study sessions for user ${userId}`);
      return sessions;
    } catch (error) {
      console.error('Error fetching study sessions:', error);
      // Return empty array rather than throwing to avoid breaking the UI
      return [];
    }
  }
  
  async getActiveStudySession(userId: number): Promise<StudySession | undefined> {
    try {
      console.log(`Looking for active study session for user ${userId}`);
      
      // Using Drizzle's query builder instead of raw SQL
      const [activeSession] = await db
        .select()
        .from(studySessions)
        .where(and(
          eq(studySessions.userId, userId),
          isNull(studySessions.endTime)
        ))
        .orderBy(desc(studySessions.startTime))
        .limit(1);
      
      if (activeSession) {
        console.log(`Found active session for user ${userId}:`, activeSession);
        return activeSession;
      } else {
        console.log(`No active session found for user ${userId}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error finding active study session:', error);
      return undefined;
    }
  }
  
  async createStudySession(studySession: InsertStudySession): Promise<StudySession> {
    try {
      // Prepare data for PostgreSQL with correct types
      const insertData = {
        userId: studySession.userId,
        taskName: studySession.taskName,
        subject: studySession.subject || 'General Study', // Add the subject field with a default
        
        // Handle timestamps correctly for Postgres - convert to proper Date objects
        startTime: typeof studySession.startTime === 'string'
          ? new Date(studySession.startTime)
          : studySession.startTime instanceof Date
            ? studySession.startTime
            : new Date(),
            
        endTime: studySession.endTime === null
          ? null
          : typeof studySession.endTime === 'string'
            ? new Date(studySession.endTime)
            : studySession.endTime instanceof Date
              ? studySession.endTime
              : null,
              
        duration: studySession.duration,
        
        date: typeof studySession.date === 'string'
          ? new Date(studySession.date)
          : studySession.date instanceof Date
            ? studySession.date
            : new Date(),
            
        mood: studySession.mood || null,
        energy: studySession.energy || null,
        notes: studySession.notes || null
      };
      
      console.log('Creating study session with data:', JSON.stringify(insertData, null, 2));
      
      // Fix: Use direct database insertion instead of ORM
      // This bypasses the type mapping issues between Drizzle's schema and actual database columns
      const query = `
        INSERT INTO study_sessions 
        (user_id, task_name, subject, start_time, end_time, duration, date, mood, energy, notes) 
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *
      `;
      
      const values = [
        insertData.userId,
        insertData.taskName,
        insertData.subject,
        insertData.startTime.toISOString(),
        insertData.endTime ? insertData.endTime.toISOString() : null,
        insertData.duration,
        insertData.date.toISOString().split('T')[0],
        insertData.mood,
        insertData.energy,
        insertData.notes
      ];
      
      const result = await pool.query(query, values);
      const newSession = result.rows[0];
      
      console.log('Study session created successfully:', JSON.stringify(newSession, null, 2));
      
      return newSession;
    } catch (error) {
      console.error('Error in createStudySession:', error);
      throw error;
    }
  }
  
  async updateStudySession(studySessionId: number, studySession: Partial<InsertStudySession>): Promise<StudySession | undefined> {
    try {
      // Build the update data object
      const updateData: any = {};
      
      // Only include fields that are present in the update request
      if (studySession.taskName !== undefined) {
        updateData.taskName = studySession.taskName;
      }
      
      if (studySession.userId !== undefined) {
        updateData.userId = studySession.userId;
      }
      
      if (studySession.duration !== undefined) {
        updateData.duration = studySession.duration;
      }
      
      // Handle startTime properly
      if (studySession.startTime !== undefined) {
        updateData.startTime = typeof studySession.startTime === 'string'
          ? new Date(studySession.startTime)
          : studySession.startTime instanceof Date
            ? studySession.startTime
            : null;
      }
      
      // Handle endTime properly
      if (studySession.endTime !== undefined) {
        updateData.endTime = studySession.endTime === null
          ? null
          : typeof studySession.endTime === 'string'
            ? new Date(studySession.endTime)
            : studySession.endTime instanceof Date
              ? studySession.endTime
              : null;
      }
      
      // Handle date properly
      if (studySession.date !== undefined) {
        updateData.date = typeof studySession.date === 'string'
          ? new Date(studySession.date)
          : studySession.date instanceof Date
            ? studySession.date
            : null;
      }
      
      if (studySession.mood !== undefined) {
        updateData.mood = studySession.mood;
      }
      
      if (studySession.energy !== undefined) {
        updateData.energy = studySession.energy;
      }
      
      if (studySession.notes !== undefined) {
        updateData.notes = studySession.notes;
      }
      
      // If no fields to update, return the existing record
      if (Object.keys(updateData).length === 0) {
        const [existingSession] = await db.select().from(studySessions).where(eq(studySessions.id, studySessionId));
        return existingSession;
      }
      
      console.log('Updating study session with data:', JSON.stringify(updateData, null, 2));
      
      // Use Drizzle's update API
      const [updatedSession] = await db.update(studySessions)
        .set(updateData)
        .where(eq(studySessions.id, studySessionId))
        .returning();
      
      console.log('Study session updated successfully:', JSON.stringify(updatedSession, null, 2));
      
      return updatedSession;
    } catch (error) {
      console.error('Error in updateStudySession:', error);
      throw error;
    }
  }
  
  async deleteStudySession(studySessionId: number): Promise<boolean> {
    const [deleted] = await db.delete(studySessions).where(eq(studySessions.id, studySessionId)).returning();
    return !!deleted;
  }
  
  // User Settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }
  
  async createOrUpdateUserSettings(setting: InsertUserSettings): Promise<UserSettings> {
    // Check if settings already exist
    const existingSettings = await this.getUserSettings(setting.userId);
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db.update(userSettings)
        .set({
          ...setting,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db.insert(userSettings).values(setting).returning();
      return newSettings;
    }
  }

  // Test Record methods
  async getTestRecords(userId: number): Promise<TestRecord[]> {
    try {
      return await db.query.testRecords.findMany({
        where: eq(testRecords.userId, userId),
        orderBy: [desc(testRecords.date)]
      });
    } catch (error) {
      console.error('Error fetching test records:', error);
      throw error;
    }
  }

  async getTestRecordById(testRecordId: number): Promise<TestRecord | undefined> {
    try {
      return await db.query.testRecords.findFirst({
        where: eq(testRecords.id, testRecordId),
      });
    } catch (error) {
      console.error(`Error fetching test record with ID ${testRecordId}:`, error);
      throw error;
    }
  }

  async createTestRecord(record: InsertTestRecord): Promise<TestRecord> {
    try {
      // Calculate performance based on marks percentage
      const marksPercentage = (record.marksObtained / record.marksTotal) * 100;
      let performance: typeof testPerformanceEnum.enumValues[number];
      
      if (marksPercentage >= 85) performance = 'excellent';
      else if (marksPercentage >= 70) performance = 'good';
      else if (marksPercentage >= 50) performance = 'average';
      else performance = 'poor';
      
      // Ensure date is properly handled
      const recordToInsert = {
        ...record,
        date: typeof record.date === 'string' ? record.date : record.date.toISOString().split('T')[0],
        performance
      };
      
      // Create test record with calculated performance
      const [newRecord] = await db
        .insert(testRecords)
        .values(recordToInsert)
        .returning();
      
      return newRecord;
    } catch (error) {
      console.error('Error creating test record:', error);
      throw error;
    }
  }
  
  async updateTestRecord(testRecordId: number, record: Partial<InsertTestRecord>): Promise<TestRecord | undefined> {
    try {
      // If marks are being updated, recalculate the performance
      if (record.marksObtained !== undefined || record.marksTotal !== undefined) {
        // Get current record to get the missing mark values if needed
        const currentRecord = await this.getTestRecordById(testRecordId);
        if (!currentRecord) return undefined;
        
        const obtainedMarks = record.marksObtained ?? currentRecord.marksObtained;
        const totalMarks = record.marksTotal ?? currentRecord.marksTotal;
        
        const marksPercentage = (obtainedMarks / totalMarks) * 100;
        let performance: typeof testPerformanceEnum.enumValues[number];
        
        if (marksPercentage >= 85) performance = 'excellent';
        else if (marksPercentage >= 70) performance = 'good';
        else if (marksPercentage >= 50) performance = 'average';
        else performance = 'poor';
        
        record.performance = performance;
      }
      
      // Create a clean update object that only contains DB-compatible types
      const updateObj: Record<string, any> = {};
      
      // Copy all properties except date to the update object
      Object.entries(record).forEach(([key, value]) => {
        if (key !== 'date') {
          updateObj[key] = value;
        }
      });
      
      // Handle date separately if it exists
      if (record.date) {
        updateObj.date = typeof record.date === 'string' 
          ? record.date 
          : record.date.toISOString().split('T')[0];
      }
      
      // Update the record
      const [updated] = await db
        .update(testRecords)
        .set(updateObj)
        .where(eq(testRecords.id, testRecordId))
        .returning();
      
      return updated;
    } catch (error) {
      console.error(`Error updating test record with ID ${testRecordId}:`, error);
      throw error;
    }
  }
  
  async deleteTestRecord(testRecordId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(testRecords)
        .where(eq(testRecords.id, testRecordId))
        .returning({ id: testRecords.id });
      
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting test record with ID ${testRecordId}:`, error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
