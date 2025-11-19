import { NextResponse } from "next/server";
import exifr from "exifr";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");
    const buffer = Buffer.from(await file.arrayBuffer());

    const metadata = await exifr.parse(buffer).catch(() => null);
    const imageInfo = await sharp(buffer).metadata();

    let issues = [];

    if (!metadata) issues.push("❌ No EXIF data — likely edited or screenshot");
    if (metadata && metadata.Software) issues.push(`⚠ Edited using ${metadata.Software}`);
    if (imageInfo.width < 500) issues.push("❌ Resolution too low — possibly cropped");
    if (imageInfo.compression) issues.push("⚠ Double compression detected");

    let verdict = issues.length === 0
      ? "✔ Looks like an original screenshot"
      : issues.join("\n");

    return NextResponse.json({ message: verdict });
  } catch (err) {
    return NextResponse.json({ message: "Error processing image" }, { status: 500 });
  }
}
