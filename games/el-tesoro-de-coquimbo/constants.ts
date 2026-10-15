import {SpriteConfig} from './utils/helper';

/**
 * Configuration for Coquimbo Trivia.
 */
export const CONFIG = {
  // GAME INITIALIZATION
  title: {
    value: 'El Tesoro de Coquimbo',
    type: 'string',
    label: 'Game Title',
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

  // SYSTEM (Physics / Stepper)
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

  // THEME & STYLING
  backgroundColor: {
    value: '#0b0f19',
    type: 'color',
    label: 'Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#facc15',
    type: 'color',
    label: 'Primary Aurinegro Yellow',
    group: 'THEME',
  },
  secondaryColor: {
    value: '#111827',
    type: 'color',
    label: 'Secondary Charcoal',
    group: 'THEME',
  },
  fontFamily: {
    value: "'VT323', 'Press Start 2P', monospace, sans-serif",
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },

  // AUDIO
  defaultMusicVolume: {
    value: 0.5,
    type: 'number',
    label: 'Default Music Volume',
    group: 'AUDIO',
  },
  defaultSfxVolume: {
    value: 0.6,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // RULES & DIFFICULTY
  startingLives: {
    value: 3,
    type: 'number',
    label: 'Starting Lives (Jerseys)',
    group: 'Rules',
  },
  questionTimer: {
    value: 20,
    type: 'number',
    label: 'Seconds per Question',
    group: 'Rules',
  },
  pointsPerCorrect: {
    value: 500,
    type: 'number',
    label: 'Base Points per Correct Answer',
    group: 'Rules',
  },
  timeBonusMultiplier: {
    value: 25,
    type: 'number',
    label: 'Time Bonus Multiplier',
    group: 'Rules',
  },
  questionsPerRound: {
    value: 10,
    type: 'number',
    label: 'Questions per Round',
    group: 'Rules',
  },
  enablePenaltyBonus: {
    value: true,
    type: 'boolean',
    label: 'Enable Penalty Shootout Bonus',
    group: 'Rules',
  },

  // ASSETS METADATA & SIZING
  assetBgStadiumAspectRatio: {
    value: 1.791666667,
    type: 'number',
    label: 'Stadium Background Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgStadiumWidth: {
    value: 1376,
    type: 'number',
    label: 'Stadium Background Width',
    group: 'ASSETS',
  },
  assetBgStadiumHeight: {
    value: 768,
    type: 'number',
    label: 'Stadium Background Height',
    group: 'ASSETS',
  },

  assetBgPortAspectRatio: {
    value: 1.791666667,
    type: 'number',
    label: 'Port Background Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgPortWidth: {
    value: 1376,
    type: 'number',
    label: 'Port Background Width',
    group: 'ASSETS',
  },
  assetBgPortHeight: {
    value: 768,
    type: 'number',
    label: 'Port Background Height',
    group: 'ASSETS',
  },

  assetSoccerBallAspectRatio: {
    value: 1.0,
    type: 'number',
    label: 'Soccer Ball Aspect Ratio',
    group: 'ASSETS',
  },
  assetSoccerBallWidth: {
    value: 782,
    type: 'number',
    label: 'Soccer Ball Width',
    group: 'ASSETS',
  },
  assetSoccerBallHeight: {
    value: 782,
    type: 'number',
    label: 'Soccer Ball Height',
    group: 'ASSETS',
  },

  assetLifeJerseyAspectRatio: {
    value: 0.84398977,
    type: 'number',
    label: 'Life Jersey Aspect Ratio',
    group: 'ASSETS',
  },
  assetLifeJerseyWidth: {
    value: 660,
    type: 'number',
    label: 'Life Jersey Width',
    group: 'ASSETS',
  },
  assetLifeJerseyHeight: {
    value: 782,
    type: 'number',
    label: 'Life Jersey Height',
    group: 'ASSETS',
  },

  assetTrophyPirateAspectRatio: {
    value: 0.835135,
    type: 'number',
    label: 'Trophy Pirate Aspect Ratio',
    group: 'ASSETS',
  },
  assetTrophyPirateWidth: {
    value: 618,
    type: 'number',
    label: 'Trophy Pirate Width',
    group: 'ASSETS',
  },
  assetTrophyPirateHeight: {
    value: 740,
    type: 'number',
    label: 'Trophy Pirate Height',
    group: 'ASSETS',
  },

  assetWildcardFiftyAspectRatio: {
    value: 0.814516,
    type: 'number',
    label: '50:50 Wildcard Aspect Ratio',
    group: 'ASSETS',
  },
  assetWildcardFiftyWidth: {
    value: 505,
    type: 'number',
    label: '50:50 Wildcard Width',
    group: 'ASSETS',
  },
  assetWildcardFiftyHeight: {
    value: 620,
    type: 'number',
    label: '50:50 Wildcard Height',
    group: 'ASSETS',
  },

  assetWildcardFreezeAspectRatio: {
    value: 0.602493,
    type: 'number',
    label: 'Freeze Wildcard Aspect Ratio',
    group: 'ASSETS',
  },
  assetWildcardFreezeWidth: {
    value: 435,
    type: 'number',
    label: 'Freeze Wildcard Width',
    group: 'ASSETS',
  },
  assetWildcardFreezeHeight: {
    value: 722,
    type: 'number',
    label: 'Freeze Wildcard Height',
    group: 'ASSETS',
  },

  assetWildcardHintAspectRatio: {
    value: 1.342007,
    type: 'number',
    label: 'Hint Wildcard Aspect Ratio',
    group: 'ASSETS',
  },
  assetWildcardHintWidth: {
    value: 722,
    type: 'number',
    label: 'Hint Wildcard Width',
    group: 'ASSETS',
  },
  assetWildcardHintHeight: {
    value: 538,
    type: 'number',
    label: 'Hint Wildcard Height',
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

export const PRESETS = {};
