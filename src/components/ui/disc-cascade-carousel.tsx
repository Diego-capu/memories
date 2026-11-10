import * as React from 'react';

/**
 * Disc Cascade Carousel (adapted from @kedhareswer/disc-cascade-carousel)
 * Tilt-Cascade physics engine rendering printed 3D CD discs along a gentle arc
 * with dual-spring drag/swipe/step transitions and polycarbonate center hubs.
 */

export type DiscCredit = {
  label: string;
  value: string | string[];
};

export type DiscReview = {
  source: string;
  quote: string;
  stars?: number;
};

export type DiscPattern =
  | 'sunburst'
  | 'rings'
  | 'halftone'
  | 'horizon'
  | 'stripes'
  | 'eclipse'
  | 'mosaic';

export type DiscCascadeItem = {
  title: string;
  credits?: DiscCredit[];
  reviews?: DiscReview[];
  src?: string;
  alt?: string;
  pattern?: DiscPattern;
  palette?: [string, string, string];
  label?: string;
  labelStyle?: 'arc' | 'block';
  ink?: string;
  fine?: string;
};

export type DiscNavLink = { label: string; href?: string };

export type DiscCascadeCarouselProps = {
  items: DiscCascadeItem[];
  height?: string;
  discSize?: string;
  spacing?: number;
  rise?: number;
  depth?: number;
  yaw?: number;
  fan?: number;
  tilt?: number;
  roll?: number;
  spin?: number;
  isSpinning?: boolean;
  sheen?: number;
  bounce?: number;
  duration?: number;
  loop?: boolean;
  background?: string;
  color?: string;
  sans?: string;
  display?: string;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  onSelect?: (item: DiscCascadeItem, index: number) => void;
  ariaLabel?: string;
  className?: string;
};

type PoseConfig = {
  n: number;
  loop: boolean;
  spacing: number;
  rise: number;
  depth: number;
  yaw: number;
  fan: number;
  tilt: number;
  roll: number;
  bounce: number;
  duration: number;
};

type DragState = {
  id: number;
  x0: number;
  pos0: number;
  moved: boolean;
  samples: { t: number; x: number }[];
};

type EngineState = {
  a: number;
  va: number;
  b: number;
  vb: number;
  target: number;
  raf: number;
  last: number;
  size: number;
  reduced: boolean;
  drag: DragState | null;
  clickBlock: boolean;
  wheel: number;
  wheelAt: number;
  stepAt: number;
};

function wrapIndex(i: number, n: number): number {
  if (n <= 0) return 0;
  return ((i % n) + n) % n;
}

function indexAt(pos: number, n: number, loop: boolean): number {
  if (n <= 0) return 0;
  const i = Math.round(pos);
  return loop ? wrapIndex(i, n) : Math.min(Math.max(i, 0), n - 1);
}

function offsetOf(i: number, pos: number, n: number, loop: boolean): number {
  const d = i - pos;
  return loop && n > 0 ? d - n * Math.round(d / n) : d;
}

function rubber(pos: number, n: number): number {
  if (pos < 0) return pos / 3;
  if (pos > n - 1) return n - 1 + (pos - (n - 1)) / 3;
  return pos;
}

function springOf(bounce: number, duration: number): { omega: number; slide: number; tilt: number } {
  const b = Math.min(Math.max(bounce, 0), 0.9);
  return { omega: (2 * Math.PI) / Math.max(duration, 0.1), slide: 1 - b / 2, tilt: 1 - b };
}

function springStep(
  x: number,
  v: number,
  target: number,
  omega: number,
  zeta: number,
  dt: number,
): number[] {
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / steps;
  for (let k = 0; k < steps; k++) {
    v += (-omega * omega * (x - target) - 2 * zeta * omega * v) * h;
    x += v * h;
  }
  return [x, v];
}

function releaseTarget(pos: number, velocity: number, n: number, loop: boolean): number {
  const here = Math.round(pos);
  let t = Math.round(pos + velocity * 0.2);
  t = Math.min(Math.max(t, here - 3), here + 3);
  return loop ? t : Math.min(Math.max(t, 0), n - 1);
}

function targetFor(i: number, target: number, n: number, loop: boolean): number {
  if (!loop) return Math.min(Math.max(i, 0), n - 1);
  const here = Math.round(target);
  let d = i - wrapIndex(here, n);
  d -= n * Math.round(d / n);
  return here + d;
}

function computeSlideStyle(i: number, a: number, b: number, c: PoseConfig) {
  const dx = offsetOf(i, a, c.n, c.loop);
  const d = offsetOf(i, b, c.n, c.loop);
  const near = Math.min(d, 2.2);
  const absD = Math.abs(d);
  const x = dx * c.spacing;
  const y = -dx * c.rise;
  const z = near * c.depth;
  const yaw = c.yaw + d * c.fan;
  const roll = d * c.roll;
  const zIndex = 100 + Math.round((2 - absD) * 10);
  const opacity = absD > 1.35 ? Math.max(0, 1 - (absD - 1.35) / 0.85) : 1;
  const hidden = dx < -2.6 || dx > 2.6 || opacity <= 0.02;

  return {
    transform:
      'translate3d(calc(' +
      x.toFixed(4) +
      ' * var(--dcc-s)), calc(' +
      y.toFixed(4) +
      ' * var(--dcc-s)), calc(' +
      z.toFixed(4) +
      ' * var(--dcc-s))) rotateZ(' +
      c.tilt +
      'deg) rotateY(' +
      yaw.toFixed(3) +
      'deg) rotateX(8deg)',
    roll: roll.toFixed(2) + 'deg',
    glint: (yaw * 3 + x * 40).toFixed(1) + 'deg',
    zIndex,
    opacity,
    hidden,
  };
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inkFor(bg: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(bg.trim());
  if (!m) return '#ffffff';
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  const lin = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4);
  return L > 0.36 ? '#0f172a' : '#ffffff';
}

function wrapLabel(text: string, max: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.trim().split(/\s+/)) {
    if (!w) continue;
    if (cur && (cur + ' ' + w).length > max) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function fitSize(chars: number, room: number, max: number): number {
  return Math.max(7, Math.min(max, room / (Math.max(chars, 1) * 0.58)));
}

function textWidth(chars: number, fs: number): number {
  return Math.max(chars, 1) * fs * 0.56;
}

const PATTERNS: DiscPattern[] = [
  'horizon',
  'mosaic',
  'eclipse',
  'sunburst',
  'halftone',
  'rings',
  'stripes',
];

const PALETTES: [string, string, string][] = [
  ['#7dd3fc', '#0284c7', '#fef08a'],
  ['#fbcfe8', '#9d174d', '#bae6fd'],
  ['#1e293b', '#334155', '#38bdf8'],
  ['#bae6fd', '#0369a1', '#f8fafc'],
  ['#e2e8f0', '#1e293b', '#38bdf8'],
];

const CSS =
  '.dcc-root{position:relative;overflow:hidden;width:100%;container-type:inline-size;' +
  'color:inherit;user-select:none;-webkit-user-select:none;touch-action:pan-y;' +
  'outline:none;-webkit-tap-highlight-color:transparent;--dcc-pad:clamp(10px,2.4cqw,20px)}' +
  '.dcc-root[data-dragging],.dcc-root[data-dragging] .dcc-slide{cursor:grabbing}' +
  '.dcc-stage{position:absolute;left:50%;top:50%;width:var(--dcc-s);aspect-ratio:1/1;' +
  'transform:translate(-50%,-50%);perspective:calc(var(--dcc-s) * 3.4)}' +
  '.dcc-slide{position:absolute;inset:0;margin:0;padding:0;border:0;background:none;color:inherit;font:inherit;' +
  'border-radius:50%;cursor:pointer;will-change:transform;transform-style:preserve-3d;' +
  '-webkit-tap-highlight-color:transparent;outline:none}' +
  '.dcc-tilt{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .45s cubic-bezier(.2,.7,.2,1)}' +
  '.dcc-slide[data-active] .dcc-tilt{transform:translateZ(var(--dcc-lift,0px)) ' +
  'rotateX(calc(var(--dcc-py,0) * -10deg)) rotateY(calc(var(--dcc-px,0) * 10deg))}' +
  '.dcc-slide[data-active]:hover{--dcc-lift:calc(var(--dcc-s) * .05)}' +
  '.dcc-shade{position:absolute;inset:0;border-radius:50%;pointer-events:none;' +
  'transform:translate3d(0,8%,-14px) scale(.97);' +
  'background:radial-gradient(circle closest-side,transparent 28%,rgba(2,132,199,.18) 54%,rgba(15,23,42,.18) 82%,transparent 100%)}' +
  '.dcc-edge,.dcc-disc{position:absolute;inset:0;border-radius:50%;' +
  '-webkit-mask:radial-gradient(circle closest-side,transparent 16.6%,#000 17.1%);' +
  'mask:radial-gradient(circle closest-side,transparent 16.6%,#000 17.1%)}' +
  '.dcc-edge{transform:translateZ(-3px);background:linear-gradient(160deg,#e2e8f0,#94a3b8 55%,#cbd5e1)}' +
  '.dcc-disc{overflow:hidden;background:#cbd5e1;' +
  'box-shadow:inset 0 0 0 1px rgba(255,255,255,.38),inset 0 0 0 2px rgba(0,0,0,.08)}' +
  '.dcc-roll,.dcc-idle{position:absolute;inset:0;border-radius:50%}' +
  '.dcc-roll{transform:rotate(var(--dcc-roll,0deg))}' +
  '.dcc-root[data-spin] .dcc-idle{animation:dcc-spin var(--dcc-spin) linear infinite;animation-play-state:paused}' +
  '.dcc-root[data-spin][data-playing] .dcc-slide[data-active] .dcc-idle{animation-play-state:running}' +
  '.dcc-root[data-dragging] .dcc-slide .dcc-idle{animation-play-state:paused}' +
  '@keyframes dcc-spin{to{transform:rotate(1turn)}}' +
  '.dcc-idle>img{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block;object-fit:cover}' +
  '.dcc-idle>svg,.dcc-hub{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block;overflow:visible}' +
  '.dcc-hub{pointer-events:none}' +
  '.dcc-sheen{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:screen;opacity:var(--dcc-sheen);' +
  'background:conic-gradient(from calc(var(--dcc-glint,0deg) + var(--dcc-px,0) * 70deg),' +
  'transparent 0deg,rgba(255,255,255,.55) 16deg,transparent 38deg,transparent 140deg,' +
  'rgba(125,211,252,.36) 168deg,rgba(244,180,225,.3) 186deg,rgba(255,236,170,.28) 200deg,transparent 224deg,transparent 360deg),' +
  'radial-gradient(circle at 32% 24%,rgba(255,255,255,.34),transparent 46%)}' +
  '.dcc-slide:focus-visible .dcc-disc{box-shadow:inset 0 0 0 3px #ffffff,inset 0 0 0 5px #0284c7}' +
  '.dcc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +
  '@media (prefers-reduced-motion:reduce){.dcc-root .dcc-idle{animation:none}.dcc-tilt{transition:none}}';

const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

function wedge(a0: number, a1: number, r: number) {
  const p = (a: number) =>
    (100 + r * Math.cos(a)).toFixed(2) + ' ' + (100 + r * Math.sin(a)).toFixed(2);
  return 'M100 100L' + p(a0) + 'A' + r + ' ' + r + ' 0 0 1 ' + p(a1) + 'Z';
}

function Art({
  pattern,
  pal,
  seed,
  uid,
}: {
  pattern: DiscPattern;
  pal: [string, string, string];
  seed: number;
  uid: string;
}) {
  const [bg, fg, ac] = pal;
  const r = rng(seed * 9973 + 17);
  const out: React.ReactNode[] = [<rect key="bg" width="200" height="200" fill={bg} />];

  if (pattern === 'sunburst') {
    const k = 28;
    for (let i = 0; i < k; i += 2) {
      out.push(
        <path
          key={'w' + i}
          d={wedge((i / k) * Math.PI * 2, ((i + 1) / k) * Math.PI * 2, 142)}
          fill={fg}
        />,
      );
    }
    out.push(<circle key="c" cx="100" cy="100" r="44" fill={ac} />);
    out.push(
      <circle
        key="c2"
        cx="100"
        cy="100"
        r="40.5"
        fill="none"
        stroke={bg}
        strokeWidth="1.6"
        strokeDasharray="2 3.5"
      />,
    );
  } else if (pattern === 'rings') {
    for (let rr = 100, i = 0; rr > 36; rr -= 8, i++) {
      out.push(
        <circle
          key={'r' + i}
          cx="100"
          cy="100"
          r={rr}
          fill={i % 3 === 2 ? ac : i % 2 ? bg : fg}
        />,
      );
    }
  } else if (pattern === 'halftone') {
    const fx = 50 + r() * 100;
    const fy = 30 + r() * 60;
    for (let y = 4; y < 200; y += 10) {
      for (let x = 4 + ((y / 10) % 2) * 5; x < 200; x += 10) {
        const dist = Math.hypot(x - fx, y - fy);
        const rad = Math.max(0, 4.2 - dist / 34);
        if (rad > 0.35) {
          out.push(<circle key={x + '-' + y} cx={x} cy={y} r={rad.toFixed(2)} fill={fg} />);
        }
      }
    }
    out.push(<circle key="s" cx={fx} cy={fy} r="16" fill={ac} />);
  } else if (pattern === 'horizon') {
    out.push(
      <linearGradient key="g" id={uid + 'sky'} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={bg} />
        <stop offset=".68" stopColor={ac} />
      </linearGradient>,
      <rect key="sky" width="200" height="200" fill={'url(#' + uid + 'sky)'} />,
      <circle key="sun" cx="100" cy="118" r="24" fill="#ffffff" opacity=".7" />,
      <path
        key="wave1"
        d="M0 132 Q50 118 100 132 T200 132 L200 200 L0 200 Z"
        fill={fg}
        opacity=".85"
      />,
      <path
        key="wave2"
        d="M0 148 Q60 136 120 148 T200 145 L200 200 L0 200 Z"
        fill={bg}
        opacity=".5"
      />,
    );
  } else if (pattern === 'stripes') {
    const g: React.ReactNode[] = [];
    for (let i = -10; i < 20; i++) {
      g.push(
        <rect key={'s' + i} x={i * 14} y="-60" width="7" height="320" fill={i % 4 === 0 ? ac : fg} />,
      );
    }
    out.push(
      <g key="g" transform={'rotate(' + (20 + r() * 40).toFixed(1) + ' 100 100)'}>
        {g}
      </g>,
    );
  } else if (pattern === 'eclipse') {
    for (let j = 0; j < 48; j++) {
      out.push(
        <circle
          key={'st' + j}
          cx={(r() * 200).toFixed(1)}
          cy={(r() * 200).toFixed(1)}
          r={(0.8 + r() * 1.1).toFixed(2)}
          fill={fg}
          opacity={(0.25 + r() * 0.55).toFixed(2)}
        />,
      );
    }
    out.push(
      <circle key="halo" cx="100" cy="100" r="78" fill="none" stroke={ac} strokeWidth="1.2" opacity=".7" />,
      <circle key="moon" cx="100" cy="100" r="64" fill={fg} opacity=".85" />,
      <circle key="bite" cx="118" cy="88" r="58" fill={bg} />,
      <circle
        key="ring"
        cx="100"
        cy="100"
        r="64"
        fill="none"
        stroke={ac}
        strokeWidth="1.6"
        strokeDasharray="2 3.5"
      />,
    );
  } else {
    const cols = [bg, fg, ac];
    for (let y = 0; y < 200; y += 25) {
      for (let x = 0; x < 200; x += 25) {
        const c = cols[Math.floor(r() * 3)];
        const kind = r();
        out.push(<rect key={'q' + x + '-' + y} x={x} y={y} width="25" height="25" fill={c} />);
        if (kind > 0.65) {
          out.push(
            <circle
              key={'o' + x + '-' + y}
              cx={x + 12.5}
              cy={y + 12.5}
              r="8"
              fill={cols[(cols.indexOf(c) + 1) % 3]}
            />,
          );
        }
      }
    }
  }
  return <>{out}</>;
}

function Print({
  item,
  i,
  uid,
  ink,
  halo,
}: {
  item: DiscCascadeItem;
  i: number;
  uid: string;
  ink: string;
  halo: string;
}) {
  const label = (item.label ?? item.title).toUpperCase();
  const fine = (item.fine ?? '').toUpperCase();
  const ring = (w: number) => ({
    stroke: halo,
    strokeWidth: item.src ? w * 0.45 : w,
    strokeLinejoin: 'round' as const,
    paintOrder: 'stroke' as const,
  });
  const stroke = ring(2.5);
  const small = ring(1.2);
  let headline: React.ReactNode = null;

  if (label && (item.labelStyle ?? 'arc') === 'arc') {
    const fs = fitSize(label.length, 210 * 0.84, 20);
    headline = (
      <text
        fill={ink}
        fontSize={fs.toFixed(2)}
        fontWeight="700"
        textAnchor="middle"
        textLength={textWidth(label.length, fs).toFixed(1)}
        lengthAdjust="spacingAndGlyphs"
        {...stroke}
      >
        <textPath href={'#' + uid + 'top'} startOffset="50%">
          {label}
        </textPath>
      </text>
    );
  } else if (label) {
    const ls = wrapLabel(label, 11).slice(0, 3);
    const fs = Math.min(
      fitSize(Math.max(...ls.map((l) => l.length)), 112, 19),
      32 / (ls.length * 0.98),
    );
    const lh = fs * 0.98;
    const y0 = 58 - (ls.length - 1) * lh;
    headline = (
      <g fill={ink} fontSize={fs.toFixed(2)} fontWeight="700" {...stroke}>
        {ls.map((l, k) => {
          const y = y0 + k * lh;
          const room = 2 * Math.sqrt(Math.max(0, 86 * 86 - (100 - y + fs * 0.35) ** 2));
          return (
            <text
              key={k}
              x="100"
              y={y.toFixed(2)}
              textAnchor="middle"
              textLength={Math.min(textWidth(l.length, fs), room).toFixed(1)}
              lengthAdjust="spacingAndGlyphs"
            >
              {l}
            </text>
          );
        })}
      </g>
    );
  }

  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" style={{ maxWidth: 'none' }}>
      <defs>
        <path id={uid + 'top'} d="M28 100a72 72 0 1 1 144 0" />
        <path id={uid + 'bot'} d="M16 100a84 84 0 0 0 168 0" />
      </defs>
      {headline}
      {fine ? (
        <text
          fill={ink}
          fontSize="6"
          letterSpacing=".7"
          textAnchor="middle"
          opacity=".85"
          {...small}
        >
          <textPath href={'#' + uid + 'bot'} startOffset="50%">
            {fine}
          </textPath>
        </text>
      ) : null}
      <text
        x="100"
        y="64"
        fill={ink}
        fontSize="5.5"
        letterSpacing="1.1"
        textAnchor="middle"
        opacity=".65"
        transform="rotate(180 100 100)"
      >
        {'TRACK ' + pad(i + 1)}
      </text>
    </svg>
  );
}

function Hub({ uid }: { uid: string }) {
  return (
    <svg className="dcc-hub" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <linearGradient id={uid + 'metal'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbfbfc" />
          <stop offset=".45" stopColor="#a9adb3" />
          <stop offset=".55" stopColor="#eef0f2" />
          <stop offset="1" stopColor="#8f949a" />
        </linearGradient>
      </defs>
      <circle
        cx="100"
        cy="100"
        r="35.5"
        fill="none"
        stroke={'url(#' + uid + 'metal)'}
        strokeWidth="4"
      />
      <circle
        cx="100"
        cy="100"
        r="25.5"
        fill="rgba(232,235,239,.85)"
        stroke="rgba(232,235,239,.85)"
        strokeWidth="16"
      />
      <circle cx="100" cy="100" r="17.6" fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="1.4" />
      <circle cx="100" cy="100" r="22" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth=".6" />
      <circle cx="100" cy="100" r="27" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.6" />
      <circle cx="100" cy="100" r="28.6" fill="none" stroke="rgba(0,0,0,.1)" strokeWidth=".6" />
      <circle cx="100" cy="100" r="33.3" fill="none" stroke="rgba(0,0,0,.16)" strokeWidth=".7" />
      <circle cx="100" cy="100" r="99.3" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="1.2" />
    </svg>
  );
}

export default function DiscCascadeCarousel({
  items,
  height = '180px',
  discSize = '126px',
  spacing = 0.86,
  rise = 0.08,
  depth = 0.36,
  yaw = 14,
  fan = -10,
  tilt = -4,
  roll = 95,
  spin = 18,
  isSpinning = true,
  sheen = 0.65,
  bounce = 0.24,
  duration = 0.85,
  loop = true,
  background = 'transparent',
  color,
  sans = '"HelvetiHand", ui-sans-serif, system-ui, sans-serif',
  display = '"HelvetiHand", ui-sans-serif, system-ui, sans-serif',
  index,
  defaultIndex = 0,
  onIndexChange,
  onSelect,
  ariaLabel = 'Carrusel de canciones',
  className = '',
}: DiscCascadeCarouselProps) {
  const n = items.length;
  const start = Math.min(Math.max(Math.round(index ?? defaultIndex), 0), Math.max(n - 1, 0));
  const [active, setActive] = React.useState(start);
  const [dragging, setDragging] = React.useState(false);

  const uid = 'dcc' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const slideRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const engineRef = React.useRef<EngineState | null>(null);
  const getEngine = React.useCallback((): EngineState => {
    if (!engineRef.current) {
      engineRef.current = {
        a: start,
        va: 0,
        b: start,
        vb: 0,
        target: start,
        raf: 0,
        last: 0,
        size: 140,
        reduced: false,
        drag: null,
        clickBlock: false,
        wheel: 0,
        wheelAt: 0,
        stepAt: 0,
      };
    }
    return engineRef.current;
  }, [start]);

  const poseCfg: PoseConfig = React.useMemo(
    () => ({ n, loop, spacing, rise, depth, yaw, fan, tilt, roll, bounce, duration }),
    [n, loop, spacing, rise, depth, yaw, fan, tilt, roll, bounce, duration],
  );

  const cfgRef = React.useRef<PoseConfig>(poseCfg);
  const cbRef = React.useRef({ onIndexChange, active });

  React.useEffect(() => {
    cfgRef.current = poseCfg;
  }, [poseCfg]);

  React.useEffect(() => {
    cbRef.current = { onIndexChange, active };
  }, [onIndexChange, active]);

  const paint = React.useCallback(() => {
    const E = getEngine();
    const c = cfgRef.current;
    for (let i = 0; i < slideRefs.current.length; i++) {
      const el = slideRefs.current[i];
      if (!el) continue;
      const t = computeSlideStyle(i, E.a, E.b, c);
      el.style.transform = t.transform;
      el.style.zIndex = '' + t.zIndex;
      el.style.opacity = t.opacity < 1 ? t.opacity.toFixed(3) : '';
      el.style.visibility = t.hidden ? 'hidden' : '';
      el.style.setProperty('--dcc-roll', t.roll);
      el.style.setProperty('--dcc-glint', t.glint);
    }
  }, [getEngine]);

  const kick = React.useCallback(() => {
    const E = getEngine();
    if (E.raf) return;

    function stepFrame(now: number) {
      const dt = Math.min((now - (E.last || now)) / 1000, 1 / 20);
      E.last = now;
      const c = cfgRef.current;
      const s = springOf(c.bounce, c.duration);
      if (E.reduced && !E.drag) {
        E.a = E.b = E.target;
        E.va = E.vb = 0;
      } else {
        if (!E.drag) [E.a, E.va] = springStep(E.a, E.va, E.target, s.omega, s.slide, dt);
        [E.b, E.vb] = springStep(E.b, E.vb, E.a, s.omega * 1.05, s.tilt, dt);
      }
      paint();
      const settled =
        !E.drag &&
        Math.abs(E.a - E.target) < 1e-3 &&
        Math.abs(E.va) < 1e-2 &&
        Math.abs(E.b - E.a) < 1e-3 &&
        Math.abs(E.vb) < 1e-2;
      if (settled) {
        E.a = E.b = E.target;
        E.va = E.vb = 0;
        paint();
        E.raf = 0;
        E.last = 0;
        return;
      }
      E.raf = requestAnimationFrame(stepFrame);
    }

    E.raf = requestAnimationFrame(stepFrame);
  }, [getEngine, paint]);

  const setTarget = React.useCallback(
    (t: number, notify = true) => {
      const E = getEngine();
      const c = cfgRef.current;
      if (!c.n) return;
      E.target = c.loop ? t : Math.min(Math.max(t, 0), c.n - 1);
      const i = indexAt(E.target, c.n, c.loop);
      if (i !== cbRef.current.active) {
        setActive(i);
        if (notify) cbRef.current.onIndexChange?.(i);
      }
      kick();
    },
    [getEngine, kick],
  );

  const goTo = React.useCallback(
    (i: number, notify = true) => {
      const E = getEngine();
      setTarget(targetFor(i, E.target, cfgRef.current.n, cfgRef.current.loop), notify);
    },
    [getEngine, setTarget],
  );

  const step = React.useCallback(
    (by: number) => {
      const E = getEngine();
      setTarget(Math.round(E.target) + by);
    },
    [getEngine, setTarget],
  );

  React.useEffect(() => {
    if (index == null || !n) return;
    const E = getEngine();
    if (wrapIndex(Math.round(E.target), n) !== wrapIndex(index, n)) {
      goTo(wrapIndex(index, n), false);
    }
  }, [index, n, getEngine, goTo]);

  React.useLayoutEffect(() => {
    const E = getEngine();
    if (n && !loop && E.target > n - 1) setTarget(n - 1, false);
    paint();
  }, [active, n, loop, spacing, rise, depth, yaw, fan, tilt, roll, getEngine, paint, setTarget]);

  React.useEffect(() => {
    const E = getEngine();
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => {
      E.reduced = mq.matches;
    };
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [getEngine]);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const E = getEngine();
    const measure = () => {
      E.size = el.offsetWidth || 140;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [getEngine]);

  React.useEffect(
    () => () => {
      if (engineRef.current?.raf) cancelAnimationFrame(engineRef.current.raf);
    },
    [],
  );

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const E = getEngine();
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = performance.now();
      if (now - E.wheelAt > 160) E.wheel = 0;
      E.wheelAt = now;
      E.wheel += e.deltaX;
      if (Math.abs(E.wheel) > 40 && now - E.stepAt > 280) {
        step(Math.sign(E.wheel));
        E.wheel = 0;
        E.stepAt = now;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [getEngine, step]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || !n) return;
    const E = getEngine();
    E.drag = {
      id: e.pointerId,
      x0: e.clientX,
      pos0: E.a,
      moved: false,
      samples: [{ t: e.timeStamp, x: e.clientX }],
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const E = getEngine();
    if (e.pointerType === 'mouse' && !E.drag?.moved) {
      const st = stageRef.current?.getBoundingClientRect();
      const root = rootRef.current;
      if (st && root) {
        const cx = Math.max(-1, Math.min(1, (e.clientX - (st.left + st.width / 2)) / st.width));
        const cy = Math.max(-1, Math.min(1, (e.clientY - (st.top + st.height / 2)) / st.height));
        root.style.setProperty('--dcc-px', cx.toFixed(3));
        root.style.setProperty('--dcc-py', cy.toFixed(3));
      }
    }
    const d = E.drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      d.moved = true;
      d.x0 = e.clientX;
      d.pos0 = E.a;
      E.va = 0;
      rootRef.current?.setPointerCapture(e.pointerId);
      setDragging(true);
    }
    const c = cfgRef.current;
    const raw = d.pos0 - (e.clientX - d.x0) / (E.size * c.spacing);
    E.a = c.loop ? raw : rubber(raw, c.n);
    d.samples.push({ t: e.timeStamp, x: e.clientX });
    if (d.samples.length > 6) d.samples.shift();
    const i = indexAt(E.a, c.n, c.loop);
    if (i !== cbRef.current.active) {
      setActive(i);
      cbRef.current.onIndexChange?.(i);
    }
    kick();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const E = getEngine();
    const d = E.drag;
    if (!d || d.id !== e.pointerId) return;
    E.drag = null;
    if (!d.moved) return;
    setDragging(false);
    E.clickBlock = true;
    window.setTimeout(() => {
      E.clickBlock = false;
    }, 0);
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const ms = Math.max(last.t - first.t, 1);
    const v =
      e.type === 'pointercancel'
        ? 0
        : (-(last.x - first.x) / ms / (E.size * cfgRef.current.spacing)) * 1000;
    E.va = v;
    setTarget(releaseTarget(E.a, v, cfgRef.current.n, cfgRef.current.loop));
  };

  const onPointerLeave = () => {
    rootRef.current?.style.setProperty('--dcc-px', '0');
    rootRef.current?.style.setProperty('--dcc-py', '0');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    let handled = true;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') step(1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') step(-1);
    else if (e.key === 'Home') goTo(0);
    else if (e.key === 'End') goTo(n - 1);
    else handled = false;
    if (handled) e.preventDefault();
  };

  const onSlideClick = (i: number) => {
    const E = getEngine();
    if (E.clickBlock) return;
    if (i === active) onSelect?.(items[i], i);
    else goTo(i);
  };

  const current = items[active];

  return (
    <div
      ref={rootRef}
      className={'dcc-root ' + className}
      style={
        {
          height,
          background,
          color,
          fontFamily: sans,
          ['--dcc-s' as string]: discSize,
          ['--dcc-sheen' as string]: '' + sheen,
          ['--dcc-spin' as string]: spin + 's',
        } as React.CSSProperties
      }
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      data-dragging={dragging ? '' : undefined}
      data-spin={spin > 0 ? '' : undefined}
      data-playing={isSpinning ? '' : undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <style>{CSS}</style>

      <div ref={stageRef} className="dcc-stage">
        {items.map((item, i) => {
          const isActive = i === active;
          const pal = item.palette ?? PALETTES[i % PALETTES.length];
          const ink = item.ink ?? (item.src ? '#ffffff' : inkFor(pal[0]));
          const id = uid + 'd' + i;
          return (
            <button
              key={i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              type="button"
              className="dcc-slide"
              data-active={isActive ? '' : undefined}
              tabIndex={isActive ? 0 : -1}
              aria-label={i + 1 + ' de ' + n + ': ' + item.title}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onSlideClick(i)}
            >
              <span className="dcc-tilt">
                <span className="dcc-shade" />
                <span className="dcc-edge" />
                <span className="dcc-disc">
                  <span className="dcc-roll">
                    <span className="dcc-idle" style={{ fontFamily: display }}>
                      {item.src ? (
                        <img
                          src={item.src}
                          alt={item.alt ?? item.title}
                          draggable={false}
                          decoding="async"
                          width={300}
                          height={300}
                          style={{ maxWidth: 'none' }}
                        />
                      ) : (
                        <svg
                          viewBox="0 0 200 200"
                          role="img"
                          aria-label={item.alt ?? item.title}
                          style={{ maxWidth: 'none' }}
                        >
                          <Art
                            pattern={item.pattern ?? PATTERNS[i % PATTERNS.length]}
                            pal={pal}
                            seed={i + 1}
                            uid={id}
                          />
                        </svg>
                      )}
                      <Print
                        item={item}
                        i={i}
                        uid={id}
                        ink={ink}
                        halo={item.src ? 'rgba(0,0,0,.45)' : pal[0]}
                      />
                    </span>
                  </span>
                  <Hub uid={id} />
                  <span className="dcc-sheen" />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="dcc-sr" aria-live="polite" aria-atomic="true">
        {current ? `Pista ${active + 1} de ${n}: ${current.title}` : ''}
      </div>
    </div>
  );
}
