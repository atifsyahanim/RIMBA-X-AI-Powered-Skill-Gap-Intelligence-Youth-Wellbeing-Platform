import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TEACHER_NISA_PROMPT } from '@/lib/career/prompts'
import { getGeminiModel } from '@/lib/ai/gemini'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            console.error('[teacher-nisa] Auth Check Failed:', error)
            return new Response(JSON.stringify({ error: `Unauthorized: ${error?.message || 'No active session found.'}` }), { status: 401 })
        }

        const body = await request.json()
        const { message, history, moduleName, levelName, currentStep, visibleContext } = body

        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 })
        }

        const systemInstruction = TEACHER_NISA_PROMPT(moduleName, levelName, currentStep, visibleContext)

        const model = getGeminiModel('gemini-2.5-flash', { systemInstruction: systemInstruction })

        const formattedHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text || msg.content }],
        }))

        // Google Generative AI history MUST start with role: 'user'
        if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.shift()
        }

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 600,
                temperature: 0.7,
                topP: 0.9,
            }
        })

        const result = await chat.sendMessage(message)
        const responseText = result.response.text()

        return new Response(JSON.stringify({ text: responseText }), {
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error: any) {
        console.error("Teacher Nisa AI Error:", error)
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 })
    }
}
