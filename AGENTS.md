# AGENTS.md

Clon de Asteroids en canvas HTML5. Todo el juego vive en `game.js` (~423 líneas).
**Sin build, sin bundler, sin dependencias, sin tests, sin linter, sin CI.**

## Verificación

- Abrir `index.html` con doble clic (`file://`) funciona; `npx serve .` es opcional.
- No existe verificación automatizada: nada que ejecutar salvo abrir el juego y jugarlo.
  No agregues tooling (package.json, lint, tests) salvo pedido explícito.

## Restricciones duras

- `game.js` se carga como script clásico (`<script src="game.js">`). **No uses
  `import`/`export`** ni agregues `type="module"`: rompe la carga vía `file://`.
- El tamaño del canvas está duplicado: `index.html` (`width="800" height="600"`) y
  `game.js` (`const W = 800; const H = 600;`). Cámbialos juntos.
  No hay escalado CSS: `body` centra con flex un canvas de tamaño fijo, así que en
  viewports chicos desborda.

## Arquitectura (`game.js`, orden de arriba hacia abajo)

Entrada → utils → `Bullet` → `Asteroid` → `Ship` → `Particle` → estado → `update()` →
helpers de dibujo → loop rAF. Agrega clases nuevas siguiendo ese orden.

- **Estado global mutable** (líneas ~239-242): `ship, bullets, asteroids, particles,
  score, lives, level, state, deadTimer`. Solo lo reinician `initGame()` y `nextLevel()`.
- `state` es un string: `'playing' | 'dead' | 'gameover'`.
- **Tablas por tamaño**, con un índice 0 descartado:
  `RADII = [0,16,30,50]`, `SPEEDS = [0,85,55,32]`, `POINTS = [0,100,50,20]`
  (índice 1=pequeño, 2=mediano, 3=grande). Añadir un tamaño exige tocar las tres a la vez.
- **Ciclo de vida**: la entidad marca `dead = true` y el bucle hace
  `array = array.filter(e => !e.dead)`. **Nunca agregues/borres elementos de esos
  arrays mientras los recorres** — `update()` acumula en `newAsteroids` y concatena
  después. No hay `isDead()`: se consulta `e.dead` directamente.

## Input

- Dos mapas: `keys` (mantenida) y `justPressed` (flanco, un frame).
- `pressed(code)` **consume** el flag del flanco. Llamarla dos veces en el mismo frame
  descarta la segunda. Solo `update()` debe llamarla.

## Loop y tiempo

- `loop(ts)` calcula `dt` en segundos con tope de `0.05`; el primer frame usa `dt = 0`.
- Ojo: el `DRAG = 0.987` de la nave se aplica **por frame, sin escalar por `dt`**
  (`ROT` y `THRUST` sí usan `dt`). Esa física depende del framerate; no la "arregles"
  sin ajustar los valores para preservar el feeling.

## Convenciones

- Identificadores en inglés, comentarios en español, UI en español.
- El texto de interfaz está hardcodeado en `game.js` (`drawHUD`, llamadas a
  `drawOverlay`), no en `index.html`.
- Banners de sección con el patrón `// ── Nombre ─────`.
- Render: trazos blancos sobre negro, `ctx.save()`/`restore()` por entidad.

## README desalineado

`README.md` anuncia power-ups y un asteroide "estrella fugaz" que **no existen en
`game.js`**. Trátalo como aspiracional; el código manda. Actualiza el README al agregar
features.

## Formato de archivo

UTF-8 **sin BOM**, fin de línea LF. El repo fija `core.autocrlf=false` (anula el `true`
global): no commitees CRLF.