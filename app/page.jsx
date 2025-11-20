"use client";
import { useState } from "react";

export default function HomePage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");

  const analyze = async () => {
    const formData = new FormData();
    formData.append("file", image);

    const res = await fetch("/api/analyze", { method: "POST", body: formData });
    const data = await res.json();
    setResult(data.status);
  };

  return (
    <main style={{
      textAlign: "center",
      padding: "50px",
      background: "black",
      minHeight: "100vh",
      color: "#39ff14",
      fontFamily: "monospace",
      backgroundImage: "url('/background.png')",
      backgroundSize: "cover"
    }}>
      <img src="/logo.png" width="200" style={{ marginBottom: "20px" }} />
      <h1 style={{ fontSize: "48px", color: "#cd00ff", textShadow: "0px 0px 10px #ff00ff" }}>
        💸 Deposit Analyzer
      </h1>

      <p>Upload a payment screenshot. We’ll try to detect if it’s a real original or possibly edited.</p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        style={{ marginTop: "20px" }}
      />
      <br /><br />
      <button
        onClick={analyze}
        style={{
          padding: "15px 30px",
          fontSize: "20px",
          background: "#cd00ff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          textShadow: "0px 0px 6px #39ff14"
        }}
      >
        Analyze Screenshot 🔍
      </button>

      {result && <p style={{ marginTop: "40px", fontSize: "28px" }}>{result}</p>}
    </main>
  );
}
