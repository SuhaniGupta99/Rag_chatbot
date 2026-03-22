import { useState } from "react";
import { C, fonts } from "./theme";
import Sidebar from "./components/Sidebar";
import HomePage from "./components/HomePage";
import SourcesPanel from "./components/SourcesPanel";
import SettingsPanel from "./components/SettingsPanel";

export default function App() {
  const [activeSession, setActiveSession] = useState(
  localStorage.getItem("activeSession") || null
);
  const [view, setView] = useState("chat");
  

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=Fira+Code:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; }
        body { background:${C.bg}; color:${C.text}; font-family:${fonts.body}; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:99px; }
        button { cursor:pointer; font-family:${fonts.body}; }
        textarea { font-family:${fonts.body}; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes dot {
          0%,80%,100% { transform:scale(0); opacity:.3; }
          40%          { transform:scale(1); opacity:1;  }
        }
      `}</style>

      <div style={{
        display:"flex",
        height:"100vh",
        width:"100vw",
        overflow:"hidden",
        background:C.bg,
      }}>
        {/* Sidebar — always visible */}
        <Sidebar
          view={view}
          setView={setView}
          activeSession={activeSession}
          setActiveSession={setActiveSession}
        />

        {/* Main content area */}
        {view === "chat" && (
  <HomePage
    activeSession={activeSession}
    setActiveSession={setActiveSession}
  />
)}

        {(view === "sources" || view === "settings") && (
          <div style={{
            flex:1,
            display:"flex",
            flexDirection:"column",
            overflow:"hidden",
            background:C.bg,
          }}>
            {/* Page header */}
            <div style={{
              padding:"14px 24px",
              background:C.surface,
              borderBottom:`1px solid ${C.border}`,
              flexShrink:0,
            }}>
              <span style={{
                fontFamily:fonts.display,
                fontWeight:700, fontSize:16, color:C.text,
              }}>
                {view === "sources" ? "📄 Retrieved Sources" : "⚙️ Settings"}
              </span>
              <p style={{
                fontSize:11, color:C.textFaint,
                fontFamily:fonts.mono, marginTop:2,
              }}>
                {view === "sources"
                  ? "Most recent retrieval — ranked by relevance score"
                  : "Configure your RAG chatbot experience"}
              </p>
            </div>

            {view === "sources"  && <SourcesPanel />}
            {view === "settings" && <SettingsPanel />}
          </div>
        )}
      </div>
    </>
  );
}