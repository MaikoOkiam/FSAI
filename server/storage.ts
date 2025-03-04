
import { db } from "./db";
import { users, waitlist, savedImages, outfits, ratings } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { SessionData, Store } from "express-session";
import pgSessionStore from "connect-pg-simple";

// Create session store
export const sessionStore = new (pgSessionStore(require("express-session")))({
  conObject: { connectionString: process.env.DATABASE_URL },
  tableName: "session",
  createTableIfMissing: true,
});

export const storage = {
  // User methods
  async createUser(userData: any) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },
  
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },
  
  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  },
  
  async updateUserCredits(userId: number, credits: number) {
    await db.update(users).set({ credits }).where(eq(users.id, userId));
  },
  
  async updateUserPreferences(userId: number, preferences: any) {
    await db.update(users).set({ preferences }).where(eq(users.id, userId));
  },
  
  async updateUserInterests(userId: number, interests: any) {
    await db.update(users).set({ interests }).where(eq(users.id, userId));
  },
  
  async updateUserSubscription(userId: number, subscription: string, subscriptionEnds: string) {
    await db.update(users)
      .set({ subscription, subscriptionEnds })
      .where(eq(users.id, userId));
  },
  
  // Waitlist methods
  async getApprovedWaitlistEntry(email: string) {
    const [entry] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .where(eq(waitlist.status, "approved"));
    return entry;
  },
  
  async markWaitlistAsRegistered(email: string) {
    await db
      .update(waitlist)
      .set({ status: "registered" })
      .where(eq(waitlist.email, email));
  },
  
  // Image methods
  async saveUserImage(userId: number, imageData: any) {
    const [image] = await db
      .insert(savedImages)
      .values({ ...imageData, userId })
      .returning();
    return image;
  },
  
  async getUserSavedImages(userId: number) {
    return db
      .select()
      .from(savedImages)
      .where(eq(savedImages.userId, userId))
      .orderBy(savedImages.createdAt.desc());
  },
  
  // Outfit methods
  async createOutfit(outfitData: any) {
    const [outfit] = await db.insert(outfits).values(outfitData).returning();
    return outfit;
  },
  
  async getUserOutfits(userId: number) {
    return db
      .select()
      .from(outfits)
      .where(eq(outfits.userId, userId))
      .orderBy(outfits.createdAt.desc());
  },
  
  async getOutfit(id: number) {
    const [outfit] = await db.select().from(outfits).where(eq(outfits.id, id));
    return outfit;
  },
  
  // Rating methods
  async createRating(ratingData: any) {
    const [rating] = await db.insert(ratings).values(ratingData).returning();
    return rating;
  },
  
  async getOutfitRating(outfitId: number) {
    const [rating] = await db
      .select()
      .from(ratings)
      .where(eq(ratings.outfitId, outfitId));
    return rating;
  },
  
  sessionStore,
};

import { users, savedImages, outfits, ratings, type User, type InsertUser, type SavedImage, type Outfit, type Rating, type InsertOutfit, type InsertRating } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Existing methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(id: number, credits: number): Promise<void>;
  updateUserSubscription(id: number, subscription: string, endDate: string): Promise<void>;
  updateUserPreferences(id: number, preferences: any): Promise<void>;
  updateUserInterests(id: number, interests: any): Promise<void>;
  getUserSavedImages(userId: number): Promise<SavedImage[]>;
  saveUserImage(userId: number, imageData: Partial<SavedImage>): Promise<SavedImage>;
  sessionStore: session.Store;

  // New methods for outfit rating system
  createOutfit(outfitData: InsertOutfit): Promise<Outfit>;
  getOutfit(id: number): Promise<Outfit | undefined>;
  getUserOutfits(userId: number): Promise<Outfit[]>;
  createRating(ratingData: InsertRating): Promise<Rating>;
  getOutfitRating(outfitId: number): Promise<Rating | undefined>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Existing methods remain unchanged
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        credits: 10,
        subscription: "free",
        subscriptionEnds: null,
      })
      .returning();
    return user;
  }

  async updateUserCredits(id: number, credits: number): Promise<void> {
    await db
      .update(users)
      .set({ credits })
      .where(eq(users.id, id));
  }

  async updateUserSubscription(
    id: number,
    subscription: string,
    subscriptionEnds: string
  ): Promise<void> {
    await db
      .update(users)
      .set({ subscription, subscriptionEnds })
      .where(eq(users.id, id));
  }

  async updateUserPreferences(id: number, preferences: any): Promise<void> {
    await db
      .update(users)
      .set({ preferences })
      .where(eq(users.id, id));
  }

  async updateUserInterests(id: number, interests: any): Promise<void> {
    await db
      .update(users)
      .set({ interests })
      .where(eq(users.id, id));
  }

  async getUserSavedImages(userId: number): Promise<SavedImage[]> {
    return db
      .select()
      .from(savedImages)
      .where(eq(savedImages.userId, userId))
      .orderBy(savedImages.createdAt);
  }

  async saveUserImage(userId: number, imageData: Partial<SavedImage>): Promise<SavedImage> {
    const [savedImage] = await db
      .insert(savedImages)
      .values({
        userId,
        imageUrl: imageData.imageUrl!,
        imageType: imageData.imageType!,
        title: imageData.title,
      })
      .returning();
    return savedImage;
  }

  // New methods for outfit rating system
  async createOutfit(outfitData: InsertOutfit): Promise<Outfit> {
    const [outfit] = await db
      .insert(outfits)
      .values(outfitData)
      .returning();
    return outfit;
  }

  async getOutfit(id: number): Promise<Outfit | undefined> {
    const [outfit] = await db
      .select()
      .from(outfits)
      .where(eq(outfits.id, id));
    return outfit;
  }

  async getUserOutfits(userId: number): Promise<Outfit[]> {
    return db
      .select()
      .from(outfits)
      .where(eq(outfits.userId, userId))
      .orderBy(outfits.createdAt);
  }

  async createRating(ratingData: InsertRating): Promise<Rating> {
    const [rating] = await db
      .insert(ratings)
      .values(ratingData)
      .returning();
    return rating;
  }

  async getOutfitRating(outfitId: number): Promise<Rating | undefined> {
    const [rating] = await db
      .select()
      .from(ratings)
      .where(eq(ratings.outfitId, outfitId));
    return rating;
  }
}

export const storage = new DatabaseStorage();