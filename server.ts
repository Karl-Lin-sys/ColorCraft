import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { theme, childName, size, pageIndex } = req.body;

      if (!theme || !childName || typeof pageIndex !== "number") {
        return res.status(400).json({ error: "Missing required fields." });
      }

      // Valid sizes for gemini-3-pro-image-preview are 1K, 2K, 4K (Wait, is it "1K" or 1024?)
      // According to gemini-api SKILL.md:
      // imageSize: "1K" | "2K" | "4K"
      const imageSize = size || "1K";

      const prompt = `Black and white line art, thick outlines, very clean, suitable for a children's coloring book.
Theme: ${theme}.
This coloring book belongs to: ${childName}.
Make sure the drawing is highly engaging for children, with clear distinct borders for easy coloring. No shading.
This is page ${pageIndex} of 5. Create a unique and playful scene related to the theme.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: imageSize as "1K" | "2K" | "4K",
          },
        },
      });

      // Extract image data
      let imageData = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageData = part.inlineData.data; // Base64 encoded string
            break;
          }
        }
      }

      if (!imageData) {
        return res.status(500).json({ error: "No image generated." });
      }

      res.json({ imageData });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to generate image." });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format." });
      }

      const formattedContents = messages.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction:
            "You are a friendly and enthusiastic assistant helping a user brainstorm themes for a children's coloring book. Ask engaging questions, suggest creative ideas, and keep it lighthearted. Limit your responses to short paragraphs.",
        },
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write("data: [DONE]\\n\\n");
      res.end();
    } catch (error: any) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ error: error.message || "Chat failed." });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
