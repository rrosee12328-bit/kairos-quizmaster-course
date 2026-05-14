## Goal
After a student passes any course exam, show DPS-licensing "Next Steps" both:
1. **In-app** — on the results screen, below the score
2. **Email** — appended to the existing pass email

## Links (confirmed)
- TOPS: `https://www.dps.texas.gov/section/private-security/tops`
- IdentoGO: `https://www.identogo.com`
- Calendly (Part 2 / firearm exam): existing `https://calendly.com/kairossecurity/30min`

## Files to edit

### 1. `supabase/functions/send-course-completion/index.ts` (email)
Inside each `passed === true` branch, add a "What To Do Next" card with the course-specific steps below. Style matches existing email (light card `#f9fafb` / `#e5e7eb`, blue CTA `#3b82f6`, amber reminder box `#fff3cd` / `#ffc107`).

**Level 2 (6 steps):**
1. Complete online training ✓
2. Download & print certificate — **button → `https://kairossecurityacademy.com/profile`**
3. Create TOPS account — button → TOPS link, apply for Non-Commissioned Security Officer License (Level II)
4. Upload Level II certificate to TOPS application
5. Schedule fingerprinting — button → IdentoGO link
6. Wait for DPS approval (license mailed once approved)

**Level 3 (9 steps):**
1. Complete online Level III course ✓
2. Schedule firearm proficiency exam with Kairos instructor — button → Calendly link
3. Apply through TOPS for Commissioned Security Officer License (Level III) — button → TOPS link
4. Schedule fingerprinting — button → IdentoGO link
5. Schedule MMPI psychological evaluation (independent psychiatrist, not affiliated with Kairos)
6. Attend firearm proficiency exam — **Gear list:**
   - Semi-automatic firearm
   - 50 rounds of ammunition
   - Eye protection (recommended)
   - Ear protection (recommended)
7. Receive firearm proficiency certificate from instructor
8. Upload firearm proficiency certificate to TOPS
9. Wait for DPS approval (reviews application, fingerprints, MMPI, firearm cert)

No "Download Certificate" button (no online cert for Level 3).

**Level 4 (PPO, 4 steps + prerequisite):**
- **Prerequisite warning box** (red/amber): Must already hold active Commissioned Security Officer License (Level III) before applying for PPO.
1. Complete PPO training ✓
2. Follow same DPS steps as Level III: TOPS application, IdentoGO fingerprinting, firearm proficiency, required evaluations — buttons → TOPS + IdentoGO + Calendly
3. Upload all required documents to TOPS
4. Wait for DPS approval

No "Download Certificate" button (no online cert for Level 4).

**Pepper Spray:**
- Keep existing content
- Add a "Download your certificate again anytime" button → `/profile`
- Short reminder: keep certificate on file for employers; not a DPS license

**Important Reminders block (all courses, at the bottom):**
- Verify all DPS submissions are accurate
- Delays in fingerprints/MMPI/uploads delay approval
- Keep copies of all certificates and receipts
- Monitor TOPS regularly for status updates

### 2. `src/components/Quiz.tsx` (in-app notification)
Add a `<NextStepsCard />` component rendered below the score on the pass screen. Same content per course as the email, in the app's design system (semantic tokens, `Card`, `Button`).

- Buttons use `<a href target="_blank" rel="noopener noreferrer">` for external links (TOPS, IdentoGO, Calendly)
- "Download Certificate" button (Level 2 + Pepper Spray only) → navigates to `/profile`
- Component lives in new file `src/components/CourseNextSteps.tsx`, accepts `courseType` prop, returns the right step list

### 3. New file: `src/components/CourseNextSteps.tsx`
Single component with a switch on `courseType` that renders the matching steps. Reused only by the Quiz results screen for now.

## Out of scope
- No DB schema changes
- No admin notification email change
- No new edge functions
- No changes to the Profile page (it already has cert downloads)

## Deploy
After editing the edge function, deploy `send-course-completion` so the next passing student gets the new content.