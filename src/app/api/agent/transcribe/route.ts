import { NextResponse } from "next/server";
const MODEL = process.env.OPENAI_STT_MODEL ?? "whisper-1";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Audio file missing" }, { status: 400 });
    }

    const form = new FormData();
    form.append("file", file, file.name || "speech.mp3");
    form.append("model", MODEL);
    form.append("response_format", "json");
    form.append("temperature", "0.2");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      console.error("OpenAI STT error", errorPayload);
      return NextResponse.json({ error: "Transcription failed", detail: errorPayload }, { status: response.status });
    }

    const transcription = (await response.json()) as { text?: string };

    if (!transcription.text) {
      return NextResponse.json({ error: "No transcript returned" }, { status: 502 });
    }

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("Transcribe endpoint failed", error);
    return NextResponse.json(
      {
        error: "Transcription failed",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}
