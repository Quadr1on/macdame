# Admin UI consistency — repair the dead design-token layer

**Branch:** `feat/admin-ui-consistency` · **Base:** `master` · **Started:** 2026-07-27

## Goal

Fix the styling inconsistencies across the admin dashboard, starting from the reported
black-text-on-black-background button. Investigation showed the button is a symptom, not the
bug: **none of the shadcn design tokens are registered with Tailwind v4**, so every
`bg-primary`, `text-primary-foreground`, `bg-background`, `bg-muted`, `bg-accent`,
`border-input`, `text-muted-foreground`, `bg-popover` and `ring-ring` utility in
`components/ui/*` silently emits nothing.

Verified in the browser — a probe element carrying each class returned `DEAD` (identical to
the unstyled baseline) for all twelve tokens tested, while `bg-slate-900` and `text-white`
resolved normally:

```
bg-primary DEAD · bg-secondary DEAD · bg-accent DEAD · bg-muted DEAD
bg-background DEAD · bg-destructive DEAD · text-primary-foreground DEAD
text-muted-foreground DEAD · text-accent-foreground DEAD · text-foreground DEAD
border-input DEAD · bg-slate-900 OK · text-white OK
```

**Why:** `app/globals.css` declares the tokens as bare HSL triplets (`--primary: 240 5.9% 10%`)
in `:root` — the Tailwind **v3** shadcn convention, which needed a `tailwind.config.js` to map
them. This project is on Tailwind **v4** (`@import "tailwindcss"`, no config file), where
colours must be registered in an `@theme` block. There is no `@theme` block, so the mapping
was never made.

**The reported bug, exactly:** `<Button className="bg-slate-900">` applies a real dark
background, but its variant's `text-primary-foreground` is dead, so the label falls back to
the inherited body colour `rgb(9,9,11)` — black text on a black button.

**Two worse consequences, both in the admin:**
- `Dialog` panels use `bg-background` → the Add/Edit Collection modal renders **transparent**.
- `Select` dropdowns use `bg-popover` → the collection picker and order-status dropdown render
  **transparent**.

**Naming collision to respect.** Tailwind v4's colour namespace is `--color-*`, but the brand
palette already owns `--color-primary: #8b4513` (brown) and `--color-secondary: #d4af37` (gold),
used throughout the storefront via `var(--color-primary)`. Mapping shadcn's near-black
`--primary` onto `--color-primary` would repaint the entire storefront black. So `primary` and
`secondary` are deliberately **not** mapped; the three components that reference them are given
explicit colours instead.

**Done means:** no element in the admin renders text at a colour indistinguishable from its own
background; dialogs and dropdowns are opaque; keyboard focus is visible; and the storefront's
brown/gold palette is byte-for-byte unchanged.

## Tasks

- [ ] **T01** `fix(theme)` Register the shadcn design tokens with Tailwind v4
      files: `app/globals.css` · done when: browser probe reports a real colour (not `DEAD`) for
      `bg-background`, `bg-muted`, `bg-accent`, `bg-popover`, `bg-card`, `bg-destructive`,
      `border-input`, `text-muted-foreground`, `text-foreground`, `ring-ring` — **and**
      `getComputedStyle` still reports `--color-primary` as `#8b4513` · verify: `npm run lint` + probe

- [ ] **T02** `fix(ui)` Give Button, Badge and Input explicit colours instead of the colliding tokens
      files: `components/ui/button.jsx`, `components/ui/badge.jsx`, `components/ui/input.jsx`
      done when: a bare `<Button>` renders brand-brown background with cream text, and no variant
      depends on `bg-primary`/`text-primary-foreground`/`bg-secondary` · verify: `npm run lint` + probe

- [ ] **T03** `fix(admin)` Replace the five hand-rolled `bg-slate-900` buttons with one shared admin treatment
      files: `components/admin/ui.jsx`, `app/admin/products/page.js`,
      `app/admin/collections/CategoriesManager.jsx`, `components/admin/ProductForm.jsx`,
      `app/admin/orders/[id]/OrderStatusForm.jsx` · done when: every admin button sets its own
      foreground colour; no `bg-slate-*` without a paired `text-*` · verify: `npm run lint`

- [ ] **T04** `fix(admin)` Opaque surfaces and visible focus rings on admin dialogs, selects and inputs
      files: `components/ui/dialog.jsx`, `components/ui/select.jsx` · done when: the Collections
      modal and the order-status dropdown render on an opaque panel, and tabbing to any admin
      control shows a focus ring · verify: `npm run lint` + browser

- [ ] **T05** `docs(research)` Shiprocket vs. Macdame's cart abandonment — memo, pressure-tested by the LLM council
      files: `docs/research/shiprocket-cart-abandonment.md` · done when: the memo states what
      Shiprocket does and does not address, grounded in this repo's actual checkout code, with the
      council's dissent recorded rather than smoothed over · verify: manual read

## Rollback map

| Task | Commit | Tag | Status |
|------|--------|-----|--------|
| T01  |        |     | pending |
| T02  |        |     | pending |
| T03  |        |     | pending |
| T04  |        |     | pending |
| T05  |        |     | pending |

Revert any single task: `git revert <commit>`

## Verification note

I cannot sign into `/admin` (entering passwords is off-limits), so admin pages are verified
indirectly: the `components/ui/*` primitives are shared with reachable storefront pages, and
token resolution is verified by DOM probe. Final visual confirmation of the admin screens needs
a signed-in pass.
