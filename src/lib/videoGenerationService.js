/**
 * Video Generation Service - Dynamic Quality Cascading
 * Tries Node (FFmpeg) → Worker (FFmpeg) → Client-side (Canvas)
 */

export async function generateVideo(images, options = {}) {
  const {
    duration = 3, // seconds per image
    transition = "fade", // fade, zoom, slide
    fps = 24,
    textOverlay = null,
    title = "Generated Video",
    onProgress = () => {},
  } = options;

  onProgress({ status: "Checking capabilities...", percent: 5 });

  // Check what's available
  const nodeAvailable = await checkNodeBackend();
  const workerAvailable = await checkWorkerBackend();

  try {
    if (nodeAvailable) {
      onProgress({
        status: "Using Node + FFmpeg (highest quality)...",
        percent: 15,
      });
      return await generateViaNode(
        images,
        { duration, transition, fps, textOverlay, title },
        onProgress,
      );
    } else if (workerAvailable) {
      onProgress({
        status: "Using Worker + FFmpeg (good quality)...",
        percent: 15,
      });
      return await generateViaWorker(
        images,
        { duration, transition, fps, textOverlay, title },
        onProgress,
      );
    } else {
      onProgress({ status: "Using Canvas (basic quality)...", percent: 15 });
      return await generateViaCanvas(
        images,
        { duration, transition, fps, textOverlay, title },
        onProgress,
      );
    }
  } catch (err) {
    console.error("Primary backend failed:", err);

    // Try fallback
    if (nodeAvailable && !workerAvailable) {
      try {
        onProgress({ status: "Falling back to Worker...", percent: 15 });
        return await generateViaWorker(
          images,
          { duration, transition, fps, textOverlay, title },
          onProgress,
        );
      } catch (err2) {
        console.error("Worker fallback failed:", err2);
      }
    }

    // Last resort - Canvas
    onProgress({ status: "Falling back to Canvas...", percent: 15 });
    return await generateViaCanvas(
      images,
      { duration, transition, fps, textOverlay, title },
      onProgress,
    );
  }
}

// ── Backend Detection ────────────────────────────────────────────────────
async function checkNodeBackend() {
  try {
    const res = await fetch("http://localhost:8100/health", {
      method: "HEAD",
      timeout: 2000,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkWorkerBackend() {
  try {
    const res = await fetch("/api/video/health", { timeout: 2000 });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Node Backend (FFmpeg) ────────────────────────────────────────────────
async function generateViaNode(images, options, onProgress) {
  onProgress({ status: "Preparing images...", percent: 20 });

  const payload = {
    images: images.map((img) => ({
      url: img.url || img.data,
      name: img.name,
    })),
    duration: options.duration,
    transition: options.transition,
    fps: options.fps,
    textOverlay: options.textOverlay,
    title: options.title,
  };

  onProgress({ status: "Sending to Node backend...", percent: 30 });

  const res = await fetch("http://localhost:8100/video/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Node backend error: ${res.statusText}`);

  const reader = res.body.getReader();
  let receivedLength = 0;
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    receivedLength += value.length;
    onProgress({
      status: "Generating video...",
      percent: Math.min(80, 30 + (receivedLength / 1024 / 1024) * 50),
    });
  }

  onProgress({ status: "Finalizing...", percent: 90 });

  const blob = new Blob(chunks, { type: "video/mp4" });
  return {
    blob,
    backend: "Node + FFmpeg",
    quality: "high",
    size: blob.size,
  };
}

// ── Worker Backend (FFmpeg) ──────────────────────────────────────────────
async function generateViaWorker(images, options, onProgress) {
  onProgress({ status: "Preparing images...", percent: 20 });

  const formData = new FormData();
  formData.append("duration", options.duration);
  formData.append("transition", options.transition);
  formData.append("fps", options.fps);
  if (options.textOverlay) {
    formData.append("textOverlay", JSON.stringify(options.textOverlay));
  }
  formData.append("title", options.title);

  // Add images
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (img.file) {
      formData.append(`image_${i}`, img.file);
    } else if (img.url) {
      const blob = await fetch(img.url).then((r) => r.blob());
      formData.append(`image_${i}`, blob, img.name || `image_${i}.jpg`);
    }
  }

  onProgress({ status: "Sending to Worker...", percent: 30 });

  const res = await fetch("/api/video/generate", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(`Worker error: ${res.statusText}`);

  onProgress({ status: "Generating video...", percent: 75 });

  const blob = await res.blob();
  onProgress({ status: "Finalizing...", percent: 90 });

  return {
    blob,
    backend: "Worker + FFmpeg",
    quality: "good",
    size: blob.size,
  };
}

// ── Canvas Fallback (Client-side) ───────────────────────────────────────
async function generateViaCanvas(images, options, onProgress) {
  onProgress({ status: "Loading images...", percent: 20 });

  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");

  const stream = canvas.captureStream(options.fps);
  const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  const chunks = [];

  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve({
        blob,
        backend: "Canvas + MediaRecorder",
        quality: "basic",
        size: blob.size,
      });
    };

    mediaRecorder.onerror = reject;

    onProgress({ status: "Recording frames...", percent: 30 });

    let frameCount = 0;
    const totalFrames = Math.ceil(
      options.duration * images.length * options.fps,
    );
    let currentImageIdx = 0;
    let frameInImage = 0;
    const framesPerImage = options.duration * options.fps;

    const drawFrame = () => {
      if (currentImageIdx >= images.length) {
        mediaRecorder.stop();
        return;
      }

      const img = images[currentImageIdx];
      const imgEl = new Image();
      imgEl.crossOrigin = "anonymous";
      imgEl.onload = () => {
        // Draw with transition
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (options.transition === "fade") {
          const progress = frameInImage / framesPerImage;
          ctx.globalAlpha = progress;
        } else if (options.transition === "zoom") {
          const scale = 1 + (frameInImage / framesPerImage) * 0.1;
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(scale, scale);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }

        ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        ctx.restore();

        // Text overlay
        if (options.textOverlay) {
          ctx.fillStyle = "white";
          ctx.font = "48px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            options.textOverlay,
            canvas.width / 2,
            canvas.height / 2,
          );
        }

        frameCount++;
        frameInImage++;

        if (frameInImage >= framesPerImage) {
          currentImageIdx++;
          frameInImage = 0;
        }

        onProgress({
          status: "Recording frames...",
          percent: 30 + (frameCount / totalFrames) * 60,
        });
        requestAnimationFrame(drawFrame);
      };
      imgEl.src = img.url || img.data;
    };

    mediaRecorder.start();
    drawFrame();
  });
}
