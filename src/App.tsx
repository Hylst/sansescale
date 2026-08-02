import { useRef, useEffect, useCallback, useState } from "react";
import {
  BIOMES, SKINS, HATS, ACHIEVEMENTS, audioController, Biome, BirdSkin,
} from "./gameConfig";

// ====== PARAMÈTRES DE BASE ======
const BIRD_SIZE = 24;
const GROUND_HEIGHT = 88;
const PIPE_WIDTH = 68;
const BIRD_X_RATIO = 0.3;

// Difficulté ultra-progressive : tout augmente doucement
function getDifficulty(score: number) {
  // Gravité : 0.14 au départ → 0.38 au max (courbe logarithmique)
  const gravity = 0.14 + Math.log10(1 + score * 0.15) * 0.18;
  // Vitesse : 1.7 au départ → 3.0 au max
  const pipeSpeed = 1.7 + Math.log10(1 + score * 0.12) * 0.9;
  // Gap vertical : 230 au départ → 118 au max (très doux)
  const pipeGap = Math.max(230 - score * 1.1, 118);
  // Intervalle horizontal : 2100ms au départ → 880ms au max
  const pipeInterval = Math.max(2100 - score * 13, 880);
  // Variation verticale entre tuyaux : limitée au début
  const maxStep = Math.min(50 + score * 2.5, 300);

  return { gravity, pipeSpeed, pipeGap, pipeInterval, maxStep };
}

type GameMode = "progressive" | "zen" | "hardcore";

interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  gap: number;
  scored: boolean;
}

interface Pickup {
  id: number;
  x: number;
  y: number;
  type: "coin" | "shield" | "slowmo";
  collected: boolean;
  sinOffset: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface PopupMessage {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
  life: number;
}

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

// Décor pré-généré
function makeScenery(seed: number, count: number, minH: number, maxH: number) {
  const arr: { x: number; h: number; w: number }[] = [];
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < count; i++) {
    arr.push({ x: i * 200 + rnd() * 100, h: minH + rnd() * (maxH - minH), w: 130 + rnd() * 150 });
  }
  return arr;
}

const MOUNTAINS = makeScenery(42, 40, 80, 220);
const HILLS = makeScenery(77, 50, 40, 120);
const TREES = makeScenery(123, 70, 20, 60);

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // === Stats / Progression ===
  const [coins, setCoins] = useState(() => parseInt(localStorage.getItem("sansescale-coins") || "0", 10));
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("sansescale-highscore") || "0", 10));
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const s = localStorage.getItem("sansescale-skins");
    return s ? JSON.parse(s) : ["classic"];
  });
  const [unlockedHats, setUnlockedHats] = useState<string[]>(() => {
    const s = localStorage.getItem("sansescale-hats");
    return s ? JSON.parse(s) : ["none"];
  });
  const [selectedSkin, setSelectedSkin] = useState(() => localStorage.getItem("sansescale-equipped-skin") || "classic");
  const [selectedHat, setSelectedHat] = useState(() => localStorage.getItem("sansescale-equipped-hat") || "none");
  const [gamesPlayed, setGamesPlayed] = useState(() => parseInt(localStorage.getItem("sansescale-games-played") || "0", 10));
  const [biomesVisited, setBiomesVisited] = useState<string[]>(() => {
    const s = localStorage.getItem("sansescale-biomes-visited");
    return s ? JSON.parse(s) : ["meadow"];
  });
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>(() => {
    const s = localStorage.getItem("sansescale-achievements");
    return s ? JSON.parse(s) : [];
  });

  // === UI State ===
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [gameMode, setGameMode] = useState<GameMode>("progressive");
  const [activeModal, setActiveModal] = useState<"none" | "shop" | "achievements" | "info">("none");
  const [score, setScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasShield, setHasShield] = useState(false);
  const [slowmoLeft, setSlowmoLeft] = useState(0);

  // === Game Refs ===
  const birdY = useRef(0);
  const birdVelocity = useRef(0);
  const birdRotation = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const pickups = useRef<Pickup[]>([]);
  const scoreRef = useRef(0);
  const gameStateRef = useRef<"menu" | "playing" | "gameover">("menu");
  const animFrame = useRef(0);
  const lastPipeSpawn = useRef(0);
  const lastFrameTime = useRef(0);
  const cw = useRef(420);
  const ch = useRef(650);
  const particles = useRef<Particle[]>([]);
  const popups = useRef<PopupMessage[]>([]);
  const weatherParticles = useRef<WeatherParticle[]>([]);
  const nextId = useRef(1);

  // Parallax
  const scrollFar = useRef(0);
  const scrollMid = useRef(0);
  const scrollNear = useRef(0);
  const scrollGround = useRef(0);
  const birdFrame = useRef(0);
  const flashOpacity = useRef(0);
  const shakeAmount = useRef(0);
  const graceUntil = useRef(0);
  const lastTopHeight = useRef<number | null>(null);

  // Biome transition
  const [currentBiome, setCurrentBiome] = useState<Biome>(BIOMES[0]);
  const currentBiomeRef = useRef<Biome>(BIOMES[0]);
  const biomeTransitionAlpha = useRef(0); // 0 = stable, >0 = transition flash

  useEffect(() => { currentBiomeRef.current = currentBiome; }, [currentBiome]);
  useEffect(() => { localStorage.setItem("sansescale-coins", String(coins)); }, [coins]);
  useEffect(() => { localStorage.setItem("sansescale-skins", JSON.stringify(unlockedSkins)); }, [unlockedSkins]);
  useEffect(() => { localStorage.setItem("sansescale-hats", JSON.stringify(unlockedHats)); }, [unlockedHats]);
  useEffect(() => { localStorage.setItem("sansescale-equipped-skin", selectedSkin); }, [selectedSkin]);
  useEffect(() => { localStorage.setItem("sansescale-equipped-hat", selectedHat); }, [selectedHat]);
  useEffect(() => { localStorage.setItem("sansescale-games-played", String(gamesPlayed)); }, [gamesPlayed]);
  useEffect(() => { localStorage.setItem("sansescale-biomes-visited", JSON.stringify(biomesVisited)); }, [biomesVisited]);
  useEffect(() => { localStorage.setItem("sansescale-achievements", JSON.stringify(claimedAchievements)); }, [claimedAchievements]);

  const addCoins = useCallback((amount: number) => { setCoins((c) => c + amount); }, []);

  const addPopup = (text: string, color: string, x: number, y: number) => {
    popups.current.push({ id: nextId.current++, text, color, x, y, life: 1.4 });
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color,
        size: 2 + Math.random() * 5,
      });
    }
  };

  // Verse la recompense d'un succes une seule fois, des que sa condition passe au vert
  useEffect(() => {
    const stats = { score: highScore, totalCoins: coins, gamesPlayed, biomesVisited: biomesVisited.length };
    const newlyDone = ACHIEVEMENTS.filter((a) => !claimedAchievements.includes(a.id) && a.check(stats));
    if (newlyDone.length === 0) return;
    setClaimedAchievements((prev) => [...prev, ...newlyDone.map((a) => a.id)]);
    addCoins(newlyDone.reduce((sum, a) => sum + a.reward, 0));
    audioController.playPowerup();
    newlyDone.forEach((a) => addPopup(`🏆 ${a.title} +${a.reward}`, "#FFD700", cw.current / 2, 200));
  }, [highScore, coins, gamesPlayed, biomesVisited, claimedAchievements, addCoins]);

  const resetGame = useCallback(() => {
    birdY.current = ch.current / 2 - 40;
    birdVelocity.current = 0;
    birdRotation.current = 0;
    pipes.current = [];
    pickups.current = [];
    scoreRef.current = 0;
    lastPipeSpawn.current = 0;
    lastTopHeight.current = null;
    particles.current = [];
    popups.current = [];
    weatherParticles.current = [];
    flashOpacity.current = 0;
    shakeAmount.current = 0;
    biomeTransitionAlpha.current = 0;
    setScore(0);
    setHasShield(false);
    setSlowmoLeft(0);
    setCurrentBiome(BIOMES[0]);
    audioController.setBiomeMusic(BIOMES[0].musicScale, BIOMES[0].musicType);
  }, []);

  const endGame = useCallback(() => {
    gameStateRef.current = "gameover";
    setGameState("gameover");
    audioController.playCrash();
    audioController.stopMusic();
    flashOpacity.current = 0.6;
    shakeAmount.current = 18;
    createParticles(cw.current * BIRD_X_RATIO, birdY.current, "#ff5722", 30);
    createParticles(cw.current * BIRD_X_RATIO, birdY.current, "#ffd54f", 20);
    const finalScore = scoreRef.current;
    setHighScore((prev) => {
      if (finalScore > prev) { localStorage.setItem("sansescale-highscore", String(finalScore)); return finalScore; }
      return prev;
    });
    setGamesPlayed((p) => p + 1);
  }, []);

  // ====== MÉTÉO ======
  const updateWeather = (canvasW: number, canvasH: number, biome: Biome, dt: number) => {
    const type = biome.weather;
    if (type === "none") { weatherParticles.current = []; return; }

    const spawnRate = type === "rain" ? 3 : type === "snow" ? 1.5 : type === "ash" ? 0.8 : type === "stars" ? 0.3 : type === "bubbles" ? 1 : type === "fireflies" ? 0.6 : type === "leaves" ? 1.2 : type === "sand" ? 2 : type === "petals" ? 1.5 : 0;
    for (let i = 0; i < spawnRate * dt; i++) {
      let wp: WeatherParticle;
      if (type === "rain") {
        wp = { x: Math.random() * canvasW, y: -10, vx: -1 + Math.random() * 0.5, vy: 6 + Math.random() * 4, size: 1.5 + Math.random(), opacity: 0.4 + Math.random() * 0.3 };
      } else if (type === "snow") {
        wp = { x: Math.random() * canvasW, y: -10, vx: (Math.random() - 0.5) * 1.5, vy: 1 + Math.random() * 1.5, size: 2 + Math.random() * 2.5, opacity: 0.6 + Math.random() * 0.3 };
      } else if (type === "ash") {
        wp = { x: Math.random() * canvasW, y: -10, vx: (Math.random() - 0.5) * 0.8, vy: 0.8 + Math.random(), size: 2 + Math.random() * 2, opacity: 0.5 + Math.random() * 0.3 };
      } else if (type === "stars") {
        wp = { x: Math.random() * canvasW, y: Math.random() * (canvasH * 0.6), vx: 0, vy: 0, size: 1 + Math.random() * 2, opacity: Math.random() * 0.8 };
      } else if (type === "bubbles") {
        wp = { x: Math.random() * canvasW, y: canvasH + 10, vx: (Math.random() - 0.5) * 0.5, vy: -(1 + Math.random() * 1.5), size: 3 + Math.random() * 4, opacity: 0.3 + Math.random() * 0.3 };
      } else if (type === "fireflies") {
        wp = { x: Math.random() * canvasW, y: canvasH - GROUND_HEIGHT - Math.random() * 200, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.4, size: 2 + Math.random() * 2, opacity: 0.6 + Math.random() * 0.4 };
      } else if (type === "leaves") {
        wp = { x: Math.random() * canvasW, y: -10, vx: 1 + Math.random() * 2, vy: 1.5 + Math.random() * 2, size: 3 + Math.random() * 3, opacity: 0.5 + Math.random() * 0.3 };
      } else if (type === "sand") {
        wp = { x: Math.random() * canvasW, y: Math.random() * canvasH, vx: 3 + Math.random() * 3, vy: (Math.random() - 0.5) * 0.5, size: 1 + Math.random() * 2, opacity: 0.3 + Math.random() * 0.3 };
      } else {
        wp = { x: Math.random() * canvasW, y: -10, vx: 0.5 + Math.random(), vy: 1 + Math.random() * 1.5, size: 3 + Math.random() * 3, opacity: 0.4 + Math.random() * 0.3 };
      }
      weatherParticles.current.push(wp);
    }

    for (let i = weatherParticles.current.length - 1; i >= 0; i--) {
      const p = weatherParticles.current[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (type === "fireflies") p.opacity = 0.3 + Math.abs(Math.sin(Date.now() / 300 + i)) * 0.7;
      if (p.y > canvasH + 20 || p.y < -30 || p.x > canvasW + 50 || p.x < -50) {
        weatherParticles.current.splice(i, 1);
      }
    }
  };

  const drawWeather = (ctx: CanvasRenderingContext2D, biome: Biome) => {
    const type = biome.weather;
    for (const p of weatherParticles.current) {
      ctx.globalAlpha = p.opacity;
      if (type === "rain") {
        ctx.strokeStyle = "#a8d8ea"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2); ctx.stroke();
      } else if (type === "snow") {
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (type === "ash") {
        ctx.fillStyle = "#ff7043"; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (type === "stars") {
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + Math.sin(Date.now() / 200 + p.x) * 0.5), 0, Math.PI * 2); ctx.fill();
      } else if (type === "bubbles") {
        ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fill();
      } else if (type === "fireflies") {
        ctx.fillStyle = "#ffeb3b"; ctx.shadowColor = "#ffeb3b"; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      } else if (type === "leaves") {
        ctx.fillStyle = "#81c784"; ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, p.x * 0.1, 0, Math.PI * 2); ctx.fill();
      } else if (type === "sand") {
        ctx.fillStyle = "#d7ccc8"; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (type === "petals") {
        ctx.fillStyle = "#f8bbd0"; ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.y * 0.05, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  // ====== GAME LOOP ======
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rawDt = lastFrameTime.current ? timestamp - lastFrameTime.current : 16.67;
    lastFrameTime.current = timestamp;
    const dt = Math.min(rawDt / 16.67, 3);

    const w = cw.current;
    const h = ch.current;
    const birdX = w * BIRD_X_RATIO;
    const diff = getDifficulty(scoreRef.current);
    const biome = currentBiomeRef.current;

    setSlowmoLeft((prev) => Math.max(0, prev - (dt * 16.67) / 1000));
    const slowmoMult = slowmoLeft > 0 ? 0.6 : 1;

    // === UPDATE ===
    if (gameStateRef.current === "playing") {
      // Hardcore tient sa promesse de "vitesse extreme" : tuyaux et decor defilent 40% plus vite
      const effectivePipeSpeed = gameMode === "hardcore" ? diff.pipeSpeed * 1.4 : diff.pipeSpeed;
      scrollFar.current += effectivePipeSpeed * 0.12 * dt * slowmoMult;
      scrollMid.current += effectivePipeSpeed * 0.3 * dt * slowmoMult;
      scrollNear.current += effectivePipeSpeed * 0.55 * dt * slowmoMult;
      scrollGround.current += effectivePipeSpeed * dt * slowmoMult;

      // Gravité progressive
      const effectiveGravity = gameMode === "zen" ? diff.gravity * 0.7 : diff.gravity;
      birdVelocity.current = Math.min(birdVelocity.current + effectiveGravity * dt, 8.5);
      birdY.current += birdVelocity.current * dt;

      const targetRotation = Math.min(Math.max(birdVelocity.current * 4.5, -28), 78);
      birdRotation.current += (targetRotation - birdRotation.current) * 0.12 * dt;

      // Biome transition tous les 12 points en mode progressif
      if (gameMode === "progressive") {
        const targetIdx = Math.min(Math.floor(scoreRef.current / 12), BIOMES.length - 1);
        if (BIOMES[targetIdx].id !== biome.id) {
          const nextBiome = BIOMES[targetIdx];
          setCurrentBiome(nextBiome);
          audioController.setBiomeMusic(nextBiome.musicScale, nextBiome.musicType);
          biomeTransitionAlpha.current = 0.8;
          addPopup(`✨ ${nextBiome.name}`, "#FFD700", w / 2, 130);
          audioController.playPowerup();
          setBiomesVisited((list) => list.includes(nextBiome.id) ? list : [...list, nextBiome.id]);
        }
      }

      // Spawn pipes
      if (timestamp - lastPipeSpawn.current > diff.pipeInterval * (slowmoLeft > 0 ? 1.3 : 1)) {
        lastPipeSpawn.current = timestamp;
        const minTop = 55;
        const maxTop = h - GROUND_HEIGHT - diff.pipeGap - 55;
        let topHeight: number;
        if (lastTopHeight.current === null) {
          topHeight = (minTop + maxTop) / 2 + (Math.random() - 0.5) * 40;
        } else {
          const lo = Math.max(minTop, lastTopHeight.current - diff.maxStep);
          const hi = Math.min(maxTop, lastTopHeight.current + diff.maxStep);
          topHeight = lo + Math.random() * (hi - lo);
        }
        topHeight = Math.max(minTop, Math.min(maxTop, topHeight));
        lastTopHeight.current = topHeight;
        pipes.current.push({ id: nextId.current++, x: w, topHeight, gap: diff.pipeGap, scored: false });

        // Spawn pickups
        const rand = Math.random();
        if (rand < 0.6) {
          let pType: "coin" | "shield" | "slowmo" = "coin";
          if (rand < 0.1 && !hasShield && gameMode !== "zen") pType = "shield";
          else if (rand < 0.2 && slowmoLeft <= 0 && gameMode !== "zen") pType = "slowmo";
          pickups.current.push({
            id: nextId.current++, x: w + PIPE_WIDTH / 2,
            y: topHeight + diff.pipeGap / 2,
            type: pType, collected: false, sinOffset: Math.random() * Math.PI * 2,
          });
        }
      }

      // Move pipes
      for (const pipe of pipes.current) pipe.x -= effectivePipeSpeed * dt * slowmoMult;
      pipes.current = pipes.current.filter((p) => p.x > -PIPE_WIDTH - 20);

      // Move pickups
      for (const p of pickups.current) {
        p.x -= effectivePipeSpeed * dt * slowmoMult;
        p.y += Math.sin(timestamp / 180 + p.sinOffset) * 1.3 * dt;
        if (!p.collected && Math.hypot(p.x - birdX, p.y - birdY.current) < BIRD_SIZE + 14) {
          p.collected = true;
          createParticles(p.x, p.y, p.type === "coin" ? "#FFD700" : "#00e5ff", 12);
          if (p.type === "coin") { addCoins(1); audioController.playCoin(); addPopup("+1 🪙", "#FFD700", p.x, p.y - 20); }
          else if (p.type === "shield") { setHasShield(true); audioController.playPowerup(); addPopup("🛡️ Bouclier !", "#69f0ae", p.x, p.y - 20); }
          else if (p.type === "slowmo") { setSlowmoLeft(8); audioController.playPowerup(); addPopup("⏱️ Ralenti x8s", "#00b0ff", p.x, p.y - 20); }
        }
      }
      pickups.current = pickups.current.filter((p) => p.x > -40 && !p.collected);

      // Score
      for (const pipe of pipes.current) {
        if (!pipe.scored && pipe.x + PIPE_WIDTH < birdX - BIRD_SIZE / 2) {
          pipe.scored = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
          if (scoreRef.current % 10 === 0) {
            audioController.playMilestone();
            addPopup(`⭐ Palier ${scoreRef.current} !`, "#FFD700", w / 2, 170);
            createParticles(birdX, birdY.current, "#FFD700", 22);
          } else {
            audioController.playScore();
          }
        }
      }

      // Collisions
      const bHalf = BIRD_SIZE / 2 - 4;
      if (birdY.current + bHalf > h - GROUND_HEIGHT) {
        birdY.current = h - GROUND_HEIGHT - bHalf;
        if (gameMode !== "zen") {
          if (hasShield) { setHasShield(false); birdVelocity.current = -6; audioController.playCrash(); addPopup("🛡️ Bouclier Brisé !", "#ff5252", birdX, birdY.current); }
          else endGame();
        } else { birdVelocity.current = -5; }
      }
      if (birdY.current - bHalf < 0) { birdY.current = bHalf; birdVelocity.current = 0.5; }

      if (gameMode !== "zen" && timestamp > graceUntil.current && gameStateRef.current === "playing") {
        for (const pipe of pipes.current) {
          if (birdX + bHalf > pipe.x + 4 && birdX - bHalf < pipe.x + PIPE_WIDTH - 4) {
            if (birdY.current - bHalf < pipe.topHeight - 2 || birdY.current + bHalf > pipe.topHeight + pipe.gap + 2) {
              if (hasShield) { setHasShield(false); pipe.scored = true; birdVelocity.current = -5; audioController.playCrash(); addPopup("🛡️ Bouclier Brisé !", "#ff5252", birdX, birdY.current); }
              else { endGame(); }
              break;
            }
          }
        }
      }
    } else if (gameStateRef.current === "menu") {
      birdY.current = h / 2 - 30 + Math.sin(timestamp / 380) * 10;
      scrollFar.current += 0.08 * dt;
      scrollMid.current += 0.2 * dt;
      scrollNear.current += 0.35 * dt;
      scrollGround.current += 0.55 * dt;
    }

    // Particles & popups
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.18 * dt; p.life -= 0.02 * dt;
      if (p.life <= 0) particles.current.splice(i, 1);
    }
    for (let i = popups.current.length - 1; i >= 0; i--) {
      popups.current[i].y -= 1 * dt;
      popups.current[i].life -= 0.012 * dt;
      if (popups.current[i].life <= 0) popups.current.splice(i, 1);
    }
    if (flashOpacity.current > 0) flashOpacity.current -= 0.035 * dt;
    if (biomeTransitionAlpha.current > 0) biomeTransitionAlpha.current -= 0.015 * dt;
    if (shakeAmount.current > 0) shakeAmount.current = Math.max(0, shakeAmount.current - 0.7 * dt);

    // Météo
    updateWeather(w, h, biome, dt);

    // === RENDER ===
    ctx.save();
    if (shakeAmount.current > 0.3) {
      ctx.translate((Math.random() - 0.5) * shakeAmount.current, (Math.random() - 0.5) * shakeAmount.current);
    }
    ctx.clearRect(-20, -20, w + 40, h + 40);

    // Ciel
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h - GROUND_HEIGHT);
    skyGrad.addColorStop(0, biome.skyGradient[0]);
    skyGrad.addColorStop(0.35, biome.skyGradient[1]);
    skyGrad.addColorStop(0.7, biome.skyGradient[2]);
    skyGrad.addColorStop(1, biome.skyGradient[3]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-20, -20, w + 40, h - GROUND_HEIGHT + 20);

    // Soleil / Lune
    const sunX = w * 0.82;
    const sunGrad = ctx.createRadialGradient(sunX, 75, 0, sunX, 75, 55);
    sunGrad.addColorStop(0, biome.sunColor);
    sunGrad.addColorStop(0.4, biome.sunColor);
    sunGrad.addColorStop(1, biome.sunGlow);
    ctx.fillStyle = sunGrad;
    ctx.beginPath(); ctx.arc(sunX, 75, 55, 0, Math.PI * 2); ctx.fill();

    // Nuages
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    const cloudCycle = w + 200;
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 250 - scrollFar.current * 1.8) % cloudCycle + cloudCycle) % cloudCycle - 100;
      drawCloud(ctx, cx, 40 + (i % 3) * 50, 32 + (i % 2) * 18);
    }

    // Couche 1 : Montagnes
    const mCycle = MOUNTAINS.length * 200;
    ctx.fillStyle = biome.mountainColor;
    for (const m of MOUNTAINS) {
      const mx = ((m.x - scrollFar.current) % mCycle + mCycle) % mCycle - 200;
      if (mx > w + 200) continue;
      ctx.beginPath();
      ctx.moveTo(mx - m.w / 2, h - GROUND_HEIGHT);
      ctx.lineTo(mx, h - GROUND_HEIGHT - m.h);
      ctx.lineTo(mx + m.w / 2, h - GROUND_HEIGHT);
      ctx.closePath(); ctx.fill();
      if (biome.id === "meadow" || biome.id === "arctic") {
        ctx.fillStyle = biome.id === "arctic" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.moveTo(mx - m.w * 0.1, h - GROUND_HEIGHT - m.h + m.h * 0.2);
        ctx.lineTo(mx, h - GROUND_HEIGHT - m.h);
        ctx.lineTo(mx + m.w * 0.1, h - GROUND_HEIGHT - m.h + m.h * 0.2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = biome.mountainColor;
      }
    }

    // Couche 2 : Collines
    const hCycle = HILLS.length * 200;
    ctx.fillStyle = biome.hillColor;
    for (const hill of HILLS) {
      const hx = ((hill.x - scrollMid.current) % hCycle + hCycle) % hCycle - 200;
      if (hx > w + 200) continue;
      ctx.beginPath();
      ctx.ellipse(hx, h - GROUND_HEIGHT + hill.h * 0.35, hill.w * 0.65, hill.h, 0, Math.PI, 0);
      ctx.fill();
    }

    // Couche 3 : Décor proche (arbres, cactus, cristaux...)
    const tCycle = TREES.length * 200;
    for (const t of TREES) {
      const tx = ((t.x - scrollNear.current) % tCycle + tCycle) % tCycle - 200;
      if (tx > w + 100) continue;
      drawDecor(ctx, tx, h - GROUND_HEIGHT, t.h, biome);
    }

    // Brume
    const hazeGrad = ctx.createLinearGradient(0, h - GROUND_HEIGHT - 50, 0, h - GROUND_HEIGHT);
    hazeGrad.addColorStop(0, "rgba(0,0,0,0)");
    hazeGrad.addColorStop(1, biome.skyGradient[3] + "60");
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, h - GROUND_HEIGHT - 50, w, 50);

    // Tuyaux
    for (const pipe of pipes.current) {
      drawPipe(ctx, pipe.x, 0, pipe.topHeight, false, biome);
      drawPipe(ctx, pipe.x, pipe.topHeight + pipe.gap, h - GROUND_HEIGHT - pipe.topHeight - pipe.gap, true, biome);
    }

    // Pickups
    for (const p of pickups.current) {
      ctx.save(); ctx.translate(p.x, p.y);
      if (p.type === "coin") {
        ctx.fillStyle = "#FFD700"; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#FFF8E1"; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#F57F17"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("$", 0, 0);
      } else if (p.type === "shield") {
        ctx.fillStyle = "#69f0ae"; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#004d40"; ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🛡️", 0, 0);
      } else if (p.type === "slowmo") {
        ctx.fillStyle = "#00b0ff"; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#001b40"; ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("⏱️", 0, 0);
      }
      ctx.restore();
    }

    // Sol
    const groundGrad = ctx.createLinearGradient(0, h - GROUND_HEIGHT, 0, h);
    groundGrad.addColorStop(0, biome.groundGradient[0]);
    groundGrad.addColorStop(0.15, biome.groundGradient[1]);
    groundGrad.addColorStop(0.5, biome.groundGradient[2]);
    groundGrad.addColorStop(1, biome.groundGradient[3]);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(-20, h - GROUND_HEIGHT, w + 40, GROUND_HEIGHT + 20);
    ctx.strokeStyle = biome.groundBorder;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-20, h - GROUND_HEIGHT); ctx.lineTo(w + 20, h - GROUND_HEIGHT); ctx.stroke();

    // Herbe / détails sol
    ctx.strokeStyle = biome.groundGradient[1];
    ctx.lineWidth = 2;
    const gOff = scrollGround.current % 16;
    for (let gx = -16; gx < w + 16; gx += 16) {
      const sway = Math.sin(timestamp / 220 + gx) * 3;
      ctx.beginPath();
      ctx.moveTo(gx - gOff, h - GROUND_HEIGHT);
      ctx.quadraticCurveTo(gx - gOff + sway, h - GROUND_HEIGHT - 8, gx - gOff + sway * 1.5, h - GROUND_HEIGHT - 13);
      ctx.stroke();
    }

    // Particules
    for (const p of particles.current) {
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Popups
    for (const msg of popups.current) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, msg.life));
      ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
      ctx.fillStyle = msg.color; ctx.strokeStyle = "#000"; ctx.lineWidth = 3;
      ctx.font = "bold 20px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.strokeText(msg.text, msg.x, msg.y); ctx.fillText(msg.text, msg.x, msg.y);
      ctx.restore();
    }

    // Météo
    drawWeather(ctx, biome);

    // === OISEAU ===
    birdFrame.current += (gameStateRef.current === "playing" ? 0.24 : 0.1) * dt;
    const wingOffset = Math.sin(birdFrame.current) * 4.5;

    const shadowY = h - GROUND_HEIGHT + 10;
    const dist = Math.max(0, Math.min(1, (shadowY - birdY.current) / 450));
    ctx.fillStyle = `rgba(0,0,0,${0.22 * (1 - dist * 0.7)})`;
    ctx.beginPath();
    ctx.ellipse(birdX, shadowY, BIRD_SIZE * 0.6 * (1 - dist * 0.4), BIRD_SIZE * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(birdX, birdY.current);
    ctx.rotate((birdRotation.current * Math.PI) / 180);
    const skinObj = SKINS.find((s) => s.id === selectedSkin) || SKINS[0];
    drawBird(ctx, 0, 0, BIRD_SIZE, wingOffset, skinObj, selectedHat);
    if (hasShield) {
      ctx.strokeStyle = "rgba(105, 240, 174, 0.8)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, BIRD_SIZE + 7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(105, 240, 174, 0.15)"; ctx.fill();
    }
    ctx.restore();

    // Score en jeu
    if (gameStateRef.current === "playing") {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
      ctx.fillStyle = "white"; ctx.strokeStyle = "#10101b"; ctx.lineWidth = 6;
      ctx.font = "bold 56px 'Segoe UI', system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const txt = String(scoreRef.current);
      ctx.strokeText(txt, w / 2, 62); ctx.fillText(txt, w / 2, 62);
      if (slowmoLeft > 0) {
        ctx.font = "bold 15px sans-serif"; ctx.lineWidth = 4;
        const slowTxt = `⏱️ Ralenti: ${slowmoLeft.toFixed(1)}s`;
        ctx.strokeText(slowTxt, w / 2, 108); ctx.fillStyle = "#00e5ff"; ctx.fillText(slowTxt, w / 2, 108);
      }
      ctx.restore();
    }

    // Flash transition biome
    if (biomeTransitionAlpha.current > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${biomeTransitionAlpha.current})`;
      ctx.fillRect(-20, -20, w + 40, h + 40);
    }
    if (flashOpacity.current > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity.current})`;
      ctx.fillRect(-20, -20, w + 40, h + 40);
    }

    ctx.restore();
    animFrame.current = requestAnimationFrame(gameLoop);
  }, [gameMode, selectedSkin, selectedHat, hasShield, slowmoLeft, addCoins, endGame]);

  // ====== DESSINS ======
  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y, size * 0.45, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y + size * 0.1, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawDecor = (ctx: CanvasRenderingContext2D, x: number, groundY: number, h: number, biome: Biome) => {
    const type = biome.decorType;
    if (type === "none") return;
    if (type === "trees") {
      ctx.fillStyle = "rgba(80, 55, 35, 0.85)";
      ctx.fillRect(x - 4, groundY - h * 0.45, 8, h * 0.45);
      ctx.fillStyle = biome.treeColor;
      ctx.beginPath(); ctx.arc(x, groundY - h * 0.55, h * 0.45, 0, Math.PI * 2);
      ctx.arc(x - h * 0.3, groundY - h * 0.4, h * 0.32, 0, Math.PI * 2);
      ctx.arc(x + h * 0.3, groundY - h * 0.4, h * 0.32, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === "cactus") {
      ctx.fillStyle = "#2e7d32";
      ctx.fillRect(x - 4, groundY - h * 0.7, 8, h * 0.7);
      ctx.fillRect(x - 12, groundY - h * 0.45, 8, h * 0.2);
      ctx.fillRect(x + 4, groundY - h * 0.55, 8, h * 0.2);
    } else if (type === "crystals") {
      ctx.fillStyle = "rgba(0, 229, 255, 0.6)";
      ctx.beginPath(); ctx.moveTo(x, groundY - h * 0.9); ctx.lineTo(x - 6, groundY); ctx.lineTo(x + 6, groundY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255, 0, 127, 0.5)";
      ctx.beginPath(); ctx.moveTo(x - 12, groundY - h * 0.5); ctx.lineTo(x - 18, groundY); ctx.lineTo(x - 6, groundY); ctx.closePath(); ctx.fill();
    } else if (type === "palm") {
      ctx.fillStyle = "#5d4037"; ctx.fillRect(x - 3, groundY - h * 0.6, 6, h * 0.6);
      ctx.fillStyle = "#2e7d32";
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath(); ctx.ellipse(x + Math.cos(ang) * h * 0.35, groundY - h * 0.6 + Math.sin(ang) * h * 0.15, h * 0.35, h * 0.08, ang, 0, Math.PI * 2); ctx.fill();
      }
    } else if (type === "dead") {
      ctx.strokeStyle = "#5d4037"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x + (Math.random() - 0.5) * 10, groundY - h * 0.5); ctx.stroke();
    } else if (type === "mushrooms") {
      ctx.fillStyle = "#8d6e63"; ctx.fillRect(x - 2, groundY - h * 0.3, 4, h * 0.3);
      ctx.fillStyle = "#d32f2f"; ctx.beginPath(); ctx.arc(x, groundY - h * 0.3, h * 0.25, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#fff"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + (i - 1) * 5, groundY - h * 0.35 - i * 3, 2, 0, Math.PI * 2); ctx.fill(); }
    } else if (type === "rocks") {
      ctx.fillStyle = "#795548";
      ctx.beginPath(); ctx.ellipse(x, groundY - h * 0.15, h * 0.3, h * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    } else if (type === "ice") {
      ctx.fillStyle = "rgba(178, 235, 242, 0.7)";
      ctx.beginPath(); ctx.moveTo(x, groundY - h * 0.8); ctx.lineTo(x - 8, groundY); ctx.lineTo(x + 8, groundY); ctx.closePath(); ctx.fill();
    }
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, y: number, height: number, isBottom: boolean, biome: Biome) => {
    if (height <= 0) return;
    const capHeight = 28; const capExtra = 6;
    const bodyGrad = ctx.createLinearGradient(x, 0, x + PIPE_WIDTH, 0);
    biome.pipeColors.bodyStops.forEach((c, i) => bodyGrad.addColorStop(i / (biome.pipeColors.bodyStops.length - 1), c));
    ctx.fillStyle = bodyGrad; ctx.fillRect(x, y, PIPE_WIDTH, height);
    ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(x + 9, y, 5, height);
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(x + PIPE_WIDTH - 12, y, 6, height);
    const capY = isBottom ? y : y + height - capHeight;
    const capGrad = ctx.createLinearGradient(x - capExtra, capY, x + PIPE_WIDTH + capExtra, capY);
    biome.pipeColors.capStops.forEach((c, i) => capGrad.addColorStop(i / (biome.pipeColors.capStops.length - 1), c));
    ctx.fillStyle = capGrad; ctx.fillRect(x - capExtra, capY, PIPE_WIDTH + capExtra * 2, capHeight);
    ctx.strokeStyle = biome.pipeColors.border; ctx.lineWidth = 2.5;
    ctx.strokeRect(x - capExtra, capY, PIPE_WIDTH + capExtra * 2, capHeight);
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x - capExtra + 3, capY + 3, PIPE_WIDTH + capExtra * 2 - 6, 4);
  };

  const drawBird = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, wingOffset: number, skinObj: BirdSkin, hatId: string) => {
    const r = size / 2;
    // Queue
    ctx.fillStyle = skinObj.tailColor;
    ctx.beginPath(); ctx.moveTo(x - r * 0.85, y); ctx.lineTo(x - r * 1.45, y - r * 0.35); ctx.lineTo(x - r * 1.45, y + r * 0.35); ctx.closePath(); ctx.fill();
    // Corps
    const bodyGrad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
    bodyGrad.addColorStop(0, skinObj.bodyGradient[0]); bodyGrad.addColorStop(0.5, skinObj.bodyGradient[1]); bodyGrad.addColorStop(1, skinObj.bodyGradient[2]);
    ctx.fillStyle = bodyGrad; ctx.beginPath(); ctx.ellipse(x, y, r * 0.95, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = skinObj.outlineColor; ctx.lineWidth = 2; ctx.stroke();
    // Ventre
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath(); ctx.ellipse(x + r * 0.15, y + r * 0.22, r * 0.5, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    // Aile
    const wingGrad = ctx.createLinearGradient(x, y - r * 0.4, x, y + r * 0.4);
    wingGrad.addColorStop(0, skinObj.wingGradient[0]); wingGrad.addColorStop(1, skinObj.wingGradient[1]);
    ctx.fillStyle = wingGrad;
    ctx.beginPath(); ctx.ellipse(x - r * 0.2, y + wingOffset * 0.5, r * 0.5, r * 0.32, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = skinObj.outlineColor; ctx.lineWidth = 1.5; ctx.stroke();
    // Œil
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(x + r * 0.5, y - r * 0.26, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#101010"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#1a1a2e"; ctx.beginPath(); ctx.arc(x + r * 0.56, y - r * 0.26, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(x + r * 0.6, y - r * 0.31, r * 0.05, 0, Math.PI * 2); ctx.fill();
    // Bec
    ctx.fillStyle = "#ff5722"; ctx.beginPath(); ctx.moveTo(x + r * 0.75, y - r * 0.06); ctx.quadraticCurveTo(x + r * 1.3, y + r * 0.02, x + r * 0.75, y + r * 0.2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#bf360c"; ctx.lineWidth = 1; ctx.stroke();
    // Joue
    ctx.fillStyle = "rgba(255,100,100,0.35)"; ctx.beginPath(); ctx.arc(x + r * 0.28, y + r * 0.12, r * 0.14, 0, Math.PI * 2); ctx.fill();

    // Chapeaux
    if (hatId === "cap") {
      ctx.fillStyle = "#2979ff"; ctx.beginPath(); ctx.arc(x + r * 0.1, y - r * 0.65, r * 0.5, Math.PI, 0); ctx.fill();
      ctx.fillRect(x + r * 0.1, y - r * 0.65, r * 0.75, 4);
    } else if (hatId === "crown") {
      ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.moveTo(x - r * 0.3, y - r * 0.75); ctx.lineTo(x - r * 0.5, y - r * 1.2); ctx.lineTo(x, y - r * 0.9); ctx.lineTo(x + r * 0.5, y - r * 1.2); ctx.lineTo(x + r * 0.3, y - r * 0.75); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#f57f17"; ctx.lineWidth = 1.5; ctx.stroke();
    } else if (hatId === "sunglasses") {
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.ellipse(x + r * 0.5, y - r * 0.22, r * 0.38, r * 0.24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.ellipse(x + r * 0.55, y - r * 0.26, r * 0.12, r * 0.06, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#333"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - r * 0.22); ctx.lineTo(x + r * 0.2, y - r * 0.22); ctx.stroke();
    } else if (hatId === "wizard") {
      ctx.fillStyle = "#651fff"; ctx.beginPath(); ctx.moveTo(x - r * 0.5, y - r * 0.7); ctx.lineTo(x + r * 0.1, y - r * 1.5); ctx.lineTo(x + r * 0.5, y - r * 0.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffd700"; ctx.fillRect(x - r * 0.6, y - r * 0.7, r * 1.2, 5);
    } else if (hatId === "pirate") {
      ctx.fillStyle = "#212121"; ctx.beginPath(); ctx.arc(x + r * 0.1, y - r * 0.55, r * 0.55, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillRect(x - r * 0.5, y - r * 0.55, r * 0.25, r * 0.25);
      ctx.fillStyle = "#f44336"; ctx.fillRect(x - r * 0.5, y - r * 0.55, r * 0.12, r * 0.25);
    } else if (hatId === "cowboy") {
      ctx.fillStyle = "#8d6e63"; ctx.beginPath(); ctx.ellipse(x + r * 0.1, y - r * 0.7, r * 0.55, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#5d4037"; ctx.fillRect(x - r * 0.6, y - r * 0.7, r * 1.4, 4);
    }
  };

  // ====== CONTRÔLES ======
  const startGame = useCallback(() => {
    resetGame();
    gameStateRef.current = "playing";
    setGameState("playing");
    audioController.startMusic();
    const now = performance.now();
    lastPipeSpawn.current = now - getDifficulty(0).pipeInterval + 1200;
    graceUntil.current = now + 700;
    birdVelocity.current = -4.5;
  }, [resetGame]);

  const handleInput = useCallback(() => {
    audioController.init();
    if (activeModal !== "none") return;
    if (gameStateRef.current === "menu") startGame();
    else if (gameStateRef.current === "playing") {
      birdVelocity.current = -5.6;
      audioController.playFlap();
      createParticles(cw.current * BIRD_X_RATIO - 8, birdY.current + 8, "#fff9c4", 5);
    } else if (gameStateRef.current === "gameover") startGame();
  }, [activeModal, startGame]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (activeModal !== "none") { if (e.code === "Escape") setActiveModal("none"); return; }
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault(); if (!e.repeat) handleInput();
      }
      if (e.code === "KeyF") { e.preventDefault(); toggleFullscreen(); }
      if (e.code === "KeyM") { e.preventDefault(); toggleMute(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleInput, activeModal]);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  useEffect(() => {
    const onFs = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => window.dispatchEvent(new Event("resize")), 80);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      let maxW: number, maxH: number;
      if (document.fullscreenElement) { maxW = window.innerWidth; maxH = window.innerHeight; }
      else { maxW = Math.min(window.innerWidth - 24, 460); maxH = Math.min(window.innerHeight - 180, 700); }
      cw.current = maxW; ch.current = maxH;
      canvas.width = maxW; canvas.height = maxH;
      canvas.style.width = maxW + "px"; canvas.style.height = maxH + "px";
      if (gameStateRef.current !== "playing") birdY.current = maxH / 2 - 30;
      else birdY.current = Math.min(birdY.current, maxH - GROUND_HEIGHT - BIRD_SIZE);
    };
    resize();
    window.addEventListener("resize", resize);
    lastFrameTime.current = 0;
    animFrame.current = requestAnimationFrame(gameLoop);
    return () => { cancelAnimationFrame(animFrame.current); window.removeEventListener("resize", resize); audioController.stopMusic(); };
  }, [gameLoop]);

  const toggleMute = () => { setIsMuted((m) => { audioController.muted = !m; return !m; }); };

  const buyItem = (type: "skin" | "hat", id: string, price: number) => {
    if (coins >= price) {
      setCoins((c) => c - price);
      audioController.playMilestone();
      if (type === "skin") { setUnlockedSkins((l) => [...l, id]); setSelectedSkin(id); }
      else { setUnlockedHats((l) => [...l, id]); setSelectedHat(id); }
    } else audioController.playCrash();
  };

  const completedCount = claimedAchievements.length;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 p-2 select-none text-white font-sans">
      {!isFullscreen && (
        <div className="w-full max-w-md flex items-center justify-between px-3 py-2 mb-2 bg-white/10 backdrop-blur rounded-2xl border border-white/15 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🐦</span>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">Sans Escale</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-amber-400/20 px-3 py-1 rounded-xl border border-amber-400/30">
              <span className="text-base">🪙</span><span className="font-black text-amber-300">{coins}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-400/20 px-3 py-1 rounded-xl border border-purple-400/30">
              <span className="text-base">🏆</span><span className="font-black text-purple-300">{highScore}</span>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className={isFullscreen ? "relative w-full h-full bg-black flex items-center justify-center" : "relative"}>
        <div className={"relative cursor-pointer overflow-hidden " + (isFullscreen ? "" : "rounded-3xl shadow-2xl shadow-black/60 border-4 border-white/20 transition-all")}
          onPointerDown={(e) => { e.preventDefault(); handleInput(); }}>
          <canvas ref={canvasRef} className="block touch-none" />

          {/* Boutons flottants */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            <button onPointerDown={(e) => { e.stopPropagation(); toggleMute(); }} className="w-10 h-10 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur border border-white/20 flex items-center justify-center text-lg shadow-lg transition-transform active:scale-95" title={isMuted ? "Activer (M)" : "Couper (M)"}>{isMuted ? "🔇" : "🔊"}</button>
            <button onPointerDown={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="w-10 h-10 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur border border-white/20 flex items-center justify-center text-lg shadow-lg transition-transform active:scale-95" title={isFullscreen ? "Quitter (F)" : "Plein écran (F)"}>{isFullscreen ? "🗗" : "⛶"}</button>
          </div>

          {isFullscreen && (
            <div className="absolute top-3 left-3 flex items-center gap-3 z-20 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur px-3 py-1.5 rounded-xl border border-white/20"><span>🪙</span><span className="font-black text-amber-300">{coins}</span></div>
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur px-3 py-1.5 rounded-xl border border-white/20"><span>🏆</span><span className="font-black text-purple-300">{highScore}</span></div>
            </div>
          )}

          {/* Menu */}
          {gameState === "menu" && (
            <div className="absolute inset-0 flex flex-col items-center justify-between p-5 z-10 bg-black/20 backdrop-blur-[1px] pointer-events-none">
              <div className="w-full flex justify-center mt-1 pointer-events-auto">
                <div className="bg-black/50 backdrop-blur-md p-1 rounded-2xl flex gap-1 border border-white/20 shadow-xl">
                  {([{ id: "progressive", name: "🌟 Progressif" }, { id: "zen", name: "🧘 Zen" }, { id: "hardcore", name: "🔥 Hardcore" }] as const).map((m) => (
                    <button key={m.id} onPointerDown={(e) => { e.stopPropagation(); setGameMode(m.id); audioController.playFlap(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${gameMode === m.id ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md scale-105" : "text-white/70 hover:text-white"}`}>{m.name}</button>
                  ))}
                </div>
              </div>
              <div className="text-center bg-black/40 backdrop-blur-md p-5 rounded-3xl border border-white/20 shadow-2xl max-w-[85%] pointer-events-auto">
                <h2 className="text-2xl font-black tracking-wider text-white drop-shadow-md mb-1 animate-pulse">TAPEZ POUR VOLER</h2>
                <p className="text-xs text-white/80 font-medium mb-3">Mode : <span className="text-amber-400 font-bold uppercase">{gameMode === "progressive" ? "Biomes évolutifs" : gameMode === "zen" ? "Vol infini" : "Vitesse extrême"}</span></p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/60">
                  <span className="bg-white/15 px-2 py-1 rounded font-mono font-bold text-white">Espace</span><span>/</span>
                  <span className="bg-white/15 px-2 py-1 rounded font-mono font-bold text-white">Clic</span><span>pour voler</span>
                </div>
                <div className="mt-3 text-amber-300/90 text-[11px] font-medium">💡 La difficulté grimpe doucement avec votre score !</div>
              </div>
              <div className="w-full flex flex-wrap items-center justify-center gap-3 mb-1 pointer-events-auto">
                <button onPointerDown={(e) => { e.stopPropagation(); setActiveModal("shop"); audioController.playFlap(); }}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black px-4 py-2.5 rounded-2xl shadow-xl border border-amber-300/30 transition-transform active:scale-95">
                  <span>🛍️</span><span className="text-xs uppercase tracking-wider">Boutique</span>
                </button>
                <button onPointerDown={(e) => { e.stopPropagation(); setActiveModal("achievements"); audioController.playFlap(); }}
                  className="relative flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black px-4 py-2.5 rounded-2xl shadow-xl border border-blue-400/30 transition-transform active:scale-95">
                  <span>🏆</span><span className="text-xs uppercase tracking-wider">Succès</span>
                  {completedCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">{completedCount}</span>}
                </button>
                <button onPointerDown={(e) => { e.stopPropagation(); setActiveModal("info"); audioController.playFlap(); }}
                  title="Comment ce jeu a été fait"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2.5 rounded-2xl shadow-xl border border-white/20 transition-transform active:scale-95">
                  <span>ℹ️</span><span className="text-xs uppercase tracking-wider hidden sm:inline">Infos</span>
                </button>
              </div>
            </div>
          )}

          {/* Game Over */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-sm p-4 pointer-events-none">
              <div className="bg-gradient-to-b from-slate-900 to-indigo-950 p-7 rounded-3xl border-4 border-amber-400 shadow-2xl text-center max-w-xs w-full pointer-events-auto">
                <div className="text-4xl mb-1">💥</div>
                <h2 className="text-2xl font-black text-amber-400 mb-3 tracking-wider">CRASH !</h2>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-white/10 p-2 rounded-2xl border border-white/10"><div className="text-[10px] text-white/60 font-bold uppercase">Score</div><div className="text-2xl font-black text-sky-400">{score}</div></div>
                  <div className="bg-white/10 p-2 rounded-2xl border border-white/10"><div className="text-[10px] text-white/60 font-bold uppercase">Record</div><div className="text-2xl font-black text-purple-400">{highScore}</div></div>
                  <div className="bg-white/10 p-2 rounded-2xl border border-white/10"><div className="text-[10px] text-white/60 font-bold uppercase">Biome</div><div className="text-2xl font-black text-emerald-400">{currentBiome.name.split(" ")[0]}</div></div>
                </div>
                {score === highScore && score > 0 && (
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs py-1.5 px-4 rounded-full mb-3 animate-pulse inline-block uppercase tracking-wider shadow-lg">🎉 Nouveau Record !</div>
                )}
                <p className="text-xs text-white/70 font-medium mb-4">Tapez pour rejouer</p>
                <div className="flex justify-center gap-3">
                  <button onPointerDown={(e) => { e.stopPropagation(); setActiveModal("shop"); audioController.playFlap(); }} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold border border-white/20 transition-colors flex items-center justify-center gap-1.5"><span>🛍️</span> Skins</button>
                  <button onPointerDown={(e) => { e.stopPropagation(); setActiveModal("achievements"); audioController.playFlap(); }} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold border border-white/20 transition-colors flex items-center justify-center gap-1.5"><span>🏆</span> Succès</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Boutique */}
      {activeModal === "shop" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in" onPointerDown={() => setActiveModal("none")}>
          <div className="bg-slate-900 border-2 border-white/20 rounded-3xl p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col justify-between" onPointerDown={(e) => e.stopPropagation()}>
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2"><span className="text-2xl">🛍️</span><h2 className="text-xl font-black text-amber-400">Boutique</h2></div>
                <div className="flex items-center gap-1.5 bg-amber-400/20 px-3 py-1 rounded-xl border border-amber-400/30 font-black text-amber-300 text-sm"><span>🪙</span> {coins}</div>
              </div>
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Apparences</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {SKINS.map((skin) => {
                    const unlocked = unlockedSkins.includes(skin.id);
                    const equipped = selectedSkin === skin.id;
                    return (
                      <div key={skin.id} onClick={() => { if (unlocked) setSelectedSkin(skin.id); else buyItem("skin", skin.id, skin.price); }}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${equipped ? "bg-emerald-500/20 border-emerald-500" : unlocked ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-black/40 border-white/5 opacity-75"}`}>
                        <div className="flex items-center gap-3"><span className="text-2xl">{skin.icon}</span><div><span className="text-sm font-bold text-white block">{skin.name}</span><span className="text-[10px] text-white/50 block">{equipped ? "Équipé" : unlocked ? "Débloqué" : "Verrouillé"}</span></div></div>
                        {equipped ? <span className="bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1 rounded-xl uppercase shadow">Actif</span>
                          : unlocked ? <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-xl">Équiper</span>
                            : <div className="flex items-center gap-1 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow hover:bg-amber-400"><span>🪙</span> {skin.price}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Accessoires</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {HATS.map((hat) => {
                    const unlocked = unlockedHats.includes(hat.id);
                    const equipped = selectedHat === hat.id;
                    return (
                      <div key={hat.id} onClick={() => { if (unlocked) setSelectedHat(hat.id); else buyItem("hat", hat.id, hat.price); }}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${equipped ? "bg-purple-500/20 border-purple-500" : unlocked ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-black/40 border-white/5 opacity-75"}`}>
                        <div className="flex items-center gap-3"><span className="text-2xl">{hat.icon}</span><div><span className="text-sm font-bold text-white block">{hat.name}</span><span className="text-[10px] text-white/50 block">{equipped ? "Équipé" : unlocked ? "Débloqué" : "Verrouillé"}</span></div></div>
                        {equipped ? <span className="bg-purple-500 text-white text-xs font-black px-3 py-1 rounded-xl uppercase shadow">Actif</span>
                          : unlocked ? <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-xl">Équiper</span>
                            : <div className="flex items-center gap-1 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow hover:bg-amber-400"><span>🪙</span> {hat.price}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <button onClick={() => setActiveModal("none")} className="w-full mt-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-black text-xs rounded-2xl uppercase tracking-wider shadow-lg border border-white/10">Fermer</button>
          </div>
        </div>
      )}

      {/* Modal Succès */}
      {activeModal === "achievements" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in" onPointerDown={() => setActiveModal("none")}>
          <div className="bg-slate-900 border-2 border-white/20 rounded-3xl p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col justify-between" onPointerDown={(e) => e.stopPropagation()}>
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2"><span className="text-2xl">🏆</span><h2 className="text-xl font-black text-purple-400">Trophées</h2></div>
                <div className="text-xs text-purple-300 font-bold bg-purple-500/20 px-3 py-1 rounded-xl border border-purple-500/30">{completedCount} / {ACHIEVEMENTS.length}</div>
              </div>
              <div className="grid grid-cols-1 gap-3 mb-4">
                {ACHIEVEMENTS.map((ach) => {
                  const done = claimedAchievements.includes(ach.id);
                  return (
                    <div key={ach.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${done ? "bg-purple-500/10 border-purple-500/40" : "bg-black/30 border-white/5 opacity-60"}`}>
                      <span className="text-3xl">{done ? ach.icon : "🔒"}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm font-black ${done ? "text-purple-300" : "text-white/60"}`}>{ach.title}</span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400"><span>🪙</span> +{ach.reward}</span>
                        </div>
                        <p className="text-xs text-white/70 font-medium">{ach.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setActiveModal("none")} className="w-full mt-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-black text-xs rounded-2xl uppercase tracking-wider shadow-lg border border-white/10">Fermer</button>
          </div>
        </div>
      )}

      {/* Modal Infos */}
      {activeModal === "info" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in" onPointerDown={() => setActiveModal("none")}>
          <div className="bg-slate-900 border-2 border-white/20 rounded-3xl p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-2xl" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10">
              <span className="text-2xl">ℹ️</span><h2 className="text-xl font-black text-white">Comment ce jeu a été fait</h2>
            </div>
            <div className="space-y-3.5 text-sm leading-relaxed text-white/80">
              <p><strong className="text-white">Stack :</strong> React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7, compilé en un seul fichier HTML, aucune dépendance chargée depuis l'extérieur.</p>
              <p><strong className="text-white">Graphismes :</strong> tout est dessiné en Canvas 2D à chaque image (oiseau, obstacles, météo, décor de biome), aucun sprite ni image externe.</p>
              <p><strong className="text-white">Musique &amp; sons :</strong> synthétisés en direct avec l'API Web Audio. Chaque biome a sa propre gamme musicale et son propre timbre d'oscillateur, donc la musique change vraiment de couleur en changeant de décor.</p>
              <p><strong className="text-white">Interactions :</strong> clic, tactile ou espace pour battre des ailes, boutons dédiés pour la boutique de skins/chapeaux et les succès.</p>
              <p><strong className="text-white">Architecture :</strong> une seule boucle de jeu Canvas met à jour la physique et redessine chaque image ; progression, pièces et succès débloqués sont persistés dans le stockage local du navigateur.</p>
              <p><strong className="text-white">Algorithmes notables :</strong> le biome traversé change automatiquement tous les 12 points de score en mode Biomes évolutifs, chacun avec sa propre météo animée (pluie, neige, pétales, lucioles...). Le mode Vitesse extrême applique un multiplicateur de vitesse aux obstacles par rapport au mode normal.</p>
            </div>
            <button onClick={() => setActiveModal("none")} className="w-full mt-5 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-black text-xs rounded-2xl uppercase tracking-wider shadow-lg border border-white/10">Fermer</button>
          </div>
        </div>
      )}

      {!isFullscreen && <div className="mt-2 text-[11px] text-white/30 text-center max-w-sm">F - Plein écran | M - Muet | Échapp - Fermer</div>}
    </div>
  );
}
