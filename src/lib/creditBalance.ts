export const CREDITS_CHANGED_EVENT = "repomind:credits-changed";

export function announceCreditsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CREDITS_CHANGED_EVENT));
  }
}
