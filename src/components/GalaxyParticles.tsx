"use client";

// Poeira estelar do modo cinema — adaptação do motor de partículas de
// referência, reescrita para o contexto em que vai rodar.
//
// O original é um N-body O(n²): cada partícula calcula distância para
// TODAS as outras, com 500 delas — 250 mil contas por frame, mais jQuery.
// No desktop de quem escreveu, lindo; na webview do Facebook num Android
// mediano — onde 84% do nosso tráfego assiste ao vídeo — isso rouba
// exatamente a CPU que o vídeo precisa.
//
// O que ficou do original:
//   - a paleta (branco, azul, amarelo-pálido, e o vermelho-brasa raro);
//   - o brilho em camadas concêntricas de alpha decrescente, pré-rendido
//     UMA vez por cor num sprite offscreen (a ideia do offscreenCache);
//   - a gravidade central que faz a poeira orbitar e afundar (o Force).
//
// O que saiu: interação partícula-partícula, colisões/novas e o fundo
// preto chapado — aqui o céu é o gradiente que já existe atrás.

import { useEffect, useRef } from "react";

const COLORS = ["255,255,255", "0,150,255", "255,255,128", "255,64,32"] as const;

interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  sprite: number;
  scale: number;
  alpha: number;
  tw: number;
}

export default function GalaxyParticles() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // Quem pediu menos movimento não ganha um enxame de partículas.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // DPR limitado a 1.5: acima disso o custo de fill quadruplica e o
    // ganho visual em poeira desfocada é nenhum.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      // Canvas é elemento "replaced": sem width/height explícitos no CSS,
      // inset-0 NÃO o estica — ele fica no tamanho do bitmap, e a poeira
      // inteira desaba para o canto superior esquerdo. Foi exatamente o
      // defeito visto em produção quando estas duas linhas saíram.
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      // Centro de gravidade um pouco acima do meio — atrás do vídeo.
      cy = h * 0.42;
    };
    resize();
    window.addEventListener("resize", resize);

    // Sprites: os círculos concêntricos do motor original ("fills"),
    // desenhados uma única vez por cor. Por frame, só drawImage.
    const SPRITE = 64;
    const sprites = COLORS.map((c) => {
      const b = document.createElement("canvas");
      b.width = SPRITE;
      b.height = SPRITE;
      const bc = b.getContext("2d")!;
      for (const l of [
        { r: 2, a: 1 },
        { r: 4, a: 0.4 },
        { r: 8, a: 0.18 },
        { r: 16, a: 0.07 },
        { r: 30, a: 0.025 },
      ]) {
        bc.fillStyle = `rgba(${c},${l.a})`;
        bc.beginPath();
        bc.arc(SPRITE / 2, SPRITE / 2, l.r, 0, Math.PI * 2);
        bc.fill();
      }
      return b;
    });

    const COUNT = w < 768 ? 42 : 80;
    const dust: Dust[] = [];
    const spawn = (d?: Dust): Dust => {
      const ang = Math.random() * Math.PI * 2;
      const rad = 90 + Math.random() * Math.max(w, h) * 0.5;
      const speed = 0.14 + Math.random() * 0.2;
      const p: Dust = d ?? ({} as Dust);
      p.x = cx + Math.cos(ang) * rad;
      p.y = cy + Math.sin(ang) * rad * 0.7;
      // Velocidade tangencial: orbita em vez de cair reto no centro.
      p.vx = -Math.sin(ang) * speed;
      p.vy = Math.cos(ang) * speed * 0.7;
      // Vermelho-brasa é raro, como no original (~1 em 10).
      p.sprite = Math.random() < 0.08 ? 3 : Math.floor(Math.random() * 3);
      p.scale = 0.5 + Math.random() * 0.9;
      p.alpha = 0.25 + Math.random() * 0.5;
      p.tw = Math.random() * Math.PI * 2;
      return p;
    };
    for (let i = 0; i < COUNT; i++) dust.push(spawn());

    let raf = 0;
    let running = true;
    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of dust) {
        const dx = cx - p.x;
        const dy = cy - p.y;
        const d2 = dx * dx + dy * dy;
        // A gravidade central do motor original, com teto para ninguém
        // sair chicoteado ao passar perto demais.
        const g = Math.min(90 / d2, 0.02);
        p.vx += dx * g;
        p.vy += dy * g;
        p.x += p.vx;
        p.y += p.vy;
        p.tw += 0.04;
        // Afundou no centro ou fugiu da tela → renasce na borda.
        if (d2 < 26 * 26 || p.x < -80 || p.x > w + 80 || p.y < -80 || p.y > h + 80) {
          spawn(p);
        }
        ctx.globalAlpha = p.alpha * (0.65 + 0.35 * Math.sin(p.tw));
        const s = SPRITE * p.scale;
        ctx.drawImage(sprites[p.sprite], p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // Aba escondida → para tudo. O vídeo e a bateria agradecem.
    const onVis = () => {
      running = document.visibilityState === "visible";
      if (running) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    />
  );
}
