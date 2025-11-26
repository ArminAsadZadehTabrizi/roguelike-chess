import Phaser from 'phaser';
import { RunState } from '../core/RunState';
import { ShopItem, PieceType, Team } from '../core/types';
import { Pawn, Rook, Knight, Bishop, Queen } from '../core/Unit';

/**
 * ShopScene allows the player to purchase new pieces and upgrades
 */
export class ShopScene extends Phaser.Scene {
  private runState!: RunState;
  private shopItems: ShopItem[] = [];

  constructor() {
    super({ key: 'ShopScene' });
  }

  init(data: { runState: RunState }) {
    this.runState = data.runState;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Generate shop items
    this.generateShopItems();

    // Title
    this.add.text(width / 2, 60, '🛒 SHOP', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Gold display
    this.add.text(width / 2, 120, `Gold: ${this.runState.getGold()}`, {
      fontSize: '24px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // Display shop items
    this.displayShopItems();

    // Continue button
    const continueButton = this.add.rectangle(width / 2, height - 80, 200, 60, 0x00aa00)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.continueToNextBattle())
      .on('pointerover', () => continueButton.setFillStyle(0x00cc00))
      .on('pointerout', () => continueButton.setFillStyle(0x00aa00));

    this.add.text(width / 2, height - 80, 'Continue', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  /**
   * Generates random shop items
   */
  private generateShopItems(): void {
    this.shopItems = [
      {
        id: 'pawn',
        name: 'Pawn',
        cost: 50,
        type: 'PIECE',
        pieceType: PieceType.PAWN,
        description: 'Basic chess piece'
      },
      {
        id: 'knight',
        name: 'Knight',
        cost: 150,
        type: 'PIECE',
        pieceType: PieceType.KNIGHT,
        description: 'Jumps over pieces'
      },
      {
        id: 'rook',
        name: 'Rook',
        cost: 200,
        type: 'PIECE',
        pieceType: PieceType.ROOK,
        description: 'Moves in straight lines'
      },
      {
        id: 'bishop',
        name: 'Bishop',
        cost: 180,
        type: 'PIECE',
        pieceType: PieceType.BISHOP,
        description: 'Moves diagonally'
      },
      {
        id: 'board_expansion',
        name: 'Board Expansion',
        cost: 120,
        type: 'BOARD_EXPANSION',
        description: 'Expand the board by 1 row and 1 column'
      }
    ];

    // Shuffle and take 4 random items
    Phaser.Utils.Array.Shuffle(this.shopItems);
    this.shopItems = this.shopItems.slice(0, 4);
  }

  /**
   * Displays shop items
   */
  private displayShopItems(): void {
    const startX = 150;
    const startY = 220;
    const spacing = 250;

    this.shopItems.forEach((item, index) => {
      const x = startX + (index % 2) * spacing;
      const y = startY + Math.floor(index / 2) * 220;

      this.createShopItemCard(item, x, y);
    });
  }

  /**
   * Creates a shop item card
   */
  private createShopItemCard(item: ShopItem, x: number, y: number): void {
    const canAfford = this.runState.getGold() >= item.cost;
    const color = canAfford ? 0x2a5298 : 0x555555;

    const card = this.add.rectangle(x, y, 200, 180, color)
      .setInteractive({ useHandCursor: canAfford })
      .on('pointerover', () => {
        if (canAfford) card.setFillStyle(0x3a6bb8);
      })
      .on('pointerout', () => card.setFillStyle(color))
      .on('pointerdown', () => {
        if (canAfford) this.purchaseItem(item);
      });

    // Item name
    this.add.text(x, y - 60, item.name, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Item description
    this.add.text(x, y - 10, item.description, {
      fontSize: '14px',
      color: '#cccccc',
      wordWrap: { width: 180 },
      align: 'center'
    }).setOrigin(0.5);

    // Cost
    this.add.text(x, y + 60, `${item.cost} Gold`, {
      fontSize: '18px',
      color: canAfford ? '#ffd700' : '#888888'
    }).setOrigin(0.5);
  }

  /**
   * Purchases an item
   */
  private purchaseItem(item: ShopItem): void {
    if (!this.runState.spendGold(item.cost)) {
      return;
    }

    if (item.type === 'PIECE' && item.pieceType) {
      const newUnit = this.createPieceFromType(item.pieceType);
      this.runState.addUnit(newUnit);
      console.log(`Purchased ${item.name}`);
    } else if (item.type === 'BOARD_EXPANSION') {
      this.runState.expandBoardRows(1);
      this.runState.expandBoardCols(1);
      console.log('Board expanded!');
    }

    // Refresh the scene
    this.scene.restart();
  }

  /**
   * Creates a piece from a piece type
   */
  private createPieceFromType(pieceType: PieceType) {
    const tempPos = { row: 0, col: 0 };

    switch (pieceType) {
      case PieceType.PAWN:
        return new Pawn(Team.PLAYER, tempPos);
      case PieceType.ROOK:
        return new Rook(Team.PLAYER, tempPos);
      case PieceType.KNIGHT:
        return new Knight(Team.PLAYER, tempPos);
      case PieceType.BISHOP:
        return new Bishop(Team.PLAYER, tempPos);
      case PieceType.QUEEN:
        return new Queen(Team.PLAYER, tempPos);
      default:
        return new Pawn(Team.PLAYER, tempPos);
    }
  }

  /**
   * Continues to the next battle
   */
  private continueToNextBattle(): void {
    this.scene.start('BattleScene', { runState: this.runState });
  }
}

