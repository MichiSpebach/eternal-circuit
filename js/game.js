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
        this.score = 0;
        this.level = 1;
        this.enemiesKilled = 0;

        // Mouse look settings
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;
        this.mouseX = 0;
        this.mouseY = 0;

        // Generate random level
        this.map = this.generateLevel();

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
            d: false,
            enter: false,
            ArrowLeft: false,
            ArrowRight: false,
            ' ': false  // Space bar
        };

        this.setupEventListeners();
        this.spawnEnemies();
        this.gameLoop();
    }

    generateLevel() {
        // Create a 40x40 map
        const width = 40;
        const height = 40;
        const map = Array(height).fill().map(() => Array(width).fill(1));

        // --- Complex Room Definitions ---
        // Starting room: L-shape
        for (let y = 1; y < 6; y++) {
            for (let x = 1; x < 6; x++) {
                if (!(x === 5 && y === 5)) map[y][x] = 0;
            }
        }
        for (let y = 3; y < 6; y++) {
            for (let x = 5; x < 8; x++) {
                map[y][x] = 0;
            }
        }

        // Main hall: T-shape with a niche
        for (let y = 5; y < 13; y++) {
            for (let x = 8; x < 23; x++) {
                map[y][x] = 0;
            }
        }
        // Niche in the north wall
        for (let y = 3; y < 5; y++) {
            for (let x = 13; x < 18; x++) {
                map[y][x] = 0;
            }
        }
        // Side arm
        for (let y = 8; y < 13; y++) {
            for (let x = 23; x < 26; x++) {
                map[y][x] = 0;
            }
        }

        // Library: U-shape
        for (let y = 5; y < 17; y++) {
            for (let x = 25; x < 33; x++) {
                if (y < 7 || y > 15 || x < 27 || x > 30) map[y][x] = 0;
            }
        }

        // Dining room: L-shape with a small alcove
        for (let y = 15; y < 25; y++) {
            for (let x = 8; x < 20; x++) {
                if (!(x > 16 && y < 18)) map[y][x] = 0;
            }
        }
        // Alcove
        for (let y = 17; y < 20; y++) {
            for (let x = 19; x < 22; x++) {
                map[y][x] = 0;
            }
        }

        // Kitchen: offset rectangle with a niche
        for (let y = 20; y < 26; y++) {
            for (let x = 22; x < 28; x++) {
                map[y][x] = 0;
            }
        }
        for (let y = 24; y < 26; y++) {
            for (let x = 28; x < 31; x++) {
                map[y][x] = 0;
            }
        }

        // Secret room: small, with a side chamber
        for (let y = 25; y < 31; y++) {
            for (let x = 30; x < 36; x++) {
                map[y][x] = 0;
            }
        }
        for (let y = 28; y < 31; y++) {
            for (let x = 36; x < 38; x++) {
                map[y][x] = 0;
            }
        }

        // Garden: irregular shape
        for (let y = 27; y < 35; y++) {
            for (let x = 5; x < 25; x++) {
                if (!(x > 20 && y < 30)) map[y][x] = 0;
            }
        }
        for (let y = 32; y < 36; y++) {
            for (let x = 20; x < 28; x++) {
                map[y][x] = 0;
            }
        }

        // --- Corridors (as vorher) ---
        // Main hall to library
        for (let x = 23; x < 25; x++) {
            for (let y = 7; y < 11; y++) {
                map[y][x] = 0;
            }
        }
        // Main hall to dining room
        for (let x = 11; x < 15; x++) {
            for (let y = 13; y < 15; y++) {
                map[y][x] = 0;
            }
        }
        // Dining room to kitchen
        for (let x = 20; x < 22; x++) {
            for (let y = 18; y < 20; y++) {
                map[y][x] = 0;
            }
        }
        // Library to secret room
        for (let x = 28; x < 30; x++) {
            for (let y = 17; y < 19; y++) {
                map[y][x] = 0;
            }
        }
        // Garden to dining room
        for (let x = 11; x < 15; x++) {
            for (let y = 25; y < 27; y++) {
                map[y][x] = 0;
            }
        }
        // Extra corridors (wie vorher)
        for (let y = 10; y < 12; y++) {
            for (let x = 5; x < 12; x++) {
                map[y][x] = 0;
            }
        }
        for (let y = 17; y < 28; y++) {
            for (let x = 28; x < 30; x++) {
                map[y][x] = 0;
            }
        }
        for (let y = 22; y < 24; y++) {
            for (let x = 22; x < 31; x++) {
                map[y][x] = 0;
            }
        }
        for (let i = 0; i < 5; i++) {
            map[13 + i][15 + i] = 0;
            map[13 + i][15 + i + 1] = 0;
        }

        // Decorations wie gehabt ...
        // (Rest des Codes bleibt gleich)

        return map;
    }

    spawnEnemies() {
        this.enemies = [];
        
        // Define enemy positions with clear paths
        const enemyPositions = [
            // Main hall enemies (central area)
            { x: 12, y: 7, type: 'imp' },
            { x: 18, y: 7, type: 'imp' },
            { x: 15, y: 11, type: 'cacodemon' },
            
            // Library enemies (near entrance)
            { x: 27, y: 8, type: 'imp' },
            { x: 31, y: 12, type: 'cacodemon' },
            
            // Dining room enemies (near center)
            { x: 10, y: 17, type: 'imp' },
            { x: 15, y: 20, type: 'cacodemon' },
            
            // Kitchen enemies (near entrance)
            { x: 24, y: 21, type: 'imp' },
            
            // Secret room enemies (near entrance)
            { x: 32, y: 27, type: 'baron' },
            
            // Garden enemies (spread out)
            { x: 8, y: 30, type: 'imp' },
            { x: 15, y: 32, type: 'cacodemon' },
            { x: 22, y: 30, type: 'imp' }
        ];

        // Spawn enemies at defined positions
        enemyPositions.forEach(pos => {
            // Add 0.5 to position to center enemies in their tiles
            this.enemies.push(new Enemy(pos.x + 0.5, pos.y + 0.5, pos.type));
        });
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
            if (e.key === 'Enter' && this.gameState !== 'playing') {
                this.restartGame();
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

        // Shooting (mouse and space)
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.isPointerLocked && this.gameState === 'playing') { // Left mouse button
                this.shoot();
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

    shoot() {
        const projectile = this.weapon.shoot(this.player, this.audioManager);
        if (projectile) {
            this.projectiles.push(projectile);
        }
    }

    update() {
        // Handle mouse look
        if (this.isPointerLocked && this.gameState === 'playing') {
            this.player.angle += this.mouseX * this.mouseSensitivity;
            this.mouseX = 0;
            this.mouseY = 0;
        }

        // Handle arrow key rotation
        if (this.gameState === 'playing') {
            const rotationSpeed = 0.05;
            if (this.keys.ArrowLeft) {
                this.player.angle -= rotationSpeed;
            }
            if (this.keys.ArrowRight) {
                this.player.angle += rotationSpeed;
            }

            // Handle shooting with space
            if (this.keys[' ']) {
                this.shoot();
            }
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
                            this.gameState = 'lost';
                            this.showGameOver();
                            return;
                        }
                        this.audioManager.createPlayerHurtSound();
                    }
                }

                // Remove dead enemies
                if (enemy.isDead()) {
                    this.enemies.splice(i, 1);
                    this.enemiesKilled++;
                    this.score += this.getEnemyScore(enemy.type);
                }
            }

            // Check win condition
            if (this.enemies.length === 0) {
                this.gameState = 'won';
                this.audioManager.createVictorySound();
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

    getEnemyScore(type) {
        switch(type) {
            case 'imp': return 100;
            case 'cacodemon': return 200;
            case 'baron': return 500;
            default: return 100;
        }
    }

    restartGame() {
        // Remove any existing game over or victory messages
        const messages = document.querySelectorAll('.game-message');
        messages.forEach(msg => document.body.removeChild(msg));
        
        // Reset game state
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.enemiesKilled = 0;
        this.player.health = 100;
        this.player.ammo = 50;
        this.projectiles = [];
        this.spawnEnemies();
    }

    showVictory() {
        // Create victory message
        const victoryDiv = document.createElement('div');
        victoryDiv.className = 'game-message';
        victoryDiv.style.position = 'absolute';
        victoryDiv.style.top = '50%';
        victoryDiv.style.left = '50%';
        victoryDiv.style.transform = 'translate(-50%, -50%)';
        victoryDiv.style.color = '#0f0';
        victoryDiv.style.fontSize = '48px';
        victoryDiv.style.fontFamily = 'Arial';
        victoryDiv.style.textAlign = 'center';
        victoryDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        victoryDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        victoryDiv.style.padding = '20px';
        victoryDiv.style.borderRadius = '10px';
        victoryDiv.style.cursor = 'pointer';
        victoryDiv.innerHTML = `
            <h1>VICTORY!</h1>
            <p>Level ${this.level} abgeschlossen!</p>
            <p>Punkte: ${this.score}</p>
            <p>Gegner besiegt: ${this.enemiesKilled}</p>
            <p style="font-size: 24px; margin-top: 20px;">Drücke ENTER oder klicke zum Fortfahren</p>
        `;
        document.body.appendChild(victoryDiv);

        // Add click listener to continue
        victoryDiv.addEventListener('click', () => {
            document.body.removeChild(victoryDiv);
            this.level++;
            this.audioManager.createLevelUpSound();
            this.nextLevel();
        });
    }

    nextLevel() {
        // Reset game state
        this.gameState = 'playing';
        this.player.health = 100;
        this.player.ammo = 50;
        this.projectiles = [];
        
        // Generate new level
        this.map = this.generateLevel();
        
        // Reset player position
        this.player.x = 1.5;
        this.player.y = 1.5;
        this.player.angle = 0;
        
        // Spawn enemies
        this.spawnEnemies();
    }

    showGameOver() {
        // Create game over message
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'game-message';
        gameOverDiv.style.position = 'absolute';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
        gameOverDiv.style.transform = 'translate(-50%, -50%)';
        gameOverDiv.style.color = '#f00';
        gameOverDiv.style.fontSize = '48px';
        gameOverDiv.style.fontFamily = 'Arial';
        gameOverDiv.style.textAlign = 'center';
        gameOverDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        gameOverDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        gameOverDiv.style.padding = '20px';
        gameOverDiv.style.borderRadius = '10px';
        gameOverDiv.style.cursor = 'pointer';
        gameOverDiv.innerHTML = `
            <h1>GAME OVER</h1>
            <p>Level ${this.level}</p>
            <p>Punkte: ${this.score}</p>
            <p>Gegner besiegt: ${this.enemiesKilled}</p>
            <p style="font-size: 24px; margin-top: 20px;">Drücke ENTER oder klicke zum Neustarten</p>
        `;
        document.body.appendChild(gameOverDiv);

        // Add click listener to restart
        gameOverDiv.addEventListener('click', () => this.restartGame());
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