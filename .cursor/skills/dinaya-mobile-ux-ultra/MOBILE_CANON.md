# Mobile Canon — Top 0.1% MUST rules

Synthesized from Apple HIG, MD3, Linear/Notion, Stripe/Shopify, Fresha/Booksy, WCAG 2.2, Fitts/thumb research, PWA chrome, SI/TA.

## Navigation
1. Bottom bar = 3–5 peer destinations; labels always on.
2. More = full-width sheet: drag handle, grouped lists, Account + Sign out.
3. Focus trap + Escape + backdrop + restore focus to trigger.
4. Pad main: `nav height + env(safe-area-inset-bottom)`.
5. Prefer `100dvh`/`svh`; never bare `100vh` for shells.

## Touch
6. ≥44×44 CSS px hit area; ≥8px separation.
7. `touch-action: manipulation` on buttons; no hover-only.
8. Primary actions in lower third; sticky CTA above safe-area.

## Calendar / bookings (salon)
9. Phone default **Day**; Agenda for scan; Week opt-in / lg+.
10. Never trap user on 7-column week with Week tab hidden.
11. Day empty state + CTA; agenda empty copy.
12. Booking rows: name → time → status → WhatsApp; card tap → detail.

## Lists / tables
13. Mobile: cards or stacked rows — no H-scroll tables.
14. Max ~2 visible row actions; rest in detail.
15. Status pill + label (never color alone).

## Forms / setup
16. Visible labels; inputs ≥16px; sticky safe CTA on long wizards.
17. Keyboard: scroll focused field above sticky CTA.
18. One job per step; confirm defaults when seeded.

## Motion
19. Interactive = interruptible transitions; springs `bounce: 0`.
20. Sheet enter ~250–350ms; exit ~150–200ms; honor `prefers-reduced-motion`.

## A11y
21. Dialogs: `role="dialog"`, labelled, trap, restore.
22. Contrast 4.5:1 text; focus-visible ≥3:1.
23. Live regions for toasts/saves.

## SL / i18n
24. SI/TA are LTR; design for longer labels; body ≥16px with Noto when localized.
25. WhatsApp deep link is a first-class row action.

## Ban
See ANTI_PATTERNS.md.
