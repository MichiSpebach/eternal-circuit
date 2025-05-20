export type EnemyType = 'imp' | 'cacodemon' | 'baron';

export interface Enemy {
    x: number;
    y: number;
    type: EnemyType;
    speed: number;
    health: number;
    maxHealth: number;
    damage: number;
    attackRange: number;
    isAttacking: boolean;
    takeDamage: (amount: number) => boolean;
    update: (player: { x: number; y: number }, map: number[][]) => void;
    isDead: () => boolean;
}

export interface Player {
    x: number;
    y: number;
    angle: number;
    health: number;
    ammo: number;
}

export interface Weapon {
    isShooting: boolean;
}

export interface Projectile {
    x: number;
    y: number;
    angle: number;
    distance: number;
}

export interface GameState {
    player: Player;
    enemies: Enemy[];
    map: number[][];
    projectiles: Projectile[];
    weapon: Weapon;
}

export interface Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    render: (gameState: GameState) => void;
} 