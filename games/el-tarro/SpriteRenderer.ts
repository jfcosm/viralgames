export interface SpriteActionConfig {
  imageUrl: string;
  totalFrames: number;
  frameWidth: number;
  frameHeight: number;
  fps: number;
  loop?: boolean;
}

export interface SpriteAnimationState {
  currentAction: string;
  currentFrame: number;
  timer: number;
}

export class SpriteRenderer {
  private configs: Record<string, SpriteActionConfig>;

  constructor(configs: Record<string, SpriteActionConfig>) {
    this.configs = configs;
  }

  /**
   * Advances the animation state based on delta time.
   */
  getNextState(
    currentState: SpriteAnimationState,
    deltaTime: number
  ): SpriteAnimationState {
    const config = this.configs[currentState.currentAction];
    if (!config) return currentState;

    const nextState = { ...currentState };
    nextState.timer += deltaTime;
    const frameDuration = 1 / Math.max(1, config.fps);

    if (nextState.timer >= frameDuration) {
      const framesToAdvance = Math.floor(nextState.timer / frameDuration);
      nextState.timer %= frameDuration;
      
      if (config.loop === false) {
        nextState.currentFrame = Math.min(
          config.totalFrames - 1,
          nextState.currentFrame + framesToAdvance
        );
      } else {
        nextState.currentFrame = (nextState.currentFrame + framesToAdvance) % config.totalFrames;
      }
    }
    return nextState;
  }

  /**
   * Draws the sprite to the canvas using preloaded images with optional rotation, scale, and offset.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    state: SpriteAnimationState,
    x: number,
    y: number,
    width: number,
    height: number,
    loadedImages: Record<string, HTMLImageElement | null>,
    rotation = 0,
    flipX = false
  ) {
    const config = this.configs[state.currentAction];
    if (!config) return;

    const img = loadedImages[config.imageUrl];

    if (!img || !img.complete || img.naturalWidth === 0) {
      // Fallback: draw placeholder box
      ctx.save();
      ctx.translate(x + width / 2, y + height / 2);
      if (rotation !== 0) ctx.rotate(rotation);
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.restore();
      return;
    }

    const framesPerRow = Math.max(1, Math.floor(img.naturalWidth / config.frameWidth));
    const safeFrame = Math.min(Math.max(0, state.currentFrame), config.totalFrames - 1);
    const sourceX = (safeFrame % framesPerRow) * config.frameWidth;
    const sourceY = Math.floor(safeFrame / framesPerRow) * config.frameHeight;

    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    if (rotation !== 0) ctx.rotate(rotation);
    if (flipX) ctx.scale(-1, 1);

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      config.frameWidth,
      config.frameHeight,
      -width / 2,
      -height / 2,
      width,
      height
    );
    ctx.restore();
  }
}
