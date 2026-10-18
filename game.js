'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;
    this.ttl   = Infinity;  // solo las entidades temporales expiran
    this.color = '#fff';
    this.isBonus = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  points() {
    return POINTS[this.size];
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Shooting Star ─────────────────────────────────────────────────────────────
const STAR_SPEED    = 210;  // px/s
const STAR_TTL      = 9;    // s de vida (tope de seguridad)
const STAR_FADE     = 2;    // s de desvanecimiento final
const STAR_POINTS   = 75;
const STAR_TAIL_LEN = 70;   // px de cola
const STAR_TAIL_W   = 9;    // px de ancho en la base de la cola
const STAR_HEAD     = 3.5;  // px de radio del núcleo
const STAR_MARGIN   = 60;   // px fuera del canvas antes de desaparecer
const STAR_SPARK    = 0.05; // s entre chispas

class ShootingStar extends Asteroid {
  constructor(x, y, angle) {
    super(x, y, 3);
    this.vx = Math.cos(angle) * STAR_SPEED;
    this.vy = Math.sin(angle) * STAR_SPEED;
    this.ttl = STAR_TTL;
    this.radius = STAR_HEAD + 6;   // zona de impacto del núcleo
    this.color = '#ffd166';
    this.isBonus = true;
    this.sparkTimer = 0;
  }

  points() {
    return STAR_POINTS;
  }

  // No se parte: es una bonificación transitoria
  split() {
    return [];
  }

  // Sin wrap: entra por un borde, cruza el campo y se va volando
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
    if (this.x < -STAR_MARGIN || this.x > W + STAR_MARGIN ||
        this.y < -STAR_MARGIN || this.y > H + STAR_MARGIN) this.dead = true;
    this.emitSparks(dt);
  }

  // Chispas que arrastran la dirección del cometa y se dispersan
  emitSparks(dt) {
    this.sparkTimer -= dt;
    if (this.sparkTimer > 0) return;
    this.sparkTimer = STAR_SPARK;
    const speed = Math.hypot(this.vx, this.vy);
    const dx = this.vx / speed, dy = this.vy / speed;
    particles.push(new Particle(
      this.x - dx * STAR_TAIL_W,
      this.y - dy * STAR_TAIL_W,
      this.vx * 0.25 + rand(-40, 40),
      this.vy * 0.25 + rand(-40, 40),
    ));
  }

  draw() {
    const speed = Math.hypot(this.vx, this.vy);
    const dx = this.vx / speed, dy = this.vy / speed;   // hacia delante
    const px = -dy, py = dx;                            // perpendicular
    const tailX = this.x - dx * STAR_TAIL_LEN;
    const tailY = this.y - dy * STAR_TAIL_LEN;

    ctx.save();
    // Parpadeo del brillo + desvanecimiento final
    const flicker = 0.75 + 0.25 * Math.abs(Math.sin(this.ttl * 20));
    ctx.globalAlpha = Math.min(1, this.ttl / STAR_FADE) * flicker;

    // Cola cónica que se estrecha hacia la punta
    const grad = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
    grad.addColorStop(0, 'rgba(255, 240, 200, 0.75)');
    grad.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(this.x + px * STAR_TAIL_W / 2, this.y + py * STAR_TAIL_W / 2);
    ctx.lineTo(tailX, tailY);
    ctx.lineTo(this.x - px * STAR_TAIL_W / 2, this.y - py * STAR_TAIL_W / 2);
    ctx.closePath();
    ctx.fill();

    // Halo
    ctx.fillStyle = this.color;
    ctx.globalAlpha *= 0.25;
    ctx.beginPath();
    ctx.arc(this.x, this.y, STAR_HEAD + 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo brillante
    ctx.globalAlpha = Math.min(1, this.ttl / STAR_FADE) * flicker;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#fff7d6';
    ctx.beginPath();
    ctx.arc(this.x, this.y, STAR_HEAD, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ── Skins ─────────────────────────────────────────────────────────────────────
const SKIN_KEY = 'asteroids.skin';

// Cada skin dibuja su silueta en espacio local: nariz hacia +x, centro en (0,0).
// `nose` es la distancia del centro a la punta, de donde salen las balas.
const SKINS = [
  {
    name: 'CLÁSICA', color: '#fff', nose: 21,
    flame: { x: -8, half: 4, color: 'rgba(255,130,0,0.85)', min: 6, max: 14 },
    outline(ctx) {
      ctx.beginPath();
      ctx.moveTo( 20,  0);
      ctx.lineTo(-12, -9);
      ctx.lineTo( -7,  0);
      ctx.lineTo(-12,  9);
      ctx.closePath();
      ctx.stroke();
    },
  },
  {
    name: 'DELTA', color: '#5fd8ff', nose: 23,
    flame: { x: -8, half: 6, color: 'rgba(120,220,255,0.85)', min: 6, max: 16 },
    outline(ctx) {
      ctx.beginPath();
      ctx.moveTo( 22,   0);
      ctx.lineTo( -4,  -8);
      ctx.lineTo(-10, -20);
      ctx.lineTo( -8,   0);
      ctx.lineTo(-10,  20);
      ctx.lineTo( -4,   8);
      ctx.closePath();
      ctx.stroke();
    },
  },
  {
    name: 'OVNI', color: '#7dff9b', nose: 19,
    flame: { x: -16, half: 6, color: 'rgba(125,255,155,0.85)', min: 5, max: 12 },
    outline(ctx) {
      ctx.beginPath();
      ctx.moveTo( 18,   0);
      ctx.lineTo(  7,  -5);
      ctx.lineTo(  6, -11);
      ctx.lineTo( -6, -11);
      ctx.lineTo( -7,  -5);
      ctx.lineTo(-18,   0);
      ctx.lineTo( -7,   5);
      ctx.lineTo(  7,   5);
      ctx.closePath();
      ctx.stroke();
    },
  },
  {
    name: 'CAZADOR', color: '#ffb454', nose: 25,
    flame: { x: -10, half: 5, color: 'rgba(255,180,84,0.85)', min: 7, max: 17 },
    outline(ctx) {
      ctx.beginPath();
      ctx.moveTo( 24,  -7);
      ctx.lineTo(  7,  -3);
      ctx.lineTo(  8,   0);
      ctx.lineTo(  7,   3);
      ctx.lineTo( 24,   7);
      ctx.lineTo(  2,   6);
      ctx.lineTo(-14,  18);
      ctx.lineTo( -6,   0);
      ctx.lineTo(-14, -18);
      ctx.lineTo(  2,  -6);
      ctx.closePath();
      ctx.stroke();
    },
  },
  {
    name: 'COMETA', color: '#ff6bd6', nose: 23,
    flame: { x: -12, half: 4, color: 'rgba(255,107,214,0.85)', min: 6, max: 15 },
    outline(ctx) {
      ctx.beginPath();
      ctx.moveTo( 22,   0);
      ctx.lineTo(  4,  -6);
      ctx.lineTo(-16, -10);
      ctx.lineTo( -6,   0);
      ctx.lineTo(-16,  10);
      ctx.lineTo(  4,   6);
      ctx.closePath();
      ctx.stroke();
    },
  },
];

let skinIndex = 0;
const skin = () => SKINS[skinIndex];

// Silueta de la skin escalada desde el centro, con grosor de trazo constante
function drawSkinShape(s, scale = 1) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.strokeStyle = s.color;
  ctx.lineWidth   = 1.5 / scale;
  ctx.lineJoin    = 'round';
  s.outline(ctx);
  ctx.restore();
}

// Llama del propulsor: forma compartida, posición y color por skin
function drawFlame(flame) {
  ctx.beginPath();
  ctx.moveTo(flame.x, -flame.half);
  ctx.lineTo(flame.x - rand(flame.min, flame.max), 0);
  ctx.lineTo(flame.x, flame.half);
  ctx.strokeStyle = flame.color;
  ctx.stroke();
}

// El juego se abre por file://, donde el storage puede estar bloqueado
function loadSkinIndex() {
  try {
    const saved = localStorage.getItem(SKIN_KEY);
    if (saved === null) return -1;
    const n = Number(saved);
    return Number.isInteger(n) && n >= 0 && n < SKINS.length ? n : -1;
  } catch {
    return -1;
  }
}

function saveSkinIndex() {
  try {
    localStorage.setItem(SKIN_KEY, String(skinIndex));
  } catch {
    // Sin persistencia el juego funciona igual
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const nose = skin().nose;
    const ox = this.x + Math.cos(this.angle) * nose;
    const oy = this.y + Math.sin(this.angle) * nose;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const s = skin();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    drawSkinShape(s);
    if (this.thrusting && Math.random() > 0.35) drawFlame(s.flame);
    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  // vx/vy opcionales: si se omiten, la chispa sale en dirección aleatoria
  constructor(x, y, vx, vy) {
    this.x  = x;
    this.y  = y;
    if (vx === undefined) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(30, 130);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    } else {
      this.vx = vx;
      this.vy = vy;
    }
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles;
let score, lives, level;
let state;      // 'select' | 'playing' | 'dead' | 'gameover'
let deadTimer;
let shootingStarTimer;

const SPAWN_SAFE_DIST = 130;

function randomSpawnPoint() {
  let x, y;
  do {
    x = rand(0, W);
    y = rand(0, H);
  } while (Math.hypot(x - W / 2, y - H / 2) < SPAWN_SAFE_DIST);
  return { x, y };
}

function spawnAsteroids(count) {
  for (let i = 0; i < count; i++) {
    const p = randomSpawnPoint();
    asteroids.push(new Asteroid(p.x, p.y, 3));
  }
}

// Punto de entrada por un borde, dirigido al borde opuesto con algo de dispersion
function edgeSpawn() {
  const M = 30;  // px fuera del canvas
  let x, y, tx, ty;
  switch (randInt(0, 3)) {                       // 0 arriba, 1 derecha, 2 abajo, 3 izquierda
    case 0:  x = rand(0, W); y = -M;      tx = x + rand(-200, 200); ty = H;      break;
    case 1:  x = W + M;     y = rand(0, H); tx = 0;             ty = y + rand(-200, 200); break;
    case 2:  x = rand(0, W); y = H + M;   tx = x + rand(-200, 200); ty = 0;      break;
    default: x = -M;        y = rand(0, H); tx = W;             ty = y + rand(-200, 200);
  }
  return { x, y, angle: Math.atan2(ty - y, tx - x) };
}

function maybeSpawnShootingStar(dt) {
  shootingStarTimer -= dt;
  if (shootingStarTimer > 0) return;
  shootingStarTimer = rand(9, 15);
  if (asteroids.some(a => a.isBonus && !a.dead)) return;
  // Reintenta hasta alejar la entrada de la nave: entrar encima es injusto
  let p;
  for (let i = 0; i < 6; i++) {
    p = edgeSpawn();
    if (dist(p, ship) > 150) break;
  }
  asteroids.push(new ShootingStar(p.x, p.y, p.angle));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  shootingStarTimer = 5;   // el ciclo corre globalmente, no se reinicia por nivel
  spawnAsteroids(4);
}

function startGame() {
  if (state !== 'select') return;   // evita una segunda llamada en el mismo frame
  saveSkinIndex();
  initGame();
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'select') {
    if (pressed('ArrowLeft'))  skinIndex = wrap(skinIndex - 1, SKINS.length);
    if (pressed('ArrowRight')) skinIndex = wrap(skinIndex + 1, SKINS.length);
    if (pressed('Space'))      startGame();
    if (pressed('Enter'))      startGame();
    return;
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  maybeSpawnShootingStar(dt);

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points();
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (a.dead) continue;
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado (las estrellas fugaces no lo bloquean)
  if (asteroids.every(a => a.isBonus)) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  drawSkinShape(skin(), 0.45);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function drawSkinSelect() {
  const s = skin();

  ctx.textAlign = 'center';
  ctx.fillStyle = s.color;
  ctx.font      = 'bold 26px monospace';
  ctx.fillText(s.name, W / 2, 130);

  ctx.save();
  ctx.translate(W / 2, H / 2 - 20);
  drawSkinShape(s, 4);
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font      = '18px monospace';
  ctx.fillText('← →  ELEGIR NAVE      ESPACIO  JUGAR', W / 2, H - 70);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (state === 'select') {
    drawSkinSelect();
    return;
  }

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ── Arranque ──────────────────────────────────────────────────────────────────
skinIndex = loadSkinIndex();
if (skinIndex >= 0) {
  initGame();
} else {
  skinIndex = 0;
  state    = 'select';
}

requestAnimationFrame(loop);
