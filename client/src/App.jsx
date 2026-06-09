import { useState, useEffect } from "react";
import SearchForm from "./components/SearchForm";
import TripResult from "./components/TripResult";

const DESTINATIONS = [
  { name: "Santorini", country: "Greece", tag: "Island Escape", img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80" },
  { name: "Kyoto", country: "Japan", tag: "Cultural Immersion", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80" },
  { name: "Amalfi", country: "Italy", tag: "Coastal Luxury", img: "https://images.unsplash.com/photo-1612698093158-e07ac200d44e?w=600&q=80" },
  { name: "Maldives", country: "Indian Ocean", tag: "Paradise Retreat", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=80" },
  { name: "Patagonia", country: "Argentina", tag: "Raw Wilderness", img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80" },
  { name: "Marrakech", country: "Morocco", tag: "Sensory Journey", img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&q=80" },
];

const FEATURES = [
  { icon: "◎", title: "Mood-Based Re-Routing", desc: "Feeling tired mid-trip? AI rebuilds your day around your energy level instantly." },
  { icon: "◈", title: "Golden Hour Planner", desc: "Every outdoor activity auto-scheduled around sunrise & sunset for cinematic moments." },
  { icon: "⬡", title: "Live Budget Tracker", desc: "Tap activities as done — your running spend updates in real time with local currency." },
  { icon: "✦", title: "Trip Co-Pilot Chat", desc: "Chat with an AI that knows your full itinerary. Ask anything, change anything." },
  { icon: "⟐", title: "Neighbourhood Vibe Map", desc: "Visual map with colour-coded pins for every activity by time of day." },
  { icon: "◇", title: "Carbon Score", desc: "Every trip gets a sustainability score with a greener alternative automatically shown." },
];

function HomePage({ onStartPlanning, onDestinationClick }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="app-root">
      <nav className={`nav${scrolled ? " nav--scrolled" : ""}`}>
        <div className="nav__logo">
          <span className="nav__logo-mark">✦</span>
          <span className="nav__logo-text">GuideDaddy</span>
          <span className="nav__logo-tag">AI</span>
        </div>
        <div className="nav__links">
          <a href="#features">Features</a>
          <a href="#destinations">Discover</a>
        </div>
        <button className="nav__cta" onClick={onStartPlanning}>Plan a Trip</button>
      </nav>

      <section className="hero" id="hero">
        <div className="hero__bg-grid" />
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__orb hero__orb--3" />
        <div className="hero__noise" />
        <div className="hero__content">
          <div className="hero__eyebrow"><span className="hero__eyebrow-dot" />Powered by Advanced AI</div>
          <h1 className="hero__title">Travel like you've<br /><span className="hero__title-gradient">never imagined</span></h1>
          <p className="hero__subtitle">GuideDaddy crafts cinematic journeys tailored to your soul — not just your schedule.<br />Luxury, culture, adventure — all in one intelligent itinerary.</p>
          <div className="hero__actions">
            <button className="btn btn--primary" onClick={onStartPlanning}><span>Plan My Trip</span><span className="btn__arrow">→</span></button>
            <button className="btn btn--ghost" onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}>See Features</button>
          </div>
          <div className="hero__stats">
            <div className="hero__stat"><span className="hero__stat-value">200K+</span><span className="hero__stat-label">Trips crafted</span></div>
            <div className="hero__stat-divider" />
            <div className="hero__stat"><span className="hero__stat-value">98%</span><span className="hero__stat-label">Satisfaction rate</span></div>
            <div className="hero__stat-divider" />
            <div className="hero__stat"><span className="hero__stat-value">140+</span><span className="hero__stat-label">Countries covered</span></div>
          </div>
        </div>
        <div className="hero__scroll-hint"><span>Scroll to explore</span><div className="hero__scroll-line" /></div>
      </section>

      <section className="section features-section" id="features">
        <div className="section__label">Why GuideDaddy</div>
        <h2 className="section__title">Intelligence meets<span className="text-accent"> wanderlust</span></h2>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
              <div className="feature-card__glow" />
            </div>
          ))}
        </div>
      </section>

      <section className="section destinations-section" id="destinations">
        <div className="section__label">Popular Destinations</div>
        <h2 className="section__title">The world, <span className="text-accent">curated</span></h2>
        <div className="destinations-grid">
          {DESTINATIONS.map((d, i) => (
            <div className="dest-card" key={i} style={{ animationDelay: `${i * 0.07}s` }} onClick={() => onDestinationClick(d.name)}>
              <div className="dest-card__img-wrap">
                <img src={d.img} alt={d.name} className="dest-card__img" loading="lazy" />
                <div className="dest-card__overlay" />
              </div>
              <div className="dest-card__body">
                <span className="dest-card__tag">{d.tag}</span>
                <h3 className="dest-card__name">{d.name}</h3>
                <span className="dest-card__country">{d.country}</span>
              </div>
              <div className="dest-card__arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section showcase-section">
        <div className="showcase-inner">
          <div className="showcase-text">
            <div className="section__label">AI Itinerary</div>
            <h2 className="section__title">Every detail,<span className="text-accent"> considered</span></h2>
            <p className="showcase-desc">From sunrise to sunset, GuideDaddy builds an itinerary that flows like a story — restaurants, landmarks, hidden alleys, golden hours. All timed. All personalised.</p>
            <ul className="showcase-list">
              <li><span className="showcase-list__icon">✓</span> Morning routines & best local breakfasts</li>
              <li><span className="showcase-list__icon">✓</span> Smart transit between all attractions</li>
              <li><span className="showcase-list__icon">✓</span> Evening dining & nightlife picks</li>
              <li><span className="showcase-list__icon">✓</span> Live budget tracking</li>
            </ul>
            <button className="btn btn--primary" style={{ marginTop: "32px" }} onClick={onStartPlanning}><span>Start Planning</span><span className="btn__arrow">→</span></button>
          </div>
          <div className="showcase-card-wrap">
            <div className="showcase-card">
              <div className="showcase-card__header">
                <span className="showcase-card__dot showcase-card__dot--gold" />
                <span className="showcase-card__dot showcase-card__dot--silver" />
                <span className="showcase-card__label">Day 1 — Tokyo</span>
              </div>
              <div className="showcase-card__body">
                {[["07:30","Sunrise at Senso-ji Temple"],["09:00","Breakfast at Pelican Cafe"],["11:00","teamLab Planets digital art"],["13:30","Ramen at Fuunji, Shinjuku"],["19:00","Rooftop cocktails — Park Hyatt"]].map(([t,tx],i)=>(
                  <div className="showcase-item" key={i}>
                    <span className="showcase-item__time">{t}</span>
                    <span className="showcase-item__text">{tx}</span>
                  </div>
                ))}
              </div>
              <div className="showcase-card__glow" />
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer__top">
          <div className="footer__brand">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="nav__logo-mark">✦</span>
              <span className="footer__brand-name">GuideDaddy</span>
              <span className="nav__logo-tag">AI</span>
            </div>
            <p className="footer__tagline">The world's most intelligent travel companion.</p>
          </div>
          <div className="footer__links-group">
            <span className="footer__group-title">Product</span>
            <a href="#features">Features</a><a href="#destinations">Destinations</a>
            <span style={{ cursor: "pointer", fontSize: "14px", color: "var(--text-2)" }} onClick={onStartPlanning}>Plan Trip</span>
          </div>
          <div className="footer__links-group">
            <span className="footer__group-title">Company</span>
            <a href="#">About</a><a href="#">Blog</a><a href="#">Careers</a>
          </div>
          <div className="footer__links-group">
            <span className="footer__group-title">Legal</span>
            <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Cookies</a>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2025 GuideDaddy AI. All rights reserved.</span>
          <span>Crafted for explorers.</span>
        </div>
      </footer>
    </div>
  );
}

function PlanPage({ onTripGenerated, loading, setLoading, prefillDestination }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="app-root">
      <nav className={`nav${scrolled ? " nav--scrolled" : ""}`}>
        <div className="nav__logo">
          <span className="nav__logo-mark">✦</span>
          <span className="nav__logo-text">GuideDaddy</span>
          <span className="nav__logo-tag">AI</span>
        </div>
        <div className="nav__links">
          <a href="/" onClick={e => { e.preventDefault(); window.location.reload(); }}>Home</a>
        </div>
        <button className="nav__cta" onClick={() => window.location.reload()}>← Back</button>
      </nav>

      <div className="plan-page">
        <div className="plan-page__hero">
          <div className="hero__orb hero__orb--1" style={{ position: "absolute" }} />
          <div className="hero__orb hero__orb--2" style={{ position: "absolute" }} />
          <div className="plan-page__eyebrow"><span className="hero__eyebrow-dot" />AI Travel Planner</div>
          <h1 className="plan-page__title">Where do you want<br /><span className="hero__title-gradient">to go?</span></h1>
          <p className="plan-page__sub">Tell us your dream. We'll craft the perfect journey.</p>
        </div>
        <div className="plan-page__form">
          <SearchForm
            onTripGenerated={onTripGenerated}
            setLoading={setLoading}
            loading={loading}
            prefillDestination={prefillDestination}
          />
        </div>
        {loading && (
          <div className="plan-page__loading">
            <div className="loading-orb" />
            <div className="loading-text">
              <span className="loading-text__main">Crafting your journey…</span>
              <span className="loading-text__sub">Our AI is building your personalised itinerary</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prefillDestination, setPrefillDestination] = useState("");

  const goHome = () => { setPage("home"); setTripData(null); setLoading(false); window.scrollTo({ top: 0 }); };
  const goPlanning = () => { setPage("plan"); window.scrollTo({ top: 0 }); };
  const handleDestClick = (name) => { setPrefillDestination(name); setPage("plan"); window.scrollTo({ top: 0 }); };
  const handleTripGenerated = (data) => { setTripData(data); setLoading(false); setPage("trip"); window.scrollTo({ top: 0 }); };

  if (page === "trip") return <TripResult tripData={tripData} loading={loading} onBack={goPlanning} onHome={goHome} />;
  if (page === "plan") return <PlanPage onTripGenerated={handleTripGenerated} loading={loading} setLoading={setLoading} prefillDestination={prefillDestination} />;
  return <HomePage onStartPlanning={goPlanning} onDestinationClick={handleDestClick} />;
}