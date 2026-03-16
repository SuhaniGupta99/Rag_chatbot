import { C, fonts } from "../theme";

export default function Sidebar({ view, setView, activeSession, setActiveSession }) {
  const sessions = [
    { id:1, title:"Research Paper Analysis", time:"2m ago"    },
    { id:2, title:"Q&A on Annual Report",     time:"1h ago"    },
    { id:3, title:"Legal Contract Review",    time:"yesterday" },
    { id:4, title:"Codebase Walkthrough",     time:"2d ago"    },
  ];

  const navItems = [
    { id:"chat",     emoji:"💬", label:"Chat"     },
    { id:"sources",  emoji:"📄", label:"Sources"  },
    { id:"settings", emoji:"⚙️", label:"Settings" },
  ];

  return (
    <aside style={{
      width:240, flexShrink:0,
      background:C.surface,
      borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column",
      height:"100vh",
    }}>
      {/* Logo */}
      <div style={{
        padding:"20px 16px 16px",
        borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", gap:10,
      }}>
        <div style={{
          width:32, height:32, borderRadius:9, flexShrink:0,
          background:`linear-gradient(135deg,${C.cyan},#0066FF)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, fontWeight:800, color:"#000",
          fontFamily:fonts.display,
          boxShadow:`0 0 14px ${C.cyan}25`,
        }}>R</div>
        <span style={{ fontFamily:fonts.display, fontWeight:700, fontSize:16, color:C.text }}>
          RAGChat
        </span>
      </div>

      {/* Nav buttons */}
      <div style={{ padding:"10px 10px 4px", display:"flex", flexDirection:"column", gap:2 }}>
        {navItems.map(it => (
          <button key={it.id} onClick={() => setView(it.id)}
            style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"10px 12px", borderRadius:10, border:"none",
              background: view===it.id ? `${C.cyan}14` : "transparent",
              color: view===it.id ? C.cyan : C.textSub,
              fontSize:13, fontWeight: view===it.id ? 600 : 400,
              textAlign:"left", transition:"all .18s", cursor:"pointer",
              outline: view===it.id ? `1px solid ${C.cyan}30` : "none",
              fontFamily:fonts.body,
            }}>
            <span style={{ fontSize:17 }}>{it.emoji}</span>
            {it.label}
            {view===it.id && (
              <div style={{ marginLeft:"auto", width:5, height:5, borderRadius:"50%", background:C.cyan }}/>
            )}
          </button>
        ))}
      </div>

      {/* Chat History */}
      <div style={{
        padding:"14px 12px 6px",
        borderTop:`1px solid ${C.border}`,
        marginTop:8, flex:1, overflowY:"auto",
      }}>
        <p style={{
          fontFamily:fonts.mono, fontSize:10,
          color:C.textFaint, letterSpacing:1,
          marginBottom:10, paddingLeft:4,
        }}>CHAT HISTORY</p>

        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {sessions.map(s => (
            <div key={s.id}
              onClick={() => { setActiveSession(s.id); setView("chat"); }}
              style={{
                padding:"9px 10px", borderRadius:9, cursor:"pointer",
                borderLeft:`2px solid ${activeSession===s.id ? C.cyan : "transparent"}`,
                background: activeSession===s.id ? `${C.cyan}0D` : "transparent",
                transition:"all .15s",
              }}>
              <p style={{
                fontSize:12,
                fontWeight: activeSession===s.id ? 600 : 400,
                color: activeSession===s.id ? C.text : C.textSub,
                marginBottom:2, lineHeight:1.4,
              }}>{s.title}</p>
              <span style={{
                fontSize:10, color:C.textFaint, fontFamily:fonts.mono,
              }}>{s.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User */}
      <div style={{
        margin:"0 10px 14px",
        display:"flex", alignItems:"center", gap:10,
        padding:"10px 12px", borderRadius:11,
        background:C.raised, border:`1px solid ${C.border}`,
      }}>
        <div style={{
          width:28, height:28, borderRadius:"50%",
          background:`linear-gradient(135deg,${C.violet},${C.rose})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, fontWeight:700, color:"#fff",
        }}>U</div>
        <div>
          <p style={{ fontSize:12, fontWeight:600, color:C.text }}>You</p>
          <p style={{ fontSize:10, color:C.textFaint, fontFamily:fonts.mono }}>Free plan</p>
        </div>
      </div>
    </aside>
  );
}