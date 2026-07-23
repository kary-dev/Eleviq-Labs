"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import * as THREE from "three";

/* ─── Hero 3D: Spline embed (paste your scene URL below) ─── */
// ⬇️ PASTE YOUR REAL SPLINE SCENE URL HERE (leave empty for CSS fallback)
const SPLINE_URL = "";

function HeroModel() {
  // If Spline URL is set, use Spline. Otherwise fall back to Three.js.
  if (SPLINE_URL) {
    return <SplineHero url={SPLINE_URL} />;
  }
  return <ThreeJSFallback />;
}

function SplineHero({ url }: { url: string }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Using iframe for Spline — lightweight, no hydration issues */}
      <iframe
        src={url}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "transparent",
          pointerEvents: "none",
        }}
        title="3D Abstract"
        loading="lazy"
      />
    </div>
  );
}

function ThreeJSFallback() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    const resize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      const w = p.clientWidth, h = p.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const group = new THREE.Group();
    group.rotation.z = 0.15;
    scene.add(group);

    // Organic flowing curve — rounded abstract shape
    function makeFlowCurve(scale: number, phase: number, twist: number) {
      const points: THREE.Vector3[] = [];
      const segments = 200;
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        // Superformula-inspired organic shape
        const r = scale * (1 + 0.3 * Math.sin(3 * t + phase) + 0.15 * Math.cos(5 * t + phase * 2));
        const x = r * Math.cos(t);
        const y = r * Math.sin(t);
        const z = twist * Math.sin(2 * t + phase) * 0.4;
        points.push(new THREE.Vector3(x, y, z));
      }
      return new THREE.CatmullRomCurve3(points, true, "centripetal", 0.5);
    }

    // Create 7 nested flowing shapes — from large to small
    const disposables: THREE.BufferGeometry[] = [];
    const matDisposables: THREE.Material[] = [];

    const layers = [
      { scale: 2.8, phase: 0, twist: 1.0, radius: 0.08, color: "#FF3B5C", emissive: "#FF3B5C", emInt: 0.4, metalness: 0.95, roughness: 0.08, opacity: 1.0 },
      { scale: 2.5, phase: 0.3, twist: 0.8, radius: 0.07, color: "#cc1030", emissive: "#FF3B5C", emInt: 0.25, metalness: 0.95, roughness: 0.1, opacity: 1.0 },
      { scale: 2.2, phase: 0.6, twist: 0.6, radius: 0.065, color: "#FF3B5C", emissive: "#ff6b81", emInt: 0.5, metalness: 0.9, roughness: 0.08, opacity: 1.0 },
      { scale: 1.9, phase: 0.9, twist: 0.5, radius: 0.06, color: "#990020", emissive: "#FF3B5C", emInt: 0.2, metalness: 0.95, roughness: 0.12, opacity: 1.0 },
      { scale: 1.6, phase: 1.2, twist: 0.4, radius: 0.055, color: "#FF3B5C", emissive: "#FF3B5C", emInt: 0.6, metalness: 0.9, roughness: 0.06, opacity: 1.0 },
      { scale: 1.3, phase: 1.5, twist: 0.3, radius: 0.05, color: "#660015", emissive: "#FF3B5C", emInt: 0.15, metalness: 0.95, roughness: 0.15, opacity: 0.9 },
      { scale: 1.0, phase: 1.8, twist: 0.2, radius: 0.04, color: "#FF3B5C", emissive: "#ff6b81", emInt: 0.8, metalness: 0.85, roughness: 0.05, opacity: 0.85 },
    ];

    const meshes: THREE.Mesh[] = [];
    for (const l of layers) {
      const curve = makeFlowCurve(l.scale, l.phase, l.twist);
      const geo = new THREE.TubeGeometry(curve, 200, l.radius, 12, true);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(l.color),
        metalness: l.metalness,
        roughness: l.roughness,
        emissive: new THREE.Color(l.emissive),
        emissiveIntensity: l.emInt,
        transparent: l.opacity < 1,
        opacity: l.opacity,
      });
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
      meshes.push(mesh);
      disposables.push(geo);
      matDisposables.push(mat);
    }

    // Lighting — dramatic 3-point setup
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(5, 4, 6);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xFF3B5C, 1.2);
    fill.position.set(-4, -2, 4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xff8fa0, 1.8);
    rim.position.set(-2, 5, -4);
    scene.add(rim);

    const bottom = new THREE.PointLight(0xFF3B5C, 1.0, 15);
    bottom.position.set(0, -4, 3);
    scene.add(bottom);

    scene.add(new THREE.AmbientLight(0x0a0008, 1.0));

    // Animate — slow rotation + subtle breathing
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = performance.now() * 0.0004;

      group.rotation.y = t * 0.5;
      group.rotation.x = Math.sin(t * 0.3) * 0.08;

      // Subtle scale pulse on inner layers
      for (let i = 0; i < meshes.length; i++) {
        const s = 1 + Math.sin(t * 2 + i * 0.5) * 0.01;
        meshes[i].scale.set(s, s, s);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      disposables.forEach(g => g.dispose());
      matDisposables.forEach(m => m.dispose());
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS (from Stitch DESIGN.md)
   ─────────────────────────────────────────────────
   BG:      #050505 (surface-abyss)
   Cards:   #0A0F1E (surface-ink)
   Accent:  #FF3B5C (accent-vibrant)
   Muted:   #94A3B8 (text-muted)
   Success: #10B981
   Text:    #e5e2e1 (on-surface)
   Display: Hanken Grotesk 800, -0.04em
   Head-lg: Hanken Grotesk 700, -0.02em
   Head-md: Hanken Grotesk 600
   Body:    Inter 400
   Mono:    JetBrains Mono 600, 0.05em
   Stats:   Hanken Grotesk 700
   ═══════════════════════════════════════════════════ */

/* ─── Scroll-triggered reveal ─── */
function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(44px)",
        transition: `opacity 1s cubic-bezier(.22,1,.36,1) ${delay}s, transform 1s cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Animated counter ─── */
function Counter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const dur = 2400, t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          setVal(Math.round((1 - Math.pow(1 - p, 4)) * end));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

/* ─── Custom cursor ─── */
function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const move = useCallback((e: MouseEvent) => {
    if (dot.current) dot.current.style.transform = `translate(${e.clientX - 10}px,${e.clientY - 10}px)`;
  }, []);
  useEffect(() => {
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [move]);
  return <div ref={dot} className="el-cursor" />;
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export function LandingClient() {
  const [loaded, setLoaded] = useState(false);
  const [show, setShow] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* Splash timing */
  useEffect(() => {
    const t1 = setTimeout(() => setLoaded(true), 2000);
    const t2 = setTimeout(() => setShow(true), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* Scroll detection for nav */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* Card mouse-glow */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest(".el-card") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--gx", `${e.clientX - r.left}px`);
      card.style.setProperty("--gy", `${e.clientY - r.top}px`);
    };
    document.addEventListener("mousemove", handler);
    return () => document.removeEventListener("mousemove", handler);
  }, []);

  return (
    <>
      {/* Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800;900&family=Inter:wght@400;500&family=JetBrains+Mono:wght@500;600&display=swap"
        rel="stylesheet"
      />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* ── Splash screen ── */}
      <div className={`el-splash ${loaded ? "el-splash--done" : ""}`}>
        <div className="el-splash__logo">
          <span className="material-symbols-outlined" style={{ color: "#FF3B5C", fontSize: 26 }}>analytics</span>
          <span>eleviq labs</span>
        </div>
      </div>

      <Cursor />

      <div className={`el ${show ? "el--on" : ""}`}>

        {/* ═══════ NAV (floating glass pill) ═══════ */}
        <nav className={`el-nav ${scrolled ? "el-nav--s" : ""}`}>
          <a href="/" className="el-nav__logo">
            <span className="material-symbols-outlined" style={{ color: "#FF3B5C", fontSize: 20 }}>analytics</span>
            <span>eleviq labs</span>
          </a>
          <div className="el-nav__mid">
            <a href="#why">Brands</a>
            <a href="#process">Process</a>
            <a href="#faq">FAQ</a>
          </div>
          <a href="/auth" className="el-nav__cta">Launch Campaign</a>
        </nav>

        {/* ═══════ HERO ═══════ */}
        <section className="el-hero">
          {/* Ambient gradient blobs */}
          <div className="el-hero__blob el-hero__blob--1" />
          <div className="el-hero__blob el-hero__blob--2" />
          <div className="el-hero__blob el-hero__blob--3" />

          <div className="el-hero__inner">
            <Reveal>
              <h1 className="el-hero__h1">
                Campaigns that Pay<br />for Results.{" "}
                <span className="el-accent">Not Promises.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="el-hero__sub">
                Run creator campaigns that pay for verified views delivered — not impressions or follower counts. Real content. Real ROI.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="el-hero__sub2">We handle everything, from script to distribution.</p>
            </Reveal>
            <Reveal delay={0.28}>
              <div className="el-hero__ctas">
                <a href="/auth" className="el-btn el-btn--accent">Launch Your Campaign</a>
                <a
                  href="https://discord.gg/8pNRbsEzx"
                  target="_blank"
                  rel="noreferrer"
                  className="el-btn el-btn--ghost"
                >
                  Join Our Discord
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>north_east</span>
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════ STATS BAR ═══════ */}
        <Reveal>
          <section className="el-stats">
            <div className="el-stats__inner">
              {[
                { val: 100, suf: "%", label: "Verified Views" },
                { val: 300, suf: "+", label: "Active Creators" },
                { val: 0, label: "Upfront Risk", display: "$0" },
                { val: 0, label: "ROI Tracking", display: "Real-time" },
              ].map((s, i) => (
                <div key={s.label} className="el-stat">
                  {i > 0 && <span className="el-stat__sep" />}
                  <div>
                    <p className="el-stat__val">
                      {s.display ?? <Counter end={s.val} suffix={s.suf} />}
                    </p>
                    <p className="el-stat__label">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ═══════ SERVICE PILLS (shownmedia style) ═══════ */}
        <Reveal>
          <section className="el-pills">
            <a href="#why" className="el-pill">
              <span>For Brands</span>
              <span className="material-symbols-outlined" style={{ fontSize: 18, opacity: 0.4 }}>arrow_forward</span>
            </a>
            <a href="/auth" className="el-pill">
              <span>For Creators</span>
              <span className="material-symbols-outlined" style={{ fontSize: 18, opacity: 0.4 }}>arrow_forward</span>
            </a>
          </section>
        </Reveal>

        {/* ═══════ WHY ELEVIQ ═══════ */}
        <section id="why" className="el-sec">
          <div className="el-container">
            <Reveal>
              <span className="el-mono-label">Why Eleviq</span>
              <h2 className="el-h2">Precision Advantage</h2>
            </Reveal>
            <div className="el-features">
              {[
                {
                  icon: "payments",
                  title: "Performance-Based Model",
                  body: "Stop paying for potential reach. You only pay when views are verified by our direct platform integrations. Full transparency on every cent spent.",
                },
                {
                  icon: "verified_user",
                  title: "Authentic Content",
                  body: "Real creators pick your campaign because they genuinely like your brand. This results in higher engagement and better brand sentiment than forced ads.",
                },
                {
                  icon: "dashboard_customize",
                  title: "Full Campaign Dashboard",
                  body: "Manage everything from one hub. Approve creator clips, track multi-platform performance, and monitor your CPM in real-time without spreadsheets.",
                },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 0.1}>
                  <div className="el-card el-feature">
                    <div className="el-card__glow" />
                    <div className="el-feature__icon">
                      <span className="material-symbols-outlined">{f.icon}</span>
                    </div>
                    <h3 className="el-feature__title">{f.title}</h3>
                    <p className="el-feature__body">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ PROCESS ═══════ */}
        <section id="process" className="el-sec el-sec--ink">
          <div className="el-container">
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: 80 }}>
                <h2 className="el-h2" style={{ marginBottom: 16 }}>Launch in Minutes</h2>
                <p className="el-body-muted" style={{ maxWidth: 520, margin: "0 auto" }}>
                  Our streamlined process removes the friction of traditional influencer outreach.
                </p>
              </div>
            </Reveal>

            <div className="el-steps">
              {/* Connector line */}
              <div className="el-steps__line" />
              {[
                { n: "01", icon: "tune", title: "Set Your CPM", body: "Define exactly what a view is worth to your brand and set your total budget." },
                { n: "02", icon: "groups", title: "Vetted Creator Matching", body: "Our creators browse and pick campaigns they love. You get authentic interest, not cold pitches." },
                { n: "03", icon: "monitoring", title: "Approve & Track", body: "Review clip submissions and watch your view counts grow across platforms in real-time." },
              ].map((step, i) => (
                <Reveal key={step.n} delay={i * 0.14}>
                  <div className="el-step">
                    <div className="el-step__circle">
                      <span className="el-step__num">{step.n}</span>
                      <div className="el-step__badge">
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#fff" }}>{step.icon}</span>
                      </div>
                    </div>
                    <h4 className="el-step__title">{step.title}</h4>
                    <p className="el-step__body">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ DASHBOARD PREVIEW ═══════ */}
        <section className="el-sec">
          <div className="el-container">
            <Reveal>
              <span className="el-mono-label">Campaign Transparency</span>
              <h2 className="el-h2">Full Control, Zero Waste.</h2>
            </Reveal>

            <div className="el-dash">
              {/* Main analytics */}
              <Reveal delay={0.08}>
                <div className="el-card el-dash__main">
                  <div className="el-card__glow" />
                  <div className="el-dash__header">
                    <div>
                      <p className="el-mono-label" style={{ marginBottom: 4 }}>Active Campaign: Fall Collection</p>
                      <p className="el-dash__title">Live Performance</p>
                    </div>
                    <span className="el-live">LIVE TRACKING</span>
                  </div>

                  <div className="el-dash__metrics">
                    <div>
                      <p className="el-mono-label" style={{ marginBottom: 4 }}>Total Views</p>
                      <p className="el-metric">2.4M</p>
                      <div className="el-bar"><div className="el-bar__fill" style={{ width: "75%" }} /></div>
                    </div>
                    <div>
                      <p className="el-mono-label" style={{ marginBottom: 4 }}>Total Spend</p>
                      <p className="el-metric">$1,420</p>
                      <p className="el-delta">
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>trending_down</span>
                        12% vs last week
                      </p>
                    </div>
                    <div>
                      <p className="el-mono-label" style={{ marginBottom: 4 }}>CPE (Actual)</p>
                      <p className="el-metric">$0.02</p>
                      <p className="el-mono-label" style={{ marginTop: 8 }}>Verified platforms only</p>
                    </div>
                  </div>

                  {/* Bar chart */}
                  <div className="el-chart">
                    {[25, 35, 50, 68, 78, 42, 100, 82, 62].map((h, i) => (
                      <div
                        key={i}
                        className="el-chart__bar"
                        style={{ height: `${h}%`, opacity: 0.25 + (h / 100) * 0.75 }}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Top creators */}
              <Reveal delay={0.2}>
                <div className="el-card el-dash__side">
                  <div className="el-card__glow" />
                  <h4 className="el-feature__title" style={{ marginBottom: 20 }}>Top Creators</h4>
                  {[
                    { name: "@alex_vibe", cat: "Tech & Lifestyle", views: "452K" },
                    { name: "@sarah_creates", cat: "Fashion", views: "312K" },
                    { name: "@jordan_next", cat: "Gaming", views: "289K" },
                    { name: "@mia_labs", cat: "Business", views: "194K" },
                  ].map((cr, i, arr) => (
                    <div
                      key={cr.name}
                      className="el-cr"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="el-avatar">{cr.name[1].toUpperCase()}</div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>{cr.name}</p>
                          <p className="el-mono-label" style={{ textTransform: "uppercase" }}>{cr.cat}</p>
                        </div>
                      </div>
                      <span className="el-mono-label" style={{ color: "#fff", fontWeight: 600 }}>{cr.views}</span>
                    </div>
                  ))}
                  <a href="/auth" className="el-dash__manage">Manage All Creators</a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════ PLATFORMS ═══════ */}
        <Reveal>
          <section className="el-plat">
            <h3 className="el-plat__h3">One campaign, three platforms, total reach.</h3>
            <div className="el-plat__list">
              {[
                { icon: "video_library", name: "TikTok" },
                { icon: "camera", name: "Reels" },
                { icon: "play_circle", name: "Shorts" },
              ].map((p) => (
                <div key={p.name} className="el-plat__item">
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>{p.icon}</span>
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ═══════ FAQ ═══════ */}
        <section id="faq" className="el-sec">
          <div className="el-container" style={{ maxWidth: 720 }}>
            <Reveal>
              <h2 className="el-h2" style={{ textAlign: "center" }}>Frequently Asked Questions.</h2>
            </Reveal>
            {[
              { q: "How are views verified?", a: "We use direct API integrations with TikTok, Instagram, and YouTube. When a creator submits their link, our system fetches data directly from the platforms' backends every hour, ensuring the count you pay for is 100% accurate and legitimate." },
              { q: "Can I approve specific creators?", a: "Absolutely. While any creator can join your campaign, you have final approval over every single clip before it goes live or starts earning views. You can also whitelist specific creators you've worked with before for recurring campaigns." },
              { q: "What is the minimum spend?", a: "We typically recommend a starting campaign budget of $500 to ensure enough scale for creator participation, but there are no hard minimums for testing. You define the budget and the CPM; we provide the infrastructure." },
            ].map((item, i) => (
              <Reveal key={item.q} delay={i * 0.08}>
                <details className="el-faq">
                  <summary className="el-faq__q">
                    {item.q}
                    <span className="material-symbols-outlined el-faq__icon">expand_more</span>
                  </summary>
                  <p className="el-faq__a">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══════ FINAL CTA ═══════ */}
        <section className="el-cta">
          <div className="el-cta__deco" />
          <Reveal>
            <div className="el-cta__inner">
              <h2 className="el-cta__h2">Ready to scale your reach?</h2>
              <p className="el-cta__sub">
                Join 50+ forward-thinking brands who have abandoned unpredictable influencer deals for guaranteed performance.
              </p>
              <div className="el-hero__ctas" style={{ justifyContent: "center" }}>
                <a href="/auth" className="el-btn el-btn--white">Get Started Now</a>
                <a href="mailto:eleviqlabs@gmail.com" className="el-btn el-btn--ghost-w">Contact Sales</a>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="el-ft">
          <div className="el-container">
            <div className="el-ft__grid">
              <div className="el-ft__brand">
                <div className="el-ft__logo">
                  <span className="material-symbols-outlined" style={{ color: "#FF3B5C", fontSize: 20 }}>analytics</span>
                  <span>Eleviq Labs</span>
                </div>
                <p className="el-ft__tagline">Turning views into verifiable ROI for the world&apos;s most innovative brands.</p>
                <p className="el-ft__copy">© {new Date().getFullYear()} Eleviq Labs. All rights reserved.</p>
              </div>
              {[
                { title: "Platform", links: [["For Brands", "#why"], ["For Creators", "/auth"], ["Process", "#process"], ["Pricing", "mailto:eleviqlabs@gmail.com"]] },
                { title: "Resources", links: [["FAQ", "#faq"], ["Join Discord", "https://discord.gg/8pNRbsEzx"], ["Case Studies", "mailto:eleviqlabs@gmail.com"]] },
                { title: "Legal", links: [["Privacy Policy", "#"], ["Terms of Service", "#"], ["Contact Us", "mailto:eleviqlabs@gmail.com"]] },
              ].map((col) => (
                <div key={col.title} className="el-ft__col">
                  <h5 className="el-ft__head">{col.title}</h5>
                  {col.links.map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      className="el-ft__link"
                      {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════ */
const STYLES = `
/* ── Reset ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24}

/* ── Splash ── */
.el-splash{position:fixed;inset:0;z-index:9999;background:#050505;display:flex;align-items:center;justify-content:center;transition:opacity .7s cubic-bezier(.22,1,.36,1) .3s,visibility .7s cubic-bezier(.22,1,.36,1) .3s}
.el-splash--done{opacity:0;visibility:hidden;pointer-events:none}
.el-splash__logo{display:flex;align-items:center;gap:10px;font-family:'Hanken Grotesk',sans-serif;font-size:20px;font-weight:700;color:#e5e2e1;letter-spacing:-.01em;animation:splashFade 1.5s ease forwards}
@keyframes splashFade{0%{opacity:0;transform:translateY(8px)}40%{opacity:1;transform:translateY(0)}100%{opacity:1}}

/* ── Cursor ── */
.el-cursor{position:fixed;top:0;left:0;width:20px;height:20px;background:#FF3B5C;border-radius:50%;pointer-events:none;z-index:10000;mix-blend-mode:difference;opacity:.75;will-change:transform}
@media(hover:none){.el-cursor{display:none}}

/* ── Base ── */
.el{background:#050505;color:#e5e2e1;font-family:'Inter',sans-serif;font-size:16px;line-height:1.5;overflow-x:hidden;opacity:0;transition:opacity .5s ease}
.el--on{opacity:1}
.el-container{max-width:1280px;margin:0 auto;padding:0 24px}

/* ── Accent ── */
.el-accent{color:#FF3B5C}

/* ── Typography (Stitch tokens) ── */
.el-h2{font-family:'Hanken Grotesk',sans-serif;font-size:48px;font-weight:700;line-height:56px;letter-spacing:-.02em;margin-bottom:48px;color:#e5e2e1}
@media(max-width:768px){.el-h2{font-size:32px;line-height:40px}}
.el-mono-label{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;line-height:16px;letter-spacing:.05em;color:#94A3B8;display:block}
.el-body-muted{font-family:'Inter',sans-serif;font-size:18px;line-height:28px;color:#94A3B8}

/* ═══ NAV ═══ */
.el-nav{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:500;display:flex;align-items:center;gap:8px;background:rgba(5,5,5,.45);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.06);border-radius:999px;padding:8px 8px 8px 22px;transition:all .5s cubic-bezier(.22,1,.36,1)}
.el-nav--s{background:rgba(5,5,5,.88);border-color:rgba(255,255,255,.08);box-shadow:0 4px 30px rgba(0,0,0,.4)}
.el-nav__logo{display:flex;align-items:center;gap:8px;text-decoration:none;color:#e5e2e1;font-family:'Hanken Grotesk',sans-serif;font-size:14px;font-weight:700;letter-spacing:-.01em;white-space:nowrap}
.el-nav__mid{display:none;align-items:center;gap:22px;margin:0 20px}
.el-nav__mid a{font-family:'Inter',sans-serif;font-size:13px;font-weight:400;color:rgba(229,226,225,.4);text-decoration:none;transition:color .2s}
.el-nav__mid a:hover{color:#e5e2e1}
@media(min-width:768px){.el-nav__mid{display:flex}}
.el-nav__cta{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.04em;color:#e5e2e1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:10px 22px;border-radius:999px;text-decoration:none;white-space:nowrap;transition:all .3s cubic-bezier(.22,1,.36,1)}
.el-nav__cta:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.18)}

/* ═══ HERO ═══ */
.el-hero{position:relative;min-height:100vh;display:flex;align-items:center;padding:140px 24px 100px;overflow:hidden}
.el-hero__inner{position:relative;z-index:2;max-width:1280px;margin:0 auto;width:100%}
.el-hero__h1{font-family:'Hanken Grotesk',sans-serif;font-size:72px;font-weight:800;line-height:80px;letter-spacing:-.04em;margin-bottom:28px;color:#e5e2e1}
@media(max-width:768px){.el-hero__h1{font-size:48px;line-height:52px}}
.el-hero__sub{font-family:'Inter',sans-serif;font-size:18px;line-height:28px;color:#94A3B8;max-width:500px;margin-bottom:12px}
.el-hero__sub2{font-family:'Inter',sans-serif;font-size:15px;color:rgba(148,163,184,.5);margin-bottom:40px}
.el-hero__ctas{display:flex;flex-wrap:wrap;gap:14px;align-items:center}

/* 3D Model */
.el-hero__model{position:absolute;top:50%;right:-5%;transform:translateY(-50%);width:55%;height:90%;z-index:1;pointer-events:none}
@media(max-width:1024px){.el-hero__model{width:80%;right:-20%;opacity:.35}}
@media(max-width:640px){.el-hero__model{display:none}}
.el-hero__model-glow{position:absolute;inset:15%;border-radius:50%;background:radial-gradient(circle,rgba(255,59,92,.1) 0%,transparent 65%);filter:blur(60px);pointer-events:none}

/* Ambient blobs */
.el-hero__blob{position:absolute;border-radius:50%;filter:blur(120px);pointer-events:none;will-change:transform}
.el-hero__blob--1{width:700px;height:700px;top:-200px;right:-100px;background:rgba(255,59,92,.12);animation:blobDrift1 12s ease-in-out infinite alternate}
.el-hero__blob--2{width:500px;height:500px;top:100px;right:200px;background:rgba(10,15,30,.8);animation:blobDrift2 15s ease-in-out infinite alternate}
.el-hero__blob--3{width:400px;height:400px;bottom:-100px;left:-100px;background:rgba(255,59,92,.05);animation:blobDrift3 18s ease-in-out infinite alternate}
@keyframes blobDrift1{0%{transform:translate(0,0) scale(1)}100%{transform:translate(-40px,30px) scale(1.08)}}
@keyframes blobDrift2{0%{transform:translate(0,0) scale(1)}100%{transform:translate(30px,-20px) scale(.92)}}
@keyframes blobDrift3{0%{transform:translate(0,0)}100%{transform:translate(20px,-20px)}}

/* ═══ BUTTONS ═══ */
.el-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:999px;font-family:'Hanken Grotesk',sans-serif;font-size:15px;font-weight:600;text-decoration:none;border:none;cursor:pointer;transition:all .3s cubic-bezier(.22,1,.36,1)}
.el-btn--accent{background:#FF3B5C;color:#fff}
.el-btn--accent:hover{transform:scale(1.03);box-shadow:0 0 36px rgba(255,59,92,.35)}
.el-btn--ghost{background:transparent;color:#e5e2e1;border:1px solid rgba(255,255,255,.1)}
.el-btn--ghost:hover{border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.03)}
.el-btn--white{background:#fff;color:#FF3B5C;font-weight:700;box-shadow:0 16px 40px rgba(0,0,0,.3)}
.el-btn--white:hover{transform:scale(1.03)}
.el-btn--ghost-w{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.35)}
.el-btn--ghost-w:hover{background:rgba(255,255,255,.08)}

/* ═══ STATS ═══ */
.el-stats{padding:0 24px;margin-top:-20px}
.el-stats__inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px;border-top:1px solid rgba(255,255,255,.06);padding-top:48px}
.el-stat{display:flex;align-items:center;gap:16px}
.el-stat__sep{width:60px;height:1px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.12) 0,rgba(255,255,255,.12) 4px,transparent 4px,transparent 10px);margin-right:16px}
@media(max-width:768px){.el-stat__sep{display:none}.el-stats__inner{justify-content:center}}
.el-stat__val{font-family:'Hanken Grotesk',sans-serif;font-size:40px;font-weight:700;line-height:48px;color:#e5e2e1}
.el-stat__label{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.05em;color:#94A3B8;text-transform:uppercase;margin-top:2px}

/* ═══ PILLS ═══ */
.el-pills{display:flex;justify-content:center;gap:20px;padding:100px 24px 120px;flex-wrap:wrap}
.el-pill{display:flex;align-items:center;justify-content:center;gap:12px;width:320px;height:90px;border-radius:999px;background:#0A0F1E;border:1px solid rgba(255,255,255,.06);text-decoration:none;color:#e5e2e1;font-family:'Hanken Grotesk',sans-serif;font-size:19px;font-weight:600;letter-spacing:-.01em;transition:all .4s cubic-bezier(.22,1,.36,1)}
.el-pill:hover{border-color:rgba(255,59,92,.2);transform:scale(1.03);box-shadow:0 0 50px rgba(255,59,92,.06)}

/* ═══ SECTIONS ═══ */
.el-sec{padding:120px 0}
.el-sec--ink{background:#0A0F1E}

/* ═══ GLASS CARDS ═══ */
.el-card{position:relative;background:#0A0F1E;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:32px;overflow:hidden;transition:all .4s cubic-bezier(.22,1,.36,1)}
.el-card__glow{position:absolute;inset:0;border-radius:12px;background:radial-gradient(500px circle at var(--gx,50%) var(--gy,50%),rgba(255,59,92,.06),transparent 50%);opacity:0;transition:opacity .35s;pointer-events:none}
.el-card:hover{border-color:rgba(255,59,92,.15);transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.25)}
.el-card:hover .el-card__glow{opacity:1}

/* ═══ FEATURES ═══ */
.el-features{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:768px){.el-features{grid-template-columns:repeat(3,1fr)}}
.el-feature__icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:rgba(255,59,92,.08);border-radius:10px;color:#FF3B5C;margin-bottom:20px}
.el-feature__title{font-family:'Hanken Grotesk',sans-serif;font-size:20px;font-weight:600;margin-bottom:10px;color:#e5e2e1}
.el-feature__body{font-size:15px;line-height:24px;color:#94A3B8}

/* ═══ STEPS ═══ */
.el-steps{display:grid;grid-template-columns:1fr;gap:40px;position:relative}
@media(min-width:768px){.el-steps{grid-template-columns:repeat(3,1fr)}}
.el-steps__line{display:none}
@media(min-width:768px){.el-steps__line{display:block;position:absolute;top:48px;left:0;width:100%;height:1px;background:rgba(255,255,255,.06)}}
.el-step{display:flex;flex-direction:column;align-items:center;text-align:center}
.el-step__circle{width:96px;height:96px;border-radius:50%;background:rgba(5,5,5,.6);border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;margin-bottom:24px;position:relative;backdrop-filter:blur(8px)}
.el-step__num{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:600;color:#FF3B5C}
.el-step__badge{position:absolute;bottom:-6px;right:2px;width:32px;height:32px;border-radius:50%;background:#FF3B5C;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(255,59,92,.4)}
.el-step__title{font-family:'Hanken Grotesk',sans-serif;font-size:20px;font-weight:600;margin-bottom:8px;color:#e5e2e1}
.el-step__body{font-size:15px;line-height:24px;color:#94A3B8;max-width:280px}

/* ═══ DASHBOARD ═══ */
.el-dash{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:768px){.el-dash{grid-template-columns:2fr 1fr}}
.el-dash__main{padding:36px!important}
.el-dash__side{padding:28px!important}
.el-dash__header{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;flex-wrap:wrap;gap:12px}
.el-dash__title{font-family:'Hanken Grotesk',sans-serif;font-size:20px;font-weight:600;color:#e5e2e1}
.el-live{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:5px 12px;background:rgba(16,185,129,.08);color:#10B981;border:1px solid rgba(16,185,129,.15);border-radius:999px;letter-spacing:.04em}
.el-dash__metrics{display:grid;grid-template-columns:1fr;gap:20px;margin-bottom:28px}
@media(min-width:640px){.el-dash__metrics{grid-template-columns:repeat(3,1fr)}}
.el-metric{font-family:'Hanken Grotesk',sans-serif;font-size:32px;font-weight:700;color:#e5e2e1;line-height:1.2}
.el-delta{display:flex;align-items:center;gap:4px;font-size:12px;color:#10B981;margin-top:6px}
.el-bar{width:100%;height:3px;background:rgba(255,255,255,.04);border-radius:2px;margin-top:8px;overflow:hidden}
.el-bar__fill{height:100%;background:linear-gradient(90deg,#FF3B5C,#FF6B81);border-radius:2px}
.el-chart{width:100%;height:140px;background:rgba(5,5,5,.4);border:1px solid rgba(255,255,255,.04);border-radius:8px;display:flex;align-items:flex-end;gap:5px;padding:14px}
.el-chart__bar{flex:1;background:#FF3B5C;border-radius:3px 3px 0 0}
.el-cr{display:flex;justify-content:space-between;align-items:center;padding:14px 0}
.el-avatar{width:34px;height:34px;border-radius:50%;background:rgba(255,59,92,.08);display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:#FF3B5C;flex-shrink:0}
.el-dash__manage{display:block;text-align:center;margin-top:16px;padding:12px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:#FF3B5C;text-decoration:none;border-top:1px solid rgba(255,255,255,.04);transition:background .2s}
.el-dash__manage:hover{background:rgba(255,59,92,.04)}

/* ═══ PLATFORMS ═══ */
.el-plat{padding:80px 24px;border-top:1px solid rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.04);text-align:center}
.el-plat__h3{font-family:'Hanken Grotesk',sans-serif;font-size:24px;font-weight:600;letter-spacing:-.02em;margin-bottom:44px;color:#e5e2e1}
.el-plat__list{display:flex;flex-wrap:wrap;justify-content:center;gap:60px;opacity:.45}
@media(min-width:768px){.el-plat__list{gap:100px}}
.el-plat__item{display:flex;align-items:center;gap:10px;font-family:'Hanken Grotesk',sans-serif;font-size:22px;font-weight:700;letter-spacing:-.03em;transition:opacity .3s;cursor:default}
.el-plat__item:hover{opacity:1}

/* ═══ FAQ ═══ */
.el-faq{border-bottom:1px solid rgba(255,255,255,.06);padding:24px 0;cursor:pointer;transition:border-color .3s}
.el-faq:first-of-type{border-top:1px solid rgba(255,255,255,.06)}
.el-faq:hover{border-color:rgba(255,59,92,.12)}
.el-faq__q{font-family:'Hanken Grotesk',sans-serif;font-size:18px;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;color:#e5e2e1}
.el-faq__q::-webkit-details-marker{display:none}
.el-faq__icon{transition:transform .3s;color:rgba(255,255,255,.3);flex-shrink:0}
.el-faq[open] .el-faq__icon{transform:rotate(180deg)}
.el-faq__a{margin-top:16px;font-size:15px;line-height:24px;color:#94A3B8;max-width:580px}

/* ═══ CTA ═══ */
.el-cta{background:#FF3B5C;padding:120px 24px;position:relative;overflow:hidden;text-align:center}
.el-cta__deco{position:absolute;top:0;right:0;width:50%;height:100%;background:rgba(255,255,255,.04);transform:skewX(-12deg) translateX(25%)}
.el-cta__inner{position:relative;z-index:1;max-width:720px;margin:0 auto}
.el-cta__h2{font-family:'Hanken Grotesk',sans-serif;font-size:48px;font-weight:800;letter-spacing:-.04em;color:#fff;margin-bottom:20px;line-height:1.1}
@media(max-width:768px){.el-cta__h2{font-size:36px}}
.el-cta__sub{font-family:'Inter',sans-serif;font-size:17px;line-height:28px;color:rgba(255,255,255,.7);max-width:520px;margin:0 auto 44px}

/* ═══ FOOTER ═══ */
.el-ft{border-top:1px solid rgba(255,255,255,.05);padding:72px 0 56px}
.el-ft__grid{display:grid;grid-template-columns:1fr 1fr;gap:36px}
@media(min-width:768px){.el-ft__grid{grid-template-columns:2fr 1fr 1fr 1fr}}
.el-ft__brand{grid-column:span 2}
@media(min-width:768px){.el-ft__brand{grid-column:span 1}}
.el-ft__logo{display:flex;align-items:center;gap:8px;margin-bottom:16px;font-family:'Hanken Grotesk',sans-serif;font-weight:700;font-size:16px}
.el-ft__tagline{font-size:14px;line-height:22px;color:#94A3B8;max-width:260px}
.el-ft__copy{font-size:12px;color:rgba(148,163,184,.5);margin-top:20px}
.el-ft__col{display:flex;flex-direction:column;gap:10px}
.el-ft__head{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.06em;color:rgba(229,226,225,.5);text-transform:uppercase;margin-bottom:6px}
.el-ft__link{font-size:13px;color:#94A3B8;text-decoration:none;transition:color .2s}
.el-ft__link:hover{color:#FF3B5C}
`;
