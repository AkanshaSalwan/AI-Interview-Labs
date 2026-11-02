import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/services/supabaseServer";

// One-time rewrite of an older practice report into the second person ("you").
// Only wording changes; scores and questions are kept by rewrite_practice_feedback() (migration 007).

const FREE_MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "openrouter/free",
];

const REWRITE_PROMPT = `You are editing an interview-practice report that the candidate will read themselves.
Rewrite every string in the JSON below in the second person, speaking directly to the candidate: use "you" and "your".
Replace "the candidate", the candidate's name, and "they/them/their" whenever they refer to the candidate.
Keep the meaning, facts and tone exactly. Do not add, remove, merge or reorder points.
Return ONLY valid JSON with exactly the same keys, the same array lengths and the same order.

{{texts}}`;

function parseJsonContent(content) {
    const cleaned = String(content).replace(/```json/gi, "").replace(/```/g, "").trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try {
            return JSON.parse(match[0]);
        } catch {
            return null;
        }
    }
}

const isString = (value) => typeof value === "string" && value.trim() !== "";
const stringList = (value) => (Array.isArray(value) ? value.filter(isString) : undefined);

// The wording the AI is allowed to change.
function extractTexts(feedback) {
    return {
        summary: feedback.summary,
        recommendationMessage: feedback.recommendationMessage,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        questionFeedback: Array.isArray(feedback.questionFeedback)
            ? feedback.questionFeedback.map((item) => ({
                answerSummary: item?.answerSummary,
                whatWentWell: item?.whatWentWell,
                toImprove: item?.toImprove,
            }))
            : undefined,
    };
}

// Reject answers that changed the shape (lost points or questions); keep only strings.
function validateTexts(original, rewritten) {
    if (!rewritten || typeof rewritten !== "object") return null;
    const sameLength = (key) => !Array.isArray(original[key]) || (Array.isArray(rewritten[key]) && rewritten[key].length === original[key].length);
    if (!sameLength("strengths") || !sameLength("improvements") || !sameLength("questionFeedback")) return null;

    return {
        summary: isString(rewritten.summary) ? rewritten.summary : undefined,
        recommendationMessage: isString(rewritten.recommendationMessage) ? rewritten.recommendationMessage : undefined,
        strengths: original.strengths ? stringList(rewritten.strengths) : undefined,
        improvements: original.improvements ? stringList(rewritten.improvements) : undefined,
        questionFeedback: original.questionFeedback
            ? rewritten.questionFeedback.map((item) => ({
                answerSummary: isString(item?.answerSummary) ? item.answerSummary : undefined,
                whatWentWell: isString(item?.whatWentWell) ? item.whatWentWell : undefined,
                toImprove: isString(item?.toImprove) ? item.toImprove : undefined,
            }))
            : undefined,
    };
}

export async function POST(request) {
    try {
        const { feedback_id } = await request.json();
        const feedbackId = Number(feedback_id);
        if (!Number.isInteger(feedbackId)) {
            return NextResponse.json({ error: "Feedback id is required" }, { status: 400 });
        }

        // Signed-in client: row-level security only returns the candidate's own practice reports.
        const supabase = await createSupabaseServerClient();
        const { data: row, error: readError } = await supabase
            .from("interview feedback")
            .select("id, feedback")
            .eq("id", feedbackId)
            .maybeSingle();
        if (readError) throw readError;
        if (!row?.feedback) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }
        if (row.feedback.voice === "you") {
            return NextResponse.json({ feedback: row.feedback, rewritten: false });
        }

        const original = extractTexts(row.feedback);
        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
            defaultHeaders: { "HTTP-Referer": "http://localhost:3000", "X-Title": "AI Interview Labs" },
        });

        let texts = null;
        let lastError = null;
        for (const model of FREE_MODELS) {
            try {
                const completion = await openai.chat.completions.create({
                    model,
                    messages: [
                        { role: "system", content: "Return only valid JSON. No markdown." },
                        { role: "user", content: REWRITE_PROMPT.replace("{{texts}}", JSON.stringify(original)) },
                    ],
                });
                const message = completion.choices?.[0]?.message;
                const content = Array.isArray(message?.content)
                    ? message.content.map((part) => part?.text || "").join("\n")
                    : message?.content;
                texts = validateTexts(original, parseJsonContent(content || ""));
                if (texts) break;
                lastError = new Error("AI returned an invalid rewrite");
            } catch (error) {
                lastError = error;
                const status = error?.status || error?.statusCode;
                if (status === 429 || String(error?.message || "").includes("429")) continue;
                throw error;
            }
        }
        if (!texts) {
            return NextResponse.json({ error: lastError?.message || "Unable to rewrite this report" }, { status: 502 });
        }

        const { data: updated, error: saveError } = await supabase.rpc("rewrite_practice_feedback", {
            p_feedback_id: feedbackId,
            p_texts: texts,
        });
        if (saveError) {
            const status = saveError.message?.includes("NOT_YOUR_PRACTICE_REPORT") ? 403 : 502;
            return NextResponse.json({ error: saveError.message }, { status });
        }

        return NextResponse.json({ feedback: updated, rewritten: true });
    } catch (error) {
        console.error("Practice feedback rewrite failed:", error);
        return NextResponse.json({ error: error?.message || "Rewrite failed" }, { status: error?.status || 500 });
    }
}
