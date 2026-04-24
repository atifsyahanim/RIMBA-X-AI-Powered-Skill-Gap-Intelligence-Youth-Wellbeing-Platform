import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, CHAT_LIMIT } from '@/lib/security/rate-limit'
import { getGeminiModel } from '@/lib/ai/gemini'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are the Adaptive Learning Engine for an inclusive education platform serving learners from foundational to advanced levels. 

Your tasks are:
1) Diagnose the learner's level and interests.
2) Generate a personalized learning roadmap.
3) Recommend relevant courses/modules.
4) Terminate adaptive questioning after roadmap generation.

🔹 Phase 1: Adaptive Diagnosis
Ask structured adaptive questions ONE AT A TIME based on:
- Age (optional)
- Selected track (You MUST provide exactly these options: Foundations, STEM, Language & Literature, Life Skills / Digital Skills, Creative & Arts, Other)
- Current education level
- Self-assessed proficiency
- Goal (exam prep, career skill, hobby, mastery, etc.)

Adjust difficulty dynamically based on answers. Map performance to:
- Level (Foundational / Beginner / Intermediate / Advanced)
- Skill gaps
- Strength areas

CRITICAL INSTRUCTION FOR PHASE 1: 
1. Do NOT ask all the questions at once. Ask the first question, wait for an answer, then ask the next question, and so on. Make it a natural conversation.
2. For EVERY question you ask, you MUST provide 3-5 multiple choice options formatted as a Markdown bulleted list for the user to easily click. For example:
   * Option A
   * Option B
   * Option C
🔹 Phase 2: Roadmap Generation
Once sufficient data is collected (after asking max 5-7 questions to gauge level), generate a Personalized Roadmap.

⚠️ AFTER ROADMAP GENERATION: Terminate the Adaptive Learning Engine. Do NOT continue asking diagnostic questions. Refuse to answer further questions and state that the roadmap has been generated.

Output Format
At the very end of your final roadmap message, you MUST provide a JSON block representing the recommended modules exactly in this format so it can be rendered interactively. DO NOT wrap JSON in Markdown if it's not needed, but standard \`\`\`json is fine. Ensure it is valid JSON.

\`\`\`json
{
  "roadmap": {
    "track": "Digital Skills",
    "level": "Intermediate",
    "focus_areas": ["Problem Solving", "Web Architecture"],
    "modules": [
      {
        "topic_group": "Digital Skills (Intermediate)",
        "courses": [
          {
            "id": "course_1",
            "title": "Python Programming Fundamentals",
            "description": "Learn the basics of Python programming.",
            "difficulty": "Intermediate",
            "estimated_time": "15 hours",
            "subtopics": ["Variables", "Loops", "Functions"],
            "study_planner": [
              "Week 1: Core syntax",
              "Week 2: Advanced functions"
            ],
            "learning_outcomes": ["Write basic scripts", "Automate tasks"]
          }
        ]
      }
    ]
  }
}
\`\`\`

IMPORTANT BEHAVIORAL RULES:
- Limit 2–4 courses per roadmap to ensure the roadmap generates quickly without error and avoids overwhelming the user.
- Recommend courses strictly aligned with the diagnosed level.
- Group courses by Topic.
- You are having an interactive chat. DO NOT dump all steps at once! Start by introducing yourself and asking the VERY FIRST context question.`;

export async function POST(request: NextRequest) {
    let user = null
    try {
        const supabase = await createClient()
        const { data } = await supabase.auth.getUser()
        user = data?.user ?? null
    } catch (e) { }

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, history = [] } = body

    const { allowed, resetInMs } = await checkRateLimit(user.id, CHAT_LIMIT)
    if (!allowed) {
        return new Response('Rate limit exceeded', { status: 429 })
    }

    const formattedHistory = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }))

    // Gemini strictly requires the first message in history to be from the user
    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.unshift({
            role: 'user',
            parts: [{ text: 'Hello! Please begin our learning path context collection.' }]
        })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            try {
                const model = getGeminiModel('gemini-2.5-flash', { systemInstruction: SYSTEM_PROMPT })

                const chat = model.startChat({
                    history: formattedHistory,
                    generationConfig: {
                        maxOutputTokens: 4000,
                        temperature: 0.7
                    }
                })

                const result = await chat.sendMessageStream(message)
                for await (const chunk of result.stream) {
                    controller.enqueue(encoder.encode(chunk.text()))
                }
            } catch (err) {
                console.error('[learning-path api]', err)
                controller.enqueue(encoder.encode('\n\nError connecting to Learning Engine. Please try again.'))
            } finally {
                controller.close()
            }
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff',
        }
    })
}
