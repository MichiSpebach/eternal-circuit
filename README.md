# Eternal Circuit

A browser-based Doom-like game built with JavaScript and HTML5 Canvas.

## Features

- First-person perspective with raycasting engine
- Basic movement and collision detection
- Simple map system
- Dynamic lighting based on distance
- Weapon system with shooting mechanics
- Health and ammo management
- Visual feedback (muzzle flash, projectiles)

## How to Play

1. Open `index.html` in a modern web browser
2. Use the following controls:
   - W: Move forward
   - S: Move backward
   - A: Strafe left
   - D: Strafe right
   - Left Arrow: Turn left
   - Right Arrow: Turn right
   - Left Mouse Button: Shoot

## Game Elements

- **Health**: Displayed as a green bar in the top-left corner
- **Ammo**: Shown in the top-left corner
- **Weapon**: A simple pistol with visual feedback when shooting
- **Crosshair**: Helps with aiming
- **Projectiles**: Visible yellow dots that show bullet trajectory

## Technical Details

The game uses a raycasting engine similar to the original Doom, which creates a pseudo-3D effect by casting rays from the player's position and calculating wall heights based on distance. The rendering is done using HTML5 Canvas, and the game loop is powered by requestAnimationFrame for smooth animation.

## Development

The game is built with vanilla JavaScript and HTML5 Canvas, requiring no external dependencies. The main game logic is contained in `js/game.js`.
