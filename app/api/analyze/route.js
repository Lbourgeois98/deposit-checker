import { NextResponse } from "next/server";
import exifr from "exifr";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const data = await req.formData();
    const file = data.get("file");
    if (!file) return NextResponse.json({ message: "No file uploaded." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await exifr.parse(buffer).catch(() => null);

    let message = "⚠ Possibly edited - no metadata.";
    if (meta) {
      if (meta.Software && meta.Software.toLowerCase().includes("photoshop")) {
        message = "❌ Likely edited in Photoshop.";
      } else {
        message = "✔ Appears original (has metadata).";
      }
    }

    return NextResponse.json({ message });
  } catch (err) {
    return NextResponse.json({ message: "Error analyzing image." }, { status: 500 });
  }
}
