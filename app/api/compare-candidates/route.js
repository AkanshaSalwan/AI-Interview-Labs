import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/services/supabaseServer";

// HR picks 2–3 finished candidates; the AI says who to move forward and why.
// Reports are read with the recruiter's own session, so row-level security only allows their own candidates.

const FREE_MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "openrouter/free",
];

const COMPARE_PROMPT = `You are helping a recruiter choose between candidates who took an AI interview.
Each candidate below has scores out of 10 and the interviewer's notes.
Pick the ONE candidate the recruiter should move forward, weighing skills, communication and the notes, not just the average.
Return ONLY valid JSON in this shape:
{"bestId": <id of the chosen candidate>, "verdict": "<one sentence on why they are the best choice>", "candidates": [{"id": <id>, "note": "<one short sentence: their main strength or risk compared with the others>"}]}

Candidates:
{{candidates}}`;

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

// What the AI sees per candidate: scores and the existing report text, trimmed to keep the prompt small.
function describe(row) {
    const feedback = row.feedback ?? {};
    return {
        id: row.id,
        name: row.userName || "Candidate",
        ratings: feedback.rating ?? {},
        recommendation: feedback.recommendation,
        summary: String(feedback.summary ?? "").slice(0, 800),
        strengths: (feedback.strengths ?? []).slice(0, 4),
        improvements: (feedback.improvements ?? []).slice(0, 4),
    };
}

export async function POST(request) {
    try {
        const { reportIds } = await request.json();
        const ids = [...new Set((Array.isArray(reportIds) ? reportIds : []).map(Number).filter(Number.isInteger))];
        if (ids.length < 2 || ids.length > 3) {
            return NextResponse.json({ error: "Pick 2 or 3 candidates to compare" }, { status: 400 });
        }

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Sign in to compare candidates" }, { status: 401 });
        }

        const { data: rows, error: readError } = await supabase
            .from("interview feedback")
            .select("id, userName, feedback")
            .in("id", ids);
        if (readError) throw readError;
        if (!rows || rows.length !== ids.length) {
            return NextResponse.json({ error: "Some of these reports are not available to you" }, { status: 404 });
        }

        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
            defaultHeaders: { "HTTP-Referer": "https://ai-interview-labs.vercel.app", "X-Title": "AI Interview Labs" },
        });
        const prompt = COMPARE_PROMPT.replace("{{candidates}}", JSON.stringify(rows.map(describe), null, 2));

        let lastError = null;
        for (const model of FREE_MODELS) {
            try {
                const completion = await openai.chat.completions.create({
                    model,
                    messages: [
                        { role: "system", content: "Return only valid JSON. No markdown." },
                        { role: "user", content: prompt },
                    ],
                });
                const message = completion.choices?.[0]?.message;
                const content = Array.isArray(message?.content)
                    ? message.content.map((part) => part?.text || "").join("\n")
                    : message?.content;
                const result = parseJsonContent(content || "");
                const bestId = Number(result?.bestId);

                if (!ids.includes(bestId) || typeof result?.verdict !== "string") {
                    lastError = new Error("AI returned an invalid comparison");
                    continue;
                }

                const notes = Object.fromEntries(
                    (Array.isArray(result.candidates) ? result.candidates : [])
                        .filter((item) => ids.includes(Number(item?.id)) && typeof item?.note === "string")
                        .map((item) => [Number(item.id), item.note])
                );
                return NextResponse.json({ bestId, verdict: result.verdict, notes });
            } catch (error) {
                lastError = error;
                const status = error?.status || error?.statusCode;
                if (status === 429 || String(error?.message || "").includes("429")) continue;
                throw error;
            }
        }

        return NextResponse.json(
            { error: "The AI is busy right now. Wait a minute and try again.", details: lastError?.message },
            { status: 429 }
        );
    } catch (error) {
        console.error("Candidate comparison failed:", error);
        return NextResponse.json({ error: error?.message || "Could not compare candidates" }, { status: 500 });
    }
}
