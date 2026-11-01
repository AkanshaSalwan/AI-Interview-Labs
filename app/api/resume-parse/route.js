import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
// Enough for a detailed resume while keeping the AI prompt small.
const MAX_TEXT_CHARS = 12000;

// Accepts a PDF resume (multipart field "file") and returns its plain text.
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
            return NextResponse.json({ error: "Please choose a PDF file." }, { status: 400 });
        }
        if (file.type !== "application/pdf" && !file.name?.toLowerCase().endsWith(".pdf")) {
            return NextResponse.json({ error: "Only PDF resumes are supported." }, { status: 400 });
        }
        if (file.size > MAX_FILE_BYTES) {
            return NextResponse.json({ error: "The file is larger than 5 MB." }, { status: 400 });
        }

        const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
        const { text } = await extractText(pdf, { mergePages: true });
        const cleaned = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

        if (cleaned.length < 50) {
            return NextResponse.json(
                { error: "We couldn't read any text from this PDF. Is it a scanned image?" },
                { status: 422 }
            );
        }

        return NextResponse.json({
            text: cleaned.slice(0, MAX_TEXT_CHARS),
            pages: pdf.numPages,
            words: cleaned.split(/\s+/).length,
        });
    } catch (error) {
        console.error("Resume parsing failed:", error);
        return NextResponse.json({ error: "Unable to read this PDF." }, { status: 500 });
    }
}
