class Player {
    constructor() {
        this.x = 1.5;
        this.y = 1.5;
        this.angle = 0;
        this.speed = 0.1;
        this.turnSpeed = 0.05;
        this.health = 100;
        this.ammo = 30;
    }

    move(dx, dy, map) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (!this.checkCollision(newX, newY, map)) {
            this.x = newX;
            this.y = newY;
        }
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
        if (this.health <= 0) {
            this.health = 0;
            return true; // Player is dead
        }
        return false; // Player is still alive
    }

    addAmmo(amount) {
        this.ammo = Math.min(100, this.ammo + amount);
    }
} 