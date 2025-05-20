import { EnemyType } from '../types';

export class Enemy {
    x: number;
    y: number;
    type: EnemyType;
    speed: number;
    health: number;
    maxHealth: number;
    damage: number;
    attackRange: number;
    isAttacking: boolean;
    private lastAttackTime: number;
    private attackCooldown: number;
    private state: 'idle' | 'chase' | 'attack' | 'hurt';
    private stateTimer: number;
    private targetX: number;
    private targetY: number;

    constructor(x: number, y: number, type: EnemyType) {
        console.log(`Creating enemy of type ${type} at (${x}, ${y})`);
        this.x = x;
        this.y = y;
        this.type = type;
        this.speed = this.getSpeed();
        this.health = this.getMaxHealth();
        this.maxHealth = this.health;
        this.damage = this.getDamage();
        this.attackRange = this.getAttackRange();
        this.isAttacking = false;
        this.lastAttackTime = 0;
        this.attackCooldown = this.getAttackCooldown();
        this.state = 'idle';
        this.stateTimer = 0;
        this.targetX = x;
        this.targetY = y;
        console.log(`Enemy initialized with health: ${this.health}, speed: ${this.speed}, damage: ${this.damage}`);
    }

    private getSpeed(): number {
        switch(this.type) {
            case 'imp': return 0.03;
            case 'cacodemon': return 0.02;
            case 'baron': return 0.01;
            default: return 0.02;
        }
    }

    private getMaxHealth(): number {
        switch(this.type) {
            case 'imp': return 50;
            case 'cacodemon': return 100;
            case 'baron': return 200;
            default: return 50;
        }
    }

    private getDamage(): number {
        switch(this.type) {
            case 'imp': return 10;
            case 'cacodemon': return 20;
            case 'baron': return 40;
            default: return 10;
        }
    }

    private getAttackRange(): number {
        switch(this.type) {
            case 'imp': return 1.0;
            case 'cacodemon': return 1.5;
            case 'baron': return 2.0;
            default: return 1.0;
        }
    }

    private getAttackCooldown(): number {
        switch(this.type) {
            case 'imp': return 1000;
            case 'cacodemon': return 1500;
            case 'baron': return 2000;
            default: return 1000;
        }
    }

    update(player: { x: number; y: number }, map: number[][]): void {
        const currentTime = Date.now();
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Update state
        if (this.state === 'hurt' && currentTime - this.stateTimer > 500) {
            this.state = 'chase';
        }

        // State machine
        switch (this.state) {
            case 'idle':
                if (distance < 10) {
                    this.state = 'chase';
                }
                break;

            case 'chase':
                if (distance > 15) {
                    this.state = 'idle';
                } else if (distance <= this.attackRange) {
                    this.state = 'attack';
                } else {
                    this.moveTowardsPlayer(player, map);
                }
                break;

            case 'attack':
                if (distance > this.attackRange) {
                    this.state = 'chase';
                } else {
                    this.attack(player, currentTime);
                }
                break;
        }

        // Update attack state
        this.isAttacking = this.state === 'attack' && 
            currentTime - this.lastAttackTime < 500;
    }

    private moveTowardsPlayer(player: { x: number; y: number }, map: number[][]): void {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);

        // Calculate new position
        const newX = this.x + Math.cos(angle) * this.speed;
        const newY = this.y + Math.sin(angle) * this.speed;

        // Check if new position is valid
        if (!this.checkCollision(newX, newY, map)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Try to move along walls
            const wallAngle = angle + Math.PI/2;
            const wallX = this.x + Math.cos(wallAngle) * this.speed;
            const wallY = this.y + Math.sin(wallAngle) * this.speed;
            
            if (!this.checkCollision(wallX, wallY, map)) {
                this.x = wallX;
                this.y = wallY;
            } else {
                const wallAngle2 = angle - Math.PI/2;
                const wallX2 = this.x + Math.cos(wallAngle2) * this.speed;
                const wallY2 = this.y + Math.sin(wallAngle2) * this.speed;
                
                if (!this.checkCollision(wallX2, wallY2, map)) {
                    this.x = wallX2;
                    this.y = wallY2;
                }
            }
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

    private attack(player: { x: number; y: number }, currentTime: number): void {
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
            this.isAttacking = true;
            this.lastAttackTime = currentTime;
        }
    }

    takeDamage(amount: number): boolean {
        this.health -= amount;
        this.state = 'hurt';
        this.stateTimer = Date.now();
        return this.health <= 0;
    }

    isDead(): boolean {
        return this.health <= 0;
    }

    draw(ctx: CanvasRenderingContext2D, playerX: number, playerY: number): void {
        const dx = this.x - playerX;
        const dy = this.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Calculate screen position
        const screenX = Math.floor((angle / Math.PI + 1) * ctx.canvas.width / 2);
        const screenY = Math.floor(ctx.canvas.height / 2);
        
        // Calculate size based on distance
        const size = Math.floor(100 / distance);
        
        // Draw enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + size/2, size/2, size/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw enemy body
        ctx.fillStyle = '#8B0000'; // Dark red base color
        ctx.beginPath();
        ctx.arc(screenX, screenY - size/4, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw demonic features
        // Horns
        ctx.fillStyle = '#4B0082'; // Dark purple for horns
        ctx.beginPath();
        ctx.moveTo(screenX - size/3, screenY - size/2);
        ctx.lineTo(screenX - size/4, screenY - size);
        ctx.lineTo(screenX - size/6, screenY - size/2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(screenX + size/3, screenY - size/2);
        ctx.lineTo(screenX + size/4, screenY - size);
        ctx.lineTo(screenX + size/6, screenY - size/2);
        ctx.fill();
        
        // Glowing eyes
        const eyeGlow = ctx.createRadialGradient(
            screenX - size/4, screenY - size/4, 0,
            screenX - size/4, screenY - size/4, size/8
        );
        eyeGlow.addColorStop(0, '#FF0000');
        eyeGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.arc(screenX - size/4, screenY - size/4, size/8, 0, Math.PI * 2);
        ctx.fill();
        
        const eyeGlow2 = ctx.createRadialGradient(
            screenX + size/4, screenY - size/4, 0,
            screenX + size/4, screenY - size/4, size/8
        );
        eyeGlow2.addColorStop(0, '#FF0000');
        eyeGlow2.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = eyeGlow2;
        ctx.beginPath();
        ctx.arc(screenX + size/4, screenY - size/4, size/8, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size/3, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Draw health bar
        const healthBarWidth = size;
        const healthBarHeight = 4;
        const healthPercentage = this.health / this.maxHealth;
        
        // Health bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - healthBarWidth/2, screenY + size/2, healthBarWidth, healthBarHeight);
        
        // Health bar fill
        ctx.fillStyle = healthPercentage > 0.5 ? '#0f0' : healthPercentage > 0.25 ? '#ff0' : '#f00';
        ctx.fillRect(screenX - healthBarWidth/2, screenY + size/2, healthBarWidth * healthPercentage, healthBarHeight);
    }
} 