import OpenAI from "openai";
import { NextResponse } from "next/server";
import { QUESTIONS_PROMPT } from "@/services/Constants";

const FREE_MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "openrouter/free",
];

export async function POST(request) {
    try {
        const body = await request.json();
        const jobPosition = body.jobPosition;
        const jobDescription = body.jobDescription;
        const duration = body.duration || body.interviewDuration;
        const type = body.type || body.types;

        const difficulty = body.difficulty;
        const resumeText = typeof body.resumeText === "string" ? body.resumeText.slice(0, 12000) : "";

        let FINAL_PROMPT = QUESTIONS_PROMPT
            .replaceAll("{{jobTitle}}", jobPosition ?? "")
            .replaceAll("{{jobDescription}}", jobDescription ?? "")
            .replaceAll("{{duration}}", duration ?? "")
            .replaceAll("{{type}}", Array.isArray(type) ? type.join(", ") : (type ?? ""));

        if (difficulty) {
            FINAL_PROMPT += `\n\nDifficulty level: ${difficulty}. Pitch every question at this level.`;
        }
        if (resumeText) {
            FINAL_PROMPT +=
                "\n\nCandidate resume (base most questions on the projects, skills and experience it lists; " +
                "ask the candidate to explain their own work in depth):\n\"\"\"\n" + resumeText + "\n\"\"\"";
        }

        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Interview Labs",
            },
        });

        let lastError = null;

        for (const model of FREE_MODELS) {
            try {
                const completion = await openai.chat.completions.create({
                    model,
                    messages: [
                        {
                            role: "system",
                            content: "Return only valid JSON. No markdown. Shape: {\"interviewQuestions\":[{\"question\":\"...\",\"type\":\"Technical\"}]}",
                        },
                        { role: "user", content: FINAL_PROMPT },
                    ],
                });

                const message = completion.choices?.[0]?.message;
                const content = Array.isArray(message?.content)
                    ? message.content.map((part) => part?.text || "").join("\n")
                    : message?.content;

                if (!content) {
                    lastError = new Error("AI returned an empty response");
                    continue;
                }

                return NextResponse.json({ ...message, content });
            } catch (error) {
                lastError = error;
                const status = error?.status || error?.statusCode;
                const isRateLimited = status === 429 || String(error?.message || "").includes("429");
                if (isRateLimited) {
                    continue;
                }
                throw error;
            }
        }

        return NextResponse.json(
            {
                error: "Free AI models are rate limited right now. Wait a minute and try again, or add credits on OpenRouter.",
                details: lastError?.message,
            },
            { status: 429 }
        );
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { error: error?.message || "Failed to generate questions" },
            { status: error?.status || 500 }
        );
    }
}
