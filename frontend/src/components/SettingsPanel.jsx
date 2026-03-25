import { useState, useEffect } from "react";
import { C, fonts } from "../theme";

export default function SettingsPanel() {

  const [model, setModel] = useState("phi3:mini");

  useEffect(() => {
    const saved = localStorage.getItem("selectedModel");
    if (saved) setModel(saved);
  }, []);

  const handleChange = (m) => {
    setModel(m);
    localStorage.setItem("selectedModel", m);
  };

  const models = [
    {
      id: "phi3:mini",
      label: "⚖️ Balanced (Phi-3 Mini)",
      desc: "Good balance of speed and quality"
    },
    {
      id: "tinyllama:latest",
      label: "⚡ Fast (TinyLLaMA)",
      desc: "Very fast, lightweight model for quick responses"
    },
    {
      id: "llama3:8b-instruct-q4_0",
      label: "🧠 Smart (LLaMA 3)",
      desc: "Best reasoning and accuracy"
    }
  ];

  return (
    <div style={{ flex:1, padding:"24px" }}>

      <p style={{
        fontFamily:fonts.mono,
        fontSize:10,
        color:C.textFaint,
        marginBottom:16,
      }}>
        MODEL SETTINGS
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

        {models.map(m => (
          <div
            key={m.id}
            onClick={() => handleChange(m.id)}
            style={{
              padding:"16px",
              borderRadius:14,
              cursor:"pointer",
              border:`1px solid ${model === m.id ? C.cyan : C.border}`,
              background: model === m.id ? `${C.cyan}10` : C.surface,
              transition:"all .2s",
            }}
          >
            <p style={{
              fontSize:14,
              fontWeight:600,
              color:C.text,
              marginBottom:6
            }}>
              {m.label}
            </p>

            <p style={{
              fontSize:12,
              color:C.textSub
            }}>
              {m.desc}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}