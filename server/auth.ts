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
  try {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashedPassword = buf.toString("hex");
    console.log("[Auth Debug] Generated hash format:", `${hashedPassword}.${salt}`);
    return `${hashedPassword}.${salt}`;
  } catch (error) {
    console.error("[Auth Debug] Hash generation error:", error);
    throw error;
  }
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    console.log("[Auth Debug] Comparing passwords");
    console.log("[Auth Debug] Stored password format:", stored);

    const [hashedPassword, salt] = stored.split(".");
    if (!hashedPassword || !salt) {
      console.error("[Auth Debug] Invalid stored password format");
      return false;
    }

    const hashedBuf = Buffer.from(hashedPassword, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;

    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log("[Auth Debug] Password comparison result:", result);
    return result;
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
          return done(null, false, { message: "Invalid username or password" });
        }

        try {
          const passwordValid = await comparePasswords(password, user.password);
          console.log("[Auth Debug] Password valid:", passwordValid);

          if (!passwordValid) {
            return done(null, false, { message: "Invalid username or password" });
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
      
      // Check if email is in the approved waitlist
      const waitlistEntry = await storage.getApprovedWaitlistEntry(req.body.email);
      if (!waitlistEntry) {
        console.log("[Auth Debug] Email not in approved waitlist:", req.body.email);
        return res.status(403).json({ message: "Registration requires waitlist approval" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      console.log("[Auth Debug] Password hashed successfully");

      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        hasAccess: true, // Automatically grant access for approved waitlist members
      });
      console.log("[Auth Debug] User created successfully");

      // Update waitlist entry to registered
      await storage.markWaitlistAsRegistered(req.body.email);
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      console.error("[Auth Debug] Registration error:", err);
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("[Auth Debug] Authentication error:", err);
        return next(err);
      }
      if (!user) {
        console.log("[Auth Debug] Authentication failed:", info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          console.error("[Auth Debug] Login error:", err);
          return next(err);
        }
        console.log("[Auth Debug] Login successful");
        res.json(user);
      });
    })(req, res, next);
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