import Phaser from 'phaser';
import { RunState } from '../core/RunState';

/**
 * GameOverScene displays when the player loses all units
 */
export class GameOverScene extends Phaser.Scene {
  private runState!: RunState;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { runState: RunState }) {
    this.runState = data.runState;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Game Over title
    this.add.text(width / 2, height / 2 - 150, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Stats
    const statsText = `You reached Stage ${this.runState.getCurrentStage()}\n\nFinal Gold: ${this.runState.getGold()}`;
    this.add.text(width / 2, height / 2 - 20, statsText, {
      fontSize: '24px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Restart button
    const restartButton = this.add.rectangle(width / 2, height / 2 + 100, 200, 60, 0x00aa00)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.restartGame())
      .on('pointerover', () => restartButton.setFillStyle(0x00cc00))
      .on('pointerout', () => restartButton.setFillStyle(0x00aa00));

    this.add.text(width / 2, height / 2 + 100, 'Play Again', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  /**
   * Restarts the game with a new run
   */
  private restartGame(): void {
    const newRunState = new RunState();
    this.scene.start('BattleScene', { runState: newRunState });
  }
}

