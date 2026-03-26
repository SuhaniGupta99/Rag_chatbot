import { useState, useEffect } from "react";
import { fonts } from "../theme";

export default function SettingsPanel({ theme, setTheme }) {

  const [model, setModel] = useState("phi3:mini");

  useEffect(() => {
    const saved = localStorage.getItem("selectedModel");
    if (saved) setModel(saved);
  }, []);

  const handleChange = (m) => {
    setModel(m);
    localStorage.setItem("selectedModel", m);
  };

  // 🔥 THEME HANDLER
  const changeTheme = (mode) => {
    setTheme(mode);
    localStorage.setItem("theme", mode);
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

      {/* 🔥 THEME SECTION */}
      <p style={{
        fontFamily:fonts.mono,
        fontSize:10,
        color:theme.textFaint,
        marginBottom:10,
      }}>
        THEME
      </p>

      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        <button
          onClick={() => changeTheme("dark")}
          style={{
            flex:1,
            padding:"10px",
            borderRadius:10,
            border:"none",
            background: theme.bg === "#0C0E14" ? theme.cyan : theme.surface,
            color: theme.bg === "#0C0E14" ? "#000" : theme.text,
            cursor:"pointer"
          }}
        >
          🌙 Dark
        </button>

        <button
          onClick={() => changeTheme("light")}
          style={{
            flex:1,
            padding:"10px",
            borderRadius:10,
            border:"none",
            background: theme.bg !== "#0C0E14" ? theme.cyan : theme.surface,
            color: theme.bg !== "#0C0E14" ? "#000" : theme.text,
            cursor:"pointer"
          }}
        >
          ☀️ Light
        </button>
      </div>

      {/* 🔥 MODEL SETTINGS */}
      <p style={{
        fontFamily:fonts.mono,
        fontSize:10,
        color:theme.textFaint,
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
              border:`1px solid ${model === m.id ? theme.cyan : theme.border}`,
              background: model === m.id ? `${theme.cyan}10` : theme.surface,
              transition:"all .2s",
            }}
          >
            <p style={{
              fontSize:14,
              fontWeight:600,
              color:theme.text,
              marginBottom:6
            }}>
              {m.label}
            </p>

            <p style={{
              fontSize:12,
              color:theme.textSub
            }}>
              {m.desc}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}