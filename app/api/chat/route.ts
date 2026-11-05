import { NextRequest, NextResponse } from "next/server";

function repairEncoding(value: string) {
  if (!/[ÃÂð]/.test(value)) return value;
  return Buffer.from(value, "latin1").toString("utf8");
}

const DEFAULT_WEBHOOK_URL =
  "https://n8n.andresmorales.com.co/webhook/2217bc0b-b794-4e91-9056-379add7b9b72/chat";

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "El mensaje es requerido" }, { status: 400 });
    }

    if (typeof sessionId !== "string" || !sessionId.trim()) {
      return NextResponse.json({ error: "La sesión es requerida" }, { status: 400 });
    }

    const webhookUrl = process.env.N8N_CHAT_URL || DEFAULT_WEBHOOK_URL;
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatInput: message.trim(),
        sessionId,
      }),
      cache: "no-store",
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("n8n chat error", response.status, text);
      return NextResponse.json({ error: "El asistente no está disponible" }, { status: 502 });
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      const displayText = repairEncoding(text);
      return NextResponse.json({ output: displayText });
    }

    const output =
      typeof data === "string"
        ? data
        : data && typeof data === "object" && "output" in data
          ? (data as { output: unknown }).output
          : text;

    const normalizedOutput = typeof output === "string" ? output : text;
    const displayOutput = repairEncoding(normalizedOutput);

    return NextResponse.json({ output: displayOutput });
  } catch (error) {
    console.error("Chat API error", error);
    return NextResponse.json({ error: "No se pudo conectar con el asistente" }, { status: 500 });
  }
}
