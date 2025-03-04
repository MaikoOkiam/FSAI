import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 32)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashedPassword, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashedPassword, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 32)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("[Auth Debug] Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("[Auth Debug] Attempting login for username:", username);
        const user = await storage.getUserByUsername(username);
        console.log("[Auth Debug] Found user:", user ? "yes" : "no");

        if (!user) {
          console.log("[Auth Debug] User not found");
          return done(null, false);
        }

        try {
          const passwordValid = await comparePasswords(password, user.password);
          console.log("[Auth Debug] Password valid:", passwordValid);

          if (!passwordValid) {
            return done(null, false);
          }

          console.log("[Auth Debug] Login successful");
          return done(null, user);
        } catch (error) {
          console.error("[Auth Debug] Password validation error:", error);
          return done(error);
        }
      } catch (err) {
        console.error("[Auth Debug] Login error:", err);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("[Auth Debug] Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("[Auth Debug] Deserializing user:", id);
      const user = await storage.getUser(id);
      console.log("[Auth Debug] Deserialized user found:", user ? "yes" : "no");
      done(null, user);
    } catch (err) {
      console.error("[Auth Debug] Deserialization error:", err);
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("[Auth Debug] Registration attempt:", req.body.username);
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log("[Auth Debug] Username already exists");
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      console.log("[Auth Debug] Password hashed");

      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      console.log("[Auth Debug] User created successfully");

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      console.error("[Auth Debug] Registration error:", err);
      next(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log("[Auth Debug] Login successful, sending response");
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log("[Auth Debug] Logout attempt");
    req.logout((err) => {
      if (err) {
        console.error("[Auth Debug] Logout error:", err);
        return next(err);
      }
      console.log("[Auth Debug] Logout successful");
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("[Auth Debug] Auth check:", req.isAuthenticated());
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}