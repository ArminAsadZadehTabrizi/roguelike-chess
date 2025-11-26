import Phaser from 'phaser';
import { RunState } from '../core/RunState';
import { GamePhase, PathType } from '../core/types';

/**
 * PathSelectionScene allows the player to choose between Shop and Blacksmith
 */
export class PathSelectionScene extends Phaser.Scene {
  private runState!: RunState;

  constructor() {
    super({ key: 'PathSelectionScene' });
  }

  init(data: { runState: RunState }) {
    this.runState = data.runState;
    this.runState.setGamePhase(GamePhase.PATH_SELECTION);
  }

  create() {
    const { width, height } = this.cameras.main;

    // Title
    this.add.text(width / 2, 100, 'Choose Your Path', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Victory message
    this.add.text(width / 2, 180, `Stage ${this.runState.getCurrentStage() - 1} Complete!`, {
      fontSize: '24px',
      color: '#00ff00'
    }).setOrigin(0.5);

    // Gold display
    this.add.text(width / 2, 220, `Gold: ${this.runState.getGold()}`, {
      fontSize: '20px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // Shop path button
    const shopButton = this.add.rectangle(width / 2 - 200, height / 2, 300, 400, 0x2a5298)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.selectPath(PathType.SHOP))
      .on('pointerover', () => shopButton.setFillStyle(0x3a6bb8))
      .on('pointerout', () => shopButton.setFillStyle(0x2a5298));

    this.add.text(width / 2 - 200, height / 2 - 150, '🛒 SHOP', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2 - 200, height / 2 - 80, 'Buy new pieces\nBoard expansions\nConsumables', {
      fontSize: '18px',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5);

    // Blacksmith path button
    const blacksmithButton = this.add.rectangle(width / 2 + 200, height / 2, 300, 400, 0x8b4513)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.selectPath(PathType.BLACKSMITH))
      .on('pointerover', () => blacksmithButton.setFillStyle(0xab6523))
      .on('pointerout', () => blacksmithButton.setFillStyle(0x8b4513));

    this.add.text(width / 2 + 200, height / 2 - 150, '⚒️ BLACKSMITH', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2 + 200, height / 2 - 80, 'Upgrade pieces\nAdd buffs\nEnhance abilities', {
      fontSize: '18px',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5);
  }

  /**
   * Handles path selection
   */
  private selectPath(pathType: PathType): void {
    if (pathType === PathType.SHOP) {
      this.runState.setGamePhase(GamePhase.SHOP);
      this.scene.start('ShopScene', { runState: this.runState });
    } else {
      this.runState.setGamePhase(GamePhase.BLACKSMITH);
      this.scene.start('BlacksmithScene', { runState: this.runState });
    }
  }
}

