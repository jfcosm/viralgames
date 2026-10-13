// tslint:disable
/* eslint-disable */
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Coins,
  Film,
  Flame,
  Gamepad,
  Heart,
  HelpCircle,
  History,
  Hourglass,
  Info,
  Menu,
  Music,
  Palette,
  Play,
  RotateCw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {CONFIG, getConfig} from './constants';
import {
  CATEGORIES,
  CategoryInfo,
  getTierConfigForStage,
  prepareQuestionForPlay,
  Question,
  ROBERTO_QUOTES,
  ROBERTO_WRONG_QUOTES,
  SUSANA_QUOTES,
  SUSANA_WRONG_QUOTES,
  TRIVIA_QUESTIONS,
  TriviaCategory,
} from './triviaData';
import BackgroundMusic from './utils/BackgroundMusic';
import { subscribeLeaderboard, saveLeaderboardToDb } from '../../firebase';

export interface LeaderboardEntry {
  name: string;
  score: number;
  stageName: string;
  date: string;
}

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { name: '@concurso_tv', score: 14200, stageName: 'Minuto de Oro', date: '1995' },
  { name: 'DON_FRANCIS', score: 11800, stageName: 'Etapa 8',        date: '1995' },
  { name: '@susana_fan',  score: 9500,  stageName: 'Etapa 7',        date: '1995' },
  { name: 'ROBERTO_TV',  score: 7400,  stageName: 'Etapa 5',        date: '1995' },
  { name: 'CURIOSO_90',  score: 5200,  stageName: 'Etapa 3',        date: '1995' },
];
import {
  formatTime,
  gameAudio,
  GameState,
  MenuOverlay,
  Overlay,
  shuffle,
  useAssets,
  useAutoFocus,
  useIsMobile,
} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle,
  useRpc,
} from './utils/usePlayground';

const BACKGROUND_MUSIC_URL = 'assets/audio/bgm_trivia_loop_2.mp3';

interface LifelinesState {
  fiftyFifty: boolean;
  hint: boolean;
  extraTime: boolean;
}

export default function App() {
  const isMobile = useIsMobile();
  const {sdk, isReady: sdkReady} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  // Asset preloading
  const ASSETS_MANIFEST: Record<string, string> = useMemo(
    () => ({
      bg_trivia_main: 'assets/images/bg_trivia_main.png',
      host_female: 'assets/images/host_female_presenter.png',
      host_male: 'assets/images/host_male_presenter.png',
      icon_history: 'assets/images/icon_history.png',
      icon_geography: 'assets/images/icon_geography.png',
      icon_literature: 'assets/images/icon_literature.png',
      icon_arts: 'assets/images/icon_arts.png',
      icon_music: 'assets/images/icon_music.png',
      icon_cinema: 'assets/images/icon_cinema.png',
      icon_sports: 'assets/images/icon_sports.png',
      icon_politics: 'assets/images/icon_politics.png',
    }),
    [],
  );

  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  // Audio toggles for Game Menu
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  // Game UI overlays
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);

  // --- 16-BIT ARCADE LEADERBOARD STATE ---
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('viralgames_el_tiempo_es_oro_leaderboard');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LEADERBOARD;
  });

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState(() => {
    try {
      return (localStorage.getItem('viralgames_el_tiempo_es_oro_player_name') || 'JUGADOR').slice(0, 12);
    } catch {
      return 'JUGADOR';
    }
  });
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Sincronizar en tiempo real con Cloud Firestore
  useEffect(() => {
    const unsub = subscribeLeaderboard('el-tiempo-es-oro', (cloudEntries: LeaderboardEntry[] | null) => {
      if (cloudEntries && Array.isArray(cloudEntries) && cloudEntries.length > 0) {
        setLeaderboard(cloudEntries);
        try {
          localStorage.setItem('viralgames_el_tiempo_es_oro_leaderboard', JSON.stringify(cloudEntries));
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
      localStorage.setItem('viralgames_el_tiempo_es_oro_leaderboard', JSON.stringify(updated));
      localStorage.setItem('viralgames_el_tiempo_es_oro_player_name', cleanName);
    } catch (e) {
      console.error(e);
    }
    saveLeaderboardToDb('el-tiempo-es-oro', updated);
    gameAudio.playVictoryJingle();
    setIsLeaderboardOpen(true);
  };

  // Game Lifecycle State
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1, // Stage 1 to 8
    lives: getConfig('startingLives') as number,
    timer: 20,
  });

  // Stage & Question Progression (8 stages)
  const categoryOrder: TriviaCategory[] = useMemo(
    () => [
      'history',
      'geography',
      'literature',
      'arts',
      'music',
      'cinema',
      'sports',
      'politics',
    ],
    [],
  );

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentQuestionInStage, setCurrentQuestionInStage] = useState(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  );
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeHostQuote, setActiveHostQuote] = useState<string>('');

  // Shuffled Question Pool for current run to guarantee complete randomization & no repeats
  const runQuestionsByStage = useRef<Record<number, Question[]>>({});

  // Lifelines
  const [lifelines, setLifelines] = useState<LifelinesState>({
    fiftyFifty: true,
    hint: true,
    extraTime: true,
  });
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [activeHintText, setActiveHintText] = useState<string | null>(null);

  // Dynamic Tier Config for Progressive Difficulty
  const currentTierConfig = useMemo(
    () => getTierConfigForStage(currentStageIndex),
    [currentStageIndex],
  );

  // Timer Ref & State
  const [timeLeft, setTimeLeft] = useState<number>(currentTierConfig.timeSeconds);
  const timerIntervalRef = useRef<any>(null);
  const isTimerRunningRef = useRef(false);

  // Focus ref for primary buttons
  const startButtonRef = useAutoFocus<HTMLButtonElement>(
    gameState.status === 'START',
  );
  const resumeButtonRef = useAutoFocus<HTMLButtonElement>(isGameMenuOpen);

  // Host alternation logic
  const currentTotalIndex =
    currentStageIndex * (getConfig('questionsPerStage') as number) +
    currentQuestionInStage;
  const isCurrentHostSusana = currentTotalIndex % 2 === 0;
  const activeHostName = isCurrentHostSusana ? 'Susana' : 'Roberto';
  const activeHostRole = isCurrentHostSusana
    ? 'Animadora Estelar'
    : 'Animador Estelar';
  const activeHostAsset = isCurrentHostSusana
    ? assets['host_female']
    : assets['host_male'];

  const currentCategoryInfo = useMemo(() => {
    const cat = categoryOrder[currentStageIndex] || 'history';
    return CATEGORIES[cat];
  }, [categoryOrder, currentStageIndex]);

  // Load question with full choice randomization and progressive difficulty timer
  const loadQuestion = useCallback(
    (stageIdx: number, qIdx: number) => {
      // Clear any existing timer interval immediately
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      isTimerRunningRef.current = false;

      const cat = categoryOrder[stageIdx] || 'history';
      const stagePool = runQuestionsByStage.current[stageIdx] || [];

      let rawQuestion = stagePool[qIdx];
      if (!rawQuestion) {
        // Fallback: pick any question matching category or universal pool
        const matching = TRIVIA_QUESTIONS.filter((q) => q.category === cat);
        const fallback = matching[Math.floor(Math.random() * matching.length)] || TRIVIA_QUESTIONS[0];
        rawQuestion = fallback;
      }

      // Randomize choice options (A, B, C, D) and recalculate correct index
      const preparedQuestion = prepareQuestionForPlay(rawQuestion);

      setActiveQuestion(preparedQuestion);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setDisabledOptions([]);
      setActiveHintText(null);
      setEarnedPoints(0);

      // Progressive tier countdown time
      const tier = getTierConfigForStage(stageIdx);
      setTimeLeft(tier.timeSeconds);
      isTimerRunningRef.current = true;

      // Host greeting alternation
      const totalIdx = stageIdx * (getConfig('questionsPerStage') as number) + qIdx;
      const isSusanaTurn = totalIdx % 2 === 0;

      if (isSusanaTurn) {
        const introSusana = [
          '¡Susana presenta este desafío! Concédete un segundo de concentración.',
          '¡Hola a todos! Susana toma la conducción en este apasionante desafío cultural.',
          '¡Atención al panel! Susana te pregunta con entusiasmo.',
          '¡El Reloj de Oro corre! Susana te invita a pensar con calma.',
        ];
        setActiveHostQuote(
          preparedQuestion.dialogue ||
            introSusana[totalIdx % introSusana.length],
        );
      } else {
        const introRoberto = [
          '¡Roberto al micrófono! Veamos qué tan afinado está ese conocimiento.',
          '¡Turno de Roberto! El público en el estudio contiene la respiración.',
          '¡Roberto en la conducción! Vamos por esos valiosos puntos dorados.',
          '¡Atención participante! Roberto te desafía en este nuevo segmento.',
        ];
        setActiveHostQuote(
          preparedQuestion.dialogue ||
            introRoberto[totalIdx % introRoberto.length],
        );
      }
    },
    [categoryOrder],
  );

  // Initialize fresh game run with total random subset selection from 1000+ questions
  const initGame = useCallback(
    (startStage = 0) => {
      const startingLives = getConfig('startingLives') as number;
      const questionsPerStage = getConfig('questionsPerStage') as number;

      // Populate randomized question pool for all 8 stages from the 1000+ question universe
      const stagePools: Record<number, Question[]> = {};
      categoryOrder.forEach((catKey, sIdx) => {
        const matchingQuestions = TRIVIA_QUESTIONS.filter(
          (q) => q.category === catKey,
        );
        const shuffledList = shuffle(
          matchingQuestions.length > 0 ? matchingQuestions : TRIVIA_QUESTIONS,
        );
        stagePools[sIdx] = shuffledList.slice(0, questionsPerStage + 2);
      });
      runQuestionsByStage.current = stagePools;

      setCurrentStageIndex(startStage);
      setCurrentQuestionInStage(0);
      setTotalQuestionsAnswered(0);
      setStreak(0);
      setScoreSubmitted(false);
      setIsLeaderboardOpen(false);
      setLifelines({
        fiftyFifty: true,
        hint: true,
        extraTime: true,
      });

      const tier = getTierConfigForStage(startStage);

      setGameState({
        status: 'PLAYING',
        score: 0,
        level: startStage + 1,
        lives: startingLives,
        timer: tier.timeSeconds,
      });

      loadQuestion(startStage, 0);

      if (sdk) {
        sdk.startGame();
      }
    },
    [categoryOrder, loadQuestion, sdk],
  );

  // Hook for Playground Lifecycle score/stage sync
  usePlaygroundGameLifecycle(gameState, sdk);

  // Auto-play support
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

  // Global pause handle
  useEffect(() => {
    (window as any).canHandleBackKey = gameState.status !== 'START';
  }, [gameState.status]);

  // COUNTDOWN TIMER LOGIC: STRICTLY PAUSES WHEN isAnswered === true OR GAME NOT ACTIVE
  useEffect(() => {
    if (
      gameState.status !== 'PLAYING' ||
      isGameMenuOpen ||
      isHowToPlayOpen ||
      isCategorySelectorOpen ||
      isAnswered
    ) {
      isTimerRunningRef.current = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    isTimerRunningRef.current = true;
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          isTimerRunningRef.current = false;
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [
    gameState.status,
    isGameMenuOpen,
    isHowToPlayOpen,
    isCategorySelectorOpen,
    isAnswered,
  ]);

  // Handle timeout: PAUSES timer completely and lets player read cultural trivia
  const handleTimeout = useCallback(() => {
    if (isAnswered || !activeQuestion) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    isTimerRunningRef.current = false;

    gameAudio.playErrorBuzz();
    setIsAnswered(true);
    setIsCorrect(false);
    setSelectedOptionIndex(-1); // No selection / Time ran out
    setStreak(0);

    const timeoutQuotes = isCurrentHostSusana
      ? '¡Susana: Se agotó el Reloj de Oro! Recuerda que en este concurso cada segundo vale oro.'
      : '¡Roberto: Sonó la campana del tiempo! El reloj no espera a nadie, ¡ánimo para la siguiente!';
    setActiveHostQuote(timeoutQuotes);

    setGameState((prev) => {
      const nextLives = Math.max(0, (prev.lives ?? 1) - 1);
      const isOver = nextLives <= 0;
      return {
        ...prev,
        lives: nextLives,
        status: isOver ? 'GAME_OVER' : prev.status,
      };
    });
  }, [activeQuestion, isAnswered, isCurrentHostSusana]);

  // Handle answer selection: INSTANTLY PAUSES TIMER & CALCULATES PROGRESSIVE BONUS
  const handleSelectOption = useCallback(
    (index: number) => {
      if (
        isAnswered ||
        !activeQuestion ||
        disabledOptions.includes(index) ||
        gameState.status !== 'PLAYING'
      )
        return;

      // Immediately freeze the countdown timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      isTimerRunningRef.current = false;

      setSelectedOptionIndex(index);
      setIsAnswered(true);

      const isRight = index === activeQuestion.correctIndex;
      setIsCorrect(isRight);

      const tier = getTierConfigForStage(currentStageIndex);

      if (isRight) {
        gameAudio.playConfirmSelect();
        setTimeout(() => gameAudio.playCoinPickup(), 120);

        const basePoints = tier.pointsBase;
        const speedMultiplier = tier.speedMultiplier;
        const speedBonus = timeLeft * speedMultiplier;
        const streakBonus = streak * tier.streakBonus;
        const totalAwarded = basePoints + speedBonus + streakBonus;
        setEarnedPoints(totalAwarded);

        const nextStreak = streak + 1;
        setStreak(nextStreak);

        // Host enthusiastic quote based on active host
        const hostQuotes = isCurrentHostSusana
          ? SUSANA_QUOTES
          : ROBERTO_QUOTES;
        const randomQuote =
          hostQuotes[Math.floor(Math.random() * hostQuotes.length)];
        setActiveHostQuote(`${activeHostName}: "${randomQuote}"`);

        setGameState((prev) => ({
          ...prev,
          score: prev.score + totalAwarded,
        }));
      } else {
        gameAudio.playErrorBuzz();
        setStreak(0);

        const wrongQuotes = isCurrentHostSusana
          ? SUSANA_WRONG_QUOTES
          : ROBERTO_WRONG_QUOTES;
        const randomWrong =
          wrongQuotes[Math.floor(Math.random() * wrongQuotes.length)];
        setActiveHostQuote(`${activeHostName}: "${randomWrong}"`);

        setGameState((prev) => {
          const nextLives = Math.max(0, (prev.lives ?? 1) - 1);
          const isOver = nextLives <= 0;
          return {
            ...prev,
            lives: nextLives,
            status: isOver ? 'GAME_OVER' : prev.status,
          };
        });
      }
    },
    [
      activeHostName,
      activeQuestion,
      currentStageIndex,
      disabledOptions,
      gameState.status,
      isAnswered,
      isCurrentHostSusana,
      streak,
      timeLeft,
    ],
  );

  // Advance to next question or next stage
  const handleAdvance = useCallback(() => {
    gameAudio.playCrispClick();
    const questionsPerStage = getConfig('questionsPerStage') as number;
    const nextQIdx = currentQuestionInStage + 1;
    setTotalQuestionsAnswered((prev) => prev + 1);

    if (nextQIdx < questionsPerStage) {
      setCurrentQuestionInStage(nextQIdx);
      loadQuestion(currentStageIndex, nextQIdx);
    } else {
      // Stage Completed!
      const nextStageIdx = currentStageIndex + 1;
      if (nextStageIdx < categoryOrder.length) {
        gameAudio.playLevelUpStinger();
        setCurrentStageIndex(nextStageIdx);
        setCurrentQuestionInStage(0);
        setGameState((prev) => ({
          ...prev,
          level: nextStageIdx + 1,
        }));
        loadQuestion(nextStageIdx, 0);
      } else {
        // Grand Victory!
        gameAudio.playVictoryFanfare();
        setGameState((prev) => ({
          ...prev,
          status: 'VICTORY',
        }));
      }
    }
  }, [
    categoryOrder.length,
    currentQuestionInStage,
    currentStageIndex,
    loadQuestion,
  ]);

  // Lifelines logic
  const handleUseFiftyFifty = () => {
    if (!lifelines.fiftyFifty || isAnswered || !activeQuestion) return;
    gameAudio.playPowerupChime();

    const correctIdx = activeQuestion.correctIndex;
    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIdx);
    const shuffledWrong = wrongIndices.sort(() => Math.random() - 0.5);
    const toDisable = shuffledWrong.slice(0, 2);

    setDisabledOptions(toDisable);
    setLifelines((prev) => ({...prev, fiftyFifty: false}));
    setActiveHostQuote(
      `${activeHostName}: "¡Comodín 50/50 Al Toke aplicado! Hemos despejado dos alternativas erradas."`,
    );
  };

  const handleUseHint = () => {
    if (!lifelines.hint || isAnswered || !activeQuestion) return;
    gameAudio.playPowerupChime();
    setActiveHintText(activeQuestion.hint);
    setLifelines((prev) => ({...prev, hint: false}));
    setActiveHostQuote(
      `${activeHostName}: "💡 Pista Clave: ${activeQuestion.hint}"`,
    );
  };

  const handleUseExtraTime = () => {
    if (!lifelines.extraTime || isAnswered) return;
    gameAudio.playPowerupChime();
    const bonus = getConfig('extraTimeLifelineSeconds') as number;
    setTimeLeft((prev) => prev + bonus);
    setLifelines((prev) => ({...prev, extraTime: false}));
    setActiveHostQuote(
      `${activeHostName}: "¡Comodín Tiempo Extra activado! Sumamos +${bonus} segundos de oro."`,
    );
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isHowToPlayOpen) {
          setIsHowToPlayOpen(false);
          return;
        }
        if (isCategorySelectorOpen) {
          setIsCategorySelectorOpen(false);
          return;
        }
        setIsGameMenuOpen((prev) => !prev);
        return;
      }

      if (gameState.status !== 'PLAYING' || isGameMenuOpen || isHowToPlayOpen)
        return;

      if (!isAnswered) {
        if (e.key === '1' || e.key.toLowerCase() === 'a') {
          handleSelectOption(0);
        } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
          handleSelectOption(1);
        } else if (e.key === '3' || e.key.toLowerCase() === 'c') {
          handleSelectOption(2);
        } else if (e.key === '4' || e.key.toLowerCase() === 'd') {
          handleSelectOption(3);
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (gameState.lives && gameState.lives > 0) {
            handleAdvance();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameState.lives,
    gameState.status,
    handleAdvance,
    handleSelectOption,
    isAnswered,
    isCategorySelectorOpen,
    isGameMenuOpen,
    isHowToPlayOpen,
  ]);

  // Music status
  const isMusicPlaying =
    gameState.status === 'PLAYING' && !isGameMenuOpen && !isMusicMuted;

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden touch-none flex flex-col items-center justify-between select-none text-slate-100"
      style={{
        backgroundColor: getConfig('backgroundColor') as string,
        fontFamily: getConfig('fontFamily') as string,
        backgroundImage: `radial-gradient(ellipse at top, rgba(30, 58, 138, 0.5), transparent 70%), radial-gradient(ellipse at bottom, rgba(15, 23, 42, 0.95), #060d17)`,
      }}>
      {/* Background audio */}
      <BackgroundMusic
        url={BACKGROUND_MUSIC_URL}
        isPlaying={isMusicPlaying}
        isMuted={isMusicMuted}
      />

      {/* Loading Overlay */}
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white">
          <div className="flex items-center gap-3 text-2xl font-bold text-amber-400 animate-pulse">
            <Sparkles className="animate-spin text-amber-400" size={32} />
            Cargando Gran Concurso con Susana y Roberto...
          </div>
        </div>
      )}

      {/* Top Banner / Studio Header */}
      <header className="w-full bg-slate-950/85 backdrop-blur border-b border-amber-500/40 px-3 md:px-6 py-2 flex flex-wrap items-center justify-between z-30 shrink-0 gap-2 shadow-xl">
        {/* Left: Title & Stage badge & Progressive Tier Badge */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-3 py-1 rounded-full font-black text-xs md:text-sm tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-300">
            <Trophy size={16} className="shrink-0" />
            <span className="hidden sm:inline">EL TIEMPO ES ORO</span>
            <span className="sm:hidden">EL TIEMPO</span>
          </div>

          {gameState.status === 'PLAYING' && (
            <>
              {/* Progressive Difficulty Tier Indicator */}
              <div
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border font-bold shadow"
                style={{
                  backgroundColor: `${currentTierConfig.themeColor}20`,
                  borderColor: `${currentTierConfig.themeColor}80`,
                  color: currentTierConfig.themeColor,
                }}>
                <Flame size={14} />
                <span>{currentTierConfig.phaseTitle} ({currentTierConfig.timeSeconds}s)</span>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm bg-slate-900 border border-slate-700 px-3 py-1 rounded-xl shadow-inner">
                <span className="text-slate-400">Etapa:</span>
                <span className="font-bold text-amber-400">
                  {currentStageIndex + 1}/8
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-400 font-semibold truncate max-w-[130px] md:max-w-none">
                  {currentCategoryInfo.name}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Center: Lives, Streak & Score */}
        {gameState.status === 'PLAYING' && (
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
            {/* Host Turn Indicator Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-md border ${
                isCurrentHostSusana
                  ? 'bg-gradient-to-r from-pink-900/90 to-amber-900/90 border-pink-400/60 text-pink-200'
                  : 'bg-gradient-to-r from-blue-900/90 to-amber-900/90 border-blue-400/60 text-blue-200'
              }`}>
              <Sparkles
                size={13}
                className={isCurrentHostSusana ? 'text-pink-300' : 'text-blue-300'}
              />
              <span>
                Presenta:{' '}
                <strong className="text-amber-300">{activeHostName}</strong>
              </span>
            </div>

            {/* Vidas */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-rose-500/30 px-2.5 py-1 rounded-full">
              {[...Array(getConfig('startingLives') as number)].map((_, i) => (
                <Heart
                  key={i}
                  size={16}
                  className={`transition-all duration-300 ${
                    i < (gameState.lives ?? 0)
                      ? 'text-rose-500 fill-rose-500 scale-100 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                      : 'text-slate-700 fill-slate-800 scale-90'
                  }`}
                />
              ))}
            </div>

            {/* Streak */}
            {streak > 1 && (
              <div className="hidden md:flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-xs font-bold animate-bounce">
                <Flame size={14} className="text-amber-400 fill-amber-400" />
                Racha x{streak} (+{streak * currentTierConfig.streakBonus} pts)
              </div>
            )}

            {/* Score */}
            <div className="flex items-center gap-1.5 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 px-3 py-1 rounded-xl shadow-inner">
              <Coins size={15} className="text-amber-400" />
              <span className="text-xs text-amber-200">Puntos:</span>
              <span className="font-black text-amber-400 text-sm md:text-base">
                {gameState.score.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Right: Game Menu Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              gameAudio.playCrispClick();
              setIsGameMenuOpen(true);
            }}
            aria-label="Abrir Menú"
            className="min-w-[48px] min-h-[48px] px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-600 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 text-white transition-all shadow-md">
            <Menu size={18} />
            <span className="hidden sm:inline">Menú</span>
          </button>
        </div>
      </header>

      {/* Main Studio Arena */}
      <main className="flex-1 w-full min-h-0 flex flex-col justify-between items-center relative p-2 md:p-4 max-w-6xl">
        {/* Background backdrop */}
        {assets['bg_trivia_main'] && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none rounded-2xl"
            style={{
              backgroundImage: `url(${assets['bg_trivia_main']?.src})`,
              filter: 'blur(1px)',
            }}
          />
        )}

        {/* Decorative Golden Clockwork Gears */}
        <div className="absolute -top-12 -left-12 w-64 h-64 opacity-10 pointer-events-none animate-[spin_60s_linear_infinite]">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full text-amber-400 fill-current">
            <path d="M50,15 A35,35 0 1 0 50,85 A35,35 0 1 0 50,15 M50,25 A25,25 0 1 1 50,75 A25,25 0 1 1 50,25" />
            <path d="M46,0 h8 v15 h-8 z M46,85 h8 v15 h-8 z M0,46 h15 v8 h-15 z M85,46 h15 v8 h-15 z" />
          </svg>
        </div>

        <div className="absolute -bottom-16 -right-16 w-80 h-80 opacity-10 pointer-events-none animate-[spin_80s_linear_infinite_reverse]">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full text-amber-300 fill-current">
            <path d="M50,10 A40,40 0 1 0 50,90 A40,40 0 1 0 50,10 M50,20 A30,30 0 1 1 50,80 A30,30 0 1 1 50,20" />
            <circle cx="50" cy="50" r="10" />
          </svg>
        </div>

        {gameState.status === 'PLAYING' && activeQuestion && (
          <div className="w-full flex-1 flex flex-col justify-between z-10 gap-2 md:gap-4 overflow-y-auto touch-auto">
            {/* Top Stage Bar: Category Icon + Reloj de Oro (congelado al responder) + Comodines */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur border border-slate-700/80 p-2.5 md:p-3.5 rounded-2xl shadow-xl">
              {/* Category & Phase info */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center p-1 shadow">
                  {assets[currentCategoryInfo.iconKey] ? (
                    <img
                      src={assets[currentCategoryInfo.iconKey]?.src}
                      alt={currentCategoryInfo.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Award className="text-amber-400" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <span>
                      Pregunta {currentQuestionInStage + 1} de{' '}
                      {getConfig('questionsPerStage') as number}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400">
                      {currentTierConfig.phaseTitle}
                    </span>
                  </div>
                  <div className="font-extrabold text-xs md:text-sm text-white flex items-center gap-2">
                    <span>{currentCategoryInfo.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (+{currentTierConfig.speedMultiplier} pts/s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Reloj de Oro (Golden Timer with Pausing on Answer) */}
              <div
                className={`flex items-center gap-2.5 bg-slate-950/80 px-3.5 py-1.5 rounded-2xl border transition-all ${
                  isAnswered
                    ? 'border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : timeLeft <= 4
                    ? 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'border-amber-500/40 shadow-inner'
                }`}>
                <div className="relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`transition-all duration-1000 ${
                        isAnswered
                          ? 'text-cyan-400'
                          : timeLeft <= 4
                          ? 'text-rose-500'
                          : 'text-amber-400'
                      }`}
                      strokeDasharray={`${
                        (timeLeft / currentTierConfig.timeSeconds) * 100
                      }, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <Hourglass
                    size={14}
                    className={`absolute ${
                      isAnswered
                        ? 'text-cyan-300'
                        : timeLeft <= 4
                        ? 'text-rose-400 animate-bounce'
                        : 'text-amber-300'
                    }`}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-amber-200 uppercase font-bold tracking-wider flex items-center gap-1">
                    {isAnswered ? '⏸ Reloj Pausado' : 'Reloj de Oro'}
                  </span>
                  <span
                    className={`font-black text-sm md:text-base ${
                      isAnswered
                        ? 'text-cyan-300'
                        : timeLeft <= 4
                        ? 'text-rose-400 animate-pulse'
                        : 'text-amber-300'
                    }`}>
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Comodines (Lifelines) */}
              <div className="flex items-center gap-1.5 md:gap-2">
                {/* 50/50 Al Toke */}
                <button
                  onClick={handleUseFiftyFifty}
                  disabled={!lifelines.fiftyFifty || isAnswered}
                  title="50/50 Al Toke: Descarta 2 opciones incorrectas"
                  className={`min-w-[48px] min-h-[48px] px-2 md:px-3 py-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center border transition-all ${
                    lifelines.fiftyFifty && !isAnswered
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-300 hover:scale-105 active:scale-95'
                      : 'bg-slate-800/50 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed'
                  }`}>
                  <Zap size={14} />
                  <span className="text-[9px] md:text-[10px]">50/50</span>
                </button>

                {/* Pista Clave */}
                <button
                  onClick={handleUseHint}
                  disabled={!lifelines.hint || isAnswered}
                  title="Pista Clave: Recibe una pista para la pregunta actual"
                  className={`min-w-[48px] min-h-[48px] px-2 md:px-3 py-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center border transition-all ${
                    lifelines.hint && !isAnswered
                      ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 text-cyan-300 hover:scale-105 active:scale-95'
                      : 'bg-slate-800/50 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed'
                  }`}>
                  <HelpCircle size={14} />
                  <span className="text-[9px] md:text-[10px]">Pista</span>
                </button>

                {/* Tiempo Extra */}
                <button
                  onClick={handleUseExtraTime}
                  disabled={!lifelines.extraTime || isAnswered}
                  title="Tiempo Extra: Suma +15s al Reloj de Oro"
                  className={`min-w-[48px] min-h-[48px] px-2 md:px-3 py-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center border transition-all ${
                    lifelines.extraTime && !isAnswered
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 text-emerald-300 hover:scale-105 active:scale-95'
                      : 'bg-slate-800/50 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed'
                  }`}>
                  <Sparkles size={14} />
                  <span className="text-[9px] md:text-[10px]">
                    +{getConfig('extraTimeLifelineSeconds') as number}s
                  </span>
                </button>
              </div>
            </div>

            {/* Middle Section: Active Host Dialogue & Question Board */}
            <div className="w-full flex flex-col md:flex-row items-stretch gap-3 md:gap-4 my-auto">
              {/* Active Host Avatar & Speech Bubble */}
              <div
                className={`w-full md:w-72 flex md:flex-col items-center p-3 rounded-2xl shadow-2xl gap-3 shrink-0 border transition-all duration-300 ${
                  isCurrentHostSusana
                    ? 'bg-gradient-to-b from-slate-900/90 via-pink-950/30 to-slate-900/90 border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                    : 'bg-gradient-to-b from-slate-900/90 via-blue-950/30 to-slate-900/90 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                }`}>
                {/* Host Image and Badges */}
                <div className="relative w-20 h-24 md:w-36 md:h-48 shrink-0 flex items-center justify-center">
                  {activeHostAsset ? (
                    <img
                      src={activeHostAsset.src}
                      alt={activeHostName}
                      className="max-w-full max-h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold">
                      {activeHostName[0]}
                    </div>
                  )}
                </div>

                {/* Host Info & Speech Bubble */}
                <div className="flex-1 flex flex-col justify-center w-full">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                          isCurrentHostSusana ? 'bg-pink-400' : 'bg-cyan-400'
                        }`}
                      />
                      <span className="text-xs md:text-sm font-black text-amber-300">
                        {activeHostName}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        isCurrentHostSusana
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}>
                      {activeHostRole}
                    </span>
                  </div>

                  <div className="text-xs md:text-sm text-slate-200 italic bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 shadow-inner">
                    "{activeHostQuote}"
                  </div>
                </div>
              </div>

              {/* Main Question Card & Answers */}
              <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-amber-500/40 p-4 md:p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                {/* Question Header */}
                <div className="mb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] md:text-xs font-bold text-white px-3 py-0.5 rounded-full ${currentCategoryInfo.badgeColor} shadow`}>
                      {currentCategoryInfo.subtitle}
                    </span>
                    <span className="text-[10px] text-amber-400/80 font-semibold">
                      Alternancia:{' '}
                      {isCurrentHostSusana
                        ? 'Susana (Pregunta impar)'
                        : 'Roberto (Pregunta par)'}
                    </span>
                  </div>
                  <h2 className="text-base md:text-xl lg:text-2xl font-black text-white leading-snug">
                    {activeQuestion.question}
                  </h2>

                  {/* Active Hint display */}
                  {activeHintText && (
                    <div className="mt-2.5 p-2 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-xs text-cyan-200 flex items-start gap-2 animate-fadeIn">
                      <HelpCircle
                        size={16}
                        className="text-cyan-400 shrink-0 mt-0.5"
                      />
                      <div>
                        <strong className="text-cyan-300">Pista Clave:</strong>{' '}
                        {activeHintText}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4 Options Grid (Randomly Shuffled each Question) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3.5 my-2">
                  {activeQuestion.options.map((opt, idx) => {
                    const optionLetter = ['A', 'B', 'C', 'D'][idx];
                    const isDisabled = disabledOptions.includes(idx);
                    const isSelected = selectedOptionIndex === idx;
                    const isCorrectAnswer = idx === activeQuestion.correctIndex;

                    let btnStyle =
                      'bg-slate-800/90 hover:bg-slate-700/90 border-slate-600/80 text-white hover:border-amber-400/80 shadow-md';

                    if (isAnswered) {
                      if (isCorrectAnswer) {
                        btnStyle =
                          'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse';
                      } else if (isSelected && !isCorrectAnswer) {
                        btnStyle =
                          'bg-rose-700 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]';
                      } else {
                        btnStyle =
                          'bg-slate-900/60 border-slate-800 text-slate-500 opacity-40';
                      }
                    } else if (isDisabled) {
                      btnStyle =
                        'bg-slate-900/40 border-slate-800 text-slate-600 line-through opacity-30 cursor-not-allowed';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswered || isDisabled}
                        onMouseEnter={() => {
                          if (!isAnswered && !isDisabled) {
                            gameAudio.playHoverMicroTone();
                          }
                        }}
                        className={`min-h-[52px] p-3 rounded-2xl border-2 font-bold text-xs md:text-sm text-left flex items-center justify-between gap-3 transition-all duration-200 active:scale-[0.98] ${btnStyle}`}>
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isAnswered && isCorrectAnswer
                                ? 'bg-white text-emerald-700'
                                : 'bg-slate-950/80 text-amber-400 border border-slate-700'
                            }`}>
                            {optionLetter}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </div>

                        {/* Status Icon */}
                        {isAnswered && (
                          <span className="shrink-0">
                            {isCorrectAnswer && (
                              <CheckCircle2
                                size={20}
                                className="text-white drop-shadow"
                              />
                            )}
                            {isSelected && !isCorrectAnswer && (
                              <XCircle
                                size={20}
                                className="text-white drop-shadow"
                              />
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Cultural Explanation & Didactic Box (Timer frozen with NO time pressure until click) */}
                {isAnswered && (
                  <div
                    className={`mt-3 p-3.5 md:p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 animate-fadeIn ${
                      isCorrect
                        ? 'bg-emerald-950/85 border-emerald-500/60 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-900/95 border-rose-500/50 text-slate-200 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                    }`}>
                    <div className="text-xs md:text-sm flex-1">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        {isCorrect ? (
                          <span className="text-emerald-400 flex items-center gap-1.5 text-sm md:text-base">
                            <CheckCircle2 size={18} />
                            ¡CORRECTO! (+{earnedPoints} pts — {timeLeft}s restantes)
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1.5 text-sm md:text-base">
                            <XCircle size={18} />
                            {selectedOptionIndex === -1
                              ? '¡TIEMPO AGOTADO!'
                              : 'INCORRECTO'}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 text-xs md:text-sm leading-relaxed mt-1">
                        {activeQuestion.explanation}
                      </p>
                      {activeQuestion.funFact && (
                        <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-amber-500/30 text-[11px] md:text-xs text-amber-300 font-medium flex items-start gap-1.5">
                          <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Dato Cultural:</strong> {activeQuestion.funFact}
                          </span>
                        </div>
                      )}
                    </div>

                    {(gameState.lives ?? 1) > 0 && (
                      <button
                        onClick={handleAdvance}
                        autoFocus
                        className="w-full md:w-auto min-w-[170px] min-h-[48px] bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 px-6 py-2.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all active:scale-95 border-2 border-yellow-200">
                        <span>Siguiente Pregunta</span>
                        <Play size={16} className="fill-slate-950" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Keyboard Guide for Desktop */}
            {!isMobile && (
              <div className="w-full py-1 text-center text-[10px] text-slate-400 flex items-center justify-center gap-4">
                <span>
                  ⌨️ Teclado:{' '}
                  <strong className="text-amber-300">1, 2, 3, 4</strong> o{' '}
                  <strong className="text-amber-300">A, B, C, D</strong> para
                  responder
                </span>
                <span>•</span>
                <span>
                  <strong className="text-amber-300">Espacio / Enter</strong>{' '}
                  para continuar
                </span>
                <span>•</span>
                <span>
                  <strong className="text-amber-300">Esc</strong> para Menú
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* START SCREEN OVERLAY */}
      {gameState.status === 'START' && (
        <MenuOverlay tone="neutral" zIndex={40}>
          <div className="w-full max-w-2xl flex flex-col items-center bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 border-2 border-amber-500/60 rounded-3xl p-5 md:p-8 shadow-[0_0_40px_rgba(245,158,11,0.3)] relative text-center overflow-hidden">
            {/* Background Clockwork & Glowing Shimmer */}
            <div className="absolute -top-10 -left-10 w-48 h-48 opacity-15 pointer-events-none animate-[spin_40s_linear_infinite]">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-amber-400 fill-current">
                <path d="M50,15 A35,35 0 1 0 50,85 A35,35 0 1 0 50,15 M50,25 A25,25 0 1 1 50,75 A25,25 0 1 1 50,25" />
                <path d="M46,0 h8 v15 h-8 z M46,85 h8 v15 h-8 z M0,46 h15 v8 h-15 z M85,46 h15 v8 h-15 z" />
              </svg>
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-15 pointer-events-none animate-[spin_50s_linear_infinite_reverse]">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-yellow-300 fill-current">
                <path d="M50,10 A40,40 0 1 0 50,90 A40,40 0 1 0 50,10" />
                <circle cx="50" cy="50" r="10" />
              </svg>
            </div>

            {/* Top Game Show Badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-600/30 border border-amber-400/40 px-4 py-1 rounded-full text-amber-300 text-xs font-extrabold uppercase tracking-widest mb-3 shadow">
              <Sparkles size={14} className="text-amber-400" />
              <span>Gran Concurso Cultural de Televisión</span>
              <Sparkles size={14} className="text-amber-400" />
            </div>

            {/* Title / Welcome Screen Banner Image */}
            <div className="w-full max-w-sm mx-auto mb-3 overflow-hidden rounded-2xl border-2 border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <img
                src="/assets/tiempo-title.jpeg"
                alt="El Tiempo es Oro"
                className="w-full h-32 md:h-40 object-cover object-center"
              />
            </div>

            {/* Main Title Banner */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
              EL TIEMPO ES ORO
            </h1>

            {/* Sub-tagline */}
            <div className="text-xs md:text-sm text-cyan-300 font-bold mb-4 tracking-wide uppercase flex items-center justify-center gap-2">
              <Hourglass size={15} className="text-amber-400" />
              <span>Conducción Estelar: Susana y Roberto</span>
              <Hourglass size={15} className="text-amber-400" />
            </div>

            {/* Center Stage: Susana & Roberto Showcase */}
            <div className="w-full flex items-center justify-center gap-2 md:gap-6 my-2 py-2 px-2 bg-slate-950/60 rounded-2xl border border-amber-500/30 shadow-inner">
              {/* Susana */}
              <div className="flex flex-col items-center group">
                <div className="relative w-20 h-28 md:w-28 md:h-40 rounded-xl bg-gradient-to-t from-pink-950/40 to-slate-900 border border-pink-500/40 p-1 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                  {assets['host_female'] ? (
                    <img
                      src={assets['host_female'].src}
                      alt="Susana"
                      className="max-w-full max-h-full object-contain filter drop-shadow"
                    />
                  ) : (
                    <div className="text-pink-300 font-bold text-lg">S</div>
                  )}
                  <div className="absolute -bottom-2 bg-pink-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                    SUSANA
                  </div>
                </div>
              </div>

              {/* Center Emblem: Golden Hourglass & Trophy */}
              <div className="flex flex-col items-center px-1">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 p-1 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center p-1.5 overflow-hidden">
                    <Trophy size={28} className="text-amber-400 drop-shadow" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-300 mt-1.5 uppercase tracking-wider">
                  Reloj de Oro
                </span>
              </div>

              {/* Roberto */}
              <div className="flex flex-col items-center group">
                <div className="relative w-20 h-28 md:w-28 md:h-40 rounded-xl bg-gradient-to-t from-blue-950/40 to-slate-900 border border-blue-500/40 p-1 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                  {assets['host_male'] ? (
                    <img
                      src={assets['host_male'].src}
                      alt="Roberto"
                      className="max-w-full max-h-full object-contain filter drop-shadow"
                    />
                  ) : (
                    <div className="text-blue-300 font-bold text-lg">R</div>
                  )}
                  <div className="absolute -bottom-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                    ROBERTO
                  </div>
                </div>
              </div>
            </div>

            {/* Description & 3 Dynamic Tiers */}
            <p className="text-xs md:text-sm text-slate-300 my-2 leading-relaxed max-w-lg">
              Desafía tu conocimiento con más de <strong>1.000 preguntas</strong> sobre Chile.
              Dificultad progresiva en 3 fases: <strong>Batería de Sabios (20s)</strong>,{' '}
              <strong>El Duelo (14s)</strong> y <strong>El Minuto de Oro (8s)</strong>.
            </p>

            {/* Action buttons */}
            <div className="w-full max-w-md flex flex-col gap-2.5 mt-2">
              <button
                ref={startButtonRef}
                autoFocus
                onClick={() => initGame(0)}
                className="w-full min-h-[50px] bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 px-6 py-3.5 rounded-full font-black text-base md:text-lg hover:from-amber-300 hover:to-yellow-300 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.5)] border-2 border-yellow-200">
                <Play size={20} className="fill-slate-950" />
                ¡COMENZAR CONCURSO!
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setIsCategorySelectorOpen(true);
                  }}
                  className="min-h-[48px] bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-amber-300 border border-amber-500/40 px-2 py-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1 transition-all">
                  <Award size={15} />
                  <span>Etapa</span>
                </button>

                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setIsLeaderboardOpen(true);
                  }}
                  className="min-h-[48px] bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-yellow-300 border border-yellow-500/40 px-2 py-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1 transition-all">
                  <Trophy size={15} />
                  <span>Ranking</span>
                </button>

                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setIsHowToPlayOpen(true);
                  }}
                  className="min-h-[48px] bg-slate-800/90 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 px-2 py-2 rounded-2xl font-semibold text-xs flex items-center justify-center gap-1 transition-all">
                  <BookOpen size={15} />
                  <span>Reglas</span>
                </button>
              </div>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* GAME OVER OVERLAY WITH LEADERBOARD */}
      {gameState.status === 'GAME_OVER' && (
        <MenuOverlay tone="danger" zIndex={40}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-red-600 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col items-center text-center max-h-[92vh] overflow-y-auto text-white">
            <div className="text-3xl mb-1">⏰📺❌</div>
            <h2 className="text-xl md:text-2xl font-black text-red-400 mb-1">
              ¡FIN DEL CONCURSO!
            </h2>
            <p className="text-xs text-slate-300 mb-3">
              Has agotado tus vidas. Susana y Roberto agradecen tu participación en El Tiempo es Oro.
            </p>

            <div className="w-full bg-slate-900 p-3 rounded-2xl border border-slate-800 text-left text-xs text-slate-300 space-y-1.5 mb-3">
              <div className="flex justify-between">
                <span>PUNTAJE FINAL:</span>
                <strong className="text-yellow-400 font-bold">{gameState.score.toLocaleString()} PTS</strong>
              </div>
              <div className="flex justify-between">
                <span>ETAPA ALCANZADA:</span>
                <strong className="text-amber-300">Etapa {currentStageIndex + 1} de 8</strong>
              </div>
            </div>

            {/* In-Game Name Entry for Leaderboard */}
            {!scoreSubmitted ? (
              <div className="w-full bg-slate-900/90 border-2 border-amber-500/80 rounded-2xl p-3 mb-3 text-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
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
                    className="bg-black border-2 border-amber-400 text-yellow-400 text-center font-black text-xs py-2 px-3 rounded-xl w-full sm:w-52 tracking-widest uppercase focus:outline-none focus:border-red-500 shadow-[inset_2px_2px_0px_#000]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveScore(gameState.score, `Etapa ${currentStageIndex + 1}`)}
                    className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl shadow active:translate-y-0.5 transition-all cursor-pointer">
                    GUARDAR EN SALÓN
                  </button>
                </div>
                <span className="text-[9px] text-slate-400">Presiona GUARDAR para rankear en el Salón de la Fama</span>
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
                className="w-full bg-slate-900 hover:bg-slate-800 border-2 border-amber-500/60 text-amber-300 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Trophy size={14} className="text-yellow-400" />
                VER SALÓN DE LA FAMA
              </button>

              <button
                autoFocus
                onClick={() => initGame(0)}
                className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow cursor-pointer">
                <RotateCw size={15} />
                REINTENTAR CONCURSO
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* VICTORY OVERLAY WITH LEADERBOARD */}
      {gameState.status === 'VICTORY' && (
        <MenuOverlay tone="victory" zIndex={40}>
          <div className="w-full max-w-md bg-slate-950 border-4 border-yellow-400 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col items-center text-center max-h-[92vh] overflow-y-auto text-white">
            <div className="text-3xl mb-1">👑🏆📺</div>
            <h2 className="text-xl md:text-2xl font-black text-yellow-300 mb-1">
              ¡GRAN CAMPEÓN DE CHILE!
            </h2>
            <p className="text-xs text-slate-300 mb-3">
              ¡Hazaña histórica! Susana y Roberto te proclaman vencedor absoluto del Minuto de Oro.
            </p>

            <div className="w-full bg-slate-900 p-3 rounded-2xl border border-slate-800 text-left text-xs text-slate-300 space-y-1.5 mb-3">
              <div className="flex justify-between">
                <span>PUNTAJE FINAL:</span>
                <strong className="text-yellow-400 font-bold">{gameState.score.toLocaleString()} PTS</strong>
              </div>
              <div className="flex justify-between">
                <span>ESTADO:</span>
                <strong className="text-emerald-400 font-bold">¡8 ETAPAS SUPERADAS!</strong>
              </div>
            </div>

            {/* In-Game Name Entry for Victory */}
            {!scoreSubmitted ? (
              <div className="w-full bg-slate-900/90 border-2 border-yellow-400 rounded-2xl p-3 mb-3 text-center shadow-[0_0_15px_rgba(250,204,21,0.2)]">
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
                    className="bg-black border-2 border-yellow-400 text-yellow-300 text-center font-black text-xs py-2 px-3 rounded-xl w-full sm:w-52 tracking-widest uppercase focus:outline-none focus:border-yellow-200 shadow-[inset_2px_2px_0px_#000]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveScore(gameState.score, 'MINUTO DE ORO')}
                    className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl shadow active:translate-y-0.5 transition-all cursor-pointer">
                    GUARDAR EN SALÓN
                  </button>
                </div>
                <span className="text-[9px] text-slate-400">Inmortaliza tu victoria en el Salón de la Fama</span>
              </div>
            ) : (
              <div className="w-full bg-yellow-400/20 border border-yellow-400/80 rounded-xl py-2 px-3 mb-3 text-center text-xs text-yellow-300 flex items-center justify-center gap-2">
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
                className="w-full bg-slate-900 hover:bg-slate-800 border-2 border-yellow-400 text-yellow-300 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Trophy size={14} className="text-yellow-400" />
                VER SALÓN DE LA FAMA
              </button>

              <button
                autoFocus
                onClick={() => initGame(0)}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow cursor-pointer">
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
          <div className="w-full max-w-md bg-slate-950 border-4 border-yellow-400 rounded-3xl p-5 md:p-6 shadow-[0_0_40px_rgba(250,204,21,0.5),4px_4px_0px_#000] flex flex-col items-center text-center max-h-[90vh] overflow-y-auto text-white">
            <div className="text-3xl mb-1">📺🏆⭐</div>
            <h2 className="text-lg md:text-xl font-black text-yellow-400 mb-1">
              SALÓN DE LA FAMA
            </h2>
            <p className="text-xs text-amber-300 mb-3">
              MEJORES PUNTAJES • EL TIEMPO ES ORO
            </p>

            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-3 divide-y divide-slate-800/80 text-xs">
              {leaderboard.map((entry, idx) => (
                <div
                  key={idx}
                  className={`py-2 px-2 flex items-center justify-between ${
                    idx === 0
                      ? 'text-yellow-300 font-black bg-amber-500/10 rounded-lg'
                      : idx === 1
                      ? 'text-slate-200 font-bold'
                      : idx === 2
                      ? 'text-amber-500 font-bold'
                      : 'text-slate-400'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-left shrink-0 font-bold">
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
                    <span className="text-[10px] text-slate-500 hidden sm:inline">{entry.stageName}</span>
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
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 py-2.5 rounded-full font-black text-xs md:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow">
              <X size={16} />
              CERRAR SALÓN DE LA FAMA
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* PAUSE / GAME MENU OVERLAY */}
      {isGameMenuOpen && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-md flex flex-col items-center bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 md:p-8 m-4 shadow-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-black text-amber-400 mb-2">
              MENÚ DEL CONCURSO
            </h2>
            <p className="text-xs text-slate-300 mb-6">
              Pausa de transmisión — El Tiempo es Oro
            </p>

            <div className="w-full flex flex-col gap-3">
              {/* Resume */}
              <button
                ref={resumeButtonRef}
                autoFocus
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                }}
                className="w-full min-h-[48px] bg-white text-black hover:bg-yellow-400 px-6 py-3 rounded-full font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-colors">
                <Play size={18} />
                CONTINUAR JUEGO
              </button>

              {/* View Leaderboard */}
              <button
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsLeaderboardOpen(true);
                }}
                className="w-full min-h-[46px] bg-slate-800 hover:bg-slate-700 text-yellow-300 border border-yellow-500/40 px-6 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                <Trophy size={17} />
                VER SALÓN DE LA FAMA
              </button>

              {/* Audio Controls */}
              <div className="grid grid-cols-2 gap-2 my-1">
                {/* SFX Toggle */}
                <button
                  onClick={() => {
                    const newMuted = gameAudio.toggleMute();
                    setIsSfxMuted(newMuted);
                  }}
                  className={`min-h-[48px] px-3 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    !isSfxMuted
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                  {!isSfxMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>SFX: {!isSfxMuted ? 'Activado' : 'Silencio'}</span>
                </button>

                {/* Music Toggle */}
                <button
                  onClick={() => {
                    setIsMusicMuted((prev) => !prev);
                  }}
                  className={`min-h-[48px] px-3 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    !isMusicMuted
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                  <Music size={16} />
                  <span>Música: {!isMusicMuted ? 'Activada' : 'Silencio'}</span>
                </button>
              </div>

              {/* Try Stage Again */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                  loadQuestion(currentStageIndex, 0);
                  setGameState((prev) => ({
                    ...prev,
                    lives: getConfig('startingLives') as number,
                  }));
                }}
                className="w-full min-h-[48px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-5 py-2.5 rounded-full font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all">
                <RotateCw size={16} />
                Reiniciar Esta Etapa
              </button>

              {/* How to Play */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(true);
                }}
                className="w-full min-h-[48px] bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-5 py-2.5 rounded-full font-semibold text-xs md:text-sm flex items-center justify-center gap-2 transition-all">
                <BookOpen size={16} />
                ¿Cómo Jugar?
              </button>

              {/* Quit to Main Menu */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                  setIsHowToPlayOpen(false);
                  setGameState((prev) => ({...prev, status: 'START'}));
                }}
                className="w-full min-h-[48px] bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 px-5 py-2.5 rounded-full font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all">
                <X size={16} />
                Salir al Menú Principal
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* HOW TO PLAY OVERLAY */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="w-full max-w-lg flex flex-col items-center bg-slate-900 border-2 border-cyan-500/70 rounded-3xl p-6 md:p-8 m-4 shadow-2xl text-left">
            <div className="w-full flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="text-cyan-400" size={24} />
                <h3 className="text-xl md:text-2xl font-black text-white">
                  Reglas y Dinámica Progresiva
                </h3>
              </div>
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(false);
                }}
                aria-label="Cerrar Guía"
                className="min-w-[48px] min-h-[48px] p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="w-full space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed overflow-y-auto max-h-[60vh] pr-1">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                  <Flame size={16} /> 1. Dificultad Progresiva en 3 Fases
                </h4>
                <ul className="list-disc list-inside space-y-1 mt-1 text-slate-300">
                  <li>
                    <strong className="text-emerald-400">Fase 1: Batería de Sabios (Etapas 1-2):</strong> 20 segundos por pregunta (+10 pts/seg restante).
                  </li>
                  <li>
                    <strong className="text-sky-400">Fase 2: El Duelo Cultural (Etapas 3-5):</strong> 14 segundos por pregunta (+15 pts/seg restante).
                  </li>
                  <li>
                    <strong className="text-amber-400">Fase 3: El Minuto de Oro (Etapas 6-8):</strong> 8 segundos por pregunta (+25 pts/seg restante y súper bonus).
                  </li>
                </ul>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
                  <Hourglass size={16} /> 2. Pausa Total del Reloj al Responder
                </h4>
                <p>
                  Apenas seleccionas tu respuesta o se agota el tiempo, el Reloj de Oro se pausa completamente. Puedes leer la explicación cultural y datos curiosos con total tranquilidad hasta hacer clic en "Siguiente Pregunta".
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                  <Zap size={16} /> 3. Comodines y Universo de 1.000 Preguntas
                </h4>
                <p>
                  Cada partida selecciona aleatoriamente preguntas de un universo de más de 1.000 preguntas y mezcla las alternativas A, B, C, D. Cuentas con comodines de 50/50, Pista y Tiempo Extra.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setIsHowToPlayOpen(false);
              }}
              autoFocus
              className="w-full min-h-[48px] mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-full hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center">
              ENTENDIDO, VOLVER AL JUEGO
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* CATEGORY SELECTOR OVERLAY */}
      {isCategorySelectorOpen && (
        <MenuOverlay tone="neutral" zIndex={55}>
          <div className="w-full max-w-lg flex flex-col items-center bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 md:p-8 m-4 shadow-2xl text-center">
            <div className="w-full flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
              <h3 className="text-xl md:text-2xl font-black text-amber-400">
                Seleccionar Etapa
              </h3>
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsCategorySelectorOpen(false);
                }}
                className="min-w-[48px] min-h-[48px] p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Elige una de las 8 categorías temáticas para comenzar tu partida:
            </p>

            <div className="w-full grid grid-cols-2 gap-2.5 overflow-y-auto max-h-[50vh] pr-1">
              {categoryOrder.map((catKey, index) => {
                const cat = CATEGORIES[catKey];
                const tier = getTierConfigForStage(index);
                return (
                  <button
                    key={catKey}
                    onClick={() => {
                      gameAudio.playCrispClick();
                      setIsCategorySelectorOpen(false);
                      initGame(index);
                    }}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-amber-400 text-left flex items-center gap-2.5 transition-all active:scale-95 group">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 p-1 flex items-center justify-center shrink-0 border border-slate-800 group-hover:border-amber-400">
                      {assets[cat.iconKey] ? (
                        <img
                          src={assets[cat.iconKey]?.src}
                          alt={cat.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Award size={16} className="text-amber-400" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <span>Etapa {index + 1}</span>
                        <span className="text-[9px] text-slate-400">({tier.timeSeconds}s)</span>
                      </div>
                      <div className="font-bold text-xs text-white truncate">
                        {cat.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </MenuOverlay>
      )}
    </div>
  );
}
