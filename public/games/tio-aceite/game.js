/**
 * TÍO ACEITE: LA FRITANGA SUPREMA
 * Mini Juego Arcade 16-Bit para VIRALGAMES
 * Desarrollado para Francisco Carle
 */

class TioAceiteGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // UI Elements
    this.hudScore = document.getElementById('hudScore');
    this.hudCurrentOrder = document.getElementById('hudCurrentOrder');
    this.heatBarFill = document.getElementById('heatBarFill');
    this.hudHeatDeg = document.getElementById('hudHeatDeg');
    this.hudTime = document.getElementById('hudTime');
    this.btnAudioToggle = document.getElementById('btnAudioToggle');
    this.btnExitGame = document.getElementById('btnExitGame');

    this.startScreenOverlay = document.getElementById('startScreenOverlay');
    this.gameOverOverlay = document.getElementById('gameOverOverlay');
    this.btnStartGame = document.getElementById('btnStartGame');
    this.btnRestartGame = document.getElementById('btnRestartGame');
    this.btnGameOverExit = document.getElementById('btnGameOverExit');
    this.finalScoreVal = document.getElementById('finalScoreVal');
    this.highScoreVal = document.getElementById('highScoreVal');
    this.rankTitle = document.getElementById('rankTitle');

    // Audio
    this.audioCtx = null;
    this.soundMuted = false;

    // Game state
    this.state = 'TITLE'; // TITLE, PLAYING, GAMEOVER
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('viralgames_tio_aceite_highscore') || '0', 10);
    this.timeLeft = 45;
    this.temperature = 180; // °C (Ideal: 160 - 200, Max: 240)
    this.multiplier = 1;
    this.comboCount = 0;

    // Entities
    this.skimmer = {
      x: this.canvas.width / 2 - 45,
      y: this.canvas.height - 65,
      width: 90,
      height: 22,
      speed: 9
    };

    this.keys = { left: false, right: false };
    this.items = [];
    this.particles = [];
    this.bubbles = [];
    this.floatingTexts = [];
    this.currentOrder = 'fish'; // 'fish' or 'empanada'

    this.timerInterval = null;
    this.lastSpawnTime = 0;
    this.lastOrderChangeTime = 0;

    this.initAudio();
    this.initEvents();
    this.renderTitleScreen();
  }

  initAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.audioCtx = new AudioContextClass();
    }
  }

  playSfx(type) {
    if (this.soundMuted || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const t = this.audioCtx.currentTime;

    try {
      if (type === 'catch') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.setValueAtTime(783.99, t + 0.08); // G5
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.2);

      } else if (type === 'lemon') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1320, t + 0.15);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.15);

      } else if (type === 'burn') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.setValueAtTime(75, t + 0.15);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.25);

      } else if (type === 'start') {
        [261, 329, 392, 523].forEach((f, i) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f, t + i * 0.06);
          gain.gain.setValueAtTime(0.1, t + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, t + (i + 1) * 0.06);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(t + i * 0.06);
          osc.stop(t + (i + 1) * 0.06);
        });
      }
    } catch (e) {
      console.warn("Audio error", e);
    }
  }

  initEvents() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
    });

    // Mouse / Touch
    const moveSkimmer = (clientX) => {
      if (this.state !== 'PLAYING') return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const mouseX = (clientX - rect.left) * scaleX;
      this.skimmer.x = Math.max(20, Math.min(this.canvas.width - this.skimmer.width - 20, mouseX - this.skimmer.width / 2));
    };

    this.canvas.addEventListener('mousemove', (e) => moveSkimmer(e.clientX));
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        moveSkimmer(e.touches[0].clientX);
        e.preventDefault();
      }
    }, { passive: false });

    // Buttons
    this.btnStartGame.addEventListener('click', () => this.startGame());
    this.btnRestartGame.addEventListener('click', () => this.startGame());

    this.btnAudioToggle.addEventListener('click', () => {
      this.soundMuted = !this.soundMuted;
      this.btnAudioToggle.textContent = this.soundMuted ? '🔇' : '🔊';
    });

    const exitHandler = () => {
      // Post message to parent iframe if embedded
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'CLOSE_VIRALGAMES_MODAL' }, '*');
      } else {
        window.location.href = '/';
      }
    };

    this.btnExitGame.addEventListener('click', exitHandler);
    this.btnGameOverExit.addEventListener('click', exitHandler);
  }

  startGame() {
    this.playSfx('start');
    this.state = 'PLAYING';
    this.score = 0;
    this.timeLeft = 45;
    this.temperature = 180;
    this.multiplier = 1;
    this.comboCount = 0;
    this.items = [];
    this.particles = [];
    this.bubbles = [];
    this.floatingTexts = [];
    this.currentOrder = 'fish';
    this.skimmer.x = this.canvas.width / 2 - this.skimmer.width / 2;

    this.startScreenOverlay.classList.remove('active');
    this.startScreenOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.remove('active');
    this.gameOverOverlay.classList.add('hidden');

    this.updateHUD();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state !== 'PLAYING') return;
      this.timeLeft--;

      // Slight temperature rise as time goes on
      this.temperature = Math.min(235, this.temperature + 0.8);

      if (this.timeLeft <= 0 || this.temperature >= 235) {
        this.gameOver();
      }
      this.updateHUD();
    }, 1000);

    this.lastSpawnTime = performance.now();
    this.lastOrderChangeTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  gameOver() {
    this.state = 'GAMEOVER';
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.playSfx('burn');

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('viralgames_tio_aceite_highscore', this.highScore);
    }

    // Rank title
    let rank = 'NOVATO DE LA FRITANGA';
    if (this.score > 4000) rank = 'REY SUPREMO DE LA SERENA ★★★★★';
    else if (this.score > 2500) rank = 'MAESTRO FRITANGUERO ★★★★';
    else if (this.score > 1500) rank = 'COCINERO NOCTURNO ★★★';
    else if (this.score > 800) rank = 'AYUDANTE DE ESPUMADERA ★★';

    this.finalScoreVal.textContent = this.score;
    this.highScoreVal.textContent = this.highScore;
    this.rankTitle.textContent = rank;

    this.gameOverOverlay.classList.remove('hidden');
    this.gameOverOverlay.classList.add('active');
  }

  updateHUD() {
    this.hudScore.textContent = String(this.score).padStart(5, '0');
    this.hudTime.textContent = `${this.timeLeft}s`;
    this.hudHeatDeg.textContent = `${Math.round(this.temperature)}°C`;

    // Heat progress bar
    const heatPercent = Math.min(100, Math.max(0, ((this.temperature - 140) / 95) * 100));
    this.heatBarFill.style.width = `${heatPercent}%`;

    // Order text
    if (this.currentOrder === 'fish') {
      this.hudCurrentOrder.textContent = '🐟 PESCADO FRITO';
      this.hudCurrentOrder.style.color = '#00ffff';
    } else {
      this.hudCurrentOrder.textContent = '🥟 EMPANADA DE QUESO';
      this.hudCurrentOrder.style.color = '#ffd166';
    }
  }

  addFloatingText(text, x, y, color = '#ffd166') {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -1.8,
      life: 40,
      color
    });
  }

  loop(timestamp) {
    if (this.state !== 'PLAYING') return;

    // Movement
    if (this.keys.left) this.skimmer.x = Math.max(20, this.skimmer.x - this.skimmer.speed);
    if (this.keys.right) this.skimmer.x = Math.min(this.canvas.width - this.skimmer.width - 20, this.skimmer.x + this.skimmer.speed);

    // Random Order switch every 10 seconds
    if (timestamp - this.lastOrderChangeTime > 10000) {
      this.lastOrderChangeTime = timestamp;
      this.currentOrder = this.currentOrder === 'fish' ? 'empanada' : 'fish';
      this.addFloatingText('¡NUEVO PEDIDO!', this.canvas.width / 2 - 60, 180, '#ff0055');
      this.updateHUD();
    }

    // Spawn falling foods
    const spawnInterval = Math.max(450, 850 - (45 - this.timeLeft) * 8);
    if (timestamp - this.lastSpawnTime > spawnInterval) {
      this.lastSpawnTime = timestamp;

      // Pool of items
      const roll = Math.random();
      let type = 'fish';
      if (roll < 0.45) type = 'fish';
      else if (roll < 0.82) type = 'empanada';
      else type = 'lemon'; // Limon de Pica cooling

      this.items.push({
        type,
        x: Math.random() * (this.canvas.width - 120) + 60,
        y: 40,
        speed: Math.random() * 2 + 3.2,
        size: 32,
        wobble: Math.random() * Math.PI * 2
      });
    }

    // Update Items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.y += it.speed;
      it.wobble += 0.08;

      // Check collision with skimmer
      if (
        it.y + it.size >= this.skimmer.y &&
        it.y <= this.skimmer.y + this.skimmer.height &&
        it.x + it.size >= this.skimmer.x &&
        it.x <= this.skimmer.x + this.skimmer.width
      ) {
        // Handled item!
        if (it.type === 'lemon') {
          // Cooled oil!
          this.temperature = Math.max(150, this.temperature - 12);
          this.score += 150;
          this.playSfx('lemon');
          this.addFloatingText('🍋 -12°C EXTRA LIMÓN!', it.x - 20, it.y - 10, '#06d6a0');
        } else if (it.type === this.currentOrder) {
          // Matched customer order!
          this.comboCount++;
          const comboBonus = Math.min(4, Math.floor(this.comboCount / 3) + 1);
          const pts = (it.type === 'fish' ? 200 : 250) * comboBonus;
          this.score += pts;
          this.playSfx('catch');
          this.addFloatingText(`+${pts} ¡DORADO x${comboBonus}!`, it.x - 10, it.y - 10, '#ffd166');
        } else {
          // Wrong order item
          this.comboCount = 0;
          this.score += 80;
          this.playSfx('catch');
          this.addFloatingText('+80 pts', it.x, it.y - 10, '#b8b3db');
        }

        // Sizzle particles
        for (let p = 0; p < 10; p++) {
          this.particles.push({
            x: it.x + 16,
            y: this.skimmer.y,
            vx: (Math.random() - 0.5) * 5,
            vy: -Math.random() * 5 - 2,
            life: 25,
            color: it.type === 'lemon' ? '#2ecc71' : '#ffd166'
          });
        }

        this.items.splice(i, 1);
        this.updateHUD();
        continue;
      }

      // Missed item off bottom
      if (it.y > this.canvas.height + 20) {
        if (it.type === this.currentOrder) {
          this.comboCount = 0;
          this.temperature += 4;
          this.addFloatingText('¡SE PERDIÓ!', it.x - 20, this.canvas.height - 40, '#ff3333');
          this.playSfx('burn');
        }
        this.items.splice(i, 1);
        this.updateHUD();
      }
    }

    // Update Particles
    for (let p = this.particles.length - 1; p >= 0; p--) {
      const part = this.particles[p];
      part.x += part.vx;
      part.y += part.vy;
      part.vy += 0.18;
      part.life--;
      if (part.life <= 0) this.particles.splice(p, 1);
    }

    // Update Floating Texts
    for (let t = this.floatingTexts.length - 1; t >= 0; t--) {
      const ft = this.floatingTexts[t];
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 0) this.floatingTexts.splice(t, 1);
    }

    // Periodic boiling bubbles
    if (Math.random() < 0.3) {
      this.bubbles.push({
        x: Math.random() * (this.canvas.width - 80) + 40,
        y: this.canvas.height - 20,
        radius: Math.random() * 4 + 2,
        vy: -Math.random() * 2 - 1,
        life: 30
      });
    }

    for (let b = this.bubbles.length - 1; b >= 0; b--) {
      const bub = this.bubbles[b];
      bub.y += bub.vy;
      bub.life--;
      if (bub.life <= 0) this.bubbles.splice(b, 1);
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Night Sky of La Serena
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0a051d');
    skyGrad.addColorStop(0.7, '#1b1238');
    skyGrad.addColorStop(1, '#2c1445');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 25; i++) {
      const sx = (i * 37) % w;
      const sy = (i * 23) % 120;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // La Serena colonial buildings silhouette in background
    ctx.fillStyle = '#160d2b';
    ctx.fillRect(40, 70, 90, 80);
    ctx.fillRect(80, 50, 40, 100);
    ctx.fillRect(160, 85, 120, 65);
    ctx.fillRect(520, 75, 110, 75);
    ctx.fillRect(660, 60, 80, 90);

    // Street Lamps
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(140, 120, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(660, 120, 16, 0, Math.PI * 2);
    ctx.fill();

    // 2. Street pavement
    ctx.fillStyle = '#221935';
    ctx.fillRect(0, 200, w, h - 200);

    // Cobblestone grid lines
    ctx.strokeStyle = '#2d2247';
    ctx.lineWidth = 2;
    for (let y = 200; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3. Tío Aceite Food Cart Canopy (Toldo del carrito)
    ctx.fillStyle = '#06d6a0';
    ctx.fillRect(w / 2 - 190, 10, 380, 32);
    ctx.fillStyle = '#ffd166';
    for (let x = w / 2 - 190; x < w / 2 + 190; x += 38) {
      ctx.fillRect(x, 10, 19, 32);
    }

    // Cart banner text
    ctx.fillStyle = '#110926';
    ctx.fillRect(w / 2 - 160, 44, 320, 26);
    ctx.fillStyle = '#ffd166';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('TÍO ACEITE • LA SERENA 4 AM', w / 2, 62);

    // 4. Giant Sizzling Oil Pan (El perol de aceite hirviendo)
    const panY = h - 75;
    ctx.fillStyle = '#1a1a24';
    ctx.fillRect(20, panY, w - 40, 75);

    // Hot boiling oil gradient
    const oilGrad = ctx.createLinearGradient(0, panY, 0, h);
    if (this.temperature > 215) {
      oilGrad.addColorStop(0, '#ff3300');
      oilGrad.addColorStop(1, '#ff8800');
    } else {
      oilGrad.addColorStop(0, '#ffd000');
      oilGrad.addColorStop(1, '#ff6600');
    }
    ctx.fillStyle = oilGrad;
    ctx.fillRect(24, panY + 4, w - 48, 67);

    // Oil Bubbles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.bubbles.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. The Skimmer / Espumadera
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(this.skimmer.x - 4, this.skimmer.y - 2, this.skimmer.width + 8, this.skimmer.height + 4);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(this.skimmer.x, this.skimmer.y, this.skimmer.width, this.skimmer.height);
    // Skimmer handle
    ctx.fillStyle = '#718096';
    ctx.fillRect(this.skimmer.x + this.skimmer.width / 2 - 4, this.skimmer.y + this.skimmer.height, 8, 30);

    // 6. Falling Foods
    this.items.forEach(it => {
      ctx.save();
      ctx.translate(it.x + it.size / 2, it.y + it.size / 2);
      ctx.rotate(Math.sin(it.wobble) * 0.2);

      if (it.type === 'fish') {
        // Fried Fish sprite representation
        ctx.fillStyle = '#f6ad55';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dd6b20';
        ctx.fillRect(-18, -4, 6, 8); // tail
        ctx.fillStyle = '#000';
        ctx.fillRect(10, -3, 3, 3); // eye
      } else if (it.type === 'empanada') {
        // Empanada golden half-circle
        ctx.fillStyle = '#ecc94b';
        ctx.beginPath();
        ctx.arc(0, 4, 16, Math.PI, 0, false);
        ctx.fill();
        ctx.fillStyle = '#d69e2e';
        ctx.fillRect(-15, 2, 30, 4); // fold
      } else {
        // Lemon of Pica
        ctx.fillStyle = '#38a169';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#48bb78';
        ctx.fillRect(-2, -14, 4, 4); // stem
      }
      ctx.restore();
    });

    // 7. Sizzle Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });

    // 8. Floating Texts
    this.floatingTexts.forEach(ft => {
      ctx.fillStyle = ft.color;
      ctx.font = '11px "Press Start 2P"';
      ctx.textAlign = 'left';
      ctx.fillText(ft.text, ft.x, ft.y);
    });
  }

  renderTitleScreen() {
    this.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.tioAceiteGame = new TioAceiteGame();
});
