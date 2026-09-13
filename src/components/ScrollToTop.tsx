import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // Route links can target a section on another page; wait for React to commit it.
    const frame = requestAnimationFrame(() => {
      let id = hash.slice(1);
      try { id = decodeURIComponent(id); } catch { /* Keep malformed fragments harmless. */ }
      const target = id ? document.getElementById(id) : null;
      if (target) target.scrollIntoView({ block: "start", behavior: "instant" });
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}
