
export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Player extends Rect {
    vx: number;
    vy: number;
    isGrounded: boolean;
    facingRight: boolean;
    invulnerable: number; // Time in frames
}

export interface Platform extends Rect {
    id: string;
    type: 'floor' | 'block' | 'text';
    text?: string; // For "AI MEGA PLANT"
    color?: string;
}

export interface Coin {
    id: number;
    x: number;
    y: number;
    size: number;
    collected: boolean;
    rotationOffset: number;
}

export interface Laser extends Rect {
    id: number;
    vx: number;
    life: number;
}

export interface Enemy extends Rect {
    id: number;
    type: 'robot';
    vx: number;
    patrolStart: number;
    patrolEnd: number;
    dead: boolean;
    deadTimer: number; 
    shootTimer: number; // Cooldown for shooting lasers
}

export interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
    type?: 'trail' | 'sparkle' | 'explosion';
}

export interface Candle {
    x: number;
    y: number;
    w: number;
    h: number;
    wickH: number;
    isGreen: boolean;
}

export enum GameState {
    MENU,
    PLAYING,
    GAME_OVER,
    VICTORY
}
