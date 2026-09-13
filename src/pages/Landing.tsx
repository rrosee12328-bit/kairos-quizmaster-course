import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Menu, Play, Shield, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import LandingFAQ from "@/components/LandingFAQ";
import logo from "@/assets/kairos-logo.png";
import officer from "@/assets/security-officer-hero-16x9.jpg";
import level2 from "@/assets/level2-security-vehicle.jpg";
import level3 from "@/assets/level3-security-professional.jpg";
import level4 from "@/assets/level4-bodyguard.jpg";
import pepper from "@/assets/pepper-spray-hero.jpg";
import "./Landing.css";
const paths = [
    { id: "level2", level: "Level 2", role: "Start in security", title: "Build your foundation.", name: "Unarmed security officer", image: level2, format: "Online learning", description: "Get to know the responsibilities of a security officer, build situational awareness, and start developing professional judgment.", topics: ["Security fundamentals", "Observation and reporting", "Professional responsibilities"], note: "Start with the fundamentals. Review the course details for enrollment and completion requirements." },
    { id: "level3", level: "Level 3", role: "Advance to armed security", title: "Prepare for more responsibility.", name: "Armed security officer", image: level3, format: "Online + in person", description: "Develop your knowledge through online theory, then put your learning into practice with Kairos in the Houston area.", topics: ["Online theory and assessment", "In-person firearms and practical training", "Both parts completed through Kairos"], note: "Online pricing covers Part 1 only. Part 2 is required and priced separately. Online theory alone is not a Level 3 certificate." },
    { id: "level4", level: "Level 4", role: "Move into personal protection", title: "Train for close protection.", name: "Personal protection officer", image: level4, format: "Online + in person", description: "Explore the responsibilities of personal protection through online study and required practical training with Kairos in Houston.", topics: ["Personal protection theory", "Online assessment", "In-person practical training"], note: "Online pricing covers Part 1 only. Part 2 is required and priced separately. Both parts must be completed through Kairos." },
    { id: "pepper-spray", level: "Specialty", role: "Add a practical skill", title: "Expand your training.", name: "Pepper spray training", image: pepper, format: "Specialty course", description: "Add focused pepper spray training to your professional development. Explore the course for its curriculum and completion requirements.", topics: ["Focused course material", "Practical knowledge", "Course assessment"], note: "A specialty course complements your learning. It does not replace required security officer training." },
];
export default function Landing() {
    const [user, setUser] = useState<User | null>(null);
    const [selected, setSelected] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [videoOpen, setVideoOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const path = paths[selected];
    useEffect(() => {
        let active = true;
        supabase.auth.getUser().then(({ data }) => { if (active)
            setUser(data.user); });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
        return () => { active = false; subscription.unsubscribe(); };
    }, []);
    useEffect(() => {
        const page = root.current;
        if (!page)
            return;
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        let frame = 0;
        const update = () => {
            frame = 0;
            const hero = page.querySelector<HTMLElement>(".ks-hero");
            if (!hero)
                return;
            const r = hero.getBoundingClientRect();
            const progress = Math.max(0, Math.min(1, -r.top / r.height));
            page.style.setProperty("--hero-progress", media.matches ? "0" : String(progress));
            const method = page.querySelector<HTMLElement>(".ks-method");
            if (method)
                page.style.setProperty("--method-progress", String(Math.max(0, Math.min(1, (innerHeight - method.getBoundingClientRect().top) / (innerHeight + method.offsetHeight * .25)))));
        };
        const schedule = () => { if (!frame)
            frame = requestAnimationFrame(update); };
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        }), { threshold: .12 });
        page.querySelectorAll("[data-entrance]").forEach(el => observer.observe(el));
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        media.addEventListener("change", schedule);
        update();
        return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); media.removeEventListener("change", schedule); };
    }, []);
    return <div className="ks-page" ref={root}>
    <a className="ks-skip" href="#main">Skip to content</a>
    <header className="ks-header">
      <Link className="ks-brand" to="/" aria-label="Kairos Security Academy home"><img src={logo} alt="" width="44" height="44"/><span>KAIROS<small>SECURITY ACADEMY</small></span></Link>
      <nav className="ks-desktop-nav" aria-label="Main navigation"><a href="#training">Training paths</a><a href="#approach">Our approach</a><a href="#questions">Questions</a></nav>
      <div className="ks-header-actions"><Link className="ks-account" to={user ? "/profile" : "/auth"}>{user ? "My account" : "Student login"}<ArrowUpRight size={15}/></Link><Link className="ks-button ks-small" to="/courses">Explore courses <ArrowUpRight size={16}/></Link><button className="ks-menu" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
      {menuOpen && <nav id="mobile-nav" className="ks-mobile-nav" aria-label="Mobile navigation" onKeyDown={e => { if (e.key === "Escape")
        setMenuOpen(false); }}><a href="#training" onClick={() => setMenuOpen(false)}>Training paths</a><a href="#approach" onClick={() => setMenuOpen(false)}>Our approach</a><a href="#questions" onClick={() => setMenuOpen(false)}>Questions</a><Link to={user ? "/profile" : "/auth"}>{user ? "My account" : "Student login"}</Link></nav>}
    </header>
    <main id="main">
      <section className="ks-hero" aria-labelledby="hero-title">
        <div className="ks-hero-word" aria-hidden="true">KAIROS</div>
        <div className="ks-hero-copy"><p className="ks-eyebrow"><span /> PROFESSIONAL SECURITY TRAINING</p><h1 id="hero-title">Confidence.<br /><span>Under pressure.</span></h1><p className="ks-hero-description">Train for the moments that matter. Build your future in security with Kairos Security Academy.</p><div className="ks-hero-actions"><a className="ks-button" href="#training">Find your path <ArrowDown size={18}/></a><button className="ks-film-link" onClick={() => setVideoOpen(true)}><span><Play size={13} fill="currentColor"/></span> Meet the academy</button></div></div>
        <div className="ks-hero-art"><div className="ks-architectural-plane" aria-hidden="true"/><div className="ks-portrait"><img src={officer} alt="Security professional wearing the Kairos uniform" width="896" height="1152" fetchPriority="high"/></div><div className="ks-frame" aria-hidden="true"/><p className="ks-photo-caption">PREPARED TO PROTECT.</p></div>
      </section>
      <section id="approach" className="ks-intro ks-section" data-entrance>
        <div className="ks-intro-mark"><Shield strokeWidth={1}/><span>Knowledge.<br />Judgment.<br />Readiness.</span></div>
        <div><h2>More than a course.<br />A standard you carry.</h2><p>Security work asks you to be ready when others need you. Our training connects what you learn with the responsibility of protecting people, places, and communities.</p><button className="ks-text-link" onClick={() => setVideoOpen(true)}>Get to know Kairos <Play size={15}/></button></div>
      </section>
      <section id="training" className="ks-training ks-section" aria-labelledby="training-title">
        <div className="ks-training-heading" data-entrance><p className="ks-eyebrow">YOUR NEXT CHAPTER</p><h2 id="training-title">Where do you<br />want to go?</h2><p>Choose your direction. See what comes next.</p></div>
        <div className="ks-path-layout">
          <div className="ks-path-options" aria-label="Choose a training path">{paths.map((item, index) => <button key={item.id} onClick={() => setSelected(index)} aria-pressed={selected === index} aria-controls="path-detail" className={selected === index ? "is-selected" : ""}><span className="ks-level">{item.level}</span><span>{item.role}</span><ArrowUpRight size={20}/></button>)}</div>
          <div className="ks-path-detail" id="path-detail"><div className="ks-path-image" key={path.image}><img src={path.image} alt={path.name + " training"} width="1200" height="800" loading="lazy"/></div><div className="ks-path-copy" aria-live="polite" aria-atomic="true"><div className="ks-path-label"><span>{path.level}</span><span>{path.format}</span></div><h3>{path.title}</h3><p>{path.description}</p><ul>{path.topics.map(topic => <li key={topic}><Check size={16}/>{topic}</li>)}</ul><p className="ks-path-note">{path.note}</p><Link className="ks-button" to={`/checkout/${path.id}`}>View this course <ArrowUpRight size={17}/></Link></div></div>
        </div>
        <Link className="ks-text-link ks-catalog-link" to="/courses">Compare all courses <ArrowRight size={17}/></Link>
      </section>
      <section className="ks-method ks-section" aria-labelledby="method-title"><div className="ks-method-heading" data-entrance><h2 id="method-title">From learning<br />to readiness.</h2><p>A clear route forward, with practical next steps.</p></div><div className="ks-method-steps"><div className="ks-route-line" aria-hidden="true"><span /></div>{[{ title: "Learn on your schedule", copy: "Work through online course material and build your understanding, one lesson at a time." }, { title: "Put your knowledge to the test", copy: "Complete your course assessments. Review the material and prepare for the next stage." }, { title: "Take the next step", copy: "For Level 3 and Level 4, complete the required in-person training with Kairos in Houston. Part 2 is priced separately." }].map((step, i) => <article key={step.title} data-entrance><span className="ks-step-number">0{i + 1}</span><div><h3>{step.title}</h3><p>{step.copy}</p></div></article>)}</div></section>
      <div id="questions" className="ks-questions"><LandingFAQ /></div>
      <section className="ks-close ks-section"><div><p>Your next chapter starts with a decision.</p><h2>Be ready.<br />Be Kairos.</h2></div><div className="ks-close-action"><span>YOUR SELECTED PATH</span><h3>{path.name}</h3><Link className="ks-button ks-button-light" to={`/checkout/${path.id}`}>View this course <ArrowUpRight size={19}/></Link><a href="#training">Change your path <ArrowUpRight size={14}/></a></div></section>
    </main>
    <footer className="ks-footer"><Link className="ks-brand" to="/"><img src={logo} alt="" width="40" height="40"/><span>KAIROS<small>SECURITY ACADEMY</small></span></Link><div><a href="mailto:info@kairossecurityacademy.com">Contact the academy <ArrowUpRight size={14}/></a><Link to="/privacy-policy">Privacy</Link><Link to="/terms-of-service">Terms</Link></div><p>© {new Date().getFullYear()} Kairos Security Academy. License # F28623301</p></footer>
    <Dialog open={videoOpen} onOpenChange={setVideoOpen}><DialogContent className="ks-video-dialog"><DialogTitle>Meet Kairos Security Academy</DialogTitle><DialogDescription>Discover the academy and our approach to security training.</DialogDescription>{videoOpen && <iframe src="https://iframe.mediadelivery.net/embed/627550/8765cd42-d83b-4a31-8dff-ae289df9bcc2?autoplay=false&preload=true" title="Kairos Security Academy welcome video" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>}<p className="text-sm">If the player is unavailable, <a className="underline" href="https://iframe.mediadelivery.net/embed/627550/8765cd42-d83b-4a31-8dff-ae289df9bcc2" target="_blank" rel="noreferrer">open the academy video</a>.</p></DialogContent></Dialog>
  </div>;
}
