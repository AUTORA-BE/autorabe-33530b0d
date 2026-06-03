import { forwardRef } from "react";

/**
 * Honeypot field — invisible to real users, irresistible to naive bots.
 *
 * Usage (uncontrolled):
 *   const honeypotRef = useRef<HTMLInputElement>(null);
 *   <Honeypot ref={honeypotRef} />
 *   if (isHoneypotTriggered(honeypotRef.current)) { ...fake success... return; }
 *
 * The field is:
 *  - visually hidden (off-screen, zero opacity, no pointer/tab interaction)
 *  - hidden from assistive tech via aria-hidden + tabIndex={-1}
 *  - labeled with a plausible name (`website_confirm`) and autoComplete="off"
 */
export const Honeypot = forwardRef<HTMLInputElement, { name?: string }>(
  ({ name = "website_confirm" }, ref) => (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "auto",
        width: 1,
        height: 1,
        overflow: "hidden",
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      <label htmlFor={name}>Ne pas remplir</label>
      <input
        ref={ref}
        type="text"
        id={name}
        name={name}
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  ),
);
Honeypot.displayName = "Honeypot";

export function isHoneypotTriggered(el: HTMLInputElement | null | undefined): boolean {
  if (!el) return false;
  return el.value.trim().length > 0;
}
