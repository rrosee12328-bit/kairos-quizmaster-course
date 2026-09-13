# Kairos landing-page verification

Verified against the production build served at http://127.0.0.1:4173/.

## Completed
- TypeScript application check, targeted ESLint, production Vite build, and git diff whitespace check pass.
- Desktop 1440px, phone 390px, and compact 360px layouts checked in headless Chrome. Compact reduced-motion coverage included.
- No uncaught page errors, broken images, or horizontal overflow in the initial three-layout run.
- All four role selections update the detail panel and closing course destination. Exactly one choice is marked pressed.
- Selected specialty link navigates to the existing /checkout/pepper-spray detail route.
- Certification FAQ tab and accordion work. Mobile navigation opens and closes on anchor selection.
- Video dialog opens and closes with Escape. Third-party video playback was not fully watched or certified.
- Screenshots include hero opening, three intermediate hero positions, introduction, selector, FAQ and closing states.
- Final interaction run reports no failed requests at 1440, 390 or 360px.
- Supabase URL in existing environment matches the user-supplied project. No database migrations or account mutations performed.

## Findings resolved
The first screenshot run exposed overly large FAQ accordion headings caused by a broad h3 rule. A scoped accordion rule corrects it. Final *-faq-final.png screenshots supersede initial *-questions.png captures. Entrance content now keeps full opacity while moving slightly into place, avoiding pale text if a visitor stops during an entrance.

## Limits
Authenticated student journeys, payments, certificate generation, live deployment, real iOS hardware and full accessibility certification were not tested. Existing application bundle warnings remain (large bundle and mixed static/dynamic Supabase imports). Repository dependency manifests and lockfile remain unchanged; local dependency installation used compatible package.json ranges through the bundled pnpm runtime.

## Files and reproduction
Source: src/pages/Landing.tsx, src/pages/Landing.css, src/components/LandingFAQ.tsx.
Evidence: artifacts/*.png and artifacts/interaction-results.json.
Verification scripts in this directory use the host's bundled Playwright and Chrome paths. Run from repository root with the production preview on port 4173; adjust those paths for a different machine.
Build: `npm ci` then `npm run build`; preview: `npm run preview -- --host 127.0.0.1 --port 4173` in an environment with npm available.

The supplied Scroll Craft engine copies are unmodified reference artifacts, not loaded into the React app. Page motion uses cleaned-up component listeners because the supplied engine has no unmount lifecycle.

Delivery is local and reviewable. No remote commit, pull request, or deployment was made.
