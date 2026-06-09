import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const PERIOD_COLORS = {
  Morning:   { bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.3)",   text: "#fbbf24", glow: "rgba(251,191,36,0.15)" },
  Afternoon: { bg: "rgba(78,205,196,0.08)",  border: "rgba(78,205,196,0.3)",   text: "#4ecdc4", glow: "rgba(78,205,196,0.15)" },
  Evening:   { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.3)",  text: "#a78bfa", glow: "rgba(167,139,250,0.15)" },
};

const TRANSIT_STYLES = {
  walking:  { color: "#4ecdc4", bg: "rgba(78,205,196,0.12)",  border: "rgba(78,205,196,0.3)"  },
  subway:   { color: "#818cf8", bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.3)" },
  train:    { color: "#818cf8", bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.3)" },
  taxi:     { color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)"  },
  bus:      { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"  },
  ferry:    { color: "#22d3ee", bg: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.3)"  },
  car:      { color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)"  },
  rickshaw: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"  },
};

const MOODS = [
  { id: "tired",     label: "😴 Tired",     prompt: "Replace remaining activities with relaxing, low-energy options — spas, cafes, parks, gentle walks." },
  { id: "energised", label: "⚡ Energised",  prompt: "Add more active experiences, adventure spots, and extra sightseeing." },
  { id: "hungry",    label: "🍽️ Hungry",    prompt: "Prioritise the best food stops, local markets, and street food experiences." },
  { id: "rainy",     label: "🌧️ Rainy Day", prompt: "Replace all outdoor activities with indoor alternatives — museums, galleries, cafes." },
  { id: "romantic",  label: "💑 Romantic",   prompt: "Swap for candlelit restaurants, sunset spots, wine bars, scenic walks." },
];

const CO2_SCORES = {
  "Budget ($)":    { score: 72, label: "Good",        color: "#4ecdc4" },
  "Moderate ($$)": { score: 55, label: "Average",     color: "#fbbf24" },
  "Premium ($$$)": { score: 38, label: "Below avg",   color: "#f97316" },
  "Luxury ($$$$)": { score: 22, label: "High impact", color: "#f472b6" },
};

const unsplashImg = (query, w = 1200, h = 500, sig = 0) =>
  `https://source.unsplash.com/featured/${w}x${h}/?${encodeURIComponent(query)}&sig=${sig}`;

/* ─────────────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="tr-skeleton">
      <div className="tr-skeleton__hero">
        <div className="sk-bar sk-bar--xl" /><div className="sk-bar sk-bar--md" /><div className="sk-bar sk-bar--sm" />
      </div>
      <div className="tr-skeleton__tabs">
        {[1,2,3,4,5,6,7,8].map(i => <div className="sk-tab" key={i} />)}
      </div>
      <div className="sk-route-map" />
      <div className="sk-timeline">
        {[1,2,3].map(i => (
          <div className="sk-stop" key={i}>
            <div className="sk-stop__img" />
            <div className="sk-stop__body">
              <div className="sk-bar sk-bar--lg" />
              <div className="sk-bar sk-bar--md" />
              <div className="sk-bar sk-bar--sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO INFO CHIP
───────────────────────────────────────────── */
function InfoChip({ emoji, label, value }) {
  return (
    <div className="info-chip">
      <span className="info-chip__emoji">{emoji}</span>
      <div>
        <div className="info-chip__label">{label}</div>
        <div className="info-chip__value">{value}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SVG ROUTE MAP
───────────────────────────────────────────── */
function DayRouteMap({ schedule, activeIdx, onSelectStop }) {
  const N = schedule.length;
  const W = Math.max(800, N * 130);
  const H = 180;
  const Y = 90;
  const PAD = 70;
  const STEP = N > 1 ? (W - PAD * 2) / (N - 1) : 0;

  const nodes = schedule.map((item, i) => ({
    x: PAD + i * STEP,
    y: Y + (i % 2 === 0 ? -18 : 18),
    item, i,
  }));

  return (
    <div className="rm-wrap">
      <div className="rm-label">Route Overview — Day Map</div>
      <div className="rm-scroll-area">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="rm-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="activeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="tealGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4ecdc4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4ecdc4" stopOpacity="0" />
            </radialGradient>
            <filter id="glow-filter">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <pattern id="dot-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.04)" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width={W} height={H} fill="url(#dot-grid)" />

          {/* Connecting paths */}
          {nodes.map((node, i) => {
            if (i === 0) return null;
            const prev = nodes[i - 1];
            const cpx = (prev.x + node.x) / 2;
            const isNearActive = Math.abs(i - activeIdx) <= 1;
            return (
              <g key={`conn-${i}`}>
                <path
                  d={`M${prev.x},${prev.y} C${cpx},${prev.y} ${cpx},${node.y} ${node.x},${node.y}`}
                  fill="none"
                  stroke={isNearActive ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.1)"}
                  strokeWidth={isNearActive ? "2" : "1.5"}
                  strokeDasharray="7 4"
                  className="rm-path-anim"
                />
                {/* Transport pill */}
                {node.item.transit && (
                  <text
                    x={cpx}
                    y={Math.min(prev.y, node.y) - 10}
                    textAnchor="middle"
                    fill={isNearActive ? "rgba(201,168,76,0.9)" : "rgba(255,255,255,0.25)"}
                    fontSize="10"
                    fontFamily="DM Sans, sans-serif"
                    fontWeight="500"
                  >
                    {node.item.transit.methodEmoji} {node.item.transit.duration}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(({ x, y, item, i }) => {
            const isActive = activeIdx === i;
            const pColors = PERIOD_COLORS[item.period] || PERIOD_COLORS.Morning;
            return (
              <g key={`node-${i}`} onClick={() => onSelectStop(i)} style={{ cursor: "pointer" }} className="rm-node-g">
                {isActive && <circle cx={x} cy={y} r="34" fill="url(#activeGlow)" />}
                {isActive && <circle cx={x} cy={y} r="26" fill="none" stroke="rgba(201,168,76,0.35)" strokeWidth="1" className="rm-ring-pulse" />}
                <circle
                  cx={x} cy={y} r="19"
                  fill={isActive ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.05)"}
                  stroke={isActive ? "#c9a84c" : pColors.border}
                  strokeWidth={isActive ? "1.8" : "1.2"}
                  filter={isActive ? "url(#glow-filter)" : ""}
                />
                {/* Emoji */}
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="15">{item.emoji}</text>
                {/* Order number */}
                <text x={x + 14} y={y - 12} textAnchor="middle" fill="rgba(201,168,76,0.8)" fontSize="9" fontWeight="600" fontFamily="DM Sans">{i + 1}</text>
                {/* Time */}
                <text x={x} y={y - 30} textAnchor="middle" fill={isActive ? "#c9a84c" : "rgba(255,255,255,0.35)"} fontSize="9.5" fontFamily="DM Sans" fontWeight={isActive ? "600" : "400"}>{item.time}</text>
                {/* Place name */}
                <text x={x} y={y + 36} textAnchor="middle" fill={isActive ? "rgba(240,237,230,0.8)" : "rgba(240,237,230,0.3)"} fontSize="9" fontFamily="DM Sans">
                  {item.place?.length > 13 ? item.place.slice(0, 13) + "…" : item.place}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TRANSIT CONNECTOR
───────────────────────────────────────────── */
function TransitConnector({ transit }) {
  if (!transit) return <div className="tc-blank" />;
  const method = transit.method?.toLowerCase() || "taxi";
  const s = TRANSIT_STYLES[method] || TRANSIT_STYLES.taxi;
  return (
    <div className="tc">
      <div className="tc__spine" />
      <div className="tc__badge" style={{ background: s.bg, borderColor: s.border, color: s.color }}>
        <span className="tc__emoji">{transit.methodEmoji}</span>
        <span className="tc__method">{transit.method}</span>
        <span className="tc__dot">·</span>
        <span>{transit.duration}</span>
        <span className="tc__dot">·</span>
        <span>{transit.distance}</span>
        {transit.cost && transit.cost !== "Free" && (
          <><span className="tc__dot">·</span><span className="tc__cost">{transit.cost}</span></>
        )}
      </div>
      <div className="tc__spine" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   CINEMATIC STOP CARD
───────────────────────────────────────────── */
function CinematicStop({ item, index, isActive, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const colors = PERIOD_COLORS[item.period] || PERIOD_COLORS.Morning;
  const imgUrl = unsplashImg(item.imageQuery || item.place + " travel", 1200, 480, index * 37 + 1);

  return (
    <div
      className={`cs${isActive ? " cs--active" : ""}`}
      onClick={onClick}
      style={{ "--period-color": colors.text, "--period-border": colors.border, "--period-bg": colors.bg, "--period-glow": colors.glow }}
    >
      {/* ── Banner Image ── */}
      <div className="cs__banner">
        {!imgError && (
          <img
            src={imgUrl}
            alt={item.place}
            className={`cs__banner-img${imgLoaded ? " cs__banner-img--loaded" : ""}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}
        <div className="cs__banner-overlay" />
        {/* Gradient fallback always visible until image loads */}
        {!imgLoaded && (
          <div className="cs__banner-fallback" style={{
            background: `linear-gradient(135deg, ${colors.glow}, rgba(8,10,15,0.8) 70%)`
          }} />
        )}
        {/* Top badges */}
        <div className="cs__banner-top">
          <span className="cs__time-badge">{item.time}</span>
          <span className="cs__period-badge" style={{ color: colors.text, background: colors.bg, borderColor: colors.border }}>
            {item.emoji} {item.period}
          </span>
        </div>
        {/* Bottom: stop number */}
        <div className="cs__banner-num">{String(index + 1).padStart(2, "0")}</div>
      </div>

      {/* ── Card Body ── */}
      <div className="cs__body" style={{ borderColor: isActive ? colors.border : "var(--border)" }}>
        <h3 className="cs__activity">{item.activity}</h3>
        <div className="cs__place-row">
          <span className="cs__place">📍 {item.place}</span>
          {item.area && <span className="cs__area">{item.area}</span>}
        </div>

        <div className="cs__chips">
          <span className="cs__chip cs__chip--duration">⏱ {item.duration}</span>
          {item.cost && (
            <span className="cs__chip cs__chip--cost" style={{ color: item.cost === "Free" ? "#4ecdc4" : "#fbbf24" }}>
              {item.cost === "Free" ? "✓ Free" : `💰 ${item.cost}`}
            </span>
          )}
        </div>

        {item.tip && (
          <div className="cs__tip">
            <span className="cs__tip-icon">💡</span>
            <span>{item.tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DAY BUDGET SUMMARY
───────────────────────────────────────────── */
function DayBudgetSummary({ schedule, totalEstimatedCost }) {
  const items = (schedule || []).filter(s => s.cost && s.cost !== "Free");
  return (
    <div className="dbs">
      <div className="dbs__label">Day Cost Breakdown</div>
      <div className="dbs__items">
        {items.map((s, i) => (
          <div className="dbs__item" key={i}>
            <span className="dbs__emoji">{s.emoji}</span>
            <span className="dbs__name">{s.activity}</span>
            <span className="dbs__cost">{s.cost}</span>
          </div>
        ))}
        {items.length === 0 && <div className="dbs__free">✓ Mostly free activities today</div>}
      </div>
      {totalEstimatedCost && (
        <div className="dbs__total">
          <span>Estimated total</span>
          <span className="dbs__total-val">{totalEstimatedCost}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MOOD REROUTER (preserved)
───────────────────────────────────────────── */
function MoodRerouter({ tripData, currentDay, onRerouted }) {
  const [activeMood, setActiveMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleMood = async (mood) => {
    setActiveMood(mood.id); setLoading(true);
    try {
      const s = tripData.structured;
      const res = await axios.post("http://localhost:5000/reroute-day", {
        destination: s.destination, day: s.days[currentDay],
        mood: mood.prompt, budget: tripData.budget, travelStyle: tripData.travelStyle,
      });
      if (res.data?.schedule) { onRerouted(currentDay, res.data.schedule); setDone(true); }
    } catch { /* silent */ }
    setLoading(false);
  };

  if (done) return (
    <div className="mood-done">
      <span>✦</span> Day {currentDay + 1} re-crafted for your mood.
      <button className="btn btn--ghost btn--sm" style={{ marginLeft: "12px" }} onClick={() => setDone(false)}>Change again</button>
    </div>
  );

  return (
    <div className="mood-rerouter">
      <div className="mood-label">✦ How are you feeling right now?</div>
      <div className="mood-pills">
        {MOODS.map(m => (
          <button key={m.id} className={`mood-pill${activeMood === m.id ? " mood-pill--active" : ""}`}
            onClick={() => handleMood(m)} disabled={loading}>
            {loading && activeMood === m.id ? "Rerouting…" : m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GOLDEN HOUR (preserved)
───────────────────────────────────────────── */
function GoldenHour({ destination }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const addMinutes = (time, mins) => {
    const [h, m] = time.split(":").map(Number);
    const total = h * 60 + m + mins;
    const nh = Math.floor(total / 60) % 24;
    const nm = ((total % 60) + 60) % 60;
    return `${String(nh).padStart(2,"0")}:${String(nm).padStart(2,"0")}`;
  };

  useEffect(() => {
    (async () => {
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results?.[0]) throw new Error("not found");
        const { latitude, longitude, timezone } = geoData.results[0];
        const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset,precipitation_probability_max&timezone=${timezone}&forecast_days=5`);
        const wx = await wxRes.json();
        const d = wx.daily;
        setData({
          sunrise: d.sunrise[0].split("T")[1], sunset: d.sunset[0].split("T")[1],
          goldenMorning: addMinutes(d.sunrise[0].split("T")[1], -20),
          goldenEvening: addMinutes(d.sunset[0].split("T")[1], -30),
          rain: d.precipitation_probability_max[0],
          days: d.sunrise.slice(0,5).map((s,i) => ({
            sunrise: s.split("T")[1], sunset: d.sunset[i].split("T")[1], rain: d.precipitation_probability_max[i],
          }))
        });
      } catch { setData(null); }
      setLoading(false);
    })();
  }, [destination]);

  const DAYS = ["Today","Mon","Tue","Wed","Thu"];
  if (loading) return <div className="gh-loading">Fetching golden hours for {destination}…</div>;
  if (!data) return <div className="gh-loading">Could not load data. Check your connection.</div>;

  return (
    <div className="golden-hour">
      <div className="gh-hero">
        <div className="gh-main">
          <div className="gh-block">
            <span className="gh-icon">🌅</span>
            <span className="gh-label">Golden Morning</span>
            <span className="gh-time">{data.goldenMorning}</span>
            <span className="gh-sub">Sunrise {data.sunrise}</span>
          </div>
          <div className="gh-divider" />
          <div className="gh-block">
            <span className="gh-icon">🌇</span>
            <span className="gh-label">Golden Evening</span>
            <span className="gh-time">{data.goldenEvening}</span>
            <span className="gh-sub">Sunset {data.sunset}</span>
          </div>
        </div>
        <div className="gh-rain">
          <span>🌧️</span>
          <span className="gh-rain__label">Rain chance today</span>
          <span className="gh-rain__val" style={{ color: data.rain > 60 ? "#f472b6" : data.rain > 30 ? "#fbbf24" : "#4ecdc4" }}>{data.rain}%</span>
        </div>
      </div>
      <div className="gh-week">
        <div className="gh-week__label">5-Day Golden Hours</div>
        <div className="gh-week__row">
          {data.days.map((d,i) => (
            <div className="gh-day" key={i}>
              <span className="gh-day__name">{DAYS[i]}</span>
              <span className="gh-day__sr">🌅 {d.sunrise}</span>
              <span className="gh-day__ss">🌇 {d.sunset}</span>
              <span className="gh-day__rain" style={{ color: d.rain > 60 ? "#f472b6" : d.rain > 30 ? "#fbbf24" : "#4ecdc4" }}>{d.rain}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="gh-tip">💡 Schedule viewpoints 30 min before golden evening for best light.</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BUDGET TRACKER (preserved)
───────────────────────────────────────────── */
function BudgetTracker({ days, budget }) {
  const budgetMap = { "Budget ($)": 30, "Moderate ($$)": 80, "Premium ($$$)": 180, "Luxury ($$$$)": 400 };
  const daily = budgetMap[budget] || 80;
  const total = daily * (days || 3);
  const [spent, setSpent] = useState(0);
  const [items, setItems] = useState([]);
  const [input, setInput] = useState({ label: "", amount: "" });

  const add = () => {
    if (!input.label || !input.amount) return;
    const amt = parseFloat(input.amount);
    setItems(p => [...p, { label: input.label, amount: amt, id: Date.now() }]);
    setSpent(p => p + amt);
    setInput({ label: "", amount: "" });
  };
  const remove = (id, amt) => { setItems(p => p.filter(i => i.id !== id)); setSpent(p => Math.max(0, p - amt)); };
  const pct = Math.min((spent / total) * 100, 100);
  const remaining = total - spent;
  const barColor = pct > 90 ? "#f472b6" : pct > 70 ? "#f97316" : "#4ecdc4";

  return (
    <div className="budget-tracker">
      <div className="budget-tracker__header">
        <div className="bt-stat"><span className="bt-stat__label">Total Budget</span><span className="bt-stat__val">${total}</span></div>
        <div className="bt-stat"><span className="bt-stat__label">Spent</span><span className="bt-stat__val" style={{ color: "#f97316" }}>${spent.toFixed(0)}</span></div>
        <div className="bt-stat"><span className="bt-stat__label">Remaining</span><span className="bt-stat__val" style={{ color: remaining < 0 ? "#f472b6" : "#4ecdc4" }}>${remaining.toFixed(0)}</span></div>
      </div>
      <div className="bt-bar-wrap"><div className="bt-bar"><div className="bt-bar__fill" style={{ width: `${pct}%`, background: barColor }} /></div><span className="bt-bar__pct">{pct.toFixed(0)}%</span></div>
      <div className="bt-add">
        <input className="bt-input" placeholder="What did you spend on?" value={input.label} onChange={e => setInput(p => ({ ...p, label: e.target.value }))} />
        <input className="bt-input bt-input--num" placeholder="$0" type="number" value={input.amount} onChange={e => setInput(p => ({ ...p, amount: e.target.value }))} />
        <button className="btn btn--ghost btn--sm" onClick={add}>+ Add</button>
      </div>
      {items.length > 0 && <div className="bt-items">{items.map(item => (<div className="bt-item" key={item.id}><span className="bt-item__label">{item.label}</span><span className="bt-item__amt">${item.amount.toFixed(0)}</span><button className="bt-item__del" onClick={() => remove(item.id, item.amount)}>×</button></div>))}</div>}
      {remaining < 0 && <div className="bt-warning">⚠ ${Math.abs(remaining).toFixed(0)} over budget</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CARBON SCORE (preserved)
───────────────────────────────────────────── */
function CarbonScore({ budget, days }) {
  const info = CO2_SCORES[budget] || CO2_SCORES["Moderate ($$)"];
  const totalKg = Math.round((100 - info.score) * 0.4 * (days || 3));
  const trees = Math.ceil(totalKg / 21);
  const circ = 2 * Math.PI * 50;
  return (
    <div className="carbon-score">
      <div className="cs-ring-wrap">
        <svg viewBox="0 0 120 120" className="cs-ring">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={info.color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - info.score / 100)}
            strokeLinecap="round" transform="rotate(-90 60 60)" />
          <text x="60" y="54" textAnchor="middle" fill={info.color} fontSize="22" fontWeight="600">{info.score}</text>
          <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="11">/100</text>
        </svg>
        <div className="cs-label-wrap"><span className="cs-label">Sustainability</span><span className="cs-grade" style={{ color: info.color }}>{info.label}</span></div>
      </div>
      <div className="cs-details">
        <div className="cs-stat"><span className="cs-stat__icon">💨</span><div><div className="cs-stat__val">{totalKg} kg CO₂</div><div className="cs-stat__label">Estimated emissions</div></div></div>
        <div className="cs-stat"><span className="cs-stat__icon">🌳</span><div><div className="cs-stat__val">{trees} trees</div><div className="cs-stat__label">To offset your footprint</div></div></div>
        <a href="https://www.greentripper.org" target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm" style={{ alignSelf: "flex-start" }}>Offset my trip →</a>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CO-PILOT CHAT (preserved)
───────────────────────────────────────────── */
function CopilotChat({ tripData }) {
  const [messages, setMessages] = useState([{
    role: "ai", text: `Hi! I know your full ${tripData?.structured?.destination || ""} itinerary. Ask me anything — swap a stop, find alternatives, local advice.`
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim(); setInput(""); setLoading(true);
    setMessages(p => [...p, { role: "user", text: msg }]);
    try {
      const res = await axios.post("http://localhost:5000/copilot", { message: msg, tripContext: tripData?.structured || {} });
      setMessages(p => [...p, { role: "ai", text: res.data.reply }]);
    } catch { setMessages(p => [...p, { role: "ai", text: "Sorry, couldn't connect. Try again." }]); }
    setLoading(false);
  };

  return (
    <div className="copilot">
      <div className="copilot__messages">
        {messages.map((m,i) => (
          <div key={i} className={`copilot__msg copilot__msg--${m.role}`}>
            {m.role === "ai" && <span className="copilot__avatar">✦</span>}
            <span className="copilot__text">{m.text}</span>
          </div>
        ))}
        {loading && <div className="copilot__msg copilot__msg--ai"><span className="copilot__avatar">✦</span><span className="copilot__typing"><span /><span /><span /></span></div>}
        <div ref={bottomRef} />
      </div>
      <div className="copilot__input-row">
        <input className="copilot__input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask anything about your trip…" disabled={loading} />
        <button className="copilot__send" onClick={send} disabled={loading || !input.trim()}>→</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GROUP SYNC (preserved)
───────────────────────────────────────────── */
function GroupSync({ tripData }) {
  const [votes, setVotes] = useState({});
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const s = tripData?.structured;
  if (!s) return null;
  const activities = s.days.flatMap(d => (d.schedule || []).map(item => ({ id: `${d.day}-${item.time}`, label: `Day ${d.day}: ${item.activity} @ ${item.place}` }))).slice(0, 8);
  const yesCount = Object.values(votes).filter(Boolean).length;

  if (submitted) return (
    <div className="group-done">
      <span className="group-done__icon">✦</span>
      <div><div className="group-done__title">Votes submitted!</div><div className="group-done__sub">{name} voted YES on {yesCount} activities.</div></div>
      <button className="btn btn--ghost btn--sm" onClick={() => setSubmitted(false)}>Vote again</button>
    </div>
  );

  return (
    <div className="group-sync">
      <div className="gs-intro">Vote on activities. Share with your group and let the majority win.</div>
      <input className="gs-name-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
      <div className="gs-activities">
        {activities.map(a => (
          <div key={a.id} className={`gs-activity${votes[a.id] ? " gs-activity--yes" : ""}`} onClick={() => setVotes(p => ({ ...p, [a.id]: !p[a.id] }))}>
            <span className="gs-activity__check">{votes[a.id] ? "✓" : "○"}</span>
            <span className="gs-activity__label">{a.label}</span>
          </div>
        ))}
      </div>
      <div className="gs-footer">
        <span className="gs-count">{yesCount}/{activities.length} selected</span>
        <button className="btn btn--primary" style={{ padding: "10px 24px", fontSize: "13px" }}
          onClick={() => name.trim() && setSubmitted(true)} disabled={!name.trim()}>Submit Votes</button>
      </div>
      <div className="gs-share">
        <span className="gs-share__label">Share link:</span>
        <span className="gs-share__url">voyance.ai/trip/{s.destination?.toLowerCase().replace(/\s/g,"-")}/vote</span>
        <button className="btn btn--ghost btn--sm" onClick={() => navigator.clipboard?.writeText(`voyance.ai/trip/${s.destination?.toLowerCase().replace(/\s/g,"-")}/vote`)}>Copy</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TRIP NAV
───────────────────────────────────────────── */
function TripNav({ onBack, onHome, destination }) {
  return (
    <nav className="nav nav--scrolled">
      <div className="nav__logo" onClick={onHome} style={{ cursor: "pointer" }}>
        <span className="nav__logo-mark">✦</span>
        <span className="nav__logo-text">Voyance</span>
        <span className="nav__logo-tag">AI</span>
      </div>
      {destination && <span className="nav__trip-dest">→ {destination}</span>}
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="btn btn--ghost btn--sm" onClick={onBack}>← New Trip</button>
        <button className="btn btn--ghost btn--sm" onClick={onHome}>Home</button>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   MAIN TRIP RESULT
───────────────────────────────────────────── */
export default function TripResult({ tripData, loading, onBack, onHome }) {
  const [activeSection, setActiveSection] = useState("itinerary");
  const [activeDay, setActiveDay] = useState(0);
  const [activeStop, setActiveStop] = useState(0);
  const [localDays, setLocalDays] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (tripData?.structured?.days) setLocalDays(tripData.structured.days);
    setActiveDay(0); setActiveStop(0);
    setActiveSection("itinerary"); setChatOpen(false);
  }, [tripData]);

  if (loading) return (
    <div className="app-root trip-page">
      <TripNav onBack={onBack} onHome={onHome} destination="" />
      <div className="trip-content"><LoadingSkeleton /></div>
    </div>
  );

  if (!tripData) return null;

  const s = tripData.structured;
  if (!s?.days) {
    const raw = tripData.itinerary || tripData.trip || JSON.stringify(tripData);
    return (
      <div className="app-root trip-page">
        <TripNav onBack={onBack} onHome={onHome} destination="" />
        <div className="trip-content"><pre className="tr-raw">{raw}</pre></div>
      </div>
    );
  }

  const days = localDays || s.days;
  const handleRerouted = (dayIdx, newSchedule) => {
    setLocalDays(prev => {
      const updated = [...(prev || s.days)];
      updated[dayIdx] = { ...updated[dayIdx], schedule: newSchedule };
      return updated;
    });
    setActiveStop(0);
  };

  const currentDay = days[activeDay];
  const currentSchedule = currentDay?.schedule || [];

  const SECTIONS = [
    { id: "itinerary", label: "📅 Itinerary" },
    { id: "hotel",     label: "🏨 Stay" },
    { id: "food",      label: "🍽️ Eat" },
    { id: "gems",      label: "💎 Hidden Gems" },
    { id: "golden",    label: "🌅 Golden Hours" },
    { id: "budget",    label: "💰 Budget" },
    { id: "carbon",    label: "🌿 Eco Score" },
    { id: "group",     label: "👥 Group Vote" },
  ];

  const coverImg = unsplashImg(s.coverImageQuery || s.destination + " travel cityscape", 1600, 600, 99);

  return (
    <div className="app-root trip-page">
      <TripNav onBack={onBack} onHome={onHome} destination={s.destination} />

      <div className="trip-content">

        {/* ── CINEMATIC HERO COVER ── */}
        <div className="tr-cover">
          <img src={coverImg} alt={s.destination} className="tr-cover__img" loading="eager" onError={e => e.target.style.display="none"} />
          <div className="tr-cover__overlay" />
          <div className="tr-cover__orb tr-cover__orb--1" />
          <div className="tr-cover__orb tr-cover__orb--2" />
          <div className="tr-cover__content">
            <div className="tr-cover__eyebrow"><span className="tr-cover__dot" />AI-Crafted · {days.length} {days.length === 1 ? "Day" : "Days"}</div>
            <h1 className="tr-cover__title">{s.destination}</h1>
            {s.tagline && <p className="tr-cover__tagline">"{s.tagline}"</p>}
            <div className="tr-cover__chips">
              {s.bestTimeToVisit && <InfoChip emoji="🗓️" label="Best Time" value={s.bestTimeToVisit} />}
              {s.currency && <InfoChip emoji="💱" label="Currency" value={s.currency} />}
              {s.language && <InfoChip emoji="🗣️" label="Language" value={s.language} />}
              {tripData.travelStyle && <InfoChip emoji="✦" label="Style" value={tripData.travelStyle} />}
            </div>
          </div>
        </div>

        {/* ── SECTION TABS ── */}
        <div className="tr-section-tabs">
          {SECTIONS.map(sec => (
            <button key={sec.id}
              className={`tr-section-tab${activeSection === sec.id ? " tr-section-tab--active" : ""}`}
              onClick={() => setActiveSection(sec.id)}>
              {sec.label}
            </button>
          ))}
        </div>

        {/* ══════════ ITINERARY ══════════ */}
        {activeSection === "itinerary" && (
          <div className="tr-itinerary">
            <MoodRerouter tripData={tripData} currentDay={activeDay} onRerouted={handleRerouted} />

            {/* Day selector tabs */}
            <div className="tr-day-tabs">
              {days.map((d, i) => (
                <button key={i}
                  className={`tr-day-tab${activeDay === i ? " tr-day-tab--active" : ""}`}
                  onClick={() => { setActiveDay(i); setActiveStop(0); }}>
                  <span className="tr-day-tab__num">Day {d.day}</span>
                  <span className="tr-day-tab__theme">{d.theme}</span>
                  {d.area && <span className="tr-day-tab__area">{d.area}</span>}
                </button>
              ))}
            </div>

            {/* Day header */}
            {currentDay && (
              <div className="day-header">
                <div className="day-header__left">
                  <span className="day-header__num">Day {currentDay.day}</span>
                  <h2 className="day-header__theme">{currentDay.theme}</h2>
                  {currentDay.area && <span className="day-header__area">📍 {currentDay.area}</span>}
                </div>
                {currentDay.totalEstimatedCost && (
                  <div className="day-header__cost">
                    <span className="day-header__cost-label">Est. cost</span>
                    <span className="day-header__cost-val">{currentDay.totalEstimatedCost}</span>
                  </div>
                )}
              </div>
            )}

            {/* SVG Route Map */}
            {currentSchedule.length > 0 && (
              <DayRouteMap
                schedule={currentSchedule}
                activeIdx={activeStop}
                onSelectStop={setActiveStop}
              />
            )}

            {/* Cinematic Timeline */}
            <div className="cs-timeline">
              {currentSchedule.map((item, i) => (
                <div key={i}>
                  {/* Transit connector (skip for first stop) */}
                  {i > 0 && <TransitConnector transit={item.transit} />}
                  <CinematicStop
                    item={item}
                    index={i}
                    isActive={activeStop === i}
                    onClick={() => setActiveStop(i)}
                  />
                </div>
              ))}
            </div>

            {/* Day Budget Summary */}
            {currentSchedule.length > 0 && (
              <DayBudgetSummary schedule={currentSchedule} totalEstimatedCost={currentDay?.totalEstimatedCost} />
            )}
          </div>
        )}

        {/* ══════════ HOTEL ══════════ */}
        {activeSection === "hotel" && s.hotel && (
          <div className="tr-section-content">
            <div className="hotel-visual">
              <div className="hotel-visual__img-wrap">
                <img
                  src={unsplashImg(s.hotel.imageQuery || s.destination + " luxury hotel", 1200, 500, 55)}
                  alt={s.hotel.name}
                  className="hotel-visual__img"
                  loading="lazy"
                  onError={e => e.target.style.display="none"}
                />
                <div className="hotel-visual__overlay" />
                <div className="hotel-visual__badge">🏨 Recommended Stay</div>
              </div>
              <div className="hotel-visual__body">
                <h2 className="hotel-visual__name">{s.hotel.name}</h2>
                <div className="hotel-visual__area">📍 {s.hotel.area}</div>
                <p className="hotel-visual__why">{s.hotel.whyStay}</p>
                <div className="hotel-visual__price">{s.hotel.priceRange}</div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ FOOD ══════════ */}
        {activeSection === "food" && (
          <div className="tr-section-content">
            <div className="food-grid-v2">
              {(s.mustEat || []).map((item, i) => (
                <div className="food-card-v2" key={i} style={{ animationDelay: `${i * 0.09}s` }}>
                  <div className="food-card-v2__img-wrap">
                    <img
                      src={unsplashImg(item.imageQuery || item.dish + " food photography", 600, 280, i + 10)}
                      alt={item.dish}
                      className="food-card-v2__img"
                      loading="lazy"
                      onError={e => e.target.style.display="none"}
                    />
                    <div className="food-card-v2__img-overlay" />
                    <span className="food-card-v2__emoji-badge">{item.emoji}</span>
                  </div>
                  <div className="food-card-v2__body">
                    <div className="food-card-v2__dish">{item.dish}</div>
                    <div className="food-card-v2__where">{item.where}</div>
                    <div className="food-card-v2__meta">
                      <span>📍 {item.area}</span>
                      <span className="food-card-v2__price">{item.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ HIDDEN GEMS ══════════ */}
        {activeSection === "gems" && (
          <div className="tr-section-content">
            <div className="gems-v2">
              {(s.hiddenGems || []).map((gem, i) => (
                <div className="gem-v2" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="gem-v2__num">{String(i + 1).padStart(2,"0")}</div>
                  <div className="gem-v2__icon">{gem.emoji}</div>
                  <div className="gem-v2__content">
                    <div className="gem-v2__name">{gem.name}</div>
                    {gem.area && <div className="gem-v2__area">📍 {gem.area}</div>}
                    <div className="gem-v2__desc">{gem.description}</div>
                  </div>
                  <div className="gem-v2__glow" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ OTHER SECTIONS ══════════ */}
        {activeSection === "golden" && <div className="tr-section-content"><GoldenHour destination={s.destination} /></div>}
        {activeSection === "budget" && <div className="tr-section-content"><BudgetTracker days={tripData.days} budget={tripData.budget} /></div>}
        {activeSection === "carbon" && <div className="tr-section-content"><CarbonScore budget={tripData.budget} days={tripData.days} /></div>}
        {activeSection === "group" && <div className="tr-section-content"><GroupSync tripData={tripData} /></div>}

        <div className="tr-footer">
          <span>✦ Crafted by Voyance AI</span>
          <button className="btn btn--ghost btn--sm" onClick={onBack}>Plan another trip →</button>
        </div>
      </div>

      {/* ── FLOATING CO-PILOT ── */}
      <div className={`copilot-bubble${chatOpen ? " copilot-bubble--open" : ""}`}>
        {chatOpen && (
          <div className="copilot-window">
            <div className="copilot-window__header">
              <span>✦ Trip Co-Pilot</span>
              <button onClick={() => setChatOpen(false)}>×</button>
            </div>
            <CopilotChat tripData={tripData} />
          </div>
        )}
        <button className="copilot-fab" onClick={() => setChatOpen(o => !o)} title="AI Co-Pilot">
          {chatOpen ? "×" : "✦"}
        </button>
      </div>
    </div>
  );
}