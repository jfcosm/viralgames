// tslint:disable
/* eslint-disable */
import {
  Activity,
  Award,
  ChevronRight,
  Flame,
  Gauge,
  Heart,
  HelpCircle,
  Menu as MenuIcon,
  Play,
  RotateCw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {getConfig} from './constants';
import {SpriteActionConfig, SpriteAnimationState, SpriteRenderer} from './SpriteRenderer';
import BackgroundMusic from './utils/BackgroundMusic';
import { subscribeLeaderboard, saveLeaderboardToDb } from '../../firebase';

export interface LeaderboardEntry {
  name: string;
  score: number;
  stageName: string;
  date: string;
}

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { name: '@el_tarro_bmx', score: 8500, stageName: 'Talca BMX',  date: '1993' },
  { name: 'MANZANA_BMX',  score: 6400, stageName: 'La Zanja',   date: '1993' },
  { name: '@caluga_pique',score: 5100, stageName: 'Los Primos', date: '1993' },
  { name: 'BICI_PANA',    score: 3800, stageName: 'El Patio',   date: '1993' },
  { name: 'DALE_TARRO',   score: 2200, stageName: 'Rampa 1',    date: '1993' },
];
import {
  createFixedStepper,
  drawAsset,
  drawBackground,
  Entity,
  formatTime,
  gameAudio,
  GameState,
  MenuOverlay,
  Overlay,
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

const BACKGROUND_MUSIC_URL = 'assets/audio/bgm_stunt_track.mp3';

// Level layout configurations in authentic Chilean flavor
interface LevelConfig {
  levelNumber: number;
  title: string;
  targetDistance: number; // in meters (1m = 20px)
  targetScore: number;
  obstacles: {
    type: 'barrels' | 'tires' | 'wood_barrier';
    x: number; // offset after ramp
    count?: number;
  }[];
  description: string;
}

const LEVEL_CONFIGS: LevelConfig[] = [
  {
    levelNumber: 1,
    title: 'El patio de los primos',
    targetDistance: 35, // 700px after ramp
    targetScore: 3000,
    obstacles: [
      {type: 'tires', x: 280},
      {type: 'barrels', x: 440},
    ],
    description: '¡Salta por encima de los neumáticos viejos y los tarros de pintura!',
  },
  {
    levelNumber: 2,
    title: 'La zanja del vecino',
    targetDistance: 50, // 1000px after ramp
    targetScore: 4500,
    obstacles: [
      {type: 'tires', x: 260},
      {type: 'barrels', x: 480},
      {type: 'tires', x: 720},
    ],
    description: '¡Cuidado con los tambores de parafina oxida\'os y el tierral!',
  },
  {
    levelNumber: 3,
    title: 'El portón de tablones',
    targetDistance: 65, // 1300px after ramp
    targetScore: 6000,
    obstacles: [
      {type: 'tires', x: 260},
      {type: 'wood_barrier', x: 520},
      {type: 'barrels', x: 820},
      {type: 'tires', x: 1040},
    ],
    description: '¡Pasa volando por encima del tablón de madera en pleno vuelo!',
  },
  {
    levelNumber: 4,
    title: 'El callejón brígido',
    targetDistance: 80, // 1600px after ramp
    targetScore: 8000,
    obstacles: [
      {type: 'wood_barrier', x: 300},
      {type: 'barrels', x: 600},
      {type: 'wood_barrier', x: 920},
      {type: 'barrels', x: 1240},
    ],
    description: '¡Puro filete: tablones gigantes y tambores en fila india!',
  },
  {
    levelNumber: 5,
    title: 'La rampa de la muerte',
    targetDistance: 95, // 1900px after ramp
    targetScore: 10000,
    obstacles: [
      {type: 'tires', x: 280},
      {type: 'wood_barrier', x: 550},
      {type: 'barrels', x: 880},
      {type: 'wood_barrier', x: 1220},
      {type: 'barrels', x: 1540},
    ],
    description: '¡La hazaña definitiva del Tarro! ¡O te hacís famoso o te sacái la chucha!',
  },
];

type StuntPhase =
  | 'RUNWAY' // Pedaleando a toda velocidad
  | 'ANGLE_SELECT' // Pausa en la rampa: cargando ángulo
  | 'LAUNCH_FREEZE' // Despegue slow-mo
  | 'AIRBORNE' // Volando por los aires
  | 'LANDED' // Aterrizaje seguro
  | 'CRASHED' // Porrazo épico
  | 'ROUND_SUMMARY'; // Resumen del intento

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'dust' | 'spark' | 'confetti' | 'speed_line';
}

interface StuntStats {
  speed: number;
  angle: number;
  distance: number;
  targetDistance: number;
  clearedObstacles: boolean;
  landingQuality: 'PERFECT' | 'GREAT' | 'GOOD' | 'CRASH';
  speedBonus: number;
  angleBonus: number;
  distanceBonus: number;
  landingMultiplier: number;
  roundScore: number;
  reactionText: string;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper>>();
  const lastCancelRef = useRef(false);

  const isMobile = useIsMobile();
  const {sdk} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  // Inject 16-Bit Arcade Retro Font dynamically
  useEffect(() => {
    const fontId = 'press-start-2p-font';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Asset manifest
  const ASSETS_MANIFEST: Record<string, string> = {
    bg_dirt_yard: 'assets/images/bg_dirt_yard.png',
    ramp_tire_wood: 'assets/images/ramp_tire_wood.png',
    wooden_ramp: 'assets/images/wooden_ramp.png',
    metal_barrels: 'assets/images/metal_barrels.png',
    obstacle_tire_stack: 'assets/images/obstacle_tire_stack.png',
    obstacle_wood_barrier: 'assets/images/obstacle_wood_barrier.png',
    landing_flag_target: 'assets/images/landing_flag_target.png',
    bmx_rider_idle: 'assets/images/bmx_rider_idle.png',
    bmx_rider_run: 'assets/images/bmx_rider_run.png',
    bmx_rider_jump: 'assets/images/bmx_rider_jump.png',
    bmx_rider_hurt: 'assets/images/bmx_rider_hurt.png',
    bmx_rider_death: 'assets/images/bmx_rider_death.png',
    bmx_rider_dizzy: 'assets/images/bmx_rider_dizzy.png',
  };
  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs');
    const maxSubSteps = getConfig('maxSubSteps');
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  // React HUD & Overlay State
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1,
    lives: 3,
  });
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Track Native Lifecycle with SDK
  usePlaygroundGameLifecycle(gameState, sdk);

  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);

  // --- 16-BIT ARCADE LEADERBOARD STATE ---
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('viralgames_el_tarro_leaderboard');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LEADERBOARD;
  });

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState(() => {
    try {
      return (localStorage.getItem('viralgames_el_tarro_player_name') || 'JUGADOR').slice(0, 12);
    } catch {
      return 'JUGADOR';
    }
  });
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Sincronizar en tiempo real con Cloud Firestore
  useEffect(() => {
    const unsub = subscribeLeaderboard('el-tarro', (cloudEntries: LeaderboardEntry[] | null) => {
      if (cloudEntries && Array.isArray(cloudEntries) && cloudEntries.length > 0) {
        setLeaderboard(cloudEntries);
        try {
          localStorage.setItem('viralgames_el_tarro_leaderboard', JSON.stringify(cloudEntries));
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
    const raw = playerNameInput.trim();
    let cleanName = 'JUGADOR';
    if (raw.startsWith('@')) {
      const handle = raw.slice(1).replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 11);
      cleanName = handle ? `@${handle}` : 'JUGADOR';
    } else if (raw) {
      cleanName = raw.toUpperCase().replace(/[^A-Z0-9_\-\s]/g, '').slice(0, 12) || 'JUGADOR';
    }

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
      localStorage.setItem('viralgames_el_tarro_leaderboard', JSON.stringify(updated));
      localStorage.setItem('viralgames_el_tarro_player_name', cleanName);
    } catch (e) {
      console.error(e);
    }
    saveLeaderboardToDb('el-tarro', updated);
    gameAudio.playVictoryJingle();
    setIsLeaderboardOpen(true);
  };

  // Stunt Stats for end of round review
  const [currentStuntStats, setCurrentStuntStats] = useState<StuntStats | null>(
    null,
  );
  const [hudSpeed, setHudSpeed] = useState(0);
  const [hudAngle, setHudAngle] = useState(45);
  const [hudDistance, setHudDistance] = useState(0);
  const [hudPhase, setHudPhase] = useState<StuntPhase>('RUNWAY');
  const [flightTrickText, setFlightTrickText] = useState('');

  // Input Hook
  const inputRef = useInput(canvasRef, true, {
    width: canvasWidth,
    height: canvasHeight,
  });

  // Mobile virtual buttons tracking
  const virtualPedalLRef = useRef(false);
  const virtualPedalRRef = useRef(false);
  const virtualJumpRef = useRef(false);

  // Key tracking for Q and P pedals
  const keyQPressedRef = useRef(false);
  const keyPPressedRef = useRef(false);
  const spacePressedRef = useRef(false);
  const lastPedalSideRef = useRef<'L' | 'R' | null>(null);

  // High-frequency simulation state (in refs to prevent 60fps React overhead)
  const GROUND_Y = 560; // Ground surface coordinate
  const RAMP_X = 1100; // Ramp start X position
  const RAMP_WIDTH = 260;
  const RAMP_HEIGHT = 146;

  const simRef = useRef({
    phase: 'RUNWAY' as StuntPhase,
    riderX: 120,
    riderY: GROUND_Y - 90,
    vx: 0,
    vy: 0,
    storedSpeed: 0,
    rotation: 0,
    angularVelocity: 0,
    speedEnergy: 0,
    pedalCadenceTimer: 0,
    pedalCount: 0,
    lastPedalSide: null as 'L' | 'R' | null,
    lastPedalTimestamp: 0,
    pedalStreak: 0,
    pedalFeedback: '',
    pedalFeedbackTimer: 0,
    pedalInputQueue: [] as Array<'L' | 'R'>,
    angleNeedle: 15, // In degrees (15 - 80)
    angleHoldTime: 0, // Time in seconds spacebar is held
    angleCharging: false, // Whether player has started charging the angle
    angleLocked: false,
    launchAngle: 45,
    launchSpeed: 0,
    angleEfficiency: 1.0,
    freezeTimer: 0,
    airTime: 0,
    maxHeight: 0,
    cameraX: 0,
    cameraY: 0,
    cameraZoom: 1,
    screenShake: 0,
    particles: [] as Particle[],
    flashAlpha: 0,
    bounces: 0,
    summaryTimer: 0,
    autoAimTimer: 0,
    trickCallout: '',
  });

  // Sprite Renderer Ref
  const spriteRendererRef = useRef<SpriteRenderer | null>(null);
  const animStateRef = useRef<SpriteAnimationState>({
    currentAction: 'idle',
    currentFrame: 0,
    timer: 0,
  });

  // Setup Sprite Renderer
  useEffect(() => {
    const actionConfigs: Record<string, SpriteActionConfig> = {
      idle: {
        imageUrl: 'bmx_rider_idle',
        totalFrames: 4,
        frameWidth: 512,
        frameHeight: 512,
        fps: 8,
        loop: true,
      },
      pedal: {
        imageUrl: 'bmx_rider_hurt',
        totalFrames: 16,
        frameWidth: 512,
        frameHeight: 512,
        fps: 16,
        loop: true,
      },
      flight: {
        imageUrl: 'bmx_rider_jump',
        totalFrames: 16,
        frameWidth: 512,
        frameHeight: 512,
        fps: 12,
        loop: true,
      },
      crash: {
        imageUrl: 'bmx_rider_death',
        totalFrames: 16,
        frameWidth: 512,
        frameHeight: 512,
        fps: 10,
        loop: false,
      },
      dizzy: {
        imageUrl: 'bmx_rider_dizzy',
        totalFrames: 16,
        frameWidth: 512,
        frameHeight: 512,
        fps: 8,
        loop: true,
      },
    };
    spriteRendererRef.current = new SpriteRenderer(actionConfigs);
  }, []);

  // Set action helper
  const setSpriteAction = (action: string) => {
    if (animStateRef.current.currentAction !== action) {
      animStateRef.current = {
        currentAction: action,
        currentFrame: 0,
        timer: 0,
      };
    }
  };

  // Spawn particle helper
  const spawnParticles = (
    x: number,
    y: number,
    count: number,
    type: 'dust' | 'spark' | 'confetti' | 'speed_line',
  ) => {
    const particles = simRef.current.particles;
    for (let i = 0; i < count; i++) {
      let vx = (Math.random() - 0.5) * 6;
      let vy = (Math.random() - 0.5) * 6;
      let color = '#d97706';
      let size = Math.random() * 6 + 3;
      let maxLife = 0.5 + Math.random() * 0.4;

      if (type === 'dust') {
        vx = -Math.random() * 5 - 1;
        vy = -Math.random() * 3;
        color = Math.random() > 0.5 ? '#b45309' : '#d97706';
      } else if (type === 'spark') {
        vx = (Math.random() - 0.5) * 12;
        vy = -Math.random() * 10 - 2;
        color = Math.random() > 0.5 ? '#fbbf24' : '#ef4444';
        size = Math.random() * 4 + 2;
      } else if (type === 'confetti') {
        vx = (Math.random() - 0.5) * 14;
        vy = -Math.random() * 12 - 4;
        const colors = [
          '#f59e0b',
          '#10b981',
          '#3b82f6',
          '#ec4899',
          '#8b5cf6',
          '#fbbf24',
        ];
        color = colors[Math.floor(Math.random() * colors.length)];
        size = Math.random() * 8 + 4;
        maxLife = 1.2 + Math.random() * 0.8;
      } else if (type === 'speed_line') {
        vx = -Math.random() * 15 - 10;
        vy = (Math.random() - 0.5) * 2;
        color = 'rgba(255, 255, 255, 0.8)';
        size = Math.random() * 40 + 20;
        maxLife = 0.25;
      }

      particles.push({
        x,
        y,
        vx,
        vy,
        color,
        size,
        life: maxLife,
        maxLife,
        type,
      });
    }
  };

  // Reset a stunt run
  const resetRun = useCallback((playVoice = true) => {
    simRef.current = {
      phase: 'RUNWAY' as StuntPhase,
      riderX: 140,
      riderY: GROUND_Y - 80,
      vx: 0,
      vy: 0,
      storedSpeed: 0,
      rotation: 0,
      angularVelocity: 0,
      speedEnergy: 0,
      pedalCadenceTimer: 0,
      pedalCount: 0,
      lastPedalSide: null,
      lastPedalTimestamp: 0,
      pedalStreak: 0,
      pedalFeedback: '',
      pedalFeedbackTimer: 0,
      pedalInputQueue: [],
      angleNeedle: 15,
      angleHoldTime: 0,
      angleCharging: false,
      angleLocked: false,
      launchAngle: 45,
      launchSpeed: 0,
      angleEfficiency: 1.0,
      freezeTimer: 0,
      airTime: 0,
      maxHeight: 0,
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1,
      screenShake: 0,
      particles: [],
      flashAlpha: 0,
      bounces: 0,
      summaryTimer: 0,
      autoAimTimer: 0,
      trickCallout: '',
    };
    lastPedalSideRef.current = null;
    setSpriteAction('idle');
    setHudPhase('RUNWAY');
    setHudSpeed(0);
    setHudAngle(15);
    setHudDistance(0);
    setFlightTrickText('');
    setCurrentStuntStats(null);
    if (playVoice) {
      gameAudio.playVoiceIntro();
    }
  }, []);

  // Initialize Game from Main Menu
  const initGame = useCallback(() => {
    const maxLives = getConfig('maxLives') as number;
    setGameState({
      status: 'PLAYING',
      score: 0,
      level: 1,
      lives: maxLives,
    });
    setIsGameMenuOpen(false);
    setIsHowToPlayOpen(false);
    setIsLeaderboardOpen(false);
    setScoreSubmitted(false);
    resetRun();

    if (sdk) {
      sdk.startGame();
    }
    gameAudio.playPowerupChime();
  }, [sdk, resetRun]);

  // Restart Current Level
  const restartLevel = useCallback(() => {
    const maxLives = getConfig('maxLives') as number;
    setGameState((prev) => ({
      ...prev,
      status: 'PLAYING',
      lives: maxLives,
    }));
    setIsGameMenuOpen(false);
    setIsHowToPlayOpen(false);
    resetRun();
    gameAudio.playConfirmSelect();
  }, [resetRun]);

  // Advance to Next Level
  const nextLevel = useCallback(() => {
    const maxLives = getConfig('maxLives') as number;
    const currentLvl = gameStateRef.current.level;
    if (currentLvl >= LEVEL_CONFIGS.length) {
      setGameState((prev) => ({...prev, status: 'VICTORY'}));
      gameAudio.playVictoryFanfare();
      return;
    }

    setGameState((prev) => ({
      ...prev,
      level: prev.level + 1,
      lives: maxLives,
    }));
    resetRun(false);
    gameAudio.playLevelUpStinger();
    gameAudio.playVoiceSubirNivel();
  }, [resetRun]);

  // Handle Level Failure / Life Loss
  const handleAttemptFailed = useCallback(() => {
    setGameState((prev) => {
      const remainingLives = (prev.lives ?? 1) - 1;
      if (remainingLives <= 0) {
        gameAudio.playDefeatMotif();
        return {
          ...prev,
          lives: 0,
          status: 'GAME_OVER',
        };
      }
      return {
        ...prev,
        lives: remainingLives,
      };
    });
  }, []);

  // Auto-play listener for preview / test
  const hasAutoplayed = useRef(false);
  useEffect(() => {
    if (
      !hasAutoplayed.current &&
      new URLSearchParams(window.location.search).has('autoplay')
    ) {
      hasAutoplayed.current = true;
      initGame();
    }
  }, [initGame]);

  useEffect(() => {
    gameAudio.preloadAllVoices();
  }, []);

  // Sound effects on status change
  useEffect(() => {
    if (gameState.status === 'GAME_OVER') {
      gameAudio.playVoiceFinFracaso();
    } else if (gameState.status === 'VICTORY') {
      gameAudio.playVoiceFinExitoso();
    }
  }, [gameState.status]);

  // Keyboard Event Listeners for Q, P, Spacebar, Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') {
        if (!keyQPressedRef.current) {
          simRef.current.pedalInputQueue.push('L');
        }
        keyQPressedRef.current = true;
      }
      if (e.key === 'p' || e.key === 'P') {
        if (!keyPPressedRef.current) {
          simRef.current.pedalInputQueue.push('R');
        }
        keyPPressedRef.current = true;
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        spacePressedRef.current = true;
      }
      if (e.key === 'Escape') {
        if (gameStateRef.current.status === 'PLAYING') {
          setIsGameMenuOpen((prev) => !prev);
          gameAudio.playCrispClick();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') keyQPressedRef.current = false;
      if (e.key === 'p' || e.key === 'P') keyPPressedRef.current = false;
      if (e.key === ' ' || e.code === 'Space') spacePressedRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Focus helper for Primary Action Buttons
  const startButtonRef = useAutoFocus<HTMLButtonElement>(
    gameState.status === 'START',
  );

  // --- CORE GAME SIMULATION UPDATE ---
  const update = (dt: number) => {
    if (gameStateRef.current.status !== 'PLAYING' || isGameMenuOpen) return;

    const sim = simRef.current;
    const currentLevel =
      LEVEL_CONFIGS[
        Math.min(gameStateRef.current.level - 1, LEVEL_CONFIGS.length - 1)
      ];

    const pedalBoostForce = getConfig('pedalBoostForce') as number;
    const maxRunwaySpeed = getConfig('maxRunwaySpeed') as number;
    const runwayDecel = getConfig('runwayDecel') as number;
    const gravity = getConfig('gravity') as number;

    // Advance Animation State
    if (spriteRendererRef.current) {
      animStateRef.current = spriteRendererRef.current.getNextState(
        animStateRef.current,
        dt,
      );
    }

    // Screen Shake Decay
    if (sim.screenShake > 0) {
      sim.screenShake = Math.max(0, sim.screenShake - dt * 20);
    }
    if (sim.flashAlpha > 0) {
      sim.flashAlpha = Math.max(0, sim.flashAlpha - dt * 3);
    }

    // Update Particles
    for (let i = sim.particles.length - 1; i >= 0; i--) {
      const p = sim.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        sim.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'confetti' || p.type === 'spark') {
        p.vy += 12 * dt;
      }
    }

    // ==========================================
    // PHASE 1: RUNWAY SPRINT (PEDALEO CON CUÁTICA Y RITMO REBALANCEADO)
    // ==========================================
    if (sim.phase === 'RUNWAY') {
      const now = performance.now() / 1000;
      let strokeSide: 'L' | 'R' | null = null;

      // Drain queued key/touch hits
      if (sim.pedalInputQueue.length > 0) {
        strokeSide = sim.pedalInputQueue.shift()!;
      }

      if (sim.pedalFeedbackTimer > 0) {
        sim.pedalFeedbackTimer = Math.max(0, sim.pedalFeedbackTimer - dt);
        if (sim.pedalFeedbackTimer === 0) sim.pedalFeedback = '';
      }

      if (strokeSide) {
        const isAlternating =
          sim.lastPedalSide === null || sim.lastPedalSide !== strokeSide;
        const timeDelta =
          sim.lastPedalTimestamp > 0 ? now - sim.lastPedalTimestamp : 0.2;
        sim.lastPedalTimestamp = now;
        sim.lastPedalSide = strokeSide;
        lastPedalSideRef.current = strokeSide;

        if (isAlternating) {
          sim.pedalCount++;
          // Timing evaluation: optimal rhythmic cadence is between 0.08s and 0.24s
          let cadenceQuality = 1.0;
          let feedbackText = '¡BUEN RITMO!';

          if (timeDelta < 0.065) {
            // Tapping too fast / spamming
            cadenceQuality = 0.6;
            feedbackText = '¡CALMA EL RITMO!';
          } else if (timeDelta >= 0.08 && timeDelta <= 0.22) {
            // Sweet spot rhythm
            cadenceQuality = 1.25;
            sim.pedalStreak = Math.min(20, sim.pedalStreak + 1);
            feedbackText =
              sim.pedalStreak >= 6 ? '★ ¡RITMO PERFECTO!' : '¡WENA CADENCIA!';
          } else if (timeDelta <= 0.35) {
            cadenceQuality = 0.9;
            sim.pedalStreak = Math.max(1, sim.pedalStreak);
            feedbackText = '¡DALE MÁS DURO!';
          } else {
            // Cadence dropped
            cadenceQuality = 0.7;
            sim.pedalStreak = 0;
            feedbackText = '¡APURA LAS PATAS!';
          }

          // Speed ratio with diminishing returns curve (the last 30% requires real rhythm & effort)
          const currentRatio = Math.min(1, sim.vx / maxRunwaySpeed);
          const diminishingFactor = Math.max(
            0.12,
            1 - 0.78 * Math.pow(currentRatio, 1.6),
          );

          const boost =
            pedalBoostForce * cadenceQuality * diminishingFactor * 1.35;
          sim.vx = Math.min(maxRunwaySpeed, sim.vx + boost);

          if (currentRatio > 0.92) {
            feedbackText = '⚡ ¡MÁXIMA VELOCIDAD!';
          }

          sim.pedalFeedback = feedbackText;
          sim.pedalFeedbackTimer = 0.45;

          gameAudio.playJumpLandingThud();
          spawnParticles(sim.riderX - 40, GROUND_Y - 10, 4, 'dust');

          if (sim.vx > maxRunwaySpeed * 0.7) {
            spawnParticles(
              sim.riderX + Math.random() * 200,
              GROUND_Y - 50 + (Math.random() - 0.5) * 80,
              1,
              'speed_line',
            );
          }
        } else {
          // Same side tapped repeatedly -> penalize cadence
          sim.pedalStreak = 0;
          sim.pedalFeedback = '¡ALTERNÁ LAS PATAS! (Q / P)';
          sim.pedalFeedbackTimer = 0.5;
          sim.vx = Math.max(0, sim.vx + pedalBoostForce * 0.15);
        }
      }

      // Realistic Dynamic Resistance (Rolling Friction + Quadratic Aerodynamic Drag)
      const currentRatio = sim.vx / maxRunwaySpeed;
      const rollingDrag = 1.2;
      const aeroDrag = 0.016 * sim.vx * sim.vx;
      const totalDecel = (rollingDrag + aeroDrag) * dt;

      sim.vx = Math.max(0, sim.vx - totalDecel);
      sim.riderX += sim.vx;
      sim.speedEnergy = (sim.vx / maxRunwaySpeed) * 100;

      if (sim.vx > 2) {
        setSpriteAction('pedal');
      } else {
        setSpriteAction('idle');
      }

      // Reaching launch ramp: pause movement and enter Angle Selection phase
      if (sim.riderX >= RAMP_X + RAMP_WIDTH * 0.6) {
        sim.phase = 'ANGLE_SELECT';
        setHudPhase('ANGLE_SELECT');
        sim.storedSpeed = Math.max(12, sim.vx);
        sim.vx = 0;
        sim.vy = 0;
        sim.riderX = RAMP_X + RAMP_WIDTH * 0.85;
        sim.riderY = GROUND_Y - 80 - 0.85 * RAMP_HEIGHT;
        sim.rotation = -Math.atan2(RAMP_HEIGHT, RAMP_WIDTH);
        sim.angleNeedle = 15;
        sim.angleHoldTime = 0;
        sim.angleCharging = false;
        sim.angleLocked = false;
        gameAudio.playConfirmSelect();
      }
    }

    // ==========================================
    // PHASE 2: SELECCIÓN DE ÁNGULO CON TINO
    // ==========================================
    else if (sim.phase === 'ANGLE_SELECT') {
      sim.vx = 0;
      sim.vy = 0;
      sim.riderX = RAMP_X + RAMP_WIDTH * 0.85;
      sim.riderY = GROUND_Y - 80 - 0.85 * RAMP_HEIGHT;
      sim.rotation = -Math.atan2(RAMP_HEIGHT, RAMP_WIDTH);

      const spaceHeld =
        spacePressedRef.current ||
        virtualJumpRef.current ||
        (inputRef.current?.actions.confirm ?? false) ||
        (inputRef.current?.pointer.down ?? false);

      if (spaceHeld && !sim.angleLocked) {
        sim.angleCharging = true;
        sim.angleHoldTime += dt;

        // Holding for 0.5s gives exactly 45°:
        // angle = 15 + (holdDuration / 0.5) * 30
        const currentAngle = Math.min(
          80,
          Math.max(15, 15 + (sim.angleHoldTime / 0.5) * 30),
        );
        sim.angleNeedle = currentAngle;

        if (sim.angleHoldTime >= 1.15) {
          sim.angleLocked = true;
        }
      } else if (sim.angleCharging || sim.angleLocked) {
        const finalAngle = Math.round(sim.angleNeedle);
        sim.launchAngle = finalAngle;
        sim.angleLocked = true;

        const theta = (finalAngle * Math.PI) / 180;
        const efficiency = Math.max(0.15, Math.sin(2 * theta));
        sim.angleEfficiency = efficiency;

        const launchMagnitude = sim.storedSpeed * (0.65 + 0.6 * efficiency);
        sim.launchSpeed = launchMagnitude;
        sim.vx = launchMagnitude * Math.cos(theta);
        sim.vy = -launchMagnitude * Math.sin(theta);
        sim.angularVelocity = ((45 - finalAngle) * 0.04 * Math.PI) / 180;

        sim.phase = 'LAUNCH_FREEZE';
        setHudPhase('LAUNCH_FREEZE');
        sim.freezeTimer = 0.12;
        sim.flashAlpha = 0.85;
        sim.screenShake = 10;
        gameAudio.playRetroJump();
        gameAudio.playVoiceTranscurso();
        spawnParticles(sim.riderX, sim.riderY + 20, 16, 'spark');
      }
    }

    // ==========================================
    // PHASE 3: DESPEGUE
    // ==========================================
    else if (sim.phase === 'LAUNCH_FREEZE') {
      sim.freezeTimer -= dt;
      if (sim.freezeTimer <= 0) {
        sim.phase = 'AIRBORNE';
        setHudPhase('AIRBORNE');
        setSpriteAction('flight');
      }
    }

    // ==========================================
    // PHASE 4: VUELO POR LOS AIRES (CHILEAN AIR STUNT)
    // ==========================================
    else if (sim.phase === 'AIRBORNE') {
      sim.airTime += dt;
      sim.vy += gravity * dt;
      sim.riderX += sim.vx;
      sim.riderY += sim.vy;
      sim.rotation = Math.atan2(sim.vy, sim.vx);

      // Chilean stunt callouts based on airborne height & airtime
      if (sim.airTime > 0.4 && !sim.trickCallout) {
        if (Math.abs(sim.launchAngle - 45) <= 4) {
          sim.trickCallout = '¡SUPERMÁN AL PEO!';
        } else if (sim.launchAngle > 55) {
          sim.trickCallout = '¡GIRO MORTAL!';
        } else {
          sim.trickCallout = '¡VOLANDO COMO CONDORITO!';
        }
        setFlightTrickText(sim.trickCallout);
      }

      if (Math.random() < 0.4) {
        spawnParticles(sim.riderX - 30, sim.riderY + 10, 1, 'spark');
      }

      const rampEnd = RAMP_X + RAMP_WIDTH;
      for (const obs of currentLevel.obstacles) {
        const obsX = rampEnd + obs.x;
        let obsW = 100;
        let obsH = 90;
        if (obs.type === 'wood_barrier') {
          obsW = 80;
          obsH = 156;
        } else if (obs.type === 'barrels') {
          obsW = 150;
          obsH = 112;
        } else if (obs.type === 'tires') {
          obsW = 130;
          obsH = 94;
        }

        const obsY = GROUND_Y - obsH;
        const riderW = 80;
        const riderH = 80;
        const riderLeft = sim.riderX - riderW / 2;
        const riderRight = sim.riderX + riderW / 2;
        const riderTop = sim.riderY - riderH / 2;
        const riderBottom = sim.riderY + riderH / 2;

        if (
          riderRight > obsX &&
          riderLeft < obsX + obsW &&
          riderBottom > obsY &&
          riderTop < GROUND_Y
        ) {
          // Obstacle crash!
          sim.phase = 'CRASHED';
          setHudPhase('CRASHED');
          setSpriteAction('crash');
          sim.vx = sim.vx * 0.2;
          sim.vy = -6;
          sim.screenShake = 16;
          sim.flashAlpha = 0.9;
          gameAudio.playChiptuneExplosion();
          gameAudio.playGeneralDamage();
          gameAudio.playVoiceCaida();
          spawnParticles(sim.riderX, sim.riderY, 25, 'spark');

          const distMeters = Math.max(
            0,
            Math.round((sim.riderX - rampEnd) / 20),
          );

          const crashReactions = [
            '¡EL TARRO SE SACÓ LA CHUCHA!',
            '¡SE HIZO PEBRE!',
            '¡TE FUISTE A LA CTM!',
            '¡CSM QUÉ PORRAZO!',
          ];
          const chosenReaction =
            crashReactions[Math.floor(Math.random() * crashReactions.length)];

          const stats: StuntStats = {
            speed: Math.round(sim.launchSpeed * 2.5),
            angle: sim.launchAngle,
            distance: distMeters,
            targetDistance: currentLevel.targetDistance,
            clearedObstacles: false,
            landingQuality: 'CRASH',
            speedBonus: Math.round(sim.speedEnergy * 10),
            angleBonus: 0,
            distanceBonus: distMeters * 20,
            landingMultiplier: 0,
            roundScore: Math.round(distMeters * 20),
            reactionText: chosenReaction,
          };
          setCurrentStuntStats(stats);
          handleAttemptFailed();
          return;
        }
      }

      // Check Ground Contact / Landing
      if (sim.riderY >= GROUND_Y - 80) {
        sim.riderY = GROUND_Y - 80;
        const rampEnd = RAMP_X + RAMP_WIDTH;
        const jumpDistanceMeters = Math.max(
          0,
          Math.round((sim.riderX - rampEnd) / 20),
        );
        const angleDiff = Math.abs(sim.launchAngle - 45);

        // Extreme angles cause wipeout crashes
        if (sim.launchAngle < 25 || sim.launchAngle > 65) {
          sim.phase = 'CRASHED';
          setHudPhase('CRASHED');
          setSpriteAction('crash');
          sim.screenShake = 14;
          sim.vx = 4;
          gameAudio.playChiptuneExplosion();
          gameAudio.playVoiceCaida();
          spawnParticles(sim.riderX, GROUND_Y - 20, 20, 'dust');

          const stats: StuntStats = {
            speed: Math.round(sim.launchSpeed * 2.5),
            angle: sim.launchAngle,
            distance: jumpDistanceMeters,
            targetDistance: currentLevel.targetDistance,
            clearedObstacles: false,
            landingQuality: 'CRASH',
            speedBonus: Math.round(sim.speedEnergy * 10),
            angleBonus: 0,
            distanceBonus: jumpDistanceMeters * 30,
            landingMultiplier: 0,
            roundScore: jumpDistanceMeters * 30,
            reactionText:
              sim.launchAngle < 25
                ? '¡MUY PLANO! ¡SE SACÓ LA CHUCHA!'
                : '¡MUY EMPINAO! ¡CAYÓ DE ESPALDA!',
          };
          setCurrentStuntStats(stats);
          handleAttemptFailed();
        } else {
          // Safe Landing!
          sim.phase = 'LANDED';
          setHudPhase('LANDED');
          setSpriteAction('idle');
          sim.rotation = 0;
          sim.screenShake = 6;
          gameAudio.playJumpLandingThud();
          gameAudio.playVoiceExito();

          let quality: 'PERFECT' | 'GREAT' | 'GOOD' = 'GOOD';
          let landingMult = 1.0;
          let angleScore = Math.max(0, 2000 - angleDiff * 100);
          let reaction = '¡ZAFÓ EL TARRO!';

          if (angleDiff <= (getConfig('perfectAngleTolerance') as number)) {
            quality = 'PERFECT';
            landingMult = 2.0;
            angleScore = 2000;
            reaction = '¡PURO FILETE, MEDIO SALTO!';
            spawnParticles(sim.riderX, GROUND_Y - 80, 40, 'confetti');
            gameAudio.playVictoryFanfare();
          } else if (
            angleDiff <= (getConfig('greatAngleTolerance') as number)
          ) {
            quality = 'GREAT';
            landingMult = 1.5;
            reaction = '¡WENA CHORO, QUÉ SALTO!';
            spawnParticles(sim.riderX, GROUND_Y - 40, 20, 'spark');
            gameAudio.playCoinPickup();
          } else {
            spawnParticles(sim.riderX, GROUND_Y - 20, 10, 'dust');
          }

          const speedScore = Math.round(sim.speedEnergy * 100);
          const distanceScore = jumpDistanceMeters * 50;
          const totalRoundScore = Math.round(
            (speedScore + angleScore + distanceScore) * landingMult,
          );

          const cleared = jumpDistanceMeters >= currentLevel.targetDistance;

          const stats: StuntStats = {
            speed: Math.round(sim.launchSpeed * 2.5),
            angle: sim.launchAngle,
            distance: jumpDistanceMeters,
            targetDistance: currentLevel.targetDistance,
            clearedObstacles: cleared,
            landingQuality: quality,
            speedBonus: speedScore,
            angleBonus: angleScore,
            distanceBonus: distanceScore,
            landingMultiplier: landingMult,
            roundScore: totalRoundScore,
            reactionText: cleared
              ? reaction
              : `¡TE FALTÓ CAZUELA! (${jumpDistanceMeters}m de ${currentLevel.targetDistance}m)`,
          };
          setCurrentStuntStats(stats);

          setGameState((prev) => ({
            ...prev,
            score: prev.score + totalRoundScore,
          }));

          if (!cleared) {
            handleAttemptFailed();
          }
        }
      }
    }

    // ==========================================
    // PHASE 5: LANDED ROLLOUT
    // ==========================================
    else if (sim.phase === 'LANDED') {
      sim.vx = Math.max(0, sim.vx - dt * 15);
      sim.riderX += sim.vx;
      if (sim.vx > 1) {
        spawnParticles(sim.riderX - 30, GROUND_Y - 10, 1, 'dust');
      }
      sim.summaryTimer += dt;
      if (sim.summaryTimer >= 1.5) {
        sim.phase = 'ROUND_SUMMARY';
        setHudPhase('ROUND_SUMMARY');
        gameAudio.playVoiceCelebracion();
      }
    }

    // ==========================================
    // PHASE 6: CRASH ROLLOUT
    // ==========================================
    else if (sim.phase === 'CRASHED') {
      sim.vx = Math.max(0, sim.vx - dt * 8);
      sim.riderX += sim.vx;
      sim.summaryTimer += dt;
      if (sim.summaryTimer >= 2.0) {
        sim.phase = 'ROUND_SUMMARY';
        setHudPhase('ROUND_SUMMARY');
      }
    }

    // Camera Tracking
    const targetCamX = Math.max(0, sim.riderX - canvasWidth * 0.35);
    sim.cameraX += (targetCamX - sim.cameraX) * 0.1;

    // Sync HUD Readouts
    setHudSpeed(Math.round(sim.vx * 2.5));
    setHudAngle(Math.round(sim.angleNeedle));
    const rampEnd = RAMP_X + RAMP_WIDTH;
    setHudDistance(
      sim.riderX > rampEnd ? Math.round((sim.riderX - rampEnd) / 20) : 0,
    );
  };

  // --- RENDERING CANVAS ---
  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);

    const sim = simRef.current;
    const currentLevel =
      LEVEL_CONFIGS[
        Math.min(gameStateRef.current.level - 1, LEVEL_CONFIGS.length - 1)
      ];

    // Screen Shake Offset
    const shakeX = (Math.random() - 0.5) * sim.screenShake;
    const shakeY = (Math.random() - 0.5) * sim.screenShake;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. Draw Parallax Background (Seamless Infinite Tiling)
    const bgImg = assets['bg_dirt_yard'];
    const bgW = getConfig('assetBgDirtYardWidth') as number;
    const bgH = getConfig('assetBgDirtYardHeight') as number;
    const bgParallaxX = ((sim.cameraX * 0.4) % bgW + bgW) % bgW;

    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      for (let x = -bgParallaxX - bgW; x < canvasWidth + bgW * 2; x += bgW) {
        ctx.drawImage(bgImg, x, 0, bgW, bgH);
      }
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(0.6, '#bae6fd');
      grad.addColorStop(0.7, '#65a30d');
      grad.addColorStop(1, '#78350f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 2. World Space Translation & Continuous Infinite Ground Pipeline
    ctx.save();
    ctx.translate(-sim.cameraX, 0);

    const viewLeft = sim.cameraX - 500;
    const viewRight = sim.cameraX + canvasWidth + 500;
    const groundWidth = viewRight - viewLeft;

    // Deep Dirt Sub-base
    ctx.fillStyle = '#451a03';
    ctx.fillRect(viewLeft, GROUND_Y + 40, groundWidth, canvasHeight - (GROUND_Y + 40) + 200);

    // Mid Dirt Layer
    ctx.fillStyle = '#78350f';
    ctx.fillRect(viewLeft, GROUND_Y, groundWidth, 40);

    // Top Compacted Track / Dirt Soil Surface
    ctx.fillStyle = '#92400e';
    ctx.fillRect(viewLeft, GROUND_Y, groundWidth, 12);

    // Grass & Weed Top Fringe
    ctx.fillStyle = '#4d7c0f';
    ctx.fillRect(viewLeft, GROUND_Y - 4, groundWidth, 6);
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(viewLeft, GROUND_Y - 2, groundWidth, 3);

    // Ground details & tire skids procedurally drawn in viewport
    const firstDetailChunk = Math.floor(viewLeft / 120) * 120;
    for (let gx = firstDetailChunk; gx <= viewRight; gx += 120) {
      ctx.fillStyle = 'rgba(69, 26, 3, 0.4)';
      ctx.fillRect(gx + 20, GROUND_Y + 8, 45, 3);
      ctx.fillRect(gx + 80, GROUND_Y + 16, 25, 2);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
      ctx.fillRect(gx + 50, GROUND_Y + 2, 30, 2);
    }

    const rampEnd = RAMP_X + RAMP_WIDTH;

    // Runway Approach Ground Markings (Before ramp)
    if (viewLeft < RAMP_X) {
      for (let rx = 100; rx <= RAMP_X; rx += 150) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.fillRect(rx, GROUND_Y - 8, 30, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('>>>', rx + 4, GROUND_Y + 18);
      }
    }

    // 3. Dynamic Infinite Distance Markers Across the Whole Jump Area
    const minM = Math.max(10, Math.floor((viewLeft - rampEnd) / 200) * 10);
    const maxM = Math.ceil((viewRight - rampEnd) / 200) * 10 + 20;

    for (let d = minM; d <= maxM; d += 10) {
      if (d < 10) continue;
      const markerX = rampEnd + d * 20;
      const is100m = d % 100 === 0;
      const is50m = d % 50 === 0;

      if (is100m) {
        // 100m / 200m / 500m / 1000m Grand Milestone Landmark Arch & Banner
        ctx.save();
        // Dual wooden/metal posts
        ctx.fillStyle = '#065f46';
        ctx.fillRect(markerX - 12, GROUND_Y - 70, 6, 70);
        ctx.fillRect(markerX + 8, GROUND_Y - 70, 6, 70);

        // Milestone Signboard
        ctx.fillStyle = '#047857';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(markerX - 38, GROUND_Y - 95, 78, 28, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.fillStyle = '#ecfdf5';
        ctx.textAlign = 'center';
        ctx.fillText(`★ ${d}m ★`, markerX + 1, GROUND_Y - 77);

        // Ground Stripe
        ctx.fillStyle = '#10b981';
        ctx.fillRect(markerX - 3, GROUND_Y - 6, 8, 30);
        ctx.restore();
      } else if (is50m) {
        // 50m / 150m / 250m Distinctive Milestone Post & Flag
        ctx.save();
        ctx.fillStyle = '#c2410c';
        ctx.fillRect(markerX - 3, GROUND_Y - 45, 6, 45);

        // Orange Banner
        ctx.fillStyle = '#ea580c';
        ctx.strokeStyle = '#fdba74';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(markerX - 26, GROUND_Y - 65, 54, 20, 3);
        ctx.fill();
        ctx.stroke();

        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = '#fff7ed';
        ctx.textAlign = 'center';
        ctx.fillText(`${d}m`, markerX + 1, GROUND_Y - 51);

        // Ground Stripe
        ctx.fillStyle = '#f97316';
        ctx.fillRect(markerX - 2, GROUND_Y - 4, 5, 25);
        ctx.restore();
      } else {
        // Standard 10m Post
        ctx.save();
        ctx.fillStyle = '#d97706';
        ctx.fillRect(markerX - 2, GROUND_Y - 18, 4, 18);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.fillRect(markerX - 1, GROUND_Y, 2, 20);

        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText(`${d}m`, markerX, GROUND_Y + 22);
        ctx.restore();
      }
    }

    // Draw Target Landing Flag
    const targetFlagX = rampEnd + currentLevel.targetDistance * 20;
    const flagImg = assets['landing_flag_target'];
    const flagW = getConfig('assetLandingFlagTargetWidth') as number;
    const flagH = getConfig('assetLandingFlagTargetHeight') as number;

    drawAsset(
      ctx,
      flagImg,
      targetFlagX - flagW / 2,
      GROUND_Y - flagH + 8,
      flagW,
      flagH,
      (fCtx) => {
        fCtx.fillStyle = '#dc2626';
        fCtx.fillRect(targetFlagX - 4, GROUND_Y - 120, 8, 120);
        fCtx.fillStyle = '#fef08a';
        fCtx.beginPath();
        fCtx.moveTo(targetFlagX + 4, GROUND_Y - 120);
        fCtx.lineTo(targetFlagX + 40, GROUND_Y - 100);
        fCtx.lineTo(targetFlagX + 4, GROUND_Y - 80);
        fCtx.fill();
      },
    );

    // Draw Level Obstacles
    for (const obs of currentLevel.obstacles) {
      const obsX = rampEnd + obs.x;
      if (obs.type === 'tires') {
        const tireImg = assets['obstacle_tire_stack'];
        const tireW = getConfig('assetObstacleTireStackWidth') as number;
        const tireH = getConfig('assetObstacleTireStackHeight') as number;
        drawAsset(
          ctx,
          tireImg,
          obsX,
          GROUND_Y - tireH,
          tireW,
          tireH,
          (tCtx) => {
            tCtx.fillStyle = '#1f2937';
            tCtx.fillRect(obsX, GROUND_Y - 80, 100, 80);
          },
        );
      } else if (obs.type === 'barrels') {
        const barrelImg = assets['metal_barrels'];
        const barrelW = getConfig('assetMetalBarrelsWidth') as number;
        const barrelH = getConfig('assetMetalBarrelsHeight') as number;
        drawAsset(
          ctx,
          barrelImg,
          obsX,
          GROUND_Y - barrelH,
          barrelW,
          barrelH,
          (bCtx) => {
            bCtx.fillStyle = '#7c2d12';
            bCtx.fillRect(obsX, GROUND_Y - 100, 120, 100);
          },
        );
      } else if (obs.type === 'wood_barrier') {
        const woodImg = assets['obstacle_wood_barrier'];
        const woodW = getConfig('assetObstacleWoodBarrierWidth') as number;
        const woodH = getConfig('assetObstacleWoodBarrierHeight') as number;
        drawAsset(
          ctx,
          woodImg,
          obsX,
          GROUND_Y - woodH,
          woodW,
          woodH,
          (wCtx) => {
            wCtx.fillStyle = '#854d0e';
            wCtx.fillRect(obsX, GROUND_Y - 140, 60, 140);
          },
        );
      }
    }

    // Draw Launch Ramp
    const rampImg = assets['ramp_tire_wood'];
    drawAsset(
      ctx,
      rampImg,
      RAMP_X,
      GROUND_Y - RAMP_HEIGHT,
      RAMP_WIDTH,
      RAMP_HEIGHT,
      (rCtx) => {
        rCtx.fillStyle = '#b45309';
        rCtx.beginPath();
        rCtx.moveTo(RAMP_X, GROUND_Y);
        rCtx.lineTo(RAMP_X + RAMP_WIDTH, GROUND_Y - RAMP_HEIGHT);
        rCtx.lineTo(RAMP_X + RAMP_WIDTH, GROUND_Y);
        rCtx.closePath();
        rCtx.fill();
      },
    );

    // Draw Particles
    for (const p of sim.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      if (p.type === 'speed_line') {
        ctx.fillRect(p.x, p.y, p.size, 3);
      } else if (p.type === 'confetti') {
        ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Player Rider Sprite
    const playerW = getConfig('playerRenderWidth') as number;
    const playerH = getConfig('playerRenderHeight') as number;

    if (spriteRendererRef.current) {
      spriteRendererRef.current.draw(
        ctx,
        animStateRef.current,
        sim.riderX - playerW / 2,
        sim.riderY - playerH / 2,
        playerW,
        playerH,
        assets,
        sim.rotation,
      );
    }

    // Runway Sprint Rhythm Feedback Floating Callout
    if (sim.phase === 'RUNWAY' && sim.pedalFeedback) {
      ctx.save();
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.fillStyle =
        sim.pedalFeedback.includes('PERFECTO') || sim.pedalFeedback.includes('MÁXIMA')
          ? '#10b981'
          : sim.pedalFeedback.includes('WENA') || sim.pedalFeedback.includes('BUEN')
          ? '#fbbf24'
          : '#f87171';
      ctx.strokeText(sim.pedalFeedback, sim.riderX, sim.riderY - 65);
      ctx.fillText(sim.pedalFeedback, sim.riderX, sim.riderY - 65);
      ctx.restore();
    }

    // In-Flight Trick Cheer Callout on World Canvas
    if (sim.phase === 'AIRBORNE' && flightTrickText) {
      ctx.save();
      ctx.font = 'bold 16px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.strokeText(flightTrickText, sim.riderX, sim.riderY - 90);
      ctx.fillText(flightTrickText, sim.riderX, sim.riderY - 90);
      ctx.restore();
    }

    // Semicircle Live Angle Needle Gauge on Ramp (Completely unhindered and clear)
    if (sim.phase === 'ANGLE_SELECT') {
      const currentAngle = sim.angleNeedle;
      const theta = (currentAngle * Math.PI) / 180;

      // Projected Trajectory Preview Curve
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      const startX = sim.riderX;
      const startY = sim.riderY;
      const previewV =
        (sim.storedSpeed || 20) * (0.65 + 0.6 * Math.sin(2 * theta));
      const previewVx = previewV * Math.cos(theta);
      const previewVy = -previewV * Math.sin(theta);
      const gravity = getConfig('gravity') as number;

      ctx.moveTo(startX, startY);
      for (let t = 0.08; t <= 1.8; t += 0.08) {
        const px = startX + previewVx * (t * 22);
        const py =
          startY + previewVy * (t * 22) + 0.5 * gravity * (t * 22) * t;
        if (py > GROUND_Y) {
          ctx.lineTo(px, GROUND_Y);
          break;
        }
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Semicircle Dial on the Ramp Lip
      ctx.save();
      ctx.translate(sim.riderX + 45, sim.riderY - 85);

      // Dial Retro Backdrop
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 75, -Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Outer Arc Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 62, -Math.PI * 0.95, -Math.PI * 0.05);
      ctx.stroke();

      // 45° Target Sweet Spot Arc (Green Zone)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 12;
      ctx.beginPath();
      const pMinRad = -Math.PI + (41 * Math.PI) / 180;
      const pMaxRad = -Math.PI + (49 * Math.PI) / 180;
      ctx.arc(0, 0, 62, pMinRad, pMaxRad);
      ctx.stroke();

      // Angle Tick Marks
      [15, 30, 45, 60, 75].forEach((tickDeg) => {
        const tickRad = -Math.PI + (tickDeg * Math.PI) / 180;
        const innerR = tickDeg === 45 ? 46 : 54;
        const outerR = 66;
        ctx.strokeStyle = tickDeg === 45 ? '#34d399' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = tickDeg === 45 ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(tickRad) * innerR, Math.sin(tickRad) * innerR);
        ctx.lineTo(Math.cos(tickRad) * outerR, Math.sin(tickRad) * outerR);
        ctx.stroke();
      });

      // Pointer Needle
      const needleRad = -Math.PI + (currentAngle * Math.PI) / 180;
      const isPerfect = Math.abs(currentAngle - 45) <= 4;
      ctx.strokeStyle = isPerfect ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(needleRad) * 60, Math.sin(needleRad) * 60);
      ctx.stroke();

      // Center Pivot Pin
      ctx.fillStyle = isPerfect ? '#34d399' : '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // Angle Number Label
      ctx.font = 'bold 14px "Press Start 2P", monospace';
      ctx.fillStyle = isPerfect ? '#34d399' : '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(currentAngle)}°`, 0, -26);

      ctx.restore();
    }

    ctx.restore(); // Restore world translation

    // 3. INTEGRATED IN-CANVAS 16-BIT SNES/GENESIS RETRO HUD
    if (gameStateRef.current.status === 'PLAYING') {
      ctx.save();

      // Top Left Bar: Nivel, Vidas, Velocidad
      ctx.fillStyle = 'rgba(17, 24, 39, 0.9)';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;

      // Top Left SNES Frame
      ctx.beginPath();
      ctx.roundRect(16, 16, 320, 76, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'left';
      ctx.fillText(`NIVEL ${gameStateRef.current.level}`, 28, 36);

      // Lives as red retro hearts
      ctx.fillStyle = '#ef4444';
      const livesCount = gameStateRef.current.lives ?? 0;
      let heartText = '';
      for (let i = 0; i < (getConfig('maxLives') as number); i++) {
        heartText += i < livesCount ? '♥ ' : '♡ ';
      }
      ctx.fillText(`VIDAS: ${heartText}`, 140, 36);

      // Speed Meter Bar
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(`VEL: ${Math.round(sim.vx * 2.5)} KM/H`, 28, 62);

      // 16-bit Segmented Speed Energy Bar
      const maxSpd = getConfig('maxRunwaySpeed') as number;
      const energyPct = Math.min(1, sim.vx / maxSpd);
      const barX = 28;
      const barY = 70;
      const barW = 296;
      const barH = 10;

      ctx.fillStyle = '#1f2937';
      ctx.fillRect(barX, barY, barW, barH);

      const filledW = Math.round(barW * energyPct);
      const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(0.7, '#10b981');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.fillRect(barX, barY, filledW, barH);

      // Top Right SNES Frame: Meta, Distancia, Puntaje
      ctx.fillStyle = 'rgba(17, 24, 39, 0.9)';
      ctx.strokeStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(canvasWidth - 336, 16, 320, 76, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`META: ${currentLevel.targetDistance}m`, canvasWidth - 322, 36);

      const rampEndPos = RAMP_X + RAMP_WIDTH;
      const currentDistM =
        sim.riderX > rampEndPos ? Math.round((sim.riderX - rampEndPos) / 20) : 0;
      ctx.fillStyle = '#34d399';
      ctx.fillText(`DIST: ${currentDistM}m`, canvasWidth - 180, 36);

      ctx.fillStyle = '#fef08a';
      ctx.fillText(`PUNTOS: ${gameStateRef.current.score}`, canvasWidth - 322, 64);

      // Top Center Arcade Stage Name Badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.strokeStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(canvasWidth / 2 - 190, 16, 380, 36, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.fillText(currentLevel.title.toUpperCase(), canvasWidth / 2, 38);

      ctx.restore();
    }

    // Flash Screen Overlay
    if (sim.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${sim.flashAlpha})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    ctx.restore(); // Restore shake translation
  };

  // --- GAME LOOP ---
  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
      // Global Pause Action
      if (inputRef.current) {
        const cancelPressed = inputRef.current.actions.cancel;
        if (cancelPressed && !lastCancelRef.current) {
          const currentStatus = gameStateRef.current.status;
          if (currentStatus === 'PLAYING') {
            setIsGameMenuOpen((prev) => !prev);
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
  }, [exitChat, inputRef]);

  const isMusicPlaying =
    gameState.status === 'PLAYING' && !isGameMenuOpen && !musicMuted;

  const currentLevelConfig =
    LEVEL_CONFIGS[
      Math.min(gameState.level - 1, LEVEL_CONFIGS.length - 1)
    ];

  return (
    <div
      className="fixed inset-0 overflow-hidden touch-none flex flex-col items-center justify-center bg-stone-950 text-amber-100 select-none"
      style={{fontFamily: '"Press Start 2P", monospace'}}>
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 text-amber-400">
          <Sparkles className="animate-spin mb-4" size={48} />
          <div className="text-xs md:text-sm font-bold tracking-widest text-center px-4">
            PREPARANDO EL PATIO Y LA RAMPA...
          </div>
        </div>
      )}

      <BackgroundMusic
        url={BACKGROUND_MUSIC_URL}
        isPlaying={isMusicPlaying}
        isMuted={musicMuted}
      />

      {/* FULL-VIEWPORT INTEGRATED RETRO CANVAS CONTAINER */}
      <div className="relative w-full h-full flex items-center justify-center bg-stone-950">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
          }}
          className="h-auto max-w-full max-h-full drop-shadow-2xl border-2 md:border-4 border-amber-950/80"
        />

        {/* Top-Right Retro In-Screen Pause Menu Button */}
        {gameState.status === 'PLAYING' && (
          <button
            onClick={() => {
              setIsGameMenuOpen(true);
              gameAudio.playCrispClick();
            }}
            className="absolute top-3 right-3 md:top-5 md:right-5 bg-stone-900/90 hover:bg-amber-600 text-amber-400 hover:text-stone-950 border-2 border-amber-500/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[9px] md:text-[10px] transition-all cursor-pointer shadow-lg z-20 active:scale-95">
            <MenuIcon size={12} />
            <span className="hidden sm:inline">MENÚ</span>
          </button>
        )}

        {/* PROMPT EN PISTA: ¡DALE PEDALEA CON CUÁTICA! */}
        {gameState.status === 'PLAYING' &&
          hudPhase === 'RUNWAY' &&
          !currentStuntStats && (
            <div className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 bg-stone-950/95 border-2 md:border-4 border-amber-500 px-4 md:px-6 py-2 rounded-lg text-[9px] md:text-xs font-bold text-amber-300 flex items-center gap-2 shadow-2xl pointer-events-none animate-pulse z-20 text-center">
              <Zap size={14} className="text-yellow-400 shrink-0" />
              <span>
                {isMobile
                  ? '¡TOCA RÁPIDO [IZQ] Y [DER] PA\' AGARRAR VUELO!'
                  : '¡DALE CON CUÁTICA A LA [Q] Y [P] PA\' PEDALEAR!'}
              </span>
            </div>
          )}

        {/* RAMP ANGLE INSTRUCTION BOX - NEATLY PLACED IN BOTTOM-LEFT SCREEN CORNER (NO OVERLAP) */}
        {gameState.status === 'PLAYING' &&
          hudPhase === 'ANGLE_SELECT' &&
          !currentStuntStats && (
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 max-w-xs md:max-w-sm z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="bg-stone-950/95 border-2 md:border-4 border-amber-500 rounded-xl p-3 md:p-4 shadow-2xl flex flex-col gap-2 text-stone-100 backdrop-blur-md">
                {/* Header Badge */}
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] md:text-xs font-bold">
                  <Flame size={14} className="text-amber-400 animate-pulse shrink-0" />
                  <span>¡EL ÁNGULO PRECISO!</span>
                </div>

                {/* Instruction in authentic Chilean Spanish */}
                <p className="text-[9px] md:text-[10px] leading-relaxed text-yellow-300 font-bold">
                  {isMobile
                    ? '¡Mantén presionado [VOLAR] 0.5s pa\' los 45° y suelta!'
                    : '¡Mantén [ESPACIO] 0.5s pa\' clavar los 45° y suelta!'}
                </p>

                {/* Angle Gauge Visual readout in the box */}
                <div className="bg-stone-900 border border-stone-700 rounded-lg p-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[9px] md:text-[10px]">
                    <span className="text-stone-400">Ángulo:</span>
                    <span
                      className={`font-bold ${
                        Math.abs(hudAngle - 45) <= 4
                          ? 'text-emerald-400'
                          : Math.abs(hudAngle - 45) <= 10
                          ? 'text-lime-400'
                          : 'text-amber-400'
                      }`}>
                      {hudAngle}°{' '}
                      {Math.abs(hudAngle - 45) <= 4
                        ? '★ ¡PERFECTO!'
                        : Math.abs(hudAngle - 45) <= 10
                        ? '¡BUENO!'
                        : hudAngle < 35
                        ? '¡MUY PLANO!'
                        : '¡MUY ALTO!'}
                    </span>
                  </div>

                  {/* Progress Bar with 45 Sweet Spot Pin */}
                  <div className="relative w-full h-3 bg-stone-950 rounded border border-stone-700 overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 bg-emerald-500/40 border-x border-emerald-400"
                      style={{left: '42%', width: '16%'}}
                    />
                    <div
                      className={`h-full ${
                        Math.abs(hudAngle - 45) <= 4
                          ? 'bg-emerald-400'
                          : Math.abs(hudAngle - 45) <= 10
                          ? 'bg-lime-400'
                          : 'bg-amber-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(5, ((hudAngle - 15) / (80 - 15)) * 100),
                        )}%`,
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-yellow-300 z-10"
                      style={{left: '50%'}}
                    />
                  </div>

                  <div className="flex justify-between text-[8px] text-stone-400">
                    <span>15° (0.0s)</span>
                    <span className="text-emerald-400 font-bold">45° (0.5s)</span>
                    <span>75° (1.0s)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* STUNT ROUND SUMMARY MODAL (CHILEAN DIALOGUE & STATS) */}
        {gameState.status === 'PLAYING' &&
          hudPhase === 'ROUND_SUMMARY' &&
          currentStuntStats && (
            <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 z-30">
              <div className="bg-stone-900 border-2 md:border-4 border-amber-600 rounded-2xl p-4 md:p-6 w-full max-w-md shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                <div
                  className={`text-sm md:text-base font-black mb-2 tracking-wide text-center leading-relaxed ${
                    currentStuntStats.landingQuality === 'PERFECT'
                      ? 'text-emerald-400'
                      : currentStuntStats.landingQuality === 'GREAT'
                      ? 'text-amber-400'
                      : currentStuntStats.landingQuality === 'GOOD'
                      ? 'text-yellow-300'
                      : 'text-red-500'
                  }`}>
                  {currentStuntStats.reactionText}
                </div>

                <p className="text-[9px] md:text-[10px] text-stone-300 text-center mb-4 leading-normal">
                  {currentStuntStats.clearedObstacles
                    ? '¡Superaste los obstáculos y llegaste a la meta, hermano!'
                    : currentStuntStats.landingQuality === 'CRASH'
                    ? '¡El Tarro se pegó el medio guatazo contra los tarros!'
                    : `¡Te faltó cazuela! (${currentStuntStats.distance}m de ${currentStuntStats.targetDistance}m requeridos)`}
                </p>

                {/* Score Breakdown Table */}
                <div className="w-full bg-stone-950/90 rounded-lg p-3 border border-stone-800 flex flex-col gap-1.5 text-[9px] md:text-[10px] mb-4">
                  <div className="flex justify-between text-stone-300">
                    <span>Velocidad de Salto:</span>
                    <span className="text-amber-400 font-bold">
                      {currentStuntStats.speed} KM/H (+
                      {currentStuntStats.speedBonus})
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-300">
                    <span>Ángulo de Lanzamiento:</span>
                    <span className="text-emerald-400 font-bold">
                      {currentStuntStats.angle}° (+
                      {currentStuntStats.angleBonus})
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-300">
                    <span>Distancia Lograda:</span>
                    <span className="text-cyan-400 font-bold">
                      {currentStuntStats.distance}m /{' '}
                      {currentStuntStats.targetDistance}m (+
                      {currentStuntStats.distanceBonus})
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-300">
                    <span>Multiplicador Salto:</span>
                    <span className="text-yellow-400 font-bold">
                      x{currentStuntStats.landingMultiplier.toFixed(1)}
                    </span>
                  </div>
                  <div className="border-t border-stone-700 pt-1.5 mt-1 flex justify-between text-[11px] font-bold text-yellow-300">
                    <span>Total del Intento:</span>
                    <span>+{currentStuntStats.roundScore} PTS</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {currentStuntStats.clearedObstacles ? (
                  <button
                    onClick={nextLevel}
                    autoFocus
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black py-3 rounded-lg flex items-center justify-center gap-2 text-xs md:text-sm cursor-pointer shadow-lg shadow-amber-500/30 transition-transform active:scale-95">
                    <span>¡SIGUIENTE NIVEL!</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (gameState.lives ?? 0) > 0 ? (
                  <button
                    onClick={resetRun}
                    autoFocus
                    className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 text-xs md:text-sm cursor-pointer shadow-lg transition-transform active:scale-95">
                    <RotateCw size={16} />
                    <span>OTRO INTENTO ({gameState.lives} VIDAS)</span>
                  </button>
                ) : (
                  <div className="text-[10px] text-red-400 font-bold">
                    ¡No te quedan más vidas, cabro!
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      {/* MOBILE TOUCH CONTROLS (SNES/SEGA ARCADE BUTTONS) */}
      {isMobile && gameState.status === 'PLAYING' && (
        <div className="w-full bg-stone-950/95 border-t-2 md:border-t-4 border-amber-900/60 px-6 py-2 flex items-center justify-between z-20 shrink-0">
          {/* Left / Right Pedal Buttons */}
          <div className="flex items-center gap-3">
            <button
              onPointerDown={() => {
                virtualPedalLRef.current = true;
                simRef.current.pedalInputQueue.push('L');
              }}
              onPointerUp={() => {
                virtualPedalLRef.current = false;
              }}
              onPointerLeave={() => {
                virtualPedalLRef.current = false;
              }}
              onPointerCancel={() => {
                virtualPedalLRef.current = false;
              }}
              className="min-w-[54px] min-h-[54px] w-14 h-14 bg-amber-600 active:bg-amber-400 text-stone-950 font-black rounded-xl border-2 border-yellow-300 flex flex-col items-center justify-center shadow-lg active:scale-95 select-none touch-none">
              <span className="text-[8px]">PEDAL</span>
              <span className="text-sm leading-none font-extrabold">IZQ</span>
            </button>

            <button
              onPointerDown={() => {
                virtualPedalRRef.current = true;
                simRef.current.pedalInputQueue.push('R');
              }}
              onPointerUp={() => {
                virtualPedalRRef.current = false;
              }}
              onPointerLeave={() => {
                virtualPedalRRef.current = false;
              }}
              onPointerCancel={() => {
                virtualPedalRRef.current = false;
              }}
              className="min-w-[54px] min-h-[54px] w-14 h-14 bg-amber-600 active:bg-amber-400 text-stone-950 font-black rounded-xl border-2 border-yellow-300 flex flex-col items-center justify-center shadow-lg active:scale-95 select-none touch-none">
              <span className="text-[8px]">PEDAL</span>
              <span className="text-sm leading-none font-extrabold">DER</span>
            </button>
          </div>

          {/* Jump / Launch Angle Button */}
          <button
            onPointerDown={() => {
              virtualJumpRef.current = true;
            }}
            onPointerUp={() => {
              virtualJumpRef.current = false;
            }}
            onPointerLeave={() => {
              virtualJumpRef.current = false;
            }}
            onPointerCancel={() => {
              virtualJumpRef.current = false;
            }}
            className={`min-w-[90px] min-h-[54px] px-3 h-14 font-black rounded-xl border-2 flex items-center justify-center gap-1 shadow-lg active:scale-95 select-none touch-none transition-colors ${
              hudPhase === 'ANGLE_SELECT'
                ? 'bg-emerald-500 active:bg-emerald-300 text-stone-950 border-yellow-300 animate-pulse'
                : 'bg-emerald-700 active:bg-emerald-500 text-stone-950 border-emerald-400'
            }`}>
            <Flame size={18} />
            <span className="text-[9px] font-extrabold tracking-wider">
              {hudPhase === 'ANGLE_SELECT' ? 'MANTÉN 45°' : 'VOLAR'}
            </span>
          </button>
        </div>
      )}

      {/* START / MAIN MENU OVERLAY (CHILEAN SLANG & RETRO PIXEL STYLING) */}
      {gameState.status === 'START' && (
        <MenuOverlay>
          <div className="bg-stone-900 border-2 md:border-4 border-amber-600 p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-md text-amber-100">
            <div className="bg-amber-600 text-stone-950 text-[9px] md:text-[10px] font-black px-3 py-1 rounded mb-3 tracking-widest uppercase">
              ★ CLÁSICO ARCADE 16-BIT ★
            </div>

            <h1 className="text-2xl md:text-4xl font-black mb-2 text-yellow-400 text-center tracking-tight drop-shadow-md">
              EL TARRO
            </h1>
            <p className="text-amber-300/90 font-bold text-[10px] md:text-xs text-center mb-6 leading-relaxed">
              ¡EL SALTO EN BICI MÁS BRÍGIDO DE CHILE!
            </p>

            <div className="bg-stone-950/90 rounded-xl p-4 border border-stone-800 text-[9px] md:text-[10px] text-stone-300 mb-6 w-full flex flex-col gap-2.5">
              <div className="flex items-start gap-2">
                <Zap size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Pedaleo con Cuática:</strong> Aprieta [Q] y [P]
                  alternados a toda velocidad pa' agarrar vuelo en la pista.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Flame size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Los 45° de Oro:</strong> Al llegar a la rampa mantén
                  [ESPACIO] 0.5s pa' clavar los 45° y volar con todo el power.
                </span>
              </div>
            </div>

            <button
              ref={startButtonRef}
              onClick={initGame}
              autoFocus
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-stone-950 px-4 py-3.5 rounded-xl font-black text-xs md:text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-amber-500/20 mb-3">
              <Play size={16} className="fill-stone-950" />
              <span>¡DALE A JUGAR, CHORO!</span>
            </button>

            <div className="flex items-center justify-center gap-4 mt-1">
              <button
                type="button"
                onClick={() => {
                  setIsLeaderboardOpen(true);
                  gameAudio.playCrispClick();
                }}
                className="text-[9px] md:text-[10px] text-amber-300 hover:text-yellow-200 underline font-bold flex items-center gap-1 cursor-pointer">
                <Trophy size={12} className="text-yellow-400" />
                <span>SALÓN DE LA FAMA</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsHowToPlayOpen(true);
                  gameAudio.playCrispClick();
                }}
                className="text-[9px] md:text-[10px] text-amber-400 hover:text-yellow-300 underline font-semibold cursor-pointer">
                ¿CÓMO SE JUEGA?
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* PAUSE / IN-GAME MENU OVERLAY (CHILEAN SLANG) */}
      {isGameMenuOpen && (
        <MenuOverlay zIndex={50}>
          <div className="bg-stone-900 border-2 md:border-4 border-amber-600 p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-md text-amber-100">
            <h2 className="text-xl md:text-2xl font-black mb-6 text-yellow-400 text-center">
              PAUSA CABROS
            </h2>

            <div className="w-full flex flex-col gap-3 mb-4">
              <button
                onClick={() => {
                  setIsGameMenuOpen(false);
                  gameAudio.playCrispClick();
                }}
                autoFocus
                className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3 rounded-lg flex items-center justify-center gap-2 text-xs md:text-sm cursor-pointer shadow transition-colors">
                <Play size={14} />
                <span>SEGUIR JUGANDO</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLeaderboardOpen(true);
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs cursor-pointer border border-amber-600/40">
                <Trophy size={14} className="text-yellow-400" />
                <span>SALÓN DE LA FAMA</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const newMuted = gameAudio.toggleMute();
                    setSfxMuted(newMuted);
                  }}
                  className="bg-stone-800 hover:bg-stone-700 text-[9px] font-bold py-2.5 px-2 rounded-lg border border-stone-700 flex items-center justify-center gap-1.5 cursor-pointer">
                  {sfxMuted ? (
                    <VolumeX size={14} className="text-red-400" />
                  ) : (
                    <Volume2 size={14} className="text-emerald-400" />
                  )}
                  <span>SFX: {sfxMuted ? 'OFF' : 'ON'}</span>
                </button>

                <button
                  onClick={() => {
                    setMusicMuted((prev) => !prev);
                  }}
                  className="bg-stone-800 hover:bg-stone-700 text-[9px] font-bold py-2.5 px-2 rounded-lg border border-stone-700 flex items-center justify-center gap-1.5 cursor-pointer">
                  {musicMuted ? (
                    <VolumeX size={14} className="text-red-400" />
                  ) : (
                    <Volume2 size={14} className="text-emerald-400" />
                  )}
                  <span>BGM: {musicMuted ? 'OFF' : 'ON'}</span>
                </button>
              </div>

              <button
                onClick={restartLevel}
                className="w-full bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold py-2.5 rounded-lg border border-stone-700 flex items-center justify-center gap-2 text-[10px] cursor-pointer transition-colors">
                <RotateCw size={14} />
                <span>REPETIR NIVEL</span>
              </button>

              <button
                onClick={() => {
                  setIsHowToPlayOpen(true);
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-2.5 rounded-lg border border-stone-700 flex items-center justify-center gap-2 text-[10px] cursor-pointer transition-colors">
                <HelpCircle size={14} />
                <span>¿CÓMO SE JUEGA?</span>
              </button>

              <button
                onClick={() => {
                  setIsGameMenuOpen(false);
                  setGameState((prev) => ({...prev, status: 'START'}));
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-red-900/40 hover:bg-red-800/60 text-red-300 font-bold py-2.5 rounded-lg border border-red-800/50 flex items-center justify-center gap-2 text-[10px] cursor-pointer transition-colors">
                <X size={14} />
                <span>VOLVER AL MENÚ</span>
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* HOW TO PLAY MODAL OVERLAY (CHILEAN SLANG) */}
      {isHowToPlayOpen && (
        <MenuOverlay zIndex={60}>
          <div className="bg-stone-900 border-2 md:border-4 border-amber-600 p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-md text-amber-100">
            <h2 className="text-xl md:text-2xl font-black mb-4 text-yellow-400 text-center">
              GUÍA DEL SALTO
            </h2>

            <div className="w-full flex flex-col gap-3 text-[9px] md:text-[10px] text-stone-300 mb-6 bg-stone-950 p-4 rounded-xl border border-stone-800 leading-relaxed">
              <div className="border-b border-stone-800 pb-2">
                <strong className="text-amber-400 block mb-1">
                  1. Pedaleo con Tuti
                </strong>
                Aprieta alternado <strong>Q</strong> y <strong>P</strong> (o
                los botones IZQ/DER) a toda velocidad pa' que la bici agarre
                máximo vuelo en la tierra.
              </div>

              <div className="border-b border-stone-800 pb-2">
                <strong className="text-emerald-400 block mb-1">
                  2. El Ángulo Preciso en la Rampa (Pausa)
                </strong>
                Al tocar la rampa, el juego se pausa. Mantén presionado{' '}
                <strong>ESPACIO</strong> (o el botón <strong>VOLAR</strong>).
                Mantenerlo exactamente <strong>0.5 segundos</strong> ajusta el
                ángulo de oro a <strong>45°</strong> (100% de fuerza balística).
                ¡Al soltarlo sales disparado por el cielo!
              </div>

              <div>
                <strong className="text-cyan-400 block mb-1">
                  3. ¡Cuidado con los Tarros y el Porrazo!
                </strong>
                Pasa por arriba de los neumáticos, tambores y tablones. Si
                saltas muy plano (&lt;25°) o muy empina'o (&gt;65°), ¡el Tarro
                se va a sacar la reverenda chucha!
              </div>
            </div>

            <button
              onClick={() => {
                setIsHowToPlayOpen(false);
                gameAudio.playCrispClick();
              }}
              autoFocus
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3 rounded-lg flex items-center justify-center gap-2 text-xs cursor-pointer shadow">
              ¡ENTENDIDO, CHORO!
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* GAME OVER OVERLAY (CHILEAN SLANG + LEADERBOARD) */}
      {gameState.status === 'GAME_OVER' && (
        <MenuOverlay tone="danger" zIndex={40}>
          <div className="w-full max-w-md bg-stone-950 border-4 border-red-600 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center text-center max-h-[92vh] overflow-y-auto text-white">
            <div className="text-3xl mb-1">💥🚲🤕</div>
            <h2 className="text-base sm:text-lg font-black text-red-400 mb-1">
              ¡TE FUISTE A LA CTM!
            </h2>
            <p className="text-xs text-stone-300 mb-3">
              ¡El Tarro se hizo pebre contra el tierral de Talca!
            </p>

            <div className="w-full bg-stone-900 p-3 rounded-xl border border-stone-800 text-left text-xs text-stone-300 space-y-1.5 mb-3">
              <div className="flex justify-between">
                <span>PUNTAJE FINAL:</span>
                <strong className="text-yellow-400 font-bold">{gameState.score.toLocaleString()} PTS</strong>
              </div>
              <div className="flex justify-between">
                <span>NIVEL ALCANZADO:</span>
                <strong className="text-amber-300">Nivel {gameState.level} - {LEVEL_CONFIGS[gameState.level - 1]?.title || 'BMX'}</strong>
              </div>
            </div>

            {/* In-Game Name Entry for Leaderboard */}
            {!scoreSubmitted ? (
              <div className="w-full bg-stone-900/90 border-2 border-amber-500/80 rounded-xl p-3 mb-3 text-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <span className="text-[10px] text-yellow-300 block mb-1.5 font-black">
                  🏆 REGISTRA TU NOMBRE O @INSTAGRAM (MÁX 12 CARACTERES)
                </span>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-1.5">
                  <input
                    type="text"
                    maxLength={12}
                    value={playerNameInput}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.startsWith('@')) {
                        val = '@' + val.slice(1).replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 11);
                      } else {
                        val = val.toUpperCase().replace(/[^A-Z0-9_\-\s]/g, '').slice(0, 12);
                      }
                      setPlayerNameInput(val);
                    }}
                    placeholder="@TU_INSTA O NOMBRE"
                    className="bg-black border-2 border-amber-400 text-yellow-400 text-center font-black text-xs py-2 px-3 rounded-lg w-full sm:w-52 tracking-widest uppercase focus:outline-none focus:border-red-500 shadow-[inset_2px_2px_0px_#000]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveScore(gameState.score, LEVEL_CONFIGS[gameState.level - 1]?.title || `Nivel ${gameState.level}`)}
                    className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs py-2 px-3 rounded-lg shadow active:translate-y-0.5 transition-all cursor-pointer">
                    GUARDAR EN SALÓN
                  </button>
                </div>
                <span className="text-[9px] text-stone-400">Presiona GUARDAR para rankear en el Salón de la Fama</span>
              </div>
            ) : (
              <div className="w-full bg-amber-500/20 border border-amber-400/80 rounded-xl py-2 px-3 mb-3 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
                <span>✓ PUNTAJE REGISTRADO: {playerNameInput}</span>
              </div>
            )}

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsLeaderboardOpen(true);
                }}
                className="w-full bg-stone-900 hover:bg-stone-800 border-2 border-amber-500/60 text-amber-300 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Trophy size={14} className="text-yellow-400" />
                VER SALÓN DE LA FAMA
              </button>

              <button
                autoFocus
                onClick={initGame}
                className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow cursor-pointer">
                <RotateCw size={15} />
                OTRO INTENTO, CHORO
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* VICTORY OVERLAY (CHILEAN SLANG + LEADERBOARD) */}
      {gameState.status === 'VICTORY' && (
        <MenuOverlay tone="victory" zIndex={40}>
          <div className="w-full max-w-md bg-stone-950 border-4 border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center text-center max-h-[92vh] overflow-y-auto text-white">
            <div className="text-3xl mb-1">🚲🏆👑</div>
            <h2 className="text-base sm:text-lg font-black text-emerald-400 mb-1">
              ¡CAMPEÓN BRÍGIDO DEL BARRIO!
            </h2>
            <p className="text-xs text-stone-300 mb-3">
              ¡El Tarro superó todos los niveles y es leyenda nacional de Talca!
            </p>

            <div className="w-full bg-stone-900 p-3 rounded-xl border border-stone-800 text-left text-xs text-stone-300 space-y-1.5 mb-3">
              <div className="flex justify-between">
                <span>PUNTAJE FINAL:</span>
                <strong className="text-yellow-400 font-bold">{gameState.score.toLocaleString()} PTS</strong>
              </div>
              <div className="flex justify-between">
                <span>ESTADO:</span>
                <strong className="text-emerald-400 font-bold">¡HAZAÑA COMPLETADA!</strong>
              </div>
            </div>

            {/* In-Game Name Entry for Victory */}
            {!scoreSubmitted ? (
              <div className="w-full bg-stone-900/90 border-2 border-emerald-500/80 rounded-xl p-3 mb-3 text-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="text-[10px] text-yellow-300 block mb-1.5 font-black">
                  👑 REGISTRA TU VICTORIA O @INSTAGRAM (MÁX 12 CARACTERES)
                </span>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-1.5">
                  <input
                    type="text"
                    maxLength={12}
                    value={playerNameInput}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.startsWith('@')) {
                        val = '@' + val.slice(1).replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 11);
                      } else {
                        val = val.toUpperCase().replace(/[^A-Z0-9_\-\s]/g, '').slice(0, 12);
                      }
                      setPlayerNameInput(val);
                    }}
                    placeholder="@TU_INSTA O NOMBRE"
                    className="bg-black border-2 border-emerald-400 text-emerald-400 text-center font-black text-xs py-2 px-3 rounded-lg w-full sm:w-52 tracking-widest uppercase focus:outline-none focus:border-yellow-400 shadow-[inset_2px_2px_0px_#000]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveScore(gameState.score, 'VICTORIA BMX')}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 font-black text-xs py-2 px-3 rounded-lg shadow active:translate-y-0.5 transition-all cursor-pointer">
                    GUARDAR EN SALÓN
                  </button>
                </div>
                <span className="text-[9px] text-stone-400">Inmortaliza tu salto en el Salón de la Fama</span>
              </div>
            ) : (
              <div className="w-full bg-emerald-500/20 border border-emerald-400/80 rounded-xl py-2 px-3 mb-3 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
                <span>✓ GLORIA INMORTAL REGISTRADA: {playerNameInput}</span>
              </div>
            )}

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsLeaderboardOpen(true);
                }}
                className="w-full bg-stone-900 hover:bg-stone-800 border-2 border-emerald-500/60 text-emerald-300 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Trophy size={14} className="text-yellow-400" />
                VER SALÓN DE LA FAMA
              </button>

              <button
                autoFocus
                onClick={initGame}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow cursor-pointer">
                <RotateCw size={15} />
                JUGAR DE NUEVO
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* LEADERBOARD OVERLAY */}
      {isLeaderboardOpen && (
        <MenuOverlay zIndex={50}>
          <div className="w-full max-w-md bg-stone-950 border-4 border-amber-500 rounded-2xl p-4 sm:p-5 shadow-[0_0_40px_rgba(245,158,11,0.5),4px_4px_0px_#000] flex flex-col items-center text-center max-h-[90vh] overflow-y-auto text-white">
            <div className="text-3xl mb-1">🚲🏆⭐</div>
            <h2 className="text-base sm:text-lg font-black text-yellow-400 mb-1">
              SALÓN DE LA FAMA
            </h2>
            <p className="text-[10px] text-amber-300 mb-3">
              MEJORES SALTOS BMX • EL TARRO DE TALCA
            </p>

            <div className="w-full bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 mb-3 divide-y divide-stone-800/80 text-xs">
              {leaderboard.map((entry, idx) => (
                <div
                  key={idx}
                  className={`py-2 px-2 flex items-center justify-between ${
                    idx === 0
                      ? 'text-yellow-300 font-black bg-amber-500/10 rounded'
                      : idx === 1
                      ? 'text-stone-200 font-bold'
                      : idx === 2
                      ? 'text-amber-500 font-bold'
                      : 'text-stone-400'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-left shrink-0">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                    </span>
                    {entry.name.startsWith('@') ? (
                      <a
                        href={`https://instagram.com/${entry.name.slice(1).replace(/[^a-zA-Z0-9_.]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="tracking-wider text-pink-400 hover:text-pink-300 underline decoration-pink-500/60 transition-colors inline-flex items-center gap-0.5"
                        title={`Ver perfil de Instagram de ${entry.name}`}>
                        <span>{entry.name}</span>
                        <span className="text-[9px]">↗</span>
                      </a>
                    ) : (
                      <span className="tracking-wider">{entry.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-500 hidden sm:inline">{entry.stageName}</span>
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
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-stone-950 py-2.5 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow">
              <X size={15} />
              CERRAR SALÓN DE LA FAMA
            </button>
          </div>
        </MenuOverlay>
      )}
    </div>
  );
}
