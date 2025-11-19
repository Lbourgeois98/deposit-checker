"use client";
import { useState } from "react";
import Image from "next/image";

export default function HomePage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");

  const analyze = async () => {
    if (!image) return alert("Upload a screenshot first!");

    const formData = new FormData();
    formData.append("file", image);

    const res = await fetch("/api/analyze", { method: "POST", body: formData });
    const data = await res.json();

    setResult(data.message);
  };

  return (
    <main>
      <Image src="/logo.png" className="logo" width={200} height={200} alt="logo" />
      <h1 className="cyber-title">💸 Deposit Analyzer</h1>
      <p>Upload a screenshot. We’ll detect if it’s original or edited.</p>

      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
      <br /><br />

      <button onClick={analyze}>Analyze Screenshot 🔍</button>

      {result && (
        <p style={{ marginTop: "40px", fontSize: "28px", color: "white" }}>
          {result}
        </p>
      )}
    </main>
  );
}
