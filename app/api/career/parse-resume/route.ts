import { NextRequest, NextResponse } from "next/server";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

interface WorkExp {
  company: string;
  role: string;
  duration_months: number;
}

/* ---------------- Helpers ---------------- */

function extractName(lines: string[]): string {
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();

    if (
      line &&
      !line.toLowerCase().includes("resume") &&
      !line.includes("@") &&
      !/\d{3,}/.test(line)
    ) {
      return line;
    }
  }
  return "";
}

function extractSkills(text: string): string[] {
  const match = text.match(/skills([\s\S]*?)(experience|education|$)/i);
  if (!match) return [];

  return match[1]
    .split(/[\n,•\-]/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 1 && s.length < 30)
    .slice(0, 15);
}

function extractEducation(text: string) {
  const lower = text.toLowerCase();

  let current_level = "";
  if (lower.includes("phd")) current_level = "PhD";
  else if (lower.includes("master")) current_level = "Master";
  else if (lower.includes("bachelor")) current_level = "Bachelor";
  else if (lower.includes("diploma")) current_level = "Diploma";
  else if (lower.includes("spm")) current_level = "SPM";

  const institutionMatch = text.match(
    /(university|universiti|college|kolej)[^\n]*/i
  );

  return {
    current_level,
    institution: institutionMatch ? institutionMatch[0].trim() : "",
  };
}

function extractWorkExperience(text: string): WorkExp[] {
  const match = text.match(/experience([\s\S]*?)(education|skills|$)/i);
  if (!match) return [];

  const lines = match[1]
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  const results: WorkExp[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.length > 3 && line.length < 100) {
      results.push({
        company: line,
        role: lines[i + 1] || "",
        duration_months: 0,
      });
      i++;
    }

    if (results.length >= 3) break;
  }

  return results;
}

/* ---------------- Route ---------------- */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const file: string | undefined = body.file;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    /* ---------------- PDF SETUP ---------------- */

    /* force no-worker mode (this is the missing piece) */
    const data = Uint8Array.from(Buffer.from(file, "base64"));

    const loadingTask = pdfjsLib.getDocument({
      data,
      isEvalSupported: false,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;

    /* ---------------- Extract text ---------------- */

    let rawText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const pageText = content.items
          .map((item: any) => item?.str || "")
          .join(" ");

        rawText += pageText + "\n";
      } catch (err) {
        console.warn(`Skipping page ${i}`);
      }
    }

    /* ---------------- Clean text ---------------- */

    const cleaned = rawText
      .replace(/\r/g, "")
      .replace(/\u0000/g, "")
      .trim();

    const lines = cleaned
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);

    /* ---------------- Extract structured data ---------------- */

    const full_name = extractName(lines);
    const current_skills = extractSkills(cleaned);
    const { current_level, institution } = extractEducation(cleaned);
    const work_experience = extractWorkExperience(cleaned);

    return NextResponse.json({
      data: {
        full_name,
        current_level,
        field_of_study: "",
        institution,
        current_skills,
        work_experience,
      },
    });
  } catch (error) {
    console.error("Parse resume error:", error);

    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}