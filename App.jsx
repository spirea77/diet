import { useState, useEffect } from "react";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

const ITEMS = [
  { key: "fasting",   label: "간헐적단식", icon: "⏱️", color: "#a8c45a" },
  { key: "olive",     label: "올리브오일", icon: "🫒", color: "#c4a45a" },
  { key: "saltwater", label: "소금물",     icon: "🧂", color: "#5ac4c4" },
  { key: "vinegar",   label: "식초+레몬즙",icon: "🍋", color: "#c4915a" },
  { key: "exercise",  label: "운동",       icon: "💪", color: "#c45a8e" },
];

function pad(n) { return String(n).padStart(2, "0"); }

function generateTimeOptions() {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      options.push(label);
    }
  }
  return options;
}

function addHours(timeStr, hours) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  const nh = Math.floor((total % (24 * 60)) / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function getWeekDates(weekOffset = 0) {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7) + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function loadStorage() {
  try { return JSON.parse(localStorage.getItem("iftracker") || "{}"); } catch { return {}; }
}
function saveStorage(data) {
  localStorage.setItem("iftracker", JSON.stringify(data));
}

const timeOptions = generateTimeOptions();

// ─── Styles ─────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0f0a;
    --surface: #161a10;
    --surface2: #1e2416;
    --accent: #a8c45a;
    --accent2: #d4e88a;
    --accent3: #6b8f2e;
    --text: #e8edda;
    --text2: #9aab7e;
    --text3: #5a6845;
    --border: #2a3320;
    --gold: #c4a45a;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Noto Serif KR', serif;
    min-height: 100vh;
  }

  .app-header {
    text-align: center;
    padding: 48px 20px 32px;
    border-bottom: 1px solid var(--border);
    position: relative;
  }
  .app-header::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
  }
  .header-label {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 4px;
    color: var(--accent);
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .header-title { font-size: clamp(28px, 5vw, 48px); font-weight: 700; letter-spacing: -1px; }
  .header-title span { color: var(--accent); }
  .header-sub { margin-top: 10px; color: var(--text3); font-size: 13px; font-family: 'Space Mono', monospace; }

  .main { max-width: 900px; margin: 0 auto; padding: 32px 20px; }

  .date-bar {
    display: flex; align-items: center; justify-content: center; gap: 16px;
    margin-bottom: 28px; padding: 14px 24px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
  }
  .date-bar button {
    background: none; border: 1px solid var(--border); color: var(--text2);
    cursor: pointer; width: 32px; height: 32px; border-radius: 2px; font-size: 14px;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  }
  .date-bar button:hover { border-color: var(--accent); color: var(--accent); }
  .date-label { font-family: 'Space Mono', monospace; font-size: 13px; color: var(--accent2); min-width: 200px; text-align: center; }

  .time-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  @media (max-width: 580px) { .time-grid { grid-template-columns: 1fr; } }

  .time-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
    padding: 22px; position: relative; overflow: hidden;
  }
  .time-card::after {
    content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%;
    background: var(--accent3);
  }
  .time-card.end::after { background: var(--gold); }
  .card-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 3px; color: var(--text3); text-transform: uppercase; margin-bottom: 14px; }

  .time-select-row { display: flex; align-items: center; gap: 8px; }
  .time-select {
    background: var(--surface2); border: 1px solid var(--border); color: var(--text);
    font-family: 'Space Mono', monospace; font-size: 26px; font-weight: 700;
    padding: 8px 10px; border-radius: 2px; cursor: pointer; width: 110px;
    appearance: none; text-align: center; transition: border-color 0.2s;
  }
  .time-select:focus { outline: none; border-color: var(--accent); }
  .time-sep { font-size: 22px; font-weight: 700; color: var(--text3); font-family: 'Space Mono', monospace; }
  .end-time { font-family: 'Space Mono', monospace; font-size: 34px; font-weight: 700; color: var(--gold); }
  .time-hint { font-size: 11px; color: var(--text3); margin-top: 8px; font-family: 'Space Mono', monospace; }
  .time-hint b { color: var(--gold); }

  .section-card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 22px; margin-bottom: 20px; }
  .section-label {
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 3px; color: var(--text3);
    text-transform: uppercase; margin-bottom: 18px;
    display: flex; align-items: center; gap: 12px;
  }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .check-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 10px; }

  .check-item {
    display: flex; align-items: center; gap: 10px; padding: 12px 14px;
    background: var(--surface2); border: 1px solid var(--border); border-radius: 3px;
    cursor: pointer; transition: all 0.15s; user-select: none;
  }
  .check-item:hover { border-color: var(--accent3); }
  .check-item.checked { background: rgba(168,196,90,0.08); border-color: var(--accent); }

  .check-box {
    width: 18px; height: 18px; border: 1.5px solid var(--text3); border-radius: 2px;
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-size: 11px; transition: all 0.15s; color: var(--bg);
  }
  .check-item.checked .check-box { background: var(--accent); border-color: var(--accent); }

  .check-label { font-size: 13px; color: var(--text2); transition: color 0.15s; }
  .check-item.checked .check-label { color: var(--accent2); }

  .progress-bar { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; margin-top: 4px; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent3), var(--accent)); transition: width 0.4s ease; }
  .progress-text { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text3); margin-top: 6px; }

  .save-btn {
    width: 100%; padding: 15px; background: var(--accent); color: var(--bg);
    border: none; border-radius: 3px; font-family: 'Space Mono', monospace;
    font-size: 12px; font-weight: 700; letter-spacing: 2px; cursor: pointer;
    text-transform: uppercase; margin-bottom: 40px; transition: background 0.2s;
  }
  .save-btn:hover { background: var(--accent2); }

  .week-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .week-nav button {
    background: none; border: 1px solid var(--border); color: var(--text2);
    cursor: pointer; padding: 6px 14px; border-radius: 2px;
    font-family: 'Space Mono', monospace; font-size: 11px; transition: all 0.2s;
  }
  .week-nav button:hover { border-color: var(--accent); color: var(--accent); }
  .week-range { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--text2); }

  .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
  @media (max-width: 580px) { .week-grid { gap: 4px; } }

  .day-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 3px;
    padding: 10px 6px; text-align: center; min-height: 130px;
  }
  .day-card.today { border-color: var(--accent3); }
  .day-card.has-data { background: var(--surface2); }
  .day-name { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1px; color: var(--text3); text-transform: uppercase; margin-bottom: 4px; }
  .day-num { font-family: 'Space Mono', monospace; font-size: 16px; font-weight: 700; color: var(--text2); margin-bottom: 8px; }
  .day-card.today .day-num { color: var(--accent); }
  .day-times { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text3); margin-bottom: 6px; line-height: 1.6; }
  .day-dots { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); }
  .dot.done { }
  .day-score { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text3); margin-top: 5px; }

  .legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 14px; padding: 12px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 3px; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text3); }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

  .weekly-divider { border-top: 1px solid var(--border); padding-top: 32px; }

  .toast {
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(80px);
    background: var(--accent); color: var(--bg); padding: 12px 28px; border-radius: 3px;
    font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; letter-spacing: 1px;
    transition: transform 0.3s ease; z-index: 999; pointer-events: none;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }
`;

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentDateKey, setCurrentDateKey] = useState(getTodayKey());
  const [startTime, setStartTime] = useState("08:00");
  const [checked, setChecked] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [toast, setToast] = useState(false);

  const endTime = addHours(startTime, 16);
  const todayKey = getTodayKey();

  // Load day data when date changes
  useEffect(() => {
    const data = loadStorage();
    const rec = data[currentDateKey];
    if (rec) {
      setStartTime(rec.startTime || "08:00");
      setChecked(rec.checked || {});
    } else {
      setStartTime("08:00");
      setChecked({});
    }
  }, [currentDateKey]);

  const checkedCount = ITEMS.filter(i => checked[i.key]).length;
  const progressPct = (checkedCount / ITEMS.length) * 100;

  function toggleItem(key) {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function changeDate(delta) {
    const [y, m, d] = currentDateKey.split("-").map(Number);
    const nd = new Date(y, m - 1, d);
    nd.setDate(nd.getDate() + delta);
    setCurrentDateKey(`${nd.getFullYear()}-${pad(nd.getMonth() + 1)}-${pad(nd.getDate())}`);
  }

  function formatDateLabel(key) {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    return `${y}년 ${m}월 ${d}일 (${dayNames[date.getDay()]})`;
  }

  function saveDay() {
    const data = loadStorage();
    data[currentDateKey] = { startTime, endTime, checked };
    saveStorage(data);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  }

  // Weekly
  const weekDates = getWeekDates(weekOffset);
  const data = loadStorage();

  const weekStart = weekDates[0].slice(5).replace("-", "/");
  const weekEnd = weekDates[6].slice(5).replace("-", "/");

  return (
    <>
      <style>{css}</style>

      <header className="app-header">
        <div className="header-label">16:8 Protocol</div>
        <h1 className="header-title">간헐적 <span>단식</span> 트래커</h1>
        <p className="header-sub">Intermittent Fasting Daily Log</p>
      </header>

      <main className="main">

        {/* Date Nav */}
        <div className="date-bar">
          <button onClick={() => changeDate(-1)}>◀</button>
          <span className="date-label">{formatDateLabel(currentDateKey)}</span>
          <button onClick={() => changeDate(1)}>▶</button>
        </div>

        {/* Times */}
        <div className="time-grid">
          <div className="time-card">
            <div className="card-label">🌅 시작 시간 (아침)</div>
            <div className="time-select-row">
              <select
                className="time-select"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              >
                {timeOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="time-hint">단식 시작 시각을 선택하세요</div>
          </div>
          <div className="time-card end">
            <div className="card-label">🌙 종료 시간 (저녁)</div>
            <div className="end-time">{endTime}</div>
            <div className="time-hint">시작 후 <b>16시간</b> 뒤 자동 계산</div>
          </div>
        </div>

        {/* Checklist */}
        <div className="section-card">
          <div className="section-label">오늘의 실천 항목</div>
          <div className="check-grid">
            {ITEMS.map(item => (
              <div
                key={item.key}
                className={`check-item${checked[item.key] ? " checked" : ""}`}
                onClick={() => toggleItem(item.key)}
              >
                <div className="check-box">{checked[item.key] ? "✓" : ""}</div>
                <span>{item.icon}</span>
                <span className="check-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="section-card" style={{ padding: "16px 22px" }}>
          <div className="section-label">오늘 달성률</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="progress-text">{checkedCount} / {ITEMS.length} 항목 완료</div>
        </div>

        {/* Save */}
        <button className="save-btn" onClick={saveDay}>✓ 오늘 기록 저장</button>

        {/* Weekly */}
        <div className="weekly-divider">
          <div className="section-label" style={{ marginBottom: 14 }}>주간 현황</div>
          <div className="week-nav">
            <button onClick={() => setWeekOffset(w => w - 1)}>◀ 이전 주</button>
            <span className="week-range">{weekStart} ~ {weekEnd}</span>
            <button onClick={() => setWeekOffset(w => w + 1)}>다음 주 ▶</button>
          </div>

          <div className="week-grid">
            {weekDates.map((key, i) => {
              const rec = data[key];
              const [, , d] = key.split("-").map(Number);
              const isToday = key === todayKey;
              const score = rec ? ITEMS.filter(item => rec.checked?.[item.key]).length : 0;
              return (
                <div key={key} className={`day-card${isToday ? " today" : ""}${rec ? " has-data" : ""}`}>
                  <div className="day-name">{DAYS[i]}</div>
                  <div className="day-num">{d}</div>
                  {rec && (
                    <>
                      <div className="day-times">
                        {rec.startTime}<br />↓<br />{rec.endTime}
                      </div>
                      <div className="day-dots">
                        {ITEMS.map(item => (
                          <div
                            key={item.key}
                            className={`dot${rec.checked?.[item.key] ? " done" : ""}`}
                            style={rec.checked?.[item.key] ? { background: item.color } : {}}
                            title={item.label}
                          />
                        ))}
                      </div>
                      <div className="day-score">{score}/{ITEMS.length}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="legend">
            {ITEMS.map(item => (
              <div key={item.key} className="legend-item">
                <div className="legend-dot" style={{ background: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

      </main>

      <div className={`toast${toast ? " show" : ""}`}>✓ 저장 완료!</div>
    </>
  );
}
