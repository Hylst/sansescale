// ====== CONFIGURATION COMPLÈTE : BIOMES, SKINS, HATS, MUSIQUES, MÉTÉO ======

export interface Biome {
  id: string;
  name: string;
  skyGradient: [string, string, string, string];
  sunColor: string;
  sunGlow: string;
  mountainColor: string;
  hillColor: string;
  treeColor: string;
  groundGradient: [string, string, string, string];
  groundBorder: string;
  pipeColors: {
    bodyStops: string[];
    capStops: string[];
    border: string;
  };
  particleColor: string;
  weather: "none" | "rain" | "snow" | "petals" | "ash" | "stars" | "bubbles" | "fireflies" | "leaves" | "sand";
  musicScale: number[]; // fréquences de la gamme musicale du biome
  musicType: "sine" | "triangle" | "square";
  decorType: "trees" | "cactus" | "crystals" | "palm" | "dead" | "mushrooms" | "rocks" | "ice" | "none";
}

export const BIOMES: Biome[] = [
  {
    id: "meadow",
    name: "🌿 Prairie Matinale",
    skyGradient: ["#1a3a5c", "#3a7ca5", "#6cc0e5", "#b8e8f5"],
    sunColor: "#fff176",
    sunGlow: "rgba(255, 241, 118, 0.3)",
    mountainColor: "rgba(40, 70, 100, 0.4)",
    hillColor: "rgba(60, 120, 60, 0.5)",
    treeColor: "rgba(50, 130, 50, 0.85)",
    groundGradient: ["#5a8f2b", "#6ba332", "#4a7c23", "#34511b"],
    groundBorder: "#2d4a15",
    pipeColors: {
      bodyStops: ["#2d5a27", "#4a8f3e", "#6bc95c", "#7dd96a", "#6bc95c", "#4a8f3e", "#2d5a27"],
      capStops: ["#2d5a27", "#6bc95c", "#8fe57d", "#6bc95c", "#8fe57d", "#6bc95c", "#2d5a27"],
      border: "#1a3d15",
    },
    particleColor: "#a8e0f5",
    weather: "petals",
    musicScale: [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25],
    musicType: "sine",
    decorType: "trees",
  },
  {
    id: "sunset",
    name: "🌅 Crépuscule Doré",
    skyGradient: ["#2b1055", "#7b2d8e", "#d45d79", "#f4a261"],
    sunColor: "#ff7043",
    sunGlow: "rgba(255, 112, 67, 0.35)",
    mountainColor: "rgba(80, 30, 60, 0.55)",
    hillColor: "rgba(140, 60, 40, 0.6)",
    treeColor: "rgba(100, 40, 30, 0.85)",
    groundGradient: ["#8b4513", "#a0522d", "#cd853f", "#6e3b1f"],
    groundBorder: "#4a2510",
    pipeColors: {
      bodyStops: ["#5c2818", "#8b4513", "#a0522d", "#cd853f", "#a0522d", "#8b4513", "#5c2818"],
      capStops: ["#5c2818", "#cd853f", "#deb887", "#cd853f", "#deb887", "#cd853f", "#5c2818"],
      border: "#3d1a0f",
    },
    particleColor: "#f4a261",
    weather: "fireflies",
    musicScale: [220.0, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88],
    musicType: "triangle",
    decorType: "trees",
  },
  {
    id: "beach",
    name: "🏖️ Plage Tropicale",
    skyGradient: ["#0d47a1", "#1976d2", "#4fc3f7", "#e1f5fe"],
    sunColor: "#fff59d",
    sunGlow: "rgba(255, 245, 157, 0.4)",
    mountainColor: "rgba(20, 60, 100, 0.3)",
    hillColor: "rgba(194, 178, 128, 0.6)",
    treeColor: "rgba(46, 125, 50, 0.8)",
    groundGradient: ["#f9d71c", "#f4e04d", "#e6c200", "#c9a000"],
    groundBorder: "#8a6d00",
    pipeColors: {
      bodyStops: ["#006064", "#00838f", "#00acc1", "#26c6da", "#00acc1", "#00838f", "#006064"],
      capStops: ["#006064", "#00acc1", "#80deea", "#00acc1", "#80deea", "#00acc1", "#006064"],
      border: "#00363a",
    },
    particleColor: "#b3e5fc",
    weather: "bubbles",
    musicScale: [293.66, 329.63, 370.0, 392.0, 440.0, 493.88, 554.37, 587.33],
    musicType: "sine",
    decorType: "palm",
  },
  {
    id: "forest",
    name: "🌲 Forêt Enchantée",
    skyGradient: ["#0a1f0a", "#1b5e20", "#2e7d32", "#81c784"],
    sunColor: "#a5d6a7",
    sunGlow: "rgba(165, 214, 167, 0.25)",
    mountainColor: "rgba(10, 40, 10, 0.6)",
    hillColor: "rgba(30, 80, 30, 0.7)",
    treeColor: "rgba(20, 100, 20, 0.9)",
    groundGradient: ["#1b5e20", "#2e7d32", "#388e3c", "#0d3310"],
    groundBorder: "#0a290c",
    pipeColors: {
      bodyStops: ["#1b5e20", "#2e7d32", "#43a047", "#66bb6a", "#43a047", "#2e7d32", "#1b5e20"],
      capStops: ["#1b5e20", "#43a047", "#81c784", "#43a047", "#81c784", "#43a047", "#1b5e20"],
      border: "#0d3310",
    },
    particleColor: "#a5d6a7",
    weather: "leaves",
    musicScale: [196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 369.99, 392.0],
    musicType: "triangle",
    decorType: "mushrooms",
  },
  {
    id: "canyon",
    name: "🏜️ Canyon Ardent",
    skyGradient: ["#4a0000", "#8b0000", "#d84315", "#ffab91"],
    sunColor: "#ff5722",
    sunGlow: "rgba(255, 87, 34, 0.45)",
    mountainColor: "rgba(100, 30, 10, 0.7)",
    hillColor: "rgba(160, 82, 45, 0.75)",
    treeColor: "rgba(120, 60, 10, 0.85)",
    groundGradient: ["#8d6e63", "#a1887f", "#6d4c41", "#3e2723"],
    groundBorder: "#5d4037",
    pipeColors: {
      bodyStops: ["#3e2723", "#5d4037", "#8d6e63", "#a1887f", "#8d6e63", "#5d4037", "#3e2723"],
      capStops: ["#3e2723", "#8d6e63", "#d7ccc8", "#8d6e63", "#d7ccc8", "#8d6e63", "#3e2723"],
      border: "#281815",
    },
    particleColor: "#ffab91",
    weather: "sand",
    musicScale: [174.61, 196.0, 220.0, 233.08, 261.63, 293.66, 311.13, 349.23],
    musicType: "square",
    decorType: "rocks",
  },
  {
    id: "cyber",
    name: "🌃 Néon Cyberpunk",
    skyGradient: ["#050510", "#0a0a2e", "#1a1a3e", "#2d1b4e"],
    sunColor: "#00e5ff",
    sunGlow: "rgba(0, 229, 255, 0.4)",
    mountainColor: "rgba(20, 10, 40, 0.7)",
    hillColor: "rgba(40, 20, 70, 0.8)",
    treeColor: "rgba(0, 229, 255, 0.45)",
    groundGradient: ["#1a0033", "#330066", "#4a0080", "#0d0020"],
    groundBorder: "#ff007f",
    pipeColors: {
      bodyStops: ["#1a0033", "#4a0080", "#7900ff", "#00e5ff", "#7900ff", "#4a0080", "#1a0033"],
      capStops: ["#1a0033", "#7900ff", "#ff007f", "#7900ff", "#ff007f", "#7900ff", "#1a0033"],
      border: "#00e5ff",
    },
    particleColor: "#ff007f",
    weather: "stars",
    musicScale: [130.81, 155.56, 174.61, 196.0, 233.08, 261.63, 311.13, 349.23],
    musicType: "square",
    decorType: "crystals",
  },
  {
    id: "volcano",
    name: "🌋 Terres Volcaniques",
    skyGradient: ["#1a0000", "#4a0000", "#8b0000", "#b71c1c"],
    sunColor: "#ff3d00",
    sunGlow: "rgba(255, 61, 0, 0.5)",
    mountainColor: "rgba(30, 10, 10, 0.8)",
    hillColor: "rgba(60, 20, 20, 0.85)",
    treeColor: "rgba(100, 30, 0, 0.9)",
    groundGradient: ["#330000", "#660000", "#990000", "#1a0000"],
    groundBorder: "#ff3d00",
    pipeColors: {
      bodyStops: ["#1a1a1a", "#424242", "#ff3d00", "#ff6d00", "#ff3d00", "#424242", "#1a1a1a"],
      capStops: ["#1a1a1a", "#ff3d00", "#ffcc00", "#ff3d00", "#ffcc00", "#ff3d00", "#1a1a1a"],
      border: "#ff3d00",
    },
    particleColor: "#ff6d00",
    weather: "ash",
    musicScale: [146.83, 164.81, 185.0, 196.0, 220.0, 246.94, 277.18, 293.66],
    musicType: "square",
    decorType: "dead",
  },
  {
    id: "arctic",
    name: "❄️ Royaume Arctique",
    skyGradient: ["#0d1b2a", "#1b263b", "#415a77", "#778da9"],
    sunColor: "#e0f7fa",
    sunGlow: "rgba(224, 247, 250, 0.3)",
    mountainColor: "rgba(200, 220, 240, 0.35)",
    hillColor: "rgba(180, 200, 220, 0.45)",
    treeColor: "rgba(0, 80, 120, 0.7)",
    groundGradient: ["#b0bec5", "#cfd8dc", "#90a4ae", "#546e7a"],
    groundBorder: "#37474f",
    pipeColors: {
      bodyStops: ["#263238", "#37474f", "#607d8b", "#90a4ae", "#607d8b", "#37474f", "#263238"],
      capStops: ["#263238", "#607d8b", "#e0f7fa", "#607d8b", "#e0f7fa", "#607d8b", "#263238"],
      border: "#00bcd4",
    },
    particleColor: "#e0f7fa",
    weather: "snow",
    musicScale: [261.63, 293.66, 311.13, 349.23, 392.0, 440.0, 466.16, 523.25],
    musicType: "sine",
    decorType: "ice",
  },
  {
    id: "night",
    name: "🌙 Nuit Étoilée",
    skyGradient: ["#000011", "#0a0a2e", "#1a1a4e", "#2d2d6e"],
    sunColor: "#f5f5f5",
    sunGlow: "rgba(245, 245, 245, 0.15)",
    mountainColor: "rgba(20, 20, 50, 0.6)",
    hillColor: "rgba(30, 30, 60, 0.5)",
    treeColor: "rgba(40, 40, 80, 0.7)",
    groundGradient: ["#1a1a2e", "#16213e", "#0f3460", "#1a1a2e"],
    groundBorder: "#e94560",
    pipeColors: {
      bodyStops: ["#0f0f23", "#1a1a3e", "#533483", "#e94560", "#533483", "#1a1a3e", "#0f0f23"],
      capStops: ["#0f0f23", "#533483", "#e94560", "#533483", "#e94560", "#533483", "#0f0f23"],
      border: "#e94560",
    },
    particleColor: "#e94560",
    weather: "stars",
    musicScale: [196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0],
    musicType: "sine",
    decorType: "none",
  },
  {
    id: "space",
    name: "🚀 Cosmos Infini",
    skyGradient: ["#000000", "#0a0014", "#1a0033", "#2a0055"],
    sunColor: "#7c4dff",
    sunGlow: "rgba(124, 77, 255, 0.5)",
    mountainColor: "rgba(10, 0, 30, 0.5)",
    hillColor: "rgba(20, 0, 50, 0.4)",
    treeColor: "rgba(50, 0, 100, 0.5)",
    groundGradient: ["#1a0033", "#2a0055", "#4a0080", "#0a0014"],
    groundBorder: "#7c4dff",
    pipeColors: {
      bodyStops: ["#0a0014", "#1a0033", "#4a0080", "#7c4dff", "#4a0080", "#1a0033", "#0a0014"],
      capStops: ["#0a0014", "#4a0080", "#b388ff", "#4a0080", "#b388ff", "#4a0080", "#0a0014"],
      border: "#b388ff",
    },
    particleColor: "#b388ff",
    weather: "stars",
    musicScale: [130.81, 146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63],
    musicType: "triangle",
    decorType: "none",
  },
];

export interface BirdSkin {
  id: string;
  name: string;
  icon: string;
  price: number;
  bodyGradient: [string, string, string];
  wingGradient: [string, string];
  tailColor: string;
  outlineColor: string;
}

export const SKINS: BirdSkin[] = [
  { id: "classic", name: "Piou Classique", icon: "🐦", price: 0, bodyGradient: ["#ffd54f", "#ffca28", "#ffa000"], wingGradient: ["#ff9800", "#e65100"], tailColor: "#e6a800", outlineColor: "#e65100" },
  { id: "ruby", name: "Rubis Flamboyant", icon: "🔴", price: 30, bodyGradient: ["#ff8a80", "#ff5252", "#d50000"], wingGradient: ["#b71c1c", "#7f0000"], tailColor: "#c62828", outlineColor: "#7f0000" },
  { id: "cyber_bird", name: "Néon Cyber", icon: "⚡", price: 60, bodyGradient: ["#18ffff", "#00e5ff", "#00b0ff"], wingGradient: ["#d500f9", "#aa00ff"], tailColor: "#651fff", outlineColor: "#aa00ff" },
  { id: "emerald", name: "Émeraude Royal", icon: "🟢", price: 100, bodyGradient: ["#b9f6ca", "#69f0ae", "#00e676"], wingGradient: ["#00b0ff", "#0091ea"], tailColor: "#00c853", outlineColor: "#004d40" },
  { id: "gold", name: "Pharaon Doré", icon: "👑", price: 200, bodyGradient: ["#fff9c4", "#fff176", "#ffd835"], wingGradient: ["#ffb300", "#ff8f00"], tailColor: "#fbc02d", outlineColor: "#f57f17" },
  { id: "shadow", name: "Ombre Nocturne", icon: "🌑", price: 350, bodyGradient: ["#616161", "#424242", "#212121"], wingGradient: ["#9c27b0", "#7b1fa2"], tailColor: "#424242", outlineColor: "#000000" },
  { id: "rainbow", name: "Arc-en-Ciel", icon: "🌈", price: 500, bodyGradient: ["#ff8a80", "#ffd54f", "#69f0ae"], wingGradient: ["#7c4dff", "#448aff"], tailColor: "#ff4081", outlineColor: "#7c4dff" },
];

export interface Hat {
  id: string;
  name: string;
  icon: string;
  price: number;
}

export const HATS: Hat[] = [
  { id: "none", name: "Aucun", icon: "🚫", price: 0 },
  { id: "cap", name: "Casquette", icon: "🧢", price: 25 },
  { id: "crown", name: "Couronne", icon: "👑", price: 75 },
  { id: "sunglasses", name: "Lunettes", icon: "🕶️", price: 50 },
  { id: "wizard", name: "Magicien", icon: "🧙", price: 120 },
  { id: "pirate", name: "Pirate", icon: "🏴‍☠️", price: 180 },
  { id: "cowboy", name: "Cowboy", icon: "🤠", price: 150 },
];

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  reward: number;
  icon: string;
  check: (stats: { score: number; totalCoins: number; gamesPlayed: number; biomesVisited: number }) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_flight", title: "Premier Envol", desc: "Marquez votre premier point", reward: 10, icon: "🐣", check: (s) => s.score >= 1 },
  { id: "amateur", title: "Pilote Amateur", desc: "Atteignez un score de 15", reward: 20, icon: "🥉", check: (s) => s.score >= 15 },
  { id: "pro", title: "As du Vol", desc: "Atteignez un score de 40", reward: 40, icon: "🥈", check: (s) => s.score >= 40 },
  { id: "master", title: "Légende Vivante", desc: "Atteignez un score de 80", reward: 80, icon: "🥇", check: (s) => s.score >= 80 },
  { id: "god", title: "Dieu du Ciel", desc: "Atteignez un score de 150", reward: 200, icon: "👑", check: (s) => s.score >= 150 },
  { id: "coin_collector", title: "Chercheur d'Or", desc: "Cumulez 50 pièces", reward: 30, icon: "💰", check: (s) => s.totalCoins >= 50 },
  { id: "rich", title: "Banquier", desc: "Cumulez 200 pièces", reward: 60, icon: "💎", check: (s) => s.totalCoins >= 200 },
  { id: "veteran", title: "Persévérant", desc: "Jouez 20 parties", reward: 40, icon: "🎮", check: (s) => s.gamesPlayed >= 20 },
  { id: "explorer", title: "Explorateur", desc: "Découvrez 3 biomes", reward: 50, icon: "🌍", check: (s) => s.biomesVisited >= 3 },
  { id: "world_traveler", title: "Globe-Trotter", desc: "Découvrez tous les biomes", reward: 150, icon: "🚀", check: (s) => s.biomesVisited >= 10 },
];

// ====== SYSTÈME AUDIO PAR BIOME ======
export class SoundController {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicTimeout: number | null = null;
  private currentScale: number[] = BIOMES[0].musicScale;
  private currentType: OscillatorType = BIOMES[0].musicType;
  private noteIndex = 0;
  muted = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  setBiomeMusic(scale: number[], type: OscillatorType) {
    this.currentScale = scale;
    this.currentType = type;
    this.noteIndex = 0;
  }

  playFlap() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(340, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(560, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playPowerup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(n, this.ctx!.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.18, this.ctx!.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.1 + 0.2);
      osc.start(this.ctx!.currentTime + i * 0.1);
      osc.stop(this.ctx!.currentTime + i * 0.1 + 0.22);
    });
  }

  playScore() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.07);
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.28);
  }

  playMilestone() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.type = "square";
      osc.frequency.value = f;
      const t = this.ctx!.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.27);
    });
  }

  playCrash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    noise.start(this.ctx.currentTime);
  }

  startMusic() {
    if (this.isMusicPlaying) return;
    this.init();
    if (!this.ctx) return;
    this.isMusicPlaying = true;
    this.musicGain = this.ctx.createGain();
    this.musicGain.connect(this.ctx.destination);
    this.musicGain.gain.value = 0.045;

    const bassLine = [65.41, 65.41, 82.41, 82.41, 98.0, 98.0, 73.42, 73.42];
    let beat = 0;

    const playNote = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
      if (!this.muted) {
        const note = this.currentScale[this.noteIndex % this.currentScale.length];
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = this.currentType;
        osc.frequency.value = note;
        osc.connect(g);
        g.connect(this.musicGain);
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.05);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.45);

        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.value = bassLine[beat % bassLine.length];
        osc2.connect(g2);
        g2.connect(this.musicGain);
        g2.gain.setValueAtTime(0, this.ctx.currentTime);
        g2.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.08);
        g2.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        osc2.start(this.ctx.currentTime);
        osc2.stop(this.ctx.currentTime + 0.55);
      }
      this.noteIndex++;
      beat++;
      this.musicTimeout = window.setTimeout(playNote, 520);
    };
    playNote();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimeout) clearTimeout(this.musicTimeout);
    if (this.musicGain) {
      this.musicGain.disconnect();
      this.musicGain = null;
    }
  }
}

export const audioController = new SoundController();
