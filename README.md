# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla       | Acción                        |
| ----------- | ----------------------------- |
| `←` `→`     | Rotar nave / elegir skin      |
| `↑`         | Propulsar                     |
| `Espacio`   | Disparar / confirmar          |

## Skins

Al abrir el juego por primera vez aparece la pantalla de selección. `←` `→` recorren las naves y `Espacio` (o `Enter`) arranca la partida. La skin elegida se recuerda entre recargas.

| Nave      | Color  |
| --------- | ------ |
| CLÁSICA   | Blanco |
| DELTA     | Cian   |
| OVNI      | Verde  |
| CAZADOR   | Ámbar  |
| COMETA    | Magenta|

Las skins son **puramente cosméticas**: no cambian el radio de colisión, la velocidad ni el daño. Los iconos de vida del HUD usan la nave elegida.

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- 5 skins de nave seleccionables, recordadas entre recargas
