# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Cada cierto tiempo entra una **estrella fugaz** por un borde: rápida como un cometa y se va volando por el lado opuesto.

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
| `X`         | Activar/desc. escudo          |

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

| Asteroide     | Puntos |
| ------------- | ------ |
| Grande        | 20     |
| Mediano       | 50     |
| Pequeño       | 100    |
| Estrella fugaz | 75     |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Escudo activable con `X`: absorbe un impacto de asteroide, gasta energía y se
  regenera sola tras una pausa. Sin energía, el escudo se apaga y la nave queda expuesta
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Estrella fugaz: aparece cada 9-15 s (nunca más de una a la vez), entra volando desde un borde hacia el opuesto dejando una estela de chispas, y **no se parte**. No bloquea el avance de nivel
- 5 skins de nave seleccionables, recordadas entre recargas
- Power-up **Triple Shot**: cada asteroide destruido tiene una probabilidad de soltar un pickup (más probable cuanto más pequeño). Al recogerlo, durante 5 segundos cada disparo lanza 3 balas alineadas en línea recta. La cadencia de disparo no cambia y el bonus se pierde al morir o al pasar de nivel
