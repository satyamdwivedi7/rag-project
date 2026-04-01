import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { question, fileUri } = await req.json();

    if (!fileUri) {
      return NextResponse.json(
        { answer: "No document uploaded. Please upload a PDF first." },
        { status: 200 }
      );
    }

    const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: "application/pdf",
          fileUri,
        },
      },
      {
        text: `You are a helpful assistant answering questions about the uploaded document.
Always format your response using Markdown: use **bold** for key terms, bullet lists for multiple points, headings for structured answers, and \`code\` for technical identifiers.
If the answer is not in the document, say so clearly.

Question: ${question}`,
      },
    ]);

    return NextResponse.json({ answer: result.response.text() });
  } catch (err) {
    console.error("Ask error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
