"use client";

import { useEffect, useState, type CSSProperties } from "react";

// Lớp nền vũ trụ ĐẦY ĐỦ, mount 1 lần ở root layout (fixed, phủ toàn màn hình, sau nội dung).
// CHỈ render ở client (mounted-gate) để tránh lệch hydration do tiện ích trình duyệt chèn/sửa
// phần tử đầu tiên của <body>. Nền galaxy nền do body::before (CSS) lo nên vẫn hiện ngay lập tức.

type FallStyle = CSSProperties & {
  "--fall-left": string;
  "--fall-delay": string;
  "--fall-duration": string;
  "--fall-size": string;
  "--fall-drift": string;
  "--fall-opacity": string;
};

// Hạt rơi xuống ("rơi rơi") — sao lấp lánh rơi nhẹ, có đuôi sáng
const fallingParticles = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  delay: `${-((index * 0.83) % 13).toFixed(2)}s`,
  duration: `${8 + (index % 7) * 1.5}s`,
  size: `${10 + (index % 6) * 3}px`,
  drift: `${index % 2 === 0 ? "" : "-"}${16 + (index % 6) * 8}px`,
  opacity: `${(0.55 + (index % 4) * 0.1).toFixed(2)}`
}));

const getFallStyle = (particle: (typeof fallingParticles)[number]): FallStyle => ({
  "--fall-left": particle.left,
  "--fall-delay": particle.delay,
  "--fall-duration": particle.duration,
  "--fall-size": particle.size,
  "--fall-drift": particle.drift,
  "--fall-opacity": particle.opacity
});

// 10 vệt rải lệch pha (delay cách 0.9s < thời gian hiện ~2s) => luôn có sao băng đang bay
const shootingStars = Array.from({ length: 10 }, (_, index) => ({
  top: `${4 + ((index * 17) % 56)}%`,
  left: `${10 + ((index * 29) % 78)}%`,
  animationDelay: `${-(index * 0.9).toFixed(2)}s`,
  animationDuration: `${(4 + (index % 3)).toFixed(0)}s`
}));

const hearts = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  left: `${6 + ((index * 23) % 86)}%`,
  fontSize: `${14 + (index % 4) * 5}px`,
  animationDelay: `${-(index * 1.6).toFixed(1)}s`,
  animationDuration: `${11 + (index % 5) * 1.5}s`
}));

const sparkles = Array.from({ length: 30 }, (_, index) => ({
  id: index,
  top: `${(index * 53 + 4) % 96}%`,
  left: `${(index * 37 + 9) % 96}%`,
  size: `${3 + (index % 3) * 2}px`,
  animationDelay: `${-((index * 0.7) % 5).toFixed(2)}s`,
  animationDuration: `${(2.6 + (index % 4) * 0.8).toFixed(1)}s`
}));

export function CosmicBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ render nền ở client, tránh lệch hydration (extension/SSR)
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="cosmic-bg" aria-hidden="true">
      <div className="cosmic-aurora" />
      <div className="cosmic-stars" />

      <span className="cosmic-orbit-glow left-[6%] top-[14%] h-44 w-44 bg-[#ff5ea8]/15" />
      <span
        className="cosmic-orbit-glow bottom-[14%] right-[8%] h-56 w-56 bg-[#67e8f9]/12"
        style={{ animationDelay: "-8s" }}
      />
      <span
        className="cosmic-orbit-glow left-[46%] top-[58%] h-40 w-40 bg-[#8b5cf6]/12"
        style={{ animationDelay: "-14s" }}
      />

      <div className="cosmic-fall-layer">
        {fallingParticles.map((particle) => (
          <span key={`fall-${particle.id}`} className="cosmic-fall" style={getFallStyle(particle)} />
        ))}
      </div>

      {sparkles.map((sparkle) => (
        <span
          key={`sparkle-${sparkle.id}`}
          className="cosmic-sparkle"
          style={{
            top: sparkle.top,
            left: sparkle.left,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: sparkle.animationDelay,
            animationDuration: sparkle.animationDuration
          }}
        />
      ))}

      {shootingStars.map((star, index) => (
        <span
          key={`shooting-${index}`}
          className="cosmic-shooting-star"
          style={{
            top: star.top,
            left: star.left,
            animationDelay: star.animationDelay,
            animationDuration: star.animationDuration
          }}
        />
      ))}

      {hearts.map((heart) => (
        <span
          key={`heart-${heart.id}`}
          className="cosmic-heart"
          style={{
            left: heart.left,
            fontSize: heart.fontSize,
            animationDelay: heart.animationDelay,
            animationDuration: heart.animationDuration
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}
