import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const compareSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    sharedThemes: {
      type: SchemaType.ARRAY,
      description: "Themes or topics addressed by most or all documents",
      items: { type: SchemaType.STRING },
    },
    conflicts: {
      type: SchemaType.ARRAY,
      description: "Points where documents disagree or present contradictory information",
      items: { type: SchemaType.STRING },
    },
    uniqueInsights: {
      type: SchemaType.ARRAY,
      description: "Insights found in only one document",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          fileName: {
            type: SchemaType.STRING,
            description: "Name of the document providing this insight (use exact names from the document list)",
          },
          insight: {
            type: SchemaType.STRING,
            description: "What this document uniquely contributes",
          },
        },
        required: ["fileName", "insight"],
      },
    },
    synthesis: {
      type: SchemaType.STRING,
      description: "Markdown-formatted prose answer synthesizing across all documents in relation to the question",
    },
  },
  required: ["sharedThemes", "conflicts", "uniqueInsights", "synthesis"],
};

type DocRef = { fileUri: string; fileName: string };

export async function POST(req: NextRequest) {
  try {
    const { question, docs }: { question: string; docs: DocRef[] } = await req.json();

    const GEMINI_FILE_URI_PREFIX = "https://generativelanguage.googleapis.com/";
    if (!Array.isArray(docs) || docs.length < 2) {
      return NextResponse.json(
        { error: "Compare requires at least 2 documents" },
        { status: 400 }
      );
    }

    if (!docs.every((d) => typeof d.fileUri === "string" && d.fileUri.startsWith(GEMINI_FILE_URI_PREFIX))) {
      return NextResponse.json({ error: "Invalid file URI" }, { status: 400 });
    }

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "No question provided." },
        { status: 400 }
      );
    }

    const model = genai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: compareSchema,
      },
    });

    const fileParts = docs.map((doc) => ({
      fileData: { mimeType: "application/pdf" as const, fileUri: doc.fileUri },
    }));

    const docList = docs.map((d, i) => `${i + 1}. ${d.fileName}`).join("\n");

    const result = await model.generateContent([
      ...fileParts,
      {
        text: `You are analyzing ${docs.length} documents listed below. Answer the question by comparing them across all documents simultaneously.

Documents:
${docList}

For the response:
- sharedThemes: list themes or topics that most or all documents address
- conflicts: list specific points where documents disagree or contradict each other
- uniqueInsights: for each document, note what it covers that the others do not (use exact document names from the list above)
- synthesis: a markdown-formatted prose answer to the question drawing on all documents

Question: ${question}`,
      },
    ]);

    const parsed = JSON.parse(result.response.text());
    return NextResponse.json({ comparison: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Compare error:", message);
    return NextResponse.json({ error: `Compare failed: ${message}` }, { status: 500 });
  }
}
