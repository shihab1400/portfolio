---
title: MindEase Oasis
description: A mental-health support platform for Bangladesh with an AI companion, self-assessments, verified doctors, paid bookings and private text consultations.
thumbnail: ./mindease.png
thumbnailAlt: MindEase Oasis patient dashboard with the AI companion, self-assessment and appointment cards on a calm sage-green theme
technologies:
    [
        Next.js,
        NestJS,
        TypeScript,
        PostgreSQL,
        Prisma,
        Tailwind CSS,
        Gemini API,
        SSLCommerz,
        Playwright,
    ]
category: Web app
featured: true
repositoryUrl: https://github.com/shihab1400/APWT_full_stack
publishDate: 2026-10-25
purpose: Make mental-health support in Bangladesh easier to reach, more private and less stigmatised, from an anonymous first check-in to a paid session with a verified doctor.
features:
    - Streaming AI companion (Google Gemini) that replies in English, Bangla or Banglish, with crisis detection that always shows emergency hotlines
    - PHQ-9 and GAD-7 self-assessments with instant scoring and doctor recommendations for high-risk results
    - Doctor verification, weekly schedules and booking of online or in-person sessions with SSLCommerz payments (bKash, Nagad, cards)
    - Real-time notifications and private patient–doctor text consultations with read receipts
    - Role-based dashboards for patients, doctors and admins, with audit logging, review moderation and risk-alert follow-up
challenge: Handling sensitive health data and real payments safely, while keeping the experience fast on low-bandwidth connections.
solution: Sensitive text is encrypted at rest with AES-256-GCM, payments are always re-verified with the gateway and booked inside a database transaction that rolls back on failure, and live updates use lightweight Server-Sent Events through a first-party proxy.
---

MindEase Oasis started as the software test plan for a university Software Quality Assurance course and grew into a full-stack product. It is a TypeScript monorepo (pnpm + Turborepo): a Next.js 16 website, a NestJS 12 API, and a shared package of Zod schemas that validates the same data on both sides.

## Implementation

**Authentication and roles**

Access tokens live in httpOnly cookies, with refresh-token rotation and reuse detection. Every route is protected by global NestJS guards, and patients, doctors and admins each get their own dashboard. A deactivated account is locked out on its next request, not when its token expires.

**AI companion**

Replies from Gemini stream word by word, falling back across three models when one is rate limited. Before the AI ever sees a message, a keyword screen in English, Romanised Bangla and Bangla script checks for crisis language. A crisis message shows the 999 and MindEase hotlines and alerts admins, even when a free user is over their daily limit.

**Booking and payments**

- **Slot holding:** a booking holds the slot under a per-doctor PostgreSQL advisory lock, so two patients can never take the same time.
- **Payment:** the patient then pays through SSLCommerz. Gateway callbacks are never trusted on their own: the API asks SSLCommerz directly before settling.
- **Rollback:** a failed payment, cancelled payment or 15-minute timeout releases the slot, so nothing is left half-done.
- **Wrong amounts:** an amount that doesn't match the doctor's fee is never accepted and is marked for refund.

**Real-time features**

Notifications, chat messages and read receipts arrive over one Server-Sent Events stream that passes through the Next.js proxy. Online sessions get a private chat that opens 15 minutes before the start and becomes read-only an hour after the end.

**Privacy and security**

- **Sharing:** patients choose whether a doctor sees their assessment results, and reviews are anonymous.
- **Encryption:** chats, notes and messages are encrypted at rest.
- **Rate limits:** they apply per signed-in user, because many users in Bangladesh share one public IP through mobile carriers.
- **Admin accountability:** every admin action is written to an audit log.

## Testing

Test cases from the original QA plan (FR_1–FR_11) map directly to automated tests:

- **Unit:** Vitest, for scoring, scheduling, encryption and the payment gateway client.
- **API end-to-end:** Supertest against a real PostgreSQL database.
- **Browser:** Playwright journeys that register a patient, take an assessment, upgrade to Premium, book and pay, and have the doctor confirm.

GitHub Actions runs all of them on every push.
