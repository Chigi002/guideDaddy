require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post("/generate-trip", async (req, res) => {
  const { destination, days, budget, travelStyle } = req.body;

  if (!destination || !days) {
    return res.status(400).json({ error: "destination and days are required." });
  }

  const prompt = `
You are a world-class luxury travel planner.

Create a detailed ${days}-day travel itinerary for ${destination}.
Budget level: ${budget || "Moderate"}.
Travel style: ${travelStyle || "Cultural"}.

Format the response EXACTLY like this for each day:

Day 1: Arrival & First Impressions
- Morning: [activity with specific place name]
- Afternoon: [activity with specific place name]
- Evening: [restaurant or experience with specific name]
- Stay: [hotel suggestion]

Day 2: [Theme for the day]
- Morning: ...
- Afternoon: ...
- Evening: ...
- Stay: ...

(continue for all ${days} days)

At the end, add:
Travel Tips:
- [3 practical tips specific to ${destination}]

Use real place names. Be specific, vivid, and luxurious.
  `.trim();

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 2048,
    });

    const text = completion.choices[0]?.message?.content || "";

    res.json({
      itinerary: text,
      destination,
      days,
      budget,
      travelStyle,
    });
  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ error: "Failed to generate itinerary. Check your API key." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✦ Voyance server running on port ${PORT}`));