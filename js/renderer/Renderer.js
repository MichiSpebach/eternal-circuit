class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    render(gameState) {
        this.clear();
        this.drawCeiling();
        this.drawFloor();
        this.drawWalls(gameState);
        this.drawEnemies(gameState);
        this.drawProjectiles(gameState);
        this.drawWeapon(gameState);
        this.drawHUD(gameState);
    }

    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCeiling() {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
    }

    drawFloor() {
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);
    }

    drawWalls(gameState) {
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
            } else if (wallContent === 6 || wallContent === 7) { // Flower wall
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

    castRay(player, angle, map) {
        const rayDirX = Math.cos(angle);
        const rayDirY = Math.sin(angle);
        
        // Ray starting position
        let rayX = player.x;
        let rayY = player.y;
        
        // Length of ray from current position to next x or y-side
        let sideDistX;
        let sideDistY;
        
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
            
            // Check if ray has hit a wall
            if (map[mapY][mapX] > 0) {
                hit = true;
                wallContent = map[mapY][mapX];
            }
        }
        
        // Calculate distance projected on camera direction
        let distance;
        if (side === 0) {
            distance = (mapX - rayX + (1 - stepX) / 2) / rayDirX;
        } else {
            distance = (mapY - rayY + (1 - stepY) / 2) / rayDirY;
        }
        
        return { distance, wallContent };
    }

    drawEnemies(gameState) {
        const { player, enemies, map } = gameState;
        
        enemies.forEach(enemy => {
            if (enemy.health <= 0) return; // Skip dead enemies

            // Calculate angle and distance to enemy
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Calculate relative angle to player's view
            let relativeAngle = this.normalizeAngle(angle - player.angle);
            
            // Only draw if enemy is in front of player and within view distance
            if (Math.abs(relativeAngle) < Math.PI / 2 && distance < 20) {
                // Check if there's a clear line of sight to the enemy
                if (this.hasLineOfSight(player, enemy, map)) {
                    // Calculate screen position
                    const screenX = (relativeAngle / (Math.PI / 2)) * (this.canvas.width / 2) + this.canvas.width / 2;
                    const screenY = this.canvas.height / 2;
                    
                    // Calculate size based on distance
                    const size = Math.min(100, 1000 / distance);
                    
                    // Draw enemy
                    this.ctx.save();
                    this.ctx.translate(screenX, screenY);
                    this.ctx.scale(size / 100, size / 100);
                    
                    // Draw enemy body
                    this.ctx.fillStyle = this.getEnemyColor(enemy.type);
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 50, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Draw enemy eyes
                    this.ctx.fillStyle = '#fff';
                    this.ctx.beginPath();
                    this.ctx.arc(-20, -10, 10, 0, Math.PI * 2);
                    this.ctx.arc(20, -10, 10, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Draw enemy pupils
                    this.ctx.fillStyle = '#f00';
                    this.ctx.beginPath();
                    this.ctx.arc(-20, -10, 5, 0, Math.PI * 2);
                    this.ctx.arc(20, -10, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.restore();
                }
            }
        });
    }

    hasLineOfSight(player, enemy, map) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check points along the line of sight
        const steps = Math.ceil(distance * 2); // Check every 0.5 units
        for (let i = 1; i < steps; i++) {
            const checkX = player.x + (dx * i / steps);
            const checkY = player.y + (dy * i / steps);
            
            // Check if point is in a wall
            const mapX = Math.floor(checkX);
            const mapY = Math.floor(checkY);
            
            if (mapX >= 0 && mapX < map[0].length && 
                mapY >= 0 && mapY < map.length && 
                map[mapY][mapX] > 0) { // Changed from === 1 to > 0 to check all wall types
                return false; // Wall in the way
            }
        }
        return true; // Clear line of sight
    }

    getEnemyColor(enemy) {
        switch(enemy.type) {
            case 'imp': return '#8b0000';
            case 'cacodemon': return '#ff4500';
            case 'baron': return '#006400';
            default: return '#8b0000';
        }
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    drawProjectiles(gameState) {
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

    drawWeapon(gameState) {
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

    drawHUD(gameState) {
        const { player } = gameState;
        
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
    }
} 