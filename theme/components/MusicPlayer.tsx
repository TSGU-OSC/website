import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

const STORE_KEY = 'osc-bgm';
const DEFAULT_VOLUME = 0.5;

type Persist = { playing: boolean; volume: number };

function readPersist(): Persist {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<Persist>;
      return {
        playing: data.playing === true,
        volume:
          typeof data.volume === 'number' && data.volume >= 0 && data.volume <= 1
            ? data.volume
            : DEFAULT_VOLUME,
      };
    }
  } catch {
    /* localStorage 不可用（隐私模式 / SSR）时用默认值 */
  }
  return { playing: false, volume: DEFAULT_VOLUME };
}

function writePersist(data: Persist) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch {
    /* 忽略写入失败 */
  }
}

const CSS = `
.osc-bgm {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 5px;
  border-radius: 999px;
  border: 1px solid var(--rp-c-divider, rgba(128, 128, 128, 0.18));
  background: var(--rp-c-bg-soft, rgba(20, 20, 20, 0.55));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px -6px rgba(0, 0, 0, 0.3);
  font-family: inherit;
  user-select: none;
  opacity: 0.45;
  transition: opacity var(--dur-base, 320ms) var(--ease-out),
    box-shadow var(--dur-base, 320ms) var(--ease-out);
}
.osc-bgm:hover,
.osc-bgm:focus-within,
.osc-bgm.is-playing {
  opacity: 1;
  box-shadow: 0 6px 20px -6px rgba(0, 0, 0, 0.35);
}
.osc-bgm.is-playing::before {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: 999px;
  border: 1px solid var(--color-accent-2, var(--rp-c-brand, #4e6ef2));
  opacity: 0;
  animation: osc-bgm-breathe 3s ease-in-out infinite;
  pointer-events: none;
}
.osc-bgm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--rp-c-text, #fff);
  cursor: pointer;
  outline: none;
  transition: background 0.2s ease, transform 0.2s ease;
}
.osc-bgm-btn:hover {
  background: var(--rp-c-bg-mute, rgba(128, 128, 128, 0.16));
}
.osc-bgm-btn:active {
  transform: scale(0.92);
}
.osc-bgm-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
  transition: fill 0.25s ease;
}
.osc-bgm-btn.is-playing svg {
  fill: var(--rp-c-brand, currentColor);
  animation: osc-bgm-spin 3.6s linear infinite;
}
.osc-bgm-vol {
  -webkit-appearance: none;
  appearance: none;
  width: 0;
  height: 14px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  outline: none;
  opacity: 0;
  transition: width var(--dur-base, 320ms) var(--ease-out),
    margin-left var(--dur-base, 320ms) var(--ease-out),
    opacity var(--dur-fast, 160ms) ease-out;
  cursor: pointer;
}
.osc-bgm-vol::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--rp-c-brand, #4e6ef2) var(--osc-fill, 50%),
    var(--rp-c-divider, rgba(128, 128, 128, 0.35)) var(--osc-fill, 50%)
  );
}
.osc-bgm-vol::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  margin-top: -4px;
  border: none;
  border-radius: 50%;
  background: var(--rp-c-brand, #4e6ef2);
  cursor: pointer;
}
.osc-bgm-vol::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: var(--rp-c-divider, rgba(128, 128, 128, 0.35));
}
.osc-bgm-vol::-moz-range-progress {
  height: 4px;
  border-radius: 2px;
  background: var(--rp-c-brand, #4e6ef2);
}
.osc-bgm-vol::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: none;
  border-radius: 50%;
  background: var(--rp-c-brand, #4e6ef2);
  cursor: pointer;
}
.osc-bgm:hover .osc-bgm-vol,
.osc-bgm:focus-within .osc-bgm-vol {
  width: 60px;
  margin-left: 6px;
  opacity: 1;
}
@keyframes osc-bgm-spin {
  to { transform: rotate(360deg); }
}
@keyframes osc-bgm-breathe {
  0%, 100% { opacity: 0; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.05); }
}
@media (prefers-reduced-motion: reduce) {
  .osc-bgm-btn.is-playing svg,
  .osc-bgm.is-playing::before { animation: none; }
}
@media (max-width: 768px) {
  .osc-bgm { right: 12px; bottom: 12px; opacity: 1; }
  .osc-bgm-vol { width: 52px; margin-left: 6px; opacity: 1; }
}
`;

// 唱片：外环 + 一段品牌色高光弧（转起来才看得出在转）+ 中心孔
function DiscIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 3.4A8.6 8.6 0 0 1 20.6 12"
        fill="none"
        stroke="var(--rp-c-brand, currentColor)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 5.8v12.4c0 .5.55.8.97.53l9.3-6.2a.64.64 0 0 0 0-1.06l-9.3-6.2A.64.64 0 0 0 9 5.8z" />
    </svg>
  );
}

export interface MusicPlayerProps {
  /** 音频地址，对应 docs/public 下的路径 */
  src?: string;
  /** 悬浮条上显示的提示文案 */
  label?: string;
}

export function MusicPlayer({
  src = '/audio/bgm.mp3',
  label = '社团 BGM',
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = readPersist();
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'metadata';
    audio.volume = saved.volume;
    audioRef.current = audio;
    setVolume(saved.volume);
    setMounted(true);

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onError = () =>
      console.warn(`[MusicPlayer] 音频加载失败，请检查文件是否存在：${src}`);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    // 浏览器禁止无用户手势的自动播放：上次退出时若正在播放，
    // 等用户第一次交互（点击 / 按键）后再恢复，不主动发声。
    const resume = () => {
      audio.play().catch(() => setPlaying(false));
    };
    let bound = false;
    if (saved.playing) {
      bound = true;
      window.addEventListener('pointerdown', resume, { once: true });
      window.addEventListener('keydown', resume, { once: true });
    }

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      if (bound) {
        window.removeEventListener('pointerdown', resume);
        window.removeEventListener('keydown', resume);
      }
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => writePersist({ playing: true, volume: audio.volume }))
        .catch(() => {
          setPlaying(false);
          writePersist({ playing: false, volume: audio.volume });
        });
    } else {
      audio.pause();
      writePersist({ playing: false, volume: audio.volume });
    }
  }, []);

  const changeVolume = useCallback((value: number) => {
    setVolume(value);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = value;
      writePersist({ playing: !audio.paused, volume: value });
    }
  }, []);

  // SSG 阶段在 Node 侧渲染，此时没有 Audio / localStorage，
  // 等客户端挂载后再渲染，避免 hydration 不一致。
  if (!mounted) return null;

  return (
    <div
      className={`osc-bgm${playing ? ' is-playing' : ''}`}
      role="group"
      aria-label="背景音乐播放器"
    >
      <style>{CSS}</style>
      <button
        type="button"
        className={`osc-bgm-btn${playing ? ' is-playing' : ''}`}
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? '暂停背景音乐' : '播放背景音乐'}
        title={`${playing ? '暂停' : '播放'} · ${label}`}
      >
        {playing ? <DiscIcon /> : <PlayIcon />}
      </button>
      <input
        className="osc-bgm-vol"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        style={{ '--osc-fill': `${volume * 100}%` } as CSSProperties}
        onChange={(e) => changeVolume(Number(e.target.value))}
        aria-label="背景音乐音量"
      />
    </div>
  );
}

/** 顶部滚动进度条：蓝到紫接力填充，样式见 styles.css（scroll-driven 渐进增强） */
export function ScrollProgress() {
  return <div className="osc-scroll-progress" aria-hidden="true" />;
}
