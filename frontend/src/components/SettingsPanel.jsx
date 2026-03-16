import { useState } from "react";
import { C, fonts } from "../theme";

const Toggle = ({ on, set }) => (
  <div onClick={() => set(!on)} style={{
    width:42, height:24, borderRadius:99,
    background: on ? C.cyan : C.border,
    position:"relative", cursor:"pointer", transition:"background .2s",
  }}>
    <div style={{
      position:"absolute", top:3,
      left: on ? 20 : 3,
      width:18, height:18, borderRadius:"50%",
      background: on ? "#000" : "#fff",
      transition:"left .2s",
    }}/>
  </div>
);

const Row = ({ label, sub, children }) => (
  <div style={{
    display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"14px 0", borderBottom:`1px solid ${C.border}`,
  }}>
    <div>
      <p style={{ fontSize:13, fontWeight:500, color:C.text }}>{label}</p>
      {sub && <p style={{ fontSize:11, color:C.textFaint, marginTop:2 }}>{sub}</p>}
    </div>
    {children}
  </div>
);

export default function SettingsPanel() {
  const [model,  setModel]  = useState("gpt-4o");
  const [topK,   setTopK]   = useState(3);
  const [temp,   setTemp]   = useState(0.7);
  const [stream, setStream] = useState(true);
  const [cite,   setCite]   = useState(true);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
      <p style={{
        fontFamily:fonts.mono, fontSize:10,
        color:C.textFaint, letterSpacing:1, marginBottom:20,
      }}>SETTINGS</p>

      {/* Model picker */}
      <div style={{
        background:C.surface, border:`1px solid ${C.border}`,
        borderRadius:14, padding:"18px 20px", marginBottom:14,
      }}>
        <p style={{ fontSize:12, color:C.textSub, marginBottom:12, fontWeight:600 }}>
          Language Model
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {["gpt-4o", "gpt-3.5-turbo", "claude-3.5", "gemini-1.5"].map(m => (
            <button key={m} onClick={() => setModel(m)} style={{
              padding:"10px 14px", borderRadius:10, textAlign:"left",
              border:`1px solid ${model===m ? C.cyan : C.border}`,
              background: model===m ? `${C.cyan}12` : "transparent",
              color: model===m ? C.cyan : C.textSub,
              fontSize:13, fontFamily:fonts.mono,
              cursor:"pointer", transition:"all .18s",
            }}>
              {m} {model===m && "✓"}
            </button>
          ))}
        </div>
      </div>

      {/* Retrieval + Interface */}
      <div style={{
        background:C.surface, border:`1px solid ${C.border}`,
        borderRadius:14, padding:"4px 20px 8px",
      }}>
        <Row label="Top-K Sources" sub="Number of chunks retrieved per query">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <input type="range" min={1} max={10} step={1} value={topK}
              onChange={e => setTopK(+e.target.value)}
              style={{ width:100, accentColor:C.cyan }}/>
            <span style={{
              fontFamily:fonts.mono, fontSize:13,
              color:C.cyan, minWidth:18,
            }}>{topK}</span>
          </div>
        </Row>

        <Row label="Temperature" sub="Controls creativity vs accuracy">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <input type="range" min={0} max={1} step={0.1} value={temp}
              onChange={e => setTemp(parseFloat(e.target.value))}
              style={{ width:100, accentColor:C.cyan }}/>
            <span style={{
              fontFamily:fonts.mono, fontSize:13,
              color:C.cyan, minWidth:24,
            }}>{temp}</span>
          </div>
        </Row>

        <Row label="Stream responses" sub="Show answer as it generates">
          <Toggle on={stream} set={setStream}/>
        </Row>

        <Row label="Source citations" sub="Show sources under each answer">
          <Toggle on={cite} set={setCite}/>
        </Row>
      </div>
    </div>
  );
}