import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

const DEFAULT_VOICE = process.env.OPENAI_TTS_VOICE ?? "alloy";
const DEFAULT_TTS_MODEL = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
    }

    const { text, voice = DEFAULT_VOICE, format = "mp3" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "`text` is required." }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_TTS_MODEL,
        input: text,
        voice,
        format,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI TTS error", errorText);
      return NextResponse.json({ error: "Failed to generate audio." }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return new Response(buffer, {
      headers: {
        "Content-Type": format === "wav" ? "audio/wav" : "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Voice summary endpoint failed", error);
    return NextResponse.json({ error: "Unable to generate summary audio." }, { status: 500 });
  }
}
