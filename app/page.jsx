"use client";

import { useState } from "react";

export default function HomePage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!image) {
      alert("Upload an image first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", image);

    const res = await fetch("/api/analyze", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    setResult(data.message);
    setLoading(false);
  };

  return (
    <main style={{
      textAlign: "center",
      padding: "50px",
      fontFamily: "Arial",
      background: "linear-gradient(180deg,#0a0018,#24003b)",
      minHeight: "100vh"
    }}>
      {/* Logo */}
      <img src="/logo.png" width="200" style={{ marginBottom: "20px", filter: "drop-shadow(0 0 20px #39ff14)" }} />

      <h1 style={{
        fontSize: "48px",
        color: "#39ff14",
        textShadow: "0 0 15px #39ff14"
      }}>💸 Deposit Analyzer</h1>

      <p style={{ color: "#e4ff4f" }}>
        Upload a payment screenshot — we’ll check if it's original or altered.
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        style={{ marginTop: "20px" }}
      />

      <br /><br />
      <button
        onClick={analyze}
        disabled={loading}
        style={{
          padding: "12px 24px",
          fontSize: "18px",
          background: "#6600ff",
          color: "white",
          borderRadius: "10px",
          cursor: "pointer",
          border: "none",
          boxShadow: "0 0 20px #6600ff",
        }}
      >
        {loading ? "Analyzing..." : "Analyze Screenshot 🔍"}
      </button>

      {result && <p style={{ fontSize: "28px", marginTop: "30px" }}>{result}</p>}
    </main>
  );
}
