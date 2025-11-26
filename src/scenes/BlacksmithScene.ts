import Phaser from 'phaser';
import { RunState } from '../core/RunState';
import { UpgradeOption, BuffType } from '../core/types';
import { Unit } from '../core/Unit';

/**
 * BlacksmithScene allows the player to upgrade their existing pieces
 */
export class BlacksmithScene extends Phaser.Scene {
  private runState!: RunState;
  private upgradeOptions: UpgradeOption[] = [];
  private selectedUnit: Unit | null = null;

  constructor() {
    super({ key: 'BlacksmithScene' });
  }

  init(data: { runState: RunState }) {
    this.runState = data.runState;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Generate upgrade options
    this.generateUpgradeOptions();

    // Title
    this.add.text(width / 2, 60, '⚒️ BLACKSMITH', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Gold display
    this.add.text(width / 2, 120, `Gold: ${this.runState.getGold()}`, {
      fontSize: '24px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // Display player units
    this.displayPlayerUnits();

    // Display upgrade options
    this.displayUpgradeOptions();

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
   * Generates random upgrade options
   */
  private generateUpgradeOptions(): void {
    const allUpgrades: UpgradeOption[] = [
      {
        id: 'shield',
        name: 'Shield',
        cost: 80,
        buff: {
          type: BuffType.SHIELD,
          name: 'Shield',
          description: 'Absorbs one hit'
        },
        description: 'Absorbs the next attack',
        applicableTo: ['PAWN', 'ROOK', 'KNIGHT', 'BISHOP', 'QUEEN', 'KING'] as any[]
      },
      {
        id: 'backward_movement',
        name: 'Backward Movement',
        cost: 60,
        buff: {
          type: BuffType.BACKWARD_MOVEMENT,
          name: 'Backward Movement',
          description: 'Can move backward'
        },
        description: 'Allows pawn to move backward',
        applicableTo: ['PAWN'] as any[]
      },
      {
        id: 'extra_range',
        name: 'Extra Range',
        cost: 100,
        buff: {
          type: BuffType.EXTRA_RANGE,
          name: 'Extra Range',
          description: 'Increased movement range'
        },
        description: 'Increases movement range',
        applicableTo: ['ROOK', 'BISHOP', 'QUEEN'] as any[]
      },
      {
        id: 'double_move',
        name: 'Double Move',
        cost: 120,
        buff: {
          type: BuffType.DOUBLE_MOVE,
          name: 'Double Move',
          description: 'Can move twice'
        },
        description: 'Knight can jump twice',
        applicableTo: ['KNIGHT'] as any[]
      },
      {
        id: 'fire_damage',
        name: 'Fire Damage',
        cost: 90,
        buff: {
          type: BuffType.FIRE_DAMAGE,
          name: 'Fire Damage',
          description: 'Deals fire damage'
        },
        description: 'Adds fire damage on capture',
        applicableTo: ['PAWN', 'ROOK', 'KNIGHT', 'BISHOP', 'QUEEN'] as any[]
      }
    ];

    this.upgradeOptions = Phaser.Utils.Array.Shuffle([...allUpgrades]).slice(0, 3);
  }

  /**
   * Displays player units for selection
   */
  private displayPlayerUnits(): void {
    const units = this.runState.getPlayerUnits();
    const startX = 100;
    const y = 200;

    this.add.text(startX, y - 30, 'Your Units:', {
      fontSize: '20px',
      color: '#ffffff'
    });

    units.forEach((unit, index) => {
      const x = startX + index * 80;
      const isSelected = this.selectedUnit === unit;
      const color = isSelected ? 0x00ff00 : 0x4444aa;

      const unitCard = this.add.rectangle(x, y + 40, 60, 80, color)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectUnit(unit))
        .on('pointerover', () => {
          if (!isSelected) unitCard.setFillStyle(0x5555cc);
        })
        .on('pointerout', () => {
          if (!isSelected) unitCard.setFillStyle(0x4444aa);
        });

      this.add.text(x, y + 30, unit.getType().charAt(0), {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Show buffs
      const buffs = unit.getBuffs();
      if (buffs.length > 0) {
        this.add.text(x, y + 60, `+${buffs.length}`, {
          fontSize: '12px',
          color: '#ffd700'
        }).setOrigin(0.5);
      }
    });
  }

  /**
   * Displays upgrade options
   */
  private displayUpgradeOptions(): void {
    const startY = 350;
    const spacing = 200;

    this.add.text(100, startY - 30, 'Available Upgrades:', {
      fontSize: '20px',
      color: '#ffffff'
    });

    this.upgradeOptions.forEach((upgrade, index) => {
      const x = 200 + index * spacing;
      const y = startY + 80;

      this.createUpgradeCard(upgrade, x, y);
    });
  }

  /**
   * Creates an upgrade card
   */
  private createUpgradeCard(upgrade: UpgradeOption, x: number, y: number): void {
    const canAfford = this.runState.getGold() >= upgrade.cost;
    const canApply = this.selectedUnit !== null &&
                     upgrade.applicableTo.includes(this.selectedUnit.getType() as any);
    const isAvailable = canAfford && canApply;
    const color = isAvailable ? 0x8b4513 : 0x555555;

    const card = this.add.rectangle(x, y, 180, 160, color)
      .setInteractive({ useHandCursor: isAvailable })
      .on('pointerover', () => {
        if (isAvailable) card.setFillStyle(0xab6523);
      })
      .on('pointerout', () => card.setFillStyle(color))
      .on('pointerdown', () => {
        if (isAvailable) this.applyUpgrade(upgrade);
      });

    // Upgrade name
    this.add.text(x, y - 50, upgrade.name, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Description
    this.add.text(x, y - 10, upgrade.description, {
      fontSize: '14px',
      color: '#cccccc',
      wordWrap: { width: 160 },
      align: 'center'
    }).setOrigin(0.5);

    // Cost
    this.add.text(x, y + 50, `${upgrade.cost} Gold`, {
      fontSize: '16px',
      color: canAfford ? '#ffd700' : '#888888'
    }).setOrigin(0.5);
  }

  /**
   * Selects a unit for upgrade
   */
  private selectUnit(unit: Unit): void {
    this.selectedUnit = unit;
    this.scene.restart();
  }

  /**
   * Applies an upgrade to the selected unit
   */
  private applyUpgrade(upgrade: UpgradeOption): void {
    if (!this.selectedUnit) {
      return;
    }

    if (!this.runState.spendGold(upgrade.cost)) {
      return;
    }

    this.selectedUnit.addBuff(upgrade.buff);
    console.log(`Applied ${upgrade.name} to ${this.selectedUnit.getType()}`);

    // Refresh the scene
    this.selectedUnit = null;
    this.scene.restart();
  }

  /**
   * Continues to the next battle
   */
  private continueToNextBattle(): void {
    this.scene.start('BattleScene', { runState: this.runState });
  }
}

