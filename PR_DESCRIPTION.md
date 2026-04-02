## Summary
- Make the DocMind UI fully responsive across core breakpoints while preserving existing upload, ask, and compare behavior.
- Improve mobile ergonomics for panel layout, chat messages, and input controls.

## Changes
- Add mobile-first layout switching in `app/page.tsx` to stack panels on smaller screens and keep split-view on desktop.
- Update `app/components/LeftPanel.tsx` spacing, sizing, and text-wrapping behavior for narrow viewports.
- Update `app/components/ChatMessages.tsx` and `app/components/ChatInput.tsx` to prevent overflow and maintain usable controls on mobile.
- Add global overflow safeguards in `app/globals.css`.

## Testing
- `npm run lint`
- `npm run build`
- Manual responsive checks at 320px, 375px, 768px, 1024px, and 1280px
