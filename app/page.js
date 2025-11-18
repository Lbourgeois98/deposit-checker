"use client";

import React, { useState, useRef } from "react";

/* PAYMENT METHODS + BRAND PALETTES */

const PAYMENT_METHODS = [
  { id: "paypal", label: "PayPal" },
  { id: "cashapp", label: "Cash App" },
  { id: "venmo", label: "Venmo" },
  { id: "zelle", label: "Zelle" },
  { id: "applepay", label: "Apple Pay" },
  { id: "chime", label: "Chime" }
];

const BRAND_COLORS = {
  paypal: ["#003087", "#0070ba", "#001c64"],
  cashapp: ["#00d632", "#00c244"],
  venmo: ["#3d95ce", "#008cff"],
  zelle: ["#6d1ed4", "#7b3de3"],
  applepay: ["#000000", "#222222", "#555555"],
  chime: ["#00d08a", "#00e28a", "#00c27a"]
};

/* HELPERS */

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function colorDistance(a, b) {
  return Math.sqrt(
    (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
  );
}

function getMethodLabel(id) {
  const m = PAYMENT_METHODS.find((m) => m.id === id);
  return m ? m.label : id;
}

function getScoreFillClass(score) {
  if (score >= 75) return "score-fill score-good";
  if (score >= 45) return "score-fill score-mid";
  return "score-fill score-bad";
}

function getBadgeClass(score) {
  if (score >= 75) return "badge badge-good";
  if (score >= 45) return "badge badge-mid";
  return "badge badge-bad";
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* MAIN COMPONENT */

export default function HomePage() {
  const [method, setMethod] = useState("paypal");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const origCanvasRef = useRef(null);
  const elaCanvasRef = useRef(null);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
    setResult(null);
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!file || !previewUrl) {
      alert("Upload a screenshot first.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const img = await loadImage(previewUrl);

      const origCanvas = origCanvasRef.current;
      const origCtx = origCanvas.getContext("2d");
      const elaCanvas = elaCanvasRef.current;
      const elaCtx = elaCanvas.getContext("2d");

      const maxWidth = 450;
      const scale = Math.min(maxWidth / img.width, 1);
      const w = Math.floor(img.width * scale);
      const h = Math.floor(img.height * scale);

      origCanvas.width = w;
      origCanvas.height = h;
      elaCanvas.width = w;
      elaCanvas.height = h;

      // draw original
      origCtx.drawImage(img, 0, 0, w, h);
      const origData = origCtx.getImageData(0, 0, w, h).data;

      /* 1) COLOR MATCH SCORE */

      const brandHexList = BRAND_COLORS[method] || [];
      const brandColors = brandHexList.map(hexToRgb);

      let brandish = 0;
      let total = 0;
      const STEP = 7;

      let brightnessValues = [];
      let diffValues = [];

      for (let y = 0; y < h; y += STEP) {
        for (let x = 0; x < w; x += STEP) {
          const idx = (y * w + x) * 4;
          const r = origData[idx];
          const g = origData[idx + 1];
          const b = origData[idx + 2];

          const pixel = { r, g, b };
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          brightnessValues.push(brightness);

          let minDist = Infinity;
          for (const bc of brandColors) {
            const d = colorDistance(pixel, bc);
            if (d < minDist) minDist = d;
          }
          if (minDist < 60) brandish++;

          if (x + STEP < w) {
            const idx2 = (y * w + (x + STEP)) * 4;
            const r2 = origData[idx2];
            const g2 = origData[idx2 + 1];
            const b2 = origData[idx2 + 2];
            const b2v = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;
            diffValues.push(Math.abs(brightness - b2v));
          }

          total++;
        }
      }

      const colorRatio = total > 0 ? brandish / total : 0;
      const colorMatchPercent = Math.round(colorRatio * 100);

      /* 2) BRIGHTNESS UNIFORMITY SCORE */

      let brightnessScore = 60;
      if (brightnessValues.length > 0) {
        const meanB =
          brightnessValues.reduce((a, b) => a + b, 0) /
          brightnessValues.length;
        const varB =
          brightnessValues.reduce(
            (acc, v) => acc + (v - meanB) ** 2,
            0
          ) / brightnessValues.length;
        const stdB = Math.sqrt(varB);

        if (stdB >= 20 && stdB <= 80) brightnessScore = 100;
        else if (stdB >= 10 && stdB <= 100) brightnessScore = 70;
        else brightnessScore = 40;
      }

      /* 3) SHARPNESS SCORE */

      let sharpnessScore = 60;
      if (diffValues.length > 0) {
        const meanDiff =
          diffValues.reduce((a, b) => a + b, 0) / diffValues.length;

        if (meanDiff >= 8 && meanDiff <= 35) sharpnessScore = 100;
        else if (meanDiff >= 5 && meanDiff <= 45) sharpnessScore = 70;
        else sharpnessScore = 40;
      }

      /* 4) ELA-LIKE SCORE (Photoshop-ish alterations) */

      // compress to jpeg and re-draw
      const jpegDataUrl = origCanvas.toDataURL("image/jpeg", 0.7);
      const jpegImg = await loadImage(jpegDataUrl);
      elaCtx.drawImage(jpegImg, 0, 0, w, h);
      const elaData = elaCtx.getImageData(0, 0, w, h).data;

      let elaDiffs = [];
      for (let i = 0; i < origData.length; i += 4 * STEP) {
        const r1 = origData[i];
        const g1 = origData[i + 1];
        const b1 = origData[i + 2];

        const r2 = elaData[i];
        const g2 = elaData[i + 1];
        const b2 = elaData[i + 2];

        const d =
          (Math.abs(r1 - r2) +
            Math.abs(g1 - g2) +
            Math.abs(b1 - b2)) / 3;
        elaDiffs.push(d);
      }

      let elaScore = 60;
      if (elaDiffs.length > 0) {
        const meanEla =
          elaDiffs.reduce((a, b) => a + b, 0) / elaDiffs.length;

        // Very rough heuristic:
        // natural images usually have moderate error after recompression.
        // Very low or very high error can mean heavy editing / weird artifacts.
        if (meanEla >= 6 && meanEla <= 26) elaScore = 100;
        else if (meanEla >= 3 && meanEla <= 35) elaScore = 70;
        else elaScore = 40;
      }

      /* 5) FINAL AUTHENTICITY SCORE (0–100, higher = looks more real) */

      const authenticityScore = Math.round(
        colorMatchPercent * 0.4 +
          brightnessScore * 0.2 +
          sharpnessScore * 0.2 +
          elaScore * 0.2
      );

      let summary;
      if (authenticityScore >= 75) {
        summary =
          "This screenshot visually looks like a normal " +
          getMethodLabel(method) +
          " payment screen. It could still be fake, but nothing obvious stands out from the image alone.";
      } else if (authenticityScore >= 45) {
        summary =
          "Mixed signals. Parts of this look like " +
          getMethodLabel(method) +
          ", but there are also possible visual red flags. Double-check inside the real payment app before trusting it.";
      } else {
        summary =
          "High visual risk. Colors, sharpness, or compression artifacts do not look like a typical " +
          getMethodLabel(method) +
          " screenshot. Treat this as suspicious and verify directly in the app.";
      }

      setResult({
        authenticityScore,
        colorMatchPercent,
        brightnessScore,
        sharpnessScore,
        elaScore,
        summary
      });
    } catch (err) {
      console.error(err);
      alert("Something went wrong reading the image. Try another screenshot.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-root">
      <div className="card">
        <h1>Neon Payment Checker</h1>
        <p className="card-subtitle">
          Upload a payment screenshot (PayPal, Cash App, Venmo, Zelle, Apple Pay, or
          Chime) and get a visual authenticity score. Higher = looks more legit.
        </p>

        <form onSubmit={handleAnalyze} style={{ marginTop: 18 }}>
          <div className="form-row">
            <div className="label">Payment method</div>
            <select
              className="select"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="label">Payment screenshot</div>
            <input
              type="file"
              accept="image/*"
              className="file-input"
              onChange={handleFileChange}
            />
            <div className="helper-text">
              Full-screen or nearly full screenshots work best. Extremely cropped or
              heavily filtered images are harder to read and usually score lower.
            </div>
          </div>

          {previewUrl && (
            <div className="preview-wrapper">
              <div className="label">Preview</div>
              <div className="preview-inner">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="preview-img"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="button"
            disabled={loading || !file}
          >
            {loading ? "Analyzing..." : "Analyze Screenshot"}
          </button>
        </form>

        {result && (
          <div className="result-box">
            <div className="result-title">
              Authenticity Score: {result.authenticityScore}/100
              <span className={getBadgeClass(result.authenticityScore)}>
                {result.authenticityScore >= 75
                  ? "Looks Visually Legit"
                  : result.authenticityScore >= 45
                  ? "Mixed / Check Carefully"
                  : "High Visual Risk"}
              </span>
            </div>

            <div className="score-bar">
              <div
                className={getScoreFillClass(result.authenticityScore)}
                style={{ width: `${result.authenticityScore}%` }}
              />
            </div>

            <div className="result-detail">{result.summary}</div>

            <div className="result-subscore">
              • Brand color match:{" "}
              <strong>{result.colorMatchPercent}% of sampled pixels</strong>
            </div>
            <div className="result-subscore">
              • Brightness consistency score:{" "}
              <strong>{result.brightnessScore}/100</strong>
            </div>
            <div className="result-subscore">
              • Sharpness / blur score:{" "}
              <strong>{result.sharpnessScore}/100</strong>
            </div>
            <div className="result-subscore">
              • Compression / edit-artifact score:{" "}
              <strong>{result.elaScore}/100</strong>
            </div>

            <div className="result-detail" style={{ marginTop: 8 }}>
              No image tool can 100% guarantee if a payment is real. Always confirm
              inside the actual payment app or your transaction history before you
              trust someone.
            </div>
          </div>
        )}

        {/* Hidden canvases for analysis */}
        <canvas
          ref={origCanvasRef}
          style={{ display: "none" }}
          width={10}
          height={10}
        />
        <canvas
          ref={elaCanvasRef}
          style={{ display: "none" }}
          width={10}
          height={10}
        />
      </div>
    </div>
  );
}
