"use client";
import { useEffect, useState, useCallback, useRef } from "react";

const CODE = "claudiu";

function Confetti({ count = 80 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#ff6b6b",
      "#ffd93d",
      "#6bcb77",
      "#4d96ff",
      "#ff6eb4",
      "#a66cff",
      "#00d2d3",
      "#ff9f43",
    ];

    const pieces = Array.from({ length: count }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 20,
      vy: Math.random() * -18 - 4,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      gravity: 0.3 + Math.random() * 0.2,
      opacity: 1,
    }));

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height - 50) p.opacity -= 0.02;
        if (p.opacity <= 0) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[10000]"
    />
  );
}

export function EasterEgg() {
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (show) return;
      const next = (input + e.key).slice(-CODE.length);
      setInput(next);
      if (next === CODE) setShow(true);
    },
    [input, show],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const dismiss = () => {
    setClosing(true);
    setTimeout(() => {
      setShow(false);
      setClosing(false);
      setInput("");
    }, 400);
  };

  if (!show) return null;

  return (
    <>
      <Confetti />
      <div
        onClick={dismiss}
        className="fixed inset-0 z-[9999] flex cursor-pointer items-center justify-center"
      >
        <style jsx global>{`
          @keyframes ee-backdrop {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes ee-card-in {
            0% { opacity: 0; transform: scale(0.3) rotate(-8deg); }
            50% { transform: scale(1.05) rotate(2deg); }
            70% { transform: scale(0.97) rotate(-1deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
          }
          @keyframes ee-card-out {
            to { opacity: 0; transform: scale(0.5) rotate(8deg); }
          }
          @keyframes ee-gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes ee-wave {
            0%, 100% { transform: rotate(0deg); }
            15% { transform: rotate(14deg); }
            30% { transform: rotate(-8deg); }
            45% { transform: rotate(14deg); }
            60% { transform: rotate(-4deg); }
            75% { transform: rotate(10deg); }
          }
          @keyframes ee-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
          @keyframes ee-sparkle {
            0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
            50% { opacity: 1; transform: scale(1) rotate(180deg); }
          }
          .ee-backdrop {
            animation: ee-backdrop 0.3s ease-out forwards;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%);
          }
          .ee-backdrop.closing {
            animation: ee-backdrop 0.3s ease-in reverse forwards;
          }
          .ee-card {
            animation: ee-card-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .ee-card.closing {
            animation: ee-card-out 0.4s ease-in forwards;
          }
          .ee-title {
            background: linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #a66cff, #ff6b6b);
            background-size: 300% 300%;
            animation: ee-gradient 3s ease infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .ee-wave {
            display: inline-block;
            animation: ee-wave 1.5s ease-in-out infinite;
            transform-origin: 70% 70%;
          }
          .ee-float {
            animation: ee-float 2s ease-in-out infinite;
          }
          .ee-sparkle {
            position: absolute;
            width: 20px;
            height: 20px;
            animation: ee-sparkle 1.5s ease-in-out infinite;
          }
        `}</style>

        <div className={`ee-backdrop fixed inset-0 backdrop-blur-md ${closing ? "closing" : ""}`} />

        <div className={`ee-card ee-float relative rounded-3xl border border-white/20 bg-white/10 px-14 py-10 text-center shadow-2xl backdrop-blur-xl ${closing ? "closing" : ""}`}>
          {/* Sparkles */}
          {[
            { top: "-12px", left: "20%", delay: "0s" },
            { top: "10%", right: "-14px", delay: "0.5s" },
            { bottom: "-10px", right: "25%", delay: "1s" },
            { top: "15%", left: "-14px", delay: "0.3s" },
          ].map((pos, i) => (
            <span
              key={i}
              className="ee-sparkle"
              style={{ ...pos, animationDelay: pos.delay }}
            >
              ✦
            </span>
          ))}

          <p className="ee-title text-5xl font-extrabold tracking-tight sm:text-6xl">
            Hi Claudiu!{" "}
            <span className="ee-wave">👋</span>
          </p>
          <p className="mt-4 text-base text-white/60">
            You found the secret. Nice.
          </p>
        </div>
      </div>
    </>
  );
}
