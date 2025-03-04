
import { waitlist, users, savedImages, outfits, ratings, type User, type InsertUser, type WaitlistEntry, type Outfit, type Rating, type InsertOutfit, type InsertRating, type SavedImage } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUserCredits(userId: number, newCreditAmount: number): Promise<User>;

  // Waitlist methods
  getApprovedWaitlistEntry(email: string): Promise<WaitlistEntry | undefined>;
  markWaitlistAsRegistered(email: string): Promise<void>;
  getAllWaitlistEntries(): Promise<WaitlistEntry[]>;
  approveWaitlistEntry(email: string): Promise<WaitlistEntry>;

  // User Images methods
  saveUserImage(userId: number, imageData: { imageUrl: string, imageType: string, title?: string }): Promise<SavedImage>;
  getUserImages(userId: number): Promise<SavedImage[]>;

  // Outfit methods
  createOutfit(outfit: InsertOutfit): Promise<Outfit>;
  getUserOutfits(userId: number): Promise<Outfit[]>;
  getOutfit(id: number): Promise<Outfit | undefined>;

  // Rating methods
  createRating(rating: InsertRating): Promise<Rating>;
  getOutfitRating(outfitId: number): Promise<Rating | undefined>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserCredits(userId: number, newCreditAmount: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits: newCreditAmount })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getApprovedWaitlistEntry(email: string): Promise<WaitlistEntry | undefined> {
    const [entry] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .where(eq(waitlist.status, "approved"));
    return entry;
  }

  async markWaitlistAsRegistered(email: string): Promise<void> {
    await db
      .update(waitlist)
      .set({ status: "registered" })
      .where(eq(waitlist.email, email));
  }

  async getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
    return await db
      .select()
      .from(waitlist)
      .orderBy(waitlist.createdAt);
  }

  async approveWaitlistEntry(email: string): Promise<WaitlistEntry> {
    const [entry] = await db
      .update(waitlist)
      .set({ status: "approved" })
      .where(eq(waitlist.email, email))
      .returning();
    return entry;
  }

  async saveUserImage(userId: number, imageData: { imageUrl: string, imageType: string, title?: string }): Promise<SavedImage> {
    const [savedImage] = await db
      .insert(savedImages)
      .values({
        userId,
        imageUrl: imageData.imageUrl,
        imageType: imageData.imageType,
        title: imageData.title || null,
      })
      .returning();
    return savedImage;
  }

  async getUserImages(userId: number): Promise<SavedImage[]> {
    return await db
      .select()
      .from(savedImages)
      .where(eq(savedImages.userId, userId))
      .orderBy(savedImages.createdAt);
  }

  async createOutfit(outfit: InsertOutfit): Promise<Outfit> {
    const [createdOutfit] = await db
      .insert(outfits)
      .values(outfit)
      .returning();
    return createdOutfit;
  }

  async getUserOutfits(userId: number): Promise<Outfit[]> {
    return await db
      .select()
      .from(outfits)
      .where(eq(outfits.userId, userId))
      .orderBy(outfits.createdAt);
  }

  async getOutfit(id: number): Promise<Outfit | undefined> {
    const [outfit] = await db
      .select()
      .from(outfits)
      .where(eq(outfits.id, id));
    return outfit;
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const [createdRating] = await db
      .insert(ratings)
      .values(rating)
      .returning();
    return createdRating;
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
