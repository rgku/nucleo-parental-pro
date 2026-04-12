# Design System Specification: Professional Calm & Tonal Depth

## 1. Overview & Creative North Star: "The Digital Sanctuary"

This design system is engineered to move beyond the "utilitarian dashboard" and into the realm of a high-end, editorial sanctuary. For **Núcleo Parental Pro**, the interface must serve as a grounding force—professional, authoritative, yet deeply calming.

**The Creative North Star: The Digital Sanctuary**
We reject the rigid, "boxed-in" layout of traditional SaaS templates. Instead, we embrace **Organic Structuralism**. The UI should feel like a curated physical space where hierarchy is defined by light and layering rather than lines and dividers. We utilize intentional asymmetry in layout and a dramatic typography scale to create an experience that feels custom-built and premium.

---

## 2. Color Strategy & Tonal Architecture

In this system, color is not just decoration; it is the primary tool for spatial navigation.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to section off content. 
Boundaries must be defined exclusively through background shifts. For example, a `surface_container_low` card sitting on a `surface` background creates a natural edge. This "No-Line" approach creates an immersive, high-end feel that reduces visual noise and cognitive load.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the tier system to "lift" or "recede" content:
- **Base Layer:** `surface` (#0e0e0e)
- **Primary Content Blocks:** `surface_container` (#1a1a1a)
- **Interactive/Raised Elements:** `surface_container_high` (#20201f)
- **Deep Insets (Search bars/Inputs):** `surface_container_lowest` (#000000)

### The "Glass & Gradient" Rule
To inject "soul" into the dark mode experience:
- **CTAs & Heroes:** Use a subtle linear gradient (Top-Left to Bottom-Right) transitioning from `primary` (#7fe6db) to `primary_container` (#47b0a7). 
- **Floating Navigation:** Apply **Glassmorphism**. Use `surface_variant` at 60% opacity with a `20px` backdrop-blur. This allows the background colors to bleed through softly, grounding the element in the environment.

---

## 3. Typography: Editorial Authority

We use **Manrope** for its technical precision and humanist warmth. The hierarchy is designed to be "Top-Heavy," using large display styles to create focal points.

- **Display (lg/md/sm):** Used for high-impact landing moments or dashboard overviews. Use `on_surface` with a slightly tighter letter-spacing (-0.02em) to feel premium.
- **Headline (lg/md):** The primary voice. These should have ample breathing room (leading) to maintain a calming rhythm.
- **Body (lg/md):** Optimized for readability. Use `on_surface_variant` (#adaaaa) for secondary body text to reduce "text-glare" in dark mode.
- **Labels:** Always in `label-md` or `label-sm`. Use uppercase with 0.05em tracking for a "curated" look in metadata.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are often a sign of "template" design. We achieve depth through light logic.

### The Layering Principle
Instead of a shadow, place a `surface_container_highest` element on a `surface_dim` background. The 4% shift in lightness is enough for the human eye to perceive a change in plane without the "muddiness" of a dark shadow.

### Ambient Shadows
When a floating effect is mandatory (e.g., a Modal or Popover):
- **Blur:** 40px – 60px (Ultra-diffused).
- **Opacity:** 4% - 8%.
- **Tint:** Instead of black, use a shadow color derived from `surface_tint` (#7fe6db) at ultra-low opacity to mimic the "glow" of a screen.

### The Ghost Border Fallback
If accessibility requires a container edge, use a **Ghost Border**:
- **Token:** `outline_variant` (#484847) at **15% opacity**.
- This creates a suggestion of a border that only appears upon closer inspection, maintaining the "No-Line" aesthetic.

---

## 5. Components

### Buttons: The Signature Touch
- **Primary:** Gradient fill (`primary` to `primary_container`). 8px corner radius. Text color: `on_primary` (#00534d).
- **Secondary:** No fill. `Ghost Border` (15% opacity `outline_variant`). On hover, transition background to `surface_container_high`.
- **Tertiary:** Text only in `primary`. Use for low-priority actions to avoid visual clutter.

### Input Fields: The "Inset" Look
- **Default State:** `surface_container_lowest` background. No border.
- **Focus State:** 1px `primary` border with a subtle `primary_dim` outer glow (4px blur).
- **Labeling:** Always use `label-md` floating above the field, never inside.

### Cards & Lists: Pure Space
- **Rule:** Forbid divider lines. 
- **Execution:** Separate list items using 12px of vertical white space. For cards, use the `DEFAULT` (8px) or `lg` (16px) corner radius. Use a shift from `surface_container_low` to `surface_container` on hover to indicate interactivity.

### Status Chips (Traffic Light Logic)
Optimized for dark mode to prevent "neon-eye-strain":
- **Success:** `tertiary` (#43beff) — *Note: Utilizing the cool-blue/teal spectrum for a more professional calm.*
- **Warning:** A desaturated Amber (Manual adjustment of primary-fixed palette).
- **Error:** `error_dim` (#d7383b) on a `on_error_container` background.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace Negative Space:** If you think there is enough padding, add 8px more. Space is the luxury of this system.
- **Use Tonal Stepping:** Always check contrast ratios between `surface_container` tiers to ensure the "No-Line" rule remains accessible.
- **Asymmetric Balance:** Align large headlines to the left while keeping secondary data points anchored to the right to break the "grid" feel.

### Don’t:
- **Don’t use Pure White (#FFFFFF) for body text:** It vibrates against the deep slate background. Use `on_surface` (#E0E0E0 equivalent).
- **Don’t use 100% opaque borders:** They shatter the "Digital Sanctuary" immersion.
- **Don’t use heavy drop shadows:** They feel dated. Let the background color shifts do the heavy lifting.