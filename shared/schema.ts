import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(10),
  subscription: text("subscription").default("free"),
  subscriptionEnds: text("subscription_ends"),
  interests: jsonb("interests").default({}).notNull(),
  preferences: jsonb("preferences").default({}).notNull(),
  hasAccess: boolean("has_access").default(false).notNull(),
});

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
});

export const savedImages = pgTable("saved_images", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  imageType: text("image_type").notNull(), // 'generated' oder 'uploaded'
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWaitlistSchema = createInsertSchema(waitlist).pick({
  email: true,
  name: true,
  reason: true,
});

export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type WaitlistEntry = typeof waitlist.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SavedImage = typeof savedImages.$inferSelect;

export const registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
});

export const loginSchema = insertUserSchema.omit({ email: true }).extend({
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen lang sein"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
});

export const userPreferencesSchema = z.object({
  style: z.string(),
  age: z.number().min(13, "Alter muss mindestens 13 Jahre sein").max(120, "Ungültiges Alter"),
  hairColor: z.string(),
  hairStyle: z.string(),
  notifications: z.object({
    email: z.boolean(),
    styleUpdates: z.boolean(),
    credits: z.boolean(),
  }),
});

export const userInterestsSchema = z.object({
  fashionStyles: z.array(z.string()),
  favoriteColors: z.array(z.string()),
  occasions: z.array(z.string()),
});