/**
 * VIRALGAMES - 16-Bit Arcade Engine & Admin Platform
 * Developed for Francisco Carle (Inspiration: Jano Mendoza)
 */

import {
  subscribeSettings,
  saveSystemSettings,
  subscribeCreditsMeta,
  saveCreditsMetaToDb,
  subscribeGames,
  saveGameToDb,
  saveAllGamesToDb,
  deleteGameFromDb,
  subscribeCredits,
  saveCreditToDb,
  saveAllCreditsToDb,
  deleteCreditFromDb,
  saveLeaderboardToDb,
  subscribeLeaderboard
} from './firebase.js';

// ==========================================================================
// 1. DEFAULT GAMES CATALOG SEED DATA
// ==========================================================================
const DEFAULT_GAMES = [
  {
    id: "tio-aceite-01",
    title: "TÍO ACEITE: LA FRITANGA SUPREMA",
    category: "viral",
    badge: "DESTACADO #01",
    image: "/assets/tio_aceite.jpg",
    gameUrl: "/games/tio-aceite/",
    description: "El mítico maestro nocturno de La Serena en un frenético beat 'em up culinario. Administra la paila de aceite hirviendo a las 4 AM, atiende a los parroquianos carreteros y esquiva a los inspectores.",
    featured: true,
    releaseYear: "1994",
    status: "DISPONIBLE"
  },
  {
    id: "chimuelo-02",
    title: "CHIMUELO: EL SANTO SEPULCRO",
    category: "viral",
    badge: "VIRAL CHILENO",
    image: "/assets/chimuelo.jpg",
    description: "El funeral de periquito más accidentado de la historia de YouTube. Cava la fosa en el patio, entona el himno celestial y rescata a Chimuelo del hocico del perro Cleo a toda velocidad.",
    featured: false,
    releaseYear: "1995",
    status: "DISPONIBLE"
  },
  {
    id: "tarro-03",
    title: "EL TARRO: SALTO BMX MORTAL",
    category: "viral",
    badge: "ACCIÓN EXTREMA",
    image: "/assets/tarro-title.jpeg",
    gameUrl: "/games/el-tarro/",
    description: "Pedalea a toda máquina por las calles de tierra de Talca. Salta la rampa de tablas improvisada mientras tus amigos gritan ¡DALE TARRO! y calcula el aterrizaje para evitar el legendario tortazo.",
    featured: false,
    releaseYear: "1993",
    status: "DISPONIBLE"
  },
  {
    id: "tiempo-04",
    title: "EL TIEMPO ES ORO: GRAN CONCURSO",
    category: "nostalgia",
    badge: "TRIVIA TV 90s",
    image: "/assets/tiempo-title.jpeg",
    gameUrl: "/games/el-tiempo-es-oro/",
    description: "El mítico concurso cultural de Canal 13 con Susana y Roberto. Pon a prueba tus conocimientos sobre Chile contrarreloj en tres etapas y llévate el codiciado Reloj de Oro.",
    featured: false,
    releaseYear: "1995",
    status: "DISPONIBLE"
  },
  {
    id: "rosa-espinoza-04",
    title: "ROSA ESPINOZA: FURIA 16-BIT",
    category: "arcade",
    badge: "ARCADE 16-BIT",
    image: "/assets/proposal_neogeo.jpg",
    description: "Juego de lucha callejera estilo SNK Fatal Fury. Enfrenta a tus rivales desatando combos vocales destructivos con las frases más floridas e indestructibles de la historia de internet.",
    featured: false,
    releaseYear: "1996",
    status: "PRÓXIMAMENTE"
  },
  {
    id: "zafrada-05",
    title: "EL ZAFRADA: MISIÓN ILOCA 8.8",
    category: "viral",
    badge: "AVENTURA",
    image: "/assets/proposal_snes.jpg",
    description: "Un tierno runner plataformero en 16 bit. Acompaña al pequeño gigante de Iloca a repartir frazadas, leche y esperanza tras el gran movimiento telúrico costero.",
    featured: false,
    releaseYear: "1994",
    status: "PRÓXIMAMENTE"
  },
  {
    id: "speed-arcade-06",
    title: "COMPLETO RUN: MASTERS OF PALTA",
    category: "arcade",
    badge: "ARCADE VELOZ",
    image: "/assets/proposal_genesis.jpg",
    description: "El reloj corre y la clientela tiene hambre. Recorre Santiago armando completos italianos a la velocidad de la luz: tomate picado, palta hass y la corona de mayonesa casera sin derramar nada.",
    featured: false,
    releaseYear: "1992",
    status: "EN DESARROLLO"
  }
];

// ==========================================================================
// 2. DEFAULT CREDITS SEED DATA & SECTION METADATA
// ==========================================================================
const DEFAULT_CREDITS_META = {
  pretitle: "PLAYER SELECT / STAFF ROLL",
  title: "CREADORES & INSPIRACIÓN",
  subtitle: "El equipo detrás de la máquina arcade de VIRALGAMES"
};

const DEFAULT_CREDITS = [
  {
    id: "credit-creator-01",
    name: "FRANCISCO CARLE",
    role: "CREADOR & GAME DESIGNER",
    slotBadge: "PLAYER 1 [CREADOR]",
    rank: "★ LVL 99 DEV",
    theme: "purple",
    icon: "👑",
    bio: "Creador de VIRALGAMES. Programador y entusiasta de la nostalgia noventera, rescata los hitos más desquiciados, graciosos y memorables de la cultura chilena e hispanohablante para transformarlos en una colección interminable de mini juegos de 16 bit.",
    linkText: "@francisco.carle",
    linkUrl: "https://www.instagram.com/francisco.carle/",
    avatarImage: "", // Empty defaults to retro sprite
    spriteClass: "avatar-francisco"
  },
  {
    id: "credit-inspiration-02",
    name: "JANO MENDOZA",
    role: "INSPIRACIÓN & MENTE CREATIVA",
    slotBadge: "PLAYER 2 [INSPIRACIÓN]",
    rank: "★ SPECIAL GUEST",
    theme: "cyan",
    icon: "⚡",
    bio: "Inspiración directa y mentor de locuras creativas. Con su energía experimental y proyectos en Janolabs, enciende la chispa para convertir cada meme y viral en una pieza jugable de entretenimiento digital.",
    linkText: "@janolabs_",
    linkUrl: "https://www.instagram.com/janolabs_/",
    avatarImage: "",
    spriteClass: "avatar-jano"
  }
];

// ==========================================================================
// 2B. DEFAULT LEADERBOARDS SEED DATA (Top 5 per playable game)
// ==========================================================================
const DEFAULT_TIO_ACEITE_LEADERBOARD = [
  { name: '@francisco',   score: 28500, stageName: 'Polideportivo', date: '1994' },
  { name: 'JANO_MASTER',  score: 24200, stageName: 'Feria Abastos', date: '1994' },
  { name: '@chimuelo_cl', score: 19800, stageName: 'Plaza Tenri',   date: '1995' },
  { name: 'EL_TARRO_BMX', score: 16400, stageName: 'Plaza Armas',   date: '1993' },
  { name: 'LA_SERENA_94', score: 14100, stageName: 'La Recova',     date: '1994' }
];

const DEFAULT_EL_TARRO_LEADERBOARD = [
  { name: '@el_tarro_bmx', score: 8500, stageName: 'Talca BMX',  date: '1993' },
  { name: 'MANZANA_BMX',  score: 6400, stageName: 'La Zanja',   date: '1993' },
  { name: '@caluga_pique',score: 5100, stageName: 'Los Primos', date: '1993' },
  { name: 'BICI_PANA',    score: 3800, stageName: 'El Patio',   date: '1993' },
  { name: 'DALE_TARRO',   score: 2200, stageName: 'Rampa 1',    date: '1993' }
];

const DEFAULT_EL_TIEMPO_ES_ORO_LEADERBOARD = [
  { name: '@concurso_tv', score: 14200, stageName: 'Minuto de Oro', date: '1995' },
  { name: 'DON_FRANCIS', score: 11800, stageName: 'Etapa 8',        date: '1995' },
  { name: '@susana_fan',  score: 9500,  stageName: 'Etapa 7',        date: '1995' },
  { name: 'ROBERTO_TV',  score: 7400,  stageName: 'Etapa 5',        date: '1995' },
  { name: 'CURIOSO_90',  score: 5200,  stageName: 'Etapa 3',        date: '1995' }
];

// ==========================================================================
// 3. THEMES METADATA
// ==========================================================================
const THEMES_INFO = {
  snes: {
    name: "SUPER NINTENDO (SNES)",
    desc: "Colores vibrantes, calidez noventera y botones biselados de 4 colores estilo Super Famicom."
  },
  neogeo: {
    name: "SNK NEO•GEO ARCADE",
    desc: "Cabina arcade industrial, fuego oscuro, rojo/amarillo neón y marcos metálicos KOF / Metal Slug."
  },
  genesis: {
    name: "SEGA GENESIS (BLAST)",
    desc: "Synthwave cyberpunk, rejilla neón cian/fucsia y estética de alta velocidad 16-Bit Blast Processing."
  }
};

// ==========================================================================
// 4. RETRO AUDIO SYNTHESIZER (NATIVE WEB AUDIO API)
// ==========================================================================
class RetroAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('viralgames_sound_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('viralgames_sound_muted', this.muted);
    return !this.muted;
  }

  play(type) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    try {
      if (type === 'coin') {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'square';
        osc2.type = 'square';

        osc1.frequency.setValueAtTime(987.77, t); // B5
        osc1.frequency.setValueAtTime(1318.51, t + 0.08); // E6

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc1.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(t);
        osc1.stop(t + 0.35);

      } else if (type === 'click') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.05);

      } else if (type === 'start') {
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, t + idx * 0.06);

          gain.gain.setValueAtTime(0.08, t + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, t + (idx + 1) * 0.06 + 0.04);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t + idx * 0.06);
          osc.stop(t + (idx + 1) * 0.06 + 0.05);
        });

      } else if (type === 'sizzle') {
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);

      } else if (type === 'error') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.setValueAtTime(90, t + 0.1);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      }
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }
}

const sfx = new RetroAudioEngine();

// ==========================================================================
// 5. APPLICATION CLASS & STATE MANAGEMENT
// ==========================================================================
class ViralGamesApp {
  constructor() {
    this.games = this.loadGames();
    this.credits = this.loadCredits();
    this.creditsMeta = this.loadCreditsMeta();
    this.customTags = this.loadCustomTags();
    this.leaderboards = this.loadLeaderboards();

    this.currentTheme = localStorage.getItem('viralgames_theme') || 'snes';
    this.crtEnabled = localStorage.getItem('viralgames_crt') === 'true';
    this.showArcadeHud = localStorage.getItem('viralgames_hud_visible') !== 'false';
    this.showArcadeNavbar = localStorage.getItem('viralgames_navbar_visible') !== 'false';
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.activeModalGame = null;
    this.activeTab = 'games';
    this.adminAuthenticated = sessionStorage.getItem('viralgames_admin_auth') === 'true';

    this.initDOM();
    this.applyTheme(this.currentTheme, false);
    this.applyCRT(this.crtEnabled, false);
    this.applyHudVisibility(false);
    this.applyNavbarVisibility(false);
    this.renderFilterTabs();
    this.initEvents();
    this.renderCatalog();
    this.renderLeaderboards();
    this.renderCredits();
    this.checkAdminRoute();

    // Sincronización en tiempo real con Firebase Cloud Firestore
    this.initFirebaseSync();
  }

  // Leaderboards Storage Loader
  loadLeaderboards() {
    const leaderboards = {
      'tio-aceite': DEFAULT_TIO_ACEITE_LEADERBOARD,
      'el-tarro': DEFAULT_EL_TARRO_LEADERBOARD,
      'el-tiempo-es-oro': DEFAULT_EL_TIEMPO_ES_ORO_LEADERBOARD
    };

    ['tio-aceite', 'el-tarro', 'el-tiempo-es-oro'].forEach(id => {
      try {
        const stored = localStorage.getItem(`viralgames_leaderboard_${id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            leaderboards[id] = parsed;
          }
        }
      } catch (e) {
        console.warn(`Error reading leaderboard ${id} from localStorage:`, e);
      }
    });

    return leaderboards;
  }

  // Tags & Categories Storage
  loadCustomTags() {
    try {
      const stored = localStorage.getItem('viralgames_custom_tags');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Error reading custom tags from localStorage:", e);
    }
    return [];
  }

  saveCustomTag(id, label) {
    if (!id || !label) return;
    const exists = this.customTags.some(t => t.id === id);
    if (!exists) {
      this.customTags.push({ id, label });
      localStorage.setItem('viralgames_custom_tags', JSON.stringify(this.customTags));
      this.syncSystemSettingsToCloud();
    }
  }

  getAllTags() {
    const baseTags = [
      { id: 'all', label: '★ TODOS' },
      { id: 'viral', label: 'VIRALES CHILENOS' },
      { id: 'arcade', label: 'ARCADE 16-BIT' },
      { id: 'nostalgia', label: 'NOSTALGIA' },
      { id: 'proximamente', label: 'PRÓXIMAMENTE' }
    ];

    const knownIds = new Set(baseTags.map(t => t.id));
    const extraTags = [];

    // From customTags in storage
    if (Array.isArray(this.customTags)) {
      this.customTags.forEach(t => {
        if (!knownIds.has(t.id)) {
          knownIds.add(t.id);
          extraTags.push({ id: t.id, label: t.label || t.id.toUpperCase() });
        }
      });
    }

    // From games in this.games
    this.games.forEach(g => {
      if (g.category && !knownIds.has(g.category.toLowerCase())) {
        const id = g.category.toLowerCase();
        knownIds.add(id);
        extraTags.push({ id, label: g.category.toUpperCase().replace(/-/g, ' ') });
      }
      if (Array.isArray(g.tags)) {
        g.tags.forEach(t => {
          const id = t.toLowerCase();
          if (!knownIds.has(id)) {
            knownIds.add(id);
            extraTags.push({ id, label: t.toUpperCase().replace(/-/g, ' ') });
          }
        });
      }
    });

    return [...baseTags, ...extraTags];
  }

  applyHudVisibility(syncToCloud = false) {
    if (this.arcadeHud) {
      if (this.showArcadeHud) {
        this.arcadeHud.classList.remove('hidden');
      } else {
        this.arcadeHud.classList.add('hidden');
      }
    }
    if (this.adminHudStatusText) {
      this.adminHudStatusText.textContent = this.showArcadeHud ? 'VISIBLE' : 'OCULTO';
    }
    if (this.btnAdminToggleHud) {
      this.btnAdminToggleHud.classList.toggle('active', this.showArcadeHud);
    }
    if (syncToCloud) {
      this.syncSystemSettingsToCloud();
    }
  }

  applyNavbarVisibility(syncToCloud = false) {
    if (this.arcadeNavbar) {
      if (this.showArcadeNavbar) {
        this.arcadeNavbar.classList.remove('hidden');
      } else {
        this.arcadeNavbar.classList.add('hidden');
      }
    }
    if (this.adminNavbarStatusText) {
      this.adminNavbarStatusText.textContent = this.showArcadeNavbar ? 'VISIBLE' : 'OCULTO';
    }
    if (this.btnAdminToggleNavbar) {
      this.btnAdminToggleNavbar.classList.toggle('active', this.showArcadeNavbar);
    }
    if (syncToCloud) {
      this.syncSystemSettingsToCloud();
    }
  }

  // Games Storage
  loadGames() {
    try {
      const stored = localStorage.getItem('viralgames_catalog');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) {
          let migrated = false;
          const tio = parsed.find(g => g.id === "tio-aceite-01");
          if (tio && !tio.gameUrl) {
            tio.gameUrl = "/games/tio-aceite/";
            migrated = true;
          }
          const tarro = parsed.find(g => g.id === "tarro-03");
          if (tarro) {
            if (!tarro.gameUrl || tarro.status !== "DISPONIBLE") {
              tarro.gameUrl = "/games/el-tarro/";
              tarro.status = "DISPONIBLE";
              migrated = true;
            }
            if (!tarro.image || tarro.image === "/assets/tarro.jpg") {
              tarro.image = "/assets/tarro-title.jpeg";
              migrated = true;
            }
          }
          let tiempo = parsed.find(g => g.id === "tiempo-04");
          if (!tiempo) {
            const defaultTiempo = DEFAULT_GAMES.find(g => g.id === "tiempo-04");
            if (defaultTiempo) {
              const tarroIdx = parsed.findIndex(g => g.id === "tarro-03");
              if (tarroIdx !== -1) {
                parsed.splice(tarroIdx + 1, 0, { ...defaultTiempo });
              } else {
                parsed.push({ ...defaultTiempo });
              }
              migrated = true;
            }
          } else {
            if (!tiempo.gameUrl || tiempo.gameUrl !== "/games/el-tiempo-es-oro/") {
              tiempo.gameUrl = "/games/el-tiempo-es-oro/";
              migrated = true;
            }
            if (!tiempo.image || tiempo.image !== "/assets/tiempo-title.jpeg") {
              tiempo.image = "/assets/tiempo-title.jpeg";
              migrated = true;
            }
            if (tiempo.status !== "DISPONIBLE") {
              tiempo.status = "DISPONIBLE";
              migrated = true;
            }
            if (tiempo.category !== "nostalgia") {
              tiempo.category = "nostalgia";
              migrated = true;
            }
          }
          if (migrated) {
            localStorage.setItem('viralgames_catalog', JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading games from localStorage:", e);
    }
    localStorage.setItem('viralgames_catalog', JSON.stringify(DEFAULT_GAMES));
    return [...DEFAULT_GAMES];
  }

  saveGames(syncToCloud = true) {
    localStorage.setItem('viralgames_catalog', JSON.stringify(this.games));
    this.renderFilterTabs();
    this.renderCatalog();
    this.renderAdminGamesTable();
    if (syncToCloud) {
      saveAllGamesToDb(this.games);
    }
  }

  resetDefaultGames() {
    if (confirm("¿Estás seguro de restablecer el catálogo de fábrica con los juegos originales?")) {
      this.games = [...DEFAULT_GAMES];
      this.saveGames(true);
      sfx.play('start');
      alert("¡Catálogo de juegos restablecido con éxito!");
    }
  }

  // Credits Storage
  loadCredits() {
    try {
      const stored = localStorage.getItem('viralgames_credits');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading credits from localStorage:", e);
    }
    localStorage.setItem('viralgames_credits', JSON.stringify(DEFAULT_CREDITS));
    return [...DEFAULT_CREDITS];
  }

  saveCredits(syncToCloud = true) {
    localStorage.setItem('viralgames_credits', JSON.stringify(this.credits));
    this.renderCredits();
    this.renderAdminCreditsTable();
    if (syncToCloud) {
      saveAllCreditsToDb(this.credits);
    }
  }

  loadCreditsMeta() {
    try {
      const stored = localStorage.getItem('viralgames_credits_meta');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading credits meta from localStorage:", e);
    }
    localStorage.setItem('viralgames_credits_meta', JSON.stringify(DEFAULT_CREDITS_META));
    return { ...DEFAULT_CREDITS_META };
  }

  saveCreditsMeta(syncToCloud = true) {
    localStorage.setItem('viralgames_credits_meta', JSON.stringify(this.creditsMeta));
    this.renderCredits();
    if (syncToCloud) {
      saveCreditsMetaToDb(this.creditsMeta);
    }
  }

  resetDefaultCredits() {
    if (confirm("¿Estás seguro de restablecer la sección Créditos con los integrantes originales?")) {
      this.credits = [...DEFAULT_CREDITS];
      this.creditsMeta = { ...DEFAULT_CREDITS_META };
      this.saveCredits(true);
      this.saveCreditsMeta(true);
      sfx.play('start');
      alert("¡Sección créditos restablecida con éxito!");
    }
  }

  // ========================================================================
  // CLOUD FIRESTORE SYNCHRONIZATION
  // ========================================================================
  syncSystemSettingsToCloud() {
    saveSystemSettings({
      theme: this.currentTheme,
      crtEnabled: this.crtEnabled,
      showHud: this.showArcadeHud,
      showNavbar: this.showArcadeNavbar,
      customTags: this.customTags
    });
  }

  initFirebaseSync() {
    console.log("[Viralgames] Sincronizando con Cloud Firestore...");

    // 1. Configuración del sistema (Tema, CRT, HUD, Navbar, Custom Tags)
    subscribeSettings((cloudSettings) => {
      if (cloudSettings) {
        console.log("[Firebase] Configuración recibida de la nube:", cloudSettings);
        if (cloudSettings.theme && cloudSettings.theme !== this.currentTheme) {
          this.applyTheme(cloudSettings.theme, false);
        }
        if (typeof cloudSettings.crtEnabled === 'boolean' && cloudSettings.crtEnabled !== this.crtEnabled) {
          this.applyCRT(cloudSettings.crtEnabled, false);
        }
        if (typeof cloudSettings.showHud === 'boolean' && cloudSettings.showHud !== this.showArcadeHud) {
          this.showArcadeHud = cloudSettings.showHud;
          localStorage.setItem('viralgames_hud_visible', this.showArcadeHud ? 'true' : 'false');
          this.applyHudVisibility(false);
        }
        if (typeof cloudSettings.showNavbar === 'boolean' && cloudSettings.showNavbar !== this.showArcadeNavbar) {
          this.showArcadeNavbar = cloudSettings.showNavbar;
          localStorage.setItem('viralgames_navbar_visible', this.showArcadeNavbar ? 'true' : 'false');
          this.applyNavbarVisibility(false);
        }
        if (Array.isArray(cloudSettings.customTags)) {
          this.customTags = cloudSettings.customTags;
          localStorage.setItem('viralgames_custom_tags', JSON.stringify(this.customTags));
          this.renderFilterTabs();
        }
      } else {
        // Sembrar datos iniciales en Firestore si aún no existen
        console.log("[Firebase] settings/system vacía. Sembrando datos iniciales...");
        this.syncSystemSettingsToCloud();
      }
    });

    // 2. Metadatos de la sección Créditos (Títulos y Subtítulos)
    subscribeCreditsMeta((cloudMeta) => {
      if (cloudMeta && (cloudMeta.title || cloudMeta.pretitle)) {
        this.creditsMeta = {
          pretitle: cloudMeta.pretitle || DEFAULT_CREDITS_META.pretitle,
          title: cloudMeta.title || DEFAULT_CREDITS_META.title,
          subtitle: cloudMeta.subtitle || DEFAULT_CREDITS_META.subtitle
        };
        localStorage.setItem('viralgames_credits_meta', JSON.stringify(this.creditsMeta));
        this.renderCredits();
      } else {
        console.log("[Firebase] settings/credits_meta vacía. Sembrando datos...");
        saveCreditsMetaToDb(this.creditsMeta);
      }
    });

    // 3. Catálogo de juegos en vivo
    subscribeGames((cloudGames) => {
      if (cloudGames && cloudGames.length > 0) {
        console.log(`[Firebase] Catálogo recibido de la nube (${cloudGames.length} juegos)`);
        cloudGames.sort((a, b) => (a.catalogOrder ?? 999) - (b.catalogOrder ?? 999));
        this.games = cloudGames;
        localStorage.setItem('viralgames_catalog', JSON.stringify(this.games));
        this.renderFilterTabs();
        this.renderCatalog();
        this.renderAdminGamesTable();
      } else {
        console.log("[Firebase] Colección de juegos vacía. Sembrando catálogo inicial en la nube...");
        saveAllGamesToDb(this.games);
      }
    });

    // 4. Integrantes de créditos en vivo
    subscribeCredits((cloudCredits) => {
      if (cloudCredits && cloudCredits.length > 0) {
        console.log(`[Firebase] Créditos recibidos de la nube (${cloudCredits.length} integrantes)`);
        cloudCredits.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        this.credits = cloudCredits;
        localStorage.setItem('viralgames_credits', JSON.stringify(this.credits));
        this.renderCredits();
        this.renderAdminCreditsTable();
      } else {
        console.log("[Firebase] Colección de créditos vacía. Sembrando créditos iniciales en la nube...");
        saveAllCreditsToDb(this.credits);
      }
    });

    // 5. Leaderboards en vivo (Top 5 por juego con sincronización Cloud Firestore)
    const playableGameIds = ['tio-aceite', 'el-tarro', 'el-tiempo-es-oro'];
    playableGameIds.forEach(gameId => {
      subscribeLeaderboard(gameId, (cloudEntries) => {
        if (cloudEntries && Array.isArray(cloudEntries) && cloudEntries.length > 0) {
          console.log(`[Firebase] Leaderboard recibido de la nube (${gameId}): ${cloudEntries.length} entradas`);
          this.leaderboards[gameId] = cloudEntries;
          localStorage.setItem(`viralgames_leaderboard_${gameId}`, JSON.stringify(cloudEntries));
          this.renderLeaderboards();
        } else {
          console.log(`[Firebase] Leaderboard ${gameId} vacío en Firestore. Sembrando defaults...`);
          const defaults = this.leaderboards[gameId] || [];
          if (defaults.length > 0) {
            saveLeaderboardToDb(gameId, defaults);
          }
        }
      });
    });
  }

  initDOM() {
    // Sound & HUD
    this.btnToggleSound = document.getElementById('btnToggleSound');
    this.soundLabel = document.getElementById('soundLabel');

    // Hero Tio Aceite buttons & Arcade Modal
    this.btnPlayTioAceite = document.getElementById('btnPlayTioAceite');
    this.btnInfoTioAceite = document.getElementById('btnInfoTioAceite');
    this.gamePlayModal = document.getElementById('gamePlayModal');
    this.btnCloseGameModal = document.getElementById('btnCloseGameModal');
    this.gameCabinetIframe = document.getElementById('gameCabinetIframe');
    this.gameComingSoonNotice = document.getElementById('gameComingSoonNotice');
    this.comingSoonGameName = document.getElementById('comingSoonGameName');
    this.btnPlayTioInstead = document.getElementById('btnPlayTioInstead');
    this.btnFullscreenGame = document.getElementById('btnFullscreenGame');

    // Details Modal elements
    this.gameDetailsModal = document.getElementById('gameDetailsModal');
    this.detailsModalTitle = document.getElementById('detailsModalTitle');
    this.btnCloseDetailsModal = document.getElementById('btnCloseDetailsModal');
    this.detailsModalImg = document.getElementById('detailsModalImg');
    this.detailsModalBadge = document.getElementById('detailsModalBadge');
    this.detailsModalCat = document.getElementById('detailsModalCat');
    this.detailsModalStatus = document.getElementById('detailsModalStatus');
    this.detailsModalGameTitle = document.getElementById('detailsModalGameTitle');
    this.detailsModalYear = document.getElementById('detailsModalYear');
    this.detailsModalDesc = document.getElementById('detailsModalDesc');
    this.btnDetailsPlayNow = document.getElementById('btnDetailsPlayNow');
    this.btnDetailsClose = document.getElementById('btnDetailsClose');

    // Catalog controls
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.gameSearchInput = document.getElementById('gameSearchInput');
    this.gamesGrid = document.getElementById('gamesGrid');

    // Leaderboards on landing page
    this.leaderboardsGrid = document.getElementById('leaderboardsGrid');

    // Credits elements on landing page
    this.creditsSectionPretitle = document.getElementById('creditsSectionPretitle');
    this.creditsSectionTitle = document.getElementById('creditsSectionTitle');
    this.creditsSectionSubtitle = document.getElementById('creditsSectionSubtitle');
    this.creditsGrid = document.getElementById('creditsGrid');

    // Admin elements
    this.adminPanelWrapper = document.getElementById('adminPanelWrapper');
    this.adminLoginScreen = document.getElementById('adminLoginScreen');
    this.adminDashboardScreen = document.getElementById('adminDashboardScreen');
    this.btnCloseAdminLogin = document.getElementById('btnCloseAdminLogin');
    this.btnCancelAdminLogin = document.getElementById('btnCancelAdminLogin');
    this.btnCloseAdminDash = document.getElementById('btnCloseAdminDash');
    this.btnLogoutAdmin = document.getElementById('btnLogoutAdmin');
    this.adminLoginForm = document.getElementById('adminLoginForm');
    this.adminUserInput = document.getElementById('adminUserInput');
    this.adminPassInput = document.getElementById('adminPassInput');
    this.loginErrorMsg = document.getElementById('loginErrorMsg');

    // Admin Tabs
    this.tabBtnGames = document.getElementById('tabBtnGames');
    this.tabBtnCredits = document.getElementById('tabBtnCredits');
    this.tabBtnSettings = document.getElementById('tabBtnSettings');
    this.adminViewGames = document.getElementById('adminViewGames');
    this.adminViewCredits = document.getElementById('adminViewCredits');
    this.adminViewSettings = document.getElementById('adminViewSettings');
    this.tabCountGames = document.getElementById('tabCountGames');
    this.tabCountCredits = document.getElementById('tabCountCredits');
    this.adminCreditsCount = document.getElementById('adminCreditsCount');

    // Admin exclusive theme & CRT controls
    this.adminThemeButtons = document.querySelectorAll('[data-admin-theme]');
    this.adminThemeDescription = document.getElementById('adminThemeDescription');
    this.btnAdminToggleCRT = document.getElementById('btnAdminToggleCRT');
    this.adminCrtStatusText = document.getElementById('adminCrtStatusText');
    this.arcadeHud = document.getElementById('arcadeHud');
    this.btnAdminToggleHud = document.getElementById('btnAdminToggleHud');
    this.adminHudStatusText = document.getElementById('adminHudStatusText');
    this.arcadeNavbar = document.getElementById('arcadeNavbar');
    this.btnAdminToggleNavbar = document.getElementById('btnAdminToggleNavbar');
    this.adminNavbarStatusText = document.getElementById('adminNavbarStatusText');

    // Games admin editor
    this.adminTotalCount = document.getElementById('adminTotalCount');
    this.btnResetDefaultGames = document.getElementById('btnResetDefaultGames');
    this.btnOpenNewGameForm = document.getElementById('btnOpenNewGameForm');
    this.gameEditorContainer = document.getElementById('gameEditorContainer');
    this.editorFormTitle = document.getElementById('editorFormTitle');
    this.btnCloseEditor = document.getElementById('btnCloseEditor');
    this.btnCancelEditor = document.getElementById('btnCancelEditor');
    this.gameEditorForm = document.getElementById('gameEditorForm');
    this.editGameId = document.getElementById('editGameId');
    this.editTitle = document.getElementById('editTitle');
    this.editBadge = document.getElementById('editBadge');
    this.editCategory = document.getElementById('editCategory');
    this.editCustomCategory = document.getElementById('editCustomCategory');
    this.customCategoryWrapper = document.getElementById('customCategoryWrapper');
    this.editDescription = document.getElementById('editDescription');
    this.editImage = document.getElementById('editImage');
    this.editImagePreview = document.getElementById('editImagePreview');
    this.editGameUrl = document.getElementById('editGameUrl');
    this.editHidden = document.getElementById('editHidden');
    this.adminGamesTableBody = document.getElementById('adminGamesTableBody');

    // Credits admin editor
    this.btnResetDefaultCredits = document.getElementById('btnResetDefaultCredits');
    this.btnOpenNewCreditForm = document.getElementById('btnOpenNewCreditForm');
    this.btnToggleMetaEditor = document.getElementById('btnToggleMetaEditor');
    this.creditsMetaEditorContainer = document.getElementById('creditsMetaEditorContainer');
    this.btnCloseMetaEditor = document.getElementById('btnCloseMetaEditor');
    this.creditsMetaForm = document.getElementById('creditsMetaForm');
    this.editMetaPretitle = document.getElementById('editMetaPretitle');
    this.editMetaTitle = document.getElementById('editMetaTitle');
    this.editMetaSubtitle = document.getElementById('editMetaSubtitle');

    this.creditEditorContainer = document.getElementById('creditEditorContainer');
    this.creditEditorFormTitle = document.getElementById('creditEditorFormTitle');
    this.btnCloseCreditEditor = document.getElementById('btnCloseCreditEditor');
    this.btnCancelCreditEditor = document.getElementById('btnCancelCreditEditor');
    this.creditEditorForm = document.getElementById('creditEditorForm');
    this.editCreditId = document.getElementById('editCreditId');
    this.editCreditName = document.getElementById('editCreditName');
    this.editCreditRole = document.getElementById('editCreditRole');
    this.editCreditTheme = document.getElementById('editCreditTheme');
    this.editCreditSlot = document.getElementById('editCreditSlot');
    this.editCreditRank = document.getElementById('editCreditRank');
    this.editCreditIcon = document.getElementById('editCreditIcon');
    this.editCreditBio = document.getElementById('editCreditBio');
    this.editCreditLinkText = document.getElementById('editCreditLinkText');
    this.editCreditLinkUrl = document.getElementById('editCreditLinkUrl');
    this.editCreditImageUrl = document.getElementById('editCreditImageUrl');
    this.editCreditImageFile = document.getElementById('editCreditImageFile');
    this.btnDeleteCreditImage = document.getElementById('btnDeleteCreditImage');
    this.creditAvatarPreviewFrame = document.getElementById('creditAvatarPreviewFrame');
    this.creditAvatarPreviewImg = document.getElementById('creditAvatarPreviewImg');
    this.creditAvatarFallbackSprite = document.getElementById('creditAvatarFallbackSprite');
    this.creditPreviewEmoji = document.getElementById('creditPreviewEmoji');
    this.creditPreviewCrown = document.getElementById('creditPreviewCrown');
    this.adminCreditsTableBody = document.getElementById('adminCreditsTableBody');

    if (sfx.muted) {
      this.soundLabel.textContent = "SFX OFF";
      this.btnToggleSound.classList.remove('active');
    } else {
      this.soundLabel.textContent = "SFX ON";
      this.btnToggleSound.classList.add('active');
    }
  }

  // ========================================================================
  // THEME & CRT MANAGEMENT
  // ========================================================================
  applyTheme(themeKey, syncToCloud = true) {
    if (!THEMES_INFO[themeKey]) themeKey = 'snes';
    this.currentTheme = themeKey;
    document.documentElement.setAttribute('data-theme', themeKey);
    localStorage.setItem('viralgames_theme', themeKey);

    this.adminThemeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-admin-theme') === themeKey);
    });

    if (this.adminThemeDescription) {
      const info = THEMES_INFO[themeKey];
      this.adminThemeDescription.innerHTML = `Estilo actual: <strong>${info.name}</strong> — ${info.desc}`;
    }

    if (syncToCloud) {
      this.syncSystemSettingsToCloud();
    }
  }

  applyCRT(enabled, syncToCloud = true) {
    this.crtEnabled = Boolean(enabled);
    if (this.crtEnabled) {
      document.body.classList.add('crt-enabled');
    } else {
      document.body.classList.remove('crt-enabled');
    }
    localStorage.setItem('viralgames_crt', this.crtEnabled);

    if (this.adminCrtStatusText) {
      this.adminCrtStatusText.textContent = this.crtEnabled ? "ENCENDIDO" : "APAGADO";
    }
    if (this.btnAdminToggleCRT) {
      this.btnAdminToggleCRT.classList.toggle('btn-primary', this.crtEnabled);
      this.btnAdminToggleCRT.classList.toggle('btn-secondary', !this.crtEnabled);
    }

    if (syncToCloud) {
      this.syncSystemSettingsToCloud();
    }
  }

  // ========================================================================
  // EVENTS INITIALIZATION
  // ========================================================================
  initEvents() {
    // Sound toggle
    this.btnToggleSound.addEventListener('click', () => {
      const isSoundOn = sfx.toggleMute();
      this.soundLabel.textContent = isSoundOn ? "SFX ON" : "SFX OFF";
      this.btnToggleSound.classList.toggle('active', isSoundOn);
      if (isSoundOn) sfx.play('coin');
    });

    // Admin theme switcher
    this.adminThemeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-admin-theme');
        sfx.play('start');
        this.applyTheme(theme);
      });
    });

    // Admin CRT toggle
    if (this.btnAdminToggleCRT) {
      this.btnAdminToggleCRT.addEventListener('click', () => {
        sfx.play('click');
        this.applyCRT(!this.crtEnabled);
      });
    }

    // Generic sound for .btn-sound buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-sound');
      if (btn) sfx.play('click');
    });

    // Tío Aceite Play Demo Modal
    if (this.btnPlayTioAceite) {
      this.btnPlayTioAceite.addEventListener('click', () => {
        sfx.play('coin');
        this.openMiniGameModal(this.games[0]);
      });
    }

    // Tío Aceite Details Modal
    if (this.btnInfoTioAceite) {
      this.btnInfoTioAceite.addEventListener('click', () => {
        sfx.play('click');
        this.openGameDetailsModal(this.games[0]);
      });
    }

    // Details Modal Close buttons
    if (this.btnCloseDetailsModal) {
      this.btnCloseDetailsModal.addEventListener('click', () => {
        sfx.play('click');
        this.gameDetailsModal.close();
      });
    }
    if (this.btnDetailsClose) {
      this.btnDetailsClose.addEventListener('click', () => {
        sfx.play('click');
        this.gameDetailsModal.close();
      });
    }
    if (this.btnDetailsPlayNow) {
      this.btnDetailsPlayNow.addEventListener('click', () => {
        sfx.play('coin');
        this.gameDetailsModal.close();
        if (this.activeModalGame) {
          this.openMiniGameModal(this.activeModalGame);
        }
      });
    }

    // Arcade Cabinet Modal Close & Fullscreen
    if (this.btnCloseGameModal) {
      this.btnCloseGameModal.addEventListener('click', () => {
        sfx.play('click');
        this.gamePlayModal.close();
        if (this.gameCabinetIframe) this.gameCabinetIframe.src = 'about:blank';
      });
    }

    if (this.btnFullscreenGame) {
      this.btnFullscreenGame.addEventListener('click', () => {
        if (this.gameCabinetIframe && this.gameCabinetIframe.requestFullscreen) {
          this.gameCabinetIframe.requestFullscreen();
        }
      });
    }

    if (this.btnPlayTioInstead) {
      this.btnPlayTioInstead.addEventListener('click', () => {
        sfx.play('coin');
        this.openMiniGameModal(this.games[0]);
      });
    }

    // Handle postMessage from mini-game iframes (e.g. exit game button, leaderboard score)
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'CLOSE_VIRALGAMES_MODAL') {
        this.gamePlayModal.close();
        if (this.gameCabinetIframe) this.gameCabinetIframe.src = 'about:blank';
      } else if (e.data && e.data.type === 'VIRALGAMES_SAVE_SCORE') {
        const { gameId, entries } = e.data;
        if (gameId && entries) {
          saveLeaderboardToDb(gameId, entries);
          this.leaderboards[gameId] = entries;
          localStorage.setItem(`viralgames_leaderboard_${gameId}`, JSON.stringify(entries));
          this.renderLeaderboards();
        }
      }
    });

    // Admin Toggle Top Arcade HUD Bar
    if (this.btnAdminToggleHud) {
      this.btnAdminToggleHud.addEventListener('click', () => {
        sfx.play('click');
        this.showArcadeHud = !this.showArcadeHud;
        localStorage.setItem('viralgames_hud_visible', this.showArcadeHud ? 'true' : 'false');
        this.applyHudVisibility(true);
      });
    }

    // Admin Toggle Retro Arcade Navbar
    if (this.btnAdminToggleNavbar) {
      this.btnAdminToggleNavbar.addEventListener('click', () => {
        sfx.play('click');
        this.showArcadeNavbar = !this.showArcadeNavbar;
        localStorage.setItem('viralgames_navbar_visible', this.showArcadeNavbar ? 'true' : 'false');
        this.applyNavbarVisibility(true);
      });
    }

    // Category / Tag dropdown change in Game Editor
    if (this.editCategory) {
      this.editCategory.addEventListener('change', () => {
        if (this.editCategory.value === '__custom__') {
          if (this.customCategoryWrapper) this.customCategoryWrapper.classList.remove('hidden');
          if (this.editCustomCategory) this.editCustomCategory.focus();
        } else {
          if (this.customCategoryWrapper) this.customCategoryWrapper.classList.add('hidden');
        }
      });
    }

    // Search input
    if (this.gameSearchInput) {
      this.gameSearchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderCatalog();
      });
    }

    // URL Routing for Admin (/panel-admin and #panel-admin)
    window.addEventListener('hashchange', () => this.checkAdminRoute());
    window.addEventListener('popstate', () => this.checkAdminRoute());

    // Admin Login / Close
    this.btnCloseAdminLogin.addEventListener('click', () => this.closeAdminPanel());
    this.btnCancelAdminLogin.addEventListener('click', () => this.closeAdminPanel());
    this.btnCloseAdminDash.addEventListener('click', () => this.closeAdminPanel());

    this.adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAdminLogin();
    });

    this.btnLogoutAdmin.addEventListener('click', () => {
      sfx.play('click');
      this.adminAuthenticated = false;
      sessionStorage.removeItem('viralgames_admin_auth');
      this.showAdminLogin();
    });

    // Admin Navigation Tabs
    const adminTabs = [
      { btn: this.tabBtnGames, view: this.adminViewGames, name: 'games' },
      { btn: this.tabBtnCredits, view: this.adminViewCredits, name: 'credits' },
      { btn: this.tabBtnSettings, view: this.adminViewSettings, name: 'settings' }
    ];

    adminTabs.forEach(tab => {
      if (tab.btn) {
        tab.btn.addEventListener('click', () => {
          sfx.play('click');
          adminTabs.forEach(t => {
            t.btn.classList.remove('active');
            t.view.classList.add('hidden');
          });
          tab.btn.classList.add('active');
          tab.view.classList.remove('hidden');
          this.activeTab = tab.name;
        });
      }
    });

    // Games Admin Actions
    this.btnResetDefaultGames.addEventListener('click', () => this.resetDefaultGames());
    this.btnOpenNewGameForm.addEventListener('click', () => {
      sfx.play('click');
      this.openGameEditor(null);
    });
    this.btnCloseEditor.addEventListener('click', () => this.gameEditorContainer.classList.add('hidden'));
    this.btnCancelEditor.addEventListener('click', () => this.gameEditorContainer.classList.add('hidden'));

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        this.editImage.value = url;
        this.editImagePreview.src = url;
        sfx.play('click');
      });
    });

    this.editImage.addEventListener('input', () => {
      this.editImagePreview.src = this.editImage.value || '/assets/tio_aceite.jpg';
    });

    this.gameEditorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveGame();
    });

    // Credits Admin Actions
    this.btnResetDefaultCredits.addEventListener('click', () => this.resetDefaultCredits());
    this.btnOpenNewCreditForm.addEventListener('click', () => {
      sfx.play('click');
      this.openCreditEditor(null);
    });
    this.btnCloseCreditEditor.addEventListener('click', () => this.creditEditorContainer.classList.add('hidden'));
    this.btnCancelCreditEditor.addEventListener('click', () => this.creditEditorContainer.classList.add('hidden'));

    // Section Meta Editor toggle & submit
    this.btnToggleMetaEditor.addEventListener('click', () => {
      sfx.play('click');
      this.creditsMetaEditorContainer.classList.toggle('hidden');
      if (!this.creditsMetaEditorContainer.classList.contains('hidden')) {
        this.editMetaPretitle.value = this.creditsMeta.pretitle;
        this.editMetaTitle.value = this.creditsMeta.title;
        this.editMetaSubtitle.value = this.creditsMeta.subtitle;
      }
    });
    this.btnCloseMetaEditor.addEventListener('click', () => {
      this.creditsMetaEditorContainer.classList.add('hidden');
    });
    this.creditsMetaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.creditsMeta = {
        pretitle: this.editMetaPretitle.value.trim() || DEFAULT_CREDITS_META.pretitle,
        title: this.editMetaTitle.value.trim() || DEFAULT_CREDITS_META.title,
        subtitle: this.editMetaSubtitle.value.trim() || DEFAULT_CREDITS_META.subtitle
      };
      this.saveCreditsMeta();
      sfx.play('start');
      this.creditsMetaEditorContainer.classList.add('hidden');
      alert("¡Títulos de la sección Créditos actualizados!");
    });

    // Credit Avatar Upload via File
    this.editCreditImageFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.editCreditImageUrl.value = evt.target.result;
          this.updateCreditAvatarPreview(evt.target.result);
          sfx.play('click');
        };
        reader.readAsDataURL(file);
      }
    });

    // Credit Avatar Delete / Clear Button
    this.btnDeleteCreditImage.addEventListener('click', () => {
      sfx.play('click');
      this.editCreditImageUrl.value = "";
      this.editCreditImageFile.value = "";
      this.updateCreditAvatarPreview("");
    });

    this.editCreditImageUrl.addEventListener('input', () => {
      this.updateCreditAvatarPreview(this.editCreditImageUrl.value.trim());
    });

    this.editCreditIcon.addEventListener('input', () => {
      const icon = this.editCreditIcon.value.trim() || "👑";
      this.creditPreviewEmoji.textContent = icon;
      this.creditPreviewCrown.textContent = icon;
    });

    this.creditEditorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveCredit();
    });
  }

  // ========================================================================
  // DETAILS MODAL
  // ========================================================================
  openGameDetailsModal(game) {
    if (!game) return;
    this.activeModalGame = game;

    this.detailsModalTitle.textContent = `📜 FICHA TÉCNICA: ${game.title}`;
    this.detailsModalGameTitle.textContent = game.title;
    this.detailsModalImg.src = game.image;
    this.detailsModalImg.alt = game.title;
    this.detailsModalImg.onerror = () => {
      this.detailsModalImg.src = '/assets/tarro-title.jpeg';
    };
    this.detailsModalBadge.textContent = game.badge || '16-BIT RETRO';
    this.detailsModalCat.textContent = game.category.toUpperCase();
    this.detailsModalStatus.textContent = game.status || 'DISPONIBLE';
    this.detailsModalYear.textContent = game.releaseYear || '1994';
    this.detailsModalDesc.textContent = game.description;

    this.gameDetailsModal.showModal();
  }

  renderFilterTabs() {
    const container = document.getElementById('filterTabs') || document.querySelector('.filter-tabs');
    if (!container) return;

    const allTags = this.getAllTags();

    container.innerHTML = allTags.map(tag => `
      <button type="button" class="filter-btn ${this.activeFilter === tag.id ? 'active' : ''}" data-filter="${tag.id}">
        ${tag.label}
      </button>
    `).join('');

    this.filterButtons = container.querySelectorAll('.filter-btn');
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sfx.play('click');
        this.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.getAttribute('data-filter');
        this.renderCatalog();
      });
    });
  }

  // ========================================================================
  // CATALOG RENDERING
  // ========================================================================
  renderCatalog() {
    if (!this.gamesGrid) return;

    // Check if featured game (Tío Aceite) is marked as hidden
    const featuredSection = document.getElementById('featuredSection');
    if (featuredSection) {
      const tio = this.games.find(g => g.id === "tio-aceite-01");
      if (tio && tio.hidden) {
        featuredSection.classList.add('hidden');
      } else {
        featuredSection.classList.remove('hidden');
      }
    }

    let filtered = this.games.filter(g => {
      if (g.hidden) return false;
      if (this.activeFilter === 'all') {
        // all visible
      } else if (this.activeFilter === 'viral') {
        if (g.category !== 'viral' && (!Array.isArray(g.tags) || !g.tags.includes('viral'))) return false;
      } else if (this.activeFilter === 'arcade') {
        if (g.category !== 'arcade' && (!Array.isArray(g.tags) || !g.tags.includes('arcade'))) return false;
      } else if (this.activeFilter === 'nostalgia') {
        if (g.category !== 'nostalgia' && (!Array.isArray(g.tags) || !g.tags.includes('nostalgia'))) return false;
      } else if (this.activeFilter === 'proximamente') {
        if (g.status !== 'PRÓXIMAMENTE' && g.category !== 'proximamente') return false;
      } else {
        const filterKey = this.activeFilter.toLowerCase();
        const matches = (g.category && g.category.toLowerCase() === filterKey) ||
                        (Array.isArray(g.tags) && g.tags.some(t => t.toLowerCase() === filterKey)) ||
                        (g.badge && g.badge.toLowerCase().includes(filterKey));
        if (!matches) return false;
      }

      if (this.searchQuery) {
        const text = (g.title + " " + g.description + " " + (g.badge || "")).toLowerCase();
        return text.includes(this.searchQuery);
      }
      return true;
    });

    if (filtered.length === 0) {
      this.gamesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(0,0,0,0.4); border: 2px dashed #4a3e75;">
          <p style="font-family: var(--font-pixel); color: var(--accent-gold); font-size: 13px; margin-bottom: 8px;">
            👾 NO SE ENCONTRARON MINI JUEGOS
          </p>
          <p style="color: var(--text-muted); font-size: 14px;">Intenta cambiar el filtro o el término de búsqueda.</p>
        </div>
      `;
      return;
    }

    this.gamesGrid.innerHTML = filtered.map(game => `
      <article class="game-card" data-game-id="${game.id}">
        <div class="game-card-media">
          <img src="${game.image}" alt="${game.title}" class="game-card-img" loading="lazy" onerror="this.src='/assets/tio_aceite.jpg'">
          <span class="game-card-badge">${game.badge || '16-BIT'}</span>
        </div>
        <div class="game-card-content">
          <h3 class="game-card-title">${game.title}</h3>
          <p class="game-card-desc">${game.description}</p>
          <div class="game-card-footer">
            <button type="button" class="btn-card-play" data-action="play" data-id="${game.id}">
              ▶ JUGAR
            </button>
            <button type="button" class="btn-card-details" data-action="details" data-id="${game.id}">
              DETALLES
            </button>
          </div>
        </div>
      </article>
    `).join('');

    this.gamesGrid.querySelectorAll('.btn-card-play').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const game = this.games.find(g => g.id === id);
        sfx.play('coin');
        this.openMiniGameModal(game);
      });
    });

    this.gamesGrid.querySelectorAll('.btn-card-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const game = this.games.find(g => g.id === id);
        sfx.play('click');
        this.openGameDetailsModal(game);
      });
    });
  }

  // ========================================================================
  // ESCAPE HTML HELPER
  // ========================================================================
  escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ========================================================================
  // LEADERBOARDS RENDERING (Landing Page Top 5 with Instagram handles)
  // ========================================================================
  renderLeaderboards() {
    if (!this.leaderboardsGrid) return;

    const gameConfigs = [
      {
        id: 'tio-aceite',
        title: 'TÍO ACEITE',
        subtitle: 'LA FRITANGA SUPREMA',
        badge: '🍳 STREET FOOD 16-BIT',
        themeClass: 'card-gold',
        image: '/assets/tio_aceite.jpg',
        gameUrl: '/games/tio-aceite/'
      },
      {
        id: 'el-tarro',
        title: 'EL TARRO',
        subtitle: 'SALTO BMX MORTAL',
        badge: '🚲 TALCA BMX EXTREMO',
        themeClass: 'card-cyan',
        image: '/assets/tarro-title.jpeg',
        gameUrl: '/games/el-tarro/'
      },
      {
        id: 'el-tiempo-es-oro',
        title: 'EL TIEMPO ES ORO',
        subtitle: 'GRAN CONCURSO TV',
        badge: '⏳ TRIVIA CULTURAL 90s',
        themeClass: 'card-purple',
        image: '/assets/tiempo-title.jpeg',
        gameUrl: '/games/el-tiempo-es-oro/'
      }
    ];

    this.leaderboardsGrid.innerHTML = gameConfigs.map(cfg => {
      const rawEntries = this.leaderboards[cfg.id] || [];
      const topEntries = [...rawEntries]
        .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
        .slice(0, 5);

      const rowsHtml = topEntries.map((entry, idx) => {
        const rank = idx + 1;
        let rankBadgeClass = `rank-${rank}`;
        let rankText = `#0${rank}`;
        if (rank === 1) rankText = '🥇 1ST';
        else if (rank === 2) rankText = '🥈 2ND';
        else if (rank === 3) rankText = '🥉 3RD';

        const rawName = (entry.name || 'ANÓNIMO').trim();
        const isInstagram = rawName.startsWith('@');
        let playerHtml = '';

        if (isInstagram) {
          const cleanHandle = rawName.slice(1).replace(/[^a-zA-Z0-9_.]/g, '');
          playerHtml = `
            <a href="https://instagram.com/${cleanHandle}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="lb-player-link lb-insta-link" 
               title="Ver perfil de Instagram de @${cleanHandle}">
              <span class="lb-insta-icon">📸</span>
              <span class="lb-handle-text">${this.escapeHtml(rawName)}</span>
              <span class="lb-external-icon">↗</span>
            </a>
          `;
        } else {
          playerHtml = `<span class="lb-player-name">${this.escapeHtml(rawName)}</span>`;
        }

        const scoreFormatted = Number(entry.score || 0).toLocaleString('es-CL');
        const stage = entry.stageName ? this.escapeHtml(entry.stageName) : 'STAGE 1';

        return `
          <tr class="lb-row lb-row-${rank}">
            <td class="lb-col-rank">
              <span class="lb-rank-badge ${rankBadgeClass}">${rankText}</span>
            </td>
            <td class="lb-col-player">
              ${playerHtml}
            </td>
            <td class="lb-col-score">
              <span class="lb-score-val">${scoreFormatted}</span>
            </td>
            <td class="lb-col-stage">
              <span class="lb-stage-tag">${stage}</span>
            </td>
          </tr>
        `;
      }).join('');

      return `
        <article class="leaderboard-card ${cfg.themeClass}">
          <div class="lb-card-header">
            <div class="lb-card-badge-row">
              <span class="pixel-badge badge-primary">${cfg.badge}</span>
              <span class="lb-live-dot">● EN VIVO</span>
            </div>
            <div class="lb-card-title-row">
              <img src="${cfg.image}" alt="${cfg.title}" class="lb-card-thumb" onerror="this.src='/assets/tio_aceite.jpg'">
              <div class="lb-card-headings">
                <h3 class="lb-card-title">${cfg.title}</h3>
                <span class="lb-card-subtitle">${cfg.subtitle}</span>
              </div>
            </div>
          </div>

          <div class="lb-card-table-wrapper">
            <table class="lb-table">
              <thead>
                <tr>
                  <th class="lb-th-rank">POS</th>
                  <th class="lb-th-player">JUGADOR / INSTAGRAM</th>
                  <th class="lb-th-score">SCORE</th>
                  <th class="lb-th-stage">ETAPA</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || `<tr><td colspan="4" class="lb-empty">Aún no hay récords registrados. ¡Sé el primero!</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="lb-card-footer">
            <div class="lb-hint-box">
              <span class="lb-hint-icon">💡</span>
              <span class="lb-hint-text">Firma con <strong>@usuario</strong> (máx 12 caracteres) para enlazar tu Instagram</span>
            </div>
            <button type="button" class="pixel-button btn-primary btn-play-lb btn-sound" data-play-game="${cfg.id}">
              ▶ INSERTAR FICHA &amp; JUGAR
            </button>
          </div>
        </article>
      `;
    }).join('');

    // Wire up the Play buttons in the leaderboard cards
    this.leaderboardsGrid.querySelectorAll('.btn-play-lb').forEach(btn => {
      btn.addEventListener('click', () => {
        sfx.play('coin');
        const gameId = btn.getAttribute('data-play-game');
        const matchedGame = this.games.find(g => g.gameUrl && g.gameUrl.includes(gameId)) 
          || this.games.find(g => g.id.includes(gameId)) 
          || this.games[0];
        this.openMiniGameModal(matchedGame);
      });
    });
  }

  // ========================================================================
  // CREDITS RENDERING (Landing Page)
  // ========================================================================
  renderCredits() {
    if (!this.creditsGrid) return;

    // Update section titles
    if (this.creditsSectionPretitle) this.creditsSectionPretitle.textContent = this.creditsMeta.pretitle;
    if (this.creditsSectionTitle) this.creditsSectionTitle.textContent = this.creditsMeta.title;
    if (this.creditsSectionSubtitle) this.creditsSectionSubtitle.textContent = this.creditsMeta.subtitle;

    this.creditsGrid.innerHTML = this.credits.map(member => {
      const themeClass = `card-${member.theme || 'purple'}`;
      const icon = member.icon || '👑';

      // Avatar rendering: Custom image vs Retro CSS Sprite vs Default Emoji
      let avatarHtml = '';
      if (member.avatarImage) {
        avatarHtml = `<img src="${member.avatarImage}" alt="${member.name}" class="credit-custom-avatar-img">`;
      } else if (member.spriteClass === 'avatar-francisco') {
        avatarHtml = `
          <div class="avatar-sprite avatar-francisco">
            <div class="sprite-pixel-head"></div>
            <div class="sprite-pixel-glasses"></div>
            <div class="sprite-pixel-smile"></div>
          </div>
        `;
      } else if (member.spriteClass === 'avatar-jano') {
        avatarHtml = `
          <div class="avatar-sprite avatar-jano">
            <div class="sprite-pixel-head-jano"></div>
            <div class="sprite-pixel-beard"></div>
            <div class="sprite-pixel-smile"></div>
          </div>
        `;
      } else {
        avatarHtml = `
          <div class="avatar-sprite avatar-default-sprite">
            <span>${icon}</span>
          </div>
        `;
      }

      // Link button styling
      const btnClass = member.theme === 'cyan' ? 'btn-instagram-cyan' : 'btn-instagram';

      return `
        <article class="credit-card ${themeClass}">
          <div class="credit-header">
            <span class="player-slot">${member.slotBadge || 'PLAYER'}</span>
            <span class="credit-rank">${member.rank || '★ LVL 99'}</span>
          </div>

          <div class="credit-avatar-box">
            <div class="pixel-avatar-frame ${member.theme === 'cyan' ? 'frame-cyan' : ''}">
              ${avatarHtml}
            </div>
            <div class="avatar-crown">${icon}</div>
          </div>

          <div class="credit-body">
            <h3 class="credit-name">${member.name}</h3>
            <span class="credit-role">${member.role}</span>
            <p class="credit-bio">${member.bio}</p>

            ${member.linkUrl ? `
              <a href="${member.linkUrl}" target="_blank" rel="noopener noreferrer" class="pixel-button ${btnClass} btn-sound">
                <span class="ig-icon">📸</span>
                <span>${member.linkText || '@usuario'}</span>
                <span class="ig-arrow">↗</span>
              </a>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  // ========================================================================
  // ROUTING & ADMIN PANEL
  // ========================================================================
  checkAdminRoute() {
    const isPathAdmin = window.location.pathname === '/panel-admin' || window.location.pathname.endsWith('/panel-admin');
    const isHashAdmin = window.location.hash === '#panel-admin' || window.location.hash === '#admin';

    if (isPathAdmin || isHashAdmin) {
      this.openAdminPanel();
    }
  }

  openAdminPanel() {
    sfx.play('click');
    this.adminPanelWrapper.classList.remove('hidden');

    if (this.adminAuthenticated) {
      this.showAdminDashboard();
    } else {
      this.showAdminLogin();
    }
  }

  closeAdminPanel() {
    sfx.play('click');
    this.adminPanelWrapper.classList.add('hidden');
    if (window.location.hash === '#panel-admin') {
      history.pushState(null, "", window.location.pathname);
    }
    if (window.location.pathname === '/panel-admin' || window.location.pathname.endsWith('/panel-admin')) {
      history.pushState(null, "", "/");
    }
  }

  showAdminLogin() {
    this.adminLoginScreen.classList.remove('hidden');
    this.adminDashboardScreen.classList.add('hidden');
    this.loginErrorMsg.classList.add('hidden');
    this.adminUserInput.value = "";
    this.adminPassInput.value = "";
    setTimeout(() => this.adminUserInput.focus(), 100);
  }

  showAdminDashboard() {
    this.adminLoginScreen.classList.add('hidden');
    this.adminDashboardScreen.classList.remove('hidden');
    this.applyTheme(this.currentTheme);
    this.applyCRT(this.crtEnabled);
    this.applyHudVisibility();
    this.applyNavbarVisibility();
    this.renderAdminGamesTable();
    this.renderAdminCreditsTable();
  }

  handleAdminLogin() {
    const user = this.adminUserInput.value.trim();
    const pass = this.adminPassInput.value.trim();

    if (user === "franciscoadmin" && pass === "Manzana9") {
      sfx.play('start');
      this.adminAuthenticated = true;
      sessionStorage.setItem('viralgames_admin_auth', 'true');
      this.showAdminDashboard();
    } else {
      sfx.play('error');
      this.loginErrorMsg.classList.remove('hidden');
    }
  }

  // ========================================================================
  // GAMES ADMIN TABLE & EDITOR
  // ========================================================================
  renderAdminGamesTable() {
    if (!this.adminGamesTableBody) return;
    const visibleCount = this.games.filter(g => !g.hidden).length;
    const hiddenCount = this.games.filter(g => g.hidden).length;
    this.adminTotalCount.innerHTML = `${this.games.length} <span style="color:var(--text-muted); font-size:10px; font-weight:normal;">(${visibleCount} VISIBLES · ${hiddenCount} OCULTOS)</span>`;
    if (this.tabCountGames) this.tabCountGames.textContent = this.games.length;

    this.adminGamesTableBody.innerHTML = this.games.map(g => {
      const isHidden = !!g.hidden;
      return `
      <tr class="${isHidden ? 'table-row-hidden' : ''}">
        <td>
          <img src="${g.image}" alt="${g.title}" class="table-thumb" onerror="this.src='/assets/tio_aceite.jpg'">
        </td>
        <td>
          <strong style="color:var(--accent-gold);">${g.title}</strong>
          ${isHidden ? '<br><span class="pixel-badge badge-warning" style="font-size:8px; margin-top:3px; display:inline-block;">🚫 OCULTO</span>' : ''}
        </td>
        <td><span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${g.description}</span></td>
        <td><span class="pixel-badge">${g.category}</span></td>
        <td><span class="pixel-badge badge-primary">${g.badge || '16-BIT'}</span></td>
        <td>
          <span class="pixel-badge ${isHidden ? 'badge-warning' : 'badge-highlight'}" style="font-size:9px;">
            ${isHidden ? '🚫 OCULTO' : '👁️ VISIBLE'}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button type="button" class="${isHidden ? 'table-btn-show' : 'table-btn-hide'}" data-toggle-vis-id="${g.id}" title="${isHidden ? 'Mostrar en la landing page' : 'Ocultar de la landing page'}">
              ${isHidden ? '👁️ MOSTRAR' : '🚫 OCULTAR'}
            </button>
            <button type="button" class="table-btn-edit" data-edit-id="${g.id}">EDITAR</button>
            <button type="button" class="table-btn-del" data-del-id="${g.id}">ELIMINAR</button>
          </div>
        </td>
      </tr>
      `;
    }).join('');

    this.adminGamesTableBody.querySelectorAll('[data-toggle-vis-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-vis-id');
        this.toggleGameVisibility(id);
      });
    });

    this.adminGamesTableBody.querySelectorAll('.table-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-id');
        const game = this.games.find(g => g.id === id);
        this.openGameEditor(game);
      });
    });

    this.adminGamesTableBody.querySelectorAll('.table-btn-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-id');
        this.deleteGame(id);
      });
    });
  }

  toggleGameVisibility(id) {
    const game = this.games.find(g => g.id === id);
    if (!game) return;

    game.hidden = !game.hidden;
    this.saveGames();
    sfx.play('click');
  }

  updateCategoryDropdown() {
    if (!this.editCategory) return;
    const currentVal = this.editCategory.value;
    const allTags = this.getAllTags().filter(t => t.id !== 'all');

    this.editCategory.innerHTML = `
      <option value="viral">Viral Chileno</option>
      <option value="arcade">Arcade 16-Bit</option>
      <option value="nostalgia">Nostalgia</option>
      <option value="proximamente">Próximamente</option>
      ${allTags
        .filter(t => !['viral', 'arcade', 'nostalgia', 'proximamente'].includes(t.id))
        .map(t => `<option value="${t.id}">${t.label}</option>`)
        .join('')}
      <option value="__custom__">➕ CREAR NUEVO TAG...</option>
    `;
    if (currentVal) {
      this.editCategory.value = currentVal;
    }
  }

  openGameEditor(game) {
    this.updateCategoryDropdown();
    this.gameEditorContainer.classList.remove('hidden');

    if (game) {
      this.editorFormTitle.textContent = `EDITAR: ${game.title}`;
      this.editGameId.value = game.id;
      this.editTitle.value = game.title;
      this.editBadge.value = game.badge || '';

      const categoryVal = (game.category || 'viral').toLowerCase();
      const hasOption = Array.from(this.editCategory.options).some(opt => opt.value === categoryVal);
      if (hasOption) {
        this.editCategory.value = categoryVal;
        if (this.customCategoryWrapper) this.customCategoryWrapper.classList.add('hidden');
        if (this.editCustomCategory) this.editCustomCategory.value = '';
      } else {
        this.editCategory.value = '__custom__';
        if (this.customCategoryWrapper) this.customCategoryWrapper.classList.remove('hidden');
        if (this.editCustomCategory) this.editCustomCategory.value = game.category || '';
      }

      this.editDescription.value = game.description;
      this.editImage.value = game.image;
      this.editImagePreview.src = game.image;
      if (this.editGameUrl) this.editGameUrl.value = game.gameUrl || '';
      if (this.editHidden) this.editHidden.checked = !!game.hidden;
    } else {
      this.editorFormTitle.textContent = "AGREGAR NUEVO MINI JUEGO";
      this.editGameId.value = "";
      this.editTitle.value = "";
      this.editBadge.value = "NUEVO 16-BIT";
      this.editCategory.value = "viral";
      if (this.customCategoryWrapper) this.customCategoryWrapper.classList.add('hidden');
      if (this.editCustomCategory) this.editCustomCategory.value = "";
      this.editDescription.value = "";
      this.editImage.value = "/assets/tio_aceite.jpg";
      this.editImagePreview.src = "/assets/tio_aceite.jpg";
      if (this.editGameUrl) this.editGameUrl.value = "";
      if (this.editHidden) this.editHidden.checked = false;
    }

    this.gameEditorContainer.scrollIntoView({ behavior: 'smooth' });
  }

  handleSaveGame() {
    const id = this.editGameId.value;
    const title = this.editTitle.value.trim();
    const badge = this.editBadge.value.trim() || '16-BIT';
    let category = this.editCategory.value;
    if (category === '__custom__') {
      const customVal = (this.editCustomCategory ? this.editCustomCategory.value.trim() : '');
      if (!customVal) {
        alert("Por favor ingresa el nombre del nuevo tag.");
        return;
      }
      category = customVal.toLowerCase().replace(/\s+/g, '-');
      this.saveCustomTag(category, customVal.toUpperCase());
    }
    const description = this.editDescription.value.trim();
    const image = this.editImage.value.trim() || '/assets/tio_aceite.jpg';
    const gameUrl = this.editGameUrl ? this.editGameUrl.value.trim() : '';
    const hidden = this.editHidden ? this.editHidden.checked : false;

    if (!title || !description) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    if (id) {
      const index = this.games.findIndex(g => g.id === id);
      if (index !== -1) {
        this.games[index] = {
          ...this.games[index],
          title,
          badge,
          category,
          description,
          image,
          gameUrl,
          hidden
        };
      }
    } else {
      const newGame = {
        id: "game-" + Date.now(),
        title,
        badge,
        category,
        description,
        image,
        gameUrl,
        hidden,
        featured: false,
        releaseYear: "1995",
        status: "DISPONIBLE"
      };
      this.games.unshift(newGame);
    }

    this.saveGames();
    sfx.play('start');
    this.gameEditorContainer.classList.add('hidden');
    alert("¡Juego guardado correctamente!");
  }

  deleteGame(id) {
    const game = this.games.find(g => g.id === id);
    if (!game) return;

    if (confirm(`¿Eliminar el juego "${game.title}"?`)) {
      this.games = this.games.filter(g => g.id !== id);
      deleteGameFromDb(id);
      this.saveGames(false);
      sfx.play('click');
    }
  }

  // ========================================================================
  // CREDITS ADMIN TABLE & EDITOR
  // ========================================================================
  renderAdminCreditsTable() {
    if (!this.adminCreditsTableBody) return;
    if (this.adminCreditsCount) this.adminCreditsCount.textContent = this.credits.length;
    if (this.tabCountCredits) this.tabCountCredits.textContent = this.credits.length;

    this.adminCreditsTableBody.innerHTML = this.credits.map(m => {
      let avatarThumb = '';
      if (m.avatarImage) {
        avatarThumb = `<img src="${m.avatarImage}" alt="${m.name}">`;
      } else {
        avatarThumb = `<span>${m.icon || '👑'}</span>`;
      }

      return `
        <tr>
          <td>
            <div class="table-avatar-thumb">
              ${avatarThumb}
            </div>
          </td>
          <td><strong style="color:var(--accent-gold);">${m.name}</strong></td>
          <td><span>${m.role}</span></td>
          <td>
            <span class="pixel-badge badge-primary">${m.slotBadge}</span>
            <small style="display:block;color:var(--text-muted);font-size:10px;margin-top:2px;">${m.rank}</small>
          </td>
          <td>
            <a href="${m.linkUrl}" target="_blank" style="color:var(--accent-blue);font-size:11px;text-decoration:none;">${m.linkText || 'Enlace'}</a>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="table-btn-edit" data-edit-credit-id="${m.id}">EDITAR</button>
              <button type="button" class="table-btn-del" data-del-credit-id="${m.id}">ELIMINAR</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.adminCreditsTableBody.querySelectorAll('.table-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-credit-id');
        const member = this.credits.find(c => c.id === id);
        this.openCreditEditor(member);
      });
    });

    this.adminCreditsTableBody.querySelectorAll('.table-btn-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-credit-id');
        this.deleteCredit(id);
      });
    });
  }

  openCreditEditor(member) {
    this.creditEditorContainer.classList.remove('hidden');

    if (member) {
      this.creditEditorFormTitle.textContent = `EDITAR: ${member.name}`;
      this.editCreditId.value = member.id;
      this.editCreditName.value = member.name;
      this.editCreditRole.value = member.role;
      this.editCreditTheme.value = member.theme || 'purple';
      this.editCreditSlot.value = member.slotBadge || '';
      this.editCreditRank.value = member.rank || '';
      this.editCreditIcon.value = member.icon || '👑';
      this.editCreditBio.value = member.bio;
      this.editCreditLinkText.value = member.linkText || '';
      this.editCreditLinkUrl.value = member.linkUrl || '';
      this.editCreditImageUrl.value = member.avatarImage || '';
      this.editCreditImageFile.value = '';
      this.updateCreditAvatarPreview(member.avatarImage, member.icon);
    } else {
      this.creditEditorFormTitle.textContent = "AGREGAR NUEVO INTEGRANTE A CRÉDITOS";
      this.editCreditId.value = "";
      this.editCreditName.value = "";
      this.editCreditRole.value = "";
      this.editCreditTheme.value = "gold";
      this.editCreditSlot.value = `PLAYER ${this.credits.length + 1} [COLABORADOR]`;
      this.editCreditRank.value = "★ NEW PLAYER";
      this.editCreditIcon.value = "🎮";
      this.editCreditBio.value = "";
      this.editCreditLinkText.value = "@nuevo";
      this.editCreditLinkUrl.value = "https://www.instagram.com/";
      this.editCreditImageUrl.value = "";
      this.editCreditImageFile.value = '';
      this.updateCreditAvatarPreview("", "🎮");
    }

    this.creditEditorContainer.scrollIntoView({ behavior: 'smooth' });
  }

  updateCreditAvatarPreview(imageSrc, icon = null) {
    const currentIcon = icon || this.editCreditIcon.value.trim() || '👑';
    this.creditPreviewCrown.textContent = currentIcon;
    this.creditPreviewEmoji.textContent = currentIcon;

    if (imageSrc) {
      this.creditAvatarPreviewImg.src = imageSrc;
      this.creditAvatarPreviewImg.classList.remove('hidden');
      this.creditAvatarFallbackSprite.classList.add('hidden');
    } else {
      this.creditAvatarPreviewImg.src = "";
      this.creditAvatarPreviewImg.classList.add('hidden');
      this.creditAvatarFallbackSprite.classList.remove('hidden');
    }
  }

  handleSaveCredit() {
    const id = this.editCreditId.value;
    const name = this.editCreditName.value.trim();
    const role = this.editCreditRole.value.trim();
    const theme = this.editCreditTheme.value;
    const slotBadge = this.editCreditSlot.value.trim() || 'PLAYER';
    const rank = this.editCreditRank.value.trim() || '★ LVL 99';
    const icon = this.editCreditIcon.value.trim() || '👑';
    const bio = this.editCreditBio.value.trim();
    const linkText = this.editCreditLinkText.value.trim();
    const linkUrl = this.editCreditLinkUrl.value.trim();
    const avatarImage = this.editCreditImageUrl.value.trim();

    if (!name || !role || !bio) {
      alert("Por favor completa nombre, rol y biografía.");
      return;
    }

    if (id) {
      const idx = this.credits.findIndex(c => c.id === id);
      if (idx !== -1) {
        this.credits[idx] = {
          ...this.credits[idx],
          name,
          role,
          theme,
          slotBadge,
          rank,
          icon,
          bio,
          linkText,
          linkUrl,
          avatarImage
        };
      }
    } else {
      const newMember = {
        id: "credit-" + Date.now(),
        name,
        role,
        theme,
        slotBadge,
        rank,
        icon,
        bio,
        linkText,
        linkUrl,
        avatarImage
      };
      this.credits.push(newMember);
    }

    this.saveCredits();
    sfx.play('start');
    this.creditEditorContainer.classList.add('hidden');
    alert("¡Integrante de créditos guardado con éxito!");
  }

  deleteCredit(id) {
    const member = this.credits.find(c => c.id === id);
    if (!member) return;

    if (confirm(`¿Eliminar a "${member.name}" de la sección de créditos?`)) {
      this.credits = this.credits.filter(c => c.id !== id);
      deleteCreditFromDb(id);
      this.saveCredits(false);
      sfx.play('click');
    }
  }

  // ========================================================================
  // ARCADE CABINET MINI-GAME RUNNER (IFRAME MONOREPO)
  // ========================================================================
  openMiniGameModal(game = null) {
    const targetGame = game || this.games[0];
    const title = targetGame ? targetGame.title : "TÍO ACEITE: LA FRITANGA SUPREMA";
    const modalTitleEl = document.getElementById('gameModalTitle');
    if (modalTitleEl) {
      modalTitleEl.textContent = `🕹️ ARCADE CABINET: ${title}`;
    }

    if (targetGame && targetGame.gameUrl) {
      if (this.gameCabinetIframe) {
        this.gameCabinetIframe.classList.remove('hidden');
        this.gameCabinetIframe.src = targetGame.gameUrl;
      }
      if (this.gameComingSoonNotice) {
        this.gameComingSoonNotice.classList.add('hidden');
      }
    } else {
      if (this.gameCabinetIframe) {
        this.gameCabinetIframe.classList.add('hidden');
        this.gameCabinetIframe.src = 'about:blank';
      }
      if (this.gameComingSoonNotice) {
        this.gameComingSoonNotice.classList.remove('hidden');
      }
      if (this.comingSoonGameName) {
        this.comingSoonGameName.textContent = title;
      }
    }

    this.gamePlayModal.showModal();
  }
}

// ==========================================================================
// 6. APPLICATION INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  window.viralGamesApp = new ViralGamesApp();
});
