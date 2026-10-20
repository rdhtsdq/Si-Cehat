import {
  pgTable,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const uuidDefault = () => crypto.randomUUID();

export const posyandus = pgTable("Posyandu", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  rw: text("rw"),
  rt: text("rt"),
  kelurahan: text("kelurahan"),
  kecamatan: text("kecamatan"),
  city: text("city").default("Jakarta Selatan"),
  address: text("address"),
  contactPhone: text("contactPhone"),
  leaderName: text("leaderName"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const guardians = pgTable("Guardian", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  posyanduId: text("posyanduId").references(() => posyandus.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  name: text("name"),
  phone: text("phone"),
  education: text("education"),
  occupation: text("occupation"),
  address: text("address"),
  role: text("role").notNull().default("GUARDIAN"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const children = pgTable("Child", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  posyanduId: text("posyanduId").references(() => posyandus.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  guardianId: text("guardianId")
    .notNull()
    .references(() => guardians.id, { onDelete: "restrict", onUpdate: "cascade" }),
  name: text("name").notNull(),
  birthDate: timestamp("birthDate", { mode: "date" }),
  gender: text("gender"),
  healthHistory: text("healthHistory"),
  avatarPreference: text("avatarPreference"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const dailyProgresses = pgTable("DailyProgress", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  childId: text("childId")
    .notNull()
    .references(() => children.id, { onDelete: "restrict", onUpdate: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull(),
  waterGlasses: integer("waterGlasses").notNull().default(0),
  activityMinutes: integer("activityMinutes").notNull().default(0),
  xpEarned: integer("xpEarned").notNull().default(0),
  streak: integer("streak").notNull().default(0),
});

export const foodLogs = pgTable("FoodLog", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  childId: text("childId")
    .notNull()
    .references(() => children.id, { onDelete: "restrict", onUpdate: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull(),
  name: text("name").notNull(),
  tone: text("tone").notNull(),
});

export const detailedFoodLogs = pgTable("DetailedFoodLog", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  childId: text("childId")
    .notNull()
    .references(() => children.id, { onDelete: "restrict", onUpdate: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull(),
  mealSlot: text("mealSlot").notNull(),
  foodName: text("foodName").notNull(),
  portion: text("portion").notNull().default("1 porsi sedang"),
  caloriesKkal: integer("caloriesKkal"),
  carbsGram: doublePrecision("carbsGram"),
  proteinGram: doublePrecision("proteinGram"),
  fatGram: doublePrecision("fatGram"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const growthMeasurements = pgTable("GrowthMeasurement", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  childId: text("childId")
    .notNull()
    .references(() => children.id, { onDelete: "restrict", onUpdate: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull(),
  weightKg: doublePrecision("weightKg").notNull(),
  heightCm: doublePrecision("heightCm").notNull(),
  bmi: doublePrecision("bmi"),
  nutritionalStatus: text("nutritionalStatus"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const activityLogs = pgTable("ActivityLog", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  childId: text("childId")
    .notNull()
    .references(() => children.id, { onDelete: "restrict", onUpdate: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull(),
  title: text("title").notNull(),
  category: text("category").notNull().default("Aktivitas Fisik"),
  durationMinutes: integer("durationMinutes").notNull().default(0),
  intensity: text("intensity").default("Sedang"),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const screeningRecords = pgTable("ScreeningRecord", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  childId: text("childId")
    .notNull()
    .references(() => children.id, { onDelete: "restrict", onUpdate: "cascade" }),
  guardianId: text("guardianId")
    .notNull()
    .references(() => guardians.id, { onDelete: "restrict", onUpdate: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull().defaultNow(),
  ageYears: integer("ageYears").notNull(),
  weightKg: doublePrecision("weightKg").notNull(),
  heightCm: doublePrecision("heightCm").notNull(),
  familyHistory: boolean("familyHistory").notNull().default(false),
  sweetDrinkFrequency: text("sweetDrinkFrequency").notNull().default("kadang"),
  physicalActivityHours: doublePrecision("physicalActivityHours").notNull().default(1.0),
  riskScore: integer("riskScore").notNull(),
  riskCategory: text("riskCategory").notNull(),
  recommendations: text("recommendations").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const reminders = pgTable("Reminder", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  guardianId: text("guardianId")
    .notNull()
    .references(() => guardians.id, { onDelete: "restrict", onUpdate: "cascade" }),
  childId: text("childId").references(() => children.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  title: text("title").notNull(),
  time: text("time").notNull(),
  category: text("category").notNull().default("umum"),
  isEnabled: boolean("isEnabled").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const recipes = pgTable("Recipe", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  title: text("title").notNull(),
  category: text("category").notNull().default("makanan"),
  description: text("description").notNull(),
  caloriesKkal: integer("caloriesKkal").notNull().default(150),
  carbsGram: doublePrecision("carbsGram").notNull().default(20),
  proteinGram: doublePrecision("proteinGram").notNull().default(8),
  fatGram: doublePrecision("fatGram").notNull().default(4),
  fiberGram: doublePrecision("fiberGram").notNull().default(4),
  sugarGram: doublePrecision("sugarGram").notNull().default(2),
  ingredients: text("ingredients").notNull(),
  instructions: text("instructions").notNull(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const educationArticles = pgTable("EducationArticle", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull().default("artikel"),
  readTimeMinutes: integer("readTimeMinutes").notNull().default(3),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  mediaType: text("mediaType").notNull().default("none"),
  videoUrl: text("videoUrl"),
  audioUrl: text("audioUrl"),
  speakerOrSource: text("speakerOrSource").default("Kemenkes RI & IDAI"),
  imageUrl: text("imageUrl"),
  publishedAt: timestamp("publishedAt", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const consultations = pgTable("Consultation", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  guardianId: text("guardianId")
    .notNull()
    .references(() => guardians.id, { onDelete: "restrict", onUpdate: "cascade" }),
  specialistType: text("specialistType").notNull(),
  specialistName: text("specialistName").notNull(),
  status: text("status").notNull().default("PENDING"),
  topic: text("topic").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const chatSessions = pgTable("ChatSession", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  childId: text("childId")
    .notNull()
    .references(() => children.id, { onDelete: "restrict", onUpdate: "cascade" }),
  startedAt: timestamp("startedAt", { mode: "date" }).notNull().defaultNow(),
});

export const chatMessages = pgTable("ChatMessage", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  sessionId: text("sessionId")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "restrict", onUpdate: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const challenges = pgTable("Challenge", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  title: text("title").notNull(),
  description: text("description").notNull(),
  xp: integer("xp").notNull().default(30),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const quizzes = pgTable("Quiz", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  question: text("question").notNull(),
  options: text("options").notNull(),
  answer: text("answer").notNull(),
  xp: integer("xp").notNull().default(20),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const recommendedMenus = pgTable("RecommendedMenu", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  title: text("title").notNull(),
  note: text("note").notNull(),
  orderIndex: integer("orderIndex").notNull().default(0),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const botConfigs = pgTable("BotConfig", {
  id: text("id").primaryKey().default("default"),
  provider: text("provider").notNull().default("openai"),
  model: text("model").notNull().default("gpt-4o-mini"),
  baseUrl: text("baseUrl"),
  apiKey: text("apiKey"),
  systemPrompt: text("systemPrompt").notNull(),
  temperature: doublePrecision("temperature").notNull().default(0.5),
  maxTokens: integer("maxTokens").notNull().default(300),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Relations
export const posyandusRelations = relations(posyandus, ({ many }) => ({
  guardians: many(guardians),
  children: many(children),
}));

export const guardiansRelations = relations(guardians, ({ one, many }) => ({
  posyandu: one(posyandus, {
    fields: [guardians.posyanduId],
    references: [posyandus.id],
  }),
  children: many(children),
  reminders: many(reminders),
  screenings: many(screeningRecords),
  consultations: many(consultations),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  posyandu: one(posyandus, {
    fields: [children.posyanduId],
    references: [posyandus.id],
  }),
  guardian: one(guardians, {
    fields: [children.guardianId],
    references: [guardians.id],
  }),
  dailyProgresses: many(dailyProgresses),
  foodLogs: many(foodLogs),
  detailedFoodLogs: many(detailedFoodLogs),
  growthMeasurements: many(growthMeasurements),
  screenings: many(screeningRecords),
  chatSessions: many(chatSessions),
  reminders: many(reminders),
  activityLogs: many(activityLogs),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  child: one(children, {
    fields: [activityLogs.childId],
    references: [children.id],
  }),
}));

export const dailyProgressesRelations = relations(dailyProgresses, ({ one }) => ({
  child: one(children, {
    fields: [dailyProgresses.childId],
    references: [children.id],
  }),
}));

export const foodLogsRelations = relations(foodLogs, ({ one }) => ({
  child: one(children, {
    fields: [foodLogs.childId],
    references: [children.id],
  }),
}));

export const detailedFoodLogsRelations = relations(detailedFoodLogs, ({ one }) => ({
  child: one(children, {
    fields: [detailedFoodLogs.childId],
    references: [children.id],
  }),
}));

export const growthMeasurementsRelations = relations(growthMeasurements, ({ one }) => ({
  child: one(children, {
    fields: [growthMeasurements.childId],
    references: [children.id],
  }),
}));

export const screeningRecordsRelations = relations(screeningRecords, ({ one }) => ({
  child: one(children, {
    fields: [screeningRecords.childId],
    references: [children.id],
  }),
  guardian: one(guardians, {
    fields: [screeningRecords.guardianId],
    references: [guardians.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  guardian: one(guardians, {
    fields: [reminders.guardianId],
    references: [guardians.id],
  }),
  child: one(children, {
    fields: [reminders.childId],
    references: [children.id],
  }),
}));

export const consultationsRelations = relations(consultations, ({ one }) => ({
  guardian: one(guardians, {
    fields: [consultations.guardianId],
    references: [guardians.id],
  }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  child: one(children, {
    fields: [chatSessions.childId],
    references: [children.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

// ==========================================
// SI-CEHAT PLAYLAB (WEB GAME & RESEARCH)
// ==========================================

export const gameDefinitions = pgTable("GameDefinition", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  competency: text("competency").notNull(),
  currentVersion: text("currentVersion").notNull().default("1.0.0"),
  targetAgeRange: text("targetAgeRange").notNull().default("6-12"),
  isPublished: boolean("isPublished").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const gameSessions = pgTable("GameSession", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  gameId: text("gameId").references(() => gameDefinitions.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  gameSlug: text("gameSlug").notNull().default("piring-sehat-nimbo"),
  gameVersion: text("gameVersion").notNull().default("1.0.0"),
  guardianId: text("guardianId").references(() => guardians.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  childId: text("childId").references(() => children.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  studyId: text("studyId").default("si-cehat-playlab-eval-2026"),
  participantCode: text("participantCode"),
  status: text("status").notNull().default("IN_PROGRESS"), // IN_PROGRESS, COMPLETED, ABANDONED
  startedAt: timestamp("startedAt", { mode: "date" }).notNull().defaultNow(),
  completedAt: timestamp("completedAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const gameEvents = pgTable("GameEvent", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  sessionId: text("sessionId")
    .notNull()
    .references(() => gameSessions.id, { onDelete: "cascade", onUpdate: "cascade" }),
  eventType: text("eventType").notNull(), // GAME_START, ITEM_SELECTED, ITEM_PLACED, ITEM_REMOVED, PLATE_CHECKED, KNOWLEDGE_ANSWERED
  sequence: integer("sequence").notNull().default(0),
  payload: text("payload").notNull().default("{}"), // JSON stringified
  occurredAt: timestamp("occurredAt", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const gameResults = pgTable("GameResult", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  sessionId: text("sessionId")
    .notNull()
    .unique()
    .references(() => gameSessions.id, { onDelete: "cascade", onUpdate: "cascade" }),
  gameplayScore: integer("gameplayScore").notNull().default(0),
  knowledgeScore: integer("knowledgeScore").notNull().default(0),
  totalScore: integer("totalScore").notNull().default(0),
  starsEarned: integer("starsEarned").notNull().default(1),
  plateComposition: text("plateComposition").notNull().default("{}"), // JSON stringified
  feedbackSummary: text("feedbackSummary").notNull().default(""),
  rulesVersion: text("rulesVersion").notNull().default("1.0.0"),
  xpAwarded: integer("xpAwarded").notNull().default(50),
  finalizedAt: timestamp("finalizedAt", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const assessmentAttempts = pgTable("AssessmentAttempt", {
  id: text("id").primaryKey().$defaultFn(uuidDefault),
  guardianId: text("guardianId").references(() => guardians.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  childId: text("childId").references(() => children.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  studyId: text("studyId").notNull().default("si-cehat-playlab-eval-2026"),
  participantCode: text("participantCode"),
  assessmentType: text("assessmentType").notNull().default("PRE_TEST"), // PRE_TEST, POST_TEST, FOLLOW_UP
  instrumentVersion: text("instrumentVersion").notNull().default("1.0.0"),
  score: integer("score").notNull().default(0),
  maxScore: integer("maxScore").notNull().default(100),
  answers: text("answers").notNull().default("[]"), // JSON stringified array
  completedAt: timestamp("completedAt", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  game: one(gameDefinitions, {
    fields: [gameSessions.gameId],
    references: [gameDefinitions.id],
  }),
  guardian: one(guardians, {
    fields: [gameSessions.guardianId],
    references: [guardians.id],
  }),
  child: one(children, {
    fields: [gameSessions.childId],
    references: [children.id],
  }),
  events: many(gameEvents),
  result: one(gameResults, {
    fields: [gameSessions.id],
    references: [gameResults.sessionId],
  }),
}));

export const gameEventsRelations = relations(gameEvents, ({ one }) => ({
  session: one(gameSessions, {
    fields: [gameEvents.sessionId],
    references: [gameSessions.id],
  }),
}));

export const gameResultsRelations = relations(gameResults, ({ one }) => ({
  session: one(gameSessions, {
    fields: [gameResults.sessionId],
    references: [gameSessions.id],
  }),
}));

export const assessmentAttemptsRelations = relations(assessmentAttempts, ({ one }) => ({
  guardian: one(guardians, {
    fields: [assessmentAttempts.guardianId],
    references: [guardians.id],
  }),
  child: one(children, {
    fields: [assessmentAttempts.childId],
    references: [children.id],
  }),
}));

