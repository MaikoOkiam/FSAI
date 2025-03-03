import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getFashionAdvice, analyzeOutfit, generateStyleTransfer } from "./openai";
import multer from "multer";
import { z } from "zod";

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Fashion advisor chat endpoint
  app.post("/api/fashion/advice", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user!;
    if (user.credits < 1) return res.status(402).json({ error: "Insufficient credits" });

    try {
      const advice = await getFashionAdvice(req.body.prompt);
      await storage.updateUserCredits(user.id, user.credits - 1);
      res.json({ advice });
    } catch (error) {
      res.status(500).json({ error: "Failed to get fashion advice" });
    }
  });

  // Outfit analysis endpoint
  app.post("/api/fashion/analyze", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user!;
    if (user.credits < 2) return res.status(402).json({ error: "Insufficient credits" });

    try {
      const analysis = await analyzeOutfit(
        req.file!.buffer.toString("base64"),
        req.body.occasion
      );
      await storage.updateUserCredits(user.id, user.credits - 2);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze outfit" });
    }
  });

  // Style transfer endpoint
  app.post("/api/fashion/transfer", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user!;
    if (user.credits < 3) return res.status(402).json({ error: "Insufficient credits" });

    try {
      const styleUrl = await generateStyleTransfer(req.file!.buffer.toString("base64"));
      await storage.updateUserCredits(user.id, user.credits - 3);
      res.json({ url: styleUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to transfer style" });
    }
  });

  // Purchase credits endpoint
  app.post("/api/credits/purchase", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const schema = z.object({
      amount: z.number().min(5).max(100)
    });

    try {
      const { amount } = schema.parse(req.body);
      const user = req.user!;
      await storage.updateUserCredits(user.id, user.credits + amount);
      res.json({ credits: user.credits + amount });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Purchase subscription endpoint
  app.post("/api/subscription/purchase", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const schema = z.object({
      plan: z.enum(["monthly", "yearly"])
    });

    try {
      const { plan } = schema.parse(req.body);
      const user = req.user!;
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (plan === "yearly" ? 12 : 1));
      
      await storage.updateUserSubscription(
        user.id,
        plan,
        endDate.toISOString()
      );
      res.json({ subscription: plan, subscriptionEnds: endDate.toISOString() });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
