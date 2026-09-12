import { useCallback, useEffect, useRef } from "react";
import { motion } from "motion/react";

/**
 * Dot-grid canvas background that glows where the cursor passes.
 * Placed as a fixed full-screen layer behind everything.
 */
export default function DotGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DOT_GAP = 28;
    const DOT_R = 1;
    const GLOW_RADIUS = 120;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / DOT_GAP) + 1;
      const rows = Math.ceil(height / DOT_GAP) + 1;
      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * DOT_GAP;
          const y = r * DOT_GAP;
          const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
          const proximity = Math.max(0, 1 - dist / GLOW_RADIUS);
          const base = 0.08;
          const bright = base + proximity * 0.65;

          ctx.beginPath();
          ctx.arc(x, y, DOT_R + proximity * 1.2, 0, Math.PI * 2);
          // White dots with crimson highlight near cursor
          const r_val = Math.round(255 * (0.6 + proximity * 0.4));
          const g_val = Math.round(255 * (0.15 * proximity));
          const b_val = Math.round(255 * (0.1 * proximity));
          ctx.fillStyle = `rgba(${r_val},${g_val},${b_val},${bright})`;
          ctx.fill();
        }
      }
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
