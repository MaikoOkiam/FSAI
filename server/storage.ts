import { waitlist, users, type User, type InsertUser, type WaitlistEntry } from "@shared/schema";
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

  // Waitlist methods
  getApprovedWaitlistEntry(email: string): Promise<WaitlistEntry | undefined>;
  markWaitlistAsRegistered(email: string): Promise<void>;
  getAllWaitlistEntries(): Promise<WaitlistEntry[]>;
  approveWaitlistEntry(email: string): Promise<WaitlistEntry>;
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
}

export const storage = new DatabaseStorage();