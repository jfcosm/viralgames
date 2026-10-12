import {SpriteConfig} from './utils/helper';

/**
 * Configuration for "El Tarro" BMX Jump Game.
 */
export const CONFIG = {
  // Game & System info
  title: {
    value: 'El Tarro: Salto Legendario BMX',
    type: 'string',
    label: 'Título del Juego',
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

  // Thematic UI & Colors
  backgroundColor: {
    value: '#100c08',
    type: 'color',
    label: 'Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#f59e0b',
    type: 'color',
    label: 'Primary Amber Color',
    group: 'THEME',
  },
  fontFamily: {
    value: '"Press Start 2P", "Courier New", monospace',
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
    value: 0.7,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // Physics & Gameplay Mechanics
  pedalBoostForce: {
    value: 1.8,
    type: 'number',
    label: 'Pedal Boost Force',
    group: 'Physics',
  },
  maxRunwaySpeed: {
    value: 36,
    type: 'number',
    label: 'Max Runway Speed',
    group: 'Physics',
  },
  runwayDecel: {
    value: 0.985,
    type: 'number',
    label: 'Runway Momentum Friction',
    group: 'Physics',
  },
  gravity: {
    value: 28,
    type: 'number',
    label: 'Airborne Gravity',
    group: 'Physics',
  },
  angleMeterSpeed: {
    value: 2.6,
    type: 'number',
    label: 'Angle Needle Oscillation Speed',
    group: 'Physics',
  },
  maxLives: {
    value: 3,
    type: 'number',
    label: 'Max Lives / Attempts per Round',
    group: 'Rules',
  },
  perfectAngleTolerance: {
    value: 5,
    type: 'number',
    label: 'Perfect Angle Tolerance (deg around 45)',
    group: 'Rules',
  },
  greatAngleTolerance: {
    value: 12,
    type: 'number',
    label: 'Great Angle Tolerance (deg around 45)',
    group: 'Rules',
  },

  // Asset Metadata Dimensions & Aspect Ratios
  assetBgDirtYardAspectRatio: {
    value: 1.7916666666666667, // 1376 / 768
    type: 'number',
    label: 'Dirt Yard BG Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgDirtYardWidth: {
    value: 1376,
    type: 'number',
    label: 'Dirt Yard BG Width',
    group: 'ASSETS',
  },
  assetBgDirtYardHeight: {
    value: 768,
    type: 'number',
    label: 'Dirt Yard BG Height',
    group: 'ASSETS',
  },

  assetRampTireWoodAspectRatio: {
    value: 1.7828418230563, // 665 / 373
    type: 'number',
    label: 'Ramp Tire Wood Aspect Ratio',
    group: 'ASSETS',
  },
  assetRampTireWoodWidth: {
    value: 260,
    type: 'number',
    label: 'Ramp Tire Wood Render Width',
    group: 'ASSETS',
  },
  assetRampTireWoodHeight: {
    value: 146,
    type: 'number',
    label: 'Ramp Tire Wood Render Height',
    group: 'ASSETS',
  },

  assetWoodenRampAspectRatio: {
    value: 1.431338028169014, // 813 / 568
    type: 'number',
    label: 'Wooden Ramp Aspect Ratio',
    group: 'ASSETS',
  },
  assetWoodenRampWidth: {
    value: 220,
    type: 'number',
    label: 'Wooden Ramp Render Width',
    group: 'ASSETS',
  },
  assetWoodenRampHeight: {
    value: 154,
    type: 'number',
    label: 'Wooden Ramp Render Height',
    group: 'ASSETS',
  },

  assetMetalBarrelsAspectRatio: {
    value: 1.342809364548495, // 803 / 598
    type: 'number',
    label: 'Metal Barrels Aspect Ratio',
    group: 'ASSETS',
  },
  assetMetalBarrelsWidth: {
    value: 150,
    type: 'number',
    label: 'Metal Barrels Render Width',
    group: 'ASSETS',
  },
  assetMetalBarrelsHeight: {
    value: 112,
    type: 'number',
    label: 'Metal Barrels Render Height',
    group: 'ASSETS',
  },

  assetObstacleTireStackAspectRatio: {
    value: 1.3895131086142322, // 742 / 534
    type: 'number',
    label: 'Obstacle Tire Stack Aspect Ratio',
    group: 'ASSETS',
  },
  assetObstacleTireStackWidth: {
    value: 130,
    type: 'number',
    label: 'Obstacle Tire Stack Render Width',
    group: 'ASSETS',
  },
  assetObstacleTireStackHeight: {
    value: 94,
    type: 'number',
    label: 'Obstacle Tire Stack Render Height',
    group: 'ASSETS',
  },

  assetObstacleWoodBarrierAspectRatio: {
    value: 0.514218009478673, // 434 / 844
    type: 'number',
    label: 'Obstacle Wood Barrier Aspect Ratio',
    group: 'ASSETS',
  },
  assetObstacleWoodBarrierWidth: {
    value: 80,
    type: 'number',
    label: 'Obstacle Wood Barrier Render Width',
    group: 'ASSETS',
  },
  assetObstacleWoodBarrierHeight: {
    value: 156,
    type: 'number',
    label: 'Obstacle Wood Barrier Render Height',
    group: 'ASSETS',
  },

  assetLandingFlagTargetAspectRatio: {
    value: 0.6309226932668329, // 506 / 802
    type: 'number',
    label: 'Landing Flag Target Aspect Ratio',
    group: 'ASSETS',
  },
  assetLandingFlagTargetWidth: {
    value: 110,
    type: 'number',
    label: 'Landing Flag Target Render Width',
    group: 'ASSETS',
  },
  assetLandingFlagTargetHeight: {
    value: 174,
    type: 'number',
    label: 'Landing Flag Target Render Height',
    group: 'ASSETS',
  },

  playerRenderWidth: {
    value: 160,
    type: 'number',
    label: 'Player Render Width',
    group: 'ASSETS',
  },
  playerRenderHeight: {
    value: 160,
    type: 'number',
    label: 'Player Render Height',
    group: 'ASSETS',
  },

  playerSprite: {
    value: undefined as SpriteConfig | undefined,
    type: 'sprite',
    label: 'Player Sprite',
    group: 'Visuals',
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
