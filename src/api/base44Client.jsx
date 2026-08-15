// LifeOS1 — all AI and storage functions live in ceogpsclient.jsx
// This file is kept so old imports don't break — it just re-exports from the real client
export {
  ceogps,
  invokeLLM,
  getApiKey,
  saveApiKey,
  deleteApiKey,
  loadAllSettings,
  saveOAuthTokens,
  getOAuthTokens,
  isOAuthConnected,
  createDIDTalk,
  getDIDTalkResult,
} from "./ceogpsclient.jsx";
