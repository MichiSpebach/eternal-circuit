class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.isLoading = true;
        this.loadSounds().then(() => {
            this.isLoading = false;
            console.log('All sounds loaded successfully');
        }).catch(error => {
            console.error('Error loading sounds:', error);
            this.isLoading = false;
        });
    }

    async loadSounds() {
        const soundFiles = {
            shoot: '../../assets/sounds/shoot.mp3',
            hit: '../../assets/sounds/hit.mp3',
            enemyDeath: '../../assets/sounds/enemy_death.mp3',
            playerHurt: '../../assets/sounds/player_hurt.mp3',
            victory: '../../assets/sounds/victory.mp3',
            levelUp: '../../assets/sounds/level_up.mp3'
        };

        const loadPromises = Object.entries(soundFiles).map(async ([name, path]) => {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`Failed to load ${name}: ${response.statusText}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.sounds[name] = audioBuffer;
                console.log(`Loaded sound: ${name}`);
            } catch (error) {
                console.error(`Error loading sound ${name}:`, error);
                // Create a fallback oscillator sound
                this.createFallbackSound(name);
            }
        });

        await Promise.all(loadPromises);
    }

    createFallbackSound(name) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch(name) {
            case 'shoot':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.1);
                break;
            case 'hit':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.1);
                break;
            case 'enemyDeath':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(55, this.audioContext.currentTime + 0.3);
                break;
            case 'playerHurt':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.2);
                break;
            case 'victory':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.5);
                break;
            case 'levelUp':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.3);
                break;
        }
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    playSound(name) {
        if (this.isLoading) {
            console.warn('Sounds are still loading...');
            return;
        }

        if (!this.sounds[name]) {
            console.warn(`Sound ${name} not loaded, using fallback`);
            this.createFallbackSound(name);
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.connect(this.audioContext.destination);
        source.start();
    }

    createShootSound() {
        this.playSound('shoot');
    }

    createEnemyHitSound() {
        this.playSound('hit');
    }

    createEnemyDeathSound() {
        this.playSound('enemyDeath');
    }

    createPlayerHurtSound() {
        this.playSound('playerHurt');
    }

    createVictorySound() {
        this.playSound('victory');
    }

    createLevelUpSound() {
        this.playSound('levelUp');
    }

    resume() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
} 