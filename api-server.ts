import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Endpoint
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in the environment.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const { model, contents, config } = req.body;
      
      // Ensure contents is in the correct format if it's a string
      const formattedContents = typeof contents === 'string' 
        ? [{ role: 'user', parts: [{ text: contents }] }]
        : contents;

      const response = await ai.models.generateContent({
        model: model || "gemini-3-flash-preview",
        contents: formattedContents,
        config
      });
      
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ 
        error: error.message || "An unknown error occurred",
        debug: {
          keyLength: process.env.GEMINI_API_KEY?.length,
          keyPrefix: process.env.GEMINI_API_KEY?.substring(0, 5),
          nextPublicKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY
        }
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
