/**
 * Global and reusable utilities for robust numeric input handling throughout the application.
 * 
 * Ensures:
 * 1. Clicking or focusing ANY numeric input automatically highlights / selects all text,
 *    allowing immediate, effortless replacement (e.g. replacing '100' with '24' on first keystroke).
 * 2. Typing, backspacing, and clearing numbers does not prematurely force unwanted '0' or '1' digits.
 * 3. Mouse up / click events do not accidentally clear selection on initial focus.
 */

let isInitialized = false;

export function initNumericInputEnhancements(): void {
  if (typeof document === "undefined" || isInitialized) return;
  isInitialized = true;

  // Track the element that just received focus via mouse/pointer
  let lastFocusedByPointer: HTMLInputElement | null = null;
  let focusTimestamp = 0;

  // Global focus listener (captures both tab-navigation and pointer focus)
  document.addEventListener(
    "focusin",
    (e: FocusEvent) => {
      const target = e.target;
      if (isNumericInput(target)) {
        lastFocusedByPointer = target;
        focusTimestamp = Date.now();

        // Use requestAnimationFrame so selection executes AFTER browser mouseup/click defaults
        requestAnimationFrame(() => {
          if (document.activeElement === target) {
            try {
              target.select();
            } catch {
              // Graceful fallback if browser restricts selection on certain input types
            }
          }
        });
      }
    },
    true
  );

  // When clicking into an input, browser mouseup can sometimes deselect the text.
  // This ensures selection is maintained on initial focus click without interfering with intentional drag-selection.
  document.addEventListener(
    "mouseup",
    (e: MouseEvent) => {
      const target = e.target;
      if (isNumericInput(target) && target === lastFocusedByPointer) {
        const timeSinceFocus = Date.now() - focusTimestamp;
        // If mouseup occurred within 300ms of focus, ensure text is selected
        if (timeSinceFocus < 300) {
          requestAnimationFrame(() => {
            if (document.activeElement === target && target.selectionStart === target.selectionEnd) {
              try {
                target.select();
              } catch {
                // Ignore
              }
            }
          });
        }
      }
    },
    true
  );
}

/**
 * Checks whether an HTML element is a numeric input field.
 */
export function isNumericInput(el: unknown): el is HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) return false;

  if (el.type === "number") return true;
  if (el.inputMode === "numeric" || el.inputMode === "decimal") return true;
  if (el.dataset.numeric === "true") return true;

  const nameOrClass = `${el.name} ${el.className} ${el.placeholder} ${el.id}`.toLowerCase();
  if (
    /price|cost|qty|quantity|amount|rate|markup|shipping|discount|margin|fee|hours|minutes|copies|stock|instore|office|deposit/i.test(
      nameOrClass
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Standard onFocus handler that can be explicitly attached to any input.
 */
export function handleNumericFocus(e: React.FocusEvent<HTMLInputElement>): void {
  const target = e.currentTarget;
  requestAnimationFrame(() => {
    if (document.activeElement === target) {
      try {
        target.select();
      } catch {
        // Fallback
      }
    }
  });
}
