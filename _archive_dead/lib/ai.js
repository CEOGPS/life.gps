// @/lib/ai — compatibility shim
// Routes invokeLLM({ prompt, systemPrompt }) to ceogpsclient
import { invokeLLM as _invoke } from "@/api/ceogpsclient.jsx";

/**
 * Accepts both call patterns:
 *   invokeLLM("prompt string")
 *   invokeLLM({ prompt, systemPrompt, model })
 */
export async function invokeLLM(arg) {
  if (typeof arg === "string") {
    return _invoke({ prompt: arg });
  }
  return _invoke(arg);
}

export default invokeLLM;
