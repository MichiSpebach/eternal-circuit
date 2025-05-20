class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.speed = this.getSpeed();
        this.health = this.getMaxHealth();
        this.maxHealth = this.health;
        this.damage = this.getDamage();
        this.attackRange = this.getAttackRange();
        this.isAttacking = false;
    }

    getSpeed() {
        switch(this.type) {
            case 'imp': return 0.03;
            case 'cacodemon': return 0.02;
            case 'baron': return 0.01;
            default: return 0.02;
        }
    }

    getMaxHealth() {
        switch(this.type) {
            case 'imp': return 50;
            case 'cacodemon': return 100;
            case 'baron': return 200;
            default: return 50;
        }
    }

    getDamage() {
        switch(this.type) {
            case 'imp': return 10;
            case 'cacodemon': return 20;
            case 'baron': return 40;
            default: return 10;
        }
    }

    getAttackRange() {
        switch(this.type) {
            case 'imp': return 1.0;
            case 'cacodemon': return 1.5;
            case 'baron': return 2.0;
            default: return 1.0;
        }
    }

    update(player, map) {
        // Calculate direction to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Move towards player if not too close
        if (distance > this.attackRange) {
            const angle = Math.atan2(dy, dx);
            const newX = this.x + Math.cos(angle) * this.speed;
            const newY = this.y + Math.sin(angle) * this.speed;
            
            // Check if new position is valid
            if (!this.checkCollision(newX, newY, map)) {
                this.x = newX;
                this.y = newY;
            }
        }
        
        // Set attacking state
        this.isAttacking = distance <= this.attackRange;
    }

    checkCollision(x, y, map) {
        if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) {
            return true;
        }

        const mapX = Math.floor(x);
        const mapY = Math.floor(y);
        return map[mapY][mapX] > 0;
    }

    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }

    isDead() {
        return this.health <= 0;
    }
} 