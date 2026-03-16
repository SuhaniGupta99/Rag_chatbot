import { C, fonts } from "../theme";

const scoreColor = v => v >= 0.9 ? C.green : v >= 0.8 ? C.cyan : C.amber;

export default function SourcesPanel() {
  const sources = [
    {
      name:"research_paper.pdf",
      excerpt:"Transformer-based retrieval outperforms BM25 by 41% on semantic queries across all benchmarks.",
      pages:"pp. 4–7", score:0.96, type:"PDF",
    },
    {
      name:"annual_report.pdf",
      excerpt:"Revenue growth driven by AI-assisted tooling adoption, with 3× YoY increase in platform users.",
      pages:"p. 12", score:0.88, type:"PDF",
    },
    {
      name:"notes.md",
      excerpt:"Chunk overlap of 10–15% with 512-token window showed best results across all tested datasets.",
      pages:"§ 3.2", score:0.79, type:"MD",
    },
    {
      name:"meeting_notes.txt",
      excerpt:"Team agreed on reranker threshold of 0.75. Below this, chunks are too noisy for reliable answers.",
      pages:"line 44", score:0.63, type:"TXT",
    },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
      <p style={{
        fontFamily:fonts.mono, fontSize:10,
        color:C.textFaint, letterSpacing:1, marginBottom:16,
      }}>
        LAST RETRIEVED · {sources.length} CHUNKS
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {sources.map((s, i) => {
          const col = scoreColor(s.score);
          return (
            <div key={i} style={{
              background:C.surface,
              border:`1px solid ${C.border}`,
              borderRadius:14, padding:"16px 18px",
              cursor:"pointer", transition:"border-color .18s",
            }}>
              {/* File name + score */}
              <div style={{
                display:"flex", justifyContent:"space-between",
                alignItems:"flex-start", marginBottom:10,
              }}>
                <div>
                  <p style={{
                    fontSize:14, fontWeight:600,
                    color:C.text, marginBottom:5,
                  }}>{s.name}</p>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{
                      padding:"2px 8px", borderRadius:99,
                      border:`1px solid ${C.border}`,
                      color:C.textSub, fontSize:11,
                      fontFamily:fonts.mono,
                    }}>{s.type}</span>
                    <span style={{
                      fontSize:11, color:C.textFaint,
                      fontFamily:fonts.mono,
                    }}>{s.pages}</span>
                  </div>
                </div>
                <span style={{
                  fontFamily:fonts.mono, fontSize:18,
                  fontWeight:700, color:col, flexShrink:0,
                }}>{Math.round(s.score * 100)}%</span>
              </div>

              {/* Score bar */}
              <div style={{ height:4, background:C.border, borderRadius:99, marginBottom:12 }}>
                <div style={{
                  height:"100%", borderRadius:99,
                  width:`${s.score * 100}%`,
                  background:col,
                }}/>
              </div>

              {/* Excerpt */}
              <p style={{
                fontSize:12, lineHeight:1.7,
                color:C.textSub,
                borderLeft:`3px solid ${col}40`,
                paddingLeft:10,
              }}>{s.excerpt}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}