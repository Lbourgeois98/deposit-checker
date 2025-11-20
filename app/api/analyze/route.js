import { NextResponse } from "next/server";
import exifr from "exifr";

export const runtime = "nodejs"; // Allows backend processing on Vercel
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract EXIF metadata
    const metadata = await exifr.parse(buffer).catch(() => null);

    let status = "⚠️ Possibly edited or screenshot";
    if (metadata?.Make || metadata?.Model) {
      status = "✅ Likely original capture";
    }

    return NextResponse.json({ status, metadata });
  } catch (error) {
    return NextResponse.json({ message: "Error analyzing file", error: error.toString() }, { status: 500 });
  }
}
