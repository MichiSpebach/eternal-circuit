class Weapon {
    constructor() {
        this.isShooting = false;
        this.lastShot = 0;
        this.fireRate = 300; // Schnellere Schussrate
        this.damage = 40; // Mehr Schaden
        this.range = 15; // Größere Reichweite
    }

    canShoot() {
        const now = Date.now();
        return now - this.lastShot >= this.fireRate;
    }

    shoot(player, audioManager) {
        if (!this.canShoot()) return null;
        
        this.lastShot = Date.now();
        
        if (player.ammo > 0) {
            player.ammo--;
            this.isShooting = true;
            audioManager.createShootSound();

            // Create a new projectile
            const projectile = {
                x: player.x,
                y: player.y,
                angle: player.angle,
                distance: 0
            };

            // Reset shooting state after animation
            setTimeout(() => {
                this.isShooting = false;
            }, 100);

            return projectile;
        } else {
            audioManager.createEmptySound();
            return null;
        }
    }
} 