class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.audioManager = new AudioManager();
        this.player = new Player();
        this.weapon = new Weapon();
        this.projectiles = [];
        this.enemies = [];
        this.gameState = 'playing'; // 'playing', 'won', 'lost'

        // Mouse look settings
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;
        this.mouseX = 0;
        this.mouseY = 0;

        // Map (1 = wall, 0 = empty space)
        this.map = [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ];

        // Set player starting position to a safe spot
        this.player.x = 1.5;
        this.player.y = 1.5;
        this.player.angle = 0;
        this.player.health = 100;
        this.player.ammo = 50; // Mehr Munition am Start

        // Controls
        this.keys = {
            w: false,
            s: false,
            a: false,
            d: false
        };

        this.setupEventListeners();
        this.spawnEnemies();
        this.gameLoop();
    }

    spawnEnemies() {
        // Spawn fewer enemies and only imps for the first level
        this.enemies = [
            new Enemy(6, 2, 'imp'),
            new Enemy(6, 6, 'imp')
        ];
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });

        // Mouse look controls
        this.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouseX = e.movementX;
                this.mouseY = e.movementY;
            }
        });

        // Shooting
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.isPointerLocked) { // Left mouse button
                const projectile = this.weapon.shoot(this.player, this.audioManager);
                if (projectile) {
                    this.projectiles.push(projectile);
                }
            }
        });

        // Start audio context on first user interaction
        const startAudio = () => {
            this.audioManager.resume();
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
        };
        
        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
    }

    update() {
        // Handle mouse look
        if (this.isPointerLocked && this.gameState === 'playing') {
            this.player.angle += this.mouseX * this.mouseSensitivity;
            this.mouseX = 0;
            this.mouseY = 0;
        }

        // Only update game if still playing
        if (this.gameState === 'playing') {
            // Handle movement
            if (this.keys.w) {
                this.player.move(
                    Math.cos(this.player.angle) * this.player.speed,
                    Math.sin(this.player.angle) * this.player.speed,
                    this.map
                );
            }
            if (this.keys.s) {
                this.player.move(
                    -Math.cos(this.player.angle) * this.player.speed,
                    -Math.sin(this.player.angle) * this.player.speed,
                    this.map
                );
            }
            if (this.keys.a) {
                this.player.move(
                    Math.cos(this.player.angle - Math.PI/2) * this.player.speed,
                    Math.sin(this.player.angle - Math.PI/2) * this.player.speed,
                    this.map
                );
            }
            if (this.keys.d) {
                this.player.move(
                    Math.cos(this.player.angle + Math.PI/2) * this.player.speed,
                    Math.sin(this.player.angle + Math.PI/2) * this.player.speed,
                    this.map
                );
            }

            // Update enemies
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                enemy.update(this.player, this.map);

                // Check if enemy is attacking player
                if (enemy.isAttacking) {
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= enemy.attackRange) {
                        if (this.player.takeDamage(enemy.damage)) {
                            // Player died
                            this.gameState = 'lost';
                            this.showGameOver();
                            return;
                        }
                    }
                }

                // Remove dead enemies
                if (enemy.isDead()) {
                    this.enemies.splice(i, 1);
                }
            }

            // Check win condition
            if (this.enemies.length === 0) {
                this.gameState = 'won';
                this.showVictory();
                return;
            }

            // Update projectiles and check for hits
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const proj = this.projectiles[i];
                proj.distance += 0.2;

                const projX = this.player.x + Math.cos(proj.angle) * proj.distance;
                const projY = this.player.y + Math.sin(proj.angle) * proj.distance;

                // Check for wall collision
                if (this.player.checkCollision(projX, projY, this.map) || proj.distance > this.weapon.range) {
                    this.projectiles.splice(i, 1);
                    continue;
                }

                // Check for enemy hits
                for (const enemy of this.enemies) {
                    const dx = projX - enemy.x;
                    const dy = projY - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 0.5) { // Hit detection radius
                        if (enemy.takeDamage(this.weapon.damage)) {
                            // Enemy died
                            this.audioManager.createEnemyDeathSound();
                        } else {
                            this.audioManager.createEnemyHitSound();
                        }
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }

    showVictory() {
        // Create victory message
        const victoryDiv = document.createElement('div');
        victoryDiv.style.position = 'absolute';
        victoryDiv.style.top = '50%';
        victoryDiv.style.left = '50%';
        victoryDiv.style.transform = 'translate(-50%, -50%)';
        victoryDiv.style.color = '#0f0';
        victoryDiv.style.fontSize = '48px';
        victoryDiv.style.fontFamily = 'Arial';
        victoryDiv.style.textAlign = 'center';
        victoryDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        victoryDiv.innerHTML = `
            <h1>VICTORY!</h1>
            <p>Alle Gegner besiegt!</p>
            <p style="font-size: 24px;">Klicke zum Neustarten</p>
        `;
        document.body.appendChild(victoryDiv);

        // Add click listener to restart
        const restart = () => {
            document.body.removeChild(victoryDiv);
            location.reload();
        };
        victoryDiv.addEventListener('click', restart);
    }

    showGameOver() {
        // Create game over message
        const gameOverDiv = document.createElement('div');
        gameOverDiv.style.position = 'absolute';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
        gameOverDiv.style.transform = 'translate(-50%, -50%)';
        gameOverDiv.style.color = '#f00';
        gameOverDiv.style.fontSize = '48px';
        gameOverDiv.style.fontFamily = 'Arial';
        gameOverDiv.style.textAlign = 'center';
        gameOverDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        gameOverDiv.innerHTML = `
            <h1>GAME OVER</h1>
            <p style="font-size: 24px;">Klicke zum Neustarten</p>
        `;
        document.body.appendChild(gameOverDiv);

        // Add click listener to restart
        const restart = () => {
            document.body.removeChild(gameOverDiv);
            location.reload();
        };
        gameOverDiv.addEventListener('click', restart);
    }

    gameLoop() {
        this.update();
        this.renderer.render({
            player: this.player,
            weapon: this.weapon,
            projectiles: this.projectiles,
            enemies: this.enemies,
            map: this.map,
            gameState: this.gameState
        });
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 