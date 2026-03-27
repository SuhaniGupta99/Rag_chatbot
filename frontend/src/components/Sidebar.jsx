import { useEffect, useState } from "react";
import { fonts } from "../theme";

export default function Sidebar({ view, setView, activeSession, setActiveSession, theme }) {
const deleteSession = async (id) => {
  try {
    await fetch(`http://localhost:8000/sessions/${id}`, {
      method: "DELETE"
    });

    setSessions(prev => prev.filter(s => s.id !== id));

    if (activeSession === id) {
      setActiveSession(null);
    }

  } catch (err) {
    console.error("Delete failed:", err);
  }
};

  const [sessions, setSessions] = useState([]);

 
  // ✅ CREATE NEW CHAT
 const createNewChat = async () => {
  try {
    const res = await fetch("http://localhost:8000/sessions", {
      method: "POST"
    });

    const data = await res.json();

    setActiveSession(data.session_id);
    setView("chat");

  } catch (err) {
    console.error("Failed to create session:", err);
  }
};
useEffect(() => {
  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:8000/sessions");
      const data = await res.json();

      setSessions(data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  fetchSessions();
}, [activeSession]);

  const navItems = [
    { id:"chat", emoji:"💬", label:"Chat" },
    { id:"sources", emoji:"📄", label:"Sources" },
    { id:"settings", emoji:"⚙️", label:"Settings" },
  ];

  return (
    <aside style={{
      width:240,
      background:theme.surface,
      borderRight:`1px solid ${theme.border}`,
      display:"flex",
      flexDirection:"column",
      height:"100vh",
    }}>

      {/* Logo */}
      <div style={{
        padding:"20px 16px",
        borderBottom:`1px solid ${theme.border}`,
        display:"flex",
        alignItems:"center",
        gap:10,
      }}>
        <div style={{
          width:32, height:32, borderRadius:9,
          background:`linear-gradient(135deg,${theme.cyan},#0066FF)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:800, color:"#000",
        }}>R</div>
        <span style={{ fontWeight:700, fontSize:16, color:theme.text }}>
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
              background: view===it.id ? `${theme.cyan}14` : "transparent",
              color: view===it.id ? theme.cyan : theme.textSub,
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
            background:`linear-gradient(135deg,${theme.cyan},#0066FF)`,
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
      borderLeft:`2px solid ${activeSession===s.id ? theme.cyan : "transparent"}`,
      background: activeSession===s.id ? `${theme.cyan}0D` : "transparent",
    }}
  >

    {/* CLICK AREA */}
    <div
  onClick={() => {
    setActiveSession(s.id);
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
  color: activeSession===s.id ? theme.text : theme.textSub,
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
        color:theme.textFaint,
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