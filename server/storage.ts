import { User, InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(id: number, credits: number): Promise<void>;
  updateUserSubscription(id: number, subscription: string, endDate: string): Promise<void>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      credits: 10,
      subscription: "free",
      subscriptionEnds: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserCredits(id: number, credits: number): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      this.users.set(id, { ...user, credits });
    }
  }

  async updateUserSubscription(id: number, subscription: string, endDate: string): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      this.users.set(id, { 
        ...user, 
        subscription,
        subscriptionEnds: endDate
      });
    }
  }
}

export const storage = new MemStorage();
