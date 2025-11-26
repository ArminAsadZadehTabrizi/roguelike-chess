import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';
import { PathSelectionScene } from './scenes/PathSelectionScene';
import { ShopScene } from './scenes/ShopScene';
import { BlacksmithScene } from './scenes/BlacksmithScene';
import { GameOverScene } from './scenes/GameOverScene';

/**
 * Main Phaser game configuration for Roguelike Chess
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 920,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BattleScene,
    PathSelectionScene,
    ShopScene,
    BlacksmithScene,
    GameOverScene
  ],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  }
};

// Create the game instance
const game = new Phaser.Game(config);

// Log game initialization
console.log('Roguelike Chess - Game initialized');
console.log('Repository: https://github.com/ArminAsadZadehTabrizi/roguelike-chess');

// Export for potential external access
export default game;

