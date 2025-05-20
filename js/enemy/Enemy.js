class Enemy {
    constructor(x, y, type = 'imp') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.angle = 0;
        this.speed = 0.02;
        this.health = this.getMaxHealth();
        this.damage = this.getDamage();
        this.attackRange = 0.8;
        this.attackCooldown = 2000;
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

    update(player, map) {
        if (this.health <= 0) {
            this.deathAnimation += 0.1;
            return;
        }

        // Calculate angle to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.angle = Math.atan2(dy, dx);

        // Move towards player if not too close
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > this.attackRange) {
            const newX = this.x + Math.cos(this.angle) * this.speed;
            const newY = this.y + Math.sin(this.angle) * this.speed;
            
            if (!this.checkCollision(newX, newY, map)) {
                this.x = newX;
                this.y = newY;
            }
        }

        // Attack if in range
        if (distance <= this.attackRange && this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackCooldown = 1000; // 1 second cooldown between attacks
            setTimeout(() => {
                this.isAttacking = false;
            }, 200);
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= 16; // Assuming 60 FPS
        }
    }

    checkCollision(x, y, map) {
        const mapX = Math.floor(x);
        const mapY = Math.floor(y);
        return map[mapY] && map[mapY][mapX] === 1;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    isDead() {
        return this.health <= 0 && this.deathAnimation >= 1;
    }
} 