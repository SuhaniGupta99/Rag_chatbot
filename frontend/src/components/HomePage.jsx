import { useState, useRef, useEffect } from "react";
import { fonts } from "../theme";
import ReactMarkdown from "react-markdown";
// ─── HELPERS ─────────────────────────────────────────────────────────────────


const Badge = ({ children, color }) => (
    <span style={{
    padding:"3px 10px", borderRadius:99,
    border:`1px solid ${color}50`, background:`${color}12`,
    color, fontSize:11, fontFamily:fonts.mono,
    display:"inline-flex", alignItems:"center", gap:4,
  }}>{children}</span>
);

const scoreColor = (v, theme) => v >= 0.88 ? theme.green : v >= 0.72 ? theme.cyan : theme.amber;

const fileIcon = (name, theme) => {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf")  return { icon:"📕", color:theme.rose   };
  if (ext === "md")   return { icon:"📝", color:theme.cyan   };
  if (ext === "txt")  return { icon:"📄", color:theme.textSub};
  if (ext === "docx") return { icon:"📘", color:theme.violet };
  return { icon:"📄", color:theme.textSub };
};

// ─── CONFIDENCE CARD ─────────────────────────────────────────────────────────
function ConfidenceCard({ scores, theme }) {
  const metrics = [
    { key:"faithfulness",     label:"Faithfulness",       tip:"How grounded the answer is in source docs"  },
    { key:"answer_relevance", label:"Answer Relevance",    tip:"How relevant the answer is to the question" },
    { key:"context_recall",   label:"Context Recall",      tip:"How much needed context was retrieved"      },
    { key:"rag_quality",      label:"Overall RAG Quality", tip:"Combined quality score"                     },
  ];

  return (
    <div style={{
      marginTop:8,
      background:theme.raised, border:`1px solid ${theme.border}`,
      borderRadius:12, padding:"16px 18px",
      display:"flex", flexDirection:"column", gap:14,
      animation:"fadeIn .25s cubic-bezier(.22,1,.36,1) both",
    }}>
      <p style={{ fontSize:10, fontFamily:fonts.mono, color:theme.textFaint, letterSpacing:1 }}>
        CONFIDENCE SCORES
      </p>
      {metrics.map(m => {
        const val = scores[m.key] ?? 0;
        const pct = Math.round(val * 100);
        const col = scoreColor(val, theme);        
        return (
          <div key={m.key}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <div>
                <p style={{ fontSize:13, color:theme.text, fontWeight:500 }}>{m.label}</p>
                <p style={{ fontSize:11, color:theme.textFaint, marginTop:1 }}>{m.tip}</p>
              </div>
              <span style={{
                fontFamily:fonts.mono, fontSize:16, fontWeight:700,
                color:col, flexShrink:0, marginLeft:12,
              }}>{pct}%</span>
            </div>
            <div style={{ height:5, background:theme.border, borderRadius:99 }}>
              <div style={{
                height:"100%", borderRadius:99, background:col,
                width:`${pct}%`,
                transition:"width .8s cubic-bezier(.22,1,.36,1)",
              }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
function MessageBubble({ msg, idx , theme}) {
  const [showScores, setShowScores] = useState(false);
  const isUser = msg.role === "user";

  return (
    <div style={{
      display:"flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap:10,
      alignItems:"center",  
      animation:"fadeUp .3s cubic-bezier(.22,1,.36,1) both",
      animationDelay:`${idx * .04}s`,
    }}>
      <div style={{
        width:32, height:32, borderRadius:10, flexShrink:0,
        background: isUser
          ? `linear-gradient(135deg,${theme.violet},${theme.rose})`
          : `linear-gradient(135deg,${theme.cyan},#0066FF)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:12, fontWeight:700,
        color: isUser ? "#fff" : "#000",
        fontFamily:fonts.display,
      }}>{isUser ? "U" : "AI"}</div>

      <div style={{ maxWidth:"72%" }}>
       <div style={{
  background: isUser ? `${theme.violet}15` : theme.surface,
  border:`1px solid ${isUser ? theme.violet+"40" : theme.border}`,
  borderRadius: isUser ? "14px 3px 14px 14px" : "3px 14px 14px 14px",
  padding:"14px 18px", // 🔥 slightly bigger
  display:"flex",      // 🔥 important
  alignItems:"center", // 🔥 vertical centering
}}>
          {msg.typing ? (
            <div style={{ display:"flex", gap:5, alignItems:"center", height:20 }}>
              {[0,1,2].map(j => (
                <div key={j} style={{
                  width:7, height:7, borderRadius:"50%", background:theme.cyan,
                  animation:`dot 1.4s ${j*.2}s ease-in-out infinite`,
                }}/>
              ))}
            </div>
          ) : (
            <div style={{ 
  fontSize:14, 
  lineHeight:1.6,  // 🔥 slightly tighter
  color:theme.text, 
  whiteSpace:"pre-line",
  margin:0         // 🔥 removes extra spacing
}}>
  <ReactMarkdown
    components={{
      strong: ({node, ...props}) => (
        <strong style={{ fontWeight: 700, color: theme.text }} {...props} />
      ),
      p: ({node, ...props}) => (
        <p style={{ marginBottom: "8px" }} {...props} />
      ),
      li: ({node, ...props}) => (
        <li style={{ marginBottom: "6px" }} {...props} />
      ),
    }}
  >
    {msg.content}
  </ReactMarkdown>
</div>
          )}
          {msg.sources?.length > 0 && (
            <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
              {msg.sources.map((s,j) => <Badge key={j} color={theme.cyan}>📄 {s}</Badge>)}
            </div>
          )}
        </div>

        {!isUser && msg.scores && !msg.typing && (
          <div style={{ marginTop:7, paddingLeft:2 }}>
            <button onClick={() => setShowScores(p => !p)} style={{
              display:"flex", alignItems:"center", gap:7,
              padding:"5px 12px", borderRadius:8,
              background:"transparent", border:`1px solid ${theme.border}`,
              color:theme.textSub, fontSize:12, cursor:"pointer",
              transition:"all .18s", fontFamily:fonts.body,
            }}>
              <span>📊</span>
              <span>{showScores ? "Hide" : "View"} confidence scores</span>
              <span style={{ color:theme.textFaint, fontSize:10 }}>{showScores ? "▲" : "▼"}</span>
            </button>
            {showScores && <ConfidenceCard scores={msg.scores} theme={theme} />}
          </div>
        )}

       
      </div>
    </div>
  );
}

// ─── UPLOAD ZONE ─────────────────────────────────────────────────────────────
function UploadZone({ files, setFiles, collapsed, setCollapsed, setHasUploaded, theme }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const addFile = async (file) => {
    const name = file.name ?? file;
    if (files.find(f => f.name === name)) return;
    setFiles(p => {
      const updated = [...p, { name, status:"indexing", progress:50 }];
      return updated;
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Upload response:", data);

      setFiles(p =>
  p.map(f =>
    f.name === name ? { ...f, status:"ready", progress:100 } : f
  )
);

setHasUploaded(true); // ✅ OUTSIDE

    } catch (err) {
      console.error("Upload failed:", err);
      setFiles(p => {
        const updated = p.map(f =>
          f.name === name ? { ...f, status:"error", progress:0 } : f
        );
        return updated;
      });
    }
  };

  return (
    <div style={{ background:theme.surface, borderBottom:`1px solid ${theme.border}`, flexShrink:0 }}>

      {/* Header */}
      <div onClick={() => setCollapsed(p => !p)} style={{
        padding:"14px 24px", display:"flex",
        alignItems:"center", justifyContent:"space-between",
        cursor:"pointer",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>📂</span>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:theme.text, fontFamily:fonts.display }}>
              Documents
            </p>
            <p style={{ fontSize:11, color:theme.textFaint, fontFamily:fonts.mono }}>
              {files.length === 0
              ? "No documents — upload to start chatting"
              : `${files.length} documents available`}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {files.length > 0 && (
            <Badge color={theme.green}>
              {files.filter(f=>f.status==="ready").length} indexed
            </Badge>
          )}
          <span style={{ color:theme.textFaint, fontSize:12, fontFamily:fonts.mono }}>
            <span style={{
  display:"inline-block",
  transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
  transition:"transform 0.3s ease"
}}>
  ▼
</span>
          </span>
        </div>
      </div>


      {/* Expandable body */}
<div style={{
  overflow: "hidden",
  transition: "all 0.4s cubic-bezier(.16,1,.3,1)",
  maxHeight: collapsed ? "0px" : "1000px",
  opacity: collapsed ? 0 : 1,
  transform: collapsed ? "translateY(-10px)" : "translateY(0)",
  willChange: "max-height, opacity, transform",
  filter: collapsed ? "blur(2px)" : "blur(0px)",
}}>
  <div style={{ padding:"0 24px 20px" }}>
          {/* Hidden real file input */}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.md,.txt,.docx,.csv"
            style={{ display:"none" }}
            onChange={e => {
              Array.from(e.target.files).forEach(f => addFile(f));
              e.target.value = "";
            }}
          />

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault(); setDragging(false);
              Array.from(e.dataTransfer.files).forEach(f => addFile(f));
            }}
            onClick={() => inputRef.current.click()}
            style={{
              border:`2px dashed ${dragging ? theme.cyan : theme.border}`,
              borderRadius:14, padding:"28px 20px",
              textAlign:"center", cursor:"pointer",
              transition:"all .2s",
              background: dragging ? `${theme.cyan}08` : theme.bg,
              marginBottom: files.length > 0 ? 16 : 0,
            }}>
            <div style={{ fontSize:36, marginBottom:10 }}>
              {dragging ? "⬇️" : "📂"}
            </div>
            <p style={{ fontSize:15, fontWeight:600, color: dragging ? theme.cyan : theme.textSub, marginBottom:6 }}>
              {dragging ? "Drop to upload!" : "Drag & drop files here"}
            </p>
            <p style={{ fontSize:12, color:theme.textFaint, fontFamily:fonts.mono, marginBottom:14 }}>
              PDF · MD · TXT · DOCX · CSV
            </p>
            <button
              onClick={e => { e.stopPropagation(); inputRef.current.click(); }}
              style={{
                padding:"9px 24px", borderRadius:10,
                background:`linear-gradient(135deg,${theme.cyan},#0066FF)`,
                border:"none", color:"#000",
                fontSize:13, fontWeight:700, fontFamily:fonts.display,
                cursor:"pointer",
              }}>Browse Files</button>
            </div>
</div>

          {/* File cards */}
          {files.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <p style={{ fontSize:10, fontFamily:fonts.mono, color:theme.textFaint, letterSpacing:1, marginBottom:2 }}>
                UPLOADED FILES
              </p>
              {files.map(f => {
                const { icon, color } = fileIcon(f.name, theme)
                return (
                  <div key={f.name} style={{
                    display:"flex", alignItems:"center", gap:14,
                    padding:"13px 16px",
                    background:theme.raised,
                    border:`1px solid ${f.status==="ready" ? theme.green+"30" : theme.border}`,
                    borderRadius:12, transition:"border-color .3s",
                  }}>
                    <div style={{
                      width:40, height:40, borderRadius:10, flexShrink:0,
                      background:`${color}15`, border:`1px solid ${color}30`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:20,
                    }}>{icon}</div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:theme.text, marginBottom:6 }}>{f.name}</p>
                      <div style={{ height:4, background:theme.border, borderRadius:99 }}>
                        <div style={{
                          height:"100%", borderRadius:99,
                          width:`${f.progress}%`,
                          background: f.status==="ready" ? theme.green : theme.cyan,
                          transition:"width .3s ease, background .3s",
                        }}/>
                      </div>
                    </div>

                    <div style={{ flexShrink:0 }}>
                      {f.status === "ready"
                        ? <Badge color={theme.green}>✓ Ready</Badge>
                        : f.status === "error"
                        ? <Badge color={theme.rose}>✗ Failed</Badge>
                        : <Badge color={theme.amber}>⟳ Indexing…</Badge>}
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          await fetch(`http://localhost:8000/documents/${f.document_id}`, {
                            method: "DELETE"
                          });
                          
                          setFiles(p => p.filter(x => x.document_id !== f.document_id));
                        
                        } catch (err) {
                          console.error("Delete failed:", err);
                        }
                      }}
                      style={{
                        background:"none", border:"none", color:theme.textFaint,
                        fontSize:18, lineHeight:1, cursor:"pointer",
                        flexShrink:0, transition:"color .15s",
                      }}>×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export default function HomePage({
  activeSession,
  setActiveSession,
  collapsed,
  setCollapsed,
  theme
}) {
  
  const [files, setFiles] = useState([]);
  const [val, setVal]           = useState("");
  const selectedModel = localStorage.getItem("selectedModel") || "phi3:mini";
  const [msgs, setMsgs]         = useState([
    {
      role:"assistant",
      content:"Hi! Upload a document above and ask me anything about it.",
      time:"just now", sources:[],
    },
  ]);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [msgs]);
  useEffect(() => {
  const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
  const current = sessions.find(s => s.id === activeSession);

 if (current) {
  if (!current.messages || current.messages.length === 0) {
    setMsgs([
      {
        role: "assistant",
        content: "Hi! Upload a document above and ask me anything about it.",
        time: "just now",
        sources: [],
      }
    ]);
  } else {
    setMsgs(current.messages);
  }
} else {
    setMsgs([
  {
    role: "assistant",
    content: "Hi! Upload a document above and ask me anything about it.",
    time: "just now",
    sources: [],
  }
]);
  }
}, [activeSession]);
  useEffect(() => {
  const fetchDocs = async () => {
    try {
      const res = await fetch("http://localhost:8000/documents/");
      const data = await res.json();

      // 🔥 IMPORTANT: data is already array
      const formatted = data.map(doc => ({
        name: doc.filename,
        status: "ready",
        progress: 100,
        document_id: doc.document_id,
        chunks: doc.chunks
      }));

      setFiles(formatted);

    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  fetchDocs();
}, []);
const [hasUploaded, setHasUploaded] = useState(false);

useEffect(() => {
  if (files.length > 0 && hasUploaded) {
    setCollapsed(true);
  }
}, [files, hasUploaded]);
  const send = async () => {
  if (!val.trim()) return;
  if (!activeSession) {
  const newId = crypto.randomUUID();
  setActiveSession(newId);
  localStorage.setItem("activeSession", newId);

  const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");

  sessions.unshift({
  id: newId,
  title: "New Chat",
  time: "now",
  messages: [
    {
      role: "assistant",
      content: "Hi! Upload a document above and ask me anything about it.",
      time: "just now",
      sources: [],
    }
  ]
});

  localStorage.setItem("sessions", JSON.stringify(sessions));
}
  const q = val;
  setVal("");

  setMsgs(p => [...p,
    { role:"user", content:q, time:"now", sources:[] },
    { role:"assistant", typing:true, time:"now", sources:[] },
  ]);

  try {
    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  question: q,
  top_k: 3,
  session_id: activeSession,
  model: selectedModel
}),
    });

    // 🔥 SAFETY CHECK (IMPORTANT)
    if (!res.body) {
      throw new Error("No response body (stream not supported or backend error)");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let done = false;
    let fullText = "";
    let metricsText = "";
    let isMetrics = false;

    let firstTokenReceived = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      if (!value) continue;

      const chunk = decoder.decode(value);

      if (chunk.includes("---METRICS---")) {
        isMetrics = true;
        continue;
      }

      if (!isMetrics) {
        if (!firstTokenReceived) {
          firstTokenReceived = true;
          setMsgs(p => [
            ...p.filter(m => !m.typing),
            { role: "assistant", content: "", time: "now", sources: [] },
          ]);
        }

        fullText += chunk;

        setMsgs(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) last.content = fullText;
          return updated;
        });

      } else {
        metricsText += chunk;
      }
    }

    // Parse metrics safely
    if (metricsText) {
      try {
        const metrics = JSON.parse(metricsText);

        setMsgs(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];

          if (last) {
            last.scores = {
              faithfulness: metrics.faithfulness ?? 0,
              answer_relevance: metrics.answer_relevance ?? 0,
              context_recall: metrics.context_relevance ?? 0,
              rag_quality: metrics.rag_quality_score ?? 0,
            };
          }

          return updated;
        });
        
      } catch (err) {
        console.error("Metrics parse error:", err);
      }
    }
const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");

// find session index
const index = sessions.findIndex(s => s.id === activeSession);

if (index !== -1) {
  // ✅ update existing session
  sessions[index].messages = [
    ...(sessions[index].messages || []),

    { role: "user", content: q, time: "now" },
    { role: "assistant", content: fullText, time: "now" }
  ];

  // update title if first message
  if (sessions[index].title === "New Chat") {
    sessions[index].title = q.slice(0, 30);
  }

} else {
  // ✅ fallback (should rarely happen)
  sessions.push({
    id: activeSession,
    title: q.slice(0, 30),
    time: "now",
    messages: [
      { role: "user", content: q },
      { role: "assistant", content: fullText }
    ]
  });
}

localStorage.setItem("sessions", JSON.stringify(sessions));
  } catch (err) {
    console.error("STREAM ERROR:", err);

    setMsgs(p => [...p.filter(m => !m.typing), {
      role: "assistant",
      content: "⚠️ Backend error or not running.",
      time: "now",
      sources: [],
    }]);
  }
};
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
      {/* Top bar */}
      <div style={{
        padding:"13px 24px",
        background:theme.surface, borderBottom:`1px solid ${theme.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexShrink:0,
      }}>
        <div>
          <span style={{ fontFamily:fonts.display, fontWeight:700, fontSize:16, color:theme.text }}>
            RAG Chatbot
          </span>
          <p style={{ fontSize:11, color:theme.textFaint, fontFamily:fonts.mono, marginTop:2 }}>
            {files.filter(f => f.status === "ready").length} docs ready · ask anything
          </p>
        </div>
        <Badge color={theme.green}>● online</Badge>
      </div>

      {/* Upload zone */}
      <UploadZone
  files={files}
  setFiles={setFiles}
  collapsed={collapsed}
  setCollapsed={setCollapsed}
  setHasUploaded={setHasUploaded}
  theme={theme}   // ✅ ADD THIS

/>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px 28px", display:"flex", flexDirection:"column", gap:18 }}>
        {msgs.map((msg, i) => <MessageBubble key={i} msg={msg} idx={i} theme={theme}/>)}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding:"12px 24px 18px",
        background:theme.surface, borderTop:`1px solid ${theme.border}`, flexShrink:0,
      }}>
        <div style={{
          background:theme.bg, border:`1px solid ${theme.border}`,
          borderRadius:14, padding:"11px 14px",
          display:"flex", alignItems:"flex-end", gap:10,
        }}>
          <textarea
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your documents…"
            rows={1}
            style={{
              flex:1, background:"none", border:"none", outline:"none",
              color:theme.text, fontSize:14, lineHeight:1.6,
              resize:"none", maxHeight:120, overflowY:"auto",
              fontFamily:fonts.body,
            }}
          />
          <span style={{
            fontSize:13,
            color:theme.textSub,
            fontFamily:fonts.mono,
            background:theme.border,
            padding:"3px 8px",
            borderRadius:6,
            }}>
              {(() => {
                 const m = localStorage.getItem("selectedModel") || "phi3:mini";
                  if (m.includes("phi3:mini")) return "phi3";
                  if (m.includes("tinyllama:latest")) return "TinyLLaMA";
                  if (m.includes("llama3:8b-instruct-q4_0")) return "LLaMA 3";
                  return m;
                  })()}
                  </span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={send} style={{
              width:36, height:36, borderRadius:10, border:"none",
              background: val.trim() ? `linear-gradient(135deg,${theme.cyan},#0066FF)` : theme.border,
              color: val.trim() ? "#000" : theme.textSub,
              fontSize:18, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all .18s", cursor:"pointer",
              boxShadow: val.trim() ? `0 0 14px ${theme.cyan}30` : "none",
            }}>↑</button>
          </div>
        </div>
        <p style={{ textAlign:"center", marginTop:7, fontSize:11, color:theme.textFaint, fontFamily:fonts.mono }}>
          ↵ Send · ⇧↵ New line
        </p>
      </div>
    </div>
  );
}