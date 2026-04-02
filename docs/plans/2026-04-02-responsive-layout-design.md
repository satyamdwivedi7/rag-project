## Responsive Layout Design

### Goal
Make the existing website fully responsive across mobile (320+), tablet (768+), laptop (1024+), desktop (1280+), and ultra-wide screens while preserving current behavior and data flow.

### Approach
Use a CSS-first responsive refactor within existing components.

### Architecture and Breakpoint Strategy
- Keep the existing Next.js structure and component boundaries.
- Use mobile-first styling and progressively enhance layout density at larger breakpoints.
- Standardize layout behavior for key widths: 320, 375, 768, 1024, 1280, and ultra-wide.
- Add overflow protections to prevent clipping and horizontal scrolling.

### Component-Level Changes
- `app/page.tsx`
  - Use stacked layout on mobile.
  - Move to split-pane layout at larger breakpoints.
  - Replace fixed dimensions with responsive constraints.
- `app/components/LeftPanel.tsx`
  - Ensure cards and controls wrap cleanly on narrow widths.
  - Tune spacing and typography for smaller screens.
- `app/components/ChatMessages.tsx`
  - Keep readable max-widths for chat bubbles.
  - Ensure long text/citations wrap without overflow.
- `app/components/ChatInput.tsx`
  - Allow control rows to wrap or stack on mobile.
  - Prevent compare and send controls from collapsing.
- `app/globals.css`
  - Add global safety rules for media sizing, long-word breaks, and max-width containment.

### Data Flow and State
- No API, schema, or business-logic changes.
- Preserve upload, ask, compare, loading, and error behavior.
- Responsive behavior remains presentation-only.

### Error Handling and Accessibility
- Keep existing error messaging and disabled/loading states visible at all breakpoints.
- Maintain focus order and usable tap targets.
- Ensure text remains readable on small screens.

### Verification Plan
- Validate UI at 320, 375, 768, 1024, 1280, and large desktop widths.
- Run lint and build checks to ensure no regressions.
- Confirm no unexpected horizontal scroll in standard views.

### Branch and PR Deliverables
- Create a dedicated branch for responsive work.
- Commit responsive updates only.
- Add `PR_TITLE.md` with a one-line PR title.
- Add `PR_DESCRIPTION.md` with summary, changes, and verification notes.
- Push branch to remote.
