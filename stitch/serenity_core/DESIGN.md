# Design System Strategy: The Serene Mediator

## 1. Overview & Creative North Star
The "Serene Mediator" is the creative North Star of this design system. In the high-friction world of co-parenting, the interface must act as a neutral ground—a digital "quiet room." 

This system rejects the frantic, boxy density of traditional productivity apps. Instead, it adopts a **High-End Editorial** approach, characterized by expansive white space, intentional asymmetry, and a focus on "Breathable Depth." By moving away from rigid grids and heavy borders, we create a sanctuary that de-escalates conflict through visual stillness and authoritative, yet gentle, typography.

## 2. Color & Surface Architecture
We move beyond flat hex codes to a system of **Tonal Layering**. The goal is to make the interface feel like a series of soft, physical surfaces rather than a digital screen.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off content. Boundaries must be defined solely through background color shifts or subtle tonal transitions. 
*   Use `surface-container-low` for secondary sections.
*   Use `surface-container-lowest` (#FFFFFF) for primary content cards.
*   This creates a "paper-on-slate" effect that is sophisticated and calming.

### The Glass & Gradient Rule
To prevent the UI from feeling sterile, use "Environmental Gradients." 
*   **CTAs:** Use a subtle linear gradient from `primary` (#00464a) to `primary-container` (#006064) at a 135-degree angle. This adds "soul" and a tactile, premium quality to buttons.
*   **Floating Elements:** For top navigation headers or overlays, apply a `surface` color with 80% opacity and a `backdrop-filter: blur(12px)`. This allows background content to bleed through softly, maintaining a sense of spatial awareness.

### Palette Roles
*   **Primary (The Authority):** `primary` (#00464a) for high-importance actions and focused states.
*   **Secondary (The Support):** `secondary` (#546067) for utilitarian elements and neutral iconography.
*   **Tertiary (The Resolution):** `tertiary` (#004914) for positive financial tallies and custody resolutions.
*   **Surface Tiers:**
    *   `surface`: #f7f9fc (App background)
    *   `surface-container-low`: #f2f4f7 (Section backgrounds)
    *   `surface-container-lowest`: #ffffff (Main interaction cards)

## 3. Typography: The Editorial Voice
Our type system pairs the architectural strength of **Manrope** for displays with the functional clarity of **Inter** for utility.

*   **Display & Headlines (Manrope):** High-contrast scales (e.g., `display-lg` at 3.5rem) should be used with generous leading. This creates an editorial "magazine" feel that feels premium and curated.
*   **Body & Labels (Inter):** Restricted to **Regular (400)** and **Medium (500)** weights only. Bold weights are avoided to prevent the UI from feeling "shouty" or aggressive.
*   **Hierarchy as Tone:** Titles (`title-lg`) should use `on-surface` (#191c1e) to command respect, while helper text uses `on-secondary-container` (#5a666d) to provide a soft, non-intrusive guide.

## 4. Elevation & Depth
We define hierarchy through **Tonal Stacking** rather than drop shadows.

*   **The Layering Principle:** Depth is achieved by placing a `surface-container-lowest` (#FFFFFF) card on top of a `surface-container-low` (#f2f4f7) background. This creates a natural "lift" without visual noise.
*   **Ambient Shadows:** Where floating action is required, shadows must be "Invisible." Use a blur of `32px` or higher with an opacity of `4%` using a tint of the `on-surface` color.
*   **The Ghost Border:** If a form requires a boundary, use a "Ghost Border"—the `outline-variant` token at **15% opacity**. This provides just enough affordance for a touch target without cluttering the visual field.

## 5. Signature Components

### Primary Action Buttons
*   **Style:** `primary` gradient fill, `xl` (1.5rem) corner radius.
*   **Interaction:** On press, the gradient shifts slightly deeper. No heavy shadows.
*   **Spacing:** Minimum 16px horizontal padding to maintain the "Editorial" breathability.

### Content Cards
*   **Rule:** Forbid the use of divider lines.
*   **Structure:** Separate logical groups within a card using `body-sm` labels and 24px of vertical whitespace. 
*   **Radius:** Standardized at `DEFAULT` (0.5rem/8px) to feel professional but approachable.

### Input Fields
*   **Style:** `surface-container-lowest` fill with a "Ghost Border."
*   **Focus State:** The border transitions to 1.5px solid `primary` (#00464a).
*   **Feedback:** Error states use `orange-soft` (#FF7043) text—never bright red—to alert the user without triggering an anxiety response.

### Navigation (Bottom Bar)
*   **Design:** A "Floating Island" approach. Instead of a docked bar, use a `surface` container with a `backdrop-blur` and a `full` (9999px) or `xl` (1.5rem) radius, floating 16px from the bottom of the screen. This makes the PWA feel like a modern, high-end native application.

## 6. Do’s and Don’ts

### Do
*   **DO** use whitespace as a functional tool to separate "Parent A" and "Parent B" perspectives.
*   **DO** use `tertiary` (Green) and `secondary-fixed` (Muted Blue-Gray) for financial data to keep the tone "Business-Neutral."
*   **DO** ensure all touch targets are at least 44px, even if the visual element (like a text link) is smaller.

### Don’t
*   **DON'T** use 100% black text. Always use `on-surface` (#191c1e) to reduce eye strain and visual aggression.
*   **DON'T** use traditional "Alert Red." For blocks or warnings, use `Orange Soft` (#FF7043). We are de-escalating, not alarming.
*   **DON'T** use sharp 0px corners. Every element should have at least a `sm` radius to maintain a "calming" tactile language.