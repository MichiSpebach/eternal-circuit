class Enemy {
    constructor(x, y, type = 'imp') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.angle = 0;
        this.speed = this.getSpeed();
        this.health = this.getMaxHealth();
        this.damage = this.getDamage();
        this.attackRange = 0.8;
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.deathAnimation = 0;
    }

    getMaxHealth() {
        switch(this.type) {
            case 'imp': return 60;
            case 'cacodemon': return 400;
            case 'baron': return 1000;
            default: return 60;
        }
    }

    getDamage() {
        switch(this.type) {
            case 'imp': return 5;
            case 'cacodemon': return 10;
            case 'baron': return 15;
            default: return 5;
        }
    }

    getSpeed() {
        switch(this.type) {
            case 'imp': return 0.02;
            case 'cacodemon': return 0.01;
            case 'baron': return 0.005;
            default: return 0.02;
        }
    }

    update(player, map) {
        if (this.health <= 0) {
            this.deathAnimation += 0.1;
            return;
        }

        // Calculate distance and angle to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Check if there's a clear line of sight to the player
        if (this.hasLineOfSight(player, map)) {
            // Move towards player
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;

            // Check for wall collisions
            if (this.checkCollision(map)) {
                // Move back if collision
                this.x -= Math.cos(angle) * this.speed;
                this.y -= Math.sin(angle) * this.speed;
            }

            // Attack if in range
            if (distance <= this.attackRange) {
                const currentTime = Date.now();
                if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                    this.isAttacking = true;
                    this.lastAttackTime = currentTime;
                    this.attackCooldown = 1000; // 1 second between attacks
                }
            } else {
                this.isAttacking = false;
            }
        } else {
            this.isAttacking = false;
        }
    }

    hasLineOfSight(player, map) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Check points along the line of sight
        const steps = Math.ceil(distance * 2); // Check every 0.5 units
        for (let i = 1; i < steps; i++) {
            const checkX = this.x + (dx * i / steps);
            const checkY = this.y + (dy * i / steps);
            
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

    checkCollision(map) {
        const mapX = Math.floor(this.x);
        const mapY = Math.floor(this.y);
        
        // Check if position is within map bounds
        if (mapX < 0 || mapX >= map[0].length || mapY < 0 || mapY >= map.length) {
            return true;
        }
        
        // Check if position is in a wall
        return map[mapY][mapX] === 1;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    isDead() {
        return this.health <= 0 && this.deathAnimation >= 1;
    }
} 