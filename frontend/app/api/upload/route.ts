import { NextRequest, NextResponse } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Write to /tmp (writable in Vercel serverless)
    const buffer = Buffer.from(await file.arrayBuffer());
    const tmpPath = join(tmpdir(), `docmind-${Date.now()}.pdf`);
    writeFileSync(tmpPath, buffer);

    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
    const uploaded = await fileManager.uploadFile(tmpPath, {
      mimeType: "application/pdf",
      displayName: file.name,
    });

    unlinkSync(tmpPath);

    return NextResponse.json({
      fileUri: uploaded.file.uri,
      message: `${file.name} ready`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", message);
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
