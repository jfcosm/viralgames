import {SpriteConfig} from './utils/helper';

/**
 * Configuration for Tío Aceite game.
 */
export const CONFIG = {
  // Title & System
  title: {
    value: 'SALVEMOS AL TÍO ACEITE',
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

  // Thematic elements
  backgroundColor: {
    value: '#0f172a',
    type: 'color',
    label: 'Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#f59e0b',
    type: 'color',
    label: 'Primary Color',
    group: 'THEME',
  },
  fontFamily: {
    value: 'monospace',
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },

  // Audio Levels
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

  // Gameplay Rules (Tunable)
  playerSpeed: {
    value: 540,
    type: 'number',
    label: 'Player Speed (px/s)',
    group: 'Rules',
  },
  dashMultiplier: {
    value: 1.8,
    type: 'number',
    label: 'Dash Multiplier',
    group: 'Rules',
  },
  startingLives: {
    value: 3,
    type: 'number',
    label: 'Vidas de Aceite',
    group: 'Rules',
  },
  spawnInterval: {
    value: 1.1,
    type: 'number',
    label: 'Intervalo de Caída (s)',
    group: 'Rules',
  },
  itemFallSpeed: {
    value: 320,
    type: 'number',
    label: 'Velocidad de Caída (px/s)',
    group: 'Rules',
  },
  bravaComboRequirement: {
    value: 10,
    type: 'number',
    label: 'Combo para Fritanga Brava',
    group: 'Rules',
  },
  bravaDuration: {
    value: 6.0,
    type: 'number',
    label: 'Duración Fritanga Brava (s)',
    group: 'Rules',
  },
  victoryScore: {
    value: 26000,
    type: 'number',
    label: 'Puntaje de Victoria Final (Nivel 8)',
    group: 'Rules',
  },

  // Player sprite configuration
  playerSprite: {
    value: undefined as SpriteConfig | undefined,
    type: 'sprite',
    label: 'Player Sprite',
    group: 'Visuals',
  },

  // Assets Aspect Ratios & Dimensions (from read_assets_metadata)
  assetBgNightMarketAspectRatio: {
    value: 1.79167,
    type: 'number',
    label: 'Night Market Background Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgTitleScreenAspectRatio: {
    value: 1.18427,
    type: 'number',
    label: 'Title Screen Aspect Ratio',
    group: 'ASSETS',
  },
  assetItemFriedFishAspectRatio: {
    value: 2.92258,
    type: 'number',
    label: 'Fried Fish Aspect Ratio',
    group: 'ASSETS',
  },
  assetItemOilBottleAspectRatio: {
    value: 0.38515,
    type: 'number',
    label: 'Oil Bottle Aspect Ratio',
    group: 'ASSETS',
  },
  assetItemBreadAspectRatio: {
    value: 1.79128,
    type: 'number',
    label: 'Bread Aspect Ratio',
    group: 'ASSETS',
  },
  assetItemMayoAspectRatio: {
    value: 0.55191,
    type: 'number',
    label: 'Mayo Aspect Ratio',
    group: 'ASSETS',
  },
  assetItemHotSauceAspectRatio: {
    value: 0.34527,
    type: 'number',
    label: 'Hot Sauce Aspect Ratio',
    group: 'ASSETS',
  },
  assetItemFryingPanAspectRatio: {
    value: 1.82268,
    type: 'number',
    label: 'Frying Pan Aspect Ratio',
    group: 'ASSETS',
  },
  assetItemCoinAspectRatio: {
    value: 0.95035,
    type: 'number',
    label: 'Coin Aspect Ratio',
    group: 'ASSETS',
  },
  assetHazardDishSoapAspectRatio: {
    value: 0.60071,
    type: 'number',
    label: 'Dish Soap Aspect Ratio',
    group: 'ASSETS',
  },
  assetHazardSoapBarAspectRatio: {
    value: 1.88889,
    type: 'number',
    label: 'Soap Bar Aspect Ratio',
    group: 'ASSETS',
  },
  assetHazardWaterBucketAspectRatio: {
    value: 1.00135,
    type: 'number',
    label: 'Water Bucket Aspect Ratio',
    group: 'ASSETS',
  },
  assetUiHeartOilAspectRatio: {
    value: 0.64359,
    type: 'number',
    label: 'Heart Oil Aspect Ratio',
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
