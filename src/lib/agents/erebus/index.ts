// ─── Erebus — Public API ──────────────────────────────────────────────────

// Types
export * from "./types";

// Core Engine
export { InitiationEngine } from "./initiation/InitiationEngine";
export { TriggerRegistry } from "./initiation/TriggerRegistry";
export { PersonalityFilter } from "./initiation/PersonalityFilter";
export { EmotionManager } from "./initiation/EmotionManager";

// UI Components
export { ErebusPresence } from "./ui/ErebusPresence";

// Hooks
export { useErebus } from "./hooks/useErebus";

// Utils
export { storageGet, storageSet, storageRemove, storageClear } from "./utils/storage";

// Default export for convenience
import { InitiationEngine } from "./initiation/InitiationEngine";
export default InitiationEngine;