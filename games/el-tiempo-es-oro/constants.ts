export const CONFIG = {
  // Core game initialization values
  title: {
    value: 'El Tiempo es Oro',
    type: 'string',
    label: 'Título del Concurso',
    group: 'GAME',
  },
  baseCanvasWidth: {
    value: 1376,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'GAME',
  },
  baseCanvasHeight: {
    value: 768,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'GAME',
  },

  // System Constants
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'SYSTEM',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'SYSTEM',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'SYSTEM',
  },

  // Thematic Elements
  backgroundColor: {
    value: '#0c1b33',
    type: 'color',
    label: 'Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#f59e0b',
    type: 'color',
    label: 'Primary Gold Color',
    group: 'THEME',
  },
  secondaryColor: {
    value: '#0284c7',
    type: 'color',
    label: 'Chilean Blue Color',
    group: 'THEME',
  },
  accentRedColor: {
    value: '#ef4444',
    type: 'color',
    label: 'Chilean Red Color',
    group: 'THEME',
  },
  fontFamily: {
    value: "'Montserrat', sans-serif",
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },

  // Audio settings
  defaultMusicVolume: {
    value: 0.5,
    type: 'number',
    label: 'Default Music Volume',
    group: 'AUDIO',
  },
  defaultSfxVolume: {
    value: 0.7,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // Trivia Rules & Gameplay tuning
  questionTimeSeconds: {
    value: 20,
    type: 'number',
    label: 'Tiempo por Pregunta (seg)',
    group: 'Rules',
  },
  startingLives: {
    value: 3,
    type: 'number',
    label: 'Vidas Iniciales',
    group: 'Rules',
  },
  pointsPerCorrect: {
    value: 100,
    type: 'number',
    label: 'Puntos Base por Acierto',
    group: 'Rules',
  },
  speedBonusMultiplier: {
    value: 10,
    type: 'number',
    label: 'Bonus por Segundo Restante',
    group: 'Rules',
  },
  extraTimeLifelineSeconds: {
    value: 15,
    type: 'number',
    label: 'Segundos Comodín Tiempo Extra',
    group: 'Rules',
  },
  questionsPerStage: {
    value: 3,
    type: 'number',
    label: 'Preguntas por Etapa',
    group: 'Rules',
  },

  // Asset configurations from read_assets_metadata
  assetBgMainWidth: {
    value: 1376,
    type: 'number',
    label: 'BG Width',
    group: 'ASSETS',
  },
  assetBgMainHeight: {
    value: 768,
    type: 'number',
    label: 'BG Height',
    group: 'ASSETS',
  },
  assetBgMainAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'BG Aspect Ratio',
    group: 'ASSETS',
  },

  assetHostFemaleWidth: {
    value: 886,
    type: 'number',
    label: 'Host Female Width',
    group: 'ASSETS',
  },
  assetHostFemaleHeight: {
    value: 1007,
    type: 'number',
    label: 'Host Female Height',
    group: 'ASSETS',
  },
  assetHostFemaleAspectRatio: {
    value: 886 / 1007,
    type: 'number',
    label: 'Host Female Aspect Ratio',
    group: 'ASSETS',
  },

  assetHostMaleWidth: {
    value: 849,
    type: 'number',
    label: 'Host Male Width',
    group: 'ASSETS',
  },
  assetHostMaleHeight: {
    value: 933,
    type: 'number',
    label: 'Host Male Height',
    group: 'ASSETS',
  },
  assetHostMaleAspectRatio: {
    value: 849 / 933,
    type: 'number',
    label: 'Host Male Aspect Ratio',
    group: 'ASSETS',
  },

  assetIconHistoryAspectRatio: {
    value: 545 / 608,
    type: 'number',
    label: 'Icon History Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconGeographyAspectRatio: {
    value: 623 / 449,
    type: 'number',
    label: 'Icon Geography Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconLiteratureAspectRatio: {
    value: 694 / 516,
    type: 'number',
    label: 'Icon Literature Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconArtsAspectRatio: {
    value: 524 / 523,
    type: 'number',
    label: 'Icon Arts Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconMusicAspectRatio: {
    value: 360 / 737,
    type: 'number',
    label: 'Icon Music Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconCinemaAspectRatio: {
    value: 538 / 519,
    type: 'number',
    label: 'Icon Cinema Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconSportsAspectRatio: {
    value: 584 / 619,
    type: 'number',
    label: 'Icon Sports Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconPoliticsAspectRatio: {
    value: 887 / 648,
    type: 'number',
    label: 'Icon Politics Aspect Ratio',
    group: 'ASSETS',
  },
};

// Merge customized config values if present (injected by Playground)
const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

/**
 * Type helper for reading values in game code
 */
export type ConfigKey = keyof typeof CONFIG;

/**
 * Gets a configuration value by key.
 * @param key The configuration key.
 * @return The configuration value.
 */
export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}
