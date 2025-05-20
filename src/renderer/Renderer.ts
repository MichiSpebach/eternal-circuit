import { GameState, EnemyType } from '../types';

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get 2D context');
        this.ctx = context;
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    render(gameState: GameState): void {
        this.clear();
        this.drawCeiling();
        this.drawFloor();
        this.drawWalls(gameState);
        this.drawEnemies(gameState);
        this.drawProjectiles(gameState);
        this.drawWeapon(gameState);
        this.drawHUD(gameState);
    }

    private clear(): void {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawCeiling(): void {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
    }

    private drawFloor(): void {
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);
    }

    private drawWalls(gameState: GameState): void {
        const { player, map } = gameState;
        const numRays = this.canvas.width;
        const fov = Math.PI / 3;
        const angleStep = fov / numRays;
        
        for (let i = 0; i < numRays; i++) {
            const rayAngle = player.angle - fov/2 + angleStep * i;
            const { distance, wallContent } = this.castRay(player, rayAngle, map);
            
            const wallHeight = (this.canvas.height / distance) * 0.5;
            const wallX = i;
            const wallY = (this.canvas.height - wallHeight) / 2;
            
            // Draw base wall
            const brightness = Math.max(0, 1 - distance / 20);
            const color = Math.floor(brightness * 255);
            
            if (wallContent === 1) { // Regular wall
                this.ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
                this.ctx.fillRect(wallX, wallY, 1, wallHeight);
            } else if (wallContent === 6 || wallContent === 7) { // Flower wallpaper
                // Draw wall with flower pattern
                this.ctx.fillStyle = '#8B4513'; // Brown base color
                this.ctx.fillRect(wallX, wallY, 1, wallHeight);
                
                // Add flower pattern
                const flowerSize = Math.min(5, wallHeight / 4);
                const flowerX = wallX;
                const flowerY = wallY + Math.random() * (wallHeight - flowerSize);
                
                // Draw flower
                this.ctx.fillStyle = '#FF69B4'; // Pink
                this.ctx.beginPath();
                this.ctx.arc(flowerX, flowerY, flowerSize/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw petals
                this.ctx.fillStyle = '#FFB6C1'; // Light pink
                for (let p = 0; p < 5; p++) {
                    const angle = (p * Math.PI * 2) / 5;
                    const petalX = flowerX + Math.cos(angle) * flowerSize/2;
                    const petalY = flowerY + Math.sin(angle) * flowerSize/2;
                    this.ctx.beginPath();
                    this.ctx.arc(petalX, petalY, flowerSize/4, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // Draw center
                this.ctx.fillStyle = '#FFD700'; // Gold
                this.ctx.beginPath();
                this.ctx.arc(flowerX, flowerY, flowerSize/4, 0, Math.PI * 2);
                this.ctx.fill();
                
                if (wallContent === 7) { // Add leaves for type 7
                    this.ctx.fillStyle = '#228B22'; // Forest green
                    for (let l = 0; l < 2; l++) {
                        const angle = (l * Math.PI) + Math.PI/4;
                        const leafX = flowerX + Math.cos(angle) * flowerSize;
                        const leafY = flowerY + Math.sin(angle) * flowerSize;
                        this.ctx.beginPath();
                        this.ctx.ellipse(leafX, leafY, flowerSize/2, flowerSize/4, angle, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            } else if (wallContent === 2) { // Decoration
                this.ctx.fillStyle = '#A0522D'; // Sienna
                this.ctx.fillRect(wallX, wallY, 1, wallHeight);
            }
        }
    }

    private castRay(player: { x: number; y: number }, angle: number, map: number[][]): { distance: number; wallContent: number } {
        const rayDirX = Math.cos(angle);
        const rayDirY = Math.sin(angle);
        
        // Ray starting position
        let rayX = player.x;
        let rayY = player.y;
        
        // Length of ray from current position to next x or y-side
        let sideDistX: number;
        let sideDistY: number;
        
        // Length of ray from one x or y-side to next x or y-side
        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);
        
        // What direction to step in x or y-direction (either +1 or -1)
        const stepX = rayDirX >= 0 ? 1 : -1;
        const stepY = rayDirY >= 0 ? 1 : -1;
        
        // Which box of the map we're in
        let mapX = Math.floor(rayX);
        let mapY = Math.floor(rayY);
        
        // Calculate step and initial sideDist
        if (rayDirX < 0) {
            sideDistX = (rayX - mapX) * deltaDistX;
        } else {
            sideDistX = (mapX + 1.0 - rayX) * deltaDistX;
        }
        if (rayDirY < 0) {
            sideDistY = (rayY - mapY) * deltaDistY;
        } else {
            sideDistY = (mapY + 1.0 - rayY) * deltaDistY;
        }
        
        // Perform DDA
        let hit = false;
        let side = 0; // Was a NS or a EW wall hit?
        let wallContent = 0;
        
        while (!hit) {
            // Jump to next map square, either in x-direction, or in y-direction
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }
            
            // Check if ray has hit a wall or gone out of bounds
            if (mapX < 0 || mapX >= map[0].length || mapY < 0 || mapY >= map.length) {
                hit = true;
                wallContent = 1; // Treat out of bounds as a wall
            } else if (map[mapY][mapX] > 0) {
                hit = true;
                wallContent = map[mapY][mapX];
            }
        }
        
        // Calculate distance projected on camera direction
        let distance: number;
        if (side === 0) {
            distance = (mapX - rayX + (1 - stepX) / 2) / rayDirX;
        } else {
            distance = (mapY - rayY + (1 - stepY) / 2) / rayDirY;
        }
        
        return { distance, wallContent };
    }

    private drawEnemies(gameState: GameState): void {
        const { player, enemies, map } = gameState;
        
        enemies.forEach(enemy => {
            if (enemy.health <= 0) return; // Skip dead enemies

            // Calculate enemy position relative to player
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            
            // Calculate distance and angle
            const distance = Math.sqrt(dx * dx + dy * dy);
            let angle = Math.atan2(dy, dx) - player.angle;
            
            // Normalize angle
            while (angle > Math.PI) angle -= 2 * Math.PI;
            while (angle < -Math.PI) angle += 2 * Math.PI;
            
            // Only draw if enemy is in front of player and within view distance
            if (Math.abs(angle) < Math.PI / 2 && distance < 20) {
                // Check if there's a clear line of sight
                if (this.hasLineOfSight(player.x, player.y, enemy.x, enemy.y, map)) {
                    // Calculate screen position
                    const screenX = (angle / (Math.PI / 2)) * (this.canvas.width / 2) + this.canvas.width / 2;
                    const screenY = this.canvas.height / 2;
                    
                    // Calculate size based on distance
                    const size = Math.min(100, 1000 / distance);
                    
                    // Draw enemy body
                    this.ctx.fillStyle = this.getEnemyColor(enemy.type);
                    this.ctx.fillRect(screenX - size/2, screenY - size, size, size);
                    
                    // Draw enemy legs (moving based on time)
                    const legOffset = Math.sin(Date.now() / 200) * 10;
                    this.ctx.fillStyle = '#8B4513'; // Brown color for legs
                    
                    // Left leg
                    this.ctx.fillRect(screenX - size/4, screenY, size/6, size/2 + legOffset);
                    // Right leg
                    this.ctx.fillRect(screenX + size/12, screenY, size/6, size/2 - legOffset);
                    
                    // Draw health bar
                    const healthBarWidth = size;
                    const healthBarHeight = 5;
                    const healthPercentage = enemy.health / enemy.maxHealth;
                    
                    // Background (red)
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(screenX - healthBarWidth/2, screenY - size - 10, healthBarWidth, healthBarHeight);
                    
                    // Health (green)
                    this.ctx.fillStyle = '#00FF00';
                    this.ctx.fillRect(screenX - healthBarWidth/2, screenY - size - 10, healthBarWidth * healthPercentage, healthBarHeight);
                    
                    // Health bar border
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(screenX - healthBarWidth/2, screenY - size - 10, healthBarWidth, healthBarHeight);
                }
            }
        });
    }

    private hasLineOfSight(playerX: number, playerY: number, enemyX: number, enemyY: number, map: number[][]): boolean {
        const dx = enemyX - playerX;
        const dy = enemyY - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check points along the line of sight
        const steps = Math.ceil(distance * 2); // Check every 0.5 units
        for (let i = 1; i < steps; i++) {
            const checkX = playerX + (dx * i / steps);
            const checkY = playerY + (dy * i / steps);
            
            // Check if point is in a wall
            const mapX = Math.floor(checkX);
            const mapY = Math.floor(checkY);
            
            if (mapX >= 0 && mapX < map[0].length && 
                mapY >= 0 && mapY < map.length && 
                map[mapY][mapX] > 0) {
                return false; // Wall in the way
            }
        }
        return true; // Clear line of sight
    }

    private getEnemyColor(type: EnemyType): string {
        switch(type) {
            case 'imp': return '#FF4500'; // Orange-red
            case 'cacodemon': return '#FF0000'; // Red
            case 'baron': return '#8B0000'; // Dark red
            default: return '#FF0000';
        }
    }

    private drawProjectiles(gameState: GameState): void {
        const { projectiles, player } = gameState;
        const fov = Math.PI / 3;
        
        this.ctx.fillStyle = '#ff0';
        for (const proj of projectiles) {
            const screenX = (proj.angle - (player.angle - fov/2)) / fov * this.canvas.width;
            const screenY = this.canvas.height / 2;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    private drawWeapon(gameState: GameState): void {
        const { weapon } = gameState;
        const weaponX = this.canvas.width / 2;
        const weaponY = this.canvas.height - 100;
        
        this.ctx.save();
        
        // Weapon body
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.roundRect(weaponX - 25, weaponY, 50, 25, 5);
        this.ctx.fill();
        
        // Weapon grip
        this.ctx.fillStyle = '#34495e';
        this.ctx.beginPath();
        this.ctx.moveTo(weaponX - 15, weaponY + 25);
        this.ctx.lineTo(weaponX + 15, weaponY + 25);
        this.ctx.lineTo(weaponX + 10, weaponY + 45);
        this.ctx.lineTo(weaponX - 10, weaponY + 45);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Weapon barrel
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.beginPath();
        this.ctx.roundRect(weaponX - 8, weaponY - 15, 16, 15, 3);
        this.ctx.fill();
        
        // Decorative elements
        this.ctx.strokeStyle = '#95a5a6';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(weaponX - 20, weaponY + 5);
        this.ctx.lineTo(weaponX + 20, weaponY + 5);
        this.ctx.stroke();
        
        // Muzzle flash
        if (weapon.isShooting) {
            const gradient = this.ctx.createRadialGradient(
                weaponX, weaponY - 15, 0,
                weaponX, weaponY - 15, 20
            );
            gradient.addColorStop(0, '#ff69b4');
            gradient.addColorStop(0.5, '#ff1493');
            gradient.addColorStop(1, 'rgba(255, 20, 147, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(weaponX, weaponY - 15, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const sparkX = weaponX + Math.cos(angle) * 15;
                const sparkY = (weaponY - 15) + Math.sin(angle) * 15;
                
                this.ctx.beginPath();
                this.ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        this.ctx.restore();

        // Draw crosshair
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        const crosshairSize = 10;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - crosshairSize, centerY);
        this.ctx.lineTo(centerX + crosshairSize, centerY);
        this.ctx.moveTo(centerX, centerY - crosshairSize);
        this.ctx.lineTo(centerX, centerY + crosshairSize);
        this.ctx.stroke();
    }

    private drawHUD(gameState: GameState): void {
        const { player, enemies } = gameState;
        
        // Draw ammo counter
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Ammo: ${player.ammo}`, 20, 30);
        
        // Draw health bar
        const healthBarWidth = 200;
        const healthBarHeight = 20;
        const healthBarX = 20;
        const healthBarY = 60;
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(healthBarX, healthBarY, (player.health / 100) * healthBarWidth, healthBarHeight);

        // Draw enemy counter
        const aliveEnemies = enemies.filter(enemy => !enemy.isDead()).length;
        const totalEnemies = enemies.length;
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Enemies: ${aliveEnemies}/${totalEnemies}`, 20, 100);

        // Draw enemy type counters
        const enemyTypes = {
            'imp': 0,
            'cacodemon': 0,
            'baron': 0
        };

        enemies.forEach(enemy => {
            if (!enemy.isDead()) {
                enemyTypes[enemy.type]++;
            }
        });

        let yOffset = 130;
        Object.entries(enemyTypes).forEach(([type, count]) => {
            if (count > 0) {
                const color = this.getEnemyColor(type as EnemyType);
                this.ctx.fillStyle = color;
                this.ctx.fillText(`${type}: ${count}`, 20, yOffset);
                yOffset += 25;
            }
        });

        // Draw minimap
        this.drawMinimap(gameState);
    }

    private drawMinimap(gameState: GameState): void {
        const { player, enemies, map } = gameState;
        const minimapSize = 150;
        const minimapScale = 0.2;
        const minimapX = this.canvas.width - minimapSize - 20;
        const minimapY = 20;

        // Draw minimap background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);

        // Draw map walls
        this.ctx.fillStyle = '#666';
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                if (map[y][x] > 0) {
                    this.ctx.fillRect(
                        minimapX + x * minimapScale,
                        minimapY + y * minimapScale,
                        minimapScale,
                        minimapScale
                    );
                }
            }
        }

        // Draw enemies
        enemies.forEach(enemy => {
            if (!enemy.isDead()) {
                this.ctx.fillStyle = this.getEnemyColor(enemy.type);
                this.ctx.beginPath();
                this.ctx.arc(
                    minimapX + enemy.x * minimapScale,
                    minimapY + enemy.y * minimapScale,
                    2,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        });

        // Draw player with enhanced visibility
        const playerX = minimapX + player.x * minimapScale;
        const playerY = minimapY + player.y * minimapScale;

        // Draw player direction indicator (triangle)
        this.ctx.save();
        this.ctx.translate(playerX, playerY);
        this.ctx.rotate(player.angle);
        
        // Draw player triangle
        this.ctx.beginPath();
        this.ctx.moveTo(4, 0);
        this.ctx.lineTo(-3, -3);
        this.ctx.lineTo(-3, 3);
        this.ctx.closePath();
        
        // Fill with bright green
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fill();
        
        // Add white border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.restore();

        // Draw player position dot
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Draw minimap border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

        // Draw minimap title
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Minimap', minimapX + 5, minimapY + 15);
    }
} 