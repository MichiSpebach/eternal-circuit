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
        const width = 20;
        const height = 20;
        const map = Array(height).fill().map(() => Array(width).fill(1));

        // Generate rooms
        const numRooms = 5 + Math.floor(this.level / 2);
        const rooms = [];

        for (let i = 0; i < numRooms; i++) {
            const roomWidth = 3 + Math.floor(Math.random() * 4);
            const roomHeight = 3 + Math.floor(Math.random() * 4);
            const x = 1 + Math.floor(Math.random() * (width - roomWidth - 2));
            const y = 1 + Math.floor(Math.random() * (height - roomHeight - 2));

            // Check if room overlaps with existing rooms
            let overlaps = false;
            for (const room of rooms) {
                if (x < room.x + room.width + 1 &&
                    x + roomWidth + 1 > room.x &&
                    y < room.y + room.height + 1 &&
                    y + roomHeight + 1 > room.y) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                rooms.push({ x, y, width: roomWidth, height: roomHeight });
                // Carve out room
                for (let ry = y; ry < y + roomHeight; ry++) {
                    for (let rx = x; rx < x + roomWidth; rx++) {
                        map[ry][rx] = 0;
                    }
                }
            }
        }

        // Connect rooms with corridors
        for (let i = 0; i < rooms.length - 1; i++) {
            const room1 = rooms[i];
            const room2 = rooms[i + 1];
            
            // Connect room centers
            const x1 = Math.floor(room1.x + room1.width / 2);
            const y1 = Math.floor(room1.y + room1.height / 2);
            const x2 = Math.floor(room2.x + room2.width / 2);
            const y2 = Math.floor(room2.y + room2.height / 2);

            // Create L-shaped corridor
            for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                map[y1][x] = 0;
            }
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                map[y][x2] = 0;
            }
        }

        // Ensure player starting position is clear
        map[1][1] = 0;
        map[1][2] = 0;
        map[2][1] = 0;
        map[2][2] = 0;

        return map;
    }

    spawnEnemies() {
        this.enemies = [];
        const numEnemies = Math.min(2 + this.level, 8); // Max 8 enemies
        
        // Find valid spawn positions (empty spaces in the map)
        const validPositions = [];
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 0) {
                    // Check if position is far enough from player
                    const dx = x - this.player.x;
                    const dy = y - this.player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > 5) { // Minimum distance from player
                        validPositions.push({ x, y });
                    }
                }
            }
        }

        // Shuffle valid positions
        for (let i = validPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validPositions[i], validPositions[j]] = [validPositions[j], validPositions[i]];
        }

        // Spawn enemies at random valid positions
        for (let i = 0; i < numEnemies && i < validPositions.length; i++) {
            let type = 'imp';
            if (this.level >= 3 && Math.random() < 0.3) type = 'cacodemon';
            if (this.level >= 5 && Math.random() < 0.2) type = 'baron';
            
            const pos = validPositions[i];
            this.enemies.push(new Enemy(pos.x + 0.5, pos.y + 0.5, type));
        }
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