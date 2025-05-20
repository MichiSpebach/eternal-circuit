import './style.css'
import { Game } from './game'

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    if (!canvas) {
        console.error('Could not find game canvas element')
        return
    }

    const game = new Game(canvas)
    
    // Start the game when the user clicks anywhere on the canvas
    canvas.addEventListener('click', () => {
        if (!game.isGameRunning()) {
            game.start()
        }
    }, { once: true })
})
