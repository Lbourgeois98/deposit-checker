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
    setResult(data.message);
  };

  return (
    <main style={{ textAlign: "center", padding: "50px" }}>
      <h1 style={{ fontSize: "48px" }}>💸 Deposit Analyzer</h1>
      <p>Upload a payment screenshot. We'll check if it's an original or edited.</p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />
      <br /><br />
      <button onClick={analyze}>Analyze Screenshot 🔍</button>

      {result && <p style={{ marginTop: "40px", fontSize: "24px" }}>{result}</p>}
    </main>
  );
}
