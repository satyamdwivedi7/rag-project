import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const answerSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    answer: {
      type: SchemaType.STRING,
      description: "Markdown-formatted answer to the question",
    },
    citations: {
      type: SchemaType.ARRAY,
      description: "1-3 verbatim excerpts from the document supporting the answer",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          excerpt: {
            type: SchemaType.STRING,
            description: "Short verbatim passage from the document",
          },
          relevance: {
            type: SchemaType.STRING,
            description: "One phrase explaining why this excerpt supports the answer",
          },
        },
        required: ["excerpt", "relevance"],
      },
    },
  },
  required: ["answer", "citations"],
};

export async function POST(req: NextRequest) {
  try {
    const { question, fileUri } = await req.json();

    if (!fileUri) {
      return NextResponse.json(
        { answer: "No document uploaded. Please upload a PDF first.", citations: [] },
        { status: 200 }
      );
    }

    const model = genai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: answerSchema,
      },
    });

    const result = await model.generateContent([
      { fileData: { mimeType: "application/pdf", fileUri } },
      {
        text: `You are a helpful assistant answering questions about the uploaded document.
Format your answer in Markdown: use **bold** for key terms, bullet lists for multiple points, headings for structured answers.
Include 1-3 citations: short verbatim excerpts from the document that directly support your answer.
If no relevant excerpts exist, return an empty citations array.
If the answer is not in the document, say so clearly in the answer field.

Question: ${question}`,
      },
    ]);

    const parsed = JSON.parse(result.response.text());
    return NextResponse.json({
      answer: parsed.answer ?? "",
      citations: parsed.citations ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Ask error:", message);
    return NextResponse.json(
      { answer: `Request failed: ${message}`, citations: [] },
      { status: 500 }
    );
  }
}
