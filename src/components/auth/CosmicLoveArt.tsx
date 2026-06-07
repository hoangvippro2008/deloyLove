// Tranh "tình yêu vũ trụ" tự vẽ bằng SVG (không cần ảnh ngoài) cho khung đăng nhập/đăng ký.
// Trái tim phát sáng ở giữa, hai hành tinh quấn quýt phía dưới, trăng lưỡi liềm, sao và tia lấp lánh.

const STARS = [
  { cx: 40, cy: 60, r: 1.6, o: 0.8 },
  { cx: 90, cy: 120, r: 1, o: 0.6 },
  { cx: 150, cy: 48, r: 1.3, o: 0.7 },
  { cx: 230, cy: 70, r: 1, o: 0.55 },
  { cx: 300, cy: 140, r: 1.6, o: 0.75 },
  { cx: 360, cy: 200, r: 1.1, o: 0.6 },
  { cx: 60, cy: 230, r: 1.2, o: 0.65 },
  { cx: 110, cy: 300, r: 1, o: 0.5 },
  { cx: 340, cy: 300, r: 1.4, o: 0.7 },
  { cx: 380, cy: 380, r: 1, o: 0.55 },
  { cx: 30, cy: 380, r: 1.3, o: 0.6 },
  { cx: 200, cy: 470, r: 1.1, o: 0.55 },
  { cx: 70, cy: 500, r: 1.5, o: 0.7 },
  { cx: 330, cy: 470, r: 1, o: 0.5 },
  { cx: 260, cy: 250, r: 1, o: 0.5 },
  { cx: 160, cy: 360, r: 1.2, o: 0.6 }
];

const SPARKLES = [
  { x: 96, y: 96, s: 9 },
  { x: 318, y: 232, s: 7 },
  { x: 150, y: 250, s: 6 }
];

function sparklePath(x: number, y: number, s: number) {
  return `M${x} ${y - s} C ${x + s * 0.18} ${y - s * 0.18}, ${x + s * 0.18} ${y - s * 0.18}, ${x + s} ${y} C ${x + s * 0.18} ${y + s * 0.18}, ${x + s * 0.18} ${y + s * 0.18}, ${x} ${y + s} C ${x - s * 0.18} ${y + s * 0.18}, ${x - s * 0.18} ${y + s * 0.18}, ${x - s} ${y} C ${x - s * 0.18} ${y - s * 0.18}, ${x - s * 0.18} ${y - s * 0.18}, ${x} ${y - s} Z`;
}

export function CosmicLoveArt() {
  return (
    <svg viewBox="0 0 420 580" preserveAspectRatio="xMidYMin slice" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="cla-bg" cx="50%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#3c1d52" />
          <stop offset="55%" stopColor="#1d1442" />
          <stop offset="100%" stopColor="#0b0a22" />
        </radialGradient>
        <radialGradient id="cla-orbA" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffe1ef" />
          <stop offset="55%" stopColor="#ff8ac4" />
          <stop offset="100%" stopColor="#bf5594" />
        </radialGradient>
        <radialGradient id="cla-orbB" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#e4dbff" />
          <stop offset="55%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6a4cbe" />
        </radialGradient>
        <linearGradient id="cla-heart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc2dc" />
          <stop offset="100%" stopColor="#ff5ea8" />
        </linearGradient>
        <filter id="cla-glow" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="420" height="580" fill="url(#cla-bg)" />

      {/* quầng sáng dịu */}
      <ellipse cx="210" cy="150" rx="260" ry="150" fill="#ff5ea8" opacity="0.13" />
      <ellipse cx="120" cy="430" rx="220" ry="160" fill="#8b5cf6" opacity="0.14" />

      {/* sao */}
      {STARS.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#fff" opacity={s.o} />
      ))}

      {/* trăng lưỡi liềm */}
      <g filter="url(#cla-glow)">
        <circle cx="350" cy="92" r="22" fill="#fff1d6" opacity="0.92" />
        <circle cx="361" cy="84" r="20" fill="url(#cla-bg)" />
      </g>

      {/* trái tim phát sáng ở giữa */}
      <g filter="url(#cla-glow)" transform="translate(140 96) scale(1.4)">
        <path
          d="M50 86 C 18 58, 0 40, 0 24 C 0 10, 12 0, 26 0 C 36 0, 44 6, 50 16 C 56 6, 64 0, 74 0 C 88 0, 100 10, 100 24 C 100 40, 82 58, 50 86 Z"
          fill="url(#cla-heart)"
        />
      </g>

      {/* quỹ đạo nối hai hành tinh */}
      <path
        d="M150 392 Q210 332 270 392"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.3"
        strokeWidth="1.4"
        strokeDasharray="2 7"
        strokeLinecap="round"
      />
      {/* hai hành tinh quấn quýt */}
      <circle cx="150" cy="392" r="34" fill="url(#cla-orbA)" filter="url(#cla-glow)" />
      <circle cx="270" cy="392" r="29" fill="url(#cla-orbB)" filter="url(#cla-glow)" />

      {/* tia lấp lánh */}
      {SPARKLES.map((p, i) => (
        <path key={i} d={sparklePath(p.x, p.y, p.s)} fill="#fff6fb" opacity="0.9" />
      ))}
    </svg>
  );
}
