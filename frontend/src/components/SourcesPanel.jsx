import { useEffect, useState } from "react";
import { C, fonts } from "../theme";

export default function SourcesPanel() {

  const [sources, setSources] = useState([]);

  // ✅ Fetch documents from backend
  useEffect(() => {
    fetch("http://localhost:8000/documents/")
      .then(res => res.json())
      .then(data => {
        console.log("Documents API response:", data);

        const formatted = data.map(d => ({
          name: d.filename,
          excerpt: `Document with ${d.chunks} chunks indexed for retrieval.`,
          pages: "Uploaded",
          type: d.filename.split(".").pop().toUpperCase(),

          // 🔥 IMPORTANT FIX (handles different backend keys)
          document_id: d.document_id || d.id,
        }));

        setSources(formatted);
      })
      .catch(err => console.error("Failed to fetch sources", err));
  }, []);

  // ✅ DELETE FUNCTION
  const handleDelete = async (docId) => {
    console.log("Deleting:", docId);

    if (!docId) {
      alert("No document_id found");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/documents/${docId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      // remove from UI
      setSources(prev => prev.filter(s => s.document_id !== docId));

    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed. Check backend.");
    }
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
      <p style={{
        fontFamily:fonts.mono, fontSize:10,
        color:C.textFaint, letterSpacing:1, marginBottom:16,
      }}>
        DOCUMENTS · {sources.length}
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {sources.map((s, i) => {
          return (
            <div key={i} style={{
              background:C.surface,
              border:`1px solid ${C.border}`,
              borderRadius:14,
              padding:"16px 18px",
              cursor:"pointer",
              transition:"border-color .18s",
              position:"relative",
            }}>

              {/* 🔥 BIGGER DELETE BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(s.document_id);
                }}
                style={{
                  position:"absolute",
                  top:10,
                  right:12,
                  width:30,
                  height:30,
                  borderRadius:8,
                  border:`1px solid ${C.border}`,
                  background:C.bg,
                  color:C.textSub,
                  fontSize:18,
                  fontWeight:"bold",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  cursor:"pointer",
                  transition:"all .2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.rose + "20"}
                onMouseLeave={e => e.currentTarget.style.background = C.bg}
              >
                ×
              </button>

              {/* File name */}
              <div style={{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"flex-start",
                marginBottom:10,
              }}>
                <div>
                  <p style={{
                    fontSize:14,
                    fontWeight:600,
                    color:C.text,
                    marginBottom:5,
                  }}>
                    {s.name}
                  </p>

                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{
                      padding:"2px 8px",
                      borderRadius:99,
                      border:`1px solid ${C.border}`,
                      color:C.textSub,
                      fontSize:11,
                      fontFamily:fonts.mono,
                    }}>
                      {s.type}
                    </span>

                    <span style={{
                      fontSize:11,
                      color:C.textFaint,
                      fontFamily:fonts.mono,
                    }}>
                      {s.pages}
                    </span>
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              <p style={{
                fontSize:12,
                lineHeight:1.7,
                color:C.textSub,
                borderLeft:`3px solid ${C.cyan}40`,
                paddingLeft:10,
              }}>
                {s.excerpt}
              </p>

            </div>
          );
        })}
      </div>
    </div>
  );
}