import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertTaskSchema, 
  insertSubjectSchema,
  insertTopicSchema,
  insertGoalSchema,
  insertCalendarTaskSchema,
  insertStudySessionSchema,
  insertUserSettingsSchema,
  insertTestRecordSchema,
  moodEnum,
  energyEnum,
  testPerformanceEnum,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Helper function to validate request body against schema
const validateBody = <T extends z.ZodType>(schema: T, body: unknown): z.infer<T> | null => {
  try {
    return schema.parse(body);
  } catch (error) {
    console.error("Validation error:", error);
    return null;
  }
};

export async function registerRoutes(app: Express, requireAuth?: any): Promise<Server> {
  // Auth routes are now handled in auth.ts

  // User routes
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  
  // Update user
  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Get existing user to make sure it exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Only allow updating certain fields
      const { name, email, targetJeeYear } = req.body;
      const updateData: Record<string, any> = {};
      
      // Only add fields that are provided
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      
      // Store targetJeeYear in session if provided
      if (targetJeeYear !== undefined && req.session) {
        req.session.targetJeeYear = targetJeeYear;
      }
      
      // Update user in database
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
        
      // Get the updated user
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to get updated user" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      // Include targetJeeYear from session or request
      const responseTargetJeeYear = req.session?.targetJeeYear || targetJeeYear;
      
      res.status(200).json({
        ...userWithoutPassword,
        targetJeeYear: responseTargetJeeYear
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Task routes
  app.get("/api/users/:userId/tasks", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const tasks = await storage.getTasks(userId);
      res.status(200).json(tasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ error: "Failed to get tasks" });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const taskData = validateBody(insertTaskSchema, req.body);
      if (!taskData) {
        return res.status(400).json({ error: "Invalid task data" });
      }

      const newTask = await storage.createTask(taskData);
      res.status(201).json(newTask);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      const taskData = req.body;
      const updatedTask = await storage.updateTask(taskId, taskData);
      
      if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.status(200).json(updatedTask);
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      const deleted = await storage.deleteTask(taskId);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Subject routes
  app.get("/api/users/:userId/subjects", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const subjects = await storage.getSubjects(userId);
      res.status(200).json(subjects);
    } catch (error) {
      console.error("Get subjects error:", error);
      res.status(500).json({ error: "Failed to get subjects" });
    }
  });

  app.post("/api/subjects", async (req: Request, res: Response) => {
    try {
      const subjectData = validateBody(insertSubjectSchema, req.body);
      if (!subjectData) {
        return res.status(400).json({ error: "Invalid subject data" });
      }

      const newSubject = await storage.createSubject(subjectData);
      res.status(201).json(newSubject);
    } catch (error) {
      console.error("Create subject error:", error);
      res.status(500).json({ error: "Failed to create subject" });
    }
  });

  app.patch("/api/subjects/:id", async (req: Request, res: Response) => {
    try {
      const subjectId = parseInt(req.params.id);
      if (isNaN(subjectId)) {
        return res.status(400).json({ error: "Invalid subject ID" });
      }

      const subjectData = req.body;
      const updatedSubject = await storage.updateSubject(subjectId, subjectData);
      
      if (!updatedSubject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      
      res.status(200).json(updatedSubject);
    } catch (error) {
      console.error("Update subject error:", error);
      res.status(500).json({ error: "Failed to update subject" });
    }
  });

  app.delete("/api/subjects/:id", async (req: Request, res: Response) => {
    try {
      const subjectId = parseInt(req.params.id);
      if (isNaN(subjectId)) {
        return res.status(400).json({ error: "Invalid subject ID" });
      }

      const deleted = await storage.deleteSubject(subjectId);
      if (!deleted) {
        return res.status(404).json({ error: "Subject not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete subject error:", error);
      res.status(500).json({ error: "Failed to delete subject" });
    }
  });

  // Topic routes
  app.get("/api/subjects/:subjectId/topics", async (req: Request, res: Response) => {
    try {
      const subjectId = parseInt(req.params.subjectId);
      if (isNaN(subjectId)) {
        return res.status(400).json({ error: "Invalid subject ID" });
      }

      const topics = await storage.getTopics(subjectId);
      res.status(200).json(topics);
    } catch (error) {
      console.error("Get topics error:", error);
      res.status(500).json({ error: "Failed to get topics" });
    }
  });

  app.post("/api/topics", async (req: Request, res: Response) => {
    try {
      const topicData = validateBody(insertTopicSchema, req.body);
      if (!topicData) {
        return res.status(400).json({ error: "Invalid topic data" });
      }

      const newTopic = await storage.createTopic(topicData);
      res.status(201).json(newTopic);
    } catch (error) {
      console.error("Create topic error:", error);
      res.status(500).json({ error: "Failed to create topic" });
    }
  });

  app.patch("/api/topics/:id", async (req: Request, res: Response) => {
    try {
      const topicId = parseInt(req.params.id);
      if (isNaN(topicId)) {
        return res.status(400).json({ error: "Invalid topic ID" });
      }

      const topicData = req.body;
      const updatedTopic = await storage.updateTopic(topicId, topicData);
      
      if (!updatedTopic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      
      res.status(200).json(updatedTopic);
    } catch (error) {
      console.error("Update topic error:", error);
      res.status(500).json({ error: "Failed to update topic" });
    }
  });

  app.delete("/api/topics/:id", async (req: Request, res: Response) => {
    try {
      const topicId = parseInt(req.params.id);
      if (isNaN(topicId)) {
        return res.status(400).json({ error: "Invalid topic ID" });
      }

      const deleted = await storage.deleteTopic(topicId);
      if (!deleted) {
        return res.status(404).json({ error: "Topic not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete topic error:", error);
      res.status(500).json({ error: "Failed to delete topic" });
    }
  });

  // Goal routes
  app.get("/api/users/:userId/goals", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const goals = await storage.getGoals(userId);
      res.status(200).json(goals);
    } catch (error) {
      console.error("Get goals error:", error);
      res.status(500).json({ error: "Failed to get goals" });
    }
  });

  app.post("/api/goals", async (req: Request, res: Response) => {
    try {
      const goalData = validateBody(insertGoalSchema, req.body);
      if (!goalData) {
        return res.status(400).json({ error: "Invalid goal data" });
      }

      const newGoal = await storage.createGoal(goalData);
      res.status(201).json(newGoal);
    } catch (error) {
      console.error("Create goal error:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", async (req: Request, res: Response) => {
    try {
      const goalId = parseInt(req.params.id);
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }

      const goalData = req.body;
      const updatedGoal = await storage.updateGoal(goalId, goalData);
      
      if (!updatedGoal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      res.status(200).json(updatedGoal);
    } catch (error) {
      console.error("Update goal error:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", async (req: Request, res: Response) => {
    try {
      const goalId = parseInt(req.params.id);
      if (isNaN(goalId)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }

      const deleted = await storage.deleteGoal(goalId);
      if (!deleted) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete goal error:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Calendar Task routes
  app.get("/api/users/:userId/calendar-tasks", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const calendarTasks = await storage.getCalendarTasks(userId);
      res.status(200).json(calendarTasks);
    } catch (error) {
      console.error("Get calendar tasks error:", error);
      res.status(500).json({ error: "Failed to get calendar tasks" });
    }
  });

  app.post("/api/calendar-tasks", async (req: Request, res: Response) => {
    try {
      const calendarTaskData = validateBody(insertCalendarTaskSchema, req.body);
      if (!calendarTaskData) {
        return res.status(400).json({ error: "Invalid calendar task data" });
      }

      const newCalendarTask = await storage.createCalendarTask(calendarTaskData);
      res.status(201).json(newCalendarTask);
    } catch (error) {
      console.error("Create calendar task error:", error);
      res.status(500).json({ error: "Failed to create calendar task" });
    }
  });

  app.delete("/api/calendar-tasks/:id", async (req: Request, res: Response) => {
    try {
      const calendarTaskId = parseInt(req.params.id);
      if (isNaN(calendarTaskId)) {
        return res.status(400).json({ error: "Invalid calendar task ID" });
      }

      const deleted = await storage.deleteCalendarTask(calendarTaskId);
      if (!deleted) {
        return res.status(404).json({ error: "Calendar task not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete calendar task error:", error);
      res.status(500).json({ error: "Failed to delete calendar task" });
    }
  });

  // Study Session routes
  app.get("/api/users/:userId/study-sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Check if user is accessing their own data
      const authUser = req.user as any;
      if (authUser && authUser.id !== userId) {
        return res.status(403).json({ error: "Not authorized to access this user's study sessions" });
      }

      const studySessions = await storage.getStudySessions(userId);
      res.status(200).json(studySessions);
    } catch (error) {
      console.error("Get study sessions error:", error);
      res.status(500).json({ error: "Failed to get study sessions" });
    }
  });

  app.get("/api/users/:userId/active-study-session", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Check if user is accessing their own data
      const authUser = req.user as any;
      if (authUser && authUser.id !== userId) {
        return res.status(403).json({ error: "Not authorized to access this user's active study session" });
      }

      const activeSession = await storage.getActiveStudySession(userId);
      if (!activeSession) {
        return res.status(404).json({ error: "No active study session" });
      }
      
      res.status(200).json(activeSession);
    } catch (error) {
      console.error("Get active study session error:", error);
      res.status(500).json({ error: "Failed to get active study session" });
    }
  });

  app.post("/api/study-sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("Study session creation request:", req.body);
      
      const studySessionData = validateBody(insertStudySessionSchema, req.body);
      if (!studySessionData) {
        console.error("Invalid study session data:", req.body);
        return res.status(400).json({ error: "Invalid study session data" });
      }

      console.log("Validated study session data:", studySessionData);
      
      // Ensure subject is included (use fallback if missing)
      if (!studySessionData.subject) {
        studySessionData.subject = "General Study";
      }
      
      const newStudySession = await storage.createStudySession(studySessionData);
      console.log("Study session created successfully:", newStudySession);
      res.status(201).json(newStudySession);
    } catch (error) {
      console.error("Create study session error:", error);
      res.status(500).json({ error: "Failed to create study session" });
    }
  });

  app.patch("/api/study-sessions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const studySessionId = parseInt(req.params.id);
      if (isNaN(studySessionId)) {
        return res.status(400).json({ error: "Invalid study session ID" });
      }

      const studySessionData = req.body;
      
      // Validate mood and energy if provided
      if (studySessionData.mood && !Object.values(moodEnum.enumValues).includes(studySessionData.mood)) {
        return res.status(400).json({ error: "Invalid mood value" });
      }
      
      if (studySessionData.energy && !Object.values(energyEnum.enumValues).includes(studySessionData.energy)) {
        return res.status(400).json({ error: "Invalid energy value" });
      }
      
      const updatedStudySession = await storage.updateStudySession(studySessionId, studySessionData);
      
      if (!updatedStudySession) {
        return res.status(404).json({ error: "Study session not found" });
      }
      
      res.status(200).json(updatedStudySession);
    } catch (error) {
      console.error("Update study session error:", error);
      res.status(500).json({ error: "Failed to update study session" });
    }
  });

  app.delete("/api/study-sessions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const studySessionId = parseInt(req.params.id);
      if (isNaN(studySessionId)) {
        return res.status(400).json({ error: "Invalid study session ID" });
      }

      const deleted = await storage.deleteStudySession(studySessionId);
      if (!deleted) {
        return res.status(404).json({ error: "Study session not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete study session error:", error);
      res.status(500).json({ error: "Failed to delete study session" });
    }
  });

  // User Settings routes
  app.get("/api/users/:userId/settings", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const settings = await storage.getUserSettings(userId);
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      
      res.status(200).json(settings);
    } catch (error) {
      console.error("Get user settings error:", error);
      res.status(500).json({ error: "Failed to get user settings" });
    }
  });

  app.post("/api/user-settings", async (req: Request, res: Response) => {
    try {
      const settingsData = validateBody(insertUserSettingsSchema, req.body);
      if (!settingsData) {
        return res.status(400).json({ error: "Invalid settings data" });
      }

      const settings = await storage.createOrUpdateUserSettings(settingsData);
      res.status(200).json(settings);
    } catch (error) {
      console.error("Create/update user settings error:", error);
      res.status(500).json({ error: "Failed to create/update user settings" });
    }
  });

  // Test Records routes
  app.get("/api/users/:userId/test-records", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const testRecords = await storage.getTestRecords(userId);
      res.json(testRecords);
    } catch (error) {
      console.error("Get test records error:", error);
      res.status(500).json({ error: "Failed to get test records" });
    }
  });
  
  app.get("/api/test-records/:id", async (req: Request, res: Response) => {
    try {
      const testRecordId = parseInt(req.params.id);
      if (isNaN(testRecordId)) {
        return res.status(400).json({ error: "Invalid test record ID" });
      }
      
      const testRecord = await storage.getTestRecordById(testRecordId);
      if (!testRecord) {
        return res.status(404).json({ error: "Test record not found" });
      }
      
      res.json(testRecord);
    } catch (error) {
      console.error("Get test record error:", error);
      res.status(500).json({ error: "Failed to get test record" });
    }
  });
  
  app.post("/api/test-records", async (req: Request, res: Response) => {
    try {
      console.log("Received test record data:", req.body);
      
      // Validate the request body with more detailed error handling
      try {
        const testRecordData = validateBody(insertTestRecordSchema, req.body);
        if (!testRecordData) {
          return res.status(400).json({ 
            error: "Invalid test record data",
            message: "Please check all required fields are present and correctly formatted" 
          });
        }
        
        console.log("Validated test record data:", testRecordData);
        
        // Ensure userId is a number
        if (typeof testRecordData.userId === 'string') {
          testRecordData.userId = parseInt(testRecordData.userId, 10);
        }
        
        // Create the test record
        const testRecord = await storage.createTestRecord(testRecordData);
        console.log("Successfully created test record:", testRecord);
        
        res.status(201).json(testRecord);
      } catch (validationError: any) {
        console.error("Test record validation error:", validationError);
        return res.status(400).json({ 
          error: "Invalid test record data", 
          details: validationError.message || "Validation failed" 
        });
      }
    } catch (error: any) {
      console.error("Create test record error:", error);
      res.status(500).json({ 
        error: "Failed to create test record",
        message: error.message || "An unexpected error occurred"
      });
    }
  });
  
  app.patch("/api/test-records/:id", async (req: Request, res: Response) => {
    try {
      const testRecordId = parseInt(req.params.id);
      if (isNaN(testRecordId)) {
        return res.status(400).json({ error: "Invalid test record ID" });
      }
      
      const testRecordData = validateBody(insertTestRecordSchema.partial(), req.body);
      if (!testRecordData) {
        return res.status(400).json({ error: "Invalid test record data" });
      }
      
      const updatedTestRecord = await storage.updateTestRecord(testRecordId, testRecordData);
      if (!updatedTestRecord) {
        return res.status(404).json({ error: "Test record not found" });
      }
      
      res.json(updatedTestRecord);
    } catch (error) {
      console.error("Update test record error:", error);
      res.status(500).json({ error: "Failed to update test record" });
    }
  });
  
  app.delete("/api/test-records/:id", async (req: Request, res: Response) => {
    try {
      const testRecordId = parseInt(req.params.id);
      if (isNaN(testRecordId)) {
        return res.status(400).json({ error: "Invalid test record ID" });
      }
      
      const success = await storage.deleteTestRecord(testRecordId);
      if (!success) {
        return res.status(404).json({ error: "Test record not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Delete test record error:", error);
      res.status(500).json({ error: "Failed to delete test record" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
