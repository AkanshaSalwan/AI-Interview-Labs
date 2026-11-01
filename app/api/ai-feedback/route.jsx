import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/services/supabaseServer";
import { FEEDBACK_PROMPT } from "@/services/Constants";

const FREE_MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "openrouter/free",
];

const MAX_MESSAGES = 200;
const MAX_MESSAGE_CHARS = 2000;

// Errors raised by submit_interview_feedback() (migration 006).
const SAVE_ERRORS = {
    INTERVIEW_NOT_FOUND: { status: 404, message: "This interview no longer exists." },
    NOT_YOUR_PRACTICE_INTERVIEW: { status: 403, message: "Sign in with the account that created this practice interview." },
};

function parseJsonContent(content) {
    const cleaned = content
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        const objectMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!objectMatch) return null;

        try {
            return JSON.parse(objectMatch[0]);
        } catch {
            return null;
        }
    }
}

// Keep only well-formed turns, capped in size, so the prompt and stored transcript stay sane.
function sanitizeConversation(conversation) {
    if (!Array.isArray(conversation)) return [];
    return conversation
        .filter((message) => ["assistant", "user"].includes(message?.role) && typeof message?.content === "string")
        .map((message) => ({ role: message.role, content: message.content.trim().slice(0, MAX_MESSAGE_CHARS) }))
        .filter((message) => message.content)
        .slice(0, MAX_MESSAGES);
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { interview_id, userName, userEmail } = body;
        const conversation = sanitizeConversation(body.conversation);

        if (typeof interview_id !== "string" || !interview_id) {
            return NextResponse.json({ error: "Interview id is required" }, { status: 400 });
        }
        if (!conversation.some((message) => message.role === "user")) {
            return NextResponse.json(
                { error: "No candidate answers were captured, so there is nothing to score." },
                { status: 400 }
            );
        }

        // Check the interview exists before spending an AI call on it. The session cookie
        // (if any) travels with this client, so the database knows who is submitting.
        const supabase = await createSupabaseServerClient();
        const { data: interview, error: interviewError } = await supabase.rpc("get_interview_public", {
            p_interview_id: interview_id,
        });
        if (interviewError) throw interviewError;
        if (!interview) {
            return NextResponse.json({ error: SAVE_ERRORS.INTERVIEW_NOT_FOUND.message }, { status: 404 });
        }

        const finalPrompt = FEEDBACK_PROMPT.replace(
            "{{conversation}}",
            JSON.stringify(conversation)
        );
        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Recruiter Voice Agent",
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
                            content: "Return only valid JSON. No markdown. Use the requested feedback schema.",
                        },
                        { role: "user", content: finalPrompt },
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

                const parsed = parseJsonContent(content);
                if (!parsed?.feedback) {
                    lastError = new Error("AI returned invalid feedback JSON");
                    continue;
                }

                const feedbackData = parsed.feedback;
                const recommendationText = String(feedbackData.recommendation || "");
                const { data: savedId, error: saveError } = await supabase.rpc("submit_interview_feedback", {
                    p_interview_id: interview_id,
                    p_user_name: typeof userName === "string" ? userName : null,
                    p_user_email: typeof userEmail === "string" ? userEmail : null,
                    p_feedback: feedbackData,
                    p_transcript: conversation,
                    p_recommended: recommendationText.toLowerCase() === "recommended",
                });

                if (saveError) {
                    console.error("Unable to save interview feedback:", saveError);
                    const known = Object.entries(SAVE_ERRORS).find(([code]) => saveError.message?.includes(code));
                    return NextResponse.json(
                        {
                            content: JSON.stringify(parsed),
                            error: known ? known[1].message : saveError.message,
                        },
                        { status: known ? known[1].status : 502 }
                    );
                }

                return NextResponse.json({
                    content: JSON.stringify(parsed),
                    saved: [{ id: savedId }],
                });
            } catch (error) {
                lastError = error;
                const status = error?.status || error?.statusCode;
                const isRateLimited =
                    status === 429 || String(error?.message || "").includes("429");
                if (isRateLimited) continue;
                throw error;
            }
        }

        return NextResponse.json(
            {
                error: lastError?.message || "Unable to generate valid interview feedback.",
                details: lastError?.message,
            },
            { status: lastError?.message === "AI returned invalid feedback JSON" ? 502 : 429 }
        );
    } catch (error) {
        console.error("Feedback generation failed:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to generate feedback" },
            { status: error?.status || 500 }
        );
    }
}