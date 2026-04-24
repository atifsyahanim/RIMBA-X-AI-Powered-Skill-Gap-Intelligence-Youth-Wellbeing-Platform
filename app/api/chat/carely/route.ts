import { NextRequest } from "next/server";
import { getGeminiModel } from "@/lib/ai/gemini";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400 }
      );
    }

    // 🧠 CARELY PERSONALITY (you can tweak later)
    const systemInstruction = `
You are Carely, a warm, supportive mental wellbeing companion.
You speak gently, encourage reflection, and never give empty replies.
You help users feel calm, safe, and understood.
Avoid robotic or generic responses.
Keep answers short, human, and emotionally aware.
`;

    // ✅ SAME PATTERN AS TEACHER NISA
    const model = getGeminiModel("gemini-2.5-flash", {
      systemInstruction,
    });

    const formattedHistory = (history || [])
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text || "" }],
      }))
      .filter((m: any) => m.parts[0].text);

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.8,
        topP: 0.9,
      },
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return new Response(
      JSON.stringify({ text: responseText }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[CARELY ERROR]", error);

    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500 }
    );
  }
}