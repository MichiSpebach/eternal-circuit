import { EnemyType } from '../types';

type SoundType = 'shoot' | 'hit' | 'enemyDeath' | 'playerHurt' | 'levelUp' | 'pickup' | 'ambient' | 'shotgun';

export class AudioManager {
    private sounds: Map<SoundType, HTMLAudioElement>;
    private backgroundMusic: HTMLAudioElement;
    private isMusicPlaying: boolean = false;

    constructor() {
        this.sounds = new Map();
        this.backgroundMusic = new Audio('./assets/sounds/background.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.3; // Set background music volume to 30%
        
        // Load all sound effects
        this.loadSound('shoot', './assets/sounds/shoot.mp3');
        this.loadSound('hit', './assets/sounds/hit.mp3');
        this.loadSound('enemyDeath', './assets/sounds/enemy_death.mp3');
        this.loadSound('playerHurt', './assets/sounds/player_hurt.mp3');
        this.loadSound('levelUp', './assets/sounds/level_up.mp3');
        this.loadSound('pickup', './assets/sounds/pickup.mp3');
        this.loadSound('ambient', './assets/sounds/ambient.mp3');
        this.loadSound('shotgun', './assets/sounds/shotgun.mp3');
    }

    private loadSound(name: SoundType, path: string): void {
        const audio = new Audio(path);
        audio.volume = 0.5; // Set sound effects volume to 50%
        this.sounds.set(name, audio);
    }

    playSound(name: SoundType): void {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => console.warn(`Could not play sound ${name}:`, error));
        }
    }

    playBackgroundMusic(): void {
        if (!this.isMusicPlaying) {
            this.backgroundMusic.play().catch(error => console.warn('Could not play background music:', error));
            this.isMusicPlaying = true;
        }
    }

    stopBackgroundMusic(): void {
        if (this.isMusicPlaying) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.isMusicPlaying = false;
        }
    }

    stopAllSounds(): void {
        this.sounds.forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
        this.stopBackgroundMusic();
    }

    setVolume(volume: number): void {
        // Clamp volume between 0 and 1
        volume = Math.max(0, Math.min(1, volume));
        
        // Update background music volume
        this.backgroundMusic.volume = volume * 0.3; // Keep background music at 30% of master volume
        
        // Update sound effects volume
        this.sounds.forEach(sound => {
            sound.volume = volume * 0.5; // Keep sound effects at 50% of master volume
        });
    }
} 