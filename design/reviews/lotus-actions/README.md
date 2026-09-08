# Lotus actions and numerology recovery

Production investigation: the failing request reached Ministral14B and recorded a real response; two subsequent409 responses were cooldown, not a live generation. The former API did not log the post-response failure category. Deterministic tests reproduced rejection of explicit non-prediction disclaimers.

Corrections: narrowly accept these disclaimers without accepting predictions appended after them; one bounded corrective completion in the same reservation; separate metering per call;20-second provider timeout per call; protected read-only status RPC distinguishes active work, cooldown and daily limit. Polling performs at most20 GETs and is canceled on unmount, with no automatic POST. Structured errors contain technical codes, never generated text or identity.

Reuse: the existing water lotus from render/conversation/LotusAttente.tsx. Actions use a transparent, compact text treatment and the same footprint while petals illuminate. Reduced motion is static. The first visual pass found duplicate waiting text below the button; the second keeps that separate live announcement visually hidden.

Validation:613 targeted tests passed, plus the final explicit-disclaimer case. Local SQL covers status isolation, consent, active lease and cooldown. A full local synthetic-account pipeline using the real provider completed in6.3seconds: generate, validate, persist, read status and reuse cache. Browser captures exercise Chromium/WebKit at390,768,1440px, four states plus reduced motion, no overflow/errors, touch targets at least44px.

Production rollout includes0100_attente_lecture_numerologie.sql before the application release. Production smoke verification is reported with delivery.
