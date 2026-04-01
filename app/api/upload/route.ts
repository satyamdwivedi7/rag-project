import { NextRequest, NextResponse } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const briefSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: "2-3 sentence overview of the document",
    },
    topics: {
      type: SchemaType.ARRAY,
      description: "4-5 short topic labels (2-4 words each)",
      items: { type: SchemaType.STRING },
    },
    questions: {
      type: SchemaType.ARRAY,
      description: "5 questions a reader might want to ask about this document",
      items: { type: SchemaType.STRING },
    },
  },
  required: ["summary", "topics", "questions"],
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tmpPath = join(tmpdir(), `docmind-${Date.now()}.pdf`);
    writeFileSync(tmpPath, buffer);

    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
    const uploaded = await fileManager.uploadFile(tmpPath, {
      mimeType: "application/pdf",
      displayName: file.name,
    });
    unlinkSync(tmpPath);

    const fileUri = uploaded.file.uri;

    let brief = null;
    try {
      const briefModel = genai.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: briefSchema,
        },
      });
      const briefResult = await briefModel.generateContent([
        { fileData: { mimeType: "application/pdf", fileUri } },
        {
          text: `Analyze this document and provide:
- summary: A 2-3 sentence overview of what this document is about
- topics: 4-5 short topic labels (2-4 words each) capturing the main themes
- questions: 5 questions a reader would likely want to ask about this document`,
        },
      ]);
      brief = JSON.parse(briefResult.response.text());
    } catch {
      // Brief is best-effort; upload still succeeds
    }

    return NextResponse.json({
      fileUri,
      message: `${file.name} ready`,
      brief,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", message);
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
