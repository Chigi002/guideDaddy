require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors({ origin: ["http://localhost:5173","http://localhost:3000","http://localhost:5174"], methods: ["GET","POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function askGroq(prompt, max_tokens = 4096) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.72,
    max_tokens,
  });
  return completion.choices[0]?.message?.content || "";
}

function cleanJSON(text) {
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  return JSON.parse(text.slice(start, end + 1));
}

/* ── GENERATE TRIP ── */
app.post("/generate-trip", async (req, res) => {
  const { destination, budget, travelStyle } = req.body;
  const days = parseInt(req.body.days, 10);
  if (!destination || !days || days < 1) return res.status(400).json({ error: "destination and valid days are required." });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: "API key not configured." });

  const scheduleTemplate = `[
    {
      "time": "07:30", "period": "Morning", "activity": "activity name", "place": "Exact Place Name",
      "area": "Neighbourhood", "tip": "insider tip", "duration": "1.5 hrs", "cost": "Free",
      "emoji": "🌅", "imageQuery": "3-4 word unsplash search term for this place",
      "transit": { "method": "walking", "methodEmoji": "🚶", "duration": "from hotel", "distance": "0.8 km", "cost": "Free" }
    },
    {
      "time": "09:30", "period": "Morning", "activity": "activity name", "place": "Exact Place Name",
      "area": "Neighbourhood", "tip": "insider tip", "duration": "2 hrs", "cost": "$5",
      "emoji": "⛩️", "imageQuery": "3-4 word unsplash search term",
      "transit": { "method": "walking", "methodEmoji": "🚶", "duration": "8 min", "distance": "0.6 km", "cost": "Free" }
    },
    {
      "time": "12:00", "period": "Afternoon", "activity": "Lunch", "place": "Restaurant Name",
      "area": "Neighbourhood", "tip": "what to order", "duration": "1 hr", "cost": "$12",
      "emoji": "🍱", "imageQuery": "local food restaurant interior",
      "transit": { "method": "subway", "methodEmoji": "🚇", "duration": "15 min", "distance": "3.2 km", "cost": "$2" }
    },
    {
      "time": "14:00", "period": "Afternoon", "activity": "activity name", "place": "Exact Place Name",
      "area": "Neighbourhood", "tip": "insider tip", "duration": "2 hrs", "cost": "$15",
      "emoji": "🎨", "imageQuery": "3-4 word unsplash search term",
      "transit": { "method": "walking", "methodEmoji": "🚶", "duration": "5 min", "distance": "0.4 km", "cost": "Free" }
    },
    {
      "time": "17:00", "period": "Afternoon", "activity": "activity name", "place": "Exact Place Name",
      "area": "Neighbourhood", "tip": "insider tip", "duration": "1.5 hrs", "cost": "Free",
      "emoji": "🌇", "imageQuery": "3-4 word unsplash search term scenic",
      "transit": { "method": "taxi", "methodEmoji": "🚕", "duration": "12 min", "distance": "2.8 km", "cost": "$6" }
    },
    {
      "time": "19:30", "period": "Evening", "activity": "Dinner", "place": "Restaurant Name",
      "area": "Neighbourhood", "tip": "must-order dish and reservation advice", "duration": "1.5 hrs", "cost": "$30",
      "emoji": "🍽️", "imageQuery": "fine dining restaurant evening atmosphere",
      "transit": { "method": "walking", "methodEmoji": "🚶", "duration": "10 min", "distance": "0.8 km", "cost": "Free" }
    },
    {
      "time": "21:30", "period": "Evening", "activity": "evening activity", "place": "Exact Place Name",
      "area": "Neighbourhood", "tip": "insider tip for night", "duration": "1 hr", "cost": "$10",
      "emoji": "🌙", "imageQuery": "city nightlife atmosphere lights",
      "transit": { "method": "walking", "methodEmoji": "🚶", "duration": "6 min", "distance": "0.5 km", "cost": "Free" }
    }
  ]`;

  const prompt = `You are a world-class luxury travel curator and route optimization expert.

Create a ROUTE-OPTIMIZED ${days}-day trip to ${destination} for a ${travelStyle || "Cultural"} traveler with a ${budget || "Moderate"} budget.

CRITICAL ROUTE RULES:
- Group nearby places together within each half-day to minimize unnecessary travel
- Morning stops should be geographically clustered in one neighbourhood
- Afternoon stops should be in an adjacent or connected neighbourhood
- Evening stops should be central or easy to reach
- Minimize backtracking — plan a smooth geographic flow through the city
- Transit between stops should be realistic and optimized

Return ONLY valid raw JSON. No markdown, no backticks, no explanation whatsoever.

{
  "destination": "${destination}",
  "tagline": "a short cinematic one-liner about this destination",
  "bestTimeToVisit": "e.g. October to March",
  "currency": "e.g. Japanese Yen (JPY)",
  "language": "e.g. Japanese",
  "coverImageQuery": "${destination} city skyline aerial travel",
  "hotel": {
    "name": "specific real hotel name",
    "area": "neighbourhood name",
    "whyStay": "one sentence why it is perfect for this trip",
    "priceRange": "e.g. $120–$180/night",
    "emoji": "🏨",
    "imageQuery": "${destination} luxury hotel lobby interior"
  },
  "hiddenGems": [
    { "name": "real place name", "description": "one vivid sentence", "emoji": "💎", "area": "neighbourhood" },
    { "name": "real place name", "description": "one vivid sentence", "emoji": "🌿", "area": "neighbourhood" },
    { "name": "real place name", "description": "one vivid sentence", "emoji": "🎭", "area": "neighbourhood" }
  ],
  "mustEat": [
    { "dish": "dish name", "where": "real restaurant name", "area": "area", "price": "$8", "emoji": "🍜", "imageQuery": "dish name food close up" },
    { "dish": "dish name", "where": "real restaurant name", "area": "area", "price": "$15", "emoji": "🍣", "imageQuery": "dish name food photography" },
    { "dish": "dish name", "where": "real restaurant name", "area": "area", "price": "$5", "emoji": "🥐", "imageQuery": "dish name street food" }
  ],
  "days": [
    ${Array.from({ length: days }, (_, i) => `{
      "day": ${i + 1},
      "theme": "short evocative theme for this day",
      "area": "primary neighbourhood focus for this day",
      "totalEstimatedCost": "$65",
      "schedule": ${scheduleTemplate}
    }`).join(",\n    ")}
  ]
}`;

  try {
    const text = await askGroq(prompt);
    const parsed = cleanJSON(text);
    console.log(`✅ Trip generated: ${destination} ${days} days`);
    res.json({ structured: parsed, destination, days, budget, travelStyle });
  } catch (err) {
    console.error("❌ generate-trip error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── MOOD REROUTE ── */
app.post("/reroute-day", async (req, res) => {
  const { destination, day, mood, budget, travelStyle } = req.body;
  const prompt = `You are a travel planner. Traveler in ${destination}. Mood: ${mood}
Day theme: "${day.theme}", Budget: ${budget || "Moderate"}, Style: ${travelStyle || "Cultural"}

Rewrite this day's schedule matching the mood. Optimize route so nearby places are grouped.
Return ONLY a raw JSON array of 7 schedule items:
[
  { "time": "07:30", "period": "Morning", "activity": "activity", "place": "specific place", "area": "neighbourhood",
    "tip": "tip", "duration": "1 hr", "cost": "Free", "emoji": "😌", "imageQuery": "place travel photography",
    "transit": { "method": "walking", "methodEmoji": "🚶", "duration": "10 min", "distance": "0.8 km", "cost": "Free" } }
]`;
  try {
    let text = await askGroq(prompt, 2000);
    text = text.replace(/```json/gi,"").replace(/```/g,"").trim();
    const s = text.indexOf("["), e = text.lastIndexOf("]");
    if (s === -1 || e === -1) throw new Error("No array");
    res.json({ schedule: JSON.parse(text.slice(s, e + 1)) });
  } catch (err) {
    console.error("❌ reroute-day:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── CO-PILOT CHAT ── */
app.post("/copilot", async (req, res) => {
  const { message, tripContext } = req.body;
  const prompt = `You are Voyance Co-Pilot, expert travel assistant with full knowledge of this itinerary:
Destination: ${tripContext.destination || "Unknown"}
Days: ${tripContext.days?.length || 0}
Hotel: ${tripContext.hotel?.name || "Not specified"} in ${tripContext.hotel?.area || ""}
Hidden Gems: ${(tripContext.hiddenGems || []).map(g => g.name).join(", ")}
Must Eat: ${(tripContext.mustEat || []).map(f => `${f.dish} at ${f.where}`).join(", ")}

Traveler asks: "${message}"

Reply in 2-4 sentences. Be specific, warm, knowledgeable. Reference their actual itinerary. No disclaimers.`;
  try {
    const reply = await askGroq(prompt, 400);
    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error("❌ copilot:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok", groqKeyLoaded: !!process.env.GROQ_API_KEY }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✦ Voyance server running on port ${PORT}`);
  console.log(`✦ GROQ key loaded: ${!!process.env.GROQ_API_KEY}`);
});