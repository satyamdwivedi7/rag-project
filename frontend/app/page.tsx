"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const uploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${BACKEND}/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setUploadedFile(file.name);
      setMessages([{ role: "system", text: data.message }]);
    } catch {
      setMessages([{ role: "system", text: "Upload failed. Is the backend running?" }]);
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!question.trim()) return;
    const userMsg = { role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    const res = await fetch(`${BACKEND}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
    setLoading(false);
  };

  return (
    <main className="h-full bg-gray-950 text-white flex flex-col items-center px-4 py-6 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-4 text-center">
        <h1 className="text-4xl font-bold text-indigo-400">DocMind</h1>
        <p className="text-gray-400 mt-2">Upload a PDF. Ask anything about it.</p>
      </div>

      {/* Upload */}
      <div
        onClick={() => fileRef.current?.click()}
        className="shrink-0 w-full max-w-2xl border-2 border-dashed border-indigo-500 rounded-xl p-6
                   text-center cursor-pointer hover:bg-indigo-950 transition mb-4"
      >
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={uploadPDF} />
        {uploading ? (
          <p className="text-indigo-400">Ingesting PDF...</p>
        ) : uploadedFile ? (
          <p className="text-green-400">✓ {uploadedFile} ready</p>
        ) : (
          <p className="text-gray-400">Click to upload a PDF</p>
        )}
      </div>

      {/* Chat window — only this scrolls */}
      <div className="w-full max-w-2xl flex-1 overflow-y-auto bg-gray-900 rounded-xl p-4 mb-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-8">
            Upload a PDF and start asking questions
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-4 py-3 text-sm max-w-[85%] ${
              m.role === "user"
                ? "bg-indigo-600 self-end"
                : m.role === "ai"
                ? "bg-gray-700 self-start"
                : "bg-gray-800 self-center text-gray-400 text-xs"
            }`}
          >
            {m.role === "ai" ? (
              <div className="prose prose-invert prose-sm max-w-none
                              prose-p:my-1 prose-li:my-0.5 prose-headings:mb-2 prose-headings:mt-3
                              prose-code:bg-gray-600 prose-code:px-1 prose-code:rounded
                              prose-strong:text-white">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            ) : (
              m.text
            )}
          </div>
        ))}
        {loading && (
          <div className="bg-gray-700 self-start rounded-lg px-4 py-3 text-sm text-gray-400">
            Thinking...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 w-full max-w-2xl flex gap-2">
        <input
          disabled={!uploadedFile}
          className="flex-1 bg-gray-800 rounded-lg px-4 py-3 text-sm outline-none
                     focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
          placeholder={uploadedFile ? "Ask a question about your PDF..." : "Upload a PDF first..."}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          disabled={!uploadedFile}
          onClick={sendMessage}
          className="bg-indigo-600 hover:bg-indigo-500 px-5 py-3 rounded-lg text-sm font-medium transition
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
        >
          Ask
        </button>
      </div>
    </main>
  );
}
