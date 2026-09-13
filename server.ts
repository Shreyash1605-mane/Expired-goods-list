import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 camera image uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// AI OCR Endpoint for Batch Number, MFG Date, EXP Date detection from package photo
app.post("/api/ocr-details", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "Missing imageBase64 in request body",
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: false,
        batchNo: "",
        mfgDate: "",
        expDate: "",
        barcode: "",
        detectedText: "",
        source: "no_gemini_key",
        message: "Gemini API key not configured. Please enter details manually.",
      });
    }

    // Clean base64 data string and extract mimeType if present in data URL
    let cleanBase64 = imageBase64;
    let detectedMime = mimeType || "image/jpeg";
    const dataUrlMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/s);
    if (dataUrlMatch) {
      detectedMime = dataUrlMatch[1];
      cleanBase64 = dataUrlMatch[2].trim();
    } else {
      cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").trim();
    }

    const prompt = `You are a warehouse data extraction assistant reading printed product packaging text.
Examine this product package photograph carefully.
Locate and extract:
1. Batch Number (often indicated by "B.No", "BATCH", "LOT", "BN", "B.", or alphanumeric codes like B240817, L1234, etc.)
2. Manufacturing Date / Pack Date (indicated by "MFG", "MFD", "PKD", "PACKED", date formats like MM/YYYY, DD/MM/YYYY, MM/YY, or MMM YYYY)
3. Expiry Date / Best Before Date (indicated by "EXP", "EXPIRY", "USE BY", "BB", date formats like MM/YYYY, DD/MM/YYYY, MM/YY, or MMM YYYY)
4. Barcode number (if clearly printed numeric digits under barcode bars are visible, otherwise leave blank)
5. Any prominent raw text snippet near the dates.

If any field is not visible or illegible, leave it as an empty string "". Standardize dates to readable format like "MM/YYYY" or "DD/MM/YYYY" where possible.`;

    // Order candidate models prioritizing fast and highly available vision models
    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-flash-lite-latest",
      "gemini-3.8-flash",
    ];
    let responseText: string | undefined;
    let lastModelError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: detectedMime,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                batchNo: {
                  type: Type.STRING,
                  description: "Extracted batch number or lot number, e.g. B240817",
                },
                mfgDate: {
                  type: Type.STRING,
                  description: "Manufacturing or packaging date, e.g. 08/2026",
                },
                expDate: {
                  type: Type.STRING,
                  description: "Expiry or best before date, e.g. 08/2027",
                },
                barcode: {
                  type: Type.STRING,
                  description: "Extracted barcode digits if visible on package",
                },
                confidenceNotes: {
                  type: Type.STRING,
                  description: "Brief note about clarity or quality",
                },
                rawTextFound: {
                  type: Type.STRING,
                  description: "Snippet of printed text found on the package",
                },
              },
            },
          },
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastModelError = err?.message || err;
      }
    }

    if (!responseText) {
      console.warn("All candidate models failed or returned empty text:", lastModelError);
      return res.json({
        success: false,
        batchNo: "",
        mfgDate: "",
        expDate: "",
        barcode: "",
        confidenceNotes: "AI model temporarily busy or unable to scan image",
        rawTextFound: "",
        source: "fallback",
        message: "Could not automatically read package text. Please enter the details manually below.",
      });
    }

    let raw = responseText.trim();
    if (raw.startsWith("```json")) {
      raw = raw.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    } else if (raw.startsWith("```")) {
      raw = raw.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    return res.json({
      success: true,
      batchNo: parsed.batchNo || "",
      mfgDate: parsed.mfgDate || "",
      expDate: parsed.expDate || "",
      barcode: parsed.barcode || "",
      confidenceNotes: parsed.confidenceNotes || "",
      rawTextFound: parsed.rawTextFound || "",
      source: "gemini_ocr",
    });
  } catch (error: any) {
    console.error("OCR extraction unexpected error:", error);
    return res.json({
      success: false,
      error: error?.message || "Failed to process image OCR",
      batchNo: "",
      mfgDate: "",
      expDate: "",
      barcode: "",
      confidenceNotes: "",
      rawTextFound: "",
      source: "error",
      message: "AI OCR encountered a temporary error. Please fill in the details manually.",
    });
  }
});

// Start server with Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GodownScan server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
