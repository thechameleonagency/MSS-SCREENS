# Mahi Solar — Complete Design System

> Single source of truth for all visual design decisions, tokens, and component styling.

---

## 1. Tech Stack

| Layer | Tool |
|-------|------|
| CSS Framework | Tailwind CSS v3 |
| Component Library | shadcn/ui (Radix primitives) |
| Variant System | `class-variance-authority` (CVA) |
| Utility Merging | `tailwind-merge` + `clsx` via `cn()` |
| Animations | `tailwindcss-animate` |
| Font | Lexend (Google Fonts via `@fontsource/lexend`) |
| Icons | Lucide React (`lucide-react`) |

---

## 2. Typography

### Font Family

```css
font-family: 'Lexend', sans-serif;
```

- Loaded weights: **300** (Light), **400** (Regular), **500** (Medium), **600** (SemiBold), **700** (Bold)
- Applied globally via `body { font-lexend antialiased }`
- Tailwind class: `font-lexend`

### Font Size Scale (Tailwind defaults)

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Badges, helper text, timestamps |
| `text-sm` | 14px | Form labels, table cells, secondary text, input fields (desktop) |
| `text-base` | 16px | Body text, input fields (mobile) |
| `text-lg` | 18px | Dialog titles, section headers |
| `text-xl` | 20px | Page sub-headers |
| `text-2xl` | 24px | Card titles (`CardTitle` default) |
| `text-3xl` | 30px | Page titles |
| `text-4xl` | 36px | Dashboard hero numbers |

### Font Weight Usage

| Weight | Class | Usage |
|--------|-------|-------|
| 300 | `font-light` | Subtle labels |
| 400 | `font-normal` | Body text |
| 500 | `font-medium` | Form labels, buttons, navigation items |
| 600 | `font-semibold` | Card titles, badge text, table headers |
| 700 | `font-bold` | Page headings, emphasis |

---

## 3. Color System

All colors use **HSL format** stored as CSS custom properties. Referenced via `hsl(var(--token))` in Tailwind config.

> **RULE:** Never use raw color values (`text-white`, `bg-black`, `bg-blue-500`) in components. Always use semantic tokens.

### 3.1 Core Tokens — Light Mode (`:root`)

| Token | HSL Value | Hex Approx | Usage |
|-------|-----------|------------|-------|
| `--background` | `0 0% 96%` | `#f5f5f5` | Page background |
| `--foreground` | `220 20% 20%` | `#29303d` | Primary text |
| `--card` | `0 0% 100%` | `#ffffff` | Card backgrounds |
| `--card-foreground` | `220 20% 20%` | `#29303d` | Card text |
| `--popover` | `0 0% 100%` | `#ffffff` | Popover/dropdown background |
| `--popover-foreground` | `220 20% 20%` | `#29303d` | Popover text |
| `--primary` | `152 73% 32%` | `#168a4a` | Primary actions, brand green |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | Text on primary |
| `--secondary` | `210 20% 96%` | `#f1f3f5` | Secondary backgrounds |
| `--secondary-foreground` | `220 20% 20%` | `#29303d` | Text on secondary |
| `--muted` | `210 20% 96%` | `#f1f3f5` | Muted/disabled backgrounds |
| `--muted-foreground` | `220 10% 50%` | `#737980` | Muted/placeholder text |
| `--accent` | `152 73% 95%` | `#e6f9ef` | Accent highlights (light green) |
| `--accent-foreground` | `152 73% 32%` | `#168a4a` | Text on accent |
| `--destructive` | `0 72% 51%` | `#de3232` | Error/delete actions |
| `--destructive-foreground` | `0 0% 100%` | `#ffffff` | Text on destructive |
| `--warning` | `38 92% 50%` | `#f5a623` | Warning states |
| `--warning-foreground` | `0 0% 100%` | `#ffffff` | Text on warning |
| `--success` | `152 73% 32%` | `#168a4a` | Success states (= primary) |
| `--success-foreground` | `0 0% 100%` | `#ffffff` | Text on success |
| `--border` | `220 13% 91%` | `#e2e4e8` | All borders |
| `--input` | `220 13% 91%` | `#e2e4e8` | Input borders |
| `--ring` | `152 73% 32%` | `#168a4a` | Focus ring color |

### 3.2 Core Tokens — Dark Mode (`.dark`)

| Token | HSL Value | Hex Approx | Change from Light |
|-------|-----------|------------|-------------------|
| `--background` | `222 20% 10%` | `#151a23` | Dark slate |
| `--foreground` | `210 40% 98%` | `#f8fafc` | Near-white text |
| `--card` | `222 20% 14%` | `#1e2430` | Slightly lighter than bg |
| `--card-foreground` | `210 40% 98%` | `#f8fafc` | — |
| `--popover` | `222 20% 14%` | `#1e2430` | — |
| `--popover-foreground` | `210 40% 98%` | `#f8fafc` | — |
| `--primary` | `152 73% 40%` | `#1ba85a` | Brighter green |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | — |
| `--secondary` | `217 20% 20%` | `#29303d` | Dark secondary |
| `--secondary-foreground` | `210 40% 98%` | `#f8fafc` | — |
| `--muted` | `217 20% 20%` | `#29303d` | — |
| `--muted-foreground` | `215 20% 65%` | `#8c9bb5` | — |
| `--accent` | `152 73% 20%` | `#0e5c30` | Dark green |
| `--accent-foreground` | `152 73% 60%` | `#3dcc7a` | Bright green text |
| `--destructive` | `0 62% 40%` | `#a52a2a` | Darker red |
| `--destructive-foreground` | `210 40% 98%` | `#f8fafc` | — |
| `--border` | `217 20% 24%` | `#313a4a` | — |
| `--input` | `217 20% 24%` | `#313a4a` | — |
| `--ring` | `152 73% 40%` | `#1ba85a` | — |

### 3.3 Sidebar Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar-background` | `0 0% 100%` | `222 20% 12%` |
| `--sidebar-foreground` | `220 10% 40%` | `210 30% 70%` |
| `--sidebar-primary` | `152 73% 32%` | `152 73% 40%` |
| `--sidebar-primary-foreground` | `0 0% 100%` | `0 0% 100%` |
| `--sidebar-accent` | `152 73% 95%` | `152 73% 15%` |
| `--sidebar-accent-foreground` | `152 73% 32%` | `152 73% 60%` |
| `--sidebar-border` | `220 13% 91%` | `217 20% 24%` |
| `--sidebar-ring` | `152 73% 32%` | `152 73% 40%` |

### 3.4 Chart Tokens

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--chart-revenue` | `152 73% 32%` | Revenue bars/lines (green) |
| `--chart-cost` | `0 72% 51%` | Cost/expense bars/lines (red) |

### 3.5 Tailwind Color Map

All tokens are mapped in `tailwind.config.ts` under `theme.extend.colors`:

```
background, foreground, border, input, ring,
primary { DEFAULT, foreground },
secondary { DEFAULT, foreground },
destructive { DEFAULT, foreground },
warning { DEFAULT, foreground },
success { DEFAULT, foreground },
muted { DEFAULT, foreground },
accent { DEFAULT, foreground },
popover { DEFAULT, foreground },
card { DEFAULT, foreground },
sidebar { DEFAULT, foreground, primary, primary-foreground, accent, accent-foreground, border, ring },
chart { revenue, cost }
```

---

## 4. Spacing & Layout

### Border Radius

| Token | Value | Tailwind Class |
|-------|-------|----------------|
| `--radius` | `0.5rem` (8px) | — |
| `rounded-lg` | `var(--radius)` | `rounded-lg` |
| `rounded-md` | `calc(var(--radius) - 2px)` = 6px | `rounded-md` |
| `rounded-sm` | `calc(var(--radius) - 4px)` = 4px | `rounded-sm` |
| `rounded-full` | `9999px` | Badges, avatars |

### Container

```
max-width: 1400px (2xl breakpoint)
padding: 2rem
centered: true
```

### Breakpoints (Tailwind defaults)

| Prefix | Min Width |
|--------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1400px (custom container) |

---

## 5. Shadows

Using Tailwind defaults:

| Class | Usage |
|-------|-------|
| `shadow-sm` | Cards (`Card` component default) |
| `shadow-md` | Popovers, tooltips, dropdowns |
| `shadow-lg` | Dialogs, modals |

---

## 6. Animations

### Accordion

```css
accordion-down: height 0 → var(--radix-accordion-content-height), 0.2s ease-out
accordion-up:   height var(--radix-accordion-content-height) → 0, 0.2s ease-out
```

### Radix/shadcn Animations (via `tailwindcss-animate`)

| Animation | Used On |
|-----------|---------|
| `animate-in` / `animate-out` | Dialog, Popover, Toast, Tooltip |
| `fade-in-0` / `fade-out-0` | Overlay, content appear/disappear |
| `zoom-in-95` / `zoom-out-95` | Dialog content, Tooltip, Popover |
| `slide-in-from-top-2` | Popover/Tooltip (bottom placement) |
| `slide-in-from-bottom-2` | Popover/Tooltip (top placement) |
| `slide-in-from-left-1/2` | Dialog content |
| Duration | `200ms` (Dialog) |

---

## 7. Component Variants

### 7.1 Button (`button.tsx`)

**Base:** `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`

| Variant | Classes | Visual |
|---------|---------|--------|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` | Solid green |
| `destructive` | `bg-destructive text-destructive-foreground hover:bg-destructive/90` | Solid red |
| `outline` | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` | Bordered, green hover |
| `secondary` | `bg-secondary text-secondary-foreground hover:bg-secondary/80` | Gray fill |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` | No bg, green on hover |
| `link` | `text-primary underline-offset-4 hover:underline` | Text link |

| Size | Classes |
|------|---------|
| `default` | `h-10 px-4 py-2` |
| `sm` | `h-9 rounded-md px-3` |
| `lg` | `h-11 rounded-md px-8` |
| `icon` | `h-10 w-10` |

### 7.2 Badge (`badge.tsx`)

**Base:** `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors`

| Variant | Classes |
|---------|---------|
| `default` | `border-transparent bg-primary text-primary-foreground hover:bg-primary/80` |
| `secondary` | `border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| `destructive` | `border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80` |
| `outline` | `text-foreground` (border only) |

### 7.3 Input (`input.tsx`)

`h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`

### 7.4 Textarea (`textarea.tsx`)

`min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`

### 7.5 Card (`card.tsx`)

| Part | Classes |
|------|---------|
| `Card` | `rounded-lg border bg-card text-card-foreground shadow-sm` |
| `CardHeader` | `flex flex-col space-y-1.5 p-6` |
| `CardTitle` | `text-2xl font-semibold leading-none tracking-tight` |
| `CardDescription` | `text-sm text-muted-foreground` |
| `CardContent` | `p-6 pt-0` |
| `CardFooter` | `flex items-center p-6 pt-0` |

### 7.6 Dialog (`dialog.tsx`)

| Part | Key Classes |
|------|-------------|
| `DialogOverlay` | `fixed inset-0 z-50 bg-black/80` + fade animation |
| `DialogContent` | `fixed left-[50%] top-[50%] z-50 max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background p-6 shadow-lg sm:rounded-lg` + zoom/slide animation |
| `DialogHeader` | `flex flex-col space-y-1.5 text-center sm:text-left` |
| `DialogTitle` | `text-lg font-semibold leading-none tracking-tight` |
| `DialogDescription` | `text-sm text-muted-foreground` |
| `DialogFooter` | `flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2` |
| Close button | `absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100` |

### 7.7 Label (`label.tsx`)

`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70`

### 7.8 Tooltip (`tooltip.tsx`)

`z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md` + directional slide + zoom animation

### 7.9 Popover (`popover.tsx`)

`z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md` + directional slide + zoom animation

---

## 8. Icons

- **Library:** Lucide React (`lucide-react`)
- **Default size in buttons:** `size-4` (16px) via `[&_svg]:size-4`
- **Standalone icon size:** `h-4 w-4` (small), `h-5 w-5` (medium), `h-6 w-6` (large)
- **Dialog close icon:** `X` from lucide, `h-4 w-4`

---

## 9. Focus & Accessibility

### Focus Ring Pattern

All interactive elements use:
```
ring-offset-background
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring         → hsl(var(--ring)) = primary green
focus-visible:ring-offset-2
```

### Disabled State

```
disabled:pointer-events-none
disabled:opacity-50
disabled:cursor-not-allowed     (inputs only)
```

### Screen Reader

- Dialog close buttons include `<span className="sr-only">Close</span>`

---

## 10. Z-Index Layering

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Base content | `auto` | Page content |
| Sticky headers | `z-10` | Table headers, top bar |
| Sidebar | `z-30` | App sidebar |
| Overlays | `z-50` | Dialog overlay, Popover, Tooltip, Toast |

---

## 11. Dark Mode

- **Strategy:** Class-based (`darkMode: ["class"]` in Tailwind config)
- **Implementation:** `next-themes` library
- **Toggle:** Theme toggle in UI switches `.dark` class on `<html>`
- **Every semantic token has a dark variant** (see Section 3.2)
- **Brand green shifts from `32% lightness` → `40% lightness`** in dark mode for visibility

---

## 12. Global Styles (`index.css`)

```css
@layer base {
  * { @apply border-border; }                    /* All borders use --border token */
  body { @apply bg-background text-foreground font-lexend antialiased; }
}
```

---

## 13. Utility Function

### `cn()` — Class Name Merger

Located at `src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Combines conditional classes (`clsx`) and resolves Tailwind conflicts (`twMerge`). Used in **every** component.

---

## 14. Design Rules Summary

1. **Never use raw colors** — always semantic tokens (`bg-primary`, `text-muted-foreground`, etc.)
2. **All CSS variables are HSL** — no hex/rgb in token definitions
3. **Both light and dark values required** for every new token
4. **New colors must be added** to both `index.css` (CSS var) AND `tailwind.config.ts` (Tailwind mapping)
5. **Use `cn()` for all className merging** — never raw string concatenation
6. **Component variants use CVA** — extend with new variants, don't override base
7. **Icons at `size-4`** inside buttons, explicit sizing elsewhere
8. **`rounded-md`** for most elements, `rounded-lg` for cards, `rounded-full` for badges/avatars
9. **`shadow-sm`** for cards, `shadow-md` for floating elements, `shadow-lg` for modals
10. **Focus rings are always primary green** (`--ring` token)
