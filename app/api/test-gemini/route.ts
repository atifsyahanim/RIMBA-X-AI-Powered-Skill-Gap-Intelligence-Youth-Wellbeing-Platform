import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function GET() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    })

    const result = await model.generateContent("Say hello")
    const text = result.response.text()

    return NextResponse.json({ success: true, text })
  } catch (err) {
    console.error("TEST GEMINI ERROR:", err)
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    )
  }
}