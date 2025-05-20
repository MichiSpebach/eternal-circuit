import { GameState, Player, Enemy, Weapon, Projectile } from './types';
import { Renderer } from './renderer/Renderer';
import { Enemy as EnemyClass } from './enemy/Enemy';
import { AudioManager } from './audio/AudioManager';

export class Game {
    private canvas: HTMLCanvasElement;
    private renderer: Renderer;
    private gameState: GameState;
    private lastTime: number = 0;
    private isRunning: boolean = false;
    private audioManager: AudioManager;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.audioManager = new AudioManager();
        this.gameState = this.createInitialGameState();
        this.setupEventListeners();
    }

    private createInitialGameState(): GameState {
        const initialState: GameState = {
            player: {
                x: 1.5,
                y: 1.5,
                angle: 0,
                health: 100,
                ammo: 50
            },
            enemies: [],
            map: [],
            projectiles: [],
            weapon: {
                isShooting: false
            }
        };

        // Generate the level and update the game state
        initialState.map = this.generateLevel(initialState);
        return initialState;
    }

    private generateLevel(gameState: GameState): number[][] {
        // Erstelle eine 40x40 Karte
        const map: number[][] = Array(40).fill(null).map(() => Array(40).fill(1));

        // Definiere die Räume
        const rooms = [
            { x: 5, y: 5, width: 8, height: 8 },    // Startraum
            { x: 15, y: 5, width: 10, height: 10 }, // Hauptsaal
            { x: 5, y: 15, width: 8, height: 8 },   // Bibliothek
            { x: 15, y: 17, width: 10, height: 8 }, // Speisesaal
            { x: 27, y: 15, width: 8, height: 8 },  // Küche
            { x: 27, y: 5, width: 8, height: 8 },   // Geheimraum
            { x: 5, y: 25, width: 15, height: 10 }  // Garten
        ];

        // Definiere die erforderlichen Verbindungen
        const connections = [
            [0, 1], // Startraum -> Hauptsaal
            [1, 2], // Hauptsaal -> Bibliothek
            [1, 3], // Hauptsaal -> Speisesaal
            [3, 4], // Speisesaal -> Küche
            [1, 5], // Hauptsaal -> Geheimraum
            [2, 6], // Bibliothek -> Garten
            [3, 6]  // Speisesaal -> Garten
        ];

        // Erstelle die Räume
        for (const room of rooms) {
            for (let y = room.y; y < room.y + room.height; y++) {
                for (let x = room.x; x < room.x + room.width; x++) {
                    if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
                        map[y][x] = 0;
                    }
                }
            }
        }

        // Erstelle die Korridore und überprüfe die Verbindungen
        let attempts = 0;
        const maxAttempts = 5;
        let allConnected = false;

        while (!allConnected && attempts < maxAttempts) {
            // Erstelle die Korridore
            for (const [room1Index, room2Index] of connections) {
                const room1 = rooms[room1Index];
                const room2 = rooms[room2Index];

                // Wähle zufällige Punkte in den Räumen
                const x1 = room1.x + Math.floor(Math.random() * room1.width);
                const y1 = room1.y + Math.floor(Math.random() * room1.height);
                const x2 = room2.x + Math.floor(Math.random() * room2.width);
                const y2 = room2.y + Math.floor(Math.random() * room2.height);

                this.addCorridor(map, x1, y1, x2, y2);
            }

            // Überprüfe die Verbindungen
            allConnected = this.verifyConnections(map, rooms);
            if (!allConnected) {
                console.log(`Verbindungsüberprüfung fehlgeschlagen, Versuch ${attempts + 1}/${maxAttempts}`);
                attempts++;
            }
        }

        if (!allConnected) {
            console.warn("Konnte nicht alle Räume verbinden, aber das Level sollte trotzdem spielbar sein.");
        }

        // Setze die Startposition des Spielers
        gameState.player.x = rooms[0].x + rooms[0].width / 2;
        gameState.player.y = rooms[0].y + rooms[0].height / 2;

        // Spawne die Gegner
        this.spawnEnemies(gameState.enemies, map, rooms);

        return map;
    }

    private addCorridor(map: number[][], startX: number, startY: number, endX: number, endY: number): void {
        const width = 2; // Reduzierte Korridorbreite für bessere Lesbarkeit
        let x = startX;
        let y = startY;

        // Stelle sicher, dass der Startpunkt an einer Wand liegt
        if (map[y][x] !== 1) {
            // Suche den nächsten Wandpunkt
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const newX = x + dx;
                    const newY = y + dy;
                    if (newX >= 0 && newX < map[0].length && newY >= 0 && newY < map.length && map[newY][newX] === 1) {
                        x = newX;
                        y = newY;
                        break;
                    }
                }
            }
        }

        // Stelle sicher, dass der Endpunkt an einer Wand liegt
        if (map[endY][endX] !== 1) {
            // Suche den nächsten Wandpunkt
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const newX = endX + dx;
                    const newY = endY + dy;
                    if (newX >= 0 && newX < map[0].length && newY >= 0 && newY < map.length && map[newY][newX] === 1) {
                        endX = newX;
                        endY = newY;
                        break;
                    }
                }
            }
        }

        // Erstelle den Korridor mit verbesserten Verbindungen
        while (x !== endX || y !== endY) {
            // Erweitere den Korridor um die Wand
            for (let dy = -width; dy <= width; dy++) {
                for (let dx = -width; dx <= width; dx++) {
                    const newX = x + dx;
                    const newY = y + dy;
                    if (newX >= 0 && newX < map[0].length && newY >= 0 && newY < map.length) {
                        // Erstelle eine weichere Übergangszone
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance <= width) {
                            map[newY][newX] = 0;
                        }
                    }
                }
            }

            // Bewege dich in Richtung des Endpunkts
            if (Math.abs(endX - x) > Math.abs(endY - y)) {
                x += endX > x ? 1 : -1;
            } else {
                y += endY > y ? 1 : -1;
            }
        }

        // Erweitere den Endpunkt für bessere Verbindung
        for (let dy = -width; dy <= width; dy++) {
            for (let dx = -width; dx <= width; dx++) {
                const newX = endX + dx;
                const newY = endY + dy;
                if (newX >= 0 && newX < map[0].length && newY >= 0 && newY < map.length) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= width) {
                        map[newY][newX] = 0;
                    }
                }
            }
        }
    }

    private addDecorations(map: number[][], rooms: { x: number; y: number; width: number; height: number }[]): void {
        // Add pillars in main hall
        const mainHall = rooms[1];
        for (let x = mainHall.x + 2; x < mainHall.x + mainHall.width - 2; x += 4) {
            for (let y = mainHall.y + 2; y < mainHall.y + mainHall.height - 2; y += 4) {
                map[y][x] = 2; // Pillar
            }
        }

        // Add flower wallpaper
        rooms.forEach(room => {
            if (room.width > 5 && room.height > 5) {
                for (let y = room.y; y < room.y + room.height; y++) {
                    for (let x = room.x; x < room.x + room.width; x++) {
                        if (x === room.x || x === room.x + room.width - 1 ||
                            y === room.y || y === room.y + room.height - 1) {
                            map[y][x] = Math.random() < 0.5 ? 6 : 7; // Flower wallpaper
                        }
                    }
                }
            }
        });
    }

    private spawnEnemies(enemies: Enemy[], map: number[][], rooms: { x: number; y: number; width: number; height: number }[]): void {
        // Helper function to find valid spawn position
        const findValidSpawnPosition = (room: { x: number; y: number; width: number; height: number }): { x: number; y: number } | null => {
            const maxAttempts = 20;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                // Keep enemies away from walls
                const x = room.x + 2 + Math.random() * (room.width - 4);
                const y = room.y + 2 + Math.random() * (room.height - 4);
                
                // Check if position is valid (not in a wall and not too close to other enemies)
                if (map[Math.floor(y)][Math.floor(x)] === 0) {
                    const tooClose = enemies.some(enemy => {
                        const dx = enemy.x - x;
                        const dy = enemy.y - y;
                        return Math.sqrt(dx * dx + dy * dy) < 2;
                    });
                    
                    if (!tooClose) {
                        return { x, y };
                    }
                }
            }
            console.warn(`Could not find valid spawn position in room at (${room.x}, ${room.y})`);
            return null;
        };

        // Clear existing enemies
        enemies.length = 0;

        // Start room enemies (2 imps)
        const startRoom = rooms[0];
        for (let i = 0; i < 2; i++) {
            const pos = findValidSpawnPosition(startRoom);
            if (pos) {
                enemies.push(new EnemyClass(pos.x, pos.y, 'imp'));
                console.log(`Spawned imp in start room at (${pos.x}, ${pos.y})`);
            }
        }

        // Main hall enemies (2 imps)
        const mainHall = rooms[1];
        for (let i = 0; i < 2; i++) {
            const pos = findValidSpawnPosition(mainHall);
            if (pos) {
                enemies.push(new EnemyClass(pos.x, pos.y, 'imp'));
                console.log(`Spawned imp in main hall at (${pos.x}, ${pos.y})`);
            }
        }

        // Log enemy distribution
        const enemyCounts = {
            imp: enemies.filter(e => e.type === 'imp').length,
            cacodemon: enemies.filter(e => e.type === 'cacodemon').length,
            baron: enemies.filter(e => e.type === 'baron').length
        };

        console.log('Enemy distribution:', enemyCounts);
        console.log(`Total enemies spawned: ${enemies.length}`);

        // Verify all enemies are in valid positions
        enemies.forEach((enemy, index) => {
            const mapX = Math.floor(enemy.x);
            const mapY = Math.floor(enemy.y);
            if (mapX < 0 || mapX >= map[0].length || mapY < 0 || mapY >= map.length || map[mapY][mapX] > 0) {
                console.error(`Enemy ${index} (${enemy.type}) is in invalid position: (${enemy.x}, ${enemy.y})`);
            }
        });
    }

    private setupEventListeners(): void {
        // Mouse movement for looking around
        document.addEventListener('mousemove', (e) => {
            if (this.isRunning && document.pointerLockElement === this.canvas) {
                const sensitivity = 0.002;
                this.gameState.player.angle += e.movementX * sensitivity;
                
                // Clamp angle between -PI and PI
                while (this.gameState.player.angle > Math.PI) this.gameState.player.angle -= 2 * Math.PI;
                while (this.gameState.player.angle < -Math.PI) this.gameState.player.angle += 2 * Math.PI;
            }
        });

        // Lock pointer on click
        this.canvas.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                this.canvas.requestPointerLock();
            }
        });

        // Mouse click for shooting
        document.addEventListener('mousedown', (e) => {
            if (this.isRunning && e.button === 0 && document.pointerLockElement === this.canvas) {
                this.gameState.weapon.isShooting = true;
                this.shoot();
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.gameState.weapon.isShooting = false;
            }
        });

        // Keyboard controls
        const keys = new Set<string>();
        
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            keys.add(e.key.toLowerCase());
        });

        document.addEventListener('keyup', (e) => {
            keys.delete(e.key.toLowerCase());
        });

        // Game loop for movement
        const moveSpeed = 0.1;
        const rotateSpeed = 0.1;

        const gameLoop = () => {
            if (this.isRunning) {
                // Forward/Backward movement
                if (keys.has('w')) {
                    this.movePlayer(moveSpeed);
                }
                if (keys.has('s')) {
                    this.movePlayer(-moveSpeed);
                }

                // Strafe movement
                if (keys.has('a')) {
                    const strafeAngle = this.gameState.player.angle - Math.PI/2;
                    const newX = this.gameState.player.x + Math.cos(strafeAngle) * moveSpeed;
                    const newY = this.gameState.player.y + Math.sin(strafeAngle) * moveSpeed;
                    if (!this.checkCollision(newX, newY, this.gameState.map)) {
                        this.gameState.player.x = newX;
                        this.gameState.player.y = newY;
                    }
                }
                if (keys.has('d')) {
                    const strafeAngle = this.gameState.player.angle + Math.PI/2;
                    const newX = this.gameState.player.x + Math.cos(strafeAngle) * moveSpeed;
                    const newY = this.gameState.player.y + Math.sin(strafeAngle) * moveSpeed;
                    if (!this.checkCollision(newX, newY, this.gameState.map)) {
                        this.gameState.player.x = newX;
                        this.gameState.player.y = newY;
                    }
                }

                // Rotation
                if (keys.has('q')) {
                    this.gameState.player.angle -= rotateSpeed;
                }
                if (keys.has('e')) {
                    this.gameState.player.angle += rotateSpeed;
                }
            }
            requestAnimationFrame(gameLoop);
        };

        gameLoop();
    }

    private movePlayer(distance: number): void {
        const newX = this.gameState.player.x + Math.cos(this.gameState.player.angle) * distance;
        const newY = this.gameState.player.y + Math.sin(this.gameState.player.angle) * distance;

        // Check collision for both X and Y separately for smoother movement
        if (!this.checkCollision(newX, this.gameState.player.y, this.gameState.map)) {
            this.gameState.player.x = newX;
        }
        if (!this.checkCollision(this.gameState.player.x, newY, this.gameState.map)) {
            this.gameState.player.y = newY;
        }
    }

    private checkCollision(x: number, y: number, map: number[][]): boolean {
        if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) {
            return true;
        }

        const mapX = Math.floor(x);
        const mapY = Math.floor(y);
        return map[mapY][mapX] > 0;
    }

    private shoot(): void {
        if (this.gameState.player.ammo <= 0) return;

        this.gameState.player.ammo--;
        
        // Create multiple projectiles for shotgun spread
        const numProjectiles = 5; // Number of pellets
        const spreadAngle = 0.2; // Spread angle in radians
        
        for (let i = 0; i < numProjectiles; i++) {
            // Calculate spread angle for this projectile
            const spread = (Math.random() - 0.5) * spreadAngle;
            const projectileAngle = this.gameState.player.angle + spread;
            
            this.gameState.projectiles.push({
                x: this.gameState.player.x,
                y: this.gameState.player.y,
                angle: projectileAngle,
                distance: 0
            });
        }
        
        this.audioManager.playSound('shotgun');
    }

    private updateProjectiles(): void {
        const projectileSpeed = 0.2;
        this.gameState.projectiles = this.gameState.projectiles.filter(proj => {
            proj.x += Math.cos(proj.angle) * projectileSpeed;
            proj.y += Math.sin(proj.angle) * projectileSpeed;

            // Check for collisions with walls
            if (this.checkCollision(proj.x, proj.y, this.gameState.map)) {
                this.audioManager.playSound('hit');
                return false;
            }

            // Check for collisions with enemies
            for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
                const enemy = this.gameState.enemies[i];
                const dx = proj.x - enemy.x;
                const dy = proj.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 0.5) {
                    if (enemy.takeDamage(25)) {
                        this.gameState.enemies.splice(i, 1);
                        this.audioManager.playSound('enemyDeath');
                    } else {
                        this.audioManager.playSound('hit');
                    }
                    return false;
                }
            }

            return true;
        });
    }

    private updateEnemies(): void {
        this.gameState.enemies.forEach(enemy => {
            enemy.update(this.gameState.player, this.gameState.map);

            if (enemy.isAttacking) {
                const dx = this.gameState.player.x - enemy.x;
                const dy = this.gameState.player.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < enemy.attackRange) {
                    this.gameState.player.health -= enemy.damage;
                    this.audioManager.playSound('playerHurt');
                }
            }
        });
    }

    public isGameRunning(): boolean {
        return this.isRunning;
    }

    public start(): void {
        this.isRunning = true;
        this.lastTime = performance.now();
        
        // Request pointer lock when game starts
        this.canvas.requestPointerLock();
        
        // Handle pointer lock changes
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement !== this.canvas) {
                this.isRunning = false;
                this.audioManager.stopAllSounds();
            } else {
                this.isRunning = true;
                this.audioManager.playBackgroundMusic();
            }
        });

        // Start background music and ambient sound
        this.audioManager.playBackgroundMusic();
        this.audioManager.playSound('ambient');

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    private gameLoop(currentTime: number): void {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.updateProjectiles();
        this.updateEnemies();

        // Check for victory condition
        if (this.gameState.enemies.length === 0) {
            this.showVictory();
            return;
        }

        // Check for game over condition
        if (this.gameState.player.health <= 0) {
            this.showGameOver();
            return;
        }

        this.renderer.render(this.gameState);

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    private showVictory(): void {
        this.isRunning = false;
        this.audioManager.playSound('levelUp');

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
            <p>Level abgeschlossen!</p>
            <p style="font-size: 24px; margin-top: 20px;">Drücke ENTER oder klicke zum Fortfahren</p>
        `;
        document.body.appendChild(victoryDiv);

        // Add click listener to continue
        victoryDiv.addEventListener('click', () => {
            document.body.removeChild(victoryDiv);
            this.nextLevel();
        });

        // Add keyboard listener for Enter key
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                document.body.removeChild(victoryDiv);
                document.removeEventListener('keydown', handleKeyPress);
                this.nextLevel();
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    }

    private showGameOver(): void {
        this.isRunning = false;
        this.audioManager.playSound('playerHurt');

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
            <p style="font-size: 24px; margin-top: 20px;">Drücke ENTER oder klicke zum Neustarten</p>
        `;
        document.body.appendChild(gameOverDiv);

        // Add click listener to restart
        gameOverDiv.addEventListener('click', () => {
            document.body.removeChild(gameOverDiv);
            this.restartGame();
        });

        // Add keyboard listener for Enter key
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                document.body.removeChild(gameOverDiv);
                document.removeEventListener('keydown', handleKeyPress);
                this.restartGame();
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    }

    private restartGame(): void {
        // Reset game state
        this.gameState = this.createInitialGameState();
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    private nextLevel(): void {
        // Reset game state
        this.gameState = this.createInitialGameState();
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    public stop(): void {
        this.isRunning = false;
        this.audioManager.stopAllSounds();
    }

    private verifyConnections(map: number[][], rooms: { x: number; y: number; width: number; height: number }[]): boolean {
        const visited = new Set<number>();
        const queue: number[] = [0]; // Start with the first room
        visited.add(0);

        while (queue.length > 0) {
            const currentRoom = queue.shift()!;
            const room = rooms[currentRoom];

            // Check all adjacent cells of the current room
            for (let y = room.y - 1; y <= room.y + room.height; y++) {
                for (let x = room.x - 1; x <= room.x + room.width; x++) {
                    if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
                        // If we find a corridor, check which room it leads to
                        if (map[y][x] === 0) {
                            for (let i = 0; i < rooms.length; i++) {
                                if (i !== currentRoom && !visited.has(i)) {
                                    const otherRoom = rooms[i];
                                    if (this.isConnectedToRoom(x, y, otherRoom)) {
                                        visited.add(i);
                                        queue.push(i);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Check if all rooms were visited
        return visited.size === rooms.length;
    }

    private isConnectedToRoom(x: number, y: number, room: { x: number; y: number; width: number; height: number }): boolean {
        return x >= room.x - 1 && x <= room.x + room.width &&
               y >= room.y - 1 && y <= room.y + room.height;
    }
} 