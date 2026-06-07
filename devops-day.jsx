import { useState, useEffect, useRef } from "react";

const BLOCKS = [
  { id: 1,  start: "08:30", end: "08:45", label: "Plan & Triage",    type: "plan",     icon: "📋", desc: "Alerts, overnight incidents, set priorities" },
  { id: 2,  start: "08:45", end: "09:00", label: "Daily Standup",    type: "social",   icon: "🧑‍💻", desc: "Team sync" },
  { id: 3,  start: "09:00", end: "10:30", label: "Deep Work #1",     type: "deep",     icon: "⚙️",  desc: "Infrastructure, IaC, architecture" },
  { id: 4,  start: "10:30", end: "10:45", label: "Break",            type: "break",    icon: "☕", desc: "Step away, reset" },
  { id: 5,  start: "10:45", end: "12:00", label: "Deep Work #2",     type: "deep",     icon: "⚙️",  desc: "Complex problem solving" },
  { id: 6,  start: "12:00", end: "12:30", label: "Lunch",            type: "lunch",    icon: "🥗", desc: "Away from screen" },
  { id: 7,  start: "12:30", end: "13:00", label: "Social / Reviews", type: "social",   icon: "💬", desc: "Slack, PRs, async comms" },
  { id: 8,  start: "13:00", end: "14:30", label: "Deep Work #3",     type: "deep",     icon: "⚙️",  desc: "Scripting, automation, migrations" },
  { id: 9,  start: "14:30", end: "14:45", label: "Break",            type: "break",    icon: "☕", desc: "Recharge" },
  { id: 10, start: "14:45", end: "15:45", label: "Reactive / Ops",   type: "reactive", icon: "⚡", desc: "Monitoring, tickets, ad-hoc" },
  { id: 11, start: "15:45", end: "16:15", label: "Wrap-up",          type: "plan",     icon: "✅", desc: "Update tickets, prep tomorrow" },
  { id: 12, start: "16:15", end: "16:30", label: "Buffer",           type: "break",    icon: "🌀", desc: "Overflow or early finish" },
];

// Block colours are the same in both themes; only UI chrome changes
const TYPE_CONFIG = {
  deep:     { color: "#10b981", label: "DEEP WORK"  },
  social:   { color: "#f59e0b", label: "SOCIAL"     },
  plan:     { color: "#3b82f6", label: "PLANNING"   },
  break:    { color: "#a855f7", label: "BREAK"      },
  lunch:    { color: "#ec4899", label: "LUNCH"      },
  reactive: { color: "#f97316", label: "OPS"        },
};

// bg tint for active block card — works on both themes
function activeBg(color, dark) {
  return dark
    ? `${color}14`   // very dark tint
    : `${color}12`;  // very light tint
}

const DARK = {
  bg:          "#070710",
  surface:     "#0d0d1a",
  surfaceAlt:  "#0c0c1a",
  border:      "#1a1a2e",
  borderAlt:   "#0f0f1f",
  text:        "#e2e8f0",
  textMuted:   "#2a2a44",
  textDim:     "#181830",
  barBorder:   "#070710",
  thumbBorder: "#070710",
  thumbColor:  "#e2e8f0",
  scrubPreview:"#e2e8f0cc",
};

const LIGHT = {
  bg:          "#f4f6fb",
  surface:     "#ffffff",
  surfaceAlt:  "#f8f9fc",
  border:      "#dde2ef",
  borderAlt:   "#e8ecf5",
  text:        "#1a1a2e",
  textMuted:   "#8890aa",
  textDim:     "#c0c8db",
  barBorder:   "#f4f6fb",
  thumbBorder: "#f4f6fb",
  thumbColor:  "#1a1a2e",
  scrubPreview:"#1a1a2ecc",
};

const DAY_START = 8 * 60 + 30;
const DAY_END   = 16 * 60 + 30;
const DAY_TOTAL = DAY_END - DAY_START;

function toMins(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function fmtMins(m) {
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}
function timeLeft(viewMins, block) {
  const left = toMins(block.end) - viewMins;
  if (left <= 0) return null;
  if (left >= 60) return `${Math.floor(left / 60)}h ${left % 60}m`;
  return `${left}m`;
}

export default function App() {
  const [realNow, setRealNow] = useState(new Date());
  const [scrub, setScrub]     = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dark, setDark]       = useState(true);
  const resetRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setRealNow(new Date()), 10000);
    return () => clearInterval(t);
  }, []);

  const T = dark ? DARK : LIGHT;

  const realMins = realNow.getHours() * 60 + realNow.getMinutes();
  const viewMins = scrub !== null ? scrub : realMins;
  const isLive   = scrub === null;

  const currentBlock = BLOCKS.find(b => viewMins >= toMins(b.start) && viewMins < toMins(b.end));
  const nextBlock    = currentBlock ? BLOCKS[BLOCKS.indexOf(currentBlock) + 1] : null;
  const cfg          = currentBlock ? TYPE_CONFIG[currentBlock.type] : null;
  const accentColor  = cfg ? cfg.color : "#3b82f6";

  const realPct = Math.max(0, Math.min(100, ((realMins - DAY_START) / DAY_TOTAL) * 100));
  const viewPct = Math.max(0, Math.min(100, ((viewMins - DAY_START) / DAY_TOTAL) * 100));

  function handleSliderChange(e) {
    clearTimeout(resetRef.current);
    setDragging(true);
    setScrub(Number(e.target.value));
  }
  function handleSliderUp() {
    setDragging(false);
    resetRef.current = setTimeout(() => setScrub(null), 1800);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      color: T.text,
      fontFamily: "'Space Mono', monospace",
      padding: "32px 24px 48px",
      transition: "background 0.35s, color 0.35s",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@300;400;700&display=swap" rel="stylesheet" />
      <style>{`
        .scrubber {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 4px; border-radius: 2px;
          background: transparent; cursor: pointer; outline: none;
          position: relative; z-index: 30;
        }
        .scrubber::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: ${T.thumbColor};
          box-shadow: 0 0 8px ${T.thumbColor}88;
          border: 2px solid ${T.thumbBorder};
          cursor: grab; transition: transform 0.15s;
        }
        .scrubber:active::-webkit-slider-thumb { transform: scale(1.25); cursor: grabbing; }
        .scrubber::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: ${T.thumbColor};
          border: 2px solid ${T.thumbBorder}; cursor: grab;
        }
        .theme-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 20px; cursor: pointer;
          border: 1px solid ${T.border};
          background: ${T.surface};
          color: ${T.textMuted};
          font-family: 'Space Mono', monospace;
          font-size: 9px; letter-spacing: 2px;
          transition: background 0.3s, border-color 0.3s, color 0.3s;
        }
        .theme-btn:hover { border-color: ${accentColor}88; color: ${accentColor}; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div style={{ maxWidth: 660, margin: "0 auto" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 4, color: T.textMuted, marginBottom: 5 }}>DEVOPS · DAY PLANNER</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <div style={{
                fontFamily: "'JetBrains Mono'", fontSize: 40, fontWeight: 700,
                color: accentColor, letterSpacing: -2, lineHeight: 1,
                transition: "color 0.4s",
              }}>
                {isLive
                  ? realNow.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                  : fmtMins(viewMins)}
              </div>
              {!isLive && (
                <div style={{
                  fontSize: 8, color: "#3b82f6", letterSpacing: 2,
                  fontFamily: "'JetBrains Mono'", animation: "blink 1s infinite",
                }}>PREVIEW</div>
              )}
            </div>
          </div>

          {/* Right side: block badge + theme toggle */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            {/* Theme toggle */}
            <button className="theme-btn" onClick={() => setDark(d => !d)}>
              <span style={{ fontSize: 13 }}>{dark ? "☀️" : "🌙"}</span>
              {dark ? "LIGHT" : "DARK"}
            </button>

            {/* Block badge */}
            {currentBlock && cfg ? (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 8, letterSpacing: 3, color: T.textMuted, marginBottom: 6 }}>NOW IN</div>
                <div style={{
                  display: "inline-block",
                  background: `${cfg.color}18`,
                  border: `1px solid ${cfg.color}55`,
                  color: cfg.color, fontSize: 9, fontWeight: 700,
                  letterSpacing: 2, padding: "4px 12px", borderRadius: 4,
                  boxShadow: `0 0 14px ${cfg.color}22`,
                  transition: "all 0.3s",
                }}>{cfg.label}</div>
                {nextBlock && (
                  <div style={{ fontSize: 8, color: T.textMuted, marginTop: 6, letterSpacing: 1 }}>
                    next → {nextBlock.label} · {nextBlock.start}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 9, color: T.textMuted }}>
                {viewMins < DAY_START ? "Starts 08:30" : "Day complete ✓"}
              </div>
            )}
          </div>
        </div>

        {/* ── TIMELINE BAR ── */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            position: "relative", height: 28, borderRadius: 6,
            background: T.surface, border: `1px solid ${T.border}`,
            overflow: "hidden", transition: "background 0.35s, border-color 0.35s",
          }}>
            {BLOCKS.map(b => {
              const left  = ((toMins(b.start) - DAY_START) / DAY_TOTAL) * 100;
              const width = ((toMins(b.end) - toMins(b.start)) / DAY_TOTAL) * 100;
              const c     = TYPE_CONFIG[b.type].color;
              const isActive = currentBlock?.id === b.id;
              const isDone   = viewMins >= toMins(b.end);
              return (
                <div key={b.id} style={{
                  position: "absolute", top: 0, height: "100%",
                  left: `${left}%`, width: `calc(${width}% - 2px)`,
                  background: isDone
                    ? `${c}${dark ? "22" : "28"}`
                    : isActive
                      ? `linear-gradient(90deg,${c}${dark?"55":"60"},${c}${dark?"99":"bb"})`
                      : `${c}${dark?"18":"22"}`,
                  borderRight: `2px solid ${T.bg}`,
                  transition: "background 0.2s",
                  boxShadow: isActive ? `inset 0 0 12px ${c}44` : "none",
                }} />
              );
            })}

            {/* Live cursor */}
            {realMins >= DAY_START && realMins <= DAY_END && (
              <div style={{
                position: "absolute", top: 0, bottom: 0,
                left: `${realPct}%`, width: 2,
                background: isLive ? accentColor : `${T.textMuted}44`,
                boxShadow: isLive ? `0 0 6px ${accentColor}` : "none",
                transition: "background 0.4s, box-shadow 0.4s",
                zIndex: 5, pointerEvents: "none",
              }} />
            )}

            {/* Scrub preview marker */}
            {!isLive && (
              <div style={{
                position: "absolute", top: 0, bottom: 0,
                left: `${viewPct}%`, width: 2,
                background: T.scrubPreview,
                zIndex: 6, pointerEvents: "none",
              }} />
            )}
          </div>

          {/* Hour ticks */}
          <div style={{ position: "relative", height: 14, marginTop: 3, marginBottom: 2 }}>
            {[9,10,11,12,13,14,15,16].map(h => {
              const pct = ((h * 60 - DAY_START) / DAY_TOTAL) * 100;
              return (
                <div key={h} style={{
                  position: "absolute", left: `${pct}%`, transform: "translateX(-50%)",
                  fontSize: 7, color: T.textMuted, letterSpacing: 1,
                  fontFamily: "'JetBrains Mono'", transition: "color 0.35s",
                }}>{h}:00</div>
              );
            })}
          </div>

          {/* Slider */}
          <div style={{ position: "relative", padding: "6px 0 2px" }}>
            <input
              type="range" className="scrubber"
              min={DAY_START} max={DAY_END} step={1}
              value={viewMins}
              onChange={handleSliderChange}
              onMouseUp={handleSliderUp}
              onTouchEnd={handleSliderUp}
            />
          </div>

          <div style={{
            textAlign: "center", fontSize: 7, letterSpacing: 2, marginTop: 1,
            color: dragging ? "#3b82f666" : T.textDim,
            transition: "color 0.3s",
          }}>
            {dragging ? "RELEASE TO SNAP BACK TO NOW" : "DRAG SLIDER TO PREVIEW · SNAPS BACK AFTER 2s"}
          </div>
        </div>

        {/* ── BLOCK ROWS ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 20 }}>
          {BLOCKS.map(b => {
            const start    = toMins(b.start);
            const end      = toMins(b.end);
            const isActive = viewMins >= start && viewMins < end;
            const isDone   = viewMins >= end;
            const pct      = isActive ? Math.round(((viewMins - start) / (end - start)) * 100) : 0;
            const c        = TYPE_CONFIG[b.type];
            const tl       = timeLeft(viewMins, b);

            return (
              <div key={b.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                opacity: isDone ? (dark ? 0.28 : 0.35) : 1,
                transition: "opacity 0.3s",
              }}>
                {/* Start time */}
                <div style={{
                  width: 72, flexShrink: 0, textAlign: "right",
                  fontFamily: "'JetBrains Mono'", fontSize: 10,
                  color: isActive ? T.text : T.textMuted,
                  fontWeight: isActive ? 700 : 400,
                  transition: "color 0.3s",
                }}>{b.start}</div>

                {/* Bar */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    height: isActive ? 34 : 25,
                    borderRadius: 5,
                    background: isActive ? activeBg(c.color, dark) : T.surfaceAlt,
                    border: isActive
                      ? `1px solid ${c.color}44`
                      : `1px solid ${T.borderAlt}`,
                    overflow: "hidden", position: "relative",
                    transition: "height 0.25s, background 0.35s, border-color 0.35s, box-shadow 0.3s",
                    boxShadow: isActive ? `0 0 16px ${c.color}18` : "none",
                  }}>
                    {/* Fill */}
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: isDone ? "100%" : isActive ? `${pct}%` : "0%",
                      background: isDone
                        ? `${c.color}${dark ? "10" : "14"}`
                        : `linear-gradient(90deg, ${c.color}${dark?"28":"30"}, ${c.color}${dark?"60":"70"})`,
                      transition: dragging ? "width 0.05s" : "width 0.6s linear",
                    }} />
                    {/* Label row */}
                    <div style={{
                      position: "relative", zIndex: 1, height: "100%",
                      display: "flex", alignItems: "center", padding: "0 10px", gap: 7,
                    }}>
                      <span style={{ fontSize: isActive ? 13 : 10 }}>{b.icon}</span>
                      <span style={{
                        fontFamily: "'Space Mono'", fontSize: isActive ? 10 : 8.5,
                        fontWeight: isActive ? 700 : 400,
                        color: isActive ? c.color : T.textMuted,
                        letterSpacing: 0.3, transition: "color 0.3s",
                      }}>{b.label}</span>

                      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                        {isActive && tl && (
                          <span style={{
                            fontFamily: "'JetBrains Mono'", fontSize: 8,
                            color: c.color, opacity: 0.4, letterSpacing: 1,
                          }}>{tl} left</span>
                        )}
                        {isActive && (
                          <span style={{
                            fontFamily: "'JetBrains Mono'", fontSize: 9,
                            color: c.color, fontWeight: 700, opacity: 0.8, letterSpacing: 1,
                          }}>{pct}%</span>
                        )}
                        {!isActive && !isDone && (
                          <span style={{
                            fontFamily: "'JetBrains Mono'", fontSize: 7,
                            color: T.textDim, letterSpacing: 1,
                          }}>{end - start}m</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* End time */}
                <div style={{
                  width: 38, flexShrink: 0,
                  fontFamily: "'JetBrains Mono'", fontSize: 8,
                  color: T.textDim, transition: "color 0.35s",
                }}>{b.end}</div>
              </div>
            );
          })}
        </div>

        {/* ── LEGEND ── */}
        <div style={{ marginTop: 28, display: "flex", gap: 14, flexWrap: "wrap" }}>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: v.color, opacity: 0.6 }} />
              <span style={{ fontSize: 7, color: T.textMuted, letterSpacing: 2, transition: "color 0.35s" }}>{v.label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 7, color: T.textDim, letterSpacing: 2, transition: "color 0.35s" }}>
          LIVE · UPDATES EVERY 10S
        </div>
      </div>
    </div>
  );
}
