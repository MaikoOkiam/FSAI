import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  credits: integer("credits").notNull().default(10),
  subscription: text("subscription").default("free"),
  subscriptionEnds: text("subscription_ends"),
  interests: jsonb("interests").default({}).notNull(),
  preferences: jsonb("preferences").default({}).notNull(),
  hasAccess: boolean("has_access").default(false).notNull(),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false).notNull(),
});

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").default("pending").notNull(),
});

export const savedImages = pgTable("saved_images", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  imageType: text("image_type").notNull(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const outfits = pgTable("outfits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  occasion: text("occasion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  outfitId: integer("outfit_id").notNull(),
  styleScore: integer("style_score").notNull(),
  fitScore: integer("fit_score").notNull(),
  colorScore: integer("color_score").notNull(),
  feedback: text("feedback").notNull(),
  suggestions: jsonb("suggestions").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const outfitsRelations = relations(outfits, ({ one, many }) => ({
  user: one(users, {
    fields: [outfits.userId],
    references: [users.id],
  }),
  ratings: many(ratings),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  outfit: one(outfits, {
    fields: [ratings.outfitId],
    references: [outfits.id],
  }),
}));

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
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = insertUserSchema.omit({ email: true }).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userPreferencesSchema = z.object({
  style: z.string(),
  age: z.number().min(13, "Age must be at least 13").max(120, "Invalid age"),
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

export const insertOutfitSchema = createInsertSchema(outfits).pick({
  userId: true,
  imageUrl: true,
  title: true,
  description: true,
  occasion: true,
});

export const insertRatingSchema = createInsertSchema(ratings).pick({
  outfitId: true,
  styleScore: true,
  fitScore: true,
  colorScore: true,
  feedback: true,
  suggestions: true,
});

export type Outfit = typeof outfits.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type InsertOutfit = z.infer<typeof insertOutfitSchema>;
export type InsertRating = z.infer<typeof insertRatingSchema>;