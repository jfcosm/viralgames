// tslint:disable
/* eslint-disable */
import {
  Award,
  CheckCircle,
  Flame,
  HelpCircle,
  Infinity as InfinityIcon,
  MapPin,
  Menu,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {getConfig} from './constants';
import { subscribeLeaderboard, saveLeaderboardToDb } from '../../firebase';
import {
  SpriteActionConfig,
  SpriteAnimationState,
  SpriteRenderer,
} from './SpriteRenderer';
import BackgroundMusic from './utils/BackgroundMusic';
import {
  createFixedStepper,
  drawAsset,
  drawBackground,
  gameAudio,
  GameState,
  MenuOverlay,
  prepareCanvas,
  useAssets,
  useAutoFocus,
  useInput,
  useIsMobile,
} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle,
  useRpc,
} from './utils/usePlayground';

// Latin chiptune cumbia background music
const BACKGROUND_MUSIC_URL = 'assets/audio/bgm_cumbia_arcade.mp3';

// Preload all approved assets including all 8 level backgrounds and title screen
const ASSETS_MANIFEST: Record<string, string> = {
  bg_title_screen: 'assets/images/new_asset_1791812147964.png',
  bg_1: 'assets/images/bg_night_market.png',
  bg_2: 'assets/images/new_asset_1791809978883.png',
  bg_3: 'assets/images/new_asset_1791810127067.png',
  bg_4: 'assets/images/new_asset_1791810535014.png',
  bg_5: 'assets/images/new_asset_1791810790837.png',
  bg_6: 'assets/images/new_asset_1791810901032.png',
  bg_7: 'assets/images/new_asset_1791811008857.png',
  bg_8: 'assets/images/new_asset_1791811108954.png',
  item_fried_fish: 'assets/images/item_fried_fish.png',
  item_oil_bottle: 'assets/images/item_oil_bottle.png',
  item_bread: 'assets/images/item_bread.png',
  item_mayo: 'assets/images/item_mayo.png',
  item_hot_sauce: 'assets/images/item_hot_sauce.png',
  item_frying_pan: 'assets/images/item_frying_pan.png',
  item_coin: 'assets/images/item_coin.png',
  hazard_dish_soap: 'assets/images/hazard_dish_soap.png',
  hazard_soap_bar: 'assets/images/hazard_soap_bar.png',
  hazard_water_bucket: 'assets/images/hazard_water_bucket.png',
  ui_heart_oil: 'assets/images/ui_heart_oil.png',
  player_idle: 'assets/images/tio_aceite_player_idle.png',
  player_walk: 'assets/images/tio_aceite_player_walk.png',
  player_run: 'assets/images/tio_aceite_player_run.png',
  player_hurt: 'assets/images/tio_aceite_player_hurt.png',
};

// Level Progression Stages Configuration
export interface LevelStage {
  id: number;
  name: string;
  shortName: string;
  subtitle: string;
  location: string;
  bgKey: string;
  targetScore: number;
  prevScoreRequirement: number;
  fallSpeedMult: number;
  spawnRateMult: number;
  hazardChance: number;
  badgeEmoji: string;
  accentColor: string;
  duration: number; // Duración mínima del turno en segundos
}

const STAGES: LevelStage[] = [
  {
    id: 1,
    name: 'Nivel 1: Carrito Nocturno',
    shortName: 'Carrito Nocturno',
    subtitle: 'El Origen de la Leyenda',
    location: 'Calle Brasil / Esquina Nocturna',
    bgKey: 'bg_1',
    targetScore: 1200,
    prevScoreRequirement: 0,
    duration: 35,
    fallSpeedMult: 1.0,
    spawnRateMult: 1.0,
    hazardChance: 0.16,
    badgeEmoji: '🌙',
    accentColor: '#f59e0b',
  },
  {
    id: 2,
    name: 'Nivel 2: El Faro Monumental',
    shortName: 'El Faro Monumental',
    subtitle: 'Brisa Marina y Pescado Crujiente',
    location: 'Avenida del Mar, Costanera',
    bgKey: 'bg_2',
    targetScore: 2800,
    prevScoreRequirement: 1200,
    duration: 35,
    fallSpeedMult: 1.15,
    spawnRateMult: 1.1,
    hazardChance: 0.22,
    badgeEmoji: '🗼',
    accentColor: '#38bdf8',
  },
  {
    id: 3,
    name: 'Nivel 3: La Recova',
    shortName: 'La Recova',
    subtitle: 'Corazón Tradicional Serenense',
    location: 'Mercado Tradicional La Recova',
    bgKey: 'bg_3',
    targetScore: 4800,
    prevScoreRequirement: 2800,
    duration: 40,
    fallSpeedMult: 1.3,
    spawnRateMult: 1.2,
    hazardChance: 0.26,
    badgeEmoji: '🏛️',
    accentColor: '#fbbf24',
  },
  {
    id: 4,
    name: 'Nivel 4: Esquina de los Bomberos',
    shortName: 'Esquina de Bomberos',
    subtitle: 'Sirenas y Fuego Callejero',
    location: 'Cuerpo de Bomberos La Serena',
    bgKey: 'bg_4',
    targetScore: 7200,
    prevScoreRequirement: 4800,
    duration: 40,
    fallSpeedMult: 1.45,
    spawnRateMult: 1.3,
    hazardChance: 0.30,
    badgeEmoji: '🚒',
    accentColor: '#ef4444',
  },
  {
    id: 5,
    name: 'Nivel 5: Plaza de Armas',
    shortName: 'Plaza de Armas',
    subtitle: 'La Gran Concurrencia Colonial',
    location: 'Plaza de Armas & Catedral',
    bgKey: 'bg_5',
    targetScore: 10200,
    prevScoreRequirement: 7200,
    duration: 45,
    fallSpeedMult: 1.6,
    spawnRateMult: 1.4,
    hazardChance: 0.34,
    badgeEmoji: '⛲',
    accentColor: '#10b981',
  },
  {
    id: 6,
    name: 'Nivel 6: Feria de Abastos',
    shortName: 'Feria de Abastos',
    subtitle: 'Hora Punta de la Fritura Brava',
    location: 'Feria Libre Mayorista de Abastos',
    bgKey: 'bg_6',
    targetScore: 13800,
    prevScoreRequirement: 10200,
    duration: 45,
    fallSpeedMult: 1.75,
    spawnRateMult: 1.5,
    hazardChance: 0.38,
    badgeEmoji: '🎪',
    accentColor: '#a855f7',
  },
  {
    id: 7,
    name: 'Nivel 7: Plaza Tenri',
    subtitle: 'Brisa Oriental y Aceite Infinito',
    shortName: 'Plaza Tenri',
    location: 'Parque Japonés / Plaza Tenri',
    bgKey: 'bg_7',
    targetScore: 18000,
    prevScoreRequirement: 13800,
    duration: 45,
    fallSpeedMult: 1.9,
    spawnRateMult: 1.65,
    hazardChance: 0.42,
    badgeEmoji: '🏮',
    accentColor: '#ec4899',
  },
  {
    id: 8,
    name: 'Nivel 8: Polideportivo',
    shortName: 'Polideportivo',
    subtitle: '¡La Gran Final de la Fritanga!',
    location: 'Estadio y Polideportivo Municipal',
    bgKey: 'bg_8',
    targetScore: 23000,
    prevScoreRequirement: 18000,
    duration: 50,
    fallSpeedMult: 2.1,
    spawnRateMult: 1.8,
    hazardChance: 0.46,
    badgeEmoji: '🏟️',
    accentColor: '#eab308',
  },
];

// --- 16-BIT RETRO ARCADE LEADERBOARD ---
export interface LeaderboardEntry {
  name: string;
  score: number;
  stageName: string;
  date: string;
}

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { name: 'FRANCISC', score: 28500, stageName: 'Polideportivo', date: '1994' },
  { name: 'JANO_M',   score: 24200, stageName: 'Feria Abastos', date: '1994' },
  { name: 'CHIMUELO', score: 19800, stageName: 'Plaza Tenri',   date: '1995' },
  { name: 'EL_TARRO', score: 16400, stageName: 'Plaza Armas',   date: '1993' },
  { name: 'LA_SEREN', score: 14100, stageName: 'La Recova',     date: '1994' },
  { name: 'FRITANGA', score: 11500, stageName: 'El Faro',       date: '1994' },
  { name: 'DON_TIO',  score: 9800,  stageName: 'Carrito',       date: '1994' },
];

// Character spritesheet configs based on read_assets_metadata
const PLAYER_SPRITE_CONFIGS: Record<string, SpriteActionConfig> = {
  IDLE: {
    imageUrl: 'player_idle',
    totalFrames: 4,
    frameWidth: 512,
    frameHeight: 512,
    fps: 8,
    loop: true,
  },
  WALK: {
    imageUrl: 'player_walk',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 12,
    loop: true,
  },
  RUN: {
    imageUrl: 'player_run',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 18,
    loop: true,
  },
  HURT: {
    imageUrl: 'player_hurt',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 12,
    loop: false,
  },
};

type ItemType =
  | 'fried_fish'
  | 'oil_bottle'
  | 'bread'
  | 'mayo'
  | 'hot_sauce'
  | 'frying_pan'
  | 'coin'
  | 'dish_soap'
  | 'soap_bar'
  | 'water_bucket';

interface FallingItem {
  id: number;
  type: ItemType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  rotSpeed: number;
  isHazard: boolean;
  points: number;
  name: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'bubble' | 'spark' | 'smoke' | 'star' | 'splash' | 'confetti';
}

interface FloatingText {
  id: number;
  text: string;
  subText?: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

interface LevelBanner {
  levelNumber: number;
  title: string;
  subtitle: string;
  location: string;
  timer: number;
  maxTimer: number;
}

const CHILEAN_GOOD_CRIES = [
  '¡Wena Tío Aceite!',
  '¡Pescaito al toque!',
  '¡Qué crujiente!',
  '¡Tremenda Fritanga!',
  '¡Póngale mayonesa!',
  '¡Puro Sabor Callejero!',
  '¡Rico el marraqueta!',
  '¡Oro Puro del Sartén!',
  '¡Pasa el sartén ligero!',
];

const CHILEAN_BAD_CRIES = [
  '¡Cuidado con el lavalozas!',
  '¡El agua corta el aceite!',
  '¡Uyy, qué jabonada!',
  '¡Ojo compare!',
];

/**
 * High-fidelity 16-bit Pixel Art Portrait of Tío Aceite
 */
function TioAceitePixelPortrait() {
  return (
    <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-slate-900 border-4 border-amber-400 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.5)] p-1.5 flex items-center justify-center shrink-0">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 via-sky-950/60 to-slate-950" />
      <div className="absolute top-1 right-2 w-8 h-8 bg-yellow-300/30 blur-md rounded-full pointer-events-none" />

      <svg
        viewBox="0 0 64 64"
        className="w-full h-full relative z-10 [image-rendering:pixelated]"
        shapeRendering="crispEdges">
        <rect x="0" y="0" width="64" height="64" fill="#090d16" />
        <rect x="0" y="0" width="64" height="24" fill="#151b2c" />
        <rect x="44" y="4" width="12" height="12" fill="#fbbf24" opacity="0.3" />
        <rect x="46" y="6" width="8" height="8" fill="#fef08a" />

        <rect x="58" y="0" width="3" height="34" fill="#1e293b" />
        <rect x="52" y="4" width="9" height="2" fill="#334155" />

        <rect x="12" y="8" width="2" height="4" fill="#fde047" opacity="0.6" />
        <rect x="15" y="5" width="2" height="3" fill="#ffffff" opacity="0.5" />
        <rect x="48" y="14" width="2" height="3" fill="#fde047" opacity="0.6" />

        <rect x="10" y="46" width="44" height="18" fill="#38bdf8" />
        <rect x="12" y="44" width="40" height="20" fill="#0284c7" />
        <rect x="16" y="42" width="32" height="22" fill="#38bdf8" />
        <rect x="10" y="50" width="4" height="14" fill="#0369a1" />
        <rect x="50" y="50" width="4" height="14" fill="#0369a1" />
        <rect x="29" y="46" width="6" height="18" fill="#075985" />
        <rect x="24" y="48" width="3" height="3" fill="#fbbf24" />
        <rect x="37" y="48" width="3" height="3" fill="#fbbf24" />
        <rect x="24" y="54" width="3" height="3" fill="#fbbf24" />
        <rect x="37" y="54" width="3" height="3" fill="#fbbf24" />

        <rect x="22" y="38" width="20" height="8" fill="#1e293b" />
        <rect x="25" y="40" width="14" height="6" fill="#0f172a" />
        <rect x="28" y="38" width="8" height="3" fill="#334155" />

        <rect x="26" y="34" width="12" height="6" fill="#d97706" />
        <rect x="28" y="34" width="8" height="6" fill="#f59e0b" />

        <rect x="18" y="18" width="28" height="18" fill="#f59e0b" />
        <rect x="20" y="16" width="24" height="20" fill="#fbbf24" />
        <rect x="18" y="24" width="3" height="8" fill="#d97706" />
        <rect x="43" y="24" width="3" height="8" fill="#d97706" />
        <rect x="20" y="27" width="5" height="4" fill="#f87171" opacity="0.75" />
        <rect x="39" y="27" width="5" height="4" fill="#f87171" opacity="0.75" />

        <rect x="16" y="22" width="3" height="6" fill="#f59e0b" />
        <rect x="45" y="22" width="3" height="6" fill="#f59e0b" />

        <rect x="24" y="22" width="4" height="3" fill="#0f172a" />
        <rect x="36" y="22" width="4" height="3" fill="#0f172a" />
        <rect x="25" y="21" width="2" height="1" fill="#ffffff" />
        <rect x="37" y="21" width="2" height="1" fill="#ffffff" />
        <rect x="21" y="21" width="2" height="1" fill="#b45309" />
        <rect x="41" y="21" width="2" height="1" fill="#b45309" />

        <rect x="23" y="19" width="6" height="2" fill="#451a03" />
        <rect x="35" y="19" width="6" height="2" fill="#451a03" />

        <rect x="30" y="23" width="4" height="4" fill="#d97706" />
        <rect x="29" y="25" width="6" height="2" fill="#b45309" />

        <rect x="26" y="28" width="12" height="3" fill="#451a03" />
        <rect x="24" y="29" width="16" height="2" fill="#78350f" />
        <rect x="28" y="31" width="8" height="2" fill="#ffffff" />
        <rect x="29" y="32" width="6" height="1" fill="#b45309" />

        <rect x="17" y="13" width="30" height="5" fill="#78350f" />
        <rect x="18" y="14" width="28" height="3" fill="#d97706" />
        <rect x="18" y="10" width="28" height="3" fill="#fef3c7" />
        <rect x="20" y="10" width="24" height="3" fill="#fde68a" />
        <rect x="19" y="7" width="26" height="3" fill="#78350f" />
        <rect x="21" y="7" width="22" height="3" fill="#92400e" />
        <rect x="21" y="4" width="22" height="3" fill="#fef3c7" />
        <rect x="23" y="4" width="18" height="3" fill="#fde68a" />
        <rect x="24" y="2" width="16" height="2" fill="#78350f" />
        <rect x="27" y="1" width="10" height="1" fill="#92400e" />

        <rect x="42" y="38" width="14" height="5" fill="#1e293b" />
        <rect x="44" y="39" width="10" height="3" fill="#fbbf24" />
        <rect x="46" y="36" width="3" height="3" fill="#f59e0b" />
      </svg>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper>>();
  const isMobile = useIsMobile();

  // --- GLOBAL PAUSE & MODAL STATES ---
  const lastCancelRef = useRef(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isStagesViewOpen, setIsStagesViewOpen] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [isEndlessMode, setIsEndlessMode] = useState(false);

  // High score in local storage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('tio_aceite_highscore')) || 0;
    } catch {
      return 0;
    }
  });

  // --- 16-BIT ARCADE LEADERBOARD STATE ---
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('viralgames_tio_aceite_leaderboard');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LEADERBOARD;
  });

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState(() => {
    try {
      return (localStorage.getItem('viralgames_tio_aceite_player_name') || 'JUGADOR').slice(0, 8);
    } catch {
      return 'JUGADOR';
    }
  });
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Sync with Cloud Firestore global arcade leaderboard
  useEffect(() => {
    const unsub = subscribeLeaderboard('tio-aceite', (cloudEntries: LeaderboardEntry[] | null) => {
      if (cloudEntries && Array.isArray(cloudEntries) && cloudEntries.length > 0) {
        setLeaderboard(cloudEntries);
        try {
          localStorage.setItem('viralgames_tio_aceite_leaderboard', JSON.stringify(cloudEntries));
          if (cloudEntries[0]?.score) {
            setHighScore((prev) => Math.max(prev, cloudEntries[0].score));
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const handleSaveScore = (score: number, stageName: string) => {
    const cleanName = (playerNameInput.trim().toUpperCase() || 'JUGADOR').slice(0, 8);
    const newEntry: LeaderboardEntry = {
      name: cleanName,
      score: score,
      stageName: stageName,
      date: 'HOY',
    };
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(updated);
    setScoreSubmitted(true);
    try {
      localStorage.setItem('viralgames_tio_aceite_leaderboard', JSON.stringify(updated));
      localStorage.setItem('viralgames_tio_aceite_player_name', cleanName);
    } catch (e) {
      console.error(e);
    }
    // Sincronizar en tiempo real en Cloud Firestore
    saveLeaderboardToDb('tio-aceite', updated);

    gameAudio.playVictoryJingle();
    setIsLeaderboardOpen(true);
  };

  // --- PLAYGROUND SDK INTEGRATION ---
  const {sdk, isReady} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  // --- ASSETS PRELOADING ---
  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs');
    const maxSubSteps = getConfig('maxSubSteps');
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1,
    lives: getConfig('startingLives') as number,
    combo: 0,
    maxCombo: 0,
    bravaMeter: 0,
    bravaActive: false,
    bravaTimer: 0,
    speedBoostTimer: 0,
    goldenPanTimer: 0,
    currentStageIndex: 0,
    stageTimeRemaining: STAGES[0].duration,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    (window as any).canHandleBackKey = gameState.status !== 'START';
  }, [gameState.status]);

  const inputRef = useInput(canvasRef, true, {
    width: canvasWidth,
    height: canvasHeight,
  });

  // Mobile virtual controls state
  const touchLeftRef = useRef(false);
  const touchRightRef = useRef(false);
  const touchBoostRef = useRef(false);

  // Player sprite renderer & animation state
  const spriteRendererRef = useRef<SpriteRenderer | null>(null);
  if (!spriteRendererRef.current) {
    spriteRendererRef.current = new SpriteRenderer(PLAYER_SPRITE_CONFIGS);
  }

  const playerAnimStateRef = useRef<SpriteAnimationState>({
    currentAction: 'IDLE',
    currentFrame: 0,
    timer: 0,
  });

  // Player simulation entity in ref for smooth 60fps
  const groundY = canvasHeight - 200;
  const playerRef = useRef({
    x: canvasWidth / 2 - 85,
    y: groundY,
    width: 170,
    height: 170,
    vx: 0,
    facingLeft: false,
    hurtTimer: 0,
    panRadius: 46,
    shake: 0,
  });

  // Falling items, particles, floating texts, and level transition banner
  const itemsRef = useRef<FallingItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const levelBannerRef = useRef<LevelBanner | null>(null);
  const nextItemId = useRef(1);
  const nextTextId = useRef(1);
  const spawnTimerRef = useRef(0);
  const gameTimeRef = useRef(0);
  const screenShakeRef = useRef(0);

  // Background crossfade transition refs
  const currentBgKeyRef = useRef('bg_1');
  const nextBgKeyRef = useRef<string | null>(null);
  const bgTransitionProgressRef = useRef(1);
  const quotaAchievedNotifiedRef = useRef<number>(-1);

  // Sizzle sound throttle
  const lastCatchSoundTime = useRef(0);

  // Auto-focus hooks for overlays
  const startButtonRef = useAutoFocus<HTMLButtonElement>(
    gameState.status === 'START',
  );
  const resumeButtonRef = useAutoFocus<HTMLButtonElement>(isMenuOpen);

  // Sync high score
  const updateScoreAndCheckRecords = useCallback((newScore: number) => {
    setGameState((prev) => ({...prev, score: newScore}));
    setHighScore((prev) => {
      if (newScore > prev) {
        try {
          localStorage.setItem('tio_aceite_highscore', String(newScore));
        } catch {}
        return newScore;
      }
      return prev;
    });
  }, []);

  const addFloatingText = (
    text: string,
    x: number,
    y: number,
    color = '#fde047',
    subText?: string,
  ) => {
    floatingTextsRef.current.push({
      id: nextTextId.current++,
      text,
      subText,
      x,
      y,
      color,
      life: 1.3,
      maxLife: 1.3,
      scale: 1,
    });
  };

  const spawnParticles = (
    x: number,
    y: number,
    count: number,
    type: Particle['type'],
    color: string,
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 200 + 50;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'smoke' ? 60 : 30),
        life: 0.4 + Math.random() * 0.7,
        maxLife: 0.9,
        size: Math.random() * 8 + 3,
        color,
        type,
      });
    }
  };

  const triggerLevelCelebration = (stage: LevelStage) => {
    levelBannerRef.current = {
      levelNumber: stage.id,
      title: stage.name,
      subtitle: stage.subtitle,
      location: stage.location,
      timer: 3.5,
      maxTimer: 3.5,
    };

    // Spawn celebratory confetti across top of the arena
    for (let i = 0; i < 35; i++) {
      const px = Math.random() * canvasWidth;
      const py = Math.random() * 200 + 40;
      const colors = ['#f59e0b', '#fbbf24', '#38bdf8', '#10b981', '#ec4899', '#ffffff'];
      spawnParticles(px, py, 1, 'confetti', colors[i % colors.length]);
    }
  };

  // --- Core Game Initialization ---
  const initGame = useCallback((startInEndless = false) => {
    const startingLives = getConfig('startingLives') as number;
    setIsEndlessMode(startInEndless);
    setScoreSubmitted(false);

    playerRef.current = {
      x: canvasWidth / 2 - 85,
      y: groundY,
      width: 170,
      height: 170,
      vx: 0,
      facingLeft: false,
      hurtTimer: 0,
      panRadius: 46,
      shake: 0,
    };
    playerAnimStateRef.current = {
      currentAction: 'IDLE',
      currentFrame: 0,
      timer: 0,
    };
    itemsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    spawnTimerRef.current = 0.5;
    gameTimeRef.current = 0;
    screenShakeRef.current = 0;

    currentBgKeyRef.current = 'bg_1';
    nextBgKeyRef.current = null;
    bgTransitionProgressRef.current = 1;
    quotaAchievedNotifiedRef.current = -1;

    setGameState({
      status: 'PLAYING',
      score: 0,
      level: 1,
      lives: startingLives,
      combo: 0,
      maxCombo: 0,
      bravaMeter: 0,
      bravaActive: false,
      bravaTimer: 0,
      speedBoostTimer: 0,
      goldenPanTimer: 0,
      currentStageIndex: 0,
      stageTimeRemaining: STAGES[0].duration,
    });

    triggerLevelCelebration(STAGES[0]);

    setIsMenuOpen(false);
    setIsHowToPlayOpen(false);
    setIsStagesViewOpen(false);

    if (sdk) {
      sdk.startGame();
    }
    gameAudio.playConfirmSelect();
  }, [canvasWidth, groundY, sdk]);

  // --- PLAYGROUND SDK SCORE & LIFECYCLE REPORTING ---
  usePlaygroundGameLifecycle(gameState, sdk);

  // Auto-start for autoplay query
  const hasAutoplayed = useRef(false);
  useEffect(() => {
    if (
      !hasAutoplayed.current &&
      new URLSearchParams(window.location.search).has('autoplay')
    ) {
      hasAutoplayed.current = true;
      initGame(false);
    }
  }, [initGame]);

  // Sound effects on status change
  useEffect(() => {
    if (gameState.status === 'GAME_OVER') {
      gameAudio.playDefeatMotif();
    } else if (gameState.status === 'VICTORY') {
      gameAudio.playVictoryFanfare();
    }
  }, [gameState.status]);

  // Keyboard shortcut for menu toggle (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState.status === 'PLAYING') {
          setIsMenuOpen((prev) => !prev);
          setIsHowToPlayOpen(false);
          setIsStagesViewOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status]);

  // --- Spawn Item Helper based on current stage ---
  const spawnFallingItem = (stage: LevelStage, bravaActive: boolean) => {
    const isSpecialRoll = Math.random() < 0.28;
    const isHazardRoll = !bravaActive && Math.random() < stage.hazardChance;

    let type: ItemType = 'fried_fish';
    let isHazard = false;
    let points = 250;
    let name = 'Pescado Frito';

    if (isHazardRoll) {
      isHazard = true;
      const hRoll = Math.random();
      if (hRoll < 0.35) {
        type = 'dish_soap';
        points = -150;
        name = 'Lavalozas Verde';
      } else if (hRoll < 0.7) {
        type = 'soap_bar';
        points = -100;
        name = 'Barra de Jabón';
      } else {
        type = 'water_bucket';
        points = -200;
        name = 'Balde de Agua';
      }
    } else if (isSpecialRoll) {
      const sRoll = Math.random();
      if (sRoll < 0.25) {
        type = 'oil_bottle';
        points = 60;
        name = 'Aceite Puro (+1 Vida)';
      } else if (sRoll < 0.5) {
        type = 'hot_sauce';
        points = 40;
        name = 'Salsa de Ají (Turbo)';
      } else if (sRoll < 0.75) {
        type = 'frying_pan';
        points = 100;
        name = 'Sartén de Oro (2x Radio)';
      } else {
        type = 'coin';
        points = 150;
        name = 'Moneda Dorada ($150)';
      }
    } else {
      const gRoll = Math.random();
      if (gRoll < 0.45) {
        type = 'fried_fish';
        points = 50;
        name = 'Pescado Frito';
      } else if (gRoll < 0.75) {
        type = 'bread';
        points = 35;
        name = 'Pan Marraqueta';
      } else {
        type = 'mayo';
        points = 25;
        name = 'Mayonesa Casera';
      }
    }

    // Proportional dimensions using constants aspect ratios
    let itemW = 54;
    let itemH = 54;
    if (type === 'fried_fish') {
      itemH = 34;
      itemW = itemH * (getConfig('assetItemFriedFishAspectRatio') as number);
    } else if (type === 'oil_bottle') {
      itemH = 68;
      itemW = itemH * (getConfig('assetItemOilBottleAspectRatio') as number);
    } else if (type === 'bread') {
      itemH = 40;
      itemW = itemH * (getConfig('assetItemBreadAspectRatio') as number);
    } else if (type === 'mayo') {
      itemH = 60;
      itemW = itemH * (getConfig('assetItemMayoAspectRatio') as number);
    } else if (type === 'hot_sauce') {
      itemH = 66;
      itemW = itemH * (getConfig('assetItemHotSauceAspectRatio') as number);
    } else if (type === 'frying_pan') {
      itemH = 42;
      itemW = itemH * (getConfig('assetItemFryingPanAspectRatio') as number);
    } else if (type === 'coin') {
      itemH = 46;
      itemW = itemH * (getConfig('assetItemCoinAspectRatio') as number);
    } else if (type === 'dish_soap') {
      itemH = 66;
      itemW = itemH * (getConfig('assetHazardDishSoapAspectRatio') as number);
    } else if (type === 'soap_bar') {
      itemH = 36;
      itemW = itemH * (getConfig('assetHazardSoapBarAspectRatio') as number);
    } else if (type === 'water_bucket') {
      itemH = 56;
      itemW = itemH * (getConfig('assetHazardWaterBucketAspectRatio') as number);
    }

    const margin = 80;
    const x = margin + Math.random() * (canvasWidth - margin * 2 - itemW);
    const baseFallSpeed = (getConfig('itemFallSpeed') as number) * stage.fallSpeedMult;
    const vy = baseFallSpeed + Math.random() * 60;
    const vx = (Math.random() - 0.5) * 50;

    itemsRef.current.push({
      id: nextItemId.current++,
      type,
      x,
      y: -itemH - 10,
      vx,
      vy,
      width: Math.max(20, itemW),
      height: Math.max(20, itemH),
      rotation: (Math.random() - 0.5) * 0.3,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      isHazard,
      points,
      name,
    });
  };

  // --- GAME UPDATE ---
  const update = (deltaTime: number) => {
    if (gameStateRef.current.status !== 'PLAYING' || isMenuOpen || isHowToPlayOpen || isStagesViewOpen) {
      return;
    }

    const input = inputRef.current;
    const player = playerRef.current;
    gameTimeRef.current += deltaTime;

    // Background crossfade animation
    if (bgTransitionProgressRef.current < 1) {
      bgTransitionProgressRef.current = Math.min(1, bgTransitionProgressRef.current + deltaTime * 2.0);
      if (bgTransitionProgressRef.current >= 1 && nextBgKeyRef.current) {
        currentBgKeyRef.current = nextBgKeyRef.current;
        nextBgKeyRef.current = null;
      }
    }

    // Decay screen shake
    if (screenShakeRef.current > 0) {
      screenShakeRef.current = Math.max(0, screenShakeRef.current - deltaTime * 12);
    }

    // Update level banner timer
    if (levelBannerRef.current) {
      levelBannerRef.current.timer -= deltaTime;
      if (levelBannerRef.current.timer <= 0) {
        levelBannerRef.current = null;
      }
    }

    // Current stage
    let currentStageIdx = gameStateRef.current.currentStageIndex ?? 0;
    let currentStage = STAGES[Math.min(currentStageIdx, STAGES.length - 1)];

    // Timers
    let currentStageTimer = gameStateRef.current.stageTimeRemaining ?? currentStage.duration;
    if (!isEndlessMode) {
      currentStageTimer -= deltaTime;
    }
    let currentBravaActive = gameStateRef.current.bravaActive;
    let currentBravaTimer = gameStateRef.current.bravaTimer;
    let currentSpeedTimer = gameStateRef.current.speedBoostTimer;
    let currentGoldenTimer = gameStateRef.current.goldenPanTimer;
    let currentLives = gameStateRef.current.lives ?? 3;
    let currentScore = gameStateRef.current.score;
    let currentCombo = gameStateRef.current.combo;
    let currentMaxCombo = gameStateRef.current.maxCombo;
    let currentBravaMeter = gameStateRef.current.bravaMeter;

    if (currentBravaActive) {
      currentBravaTimer -= deltaTime;
      if (currentBravaTimer <= 0) {
        currentBravaActive = false;
        currentBravaTimer = 0;
        currentBravaMeter = 0;
        addFloatingText('¡Fritanga Brava Finalizada!', player.x + 85, player.y - 30, '#fde047');
      }
    }

    if (currentSpeedTimer > 0) {
      currentSpeedTimer -= deltaTime;
    }
    if (currentGoldenTimer > 0) {
      currentGoldenTimer -= deltaTime;
    }

    // Calculate movement speeds
    const baseSpeed = getConfig('playerSpeed') as number;
    const dashMult = getConfig('dashMultiplier') as number;
    const hasDashInput =
      input.actions.confirm ||
      input.actions.up ||
      touchBoostRef.current;
    const isTurbo = currentSpeedTimer > 0 || hasDashInput;
    const actualSpeed = isTurbo ? baseSpeed * dashMult : baseSpeed;

    // Determine horizontal movement
    let moveDir = 0;
    if (input.actions.left || touchLeftRef.current) moveDir -= 1;
    if (input.actions.right || touchRightRef.current) moveDir += 1;

    // Mouse / Touch direct drag positioning
    if (input.pointer.down) {
      const targetCenterX = input.pointer.x;
      const playerCenterX = player.x + player.width / 2;
      const diff = targetCenterX - playerCenterX;
      if (Math.abs(diff) > 12) {
        moveDir = Math.sign(diff);
      }
    }

    // Apply movement
    player.vx = moveDir * actualSpeed;
    player.x += player.vx * deltaTime;

    // Clamp inside canvas bounds
    const minX = 10;
    const maxX = canvasWidth - player.width - 10;
    if (player.x < minX) {
      player.x = minX;
      player.vx = 0;
    } else if (player.x > maxX) {
      player.x = maxX;
      player.vx = 0;
    }

    // Facing direction
    if (moveDir < 0) {
      player.facingLeft = true;
    } else if (moveDir > 0) {
      player.facingLeft = false;
    }

    // Player Hurt recovery timer
    if (player.hurtTimer > 0) {
      player.hurtTimer -= deltaTime;
    }

    // Animation state update
    let nextAction = 'IDLE';
    if (player.hurtTimer > 0) {
      nextAction = 'HURT';
    } else if (Math.abs(player.vx) > 10) {
      nextAction = isTurbo ? 'RUN' : 'WALK';
    }

    if (playerAnimStateRef.current.currentAction !== nextAction) {
      playerAnimStateRef.current = {
        currentAction: nextAction,
        currentFrame: 0,
        timer: 0,
      };
    }

    if (spriteRendererRef.current) {
      playerAnimStateRef.current = spriteRendererRef.current.getNextState(
        playerAnimStateRef.current,
        deltaTime,
      );
    }

    // Turbo flame / dust particles behind player
    if (isTurbo && Math.abs(player.vx) > 50) {
      if (Math.random() < 0.4) {
        spawnParticles(
          player.facingLeft ? player.x + 130 : player.x + 40,
          player.y + 140,
          1,
          currentSpeedTimer > 0 ? 'spark' : 'smoke',
          currentSpeedTimer > 0 ? '#ef4444' : '#f59e0b',
        );
      }
    }

    // Golden Pan / Brava aura sparkles
    if (currentBravaActive || currentGoldenTimer > 0) {
      if (Math.random() < 0.3) {
        spawnParticles(
          player.x + 30 + Math.random() * 110,
          player.y + 50 + Math.random() * 100,
          1,
          'star',
          '#fbbf24',
        );
      }
    }

    // Compute active pan catch center and radius
    const panX = player.facingLeft ? player.x + 55 : player.x + 115;
    const panY = player.y + 102;
    const basePanRadius = 46;
    const activePanRadius =
      currentGoldenTimer > 0 || currentBravaActive
        ? basePanRadius * 1.55
        : basePanRadius;

    // --- Spawn Falling Items ---
    const baseSpawnInterval = (getConfig('spawnInterval') as number) / currentStage.spawnRateMult;
    const currentSpawnRate = Math.max(
      0.38,
      baseSpawnInterval - (currentBravaActive ? 0.35 : 0),
    );

    spawnTimerRef.current -= deltaTime;
    if (spawnTimerRef.current <= 0) {
      spawnFallingItem(currentStage, currentBravaActive);
      spawnTimerRef.current = currentSpawnRate + Math.random() * 0.2;
    }

    // --- Update Falling Items & Collision Checking ---
    const items = itemsRef.current;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.x += item.vx * deltaTime;
      item.y += item.vy * deltaTime;
      item.rotation += item.rotSpeed * deltaTime;

      // Hazard turned to coin during Brava
      if (currentBravaActive && item.isHazard) {
        item.isHazard = false;
        item.type = 'coin';
        item.points = 120;
        item.name = 'Moneda Brava ($120)';
      }

      // Check collision with pan
      const itemCenterX = item.x + item.width / 2;
      const itemCenterY = item.y + item.height / 2;
      const dist = Math.hypot(itemCenterX - panX, itemCenterY - panY);

      if (dist < activePanRadius + Math.max(item.width, item.height) * 0.38) {
        // CAUGHT IN PAILA!
        const isHazard = item.isHazard;

        if (isHazard) {
          // Hurt player & break combo
          currentLives -= 1;
          currentCombo = 0;
          currentBravaMeter = Math.max(0, currentBravaMeter - 3);
          player.hurtTimer = 0.65;
          screenShakeRef.current = 14;

          gameAudio.playChiptuneExplosion();
          gameAudio.playErrorBuzz();

          const badCry =
            CHILEAN_BAD_CRIES[
              Math.floor(Math.random() * CHILEAN_BAD_CRIES.length)
            ];
          addFloatingText(badCry, itemCenterX, itemCenterY - 20, '#ef4444', '-1 VIDA DE ACEITE');
          spawnParticles(itemCenterX, itemCenterY, 18, 'splash', '#38bdf8');

          items.splice(i, 1);

          if (currentLives <= 0) {
            setGameState((prev) => ({
              ...prev,
              lives: 0,
              status: 'GAME_OVER',
            }));
            return;
          }
          continue;
        } else {
          // GOOD ITEM CAUGHT!
          currentCombo += 1;
          if (currentCombo > currentMaxCombo) currentMaxCombo = currentCombo;

          // Multiplicador balanceado y gradual (máx 2.0x por combo y 1.5x por Brava/Paila de Oro)
          const comboMult = Math.min(2.0, 1 + Math.floor(currentCombo / 5) * 0.25);
          const specialMult = currentGoldenTimer > 0 || currentBravaActive ? 1.5 : 1;
          const gainedPoints = Math.round(item.points * comboMult * specialMult);
          currentScore += gainedPoints;

          // Sound effect
          const now = performance.now();
          if (now - lastCatchSoundTime.current > 80) {
            lastCatchSoundTime.current = now;
            if (item.type === 'coin') {
              gameAudio.playCoinPickup();
            } else if (item.type === 'oil_bottle') {
              gameAudio.playPotionGulp();
            } else if (item.type === 'hot_sauce' || item.type === 'frying_pan') {
              gameAudio.playPowerupChime();
            } else {
              gameAudio.playShieldBlock();
              gameAudio.playCoinPickup();
            }
          }

          // Item specific bonuses
          let bannerSub = gainedPoints > item.points ? `+${gainedPoints} (x${(comboMult * specialMult).toFixed(1)})` : `+${gainedPoints}`;
          if (currentScore >= currentStage.targetScore) {
            bannerSub += ' ★ VENTA EXTRA';
          }
          if (item.type === 'oil_bottle') {
            const maxLives = 4;
            if (currentLives < maxLives) {
              currentLives += 1;
              bannerSub = '+1 VIDA DE ACEITE RECUPERADA';
            }
            spawnParticles(itemCenterX, itemCenterY, 16, 'bubble', '#f59e0b');
          } else if (item.type === 'hot_sauce') {
            currentSpeedTimer = 5.0;
            bannerSub = '¡TURBO AJÍ ACTIVADO (5s)!';
            spawnParticles(itemCenterX, itemCenterY, 16, 'spark', '#ef4444');
          } else if (item.type === 'frying_pan') {
            currentGoldenTimer = 6.0;
            bannerSub = '¡SARTÉN DE ORO! 2X RADIO & PUNTOS';
            spawnParticles(itemCenterX, itemCenterY, 20, 'star', '#fbbf24');
          } else {
            // Sizzle steam particles for delicious frying
            spawnParticles(itemCenterX, itemCenterY, 12, 'bubble', '#fde047');
            spawnParticles(itemCenterX, itemCenterY - 10, 8, 'smoke', '#ffffff');
          }

          // Notificar cuota cumplida la primera vez en este turno
          if (
            currentScore >= currentStage.targetScore &&
            quotaAchievedNotifiedRef.current !== currentStageIdx
          ) {
            quotaAchievedNotifiedRef.current = currentStageIdx;
            gameAudio.playPowerupChime();
            addFloatingText(
              '¡CUOTA CUMPLIDA!',
              player.x + 85,
              player.y - 60,
              '#22c55e',
              '¡SIGUE SUMANDO VENTAS EXTRA!',
            );
          }

          // Build Brava Meter
          if (!currentBravaActive) {
            currentBravaMeter += 1;
            const bravaReq = getConfig('bravaComboRequirement') as number;
            if (currentBravaMeter >= bravaReq) {
              currentBravaActive = true;
              currentBravaTimer = getConfig('bravaDuration') as number;
              currentBravaMeter = bravaReq;
              gameAudio.playLevelUpStinger();
              addFloatingText(
                '¡FRITANGA BRAVA ACTIVADA!',
                player.x + 85,
                player.y - 50,
                '#f59e0b',
                '¡PUNTOS DOBLES Y ACEITE DORADO!',
              );
            }
          }

          // Random Chilean cry occasionally
          if (currentCombo % 3 === 0) {
            const cry =
              CHILEAN_GOOD_CRIES[
                Math.floor(Math.random() * CHILEAN_GOOD_CRIES.length)
              ];
            addFloatingText(cry, itemCenterX, itemCenterY - 20, '#38bdf8', bannerSub);
          } else {
            addFloatingText(`+${gainedPoints}`, itemCenterX, itemCenterY - 20, '#fde047', bannerSub);
          }

          items.splice(i, 1);
          continue;
        }
      }

      // Reached street floor without being caught
      if (item.y > canvasHeight - 90) {
        if (!item.isHazard) {
          if (currentCombo > 5) {
            currentCombo = Math.floor(currentCombo / 2);
          }
        }
        // Splash on floor
        spawnParticles(
          item.x + item.width / 2,
          canvasHeight - 85,
          6,
          'smoke',
          item.isHazard ? '#0284c7' : '#d97706',
        );
        items.splice(i, 1);
      }
    }

    // --- Check Multi-Stage Level Progression ---
    if (!isEndlessMode) {
      if (currentStageTimer <= 0) {
        if (currentScore >= currentStage.targetScore) {
          // Met quota for this shift!
          if (currentStageIdx < STAGES.length - 1) {
            const nextIdx = currentStageIdx + 1;
            const nextStage = STAGES[nextIdx];

            // Trigger smooth background crossfade
            nextBgKeyRef.current = nextStage.bgKey;
            bgTransitionProgressRef.current = 0;

            currentStageIdx = nextIdx;
            currentStage = nextStage;
            currentStageTimer = nextStage.duration;
            quotaAchievedNotifiedRef.current = -1;

            gameAudio.playLevelUpStinger();
            triggerLevelCelebration(nextStage);
            addFloatingText(
              `¡TURNO ${currentStage.id}/8 COMPLETADO!`,
              canvasWidth / 2,
              canvasHeight / 2 - 80,
              '#22c55e',
              `¡ENTRANDO A ${nextStage.name.toUpperCase()}!`,
            );
          } else {
            // On Final Stage (Stage 8) - Victory!
            if (gameStateRef.current.status === 'PLAYING') {
              gameAudio.playVictoryFanfare();
              setGameState((prev) => ({
                ...prev,
                score: currentScore,
                status: 'VICTORY',
                level: 8,
                currentStageIndex: 7,
                stageTimeRemaining: 0,
              }));
              return;
            }
          }
        } else {
          // Shift ended but quota was NOT met!
          currentLives -= 1;
          screenShakeRef.current = 16;
          gameAudio.playChiptuneExplosion();
          gameAudio.playErrorBuzz();

          if (currentLives <= 0) {
            setGameState((prev) => ({
              ...prev,
              lives: 0,
              score: currentScore,
              status: 'GAME_OVER',
              stageTimeRemaining: 0,
            }));
            return;
          } else {
            // Prórroga de 15 segundos para salvar el sartén
            currentStageTimer = 15;
            addFloatingText(
              '¡SE ENFRIÓ EL SARTÉN!',
              canvasWidth / 2,
              canvasHeight / 2 - 60,
              '#ef4444',
              '¡-1 VIDA! +15s PRÓRROGA',
            );
          }
        }
      }
    }

    // Update Particles
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    const texts = floatingTextsRef.current;
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      t.y -= 45 * deltaTime;
      t.life -= deltaTime;
      if (t.life <= 0) {
        texts.splice(i, 1);
      }
    }

    // Commit high-frequency score/meter to state
    updateScoreAndCheckRecords(currentScore);
    setGameState((prev) => ({
      ...prev,
      lives: currentLives,
      level: currentStage.id,
      currentStageIndex: currentStageIdx,
      combo: currentCombo,
      maxCombo: currentMaxCombo,
      bravaMeter: currentBravaMeter,
      bravaActive: currentBravaActive,
      bravaTimer: currentBravaTimer,
      speedBoostTimer: currentSpeedTimer,
      goldenPanTimer: currentGoldenTimer,
      stageTimeRemaining: Math.max(0, currentStageTimer),
    }));
  };

  // --- GAME DRAW ---
  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);

    ctx.save();
    // Screen shake
    if (screenShakeRef.current > 0) {
      const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
      ctx.translate(shakeX, shakeY);
    }

    // Title / Start Screen Rendering Mode
    if (gameStateRef.current.status === 'START') {
      const titleBg = assets['bg_title_screen'] || assets['bg_1'];
      if (titleBg && titleBg.complete && titleBg.naturalWidth > 0) {
        // Render centered and scaled to properly fit canvas
        const imgAspect = titleBg.naturalWidth / titleBg.naturalHeight;
        const canvasAspect = canvasWidth / canvasHeight;
        let drawW = canvasWidth;
        let drawH = canvasHeight;
        let drawX = 0;
        let drawY = 0;

        if (imgAspect > canvasAspect) {
          drawW = canvasWidth;
          drawH = drawW / imgAspect;
          drawY = (canvasHeight - drawH) / 2;
        } else {
          drawH = canvasHeight;
          drawW = drawH * imgAspect;
          drawX = (canvasWidth - drawW) / 2;
        }

        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(titleBg, drawX, drawY, drawW, drawH);

        // Subtle retro arcade vignette & scanline lighting
        const vigGrad = ctx.createRadialGradient(
          canvasWidth / 2,
          canvasHeight / 2,
          canvasHeight * 0.4,
          canvasWidth / 2,
          canvasHeight / 2,
          canvasWidth * 0.7,
        );
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(1, 'rgba(6,10,18,0.65)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
      ctx.restore();
      return;
    }

    // Draw Active Level Background with smooth crossfade
    const currentBg = assets[currentBgKeyRef.current];
    drawBackground(ctx, currentBg, canvasWidth, canvasHeight, '#0f172a');

    if (nextBgKeyRef.current && bgTransitionProgressRef.current < 1) {
      ctx.save();
      ctx.globalAlpha = bgTransitionProgressRef.current;
      const nextBg = assets[nextBgKeyRef.current];
      drawBackground(ctx, nextBg, canvasWidth, canvasHeight, '#0f172a');
      ctx.restore();
    }

    // Atmospheric warm street light glow overlay
    const ambientGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    ambientGrad.addColorStop(0, 'rgba(15, 23, 42, 0.25)');
    ambientGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.05)');
    ambientGrad.addColorStop(1, 'rgba(245, 158, 11, 0.18)');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Ground fairness drop shadows for falling items
    const items = itemsRef.current;
    for (const item of items) {
      const groundLineY = canvasHeight - 88;
      const progress = Math.min(1, Math.max(0, item.y / groundLineY));
      const shadowW = item.width * (0.4 + progress * 0.6);
      const shadowH = shadowW * 0.3;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        item.x + item.width / 2,
        groundLineY,
        Math.max(1, shadowW / 2),
        Math.max(1, shadowH / 2),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = item.isHazard ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 0, 0, 0.4)';
      ctx.fill();
      ctx.restore();

      // Hazard warning indicator at top if near top of screen
      if (item.isHazard && item.y < 90) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.beginPath();
        ctx.moveTo(item.x + item.width / 2 - 10, 8);
        ctx.lineTo(item.x + item.width / 2 + 10, 8);
        ctx.lineTo(item.x + item.width / 2, 22);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // Draw Falling Items
    for (const item of items) {
      ctx.save();
      ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
      ctx.rotate(item.rotation);

      const assetKey = item.isHazard
        ? item.type === 'dish_soap'
          ? 'hazard_dish_soap'
          : item.type === 'soap_bar'
          ? 'hazard_soap_bar'
          : 'hazard_water_bucket'
        : `item_${item.type}`;

      const img = assets[assetKey];
      drawAsset(
        ctx,
        img,
        -item.width / 2,
        -item.height / 2,
        item.width,
        item.height,
        (fallbackCtx) => {
          fallbackCtx.fillStyle = item.isHazard ? '#ef4444' : '#f59e0b';
          fallbackCtx.fillRect(
            -item.width / 2,
            -item.height / 2,
            item.width,
            item.height,
          );
        },
      );

      ctx.restore();
    }

    // Draw Particles
    const particles = particlesRef.current;
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'bubble' || p.type === 'splash') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'star' || p.type === 'confetti') {
        ctx.beginPath();
        ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * (1 + (1 - alpha))), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Tío Aceite Player Sprite
    const player = playerRef.current;
    const animState = playerAnimStateRef.current;

    // Fritanga Brava golden aura underneath player
    if (gameStateRef.current.bravaActive || (gameStateRef.current.goldenPanTimer ?? 0) > 0) {
      ctx.save();
      const panCenterUnderX = player.facingLeft ? player.x + 55 : player.x + 115;
      const auraGrad = ctx.createRadialGradient(
        panCenterUnderX,
        player.y + 102,
        5,
        panCenterUnderX,
        player.y + 102,
        80,
      );
      auraGrad.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
      auraGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.3)');
      auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(panCenterUnderX, player.y + 102, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Player sprite
    if (spriteRendererRef.current) {
      spriteRendererRef.current.draw(
        ctx,
        animState,
        player.x,
        player.y,
        player.width,
        player.height,
        assets,
        player.facingLeft,
      );
    }

    // Floating Text Popups
    const texts = floatingTextsRef.current;
    for (const t of texts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '900 16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.fillText(t.text, t.x + 2, t.y + 2);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);

      if (t.subText) {
        ctx.font = '700 10px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(t.subText, t.x, t.y + 16);
      }
      ctx.restore();
    }

    // Level Transition Thematic Banner overlay on Canvas
    const banner = levelBannerRef.current;
    if (banner) {
      const bannerAlpha = Math.min(1, banner.timer / 0.5, (banner.maxTimer - banner.timer) / 0.5);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, bannerAlpha));

      const bannerW = 680;
      const bannerH = 88;
      const bannerX = (canvasWidth - bannerW) / 2;
      const bannerY = 80;

      // Glow backdrop
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 16);
      ctx.fill();
      ctx.stroke();

      // Top title
      ctx.font = '900 18px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`★ ${banner.title.toUpperCase()} ★`, canvasWidth / 2, bannerY + 34);

      // Subtitle & location
      ctx.font = '700 10px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`📍 ${banner.location} — "${banner.subtitle}"`, canvasWidth / 2, bannerY + 62);

      ctx.restore();
    }

    ctx.restore();
  };

  // --- Game Loop Hook ---
  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
      if (inputRef.current) {
        const cancelPressed = inputRef.current.actions.cancel;
        if (cancelPressed && !lastCancelRef.current) {
          const currentStatus = gameStateRef.current.status;
          if (currentStatus === 'PLAYING') {
            setIsMenuOpen((prev) => !prev);
          } else if (currentStatus === 'START') {
            void exitChat({});
          } else if (
            ['GAME_OVER', 'VICTORY', 'LEVEL_COMPLETE'].includes(currentStatus)
          ) {
            setGameState((prev) => ({...prev, status: 'START'}));
          }
        }
        lastCancelRef.current = cancelPressed;
      }

      stepperRef.current?.(time, (dt) => updateRef.current(dt));

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawRef.current(ctx);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [exitChat]);

  const isMusicPlaying =
    gameState.status === 'PLAYING' && !isMenuOpen && !isHowToPlayOpen && !isStagesViewOpen;

  const bravaReq = getConfig('bravaComboRequirement') as number;
  const bravaPercent = Math.min(
    100,
    Math.round(((gameState.bravaMeter ?? 0) / bravaReq) * 100),
  );

  const activeStageIdx = gameState.currentStageIndex ?? 0;
  const currentStage = STAGES[Math.min(activeStageIdx, STAGES.length - 1)];
  const isFinalStage = activeStageIdx >= STAGES.length - 1;

  // Level progress bar calculation
  const stageTarget = currentStage.targetScore;
  const stageBase = currentStage.prevScoreRequirement;
  const stageScoreSpan = Math.max(1, stageTarget - stageBase);
  const currentStageScore = Math.max(0, gameState.score - stageBase);
  const stageProgressPercent = isEndlessMode
    ? 100
    : Math.min(100, Math.round((currentStageScore / stageScoreSpan) * 100));
  const isQuotaMet = gameState.score >= currentStage.targetScore;
  const timeRemaining = Math.max(0, Math.ceil(gameState.stageTimeRemaining ?? currentStage.duration));

  return (
    <div className="fixed inset-0 overflow-hidden touch-none flex flex-col items-center justify-between bg-slate-950 text-white font-['Press_Start_2P',monospace] select-none">
      {/* 16-Bit Retro Arcade Stylesheet */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .retro-arcade-text {
          font-family: 'Press Start 2P', monospace;
          text-shadow: 2px 2px 0px #000000;
        }
        .title-salvemos-tio-aceite {
          font-family: 'Press Start 2P', monospace;
          color: #dc2626;
          text-shadow: 
            -2px -2px 0 #ffffff,
             2px -2px 0 #ffffff,
            -2px  2px 0 #ffffff,
             2px  2px 0 #ffffff,
            -2px  0px 0 #ffffff,
             2px  0px 0 #ffffff,
             0px -2px 0 #ffffff,
             0px  2px 0 #ffffff,
             0px  4px 0 #000000,
             3px  4px 0 #000000;
          letter-spacing: 2px;
          line-height: 1.35;
        }
        .retro-arcade-box {
          border: 3px solid #f59e0b;
          box-shadow: 4px 4px 0px #000000, inset 2px 2px 0px rgba(255,255,255,0.2);
        }
        .retro-arcade-btn {
          border: 3px solid #000000;
          box-shadow: 0 4px 0 #78350f, 0 6px 0 #000000;
          transition: transform 0.05s ease, box-shadow 0.05s ease;
        }
        .retro-arcade-btn:active {
          transform: translateY(4px);
          box-shadow: 0 0 0 #000000;
        }
      `}</style>

      {/* Background Music Player */}
      <BackgroundMusic
        url={BACKGROUND_MUSIC_URL}
        isPlaying={isMusicPlaying}
        isMuted={isMusicMuted}
      />

      {/* Asset Preloader Splash */}
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white font-['Press_Start_2P',monospace] p-4 text-center">
          <div className="text-xl md:text-2xl text-yellow-400 mb-4 animate-pulse retro-arcade-text">
            CALENTANDO EL ACEITE EN LOS 8 ESCENARIOS...
          </div>
          <div className="text-[10px] text-amber-300">
            CARGANDO EL FARO, LA RECOVA, BOMBEROS Y MÁS
          </div>
        </div>
      )}

      {/* --- 16-BIT RETRO ARCADE HUD HEADER BAR --- */}
      <header className="w-full bg-slate-950/95 border-b-4 border-amber-500 px-2 sm:px-3 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 z-20 shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
        {/* Left: Vidas de Aceite & Level Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Hearts */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border-2 border-amber-500/80 shadow-[2px_2px_0px_#000]">
            <span className="text-[8px] font-black text-amber-400 hidden md:inline retro-arcade-text">
              VIDAS:
            </span>
            {Array.from({length: 4}).map((_, i) => {
              const hasLife = i < (gameState.lives ?? 3);
              return (
                <div
                  key={i}
                  className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded transition-transform ${
                    hasLife
                      ? 'bg-amber-500/30 border border-yellow-400 scale-100 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                      : 'opacity-20 scale-75 border border-slate-700'
                  }`}>
                  {assets['ui_heart_oil'] ? (
                    <img
                      src={ASSETS_MANIFEST.ui_heart_oil}
                      alt="Vida Aceite"
                      className="w-3.5 h-4 sm:w-4 sm:h-5 object-contain [image-rendering:pixelated]"
                    />
                  ) : (
                    <span className="text-xs">💧</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Level Badge & Clickable Stage Info */}
          <button
            onClick={() => {
              gameAudio.playCrispClick();
              setIsStagesViewOpen(true);
            }}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded-lg border-2 border-amber-500/80 shadow-[2px_2px_0px_#000] text-[8px] sm:text-[9px] text-yellow-300 active:scale-95 transition-all"
            title="Ver mapa de escenarios">
            <span>{currentStage.badgeEmoji}</span>
            <span className="font-bold retro-arcade-text">
              {isEndlessMode ? 'MODO INFINITO' : `NIVEL ${currentStage.id}/8`}
            </span>
            <span className="hidden xl:inline text-amber-300/80 text-[8px]">
              - {currentStage.shortName}
            </span>
          </button>
        </div>

        {/* Center: Shift Timer, Stage Quota Progress & Brava Meter */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Shift Countdown Clock */}
          {!isEndlessMode && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 shadow-[2px_2px_0px_#000] text-[8px] sm:text-[9px] retro-arcade-text font-bold ${
                timeRemaining <= 10
                  ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                  : isQuotaMet
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 border-amber-500/80 text-yellow-300'
              }`}
              title="Tiempo restante de este turno">
              <span>⏱️</span>
              <span>{timeRemaining}s</span>
            </div>
          )}

          {/* Level Progress Bar to next stage */}
          {!isEndlessMode && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[7px] sm:text-[8px] text-amber-300 font-bold retro-arcade-text">
                <span>CUOTA: {currentStage.targetScore.toLocaleString()} PTS</span>
                {isQuotaMet ? (
                  <span className="text-emerald-400 font-black">✓ LISTA</span>
                ) : (
                  <span>({stageProgressPercent}%)</span>
                )}
              </div>
              <div className="w-20 sm:w-28 h-2 bg-slate-900 rounded border border-amber-500/80 mt-0.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    isQuotaMet
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                      : 'bg-gradient-to-r from-emerald-500 to-yellow-400'
                  }`}
                  style={{width: `${stageProgressPercent}%`}}
                />
              </div>
            </div>
          )}

          {/* Brava Meter */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Flame
                size={11}
                className={
                  gameState.bravaActive
                    ? 'text-yellow-300 animate-bounce'
                    : 'text-amber-500'
                }
              />
              <span className="text-[7px] sm:text-[8px] font-black tracking-tight text-yellow-400 retro-arcade-text">
                {gameState.bravaActive
                  ? `BRAVA: ${(gameState.bravaTimer ?? 0).toFixed(1)}s`
                  : `BRAVA: ${gameState.bravaMeter ?? 0}/${bravaReq}`}
              </span>
            </div>
            <div className="w-18 sm:w-24 h-2 bg-slate-900 rounded border border-amber-500/80 mt-0.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  gameState.bravaActive
                    ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500 animate-pulse'
                    : 'bg-gradient-to-r from-amber-600 to-yellow-400'
                }`}
                style={{width: `${gameState.bravaActive ? 100 : bravaPercent}%`}}
              />
            </div>
          </div>

          {(gameState.combo ?? 0) > 1 && (
            <div className="bg-amber-500/20 border-2 border-yellow-400 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black text-yellow-300 animate-pulse retro-arcade-text shadow-[2px_2px_0px_#000]">
              x{1 + Math.floor((gameState.combo ?? 0) / 4) * 0.5}
            </div>
          )}
        </div>

        {/* Right: Score, Record & Pause Menu Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="text-right">
            <div className="text-xs sm:text-sm font-black text-yellow-400 leading-tight retro-arcade-text">
              {gameState.score.toLocaleString()} <span className="text-[7px] text-amber-200">PTS</span>
            </div>
            <div className="text-[7px] text-amber-300/80 flex items-center justify-end gap-1 retro-arcade-text">
              <Trophy size={8} className="text-amber-400" />
              <span>TOP: {highScore.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => {
              gameAudio.playCrispClick();
              setIsMenuOpen(true);
            }}
            aria-label="Abrir Menú"
            className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 hover:bg-amber-600 border-2 border-amber-500 rounded-lg flex items-center justify-center transition-colors shadow-[2px_2px_0px_#000] active:translate-y-0.5">
            <Menu size={16} className="text-yellow-400" />
          </button>
        </div>
      </header>

      {/* --- CANVAS CONTAINER --- */}
      <div className="flex-1 w-full min-h-0 relative flex items-center justify-center bg-slate-950 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
            imageRendering: 'pixelated',
          }}
          className="h-auto max-w-full max-h-full bg-black shadow-2xl drop-shadow-2xl"
        />
      </div>

      {/* --- MOBILE TOUCH CONTROLS --- */}
      {isMobile && gameState.status === 'PLAYING' && !isMenuOpen && !isHowToPlayOpen && !isStagesViewOpen && (
        <div className="w-full px-4 py-2 pb-4 flex items-center justify-between pointer-events-none z-30 shrink-0">
          {/* Directional cluster */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                touchLeftRef.current = true;
              }}
              onPointerUp={() => {
                touchLeftRef.current = false;
              }}
              onPointerCancel={() => {
                touchLeftRef.current = false;
              }}
              className="w-14 h-14 min-w-[56px] min-h-[56px] bg-slate-900 active:bg-amber-600 border-3 border-amber-500 text-yellow-400 rounded-xl flex items-center justify-center text-xl font-black shadow-[3px_3px_0px_#000] active:scale-95 transition-transform touch-none">
              ◀
            </button>
            <button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                touchRightRef.current = true;
              }}
              onPointerUp={() => {
                touchRightRef.current = false;
              }}
              onPointerCancel={() => {
                touchRightRef.current = false;
              }}
              className="w-14 h-14 min-w-[56px] min-h-[56px] bg-slate-900 active:bg-amber-600 border-3 border-amber-500 text-yellow-400 rounded-xl flex items-center justify-center text-xl font-black shadow-[3px_3px_0px_#000] active:scale-95 transition-transform touch-none">
              ▶
            </button>
          </div>

          {/* Dash / Boost button */}
          <div className="pointer-events-auto">
            <button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                touchBoostRef.current = true;
              }}
              onPointerUp={() => {
                touchBoostRef.current = false;
              }}
              onPointerCancel={() => {
                touchBoostRef.current = false;
              }}
              className="w-24 h-14 min-w-[90px] min-h-[56px] bg-gradient-to-r from-amber-500 to-yellow-400 active:from-yellow-400 active:to-amber-500 border-3 border-black text-slate-950 font-black rounded-xl flex items-center justify-center gap-1 shadow-[3px_3px_0px_#000] active:scale-95 transition-transform touch-none text-xs retro-arcade-text">
              <Zap size={18} className="fill-current text-slate-950" />
              <span>PIQUE</span>
            </button>
          </div>
        </div>
      )}

      {/* --- DEDICATED WELCOME / TITLE SCREEN --- */}
      {gameState.status === 'START' && (
        <MenuOverlay tone="neutral" zIndex={40}>
          <div className="w-full max-w-md bg-slate-950/95 backdrop-blur-md border-4 border-amber-500 rounded-2xl p-3 sm:p-4 shadow-[0_0_50px_rgba(245,158,11,0.35),4px_4px_0px_#000] flex flex-col items-center text-center max-h-[94vh] overflow-y-auto">
            {/* Title Screen Banner Illustration: Escala completa sin recortes */}
            {assets['bg_title_screen'] && (
              <div className="w-full mb-2.5 rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.4)] relative bg-slate-900 flex items-center justify-center p-1.5">
                <img
                  src={ASSETS_MANIFEST.bg_title_screen}
                  alt="Portada Salvemos al Tío Aceite"
                  className="w-auto h-auto max-h-[145px] sm:max-h-[175px] max-w-full object-contain [image-rendering:pixelated] drop-shadow-md mx-auto"
                />
                <div className="absolute top-1.5 right-1.5 bg-red-600 border border-white text-white px-2 py-0.5 rounded text-[7px] font-black tracking-wider retro-arcade-text shadow-[2px_2px_0px_#000]">
                  16-BIT EDITION
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 mb-1.5 bg-amber-500/20 border border-amber-400/60 px-2.5 py-0.5 rounded-full text-[7px] sm:text-[8px] text-amber-300 font-bold retro-arcade-text">
              <Sparkles size={11} className="text-yellow-400" />
              <span>GRAN TOUR URBANO • 8 NIVELES</span>
            </div>

            {/* Título en letras rojas con sombra blanca en estilo pixelado */}
            <h1 className="text-sm sm:text-base md:text-lg font-black mb-1 title-salvemos-tio-aceite tracking-wider">
              SALVEMOS AL TÍO ACEITE
            </h1>
            <p className="text-[7px] text-amber-300 font-bold mb-2 retro-arcade-text">
              EL MAESTRO DE LA FRITANGA CALLEJERA
            </p>

            {/* 8 Stages Mini Preview List */}
            <div className="w-full bg-slate-900/90 border-2 border-amber-500/50 rounded-xl p-2 mb-2 text-left text-[7px] text-slate-300 space-y-1 retro-arcade-text">
              <div className="flex items-center justify-between text-yellow-400 pb-0.5 border-b border-slate-800">
                <span>📍 8 ESCENARIOS DE LA SERENA:</span>
                <span className="text-amber-300">META: 26,000 PTS</span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-0.5 text-slate-300">
                {STAGES.map((s) => (
                  <div key={s.id} className="flex items-center gap-1 truncate text-amber-200">
                    <span>{s.badgeEmoji}</span>
                    <span className="truncate">{s.shortName}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top High Score Display & Leaderboard Button */}
            <div className="w-full text-[7px] sm:text-[8px] text-slate-300 mb-2 flex items-center justify-between px-2.5 py-1.5 bg-slate-900 rounded-lg border border-slate-800 retro-arcade-text">
              <span className="text-amber-400 flex items-center gap-1">
                <Trophy size={11} className="text-amber-400" />
                RÉCORD:
              </span>
              <span className="font-bold text-yellow-300">{highScore.toLocaleString()} PTS</span>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsLeaderboardOpen(true);
                }}
                className="text-[7px] text-amber-300 hover:text-white bg-amber-950/80 hover:bg-amber-900 border border-amber-600 px-2 py-0.5 rounded transition-colors ml-2">
                🏆 SALÓN DE LA FAMA
              </button>
            </div>

            {/* Main Action Buttons */}
            <button
              ref={startButtonRef}
              autoFocus
              onClick={() => initGame(false)}
              className="w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 text-slate-950 px-4 py-3 rounded-xl font-black text-xs sm:text-sm tracking-wider transition-all shadow-[0_4px_0_#78350f,0_6px_0_#000] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 mb-2 retro-arcade-text">
              <Play size={16} className="fill-current text-slate-950" />
              <span>EMPEZAR CAMPAÑA (NIVEL 1)</span>
            </button>

            <button
              onClick={() => initGame(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 border-2 border-amber-500/60 text-amber-300 px-4 py-2 rounded-xl font-bold text-[8px] sm:text-[9px] tracking-wider transition-all flex items-center justify-center gap-1.5 mb-2 retro-arcade-text active:scale-98">
              <InfinityIcon size={14} className="text-yellow-400" />
              <span>MODO FRITANGA INFINITA</span>
            </button>

            {/* Secondary Controls Bar */}
            <div className="w-full grid grid-cols-3 gap-2 text-[7px] sm:text-[8px] retro-arcade-text">
              <button
                onClick={() => {
                  const newSfx = gameAudio.toggleMute();
                  setIsSfxMuted(newSfx);
                }}
                className={`py-2 px-1 rounded-lg border flex items-center justify-center gap-1 transition-colors ${
                  isSfxMuted
                    ? 'bg-red-950/60 border-red-800 text-red-300'
                    : 'bg-slate-900 border-amber-500/40 text-yellow-400'
                }`}>
                {isSfxMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                <span>SFX</span>
              </button>

              <button
                onClick={() => {
                  setIsMusicMuted((prev) => !prev);
                }}
                className={`py-2 px-1 rounded-lg border flex items-center justify-center gap-1 transition-colors ${
                  isMusicMuted
                    ? 'bg-red-950/60 border-red-800 text-red-300'
                    : 'bg-slate-900 border-amber-500/40 text-yellow-400'
                }`}>
                {isMusicMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                <span>MÚSICA</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(true);
                }}
                className="py-2 px-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 flex items-center justify-center gap-1 transition-colors">
                <HelpCircle size={11} />
                <span>AYUDA</span>
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* --- IN-GAME PAUSE / SETTINGS MENU OVERLAY --- */}
      {isMenuOpen && !isHowToPlayOpen && !isStagesViewOpen && (
        <MenuOverlay tone="neutral" zIndex={40}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-amber-500 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center">
            <h2 className="text-sm sm:text-base font-black text-yellow-400 mb-3 tracking-wider flex items-center gap-2 retro-arcade-text">
              <Pause size={16} />
              TURNO EN PAUSA
            </h2>

            <div className="w-full bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[8px] text-slate-300 mb-3 grid grid-cols-3 gap-1 text-center retro-arcade-text">
              <div>
                <span className="text-slate-400 block text-[7px]">PUNTAJE:</span>
                <strong className="text-yellow-400">{gameState.score}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[7px]">NIVEL:</span>
                <strong className="text-amber-400">{currentStage.id} / 8</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[7px]">VIDAS:</span>
                <strong className="text-yellow-300">{gameState.lives}</strong>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2 retro-arcade-text">
              <button
                ref={resumeButtonRef}
                autoFocus
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsMenuOpen(false);
                }}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors shadow-[2px_2px_0px_#000]">
                <Play size={14} />
                CONTINUAR COCINANDO
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsStagesViewOpen(true);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 py-2 rounded-xl font-bold text-[8px] flex items-center justify-center gap-1.5 transition-colors">
                <MapPin size={13} />
                VER MAPA DE LOS 8 NIVELES
              </button>

              {/* Audio Controls */}
              <div className="grid grid-cols-2 gap-2 text-[7px]">
                <button
                  onClick={() => {
                    const newSfx = gameAudio.toggleMute();
                    setIsSfxMuted(newSfx);
                  }}
                  className={`py-2 px-2 rounded-xl border font-bold flex items-center justify-center gap-1 transition-colors ${
                    isSfxMuted
                      ? 'bg-red-950/60 border-red-800 text-red-300'
                      : 'bg-slate-900 border-slate-700 text-yellow-400'
                  }`}>
                  {isSfxMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  SFX: {isSfxMuted ? 'OFF' : 'ON'}
                </button>

                <button
                  onClick={() => {
                    setIsMusicMuted((prev) => !prev);
                  }}
                  className={`py-2 px-2 rounded-xl border font-bold flex items-center justify-center gap-1 transition-colors ${
                    isMusicMuted
                      ? 'bg-red-950/60 border-red-800 text-red-300'
                      : 'bg-slate-900 border-slate-700 text-yellow-400'
                  }`}>
                  {isMusicMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  MÚSICA: {isMusicMuted ? 'OFF' : 'ON'}
                </button>
              </div>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(true);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 py-2 rounded-xl font-bold text-[8px] flex items-center justify-center gap-1.5 transition-colors">
                <HelpCircle size={13} />
                INSTRUCCIONES Y OBJETOS
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  initGame(false);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 py-2 rounded-xl font-bold text-[8px] flex items-center justify-center gap-1.5 transition-colors">
                <RotateCcw size={13} />
                REINICIAR DESDE NIVEL 1
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsMenuOpen(false);
                  setGameState((prev) => ({...prev, status: 'START'}));
                }}
                className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 py-2 rounded-xl font-bold text-[8px] transition-colors">
                SALIR AL TÍTULO
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* --- ALL 8 STAGES MAP / TOUR OVERVIEW MODAL --- */}
      {isStagesViewOpen && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-lg bg-slate-950 border-4 border-amber-500 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center max-h-[85vh] overflow-y-auto">
            <h3 className="text-xs sm:text-sm font-black text-yellow-400 mb-2 flex items-center gap-2 retro-arcade-text">
              <MapPin size={16} />
              TOUR DE LA FRITANGA (8 NIVELES)
            </h3>
            <p className="text-[7px] sm:text-[8px] text-amber-300 mb-3 text-center">
              Avanza sumando puntos y desbloquea todos los puestos de La Serena.
            </p>

            <div className="w-full space-y-2 mb-4 text-[7px] sm:text-[8px] retro-arcade-text">
              {STAGES.map((s, idx) => {
                const isCurrent = idx === activeStageIdx && gameState.status === 'PLAYING';
                const isPassed = gameState.score >= s.targetScore;
                return (
                  <div
                    key={s.id}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                      isCurrent
                        ? 'bg-amber-500/20 border-yellow-400 ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]'
                        : isPassed
                        ? 'bg-emerald-950/30 border-emerald-600/60 text-emerald-200'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{s.badgeEmoji}</span>
                      <div className="text-left">
                        <div className="font-black text-yellow-300">{s.name}</div>
                        <div className="text-[6px] sm:text-[7px] text-slate-300">{s.location}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[7px] font-bold text-amber-400">
                        {s.targetScore.toLocaleString()} PTS • {s.duration}s
                      </div>
                      {isPassed ? (
                        <div className="text-[6px] text-emerald-400 flex items-center gap-0.5 justify-end">
                          <CheckCircle size={8} /> COMPLETADO
                        </div>
                      ) : isCurrent ? (
                        <div className="text-[6px] text-yellow-300 animate-pulse">EN CURSO</div>
                      ) : (
                        <div className="text-[6px] text-slate-500">BLOQUEADO</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setIsStagesViewOpen(false);
              }}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors retro-arcade-text shadow-[2px_2px_0px_#000]">
              <X size={15} />
              VOLVER AL JUEGO
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* --- HOW TO PLAY MODAL --- */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-amber-500 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center">
            <h3 className="text-xs sm:text-sm font-black text-yellow-400 mb-3 flex items-center gap-2 retro-arcade-text">
              <Sparkles size={16} />
              GUÍA DE COCINA CALLEJERA
            </h3>

            <div className="w-full text-[8px] text-slate-300 space-y-2 mb-4 overflow-y-auto max-h-[60vh] pr-1 retro-arcade-text">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-bold block mb-1">🎮 CONTROLES:</span>
                <p>• Flechas Izq/Der o A/D para mover.</p>
                <p>• Barra Espacio o Botón PIQUE para Dash.</p>
                <p>• Tocar o arrastrar con el dedo en celular.</p>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-yellow-400 font-bold block mb-1">🍤 COMIDAS Y PUNTOS:</span>
                <p>• Pescado Frito: +50 pts base.</p>
                <p>• Marraqueta / Mayo: +35 / +25 pts.</p>
                <p>• Moneda Dorada: +150 pts.</p>
                <p>• Aceite Puro: +60 pts y +1 Vida.</p>
                <p>• Salsa Ají: Turbo velocidad (5s).</p>
                <p>• Sartén de Oro: 2x Radio y puntos.</p>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-amber-900/60">
                <span className="text-amber-400 font-bold block mb-1">⏱️ TURNOS Y CUOTAS:</span>
                <p>• Cada nivel dura entre 35 y 50 segundos.</p>
                <p>• Cumple la cuota de puntos antes de que acabe el tiempo para avanzar.</p>
                <p>• ¡Si cumples la cuota temprano, sigue sumando ventas extra para tu récord!</p>
                <p>• Si el tiempo termina sin cumplir la cuota: ¡se enfría el sartén y pierdes 1 vida!</p>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-red-900/60">
                <span className="text-red-400 font-bold block mb-1">⚠️ PELIGROS (NO ATRAPAR):</span>
                <p>• Lavalozas, Jabón y Baldes de Agua restan 1 vida y cortan tu racha.</p>
              </div>
            </div>

            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setIsHowToPlayOpen(false);
              }}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors retro-arcade-text shadow-[2px_2px_0px_#000]">
              <X size={15} />
              VOLVER
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* --- GAME OVER OVERLAY --- */}
      {gameState.status === 'GAME_OVER' && (
        <MenuOverlay tone="danger" zIndex={40}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-red-600 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center text-center max-h-[92vh] overflow-y-auto">
            <div className="text-3xl mb-1">🍳💨</div>
            <h2 className="text-base sm:text-lg font-black text-red-400 mb-1 retro-arcade-text">
              ¡SE TE CORTÓ EL ACEITE!
            </h2>
            <p className="text-[7px] sm:text-[8px] text-slate-300 mb-3 retro-arcade-text">
              Quedaste en: <strong className="text-amber-300">{currentStage.name}</strong>
            </p>

            <div className="w-full bg-slate-900 p-3 rounded-xl border border-slate-800 text-left text-[7px] sm:text-[8px] text-slate-300 space-y-1.5 mb-3 retro-arcade-text">
              <div className="flex justify-between">
                <span>PUNTAJE FINAL:</span>
                <strong className="text-yellow-400">{gameState.score.toLocaleString()} PTS</strong>
              </div>
              <div className="flex justify-between">
                <span>NIVEL ALCANZADO:</span>
                <strong className="text-amber-300">Nivel {currentStage.id} / 8</strong>
              </div>
              <div className="flex justify-between">
                <span>RÉCORD HISTÓRICO:</span>
                <strong className="text-amber-300">{highScore.toLocaleString()} PTS</strong>
              </div>
              <div className="flex justify-between">
                <span>MEJOR RACHA:</span>
                <strong className="text-white">{gameState.maxCombo ?? 0} x Combo</strong>
              </div>
            </div>

            {/* In-Game Name Entry for Leaderboard */}
            {!scoreSubmitted ? (
              <div className="w-full bg-slate-900/90 border-2 border-amber-500/80 rounded-xl p-3 mb-3 text-center retro-arcade-text shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <span className="text-[7px] sm:text-[8px] text-yellow-300 block mb-1.5 font-black">
                  🏆 REGISTRA TU NOMBRE (MÁX 8 CARACTERES)
                </span>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-1.5">
                  <input
                    type="text"
                    maxLength={8}
                    value={playerNameInput}
                    onChange={(e) =>
                      setPlayerNameInput(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9_\-\s]/g, '').slice(0, 8)
                      )
                    }
                    placeholder="TU_NOMBRE"
                    className="bg-black border-2 border-amber-400 text-yellow-400 text-center font-black text-xs py-2 px-3 rounded-lg w-full sm:w-44 tracking-widest uppercase focus:outline-none focus:border-red-500 shadow-[inset_2px_2px_0px_#000]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveScore(gameState.score, currentStage.shortName)}
                    className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-[8px] sm:text-[9px] py-2 px-3 rounded-lg shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition-all">
                    GUARDAR EN SALÓN
                  </button>
                </div>
                <span className="text-[6px] text-slate-400">Presiona GUARDAR para rankear en el Salón de la Fama</span>
              </div>
            ) : (
              <div className="w-full bg-amber-500/20 border border-amber-400/80 rounded-xl py-2 px-3 mb-3 text-center retro-arcade-text text-[7px] sm:text-[8px] text-amber-300 flex items-center justify-center gap-2">
                <span>✓ PUNTAJE REGISTRADO: {playerNameInput}</span>
              </div>
            )}

            <div className="w-full flex flex-col gap-2 retro-arcade-text">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsLeaderboardOpen(true);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border-2 border-amber-500/60 text-amber-300 py-2 rounded-xl font-bold text-[8px] transition-colors flex items-center justify-center gap-1.5">
                <Trophy size={13} className="text-yellow-400" />
                VER SALÓN DE LA FAMA
              </button>

              <button
                autoFocus
                onClick={() => initGame(false)}
                className="w-full bg-red-500 hover:bg-red-400 text-white py-2.5 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000]">
                <RotateCw size={15} />
                ¡REINTENTAR CAMPAÑA!
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setGameState((prev) => ({...prev, status: 'START'}));
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 py-2 rounded-xl font-bold text-[8px] transition-colors">
                VOLVER AL TÍTULO
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* --- GRAND VICTORY OVERLAY --- */}
      {gameState.status === 'VICTORY' && (
        <MenuOverlay tone="victory" zIndex={40}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center text-center max-h-[92vh] overflow-y-auto">
            <div className="text-3xl mb-1">👑🏆✨</div>
            <h2 className="text-base sm:text-lg font-black text-yellow-400 mb-1 retro-arcade-text">
              ¡REY SUPREMO DEL SARTÉN!
            </h2>
            <p className="text-[7px] sm:text-[8px] text-emerald-300 mb-3 font-bold retro-arcade-text">
              ¡Completaste con gloria los 8 escenarios de La Serena!
            </p>

            {/* Badges of all 8 cleared stages */}
            <div className="w-full bg-slate-900/90 border border-emerald-500/40 rounded-xl p-2.5 mb-3 text-[6px] sm:text-[7px] text-slate-300 retro-arcade-text">
              <div className="text-yellow-400 font-bold mb-1.5 flex items-center justify-center gap-1">
                <Award size={12} />
                <span>TODOS LOS ESCENARIOS CONQUISTADOS:</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-emerald-300">
                {STAGES.map((s) => (
                  <div key={s.id} className="flex items-center gap-1 bg-emerald-950/40 p-1 rounded border border-emerald-700/50 truncate">
                    <span>{s.badgeEmoji}</span>
                    <span className="truncate">{s.shortName} ✓</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full bg-slate-900 p-3 rounded-xl border border-slate-800 text-left text-[7px] sm:text-[8px] text-slate-300 space-y-1.5 mb-3 retro-arcade-text">
              <div className="flex justify-between">
                <span>PUNTAJE FINAL:</span>
                <strong className="text-yellow-400">{gameState.score.toLocaleString()} PTS</strong>
              </div>
              <div className="flex justify-between">
                <span>RÉCORD HISTÓRICO:</span>
                <strong className="text-amber-300">{highScore.toLocaleString()} PTS</strong>
              </div>
              <div className="flex justify-between">
                <span>MEJOR RACHA:</span>
                <strong className="text-white">{gameState.maxCombo ?? 0} x Combo</strong>
              </div>
            </div>

            {/* In-Game Name Entry for Victory */}
            {!scoreSubmitted ? (
              <div className="w-full bg-slate-900/90 border-2 border-emerald-500/80 rounded-xl p-3 mb-3 text-center retro-arcade-text shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="text-[7px] sm:text-[8px] text-yellow-300 block mb-1.5 font-black">
                  👑 REGISTRA TU VICTORIA (MÁX 8 CARACTERES)
                </span>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-1.5">
                  <input
                    type="text"
                    maxLength={8}
                    value={playerNameInput}
                    onChange={(e) =>
                      setPlayerNameInput(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9_\-\s]/g, '').slice(0, 8)
                      )
                    }
                    placeholder="TU_NOMBRE"
                    className="bg-black border-2 border-emerald-400 text-emerald-400 text-center font-black text-xs py-2 px-3 rounded-lg w-full sm:w-44 tracking-widest uppercase focus:outline-none focus:border-yellow-400 shadow-[inset_2px_2px_0px_#000]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveScore(gameState.score, 'VICTORIA')}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 font-black text-[8px] sm:text-[9px] py-2 px-3 rounded-lg shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition-all">
                    GUARDAR EN SALÓN
                  </button>
                </div>
                <span className="text-[6px] text-slate-400">Inmortaliza tu victoria en la cima de VIRALGAMES</span>
              </div>
            ) : (
              <div className="w-full bg-emerald-500/20 border border-emerald-400/80 rounded-xl py-2 px-3 mb-3 text-center retro-arcade-text text-[7px] sm:text-[8px] text-emerald-300 flex items-center justify-center gap-2">
                <span>✓ GLORIA INMORTAL REGISTRADA: {playerNameInput}</span>
              </div>
            )}

            <div className="w-full flex flex-col gap-2 retro-arcade-text">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsLeaderboardOpen(true);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border-2 border-emerald-500/60 text-emerald-300 py-2 rounded-xl font-bold text-[8px] transition-colors flex items-center justify-center gap-1.5">
                <Trophy size={13} className="text-yellow-400" />
                VER SALÓN DE LA FAMA
              </button>

              <button
                autoFocus
                onClick={() => initGame(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 py-2.5 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000]">
                <InfinityIcon size={16} />
                MODO FRITANGA INFINITA
              </button>

              <button
                onClick={() => initGame(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl font-black text-[8px] transition-colors flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000]">
                <RotateCw size={14} />
                REINICIAR CAMPAÑA (NIVEL 1)
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setGameState((prev) => ({...prev, status: 'START'}));
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 py-2 rounded-xl font-bold text-[8px] transition-colors">
                VOLVER AL TÍTULO
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* --- INTEGRATED 16-BIT ARCADE LEADERBOARD OVERLAY --- */}
      {isLeaderboardOpen && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-amber-500 rounded-2xl p-4 sm:p-5 shadow-[0_0_40px_rgba(245,158,11,0.5),4px_4px_0px_#000] flex flex-col items-center text-center max-h-[90vh] overflow-y-auto retro-arcade-text">
            <div className="text-3xl mb-1">🏆⭐👑</div>
            <h2 className="text-base sm:text-lg font-black text-yellow-400 mb-1">
              SALÓN DE LA FAMA
            </h2>
            <p className="text-[7px] text-amber-300 mb-3">
              MEJORES PUNTAJES • LA FRITANGA SUPREMA
            </p>

            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 mb-3 divide-y divide-slate-800/80 text-[7px] sm:text-[8px]">
              {leaderboard.map((entry, idx) => (
                <div
                  key={idx}
                  className={`py-1.5 px-2 flex items-center justify-between ${
                    idx === 0
                      ? 'text-yellow-300 font-black bg-amber-500/10 rounded'
                      : idx === 1
                      ? 'text-slate-200 font-bold'
                      : idx === 2
                      ? 'text-amber-500 font-bold'
                      : 'text-slate-400'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-left">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                    </span>
                    <span className="tracking-wider">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[6px] text-slate-500 hidden sm:inline">{entry.stageName}</span>
                    <span className="text-yellow-400 font-black">{entry.score.toLocaleString()} PTS</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                gameAudio.playCrispClick();
                setIsLeaderboardOpen(false);
              }}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 py-2.5 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000]">
              <X size={15} />
              CERRAR SALÓN DE LA FAMA
            </button>
          </div>
        </MenuOverlay>
      )}
    </div>
  );
}
