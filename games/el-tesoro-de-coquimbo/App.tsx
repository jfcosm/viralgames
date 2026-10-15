// tslint:disable
/* eslint-disable */
import {
  Award,
  BookOpen,
  ChevronRight,
  Flame,
  HelpCircle,
  Home,
  Info,
  Menu as MenuIcon,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {getConfig} from './constants';
import {
  SpriteActionConfig,
  SpriteAnimationState,
  SpriteRenderer,
} from './SpriteRenderer';
import {
  getAntiRepetitionQuestionDeck,
  SANTINO_QUIPS,
  TRIVIA_QUESTIONS,
  TriviaQuestion,
  TROPHIES,
  TrophyDef,
} from './triviaData';
import BackgroundMusic from './utils/BackgroundMusic';
import {
  createFixedStepper,
  drawAsset,
  drawBackground,
  formatTime,
  gameAudio,
  GameState,
  MenuOverlay,
  Overlay,
  prepareCanvas,
  shuffle,
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
import { subscribeLeaderboard, saveLeaderboardToDb } from '../../firebase';

export interface LeaderboardEntry {
  name: string;
  score: number;
  stageName: string;
  date: string;
}

const ASSETS_MANIFEST: Record<string, string> = {
  bg_stadium: 'assets/images/bg_coquimbo_stadium.png',
  bg_port: 'assets/images/bg_coquimbo_port.png',
  ball: 'assets/images/football_soccer_ball.png',
  jersey: 'assets/images/icon_life_jersey.png',
  trophy: 'assets/images/icon_trophy_pirate.png',
  wildcard_fifty: 'assets/images/icon_wildcard_fifty.png',
  wildcard_freeze: 'assets/images/icon_wildcard_freeze.png',
  wildcard_hint: 'assets/images/icon_wildcard_hint.png',
  santino_idle: 'assets/images/santino_host_idle.png',
  santino_run: 'assets/images/santino_host_run.png',
  santino_jump: 'assets/images/santino_host_jump.png',
  santino_hurt: 'assets/images/santino_host_hurt.png',
};

// Shuffled Question with randomized option order
interface ActiveQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
  difficulty: number;
}

// Particle for confetti & sparks
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  rot: number;
  vRot: number;
}

// Penalty shootout state
interface PenaltyState {
  aimX: number;
  aimSpeed: number;
  aimDir: number;
  power: number;
  powerSpeed: number;
  powerDir: number;
  phase: 'AIM' | 'POWER' | 'SHOOTING' | 'RESULT' | 'SUMMARY';
  ballX: number;
  ballY: number;
  ballStartX: number;
  ballStartY: number;
  ballTargetX: number;
  ballTargetY: number;
  ballScale: number;
  ballRot: number;
  shotProgress: number;
  flightDuration: number;
  flightTimer: number;
  goalieX: number;
  goalieY: number;
  goalieTargetX: number;
  goalieDiving: boolean;
  goalieDiveDir: number;
  goalieReactionDelay: number;
  isGoal: boolean;
  hitWoodwork: boolean;
  netRippleTimer: number;
  scoreMessage: string;
  shotsTaken: number;
  goalsScored: number;
  roundBonusPoints: number;
  maxShots: number;
}

type GameMode = 'CLASSIC' | 'TIME_ATTACK' | 'PENALTY';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper>>();
  const lastCancelRef = useRef(false);
  const isMobile = useIsMobile();

  // SDK Integration
  const {sdk} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  // Preload Assets
  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs') as number;
    const maxSubSteps = getConfig('maxSubSteps') as number;
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  // Audio mute states
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);

  // Overlay Sub-Menus State
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isTrophyRoomOpen, setIsTrophyRoomOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Cloud Firestore Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('viralgames_coquimbo_leaderboard');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [playerNameInput, setPlayerNameInput] = useState(() => {
    try {
      return (localStorage.getItem('viralgames_coquimbo_player_name') || 'PIRATA').slice(0, 12);
    } catch {
      return 'PIRATA';
    }
  });
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  useEffect(() => {
    const unsub = subscribeLeaderboard('el-tesoro-de-coquimbo', (cloudEntries: LeaderboardEntry[] | null) => {
      if (cloudEntries && Array.isArray(cloudEntries) && cloudEntries.length > 0) {
        setLeaderboard(cloudEntries);
        try {
          localStorage.setItem('viralgames_coquimbo_leaderboard', JSON.stringify(cloudEntries));
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
    let cleanName = 'PIRATA';
    if (raw.startsWith('@')) {
      const handle = raw.slice(1).replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 11);
      cleanName = handle ? `@${handle}` : 'PIRATA';
    } else if (raw) {
      cleanName = raw.toUpperCase().replace(/[^A-Z0-9_\-\s]/g, '').slice(0, 12) || 'PIRATA';
    }

    const newEntry: LeaderboardEntry = {
      name: cleanName,
      score: score,
      stageName: stageName,
      date: 'HOY',
    };
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
      .slice(0, 10);

    setLeaderboard(updated);
    setScoreSubmitted(true);
    try {
      localStorage.setItem('viralgames_coquimbo_leaderboard', JSON.stringify(updated));
      localStorage.setItem('viralgames_coquimbo_player_name', cleanName);
    } catch (e) {
      console.error(e);
    }
    saveLeaderboardToDb('el-tesoro-de-coquimbo', updated);
    gameAudio.playVictoryJingle();
  };

  // Unlocked Trophies
  const [unlockedTrophies, setUnlockedTrophies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('coquimbo_trophies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const unlockTrophy = useCallback((trophyId: string) => {
    setUnlockedTrophies((prev) => {
      if (prev.includes(trophyId)) return prev;
      const next = [...prev, trophyId];
      try {
        localStorage.setItem('coquimbo_trophies', JSON.stringify(next));
      } catch {}
      gameAudio.playPowerupChime();
      return next;
    });
  }, []);

  // Primary Game State
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1,
    lives: getConfig('startingLives') as number,
    timer: getConfig('questionTimer') as number,
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

  // Game Mode
  const [gameMode, setGameMode] = useState<GameMode>('CLASSIC');

  // Question Engine State with Dynamic Option Shuffling
  const [questionDeck, setQuestionDeck] = useState<ActiveQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [isTimerFrozen, setIsTimerFrozen] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  // Wildcard Quantities
  const [wildcardFifty, setWildcardFifty] = useState(1);
  const [wildcardHint, setWildcardHint] = useState(2);
  const [wildcardFreeze, setWildcardFreeze] = useState(1);

  // Host Dialogue
  const [santinoSpeech, setSantinoSpeech] = useState<string>(
    SANTINO_QUIPS.welcome[0],
  );

  // Question Timer Ref
  const questionTimerRef = useRef<number>(getConfig('questionTimer') as number);

  // Index of the question to resume after penalty shootout
  const resumeQuestionIndexRef = useRef<number>(0);

  // Sprite Renderer for Santino
  const santinoSpriteRef = useRef<SpriteRenderer | null>(null);
  const santinoAnimStateRef = useRef<SpriteAnimationState>({
    currentAction: 'idle',
    currentFrame: 0,
    timer: 0,
  });

  // Confetti Particles
  const particlesRef = useRef<Particle[]>([]);

  // Penalty Shootout Simulation Setup
  const penaltyGoalW = 480;
  const penaltyGoalH = 210;
  const penaltyGoalX = (canvasWidth - penaltyGoalW) / 2; // 448
  const penaltyGoalBottomY = 570; // Firmly planted on grass pitch
  const penaltyGoalY = penaltyGoalBottomY - penaltyGoalH; // 360
  const penaltySpotX = canvasWidth / 2; // 688
  const penaltySpotY = 660;

  // Reactive UI state for penalty shootout
  const [penaltyPhase, setPenaltyPhase] = useState<
    'AIM' | 'POWER' | 'SHOOTING' | 'RESULT' | 'SUMMARY'
  >('AIM');
  const [penaltyShots, setPenaltyShots] = useState(0);
  const [penaltyGoals, setPenaltyGoals] = useState(0);
  const [penaltyMessage, setPenaltyMessage] = useState('');
  const [penaltySummaryBonus, setPenaltySummaryBonus] = useState(0);

  const penaltyRef = useRef<PenaltyState>({
    aimX: 0.5,
    aimSpeed: 0.95,
    aimDir: 1,
    power: 0.5,
    powerSpeed: 1.15,
    powerDir: 1,
    phase: 'AIM',
    ballX: penaltySpotX,
    ballY: penaltySpotY,
    ballStartX: penaltySpotX,
    ballStartY: penaltySpotY,
    ballTargetX: penaltySpotX,
    ballTargetY: penaltyGoalY + penaltyGoalH * 0.5,
    ballScale: 1,
    ballRot: 0,
    shotProgress: 0,
    flightDuration: 0.65,
    flightTimer: 0,
    goalieX: penaltySpotX,
    goalieY: penaltyGoalBottomY,
    goalieTargetX: penaltySpotX,
    goalieDiving: false,
    goalieDiveDir: 0,
    goalieReactionDelay: 0.12,
    isGoal: false,
    hitWoodwork: false,
    netRippleTimer: 0,
    scoreMessage: '',
    shotsTaken: 0,
    goalsScored: 0,
    roundBonusPoints: 0,
    maxShots: 3,
  });

  // Action Configurations for Santino Host
  const santinoActionConfigs: Record<string, SpriteActionConfig> = useMemo(
    () => ({
      idle: {
        imageUrl: 'santino_idle',
        totalFrames: 4,
        frameWidth: 512,
        frameHeight: 512,
        fps: 8,
        loop: true,
      },
      run: {
        imageUrl: 'santino_run',
        totalFrames: 16,
        frameWidth: 512,
        frameHeight: 512,
        fps: 16,
        loop: true,
      },
      jump: {
        imageUrl: 'santino_jump',
        totalFrames: 16,
        frameWidth: 512,
        frameHeight: 512,
        fps: 16,
        loop: false,
      },
      hurt: {
        imageUrl: 'santino_hurt',
        totalFrames: 16,
        frameWidth: 512,
        frameHeight: 512,
        fps: 8,
        loop: false,
      },
    }),
    [],
  );

  if (!santinoSpriteRef.current) {
    santinoSpriteRef.current = new SpriteRenderer(santinoActionConfigs);
  }

  // Set host animation action
  const setSantinoAction = useCallback((action: 'idle' | 'run' | 'jump' | 'hurt') => {
    if (santinoAnimStateRef.current.currentAction !== action) {
      santinoAnimStateRef.current = {
        currentAction: action,
        currentFrame: 0,
        timer: 0,
      };
    }
  }, []);

  // Confetti Spawn
  const spawnConfetti = useCallback((x: number, y: number, count = 45) => {
    const colors = ['#FACC15', '#EAB308', '#FFFFFF', '#000000', '#38BDF8', '#4ADE80'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 320;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 150,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.8,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10,
      });
    }
  }, []);

  // Sparks on Woodwork / Post collision
  const spawnSparks = useCallback((x: number, y: number, count = 30) => {
    const colors = ['#FFFFFF', '#FACC15', '#FEF08A', '#F97316', '#EAB308'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 260;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.4,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 16,
      });
    }
  }, []);

  // Helper to randomize answers order and accurately track new correctIndex with anti-repetition
  const prepareQuestionDeck = useCallback((count: number): ActiveQuestion[] => {
    const rawQuestions = getAntiRepetitionQuestionDeck(count);
    return rawQuestions.map((q) => {
      const correctText = q.options[q.correctIndex];
      const shuffledOptions = shuffle([...q.options]);
      const newCorrectIndex = shuffledOptions.indexOf(correctText);
      return {
        id: q.id,
        category: q.category,
        question: q.question,
        options: shuffledOptions,
        correctIndex: newCorrectIndex,
        hint: q.hint,
        explanation: q.explanation,
        difficulty: q.difficulty,
      };
    });
  }, []);

  // Current Question
  const currentQ = useMemo(() => {
    if (!questionDeck.length || currentQuestionIndex >= questionDeck.length) {
      return null;
    }
    return questionDeck[currentQuestionIndex];
  }, [questionDeck, currentQuestionIndex]);

  // Streak Multiplier
  const streakMultiplier = useMemo(() => {
    if (streak >= 4) return 4;
    if (streak >= 3) return 3;
    if (streak >= 2) return 2;
    return 1;
  }, [streak]);

  // Reset / Initialize Penalty state for a bonus round
  const startPenaltyBonusRound = useCallback(
    (resumeIndex: number) => {
      resumeQuestionIndexRef.current = resumeIndex;
      setPenaltyPhase('AIM');
      setPenaltyShots(0);
      setPenaltyGoals(0);
      setPenaltyMessage('');
      setPenaltySummaryBonus(0);

      penaltyRef.current = {
        aimX: 0.5,
        aimSpeed: 0.95,
        aimDir: 1,
        power: 0.5,
        powerSpeed: 1.15,
        powerDir: 1,
        phase: 'AIM',
        ballX: penaltySpotX,
        ballY: penaltySpotY,
        ballStartX: penaltySpotX,
        ballStartY: penaltySpotY,
        ballTargetX: penaltySpotX,
        ballTargetY: penaltyGoalY + penaltyGoalH * 0.5,
        ballScale: 1,
        ballRot: 0,
        shotProgress: 0,
        flightDuration: 0.65,
        flightTimer: 0,
        goalieX: penaltySpotX,
        goalieY: penaltyGoalBottomY,
        goalieTargetX: penaltySpotX,
        goalieDiving: false,
        goalieDiveDir: 0,
        goalieReactionDelay: 0.12,
        isGoal: false,
        hitWoodwork: false,
        netRippleTimer: 0,
        scoreMessage: '',
        shotsTaken: 0,
        goalsScored: 0,
        roundBonusPoints: 0,
        maxShots: 3,
      };

      setGameState((prev) => ({...prev, status: 'PENALTY_SHOOTOUT'}));
    },
    [penaltySpotX, penaltySpotY, penaltyGoalY, penaltyGoalH, penaltyGoalBottomY],
  );

  // Initialize Game
  const initGame = useCallback(
    (mode: GameMode = 'CLASSIC') => {
      setGameMode(mode);
      const questionsCount =
        mode === 'TIME_ATTACK'
          ? 20
          : (getConfig('questionsPerRound') as number);

      const activeDeck = prepareQuestionDeck(questionsCount);
      setQuestionDeck(activeDeck);
      setCurrentQuestionIndex(0);
      resumeQuestionIndexRef.current = 0;
      setStreak(0);
      setMaxStreak(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setEliminatedOptions([]);
      setIsTimerFrozen(false);
      setActiveHint(null);

      setWildcardFifty(1);
      setWildcardHint(2);
      setWildcardFreeze(1);

      const startLives =
        mode === 'TIME_ATTACK'
          ? 5
          : (getConfig('startingLives') as number);

      const startTimer =
        mode === 'TIME_ATTACK'
          ? 60
          : (getConfig('questionTimer') as number);

      questionTimerRef.current = startTimer;

      setGameState({
        status: 'PLAYING',
        score: 0,
        level: 1,
        lives: startLives,
        timer: startTimer,
      });
      setScoreSubmitted(false);

      setSantinoAction('idle');
      setSantinoSpeech(
        SANTINO_QUIPS.welcome[
          Math.floor(Math.random() * SANTINO_QUIPS.welcome.length)
        ],
      );

      // Reset penalty minigame state
      setPenaltyPhase('AIM');
      setPenaltyShots(0);
      setPenaltyGoals(0);
      setPenaltyMessage('');
      setPenaltySummaryBonus(0);
      penaltyRef.current = {
        aimX: 0.5,
        aimSpeed: 0.95,
        aimDir: 1,
        power: 0.5,
        powerSpeed: 1.15,
        powerDir: 1,
        phase: 'AIM',
        ballX: penaltySpotX,
        ballY: penaltySpotY,
        ballStartX: penaltySpotX,
        ballStartY: penaltySpotY,
        ballTargetX: penaltySpotX,
        ballTargetY: penaltyGoalY + penaltyGoalH * 0.5,
        ballScale: 1,
        ballRot: 0,
        shotProgress: 0,
        flightDuration: 0.65,
        flightTimer: 0,
        goalieX: penaltySpotX,
        goalieY: penaltyGoalBottomY,
        goalieTargetX: penaltySpotX,
        goalieDiving: false,
        goalieDiveDir: 0,
        goalieReactionDelay: 0.12,
        isGoal: false,
        hitWoodwork: false,
        netRippleTimer: 0,
        scoreMessage: '',
        shotsTaken: 0,
        goalsScored: 0,
        roundBonusPoints: 0,
        maxShots: 3,
      };

      if (sdk) {
        sdk.startGame();
      }
    },
    [sdk, setSantinoAction, prepareQuestionDeck, penaltySpotX, penaltySpotY, penaltyGoalY, penaltyGoalH, penaltyGoalBottomY],
  );

  // Lifecycle reporting
  usePlaygroundGameLifecycle(gameState, sdk);

  // Autoplay support
  const hasAutoplayed = useRef(false);
  useEffect(() => {
    if (
      !hasAutoplayed.current &&
      new URLSearchParams(window.location.search).has('autoplay')
    ) {
      hasAutoplayed.current = true;
      initGame('CLASSIC');
    }
  }, [initGame]);

  // Advance to Next Question or Trigger Penalty Bonus Round every 5 questions
  const handleNextQuestion = useCallback(() => {
    gameAudio.playCrispClick();
    const nextIndex = currentQuestionIndex + 1;
    const enablePenalty = getConfig('enablePenaltyBonus') as boolean;

    // Check if we hit a 5-question milestone (e.g. after question 5, 10, 15...)
    const isPenaltyMilestone = enablePenalty && gameMode === 'CLASSIC' && nextIndex > 0 && nextIndex % 5 === 0;

    if (isPenaltyMilestone) {
      gameAudio.playLevelUpStinger();
      setSantinoAction('jump');
      setSantinoSpeech(
        `¡Impresionante racha de 5 preguntas! ¡Al punto penal por el bonus aurinegro en el Coloso del Llano!`,
      );
      startPenaltyBonusRound(nextIndex);
    } else if (nextIndex < questionDeck.length) {
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
      setIsAnswered(false);
      setEliminatedOptions([]);
      setIsTimerFrozen(false);
      setActiveHint(null);
      setSantinoAction('idle');

      const timerDuration =
        gameMode === 'TIME_ATTACK'
          ? questionTimerRef.current
          : (getConfig('questionTimer') as number);

      questionTimerRef.current = timerDuration;
      setGameState((prev) => ({
        ...prev,
        level: nextIndex + 1,
        timer: timerDuration,
      }));
    } else {
      // Completed all questions without pending milestone
      unlockTrophy('round_champion');
      if (gameState.score >= 10000) unlockTrophy('trivia_legend');
      gameAudio.playVictoryFanfare();
      setSantinoAction('run');
      setGameState((prev) => ({...prev, status: 'VICTORY'}));
    }
  }, [
    currentQuestionIndex,
    questionDeck.length,
    gameMode,
    gameState.score,
    setSantinoAction,
    unlockTrophy,
    startPenaltyBonusRound,
  ]);

  // Resume Trivia after penalty shootout summary
  const handleResumeTriviaAfterPenalty = useCallback(() => {
    gameAudio.playConfirmSelect();
    const resumeIndex = resumeQuestionIndexRef.current;

    if (resumeIndex < questionDeck.length) {
      setCurrentQuestionIndex(resumeIndex);
      setSelectedOption(null);
      setIsAnswered(false);
      setEliminatedOptions([]);
      setIsTimerFrozen(false);
      setActiveHint(null);
      setSantinoAction('idle');

      const timerDuration =
        gameMode === 'TIME_ATTACK'
          ? questionTimerRef.current
          : (getConfig('questionTimer') as number);

      questionTimerRef.current = timerDuration;
      setSantinoSpeech(
        `¡De vuelta al estudio pirata! Pregunta ${resumeIndex + 1} de ${questionDeck.length}. ¡A sumar más tesoros!`,
      );

      setGameState((prev) => ({
        ...prev,
        status: 'PLAYING',
        level: resumeIndex + 1,
        timer: timerDuration,
      }));
    } else {
      // Reached the end of the entire question deck!
      unlockTrophy('round_champion');
      if (gameStateRef.current.score >= 10000) {
        unlockTrophy('trivia_legend');
      }
      gameAudio.playVictoryFanfare();
      setSantinoAction('run');
      setGameState((prev) => ({...prev, status: 'VICTORY'}));
    }
  }, [questionDeck.length, gameMode, setSantinoAction, unlockTrophy]);

  // Handle Option Selection
  const handleSelectOption = useCallback(
    (index: number) => {
      if (isAnswered || gameState.status !== 'PLAYING' || !currentQ) return;
      if (eliminatedOptions.includes(index)) return;

      setSelectedOption(index);
      setIsAnswered(true);

      const isCorrect = index === currentQ.correctIndex;

      if (isCorrect) {
        unlockTrophy('first_goal');
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        if (nextStreak > maxStreak) setMaxStreak(nextStreak);
        if (nextStreak >= 4) unlockTrophy('streak_master');

        const basePoints = getConfig('pointsPerCorrect') as number;
        const timeMultiplier = getConfig('timeBonusMultiplier') as number;
        const timeBonus = Math.floor(
          Math.max(0, questionTimerRef.current) * timeMultiplier,
        );
        const pointsEarned = (basePoints + timeBonus) * streakMultiplier;

        gameAudio.playCoinPickup();
        setSantinoAction('run');
        spawnConfetti(canvasWidth * 0.18, canvasHeight * 0.45, 50);

        if (nextStreak >= 2) {
          gameAudio.playPowerupChime();
          const qIdx = Math.floor(Math.random() * SANTINO_QUIPS.streak.length);
          setSantinoSpeech(
            `${SANTINO_QUIPS.streak[qIdx]}${streakMultiplier}!`,
          );
        } else {
          const qIdx = Math.floor(Math.random() * SANTINO_QUIPS.correct.length);
          setSantinoSpeech(SANTINO_QUIPS.correct[qIdx]);
        }

        setGameState((prev) => {
          const nextScore = prev.score + pointsEarned;
          if (nextScore >= 10000) unlockTrophy('trivia_legend');
          return {
            ...prev,
            score: nextScore,
          };
        });

        if (gameMode === 'TIME_ATTACK') {
          questionTimerRef.current = Math.min(
            99,
            questionTimerRef.current + 5,
          );
        }
      } else {
        gameAudio.playErrorBuzz();
        setStreak(0);
        setSantinoAction('hurt');
        const qIdx = Math.floor(
          Math.random() * SANTINO_QUIPS.incorrect.length,
        );
        setSantinoSpeech(SANTINO_QUIPS.incorrect[qIdx]);

        setGameState((prev) => {
          const nextLives = (prev.lives ?? 1) - 1;
          if (nextLives <= 0) {
            gameAudio.playDefeatMotif();
            return {...prev, lives: 0, status: 'GAME_OVER'};
          }
          return {...prev, lives: nextLives};
        });
      }
    },
    [
      isAnswered,
      gameState.status,
      currentQ,
      eliminatedOptions,
      streak,
      maxStreak,
      streakMultiplier,
      gameMode,
      setSantinoAction,
      spawnConfetti,
      canvasWidth,
      canvasHeight,
      unlockTrophy,
    ],
  );

  // Wildcard: 50:50
  const handleFiftyFifty = useCallback(() => {
    if (
      wildcardFifty <= 0 ||
      isAnswered ||
      !currentQ ||
      eliminatedOptions.length > 0
    ) {
      return;
    }
    gameAudio.playPowerupChime();
    setWildcardFifty((prev) => prev - 1);

    const incorrectIndices = [0, 1, 2, 3].filter(
      (idx) => idx !== currentQ.correctIndex,
    );
    const toEliminate = shuffle(incorrectIndices).slice(0, 2);
    setEliminatedOptions(toEliminate);
    setSantinoSpeech(SANTINO_QUIPS.fiftyFifty[0]);
  }, [wildcardFifty, isAnswered, currentQ, eliminatedOptions.length]);

  // Wildcard: Hint
  const handleHint = useCallback(() => {
    if (wildcardHint <= 0 || isAnswered || !currentQ || activeHint) return;
    gameAudio.playPowerupChime();
    setWildcardHint((prev) => prev - 1);
    setActiveHint(currentQ.hint);
    const qIdx = Math.floor(Math.random() * SANTINO_QUIPS.hintGiven.length);
    setSantinoSpeech(`${SANTINO_QUIPS.hintGiven[qIdx]} "${currentQ.hint}"`);
  }, [wildcardHint, isAnswered, currentQ, activeHint]);

  // Wildcard: Freeze
  const handleFreeze = useCallback(() => {
    if (wildcardFreeze <= 0 || isAnswered || isTimerFrozen) return;
    gameAudio.playPowerupChime();
    setWildcardFreeze((prev) => prev - 1);
    setIsTimerFrozen(true);
    setSantinoSpeech(SANTINO_QUIPS.freezeTime[0]);
  }, [wildcardFreeze, isAnswered, isTimerFrozen]);

  // Penalty Shootout: Shoot Ball
  const triggerPenaltyKick = useCallback(() => {
    const pen = penaltyRef.current;
    if (pen.phase === 'AIM') {
      gameAudio.playHoverMicroTone();
      pen.phase = 'POWER';
      setPenaltyPhase('POWER');
    } else if (pen.phase === 'POWER') {
      gameAudio.playRetroJump();
      pen.phase = 'SHOOTING';
      setPenaltyPhase('SHOOTING');

      // Calculate target on the goal pitch
      const targetCanvasX = penaltyGoalX + pen.aimX * penaltyGoalW;
      
      // Vertical target calculation
      let targetCanvasY: number;
      const bottomTargetY = penaltyGoalBottomY - 14;
      const topTargetY = penaltyGoalY + 8;
      if (pen.power <= 1.0) {
        targetCanvasY = bottomTargetY - pen.power * (bottomTargetY - topTargetY);
      } else {
        targetCanvasY = topTargetY - (pen.power - 1.0) * 160;
      }

      pen.ballStartX = penaltySpotX;
      pen.ballStartY = penaltySpotY;
      pen.ballTargetX = targetCanvasX;
      pen.ballTargetY = targetCanvasY;
      pen.shotProgress = 0;
      pen.flightTimer = 0;

      // Realistic and fair Goalkeeper AI dive decision:
      // The goalkeeper guesses Left, Center, or Right
      const diveRoll = Math.random();
      let keeperDiveTargetX: number;
      if (diveRoll < 0.38) {
        // Dive Left
        keeperDiveTargetX = penaltyGoalX + penaltyGoalW * 0.22;
      } else if (diveRoll < 0.76) {
        // Dive Right
        keeperDiveTargetX = penaltyGoalX + penaltyGoalW * 0.78;
      } else {
        // Stay / Small step Center
        keeperDiveTargetX = penaltyGoalX + penaltyGoalW * (0.44 + Math.random() * 0.12);
      }

      pen.goalieTargetX = keeperDiveTargetX;
      pen.goalieDiving = true;
      pen.goalieDiveDir = keeperDiveTargetX >= penaltySpotX ? 1 : -1;
      pen.goalieReactionDelay = 0.10; // human reaction lag before diving

      // Precise and fair goal / woodwork collision detection
      const isWideLeft = pen.aimX < 0.04;
      const isWideRight = pen.aimX > 0.96;
      const isWide = isWideLeft || isWideRight;

      const isOverBar = pen.power > 1.04;

      // Woodwork collision checks
      const hitCrossbar = !isWide && pen.power >= 0.985 && pen.power <= 1.04;
      const hitPost = !isOverBar && (
        (pen.aimX >= 0.04 && pen.aimX < 0.075) ||
        (pen.aimX > 0.925 && pen.aimX <= 0.96)
      );

      // Generous inner goal net area
      const isInsideNet = !isWide && !isOverBar && !hitCrossbar && !hitPost;

      // Upper corners / sweet spots (Inatacables!)
      const isUpperCorner = isInsideNet && pen.power >= 0.75 && (pen.aimX <= 0.26 || pen.aimX >= 0.74);
      const isSideNetting = isInsideNet && (pen.aimX <= 0.18 || pen.aimX >= 0.82);
      const isUnderCrossbarRocket = isInsideNet && pen.power >= 0.85;

      // Keeper save calculation:
      // Only saved if goalkeeper guessed the exact side, AND shot is NOT in top corners or side netting!
      let keeperSaved = false;
      if (isInsideNet) {
        if (isUpperCorner || isSideNetting) {
          // Top corners & side netting beat the keeper cleanly
          keeperSaved = false;
        } else {
          const keeperDist = Math.abs(targetCanvasX - keeperDiveTargetX);
          const saveReach = 55;
          keeperSaved = keeperDist < saveReach;
        }
      }

      let msg = '';
      let scored = false;
      let isWoodwork = false;

      if (hitCrossbar) {
        msg = '¡AL TRAVESAÑO! ¡ESTREMECIÓ EL HORIZONTAL!';
        isWoodwork = true;
      } else if (hitPost) {
        msg = '¡AL PALO! ¡REBOTÓ EN EL VERTICAL!';
        isWoodwork = true;
      } else if (isOverBar) {
        msg = '¡POR ARRIBA DEL TRAVESAÑO!';
      } else if (isWide) {
        msg = '¡DESVIADO POR EL COSTADO!';
      } else if (keeperSaved) {
        msg = '¡GRAN ATAJADA DEL ARQUERO!';
      } else if (isUpperCorner) {
        msg = '¡GOOOLAZO AL ÁNGULO! ¡INATAJABLE!';
        scored = true;
      } else if (isUnderCrossbarRocket) {
        msg = '¡MISIL AL FONDO DE LA RED!';
        scored = true;
      } else {
        msg = '¡GOOOLAZO AURINEGRO!';
        scored = true;
      }

      pen.isGoal = scored;
      pen.hitWoodwork = isWoodwork;
      pen.scoreMessage = msg;
      pen.shotsTaken += 1;
      if (scored) {
        pen.goalsScored += 1;
        pen.roundBonusPoints += 1000;
      }

      // Transition to RESULT after ball arrives (~650ms flight)
      setTimeout(() => {
        pen.phase = 'RESULT';
        setPenaltyPhase('RESULT');
        setPenaltyShots(pen.shotsTaken);
        setPenaltyGoals(pen.goalsScored);
        setPenaltyMessage(msg);

        if (scored) {
          gameAudio.playCoinPickup();
          pen.netRippleTimer = 0.65;
          setSantinoAction('jump');
          spawnConfetti(targetCanvasX, targetCanvasY, 65);
          setGameState((prev) => ({...prev, score: prev.score + 1000}));
          if (pen.goalsScored >= 3) unlockTrophy('penalty_hero');
        } else if (isWoodwork) {
          gameAudio.playSwordClash();
          spawnSparks(targetCanvasX, targetCanvasY, 35);
          setSantinoAction('hurt');
        } else if (keeperSaved) {
          gameAudio.playShieldBlock();
          spawnSparks(targetCanvasX, targetCanvasY, 20);
          setSantinoAction('hurt');
        } else {
          gameAudio.playErrorBuzz();
          setSantinoAction('hurt');
        }

        // Advance to next shot or show round summary
        setTimeout(() => {
          if (pen.shotsTaken >= pen.maxShots) {
            // Completed 3 shots! Show bonus round summary
            pen.phase = 'SUMMARY';
            setPenaltyPhase('SUMMARY');
            setPenaltySummaryBonus(pen.roundBonusPoints);
            gameAudio.playPowerupChime();
            setSantinoAction('run');
            if (pen.goalsScored >= 2) {
              setSantinoSpeech(
                `¡Excelente tanda! Lograste ${pen.goalsScored} de 3 goles y sumaste +${pen.roundBonusPoints.toLocaleString()} puntos al marcador.`,
              );
            } else {
              setSantinoSpeech(
                `¡Buena tanda pirata! Sumaste +${pen.roundBonusPoints.toLocaleString()} puntos extra. ¡Vamos con la siguiente serie de preguntas!`,
              );
            }
          } else {
            // Clean state reset for next shot
            pen.phase = 'AIM';
            pen.ballX = penaltySpotX;
            pen.ballY = penaltySpotY;
            pen.ballScale = 1;
            pen.ballRot = 0;
            pen.shotProgress = 0;
            pen.goalieX = penaltySpotX;
            pen.goalieY = penaltyGoalBottomY;
            pen.goalieTargetX = penaltySpotX;
            pen.goalieDiving = false;
            pen.goalieDiveDir = 0;
            pen.hitWoodwork = false;
            pen.netRippleTimer = 0;
            pen.scoreMessage = '';
            setPenaltyPhase('AIM');
            setPenaltyMessage('');
            setSantinoAction('idle');
          }
        }, 1400);
      }, 650);
    }
  }, [
    penaltyGoalX,
    penaltyGoalY,
    penaltyGoalW,
    penaltyGoalH,
    penaltySpotX,
    penaltySpotY,
    penaltyGoalBottomY,
    setSantinoAction,
    spawnConfetti,
    spawnSparks,
    unlockTrophy,
  ]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameMenuOpen || isHowToPlayOpen || isTrophyRoomOpen) return;

      const key = e.key.toLowerCase();
      if (gameState.status === 'PLAYING') {
        if (key === '1' || key === 'a') handleSelectOption(0);
        if (key === '2' || key === 'b') handleSelectOption(1);
        if (key === '3' || key === 'c') handleSelectOption(2);
        if (key === '4' || key === 'd') handleSelectOption(3);
        if (key === 'q') handleFiftyFifty();
        if (key === 'w') handleHint();
        if (key === 'e') handleFreeze();
        if (e.key === ' ' || e.key === 'Enter') {
          if (isAnswered) handleNextQuestion();
        }
      } else if (gameState.status === 'PENALTY_SHOOTOUT') {
        if (penaltyPhase === 'SUMMARY') {
          if (e.key === ' ' || e.key === 'Enter') {
            handleResumeTriviaAfterPenalty();
          }
        } else if (e.key === ' ' || e.key === 'Enter') {
          triggerPenaltyKick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameState.status,
    penaltyPhase,
    isGameMenuOpen,
    isHowToPlayOpen,
    isTrophyRoomOpen,
    isAnswered,
    handleSelectOption,
    handleNextQuestion,
    handleFiftyFifty,
    handleHint,
    handleFreeze,
    triggerPenaltyKick,
    handleResumeTriviaAfterPenalty,
  ]);

  // Update Game Logic
  const update = (dt: number) => {
    if (gameState.status === 'PLAYING') {
      if (santinoSpriteRef.current) {
        santinoAnimStateRef.current = santinoSpriteRef.current.getNextState(
          santinoAnimStateRef.current,
          dt,
        );
      }

      if (!isAnswered && !isTimerFrozen) {
        questionTimerRef.current -= dt;
        const currentSec = Math.max(0, questionTimerRef.current);
        setGameState((prev) => ({...prev, timer: currentSec}));

        if (questionTimerRef.current <= 0) {
          gameAudio.playErrorBuzz();
          setIsAnswered(true);
          setStreak(0);
          setSantinoAction('hurt');
          setSantinoSpeech(
            '¡Se acabó el tiempo pirata! ¡A ponerle más rapidez a la otra!',
          );

          setGameState((prev) => {
            const nextLives = (prev.lives ?? 1) - 1;
            if (nextLives <= 0) {
              gameAudio.playDefeatMotif();
              return {...prev, lives: 0, status: 'GAME_OVER'};
            }
            return {...prev, lives: nextLives};
          });
        }
      }
    } else if (gameState.status === 'PENALTY_SHOOTOUT') {
      if (santinoSpriteRef.current) {
        santinoAnimStateRef.current = santinoSpriteRef.current.getNextState(
          santinoAnimStateRef.current,
          dt,
        );
      }

      const pen = penaltyRef.current;
      if (pen.netRippleTimer > 0) {
        pen.netRippleTimer = Math.max(0, pen.netRippleTimer - dt);
      }

      if (pen.phase === 'AIM') {
        pen.aimX += pen.aimSpeed * dt * pen.aimDir;
        if (pen.aimX >= 0.96) {
          pen.aimX = 0.96;
          pen.aimDir = -1;
        } else if (pen.aimX <= 0.04) {
          pen.aimX = 0.04;
          pen.aimDir = 1;
        }
      } else if (pen.phase === 'POWER') {
        pen.power += pen.powerSpeed * dt * pen.powerDir;
        if (pen.power >= 1.08) {
          pen.power = 1.08;
          pen.powerDir = -1;
        } else if (pen.power <= 0.05) {
          pen.power = 0.05;
          pen.powerDir = 1;
        }
      } else if (pen.phase === 'SHOOTING') {
        pen.flightTimer += dt;
        pen.shotProgress = Math.min(1, pen.flightTimer / pen.flightDuration);
        const t = pen.shotProgress;
        const arcHeight = Math.sin(t * Math.PI) * 75;

        pen.ballX = pen.ballStartX + (pen.ballTargetX - pen.ballStartX) * t;
        pen.ballY =
          pen.ballStartY + (pen.ballTargetY - pen.ballStartY) * t - arcHeight;
        pen.ballScale = Math.max(0.42, 1 - t * 0.58);
        pen.ballRot += dt * 16;

        // Goalkeeper dive begins after reaction delay
        if (pen.flightTimer >= pen.goalieReactionDelay) {
          pen.goalieX += (pen.goalieTargetX - pen.goalieX) * dt * 7.5;
          pen.goalieY = penaltyGoalBottomY - Math.sin(t * Math.PI) * 30;
        }
      }
    }

    // Confetti & Sparks Update
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
      p.rot += p.vRot * dt;
      p.life += dt;
      if (p.life >= p.maxLife) {
        particlesRef.current.splice(i, 1);
      }
    }
  };

  // Draw Game Canvas
  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);

    const isStartOrVictory =
      gameState.status === 'START' ||
      gameState.status === 'VICTORY' ||
      isTrophyRoomOpen;

    const bgImage = isStartOrVictory
      ? assets['bg_port']
      : assets['bg_stadium'];

    drawBackground(ctx, bgImage, canvasWidth, canvasHeight, '#080c14');

    // Studio Stage Atmosphere & Vignette
    const grad = ctx.createRadialGradient(
      canvasWidth * 0.5,
      canvasHeight * 0.5,
      canvasWidth * 0.15,
      canvasWidth * 0.5,
      canvasHeight * 0.5,
      canvasWidth * 0.75,
    );
    grad.addColorStop(0, 'rgba(0,0,0,0.1)');
    grad.addColorStop(1, 'rgba(4, 7, 14, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Left 1/3 Studio Spotlight / Podium Area Highlight
    if (gameState.status === 'PLAYING') {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.04)';
      ctx.fillRect(0, 0, canvasWidth * 0.33, canvasHeight);
    }

    // If Penalty Shootout, draw Soccer Goal and Goalie firmly planted on the grass field
    if (gameState.status === 'PENALTY_SHOOTOUT') {
      const pen = penaltyRef.current;
      const goalX = penaltyGoalX;
      const goalY = penaltyGoalY;
      const goalW = penaltyGoalW;
      const goalH = penaltyGoalH;
      const goalBottom = penaltyGoalBottomY;

      // 1. Pitch Markings: Goal Line & Penalty Spot on the Green Pitch
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(goalX - 60, goalBottom);
      ctx.lineTo(goalX + goalW + 60, goalBottom);
      ctx.stroke();

      // Goal box boundary
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(goalX - 30, goalBottom - 50, goalW + 60, 50);

      // Penalty Spot Dot
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(penaltySpotX, penaltySpotY, 6, 0, Math.PI * 2);
      ctx.fill();

      // 2. Goal Net & 3D Frame Depth
      // Net shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(goalX + 6, goalY + 6, goalW - 12, goalH);

      // Net backdrop
      ctx.fillStyle = 'rgba(240, 240, 245, 0.15)';
      ctx.fillRect(goalX, goalY, goalW, goalH);

      // Net Grid with dynamic net ripple animation on goals
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.5;
      const netSpacing = 22;
      const rippleAmp =
        pen.netRippleTimer > 0 ? Math.sin(pen.netRippleTimer * 25) * 5 : 0;
      for (let x = goalX; x <= goalX + goalW; x += netSpacing) {
        ctx.beginPath();
        const wave = rippleAmp * Math.sin((x - goalX) * 0.06);
        ctx.moveTo(x + wave, goalY);
        ctx.lineTo(x, goalBottom);
        ctx.stroke();
      }
      for (let y = goalY; y <= goalBottom; y += netSpacing) {
        ctx.beginPath();
        const wave = rippleAmp * Math.cos((y - goalY) * 0.06);
        ctx.moveTo(goalX, y + wave);
        ctx.lineTo(goalX + goalW, y + wave);
        ctx.stroke();
      }

      // Goal Frame (White solid posts with 3D highlight)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      ctx.lineJoin = 'miter';
      ctx.strokeRect(goalX, goalY, goalW, goalH);

      // Inner post gloss / 3D depth
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.strokeRect(goalX + 3, goalY + 3, goalW - 6, goalH - 3);

      // Corner join brackets (Upper 90 highlight markers)
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(goalX - 2, goalY - 2, 8, 8);
      ctx.fillRect(goalX + goalW - 6, goalY - 2, 8, 8);

      // 3. Goalkeeper Standing / Diving on Goal Line
      ctx.save();
      const isDiving = pen.goalieDiving && pen.phase === 'SHOOTING';
      const keeperBaseY = pen.goalieY;

      // Shadow on pitch
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(pen.goalieX, goalBottom + 2, 28, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isDiving) {
        ctx.translate(pen.goalieX, keeperBaseY - 35);
        ctx.rotate(pen.goalieDiveDir * 0.45);
        ctx.translate(-pen.goalieX, -(keeperBaseY - 35));
      }

      const goalieW = 46;
      const goalieH = 72;
      const gX = pen.goalieX - goalieW / 2;
      const gY = keeperBaseY - goalieH;

      // Goalkeeper Body (Aurinegro striped jersey)
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(gX, gY + 22, goalieW, 30);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(gX + 6, gY + 22, 10, 30);
      ctx.fillRect(gX + 28, gY + 22, 10, 30);

      // Goalkeeper Shorts & Cleats
      ctx.fillStyle = '#000000';
      ctx.fillRect(gX + 4, gY + 52, goalieW - 8, 16);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(gX + 6, gY + 68, 12, 6);
      ctx.fillRect(gX + goalieW - 18, gY + 68, 12, 6);

      // Goalkeeper Head & Bandana
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(pen.goalieX, gY + 12, 14, 0, Math.PI * 2);
      ctx.fill();
      // Pirate Yellow Bandana
      ctx.fillStyle = '#EAB308';
      ctx.fillRect(pen.goalieX - 14, gY - 2, 28, 8);
      // Eye-patch
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(pen.goalieX + (pen.goalieDiveDir >= 0 ? 4 : -4), gY + 11, 4, 0, Math.PI * 2);
      ctx.fill();

      // Goalkeeper Gloves
      ctx.fillStyle = '#F59E0B';
      if (isDiving) {
        ctx.fillRect(pen.goalieX + (pen.goalieDiveDir > 0 ? 24 : -38), gY + 10, 16, 16);
        ctx.fillRect(pen.goalieX + (pen.goalieDiveDir > 0 ? 16 : -30), gY + 28, 14, 14);
      } else {
        ctx.fillRect(gX - 10, gY + 22, 14, 14);
        ctx.fillRect(gX + goalieW - 4, gY + 22, 14, 14);
      }
      ctx.restore();

      // 4. Aim Reticle & Multi-Zone Power Visuals
      if (pen.phase === 'AIM' || pen.phase === 'POWER') {
        const aimCanvasX = goalX + pen.aimX * goalW;
        
        let aimCanvasY: number;
        const bottomTargetY = goalBottom - 14;
        const topTargetY = goalY + 8;
        if (pen.power <= 1.0) {
          aimCanvasY = bottomTargetY - pen.power * (bottomTargetY - topTargetY);
        } else {
          aimCanvasY = topTargetY - (pen.power - 1.0) * 160;
        }

        // Glowing crosshair
        const isUpperSweetSpot = pen.power >= 0.75 && pen.power <= 0.95;
        const isWoodworkZone = pen.power > 0.98;
        ctx.strokeStyle = isWoodworkZone
          ? '#F59E0B'
          : isUpperSweetSpot
          ? '#38BDF8'
          : '#FACC15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(aimCanvasX, aimCanvasY, 20, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(aimCanvasX - 28, aimCanvasY);
        ctx.lineTo(aimCanvasX + 28, aimCanvasY);
        ctx.moveTo(aimCanvasX, aimCanvasY - 28);
        ctx.lineTo(aimCanvasX + 28, aimCanvasY);
        ctx.stroke();

        // Multi-zone Power gauge bar next to crosshair during POWER phase
        if (pen.phase === 'POWER') {
          const pBarW = 14;
          const pBarH = 76;
          const pBarX = aimCanvasX + 32;
          const pBarY = aimCanvasY - pBarH / 2;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.fillRect(pBarX, pBarY, pBarW, pBarH);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(pBarX, pBarY, pBarW, pBarH);

          const fillRatio = Math.min(1, pen.power / 1.05);
          const fillH = pBarH * fillRatio;
          
          let fillColor = '#FACC15';
          if (pen.power > 0.98) {
            fillColor = '#F59E0B'; // Woodwork / Over
          } else if (pen.power >= 0.75) {
            fillColor = '#38BDF8'; // Sweet spot under crossbar / top corners
          } else {
            fillColor = '#4ADE80'; // Solid clean goal zone
          }
          
          ctx.fillStyle = fillColor;
          ctx.fillRect(pBarX + 1, pBarY + pBarH - fillH, pBarW - 2, fillH);

          // Target sweet spot marker line
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          const sweetSpotY = pBarY + pBarH * (1 - 0.88 / 1.05);
          ctx.beginPath();
          ctx.moveTo(pBarX - 3, sweetSpotY);
          ctx.lineTo(pBarX + pBarW + 3, sweetSpotY);
          ctx.stroke();
        }
      }

      // 5. Soccer Ball with shadow & rotation
      if (pen.phase !== 'SUMMARY') {
        const ballSize = 62 * pen.ballScale;
        const shadowScale = pen.ballScale * 0.8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(
          pen.ballX,
          penaltySpotY - (penaltySpotY - goalBottom) * (1 - pen.ballScale),
          24 * shadowScale,
          8 * shadowScale,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // Draw Ball Sprite with rotation
        ctx.save();
        ctx.translate(pen.ballX, pen.ballY);
        ctx.rotate(pen.ballRot);
        drawAsset(
          ctx,
          assets['ball'],
          -ballSize / 2,
          -ballSize / 2,
          ballSize,
          ballSize,
          (fbCtx) => {
            fbCtx.fillStyle = '#FFFFFF';
            fbCtx.beginPath();
            fbCtx.arc(0, 0, ballSize / 2, 0, Math.PI * 2);
            fbCtx.fill();
            fbCtx.fillStyle = '#000000';
            fbCtx.beginPath();
            fbCtx.arc(0, 0, ballSize / 4, 0, Math.PI * 2);
            fbCtx.fill();
          },
        );
        ctx.restore();
      }
    }

    // Draw Santino Host on Left 1/3 Stage
    if (
      santinoSpriteRef.current &&
      (gameState.status === 'PLAYING' ||
        gameState.status === 'PENALTY_SHOOTOUT' ||
        gameState.status === 'VICTORY')
    ) {
      const santinoW = 280;
      const santinoH = 280;
      const santinoX = canvasWidth * 0.08;
      const santinoY = canvasHeight * 0.42;

      // Studio Podium / Desk
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(santinoX - 20, santinoY + santinoH - 50, santinoW + 40, 50);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(santinoX - 20, santinoY + santinoH - 50, santinoW + 40, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(santinoX - 20, santinoY + santinoH - 44, santinoW + 40, 6);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(santinoX - 20, santinoY + santinoH - 38, santinoW + 40, 6);

      // Studio Stand Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.ellipse(
        santinoX + santinoW / 2,
        santinoY + santinoH - 30,
        110,
        22,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Draw Host Sprite
      santinoSpriteRef.current.draw(
        ctx,
        santinoAnimStateRef.current,
        santinoX,
        santinoY,
        santinoW,
        santinoH,
        assets,
        false,
      );

      // Santino TV Studio Nameplate
      ctx.fillStyle = '#facc15';
      ctx.fillRect(santinoX + 30, santinoY + santinoH - 22, santinoW - 60, 24);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 13px "Press Start 2P", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SANTINO', santinoX + santinoW / 2, santinoY + santinoH - 6);
    }

    // Confetti & Sparks Rendering
    for (const p of particlesRef.current) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  };

  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  // Main Loop
  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
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

      if (!isGameMenuOpen && !isHowToPlayOpen && !isTrophyRoomOpen) {
        stepperRef.current?.(time, (dt) => updateRef.current(dt));
      }

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawRef.current(ctx);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isGameMenuOpen, isHowToPlayOpen, isTrophyRoomOpen, exitChat]);

  const isMusicPlaying = !isMusicMuted;

  const bgmUrl =
    gameState.status === 'VICTORY'
      ? 'assets/audio/bgm_victory_fanfare.mp3'
      : gameState.status === 'PLAYING' || gameState.status === 'PENALTY_SHOOTOUT'
      ? 'assets/audio/bgm_trivia_theme.mp3'
      : 'assets/audio/bgm_title_theme.mp3';

  const startBtnRef = useAutoFocus<HTMLButtonElement>(
    gameState.status === 'START',
  );

  const optionLabels = ['A', 'B', 'C', 'D'];

  const maxTime =
    gameMode === 'TIME_ATTACK' ? 60 : (getConfig('questionTimer') as number);
  const timeRemaining = gameState.timer ?? 0;
  const timerProgressPercent = Math.min(
    100,
    Math.max(0, ((maxTime - timeRemaining) / maxTime) * 100),
  );

  return (
    <div className="fixed inset-0 overflow-hidden touch-none flex flex-col bg-black text-white font-mono select-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
        .font-pixel {
          font-family: 'Press Start 2P', 'VT323', monospace, monospace;
        }
        .font-pixel-lcd {
          font-family: 'VT323', 'Press Start 2P', monospace;
        }
        .pixel-box {
          box-shadow: 4px 4px 0px #000000, inset 2px 2px 0px rgba(255,255,255,0.2), inset -2px -2px 0px rgba(0,0,0,0.4);
        }
        .pixel-btn-yellow {
          box-shadow: 4px 4px 0px #000000, inset 2px 2px 0px #fef08a, inset -2px -2px 0px #854d0e;
        }
        .pixel-btn-dark {
          box-shadow: 4px 4px 0px #000000, inset 2px 2px 0px #334155, inset -2px -2px 0px #020617;
        }
        .scanlines {
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%, 
            rgba(0, 0, 0, 0.25) 50%
          ), linear-gradient(
            90deg,
            rgba(255, 0, 0, 0.03),
            rgba(0, 255, 0, 0.01),
            rgba(0, 0, 255, 0.03)
          );
          background-size: 100% 4px, 6px 100%;
          pointer-events: none;
        }
      `}</style>

      {/* Asset Loading Screen */}
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white p-6 text-center font-pixel">
          <div className="text-xl md:text-2xl text-yellow-400 mb-4 animate-pulse">
            ★ CARGANDO EL TESORO DE COQUIMBO 16-BIT ★
          </div>
          <div className="text-xs text-yellow-200">
            Sintonizando el estudio de Santino...
          </div>
        </div>
      )}

      {/* Background Music */}
      <BackgroundMusic
        url={bgmUrl}
        isPlaying={isMusicPlaying}
        isMuted={isMusicMuted}
        volume={getConfig('defaultMusicVolume') as number}
      />

      {/* ========================================================================= */}
      {/* FULL-STAGE VIEWPORT WITH INTEGRATED 1/3 HOST & 2/3 QUESTION STUDIO LAYOUT  */}
      {/* ========================================================================= */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        {/* Background Render Canvas */}
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
          }}
          className="h-auto max-w-full max-h-full block shadow-2xl"
        />

        {/* Scanline CRT overlay for full 16-bit retro aesthetic */}
        <div className="absolute inset-0 scanlines pointer-events-none z-10 opacity-70" />

        {/* ========================================================================= */}
        {/* ACTIVE GAMEPLAY STAGE: RESPONSIVE DESKTOP + MOBILE LAYOUTS                */}
        {/* ========================================================================= */}
        {gameState.status === 'PLAYING' && currentQ && (
          <>
            {/* --------------------------------------------------------------------- */}
            {/* MOBILE VIEW (< md): COMPACT, BALANCED VERTICAL FLOW WITH ZERO CLIPPING */}
            {/* --------------------------------------------------------------------- */}
            <div className="md:hidden absolute inset-0 z-20 flex flex-col p-2 overflow-y-auto pointer-events-auto gap-2">
              {/* Mobile Top Header: Score, Round, Timer, Lives, Menu */}
              <div className="bg-slate-950/95 border-2 border-yellow-400 p-2 pixel-box flex items-center justify-between gap-1 shadow-lg shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="bg-black px-2 py-0.5 border border-yellow-500 flex items-center gap-1">
                    <span className="font-pixel text-[8px] text-yellow-400">PTS:</span>
                    <span className="font-pixel-lcd text-lg text-yellow-300 font-bold leading-none">
                      {gameState.score.toString().padStart(6, '0')}
                    </span>
                  </div>
                  <span className="font-pixel text-[8px] text-yellow-300 bg-slate-900 px-1.5 py-1 border border-slate-700">
                    {currentQuestionIndex + 1}/{questionDeck.length}
                  </span>
                </div>

                {/* Progress Bar Timer */}
                <div className="flex-1 max-w-[80px] h-3.5 bg-black border border-yellow-400 overflow-hidden relative mx-1">
                  <div
                    className={`h-full transition-all duration-100 ease-linear ${
                      isTimerFrozen ? 'bg-cyan-400' : 'bg-yellow-400'
                    }`}
                    style={{ width: `${timerProgressPercent}%` }}
                  />
                </div>

                {/* Lives & Menu Button */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 bg-black px-1 py-0.5 border border-slate-700">
                    {Array.from({length: getConfig('startingLives') as number}).map((_, i) => {
                      const hasLife = (gameState.lives ?? 0) > i;
                      return (
                        <img
                          key={i}
                          src={ASSETS_MANIFEST.jersey}
                          alt="Life"
                          className={`w-3.5 h-4 object-contain ${hasLife ? 'opacity-100' : 'opacity-20 grayscale'}`}
                        />
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      gameAudio.playCrispClick();
                      setIsGameMenuOpen(true);
                    }}
                    className="px-2 py-1 bg-yellow-400 text-black font-pixel text-[8px] border border-black pixel-btn-yellow active:translate-y-0.5">
                    MENÚ
                  </button>
                </div>
              </div>

              {/* Santino Speech & Comodines Row */}
              <div className="flex items-stretch gap-2 shrink-0">
                {/* Santino Speech Pill */}
                <div className="flex-1 bg-slate-950/90 border-2 border-yellow-400 p-1.5 pixel-box flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400 flex items-center justify-center shrink-0">
                    <span className="text-base">🏴‍☠️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[8px] text-yellow-400">SANTINO</span>
                      {streak > 1 && (
                        <span className="font-pixel text-[7px] bg-yellow-500 text-black px-1 font-bold animate-pulse">
                          x{streakMultiplier}
                        </span>
                      )}
                    </div>
                    <p className="font-pixel-lcd text-xs text-yellow-200 line-clamp-2 leading-tight">
                      "{santinoSpeech}"
                    </p>
                  </div>
                </div>

                {/* Comodines Mini Dock */}
                <div className="flex items-center gap-1 bg-slate-950/90 border-2 border-yellow-500/80 p-1 pixel-box shrink-0">
                  <button
                    onClick={handleFiftyFifty}
                    disabled={wildcardFifty <= 0 || isAnswered || eliminatedOptions.length > 0}
                    title="50:50"
                    className={`px-1.5 py-1 border flex flex-col items-center justify-center min-w-[36px] ${
                      wildcardFifty > 0 && !isAnswered && eliminatedOptions.length === 0
                        ? 'bg-amber-500 border-yellow-300 text-black pixel-btn-yellow active:translate-y-0.5'
                        : 'bg-slate-900 border-slate-700 text-slate-600 opacity-40 cursor-not-allowed'
                    }`}>
                    <span className="font-pixel text-[8px] font-black">50:50</span>
                    <span className="font-pixel text-[7px]">({wildcardFifty})</span>
                  </button>

                  <button
                    onClick={handleHint}
                    disabled={wildcardHint <= 0 || isAnswered || !!activeHint}
                    title="Pista"
                    className={`px-1.5 py-1 border flex flex-col items-center justify-center min-w-[36px] ${
                      wildcardHint > 0 && !isAnswered && !activeHint
                        ? 'bg-amber-500 border-yellow-300 text-black pixel-btn-yellow active:translate-y-0.5'
                        : 'bg-slate-900 border-slate-700 text-slate-600 opacity-40 cursor-not-allowed'
                    }`}>
                    <span className="font-pixel text-[8px] font-black">PISTA</span>
                    <span className="font-pixel text-[7px]">({wildcardHint})</span>
                  </button>

                  <button
                    onClick={handleFreeze}
                    disabled={wildcardFreeze <= 0 || isAnswered || isTimerFrozen}
                    title="Pausa"
                    className={`px-1.5 py-1 border flex flex-col items-center justify-center min-w-[36px] ${
                      wildcardFreeze > 0 && !isAnswered && !isTimerFrozen
                        ? 'bg-cyan-500 border-cyan-200 text-black pixel-btn-yellow active:translate-y-0.5'
                        : 'bg-slate-900 border-slate-700 text-slate-600 opacity-40 cursor-not-allowed'
                    }`}>
                    <span className="font-pixel text-[8px] font-black">PAUSA</span>
                    <span className="font-pixel text-[7px]">({wildcardFreeze})</span>
                  </button>
                </div>
              </div>

              {/* Mobile Question Card */}
              <div className="bg-slate-950/95 border-2 border-yellow-400 p-3 pixel-box flex flex-col gap-2 shadow-xl">
                {/* Category & Difficulty */}
                <div className="flex items-center justify-between border-b border-yellow-500/30 pb-1">
                  <span className="font-pixel text-[8px] text-yellow-400 truncate max-w-[200px]">
                    ★ {currentQ.category.toUpperCase()} ★
                  </span>
                  <span className="font-pixel text-[7px] text-slate-400 shrink-0">
                    {'⭐'.repeat(currentQ.difficulty)}
                  </span>
                </div>

                {/* Question Text */}
                <h2 className="font-pixel text-[11px] sm:text-xs text-white leading-relaxed my-0.5">
                  {currentQ.question}
                </h2>

                {/* 4 Interactive Answer Options */}
                <div className="flex flex-col gap-1.5 mt-1">
                  {currentQ.options.map((option, idx) => {
                    const isEliminated = eliminatedOptions.includes(idx);
                    const isChosen = selectedOption === idx;
                    const isCorrect = idx === currentQ.correctIndex;

                    let btnClass =
                      'bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-600 pixel-btn-dark active:translate-y-0.5';

                    if (isEliminated) {
                      btnClass =
                        'bg-slate-950/40 text-slate-700 border-slate-800 opacity-30 line-through cursor-not-allowed';
                    } else if (isAnswered) {
                      if (isCorrect) {
                        btnClass =
                          'bg-emerald-600 text-white border-2 border-emerald-300 font-bold animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]';
                      } else if (isChosen && !isCorrect) {
                        btnClass =
                          'bg-amber-900 text-yellow-200 border-2 border-amber-500 font-bold';
                      } else {
                        btnClass =
                          'bg-slate-950/60 text-slate-500 border-slate-800 opacity-40';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswered || isEliminated}
                        onClick={() => handleSelectOption(idx)}
                        className={`min-h-[46px] px-3 py-2 text-left flex items-center gap-2.5 transition-all ${btnClass}`}>
                        <span className="w-5 h-5 bg-yellow-400 text-black border border-black font-pixel text-[9px] flex items-center justify-center font-black shrink-0">
                          {optionLabels[idx]}
                        </span>
                        <span className="font-pixel-lcd text-sm sm:text-base font-bold flex-1 leading-snug">
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Continue Button */}
                {isAnswered && (
                  <div className="mt-2 pt-2 border-t-2 border-yellow-500/40 flex flex-col gap-2">
                    <div className="font-pixel-lcd text-xs sm:text-sm text-yellow-200 bg-slate-900/80 p-2 border border-slate-700">
                      💡 {currentQ.explanation}
                    </div>
                    <button
                      onClick={handleNextQuestion}
                      autoFocus
                      className="min-h-[46px] w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 active:translate-y-0.5 text-black font-pixel text-xs border-2 border-black pixel-btn-yellow flex items-center justify-center gap-2">
                      <span>CONTINUAR</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* DESKTOP VIEW (>= md): FULL 1/3 - 2/3 TV STUDIO LAYOUT                 */}
            {/* --------------------------------------------------------------------- */}
            <div className="hidden md:flex absolute inset-0 z-20 flex-row pointer-events-none p-4">
              {/* LEFT 1/3: SANTINO HOST PODIUM & SPEECH MONITOR & WILDCARDS LIFELINES */}
              <div className="w-1/3 flex flex-col justify-between pointer-events-auto p-3 max-h-full">
                {/* Santino Speech Broadcast Bubble */}
                <div className="bg-slate-950/90 border-4 border-yellow-400 p-3 pixel-box flex flex-col gap-1 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b-2 border-yellow-500/50 pb-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-yellow-400 font-pixel text-xs">
                        🏴‍☠️ SANTINO
                      </span>
                    </div>
                    {streak > 1 && (
                      <span className="font-pixel text-[9px] bg-yellow-500 text-black px-1.5 py-0.5 border border-black font-bold animate-pulse">
                        RACHA x{streakMultiplier}
                      </span>
                    )}
                  </div>
                  <p className="font-pixel-lcd text-lg text-yellow-200 leading-snug tracking-wide">
                    "{santinoSpeech}"
                  </p>
                </div>

                {/* Host Left Bottom Controls: Wildcards / Lifelines Dock */}
                <div className="mt-auto bg-slate-950/90 border-4 border-yellow-500/80 p-3 pixel-box flex flex-col gap-2">
                  <div className="font-pixel text-[10px] text-yellow-400 tracking-wider flex items-center justify-between border-b border-yellow-500/30 pb-1">
                    <span>COMODINES PIRATAS</span>
                    <span className="text-slate-400 text-[8px]">[Q, W, E]</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {/* 50:50 */}
                    <button
                      onClick={handleFiftyFifty}
                      disabled={
                        wildcardFifty <= 0 ||
                        isAnswered ||
                        eliminatedOptions.length > 0
                      }
                      title="50:50 (Q) - Elimina dos incorrectas"
                      className={`min-h-[52px] p-1 border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${
                        wildcardFifty > 0 && !isAnswered && eliminatedOptions.length === 0
                          ? 'bg-amber-500 hover:bg-amber-400 border-yellow-300 text-black pixel-btn-yellow active:translate-y-0.5'
                          : 'bg-slate-900 border-slate-700 text-slate-600 opacity-40 cursor-not-allowed'
                      }`}>
                      <div className="flex items-center gap-1">
                        <img
                          src={ASSETS_MANIFEST.wildcard_fifty}
                          alt="50:50"
                          className="w-4 h-4 object-contain"
                        />
                        <span className="font-pixel text-[10px] font-black">50:50</span>
                      </div>
                      <span className="font-pixel text-[8px]">({wildcardFifty})</span>
                    </button>

                    {/* Hint */}
                    <button
                      onClick={handleHint}
                      disabled={wildcardHint <= 0 || isAnswered || !!activeHint}
                      title="Pista (W) - Pídele un dato a Santino"
                      className={`min-h-[52px] p-1 border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${
                        wildcardHint > 0 && !isAnswered && !activeHint
                          ? 'bg-amber-500 hover:bg-amber-400 border-yellow-300 text-black pixel-btn-yellow active:translate-y-0.5'
                          : 'bg-slate-900 border-slate-700 text-slate-600 opacity-40 cursor-not-allowed'
                      }`}>
                      <div className="flex items-center gap-1">
                        <img
                          src={ASSETS_MANIFEST.wildcard_hint}
                          alt="Pista"
                          className="w-4 h-4 object-contain"
                        />
                        <span className="font-pixel text-[10px] font-black">PISTA</span>
                      </div>
                      <span className="font-pixel text-[8px]">({wildcardHint})</span>
                    </button>

                    {/* Freeze */}
                    <button
                      onClick={handleFreeze}
                      disabled={wildcardFreeze <= 0 || isAnswered || isTimerFrozen}
                      title="Pausa (E) - Congela el tiempo"
                      className={`min-h-[52px] p-1 border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${
                        wildcardFreeze > 0 && !isAnswered && !isTimerFrozen
                          ? 'bg-cyan-500 hover:bg-cyan-400 border-cyan-200 text-black pixel-btn-yellow active:translate-y-0.5'
                          : 'bg-slate-900 border-slate-700 text-slate-600 opacity-40 cursor-not-allowed'
                      }`}>
                      <div className="flex items-center gap-1">
                        <img
                          src={ASSETS_MANIFEST.wildcard_freeze}
                          alt="Pausa"
                          className="w-4 h-4 object-contain"
                        />
                        <span className="font-pixel text-[10px] font-black">PAUSA</span>
                      </div>
                      <span className="font-pixel text-[8px]">({wildcardFreeze})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT 2/3: INTEGRATED IN-GAME STUDIO HUD & RETRO QUESTION BOARD */}
              <div className="w-2/3 flex flex-col justify-between pointer-events-auto p-3 max-h-full gap-2">
                {/* Integrated Retro Studio Top Marquee */}
                <div className="bg-slate-950/95 border-4 border-yellow-400 p-2.5 pixel-box flex flex-wrap items-center justify-between gap-2 shadow-2xl">
                  {/* Score Marquee */}
                  <div className="flex items-center gap-1.5 bg-black px-2.5 py-1 border-2 border-yellow-500">
                    <span className="font-pixel text-[10px] text-yellow-400">PUNTOS:</span>
                    <span className="font-pixel-lcd text-2xl text-yellow-300 font-bold tracking-wider">
                      {gameState.score.toString().padStart(6, '0')}
                    </span>
                  </div>

                  {/* Round Counter */}
                  <div className="font-pixel text-[10px] text-yellow-300 bg-slate-900 px-2 py-1 border border-slate-700">
                    PREGUNTA {currentQuestionIndex + 1}/{questionDeck.length}
                  </div>

                  {/* Yellow Progress Bar Timer */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-pixel text-[9px] text-yellow-400">⏱</span>
                    <div
                      className={`w-36 h-6 bg-black border-2 transition-all relative overflow-hidden flex items-center p-0.5 ${
                        isTimerFrozen
                          ? 'border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                          : (gameState.timer ?? 0) <= 5
                          ? 'border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse'
                          : 'border-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.4)]'
                      }`}
                      title="Tiempo">
                      <div
                        className={`h-full transition-all duration-100 ease-linear ${
                          isTimerFrozen ? 'bg-cyan-400' : 'bg-yellow-400'
                        }`}
                        style={{ width: `${timerProgressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Aurinegro Lives & Menu Trigger */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-black px-1.5 py-0.5 border border-slate-700">
                      {Array.from({length: getConfig('startingLives') as number}).map((_, i) => {
                        const hasLife = (gameState.lives ?? 0) > i;
                        return (
                          <img
                            key={i}
                            src={ASSETS_MANIFEST.jersey}
                            alt="Life"
                            className={`w-4 h-5 object-contain transition-all ${
                              hasLife ? 'opacity-100 scale-100' : 'opacity-20 grayscale scale-75'
                            }`}
                          />
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        gameAudio.playCrispClick();
                        setIsGameMenuOpen((prev) => !prev);
                      }}
                      className="min-w-[40px] min-h-[40px] px-2 py-1 bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[9px] border-2 border-black pixel-btn-yellow active:translate-y-0.5">
                      MENÚ
                    </button>
                  </div>
                </div>

                {/* Main TV Question Video Wall */}
                <div className="bg-slate-950/95 border-4 border-yellow-400 p-4 pixel-box flex flex-col gap-2.5 shadow-2xl backdrop-blur-lg flex-1 justify-center">
                  {/* Category Marquee Banner */}
                  <div className="flex items-center justify-between border-b-2 border-yellow-500/40 pb-1.5">
                    <div className="flex items-center gap-1.5 bg-yellow-950 px-2.5 py-0.5 border border-yellow-500">
                      <img
                        src={ASSETS_MANIFEST.ball}
                        alt="Ball"
                        className="w-3.5 h-3.5 object-contain inline-block"
                      />
                      <span className="font-pixel text-[11px] text-yellow-400">
                        ★ {currentQ.category.toUpperCase()} ★
                      </span>
                    </div>
                    <span className="font-pixel text-[8px] text-slate-400">
                      DIFICULTAD: {'⭐'.repeat(currentQ.difficulty)}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h2 className="font-pixel text-xs md:text-sm lg:text-base text-white leading-relaxed tracking-wide my-1">
                    {currentQ.question}
                  </h2>

                  {/* 4 Interactive Answer Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {currentQ.options.map((option, idx) => {
                      const isEliminated = eliminatedOptions.includes(idx);
                      const isChosen = selectedOption === idx;
                      const isCorrect = idx === currentQ.correctIndex;

                      let btnClass =
                        'bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-600 pixel-btn-dark active:translate-y-0.5';

                      if (isEliminated) {
                        btnClass =
                          'bg-slate-950/40 text-slate-700 border-slate-800 opacity-30 line-through cursor-not-allowed';
                      } else if (isAnswered) {
                        if (isCorrect) {
                          btnClass =
                            'bg-emerald-600 text-white border-2 border-emerald-300 font-bold animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]';
                        } else if (isChosen && !isCorrect) {
                          btnClass =
                            'bg-amber-900 text-yellow-200 border-2 border-amber-500 font-bold';
                        } else {
                          btnClass =
                            'bg-slate-950/60 text-slate-500 border-slate-800 opacity-40';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswered || isEliminated}
                          onClick={() => handleSelectOption(idx)}
                          className={`min-h-[56px] px-3 py-2 text-left flex items-center gap-2.5 transition-all ${btnClass}`}>
                          <span className="w-6 h-6 bg-yellow-400 text-black border border-black font-pixel text-[10px] flex items-center justify-center font-black shrink-0">
                            {optionLabels[idx]}
                          </span>
                          <span className="font-pixel-lcd text-lg md:text-xl font-bold flex-1 leading-snug">
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation & Next Question Marquee Bar */}
                  {isAnswered && (
                    <div className="mt-2 pt-2 border-t-2 border-yellow-500/40 flex flex-row items-center justify-between gap-2">
                      <div className="font-pixel-lcd text-sm md:text-base text-yellow-200 flex-1 text-left bg-slate-900/80 p-2 border border-slate-700">
                        💡 {currentQ.explanation}
                      </div>
                      <button
                        onClick={handleNextQuestion}
                        autoFocus
                        className="min-w-[48px] min-h-[48px] px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:translate-y-0.5 text-black font-pixel text-xs border-2 border-black pixel-btn-yellow flex items-center justify-center gap-2 shrink-0">
                        <span>CONTINUAR [ENTER]</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* PENALTY SHOOTOUT BONUS ROUND CONTROLS & HUD                               */}
        {/* ========================================================================= */}
        {gameState.status === 'PENALTY_SHOOTOUT' && (
          <div className="absolute inset-x-0 bottom-4 px-4 max-w-lg mx-auto flex flex-col items-center gap-3 z-30 pointer-events-auto">
            {penaltyPhase === 'SUMMARY' ? (
              /* Bonus Round Complete Summary Card */
              <div className="bg-slate-950/95 border-4 border-yellow-400 p-5 w-full text-center pixel-box shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
                <div className="font-pixel text-xs text-yellow-400 uppercase mb-2 flex items-center justify-center gap-2">
                  <span>★</span>
                  <span>¡TANDA DE PENALES FINALIZADA!</span>
                  <span>★</span>
                </div>

                <div className="bg-black/90 border-2 border-yellow-500 p-3 my-3 flex flex-col items-center gap-2">
                  <div className="font-pixel text-xs text-emerald-400">
                    GOLES CONVERTIDOS: {penaltyGoals} / 3
                  </div>
                  <div className="font-pixel text-sm text-yellow-300">
                    BONUS TOTAL: +{penaltySummaryBonus.toLocaleString()} PUNTOS
                  </div>
                </div>

                <p className="font-pixel-lcd text-base text-yellow-200 mb-4">
                  "{santinoSpeech}"
                </p>

                <button
                  onClick={handleResumeTriviaAfterPenalty}
                  autoFocus
                  className="min-w-[48px] min-h-[48px] w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-xs border-2 border-black pixel-btn-yellow flex items-center justify-center gap-2 active:translate-y-0.5">
                  <span>
                    {resumeQuestionIndexRef.current < questionDeck.length
                      ? `CONTINUAR TRIVIA (PREGUNTA ${resumeQuestionIndexRef.current + 1}) [ESPACIO]`
                      : 'VER RESULTADOS FINALES [ESPACIO]'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Active Penalty Shootout Controls */
              <div className="bg-slate-950/95 border-4 border-yellow-400 p-4 w-full text-center pixel-box shadow-2xl backdrop-blur-md">
                <div className="font-pixel text-xs text-yellow-400 uppercase mb-2 flex items-center justify-center gap-2">
                  <span>⚽</span>
                  <span>DUELO DE PENALES PIRATA BONUS</span>
                  <span>⚽</span>
                </div>

                {/* Progress & Goals Tracker */}
                <div className="flex items-center justify-center gap-4 bg-black/80 py-1 px-3 border border-yellow-500/50 mb-2">
                  <span className="font-pixel text-[10px] text-yellow-300">
                    TIRO {Math.min(3, penaltyShots + (penaltyPhase === 'AIM' || penaltyPhase === 'POWER' ? 1 : 0))} / 3
                  </span>
                  <span className="font-pixel text-[10px] text-emerald-400">
                    GOLES: {penaltyGoals} (+{(penaltyGoals * 1000).toLocaleString()} PTS)
                  </span>
                </div>

                {/* Dynamic Result / Instruction Banner */}
                {penaltyMessage ? (
                  <div
                    className={`font-pixel text-xs my-2 py-1 px-2 border-2 animate-bounce ${
                      penaltyMessage.includes('GOOOLAZO') || penaltyMessage.includes('MISIL')
                        ? 'bg-yellow-950 text-yellow-300 border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)]'
                        : penaltyMessage.includes('PALO') || penaltyMessage.includes('TRAVESAÑO')
                        ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'bg-black text-yellow-400 border-yellow-500 shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                    }`}>
                    {penaltyMessage}
                  </div>
                ) : penaltyPhase === 'AIM' ? (
                  <p className="font-pixel-lcd text-base text-yellow-200 mb-2">
                    1. Apunta hacia los palos y presiona para fijar dirección.
                  </p>
                ) : penaltyPhase === 'POWER' ? (
                  <p className="font-pixel-lcd text-base text-yellow-300 mb-2 animate-pulse">
                    2. ¡Calcula la potencia (Azul = Ángulo) y remata al arco!
                  </p>
                ) : (
                  <p className="font-pixel-lcd text-base text-slate-300 mb-2">
                    ¡Pelota en juego hacia el arco...!
                  </p>
                )}

                {/* Action Button */}
                <button
                  onClick={triggerPenaltyKick}
                  disabled={penaltyPhase === 'SHOOTING' || penaltyPhase === 'RESULT'}
                  className={`min-w-[48px] min-h-[48px] w-full py-3 font-pixel text-xs border-2 border-black pixel-btn-yellow transition-all ${
                    penaltyPhase === 'AIM'
                      ? 'bg-yellow-400 hover:bg-yellow-300 text-black active:translate-y-0.5 cursor-pointer'
                      : penaltyPhase === 'POWER'
                      ? 'bg-amber-400 hover:bg-amber-300 text-black active:translate-y-0.5 animate-pulse cursor-pointer'
                      : 'bg-slate-800 text-slate-400 border-slate-700 opacity-60 cursor-not-allowed'
                  }`}>
                  <span>
                    {penaltyPhase === 'AIM'
                      ? '1. FIJAR DIRECCIÓN [ESPACIO]'
                      : penaltyPhase === 'POWER'
                      ? '2. ¡PATEAR AL ARCO! [ESPACIO]'
                      : penaltyPhase === 'SHOOTING'
                      ? 'PATEANDO...'
                      : penaltyShots >= 3
                      ? 'FINALIZANDO...'
                      : 'PREPARANDO SIGUIENTE TIRO...'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* START MENU OVERLAY (16-BIT RETRO PIXEL ART STYLE)                         */}
      {/* ========================================================================= */}
      {gameState.status === 'START' && (
        <MenuOverlay tone="neutral" zIndex={40}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-yellow-400 p-6 md:p-8 flex flex-col items-center pixel-box shadow-2xl">
            {/* Pirate Trophy Graphic */}
            <div className="relative mb-3">
              <img
                src={ASSETS_MANIFEST.trophy}
                alt="Trofeo Pirata"
                className="w-20 h-20 md:w-24 md:h-24 object-contain animate-pulse"
              />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-2 animate-spin" />
            </div>

            <h1 className="font-pixel text-lg md:text-xl text-center text-yellow-400 mb-2 leading-relaxed tracking-wider">
              EL TESORO DE COQUIMBO
            </h1>
            <p className="font-pixel-lcd text-base md:text-xl text-yellow-200 text-center mb-6">
              ¡Conducido por Santino en el Sánchez Rumoroso!
            </p>

            {/* Mode Select Buttons */}
            <div className="w-full flex flex-col gap-3 mb-6">
              <button
                ref={startBtnRef}
                autoFocus
                onClick={() => {
                  gameAudio.playConfirmSelect();
                  initGame('CLASSIC');
                }}
                className="min-w-[48px] min-h-[48px] w-full bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-3 font-pixel text-xs border-2 border-black pixel-btn-yellow flex items-center justify-center gap-2 active:translate-y-0.5">
                <Play className="w-4 h-4 fill-black" />
                <span>TRIVIA CLÁSICA</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playConfirmSelect();
                  initGame('TIME_ATTACK');
                }}
                className="min-w-[48px] min-h-[48px] w-full bg-slate-900 hover:bg-slate-800 text-yellow-300 border-2 border-yellow-400 px-4 py-3 font-pixel text-[11px] pixel-btn-dark flex items-center justify-center gap-2 active:translate-y-0.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>CONTRARRELOJ (60s)</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsTrophyRoomOpen(true);
                }}
                className="min-w-[48px] min-h-[48px] w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border-2 border-slate-700 px-4 py-2.5 font-pixel text-[10px] pixel-btn-dark flex items-center justify-center gap-2 active:translate-y-0.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>SALA DE TROFEOS ({unlockedTrophies.length}/{TROPHIES.length})</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsLeaderboardOpen(true);
                }}
                className="min-w-[48px] min-h-[48px] w-full bg-slate-900 hover:bg-slate-800 text-yellow-300 border-2 border-amber-500/70 px-4 py-2.5 font-pixel text-[10px] pixel-btn-dark flex items-center justify-center gap-2 active:translate-y-0.5">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>TABLA DE LÍDERES</span>
              </button>

              <button
                onClick={() => void exitChat({})}
                className="min-w-[48px] min-h-[48px] w-full bg-black hover:bg-slate-900 text-slate-300 hover:text-white border-2 border-slate-700 px-4 py-2.5 font-pixel text-[10px] flex items-center justify-center gap-2 transition-colors active:translate-y-0.5">
                <Home className="w-4 h-4 text-yellow-400" />
                <span>← VOLVER A VIRALGAMES</span>
              </button>
            </div>

            {/* Audio & How to play footer */}
            <div className="flex items-center justify-between w-full border-t border-yellow-500/30 pt-3">
              <button
                onClick={() => {
                  const next = !isMusicMuted;
                  setIsMusicMuted(next);
                  gameAudio.playCrispClick();
                }}
                className="font-pixel-lcd text-base text-yellow-400 hover:text-white flex items-center gap-1.5 transition-colors">
                {isMusicMuted ? (
                  <VolumeX className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>MÚSICA: {isMusicMuted ? 'OFF' : 'ON'}</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(true);
                }}
                className="font-pixel-lcd text-base text-yellow-400 hover:text-white underline flex items-center gap-1 transition-colors">
                <BookOpen className="w-4 h-4" />
                <span>¿CÓMO JUGAR?</span>
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* GAME MENU / PAUSE OVERLAY                                                 */}
      {/* ========================================================================= */}
      {isGameMenuOpen && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-yellow-400 p-6 flex flex-col items-center pixel-box shadow-2xl">
            <h2 className="font-pixel text-sm md:text-base text-yellow-400 mb-6 flex items-center gap-2">
              <MenuIcon className="w-5 h-5" />
              MENÚ DE JUEGO
            </h2>

            <div className="w-full flex flex-col gap-3 mb-6">
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                }}
                autoFocus
                className="min-w-[48px] min-h-[48px] w-full bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-xs py-3 border-2 border-black pixel-btn-yellow flex items-center justify-center gap-2 active:translate-y-0.5">
                <Play className="w-4 h-4 fill-black" />
                <span>REANUDAR PARTIDA</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const next = !isMusicMuted;
                    setIsMusicMuted(next);
                  }}
                  className="min-w-[48px] min-h-[48px] bg-slate-900 text-slate-200 border-2 border-slate-700 py-2 font-pixel text-[9px] flex items-center justify-center gap-1.5 pixel-btn-dark">
                  {isMusicMuted ? (
                    <VolumeX className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>MÚSICA: {isMusicMuted ? 'OFF' : 'ON'}</span>
                </button>

                <button
                  onClick={() => {
                    const next = gameAudio.toggleMute();
                    setIsSfxMuted(next);
                  }}
                  className="min-w-[48px] min-h-[48px] bg-slate-900 text-slate-200 border-2 border-slate-700 py-2 font-pixel text-[9px] flex items-center justify-center gap-1.5 pixel-btn-dark">
                  {isSfxMuted ? (
                    <VolumeX className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>SFX: {isSfxMuted ? 'OFF' : 'ON'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                  initGame(gameMode);
                }}
                className="min-w-[48px] min-h-[48px] w-full bg-slate-900 text-slate-200 border-2 border-slate-700 py-2.5 font-pixel text-[10px] flex items-center justify-center gap-2 pixel-btn-dark active:translate-y-0.5">
                <RotateCcw className="w-4 h-4" />
                <span>REINICIAR RONDA</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(true);
                }}
                className="min-w-[48px] min-h-[48px] w-full bg-slate-900 text-slate-200 border-2 border-slate-700 py-2.5 font-pixel text-[10px] flex items-center justify-center gap-2 pixel-btn-dark active:translate-y-0.5">
                <HelpCircle className="w-4 h-4 text-yellow-400" />
                <span>CÓMO JUGAR</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsLeaderboardOpen(true);
                }}
                className="min-w-[48px] min-h-[48px] w-full bg-slate-900 hover:bg-slate-800 text-yellow-300 border-2 border-amber-500/70 py-2.5 font-pixel text-[10px] flex items-center justify-center gap-2 pixel-btn-dark active:translate-y-0.5">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>TABLA DE LÍDERES</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                  setGameState((prev) => ({...prev, status: 'START'}));
                }}
                className="min-w-[48px] min-h-[48px] w-full bg-slate-900 text-slate-200 border-2 border-slate-700 hover:border-yellow-400 py-2.5 font-pixel text-[9px] flex items-center justify-center gap-2 active:translate-y-0.5 pixel-btn-dark transition-colors">
                <Home className="w-4 h-4 text-yellow-400" />
                <span>SALIR AL MENÚ PRINCIPAL</span>
              </button>

              <button
                onClick={() => void exitChat({})}
                className="min-w-[48px] min-h-[48px] w-full bg-black text-slate-300 hover:text-white border-2 border-slate-700 py-2.5 font-pixel text-[9px] flex items-center justify-center gap-2 active:translate-y-0.5 transition-colors">
                <Home className="w-4 h-4 text-yellow-400" />
                <span>← VOLVER A VIRALGAMES</span>
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* HOW TO PLAY GUIDE OVERLAY                                                 */}
      {/* ========================================================================= */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="w-full max-w-lg bg-slate-950 border-4 border-yellow-400 p-6 md:p-8 flex flex-col pixel-box shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b-2 border-yellow-500/40 mb-4">
              <h2 className="font-pixel text-xs md:text-sm text-yellow-400 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                GUÍA DEL ESTUDIO PIRATA
              </h2>
              <button
                onClick={() => setIsHowToPlayOpen(false)}
                className="min-w-[48px] min-h-[48px] text-yellow-400 hover:text-white flex items-center justify-center">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-3 font-pixel-lcd text-base md:text-lg text-yellow-100 mb-6 leading-relaxed">
              <div className="bg-slate-900 p-3 border-2 border-slate-700">
                <strong className="text-yellow-400 block mb-1">
                  1. REGLAS BÁSICAS:
                </strong>
                Responde las preguntas antes de que se agoten los 20 segundos. Tienes 3 vidas (camisetas).
              </div>

              <div className="bg-slate-900 p-3 border-2 border-slate-700">
                <strong className="text-yellow-400 block mb-1">
                  2. RACHA AURINEGRA:
                </strong>
                Acierta 2, 3 o 4 seguidas para activar multiplicadores x2, x3 y x4.
              </div>

              <div className="bg-slate-900 p-3 border-2 border-slate-700">
                <strong className="text-yellow-400 block mb-1">
                  3. COMODINES (Q, W, E):
                </strong>
                <ul className="list-disc list-inside space-y-1 mt-1 text-slate-300">
                  <li><strong className="text-amber-300">50:50 (Q):</strong> Elimina 2 opciones falsas.</li>
                  <li><strong className="text-amber-300">Pista (W):</strong> Santino te da un dato clave.</li>
                  <li><strong className="text-cyan-300">Pausa (E):</strong> Congela el tiempo para pensar.</li>
                </ul>
              </div>

              <div className="bg-slate-900 p-3 border-2 border-slate-700">
                <strong className="text-yellow-400 block mb-1">
                  4. BONUS DE PENALES CADA 5 PREGUNTAS:
                </strong>
                Cada 5 preguntas contestadas se activa una tanda de penales bonus. ¡Patea con puntería a los ángulos para sumar 1.000 puntos extra por cada gol!
              </div>
            </div>

            <button
              onClick={() => setIsHowToPlayOpen(false)}
              autoFocus
              className="min-w-[48px] min-h-[48px] w-full bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-xs py-3 border-2 border-black pixel-btn-yellow flex items-center justify-center gap-2 active:translate-y-0.5">
              <span>¡ENTENDIDO, VAMOS PIRATAS!</span>
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* TROPHY ROOM GALLERY OVERLAY                                               */}
      {/* ========================================================================= */}
      {isTrophyRoomOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="w-full max-w-lg bg-slate-950 border-4 border-yellow-400 p-6 flex flex-col pixel-box shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b-2 border-yellow-500/40 mb-4">
              <h2 className="font-pixel text-xs md:text-sm text-yellow-400 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                SALA DE TROFEOS PIRATAS
              </h2>
              <button
                onClick={() => setIsTrophyRoomOpen(false)}
                className="min-w-[48px] min-h-[48px] text-yellow-400 hover:text-white flex items-center justify-center">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 mb-6 max-h-[50vh] overflow-y-auto pr-1">
              {TROPHIES.map((t) => {
                const isUnlocked = unlockedTrophies.includes(t.id);
                return (
                  <div
                    key={t.id}
                    className={`p-3 border-2 flex items-center gap-3 transition-all ${
                      isUnlocked
                        ? 'bg-yellow-950/40 border-yellow-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 opacity-40'
                    }`}>
                    <div className="w-10 h-10 p-1.5 bg-black border border-slate-700 flex items-center justify-center shrink-0">
                      {isUnlocked ? (
                        <img
                          src={ASSETS_MANIFEST.trophy}
                          alt="Trophy"
                          className="w-7 h-7 object-contain"
                        />
                      ) : (
                        <span className="text-xl">🔒</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-pixel text-[10px] text-yellow-400">
                        {t.title}
                      </div>
                      <div className="font-pixel-lcd text-sm text-yellow-100">{t.desc}</div>
                    </div>
                    {isUnlocked && (
                      <span className="font-pixel text-[8px] uppercase text-emerald-300 bg-emerald-950 px-2 py-0.5 border border-emerald-500">
                        OK
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsTrophyRoomOpen(false)}
              autoFocus
              className="min-w-[48px] min-h-[48px] w-full bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-xs py-3 border-2 border-black pixel-btn-yellow flex items-center justify-center gap-2 active:translate-y-0.5">
              <span>VOLVER</span>
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* LEADERBOARD MODAL (CLOUD FIRESTORE LIVE RANKINGS)                         */}
      {/* ========================================================================= */}
      {isLeaderboardOpen && (
        <MenuOverlay tone="neutral" zIndex={70}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-yellow-400 p-5 md:p-6 flex flex-col pixel-box shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b-2 border-yellow-500/40 mb-3">
              <h2 className="font-pixel text-xs sm:text-sm text-yellow-400 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                TABLA DE HONOR AURINEGRA
              </h2>
              <button
                onClick={() => setIsLeaderboardOpen(false)}
                className="text-yellow-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 my-2 max-h-[50vh] overflow-y-auto pr-1">
              {leaderboard.length === 0 ? (
                <p className="font-pixel-lcd text-sm text-slate-400 text-center py-4">
                  Sincronizando tabla de líderes con la nube...
                </p>
              ) : (
                leaderboard.slice(0, 10).map((entry, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 border ${
                      idx === 0
                        ? 'bg-yellow-950/60 border-yellow-400 text-yellow-300'
                        : idx === 1
                        ? 'bg-slate-900 border-slate-400 text-slate-200'
                        : idx === 2
                        ? 'bg-amber-950/50 border-amber-600 text-amber-300'
                        : 'bg-black/70 border-slate-800 text-slate-300'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-[9px] w-6 text-center font-black">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                      <span className="font-pixel text-[10px] font-bold">
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-[8px] text-slate-400 hidden sm:inline">
                        {entry.stageName}
                      </span>
                      <span className="font-pixel-lcd text-sm md:text-base font-bold text-yellow-400">
                        {Number(entry.score).toLocaleString()} PTS
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setIsLeaderboardOpen(false)}
              className="mt-3 w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-xs border-2 border-black pixel-btn-yellow flex items-center justify-center gap-2 active:translate-y-0.5">
              VOLVER
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* GAME OVER OVERLAY (INTERACTIVE SCORE SUBMISSION & LEADERBOARDS)            */}
      {/* ========================================================================= */}
      {gameState.status === 'GAME_OVER' && (
        <MenuOverlay tone="danger" zIndex={50}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-amber-500 p-5 md:p-6 flex flex-col items-center pixel-box shadow-2xl text-center">
            <div className="text-3xl mb-1">☠️</div>
            <h2 className="font-pixel text-base md:text-lg text-amber-400 mb-1">
              ¡FIN DE PARTIDA!
            </h2>
            <p className="font-pixel-lcd text-sm text-yellow-200 mb-3">
              "¡En el puerto aurinegro nos levantamos siempre!"
            </p>

            {/* Score Box */}
            <div className="w-full bg-black border-2 border-amber-500/80 p-3 mb-3">
              <span className="font-pixel text-[9px] text-slate-400 block mb-1">PUNTUACIÓN FINAL</span>
              <span className="font-pixel-lcd text-2xl md:text-3xl text-yellow-400 font-bold">
                {gameState.score.toLocaleString()} PUNTOS
              </span>
            </div>

            {/* Name Input & Submit to Cloud Firestore */}
            {!scoreSubmitted ? (
              <div className="w-full bg-slate-900 border border-yellow-500/60 p-3 mb-3 flex flex-col gap-2">
                <label className="font-pixel text-[9px] text-yellow-300 text-left">
                  REGISTRA TU APODO PIRATA:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={12}
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    placeholder="@APODO"
                    className="flex-1 bg-black text-yellow-400 font-pixel text-xs px-2 py-2 border-2 border-yellow-400 outline-none uppercase"
                  />
                  <button
                    onClick={() => handleSaveScore(gameState.score, `Pregunta ${currentQuestionIndex + 1}`)}
                    className="px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[10px] border border-black pixel-btn-yellow active:translate-y-0.5">
                    GUARDAR
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full bg-emerald-950 border border-emerald-500 p-2 mb-3 text-center">
                <span className="font-pixel text-[9px] text-emerald-300">
                  ✓ ¡PUNTAJE REGISTRADO EN LA NUBE!
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => initGame(gameMode)}
                autoFocus
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-xs border-2 border-black pixel-btn-yellow flex items-center justify-center gap-2 active:translate-y-0.5">
                <RotateCcw className="w-4 h-4" />
                <span>REINTENTAR PARTIDA [ESPACIO]</span>
              </button>

              <button
                onClick={() => setIsLeaderboardOpen(true)}
                className="w-full py-2 bg-slate-900 text-yellow-300 border border-slate-700 font-pixel text-[10px] flex items-center justify-center gap-2 pixel-btn-dark active:translate-y-0.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>VER TABLA DE LÍDERES</span>
              </button>

              <button
                onClick={() => void exitChat({})}
                className="w-full py-2 bg-black text-slate-400 hover:text-white border border-slate-800 font-pixel text-[9px] flex items-center justify-center gap-2 transition-colors">
                <Home className="w-3.5 h-3.5 text-yellow-400" />
                <span>VOLVER A VIRALGAMES</span>
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* VICTORY OVERLAY (INTERACTIVE SCORE SUBMISSION & TROPHY CELEBRATION)       */}
      {/* ========================================================================= */}
      {gameState.status === 'VICTORY' && (
        <MenuOverlay tone="victory" zIndex={50}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-yellow-400 p-5 md:p-6 flex flex-col items-center pixel-box shadow-2xl text-center animate-in zoom-in-95">
            <div className="relative mb-2">
              <img
                src={ASSETS_MANIFEST.trophy}
                alt="Trofeo Pirata"
                className="w-16 h-16 object-contain animate-bounce"
              />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-2 animate-spin" />
            </div>

            <h2 className="font-pixel text-base md:text-lg text-yellow-400 mb-1">
              ¡CAMPEONES DEL PUERTO!
            </h2>
            <p className="font-pixel-lcd text-sm text-yellow-200 mb-3">
              "¡Felicidades Pirata! Lograste una puntuación estelar junto a Santino."
            </p>

            {/* Score Box */}
            <div className="w-full bg-black border-2 border-yellow-500/80 p-3 mb-3">
              <span className="font-pixel text-[9px] text-slate-400 block mb-1">PUNTUACIÓN RECORD</span>
              <span className="font-pixel-lcd text-2xl md:text-3xl text-yellow-400 font-bold">
                {gameState.score.toLocaleString()} PUNTOS
              </span>
            </div>

            {/* Name Input & Submit to Cloud Firestore */}
            {!scoreSubmitted ? (
              <div className="w-full bg-slate-900 border border-yellow-500/60 p-3 mb-3 flex flex-col gap-2">
                <label className="font-pixel text-[9px] text-yellow-300 text-left">
                  REGISTRA TU APODO DE CAMPEÓN:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={12}
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    placeholder="@APODO"
                    className="flex-1 bg-black text-yellow-400 font-pixel text-xs px-2 py-2 border-2 border-yellow-400 outline-none uppercase"
                  />
                  <button
                    onClick={() => handleSaveScore(gameState.score, 'Gran Campeón')}
                    className="px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[10px] border border-black pixel-btn-yellow active:translate-y-0.5">
                    GUARDAR
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full bg-emerald-950 border border-emerald-500 p-2 mb-3 text-center">
                <span className="font-pixel text-[9px] text-emerald-300">
                  ✓ ¡PUNTAJE REGISTRADO EN LA NUBE!
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => initGame(gameMode)}
                autoFocus
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-xs border-2 border-black pixel-btn-yellow flex items-center justify-center gap-2 active:translate-y-0.5">
                <RotateCw className="w-4 h-4" />
                <span>JUGAR OTRA VEZ [ESPACIO]</span>
              </button>

              <button
                onClick={() => setIsLeaderboardOpen(true)}
                className="w-full py-2 bg-slate-900 text-yellow-300 border border-slate-700 font-pixel text-[10px] flex items-center justify-center gap-2 pixel-btn-dark active:translate-y-0.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>VER TABLA DE LÍDERES</span>
              </button>

              <button
                onClick={() => void exitChat({})}
                className="w-full py-2 bg-black text-slate-400 hover:text-white border border-slate-800 font-pixel text-[9px] flex items-center justify-center gap-2 transition-colors">
                <Home className="w-3.5 h-3.5 text-yellow-400" />
                <span>VOLVER A VIRALGAMES</span>
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}
    </div>
  );
}
