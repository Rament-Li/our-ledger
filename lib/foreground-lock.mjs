export function shouldLockLedger(event, visibilityState) {
  return event === "pagehide" || visibilityState === "hidden";
}
