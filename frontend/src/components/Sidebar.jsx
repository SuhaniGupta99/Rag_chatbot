import { useEffect, useState } from "react";
import { C, fonts } from "../theme";

export default function Sidebar({ view, setView, activeSession, setActiveSession }) {
  const deleteSession = (id) => {
  const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");

  const updated = sessions.filter(s => s.id !== id);

  localStorage.setItem("sessions", JSON.stringify(updated));

  setSessions(updated);

  // 🔥 if deleted session was active → reset
  if (activeSession === id) {
    setActiveSession(updated.length ? updated[0].id : null);
    localStorage.setItem("activeSession", updated.length ? updated[0].id : "");
  }
};

  const [sessions, setSessions] = useState([]);

  // ✅ LOAD sessions from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("sessions") || "[]");
    setSessions(saved);
  }, []);

  // ✅ SAVE sessions
  const updateSessions = (newSessions) => {
    setSessions(newSessions);
    localStorage.setItem("sessions", JSON.stringify(newSessions));
  };

  // ✅ CREATE NEW CHAT
  const createNewChat = () => {
    const newSession = {
      id: crypto.randomUUID(),
      title: "New Chat",
      time: "now",
      messages: [],
    };

    const updated = [newSession, ...sessions];
    updateSessions(updated);
    setActiveSession(newSession.id);
    localStorage.setItem("activeSession", newSession.id);
  };

  const navItems = [
    { id:"chat", emoji:"💬", label:"Chat" },
    { id:"sources", emoji:"📄", label:"Sources" },
    { id:"settings", emoji:"⚙️", label:"Settings" },
  ];

  return (
    <aside style={{
      width:240,
      background:C.surface,
      borderRight:`1px solid ${C.border}`,
      display:"flex",
      flexDirection:"column",
      height:"100vh",
    }}>

      {/* Logo */}
      <div style={{
        padding:"20px 16px",
        borderBottom:`1px solid ${C.border}`,
        display:"flex",
        alignItems:"center",
        gap:10,
      }}>
        <div style={{
          width:32, height:32, borderRadius:9,
          background:`linear-gradient(135deg,${C.cyan},#0066FF)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:800, color:"#000",
        }}>R</div>
        <span style={{ fontWeight:700, fontSize:16, color:C.text }}>
          RAGChat
        </span>
      </div>

      {/* Nav */}
      <div style={{ padding:10 }}>
        {navItems.map(it => (
          <button key={it.id} onClick={() => setView(it.id)}
            style={{
              width:"100%",
              padding:10,
              borderRadius:10,
              border:"none",
              background: view===it.id ? `${C.cyan}14` : "transparent",
              color: view===it.id ? C.cyan : C.textSub,
              cursor:"pointer",
              textAlign:"left",
            }}>
            {it.emoji} {it.label}
          </button>
        ))}
      </div>

      {/* 🔥 NEW CHAT BUTTON */}
      <div style={{ padding:"10px" }}>
        <button onClick={createNewChat}
          style={{
            width:"100%",
            padding:"10px",
            borderRadius:10,
            border:"none",
            background:`linear-gradient(135deg,${C.cyan},#0066FF)`,
            color:"#000",
            fontWeight:600,
            cursor:"pointer",
          }}>
          + New Chat
        </button>
      </div>

      {/* Chat History */}
      <div style={{ flex:1, overflowY:"auto", padding:"10px" }}>
        {sessions.map(s => (
  <div key={s.id}
  style={{
    display:"flex",
    alignItems:"center",
    justifyContent:"space-between",
    padding:"12px 12px",     // 🔥 more padding
    marginBottom:"8px",      // 🔥 space between chats
      transition:"all 0.2s ease",
      borderRadius:9,
      cursor:"pointer",
      borderLeft:`2px solid ${activeSession===s.id ? C.cyan : "transparent"}`,
      background: activeSession===s.id ? `${C.cyan}0D` : "transparent",
    }}
  >

    {/* CLICK AREA */}
    <div
  onClick={() => {
    setActiveSession(s.id);
    localStorage.setItem("activeSession", s.id);
    setView("chat");
  }}
  style={{
    flex:1,
    display:"flex",
    alignItems:"center"  // 🔥 THIS FIXES CENTERING
  }}
>
      <p style={{
  fontSize:13,
  fontWeight: activeSession===s.id ? 600 : 400,
  color: activeSession===s.id ? C.text : C.textSub,
}}>
        {s.title}
      </p>
      
    </div>

    {/* 🔥 DELETE BUTTON */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        deleteSession(s.id);
      }}
      style={{
        marginLeft:6,
        background:"none",
        border:"none",
        color:C.textFaint,
        fontSize:14,
        cursor:"pointer",
      }}
    >
      ×
    </button>

  </div>
))}
      </div>
    </aside>
  );
  
}