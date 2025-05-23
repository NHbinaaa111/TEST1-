import { pgTable, text, serial, integer, boolean, timestamp, date, json, real, pgEnum, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const colorEnum = pgEnum('color', ['blue', 'green', 'purple', 'red']);
export const themeEnum = pgEnum('theme', ['dark', 'light', 'system']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'completed']);
export const goalTypeEnum = pgEnum('goal_type', ['weekly', 'monthly']);
export const moodEnum = pgEnum('mood', ['terrible', 'bad', 'neutral', 'good', 'excellent']);
export const energyEnum = pgEnum('energy', ['exhausted', 'tired', 'normal', 'energized', 'supercharged']);
export const testPerformanceEnum = pgEnum('test_performance', ['excellent', 'good', 'average', 'poor']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  targetJeeYear: text("target_jee_year"),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  completed: boolean("completed").default(false).notNull(),
  date: date("date").notNull(),
  subject: text("subject"),
  subjectColor: colorEnum("subject_color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tasks relations
export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

// Subjects table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  progress: real("progress").default(0).notNull(),
  color: colorEnum("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subjects relations
export const subjectsRelations = relations(subjects, ({ one }) => ({
  user: one(users, {
    fields: [subjects.userId],
    references: [users.id],
  }),
}));

// Topics table
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Topics relations
export const topicsRelations = relations(topics, ({ one }) => ({
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
}));

// Goals table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  completed: boolean("completed").default(false).notNull(),
  deadline: date("deadline").notNull(),
  type: goalTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Goals relations
export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

// Calendar Tasks table
export const calendarTasks = pgTable("calendar_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date("date").notNull(),
  subject: text("subject").notNull(),
  subjectColor: colorEnum("subject_color").notNull(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar Tasks relations
export const calendarTasksRelations = relations(calendarTasks, ({ one }) => ({
  user: one(users, {
    fields: [calendarTasks.userId],
    references: [users.id],
  }),
}));

// Study Sessions table
export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  taskName: text("task_name").notNull(),
  subject: text("subject").default("General Study"), // Add subject field for tracking by subject
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration").notNull(), // in seconds
  date: date("date").notNull(),
  mood: moodEnum("mood"),
  energy: energyEnum("energy"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Study Sessions relations
export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, {
    fields: [studySessions.userId],
    references: [users.id],
  }),
}));

// User Settings table
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  theme: themeEnum("theme").default('system').notNull(),
  accentColor: colorEnum("accent_color").default('blue').notNull(),
  enableAnimations: boolean("enable_animations").default(true).notNull(),
  studyHoursGoal: integer("study_hours_goal").default(35).notNull(), // weekly goal in hours
  pomodoroWorkTime: integer("pomodoro_work_time").default(25).notNull(), // in minutes
  pomodoroBreakTime: integer("pomodoro_break_time").default(5).notNull(), // in minutes
  pomodoroLongBreakTime: integer("pomodoro_long_break_time").default(15).notNull(), // in minutes
  pomodoroCycles: integer("pomodoro_cycles").default(4).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: uniqueIndex("user_settings_user_id_idx").on(table.userId),
  };
});

// User Settings relations
export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Test Records table
export const testRecords = pgTable("test_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  date: date("date").notNull(),
  subject: text("subject").notNull(),
  subTopic: text("sub_topic"),
  marksObtained: integer("marks_obtained").notNull(),
  marksTotal: integer("marks_total").notNull(),
  performance: testPerformanceEnum("performance").notNull(),
  areasToImprove: text("areas_to_improve").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Test Records relations
export const testRecordsRelations = relations(testRecords, ({ one }) => ({
  user: one(users, {
    fields: [testRecords.userId],
    references: [users.id],
  }),
}));

// Schema exports for frontend validation
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  targetJeeYear: true,
});

export const insertTestRecordSchema = createInsertSchema(testRecords).pick({
  userId: true,
  name: true,
  date: true,
  subject: true,
  subTopic: true,
  marksObtained: true,
  marksTotal: true,
  performance: true,
  areasToImprove: true,
  notes: true,
}).extend({
  // Allow string for date field
  date: z.string().or(z.date()),
  // Make userId either string or number (will be converted to number)
  userId: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  // Allow numbers as strings for marks
  marksObtained: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ),
  marksTotal: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ),
  // Allow string array for areas to improve
  areasToImprove: z.array(z.string()).optional(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  userId: true,
  title: true,
  completed: true,
  date: true,
  subject: true,
  subjectColor: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  userId: true,
  name: true,
  progress: true,
  color: true,
});

export const insertTopicSchema = createInsertSchema(topics).pick({
  subjectId: true,
  name: true,
  completed: true,
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  userId: true,
  title: true,
  completed: true,
  deadline: true,
  type: true,
});

export const insertCalendarTaskSchema = createInsertSchema(calendarTasks).pick({
  userId: true,
  date: true,
  subject: true,
  subjectColor: true,
  title: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions)
  .pick({
    userId: true,
    taskName: true,
    subject: true,
    startTime: true,
    endTime: true,
    duration: true,
    date: true,
    mood: true,
    energy: true,
    notes: true,
  })
  .extend({
    // Allow ISO string for these timestamp fields
    startTime: z.string().or(z.date()),
    endTime: z.string().or(z.date()).nullable(),
    // Allow string for date field
    date: z.string().or(z.date()),
    // Make subject required with a default value
    subject: z.string().default("General Study"),
  });

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  userId: true,
  theme: true,
  accentColor: true,
  enableAnimations: true,
  studyHoursGoal: true,
  pomodoroWorkTime: true,
  pomodoroBreakTime: true,
  pomodoroLongBreakTime: true,
  pomodoroCycles: true,
}).extend({
  // Allow userId to be either a string or a number (will be converted to number)
  userId: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

// Subjects-Topics relations (defined after all tables are created)
export const subjectsTopicsRelations = relations(subjects, ({ many }) => ({
  topics: many(topics),
}));

// User relations with all other tables
export const usersAllRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  studySessions: many(studySessions),
  subjects: many(subjects),
  goals: many(goals),
  calendarTasks: many(calendarTasks),
  settings: many(userSettings),
  testRecords: many(testRecords),
}));

// Types for use in application
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

export type InsertCalendarTask = z.infer<typeof insertCalendarTaskSchema>;
export type CalendarTask = typeof calendarTasks.$inferSelect;

export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessions.$inferSelect;

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

export type InsertTestRecord = z.infer<typeof insertTestRecordSchema>;
export type TestRecord = typeof testRecords.$inferSelect;
