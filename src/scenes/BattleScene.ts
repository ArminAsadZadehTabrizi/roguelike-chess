import Phaser from 'phaser';
import { BoardManager } from '../core/BoardManager';
import { RunState } from '../core/RunState';
import { Unit, Pawn, Rook, Knight, Bishop, Queen, King } from '../core/Unit';
import { Team, Position, PieceType } from '../core/types';

/**
 * BattleScene handles the chess battle gameplay
 */
export class BattleScene extends Phaser.Scene {
  private boardManager!: BoardManager;
  private runState!: RunState;
  private selectedUnit: Unit | null = null;
  private selectedPosition: Position | null = null;
  private validMoves: Position[] = [];

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: { runState: RunState }) {
    this.runState = data.runState || new RunState();
  }

  create() {
    const dimensions = this.runState.getBoardDimensions();
    this.boardManager = new BoardManager(dimensions.rows, dimensions.cols);

    // Setup the initial board state
    this.setupBattle();

    // Add UI elements
    this.createUI();

    // Setup input handlers
    this.setupInput();

    console.log('Battle Scene Created');
    console.log('Stage:', this.runState.getCurrentStage());
    console.log('Is Boss Stage:', this.runState.isBossStage());
  }

  /**
   * Sets up the battle by spawning player and enemy units
   */
  private setupBattle(): void {
    const dimensions = this.boardManager.getDimensions();

    // Place player units on the bottom rows
    this.spawnPlayerUnits();

    // Spawn enemy units based on difficulty
    this.spawnEnemyUnits();
  }

  /**
   * Spawns player units from the run state
   */
  private spawnPlayerUnits(): void {
    const playerUnits = this.runState.getPlayerUnits();
    const dimensions = this.boardManager.getDimensions();

    // If no units, add a starting pawn
    if (playerUnits.length === 0) {
      const startingPawn = new Pawn(Team.PLAYER, { row: dimensions.rows - 1, col: Math.floor(dimensions.cols / 2) });
      this.runState.addUnit(startingPawn);
      playerUnits.push(startingPawn);
    }

    // Place units on the bottom row(s)
    let placementIndex = 0;
    for (const unit of playerUnits) {
      const row = dimensions.rows - 1;
      const col = placementIndex % dimensions.cols;
      const pos = { row, col };

      this.boardManager.placeUnit(unit, pos);
      placementIndex++;
    }
  }

  /**
   * Spawns enemy units based on current difficulty
   */
  private spawnEnemyUnits(): void {
    const isBoss = this.runState.isBossStage();
    const difficulty = this.runState.getDifficultyFactor();
    const dimensions = this.boardManager.getDimensions();

    let enemyCount = Math.floor(2 + difficulty * 2);

    if (isBoss) {
      // Boss stage: spawn a king and supporting pieces
      const kingPos = { row: 0, col: Math.floor(dimensions.cols / 2) };
      const king = new King(Team.ENEMY, kingPos);
      this.boardManager.placeUnit(king, kingPos);

      // Add supporting pieces
      enemyCount = Math.floor(3 + difficulty * 1.5);
    }

    // Spawn random enemy pieces
    for (let i = 0; i < enemyCount; i++) {
      const enemy = this.createRandomEnemyPiece(difficulty);
      const placed = this.tryPlaceEnemyUnit(enemy);

      if (!placed) {
        break; // Board is full
      }
    }
  }

  /**
   * Creates a random enemy piece based on difficulty
   */
  private createRandomEnemyPiece(difficulty: number): Unit {
    const types: PieceType[] = [PieceType.PAWN, PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP];

    // Higher difficulty means better pieces
    if (difficulty > 2) {
      types.push(PieceType.QUEEN);
    }

    const randomType = Phaser.Math.RND.pick(types);
    const tempPos = { row: 0, col: 0 };

    switch (randomType) {
      case PieceType.PAWN:
        return new Pawn(Team.ENEMY, tempPos);
      case PieceType.ROOK:
        return new Rook(Team.ENEMY, tempPos);
      case PieceType.KNIGHT:
        return new Knight(Team.ENEMY, tempPos);
      case PieceType.BISHOP:
        return new Bishop(Team.ENEMY, tempPos);
      case PieceType.QUEEN:
        return new Queen(Team.ENEMY, tempPos);
      default:
        return new Pawn(Team.ENEMY, tempPos);
    }
  }

  /**
   * Tries to place an enemy unit on the top rows
   */
  private tryPlaceEnemyUnit(unit: Unit): boolean {
    const dimensions = this.boardManager.getDimensions();
    const maxAttempts = dimensions.cols * 2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const row = Phaser.Math.RND.between(0, 1); // Top 2 rows
      const col = Phaser.Math.RND.between(0, dimensions.cols - 1);
      const pos = { row, col };

      if (this.boardManager.getUnit(pos) === null) {
        return this.boardManager.placeUnit(unit, pos);
      }
    }

    return false;
  }

  /**
   * Creates the UI elements
   */
  private createUI(): void {
    // Stage indicator
    this.add.text(16, 16, `Stage ${this.runState.getCurrentStage()}`, {
      fontSize: '24px',
      color: '#ffffff'
    });

    // Boss indicator
    if (this.runState.isBossStage()) {
      this.add.text(16, 48, 'BOSS STAGE', {
        fontSize: '20px',
        color: '#ff0000',
        fontStyle: 'bold'
      });
    }

    // Gold display
    this.add.text(16, this.runState.isBossStage() ? 80 : 48, `Gold: ${this.runState.getGold()}`, {
      fontSize: '18px',
      color: '#ffd700'
    });
  }

  /**
   * Sets up input handlers
   */
  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleBoardClick(pointer.x, pointer.y);
    });
  }

  /**
   * Handles clicks on the board
   */
  private handleBoardClick(x: number, y: number): void {
    // TODO: Convert screen coordinates to board coordinates
    // TODO: Handle unit selection and movement
    console.log('Board clicked at', x, y);
  }

  /**
   * Checks win/loss conditions
   */
  private checkBattleEnd(): void {
    const playerUnits = this.boardManager.getUnitsByTeam(Team.PLAYER);
    const enemyUnits = this.boardManager.getUnitsByTeam(Team.ENEMY);

    // Player loses if no units
    if (playerUnits.length === 0) {
      this.handleDefeat();
      return;
    }

    // Check victory conditions
    if (this.runState.isBossStage()) {
      // Boss stage: need to checkmate or capture the king
      if (this.boardManager.isCheckmate(Team.ENEMY)) {
        this.handleVictory();
      }
    } else {
      // Normal stage: capture all enemy pieces
      if (enemyUnits.length === 0) {
        this.handleVictory();
      }
    }
  }

  /**
   * Handles victory
   */
  private handleVictory(): void {
    console.log('Victory!');

    // Award gold
    const goldReward = this.runState.calculateGoldReward();
    this.runState.addGold(goldReward);

    // Advance stage
    this.runState.advanceStage();

    // Transition to path selection
    this.scene.start('PathSelectionScene', { runState: this.runState });
  }

  /**
   * Handles defeat
   */
  private handleDefeat(): void {
    console.log('Defeat!');

    // Transition to game over scene
    this.scene.start('GameOverScene', { runState: this.runState });
  }

  update(): void {
    // Game loop updates can go here
  }
}

