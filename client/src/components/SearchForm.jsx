import { useState, useEffect } from "react";
import axios from "axios";

const TRAVEL_STYLES = ["Luxury", "Adventure", "Cultural", "Backpacker", "Romantic", "Family", "Wellness", "Foodie"];
const BUDGETS = ["Budget ($)", "Moderate ($$)", "Premium ($$$)", "Luxury ($$$$)"];

export default function SearchForm({ onTripGenerated, setLoading, loading, prefillDestination }) {
  const [form, setForm] = useState({ destination: "", days: "", budget: "", travelStyle: "" });
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (prefillDestination) setForm(f => ({ ...f, destination: prefillDestination }));
  }, [prefillDestination]);

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); if (error) setError(""); };
  const handleStyleSelect = (style) => setForm({ ...form, travelStyle: style });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.destination.trim()) { setError("Please enter a destination."); return; }
   if (
  !form.days ||
  isNaN(form.days) ||
  Number(form.days) < 1 ||
  Number(form.days) > 5
) {
  setError("Please enter between 1 and 5 days.");
  return;
} { setError("Please enter a valid number of days."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("https://guidedaddy.onrender.com/generate-trip", {
        destination: form.destination.trim(),
        days: Number(form.days),
        budget: form.budget || "Moderate",
        travelStyle: form.travelStyle || "Cultural",
      });
      onTripGenerated(res.data);
    } catch (err) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="search-form-wrap">
      <form className="search-form" onSubmit={handleSubmit} noValidate>
        <div className="search-form__grid">
          <div className={`form-field form-field--wide${focused === "destination" ? " form-field--focused" : ""}${form.destination ? " form-field--filled" : ""}`}>
            <label className="form-field__label"><span className="form-field__label-icon">◎</span>Destination</label>
            <input type="text" name="destination" value={form.destination} onChange={handleChange}
              onFocus={() => setFocused("destination")} onBlur={() => setFocused(null)}
              placeholder="Tokyo, Santorini, Patagonia…" className="form-field__input" autoComplete="off" />
            <div className="form-field__line" />
          </div>
          <div className={`form-field${focused === "days" ? " form-field--focused" : ""}${form.days ? " form-field--filled" : ""}`}>
            <label className="form-field__label"><span className="form-field__label-icon">◷</span>Duration</label>
            <input type="number" name="days" value={form.days} onChange={handleChange}
              onFocus={() => setFocused("days")} onBlur={() => setFocused(null)}
              placeholder="7 days" min="1" max="30" className="form-field__input" />
            <div className="form-field__line" />
          </div>
          <div className={`form-field${focused === "budget" ? " form-field--focused" : ""}${form.budget ? " form-field--filled" : ""}`}>
            <label className="form-field__label"><span className="form-field__label-icon">◈</span>Budget</label>
            <select name="budget" value={form.budget} onChange={handleChange}
              onFocus={() => setFocused("budget")} onBlur={() => setFocused(null)}
              className="form-field__input form-field__select">
              <option value="">Select budget</option>
              {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="form-field__line" />
          </div>
        </div>
        <div className="form-style-section">
          <label className="form-style-label"><span className="form-field__label-icon">✦</span>Travel Style</label>
          <div className="form-style-pills">
            {TRAVEL_STYLES.map(style => (
              <button type="button" key={style}
                className={`style-pill${form.travelStyle === style ? " style-pill--active" : ""}`}
                onClick={() => handleStyleSelect(style)}>{style}</button>
            ))}
          </div>
        </div>
        {error && <div className="form-error"><span>⚠</span> {error}</div>}
        <div className="form-submit-row">
          <button type="submit" className={`btn btn--submit${loading ? " btn--loading" : ""}`} disabled={loading}>
            {loading ? (<><span className="btn-spinner" /><span>Crafting your journey…</span></>) : (<><span>Generate My Itinerary</span><span className="btn__arrow">→</span></>)}
          </button>
        </div>
      </form>
    </div>
  );
}