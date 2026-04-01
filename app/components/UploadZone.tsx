"use client";
import { useRef } from "react";

type Props = {
  uploading: boolean;
  uploadedFile: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function UploadZone({ uploading, uploadedFile, onFileChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ padding: "1rem 1.25rem 0" }}>
      <div
        className="upload-zone"
        onClick={() => fileRef.current?.click()}
        style={{
          borderRadius: 10,
          padding: "0.7rem 1rem",
          textAlign: "center",
          cursor: "pointer",
          border: uploadedFile
            ? "1px solid var(--accent-rim)"
            : "1.5px dashed var(--border)",
          background: uploadedFile ? "var(--accent-pale)" : "var(--surface)",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={onFileChange}
        />
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            fontFamily: "var(--font-body)",
            color: uploading
              ? "var(--accent)"
              : uploadedFile
              ? "var(--fg-secondary)"
              : "var(--fg-muted)",
          }}
        >
          {uploading
            ? "Processing document…"
            : uploadedFile
            ? `${uploadedFile} · click to replace`
            : "Click to upload a PDF"}
        </p>
      </div>
    </div>
  );
}
