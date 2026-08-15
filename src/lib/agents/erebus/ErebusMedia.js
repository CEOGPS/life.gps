// ErebusMedia.js — Direct-API media generation for Erebus
// Image (Stability AI / HF FLUX / Pollinations), Music (Replicate / HF MusicGen),
// Speech (ElevenLabs / WebSpeech), Video (Luma / Replicate), Avatar (D-ID)

const env = (k) =>
  (typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env[k]
    : "") || "";

const KEY = {
  stability: () => env("VITE_STABILITY_AI_API_KEY"),
  elevenlabs: () => env("VITE_ELEVENLABS_API_KEY"),
  replicate: () => env("VITE_REPLICATE_API_KEY"),
  luma: () => env("VITE_LUMA_API_KEY"),
  did: () => env("VITE_DID_API_KEY"),
  hf: () => env("VITE_HUGGINGFACE_API_KEY"),
};

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Poll a URL until the doneTest callback returns non-null (or throws on failure)
async function poll(url, headers, doneTest, maxMs = 180000, intervalMs = 4000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    await delay(intervalMs);
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`Poll error: ${r.status}`);
    const data = await r.json();
    const result = doneTest(data);
    if (result !== null && result !== undefined) return result;
  }
  throw new Error(
    "Generation timed out after " + Math.round(maxMs / 1000) + "s",
  );
}

// POST to Replicate /v1/models/{owner}/{name}/predictions, poll until done
async function replicateRun(owner, name, input, maxMs = 180000) {
  const key = KEY.replicate();
  if (!key) throw new Error("VITE_REPLICATE_API_KEY not set");
  const hdrs = {
    Authorization: `Token ${key}`,
    "Content-Type": "application/json",
    Prefer: "wait",
  };
  const r = await fetch(
    `https://api.replicate.com/v1/models/${owner}/${name}/predictions`,
    {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify({ input }),
    },
  );
  if (!r.ok) throw new Error(`Replicate error: ${r.status} ${await r.text()}`);
  let pred = await r.json();
  if (pred.status === "succeeded") return pred.output;
  if (pred.status === "failed")
    throw new Error(`Replicate: ${pred.error || "failed"}`);
  // Poll
  return poll(
    pred.urls.get,
    { Authorization: `Token ${key}` },
    (d) => {
      if (d.status === "succeeded") return d.output;
      if (d.status === "failed")
        throw new Error(`Replicate: ${d.error || "failed"}`);
      return null;
    },
    maxMs,
  );
}

// ── Image Generation ──────────────────────────────────────────────────────────
export async function generateImage(prompt, options = {}) {
  const { width = 1024, height = 1024 } = options;

  // 1. Stability AI SD3 Core
  const stabKey = KEY.stability();
  if (stabKey) {
    try {
      const form = new FormData();
      form.append("prompt", prompt);
      form.append("output_format", "webp");
      const ar = width === height ? "1:1" : width > height ? "16:9" : "9:16";
      form.append("aspect_ratio", ar);
      const r = await fetch(
        "https://api.stability.ai/v2beta/stable-image/generate/core",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${stabKey}`, Accept: "image/*" },
          body: form,
        },
      );
      if (r.ok) {
        const blob = await r.blob();
        return {
          url: URL.createObjectURL(blob),
          source: "Stability AI SD3",
          prompt,
        };
      }
    } catch {
      /* fall through */
    }
  }

  // 2. Replicate FLUX Pro
  if (KEY.replicate()) {
    try {
      const out = await replicateRun("black-forest-labs", "flux-schnell", {
        prompt,
        num_outputs: 1,
      });
      const url = Array.isArray(out) ? out[0] : out;
      if (url) return { url, source: "FLUX Schnell (Replicate)", prompt };
    } catch {
      /* fall through */
    }
  }

  // 3. HuggingFace FLUX.1-schnell (free tier)
  const hfKey = KEY.hf();
  if (hfKey) {
    try {
      const r = await fetch(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: prompt }),
          signal: AbortSignal.timeout(60000),
        },
      );
      if (r.ok) {
        const blob = await r.blob();
        return {
          url: URL.createObjectURL(blob),
          source: "HuggingFace FLUX",
          prompt,
        };
      }
    } catch {
      /* fall through */
    }
  }

  // 4. Pollinations.ai (always works, no key)
  const polUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 99999)}`;
  return { url: polUrl, source: "Pollinations.ai (free)", prompt };
}

// ── Image Editing ─────────────────────────────────────────────────────────────
export async function editImage(imageUrl, editDescription) {
  const stabKey = KEY.stability();
  if (stabKey) {
    try {
      const imgRes = await fetch(imageUrl);
      const imgBlob = await imgRes.blob();
      const form = new FormData();
      form.append("image", imgBlob, "image.webp");
      form.append("prompt", editDescription);
      form.append("output_format", "webp");
      const r = await fetch(
        "https://api.stability.ai/v2beta/stable-image/edit/inpaint",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${stabKey}`, Accept: "image/*" },
          body: form,
        },
      );
      if (r.ok) {
        const blob = await r.blob();
        return {
          url: URL.createObjectURL(blob),
          source: "Stability AI Edit",
          prompt: editDescription,
          original: imageUrl,
        };
      }
    } catch {
      /* fall through */
    }
  }
  // Fallback: regenerate with edit description
  return generateImage(editDescription);
}

// ── Music / Audio Generation ──────────────────────────────────────────────────
export async function generateMusic(prompt, options = {}) {
  const { duration = 60 } = options;

  // 1. Replicate stable-audio-open
  if (KEY.replicate()) {
    try {
      const out = await replicateRun(
        "stability-ai",
        "stable-audio-open",
        {
          prompt,
          seconds_total: Math.min(duration, 90),
          seconds_start: 0,
        },
        300000,
      );
      const url =
        typeof out === "string" ? out : Array.isArray(out) ? out[0] : null;
      if (url) return { url, source: "Stable Audio (Replicate)", prompt };
    } catch {
      /* fall through */
    }
  }

  // 2. Replicate MusicGen Large
  if (KEY.replicate()) {
    try {
      const out = await replicateRun(
        "meta",
        "musicgen",
        {
          prompt,
          duration: Math.min(duration, 60),
          model_version: "large",
          output_format: "mp3",
          normalization_strategy: "peak",
        },
        300000,
      );
      const url = typeof out === "string" ? out : null;
      if (url) return { url, source: "MusicGen Large (Replicate)", prompt };
    } catch {
      /* fall through */
    }
  }

  // 3. HuggingFace MusicGen
  const hfKey = KEY.hf();
  if (hfKey) {
    try {
      const r = await fetch(
        "https://api-inference.huggingface.co/models/facebook/musicgen-large",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { duration: Math.min(duration, 30) },
          }),
          signal: AbortSignal.timeout(120000),
        },
      );
      if (r.ok) {
        const blob = await r.blob();
        return {
          url: URL.createObjectURL(blob),
          source: "MusicGen (HuggingFace)",
          prompt,
        };
      }
    } catch {
      /* fall through */
    }
  }

  throw new Error("No music generation available. Add VITE_REPLICATE_API_KEY.");
}

// ── Text-to-Speech ────────────────────────────────────────────────────────────
const EL_VOICES = {
  default: "21m00Tcm4TlvDq8ikWAM", // Rachel — warm female
  male: "IKne3meq5aSn9XLyUdCD", // Charlie
  british: "N2lVS1w4EtoT3dr4eOWO", // Callum
};

export async function generateSpeech(text, options = {}) {
  const { voiceKey = "default" } = options;
  const voiceId = EL_VOICES[voiceKey] || EL_VOICES.default;

  // 1. ElevenLabs
  const elKey = KEY.elevenlabs();
  if (elKey) {
    try {
      const r = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": elKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.85,
              style: 0.2,
              use_speaker_boost: true,
            },
          }),
        },
      );
      if (r.ok) {
        const blob = await r.blob();
        return { url: URL.createObjectURL(blob), source: "ElevenLabs", text };
      }
    } catch {
      /* fall through */
    }
  }

  // 2. Browser WebSpeech (no URL returned, plays immediately)
  if (typeof window !== "undefined" && window.speechSynthesis) {
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1.0;
    window.speechSynthesis.speak(utt);
    return { url: null, source: "WebSpeech", text, spoken: true };
  }

  throw new Error("No TTS available. Add VITE_ELEVENLABS_API_KEY.");
}

// ── Video Generation ──────────────────────────────────────────────────────────
export async function generateVideo(prompt, options = {}) {
  const { aspectRatio = "16:9" } = options;

  // 1. Luma Dream Machine
  const lumaKey = KEY.luma();
  if (lumaKey) {
    try {
      const r = await fetch(
        "https://api.lumalabs.ai/dream-machine/v1/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lumaKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            aspect_ratio: aspectRatio,
            loop: false,
          }),
        },
      );
      if (r.ok) {
        const gen = await r.json();
        const videoUrl = await poll(
          `https://api.lumalabs.ai/dream-machine/v1/generations/${gen.id}`,
          { Authorization: `Bearer ${lumaKey}` },
          (d) => {
            if (d.state === "completed") return d.assets?.video;
            if (d.state === "failed")
              throw new Error(`Luma: ${d.failure_reason || "failed"}`);
            return null;
          },
          300000,
          6000,
        );
        return { url: videoUrl, source: "Luma Dream Machine", prompt };
      }
    } catch {
      /* fall through */
    }
  }

  // 2. Replicate zeroscope-v2-xl
  if (KEY.replicate()) {
    try {
      const out = await replicateRun(
        "anotherjesse",
        "zeroscope-v2-xl",
        {
          prompt,
          num_frames: 24,
          fps: 8,
          num_inference_steps: 40,
        },
        300000,
      );
      const url = Array.isArray(out) ? out[0] : out;
      if (url) return { url, source: "Zeroscope (Replicate)", prompt };
    } catch {
      /* fall through */
    }
  }

  throw new Error(
    "No video generation available. Add VITE_LUMA_API_KEY or VITE_REPLICATE_API_KEY.",
  );
}

// ── Image-to-Video ────────────────────────────────────────────────────────────
export async function imageToVideo(
  imageUrl,
  motionPrompt = "smooth cinematic motion",
  options = {},
) {
  const lumaKey = KEY.luma();
  if (lumaKey) {
    try {
      const r = await fetch(
        "https://api.lumalabs.ai/dream-machine/v1/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lumaKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: motionPrompt,
            keyframes: { frame0: { type: "image", url: imageUrl } },
          }),
        },
      );
      if (r.ok) {
        const gen = await r.json();
        const videoUrl = await poll(
          `https://api.lumalabs.ai/dream-machine/v1/generations/${gen.id}`,
          { Authorization: `Bearer ${lumaKey}` },
          (d) => {
            if (d.state === "completed") return d.assets?.video;
            if (d.state === "failed")
              throw new Error(`Luma: ${d.failure_reason || "failed"}`);
            return null;
          },
          300000,
          6000,
        );
        return {
          url: videoUrl,
          source: "Luma Image-to-Video",
          imageUrl,
          prompt: motionPrompt,
        };
      }
    } catch {
      /* fall through */
    }
  }

  // Replicate stable-video-diffusion
  if (KEY.replicate()) {
    try {
      const out = await replicateRun(
        "stability-ai",
        "stable-video-diffusion",
        {
          input_image: imageUrl,
          video_length: "25_frames_with_svd_xt",
          sizing_strategy: "maintain_aspect_ratio",
          frames_per_second: 6,
          decoding_t: 4,
        },
        300000,
      );
      const url = Array.isArray(out) ? out[0] : out;
      if (url)
        return { url, source: "Stable Video Diffusion (Replicate)", imageUrl };
    } catch {
      /* fall through */
    }
  }

  throw new Error("No image-to-video API. Add VITE_LUMA_API_KEY.");
}

// ── Talking Avatar (D-ID) ─────────────────────────────────────────────────────
// Public D-ID demo avatar — users can customize via settings
const DEFAULT_AVATAR = "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg";

export async function generateAvatar(script, options = {}) {
  const {
    sourceUrl = DEFAULT_AVATAR,
    voiceId = "en-US-JennyNeural",
    provider = "microsoft",
  } = options;

  const didKey = KEY.did();
  if (!didKey) throw new Error("VITE_DID_API_KEY not set in .env.local");

  const r = await fetch("https://api.d-id.com/talks", {
    method: "POST",
    headers: {
      Authorization: `Basic ${didKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      source_url: sourceUrl,
      script: {
        type: "text",
        input: script,
        provider: { type: provider, voice_id: voiceId },
      },
      config: { fluent: true, pad_audio: 0.0 },
    }),
  });

  if (!r.ok) {
    const msg = await r.text();
    throw new Error(`D-ID ${r.status}: ${msg}`);
  }
  const talk = await r.json();

  const videoUrl = await poll(
    `https://api.d-id.com/talks/${talk.id}`,
    { Authorization: `Basic ${btoa(didKey)}` },
    (d) => {
      if (d.status === "done") return d.result_url;
      if (d.status === "error")
        throw new Error(`D-ID: ${d.error?.description || "failed"}`);
      return null;
    },
    120000,
    3000,
  );

  return { url: videoUrl, source: "D-ID Avatar", talkId: talk.id, script };
}
