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
            const distance = this.castRay(rayAngle, player, map);
            
            const wallHeight = (this.canvas.height / distance) * 0.5;
            const wallX = i;
            const wallY = (this.canvas.height - wallHeight) / 2;
            
            const brightness = Math.max(0, 1 - distance / 20);
            const color = Math.floor(brightness * 255);
            
            this.ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
            this.ctx.fillRect(wallX, wallY, 1, wallHeight);
        }
    }

    castRay(angle, player, map) {
        const rayDirX = Math.cos(angle);
        const rayDirY = Math.sin(angle);
        
        let distance = 0;
        let hit = false;
        
        while (!hit && distance < 20) {
            distance += 0.1;
            const testX = Math.floor(player.x + rayDirX * distance);
            const testY = Math.floor(player.y + rayDirY * distance);
            
            if (testX < 0 || testX >= map[0].length || testY < 0 || testY >= map.length) {
                hit = true;
                distance = 20;
            } else if (map[testY][testX] === 1) {
                hit = true;
            }
        }
        
        return distance;
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
            
            // Only draw if enemy is in front of player
            if (Math.abs(relativeAngle) < Math.PI / 2) {
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
                map[mapY][mapX] === 1) {
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