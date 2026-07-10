// Pro dark-launch switch, mirroring the backend's Features:ProEnabled.
// While false, no Pro UI (pricing, upgrade buttons, locked badges) renders
// anywhere — flip both flags together on launch day.
export const PRO_ENABLED = process.env.NEXT_PUBLIC_PRO_ENABLED === "true";
