import { NextResponse } from "next/server";
import exifr from "exifr";
import * as Jimp from "jimp";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ message: "No file uploaded." });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1) EXIF metadata
    const metadata = await exifr.parse(buffer).catch(() => null);
    let metadataStatus = metadata ? "EXIF found (likely real)" : "No EXIF (possibly edited)";

    // 2) Pixel analysis for editing artifacts
    const image = await Jimp.read(buffer);
    let suspicious = 0;

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const diff = Math.abs(this.bitmap.data[idx] - this.bitmap.data[idx + 1]);
      if (diff > 40) suspicious++;
    });

    let totalPixels = image.bitmap.width * image.bitmap.height;
    let tamperLevel = (suspicious / totalPixels) * 100;

    let verdict =
      tamperLevel > 0.2 || !metadata
        ? "⚠️ Possible manipulation"
        : "🟢 Looks like an original screenshot";

    return NextResponse.json({
      message: `${verdict}\n📊 EXIF: ${metadataStatus}\n🔎 Tampering score: ${tamperLevel.toFixed(2)}%`,
    });
  } catch (err) {
    return NextResponse.json({ message: "❌ Error analyzing image" });
  }
}
