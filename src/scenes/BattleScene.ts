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

  // Visual elements
  private boardTiles: Phaser.GameObjects.Rectangle[][] = [];
  private unitSprites: Map<Unit, Phaser.GameObjects.Container> = new Map();
  private moveHighlights: Phaser.GameObjects.Rectangle[] = [];
  private selectionHighlight: Phaser.GameObjects.Rectangle | null = null;

  // Board rendering constants
  private tileSize: number = 0;
  private boardStartX: number = 0;
  private boardStartY: number = 0;
  private readonly BOARD_PADDING = 20;
  private readonly UI_HEIGHT = 120;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: { runState: RunState }) {
    this.runState = data.runState || new RunState();
  }

  create() {
    const dimensions = this.runState.getBoardDimensions();
    this.boardManager = new BoardManager(dimensions.rows, dimensions.cols);

    // Calculate board rendering parameters
    this.calculateBoardLayout();

    // Setup the initial board state
    this.setupBattle();

    // Render the board
    this.renderBoard();

    // Render all units
    this.renderAllUnits();

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

    // Ensure solvability - player must have at least one valid move
    this.ensureSolvability();
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
   * Ensures the player has at least one valid move at the start
   * Repositions enemies if necessary to prevent softlocks
   */
  private ensureSolvability(): void {
    const maxAttempts = 20; // Prevent infinite loops
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Check if player has any valid moves
      const playerUnits = this.boardManager.getUnitsByTeam(Team.PLAYER);
      let hasValidMove = false;

      for (const unit of playerUnits) {
        const pos = unit.getPosition();
        const validMoves = this.boardManager.getValidMoves(pos);
        if (validMoves.length > 0) {
          hasValidMove = true;
          break;
        }
      }

      if (hasValidMove) {
        console.log('Solvability check passed - player has valid moves');
        return; // Player can move, we're good
      }

      // Player is blocked - try to fix it
      console.log('Player has no valid moves - attempting to fix...');
      const fixed = this.fixUnsolvablePosition();

      if (!fixed) {
        console.warn('Could not fix unsolvable position after attempts');
        break;
      }

      attempts++;
    }

    // Re-render units after repositioning
    this.renderAllUnits();
  }

  /**
   * Attempts to fix an unsolvable position by repositioning enemies
   */
  private fixUnsolvablePosition(): boolean {
    const playerUnits = this.boardManager.getUnitsByTeam(Team.PLAYER);
    const enemyUnits = this.boardManager.getUnitsByTeam(Team.ENEMY);
    const dimensions = this.boardManager.getDimensions();

    if (playerUnits.length === 0 || enemyUnits.length === 0) {
      return false;
    }

    // Strategy 1: Try to place an enemy diagonally in front of a player pawn
    for (const playerUnit of playerUnits) {
      if (playerUnit.getType() === PieceType.PAWN) {
        const playerPos = playerUnit.getPosition();
        // Pawns move up (row decreases), so check diagonal positions above
        const capturePositions = [
          { row: playerPos.row - 1, col: playerPos.col - 1 },
          { row: playerPos.row - 1, col: playerPos.col + 1 }
        ];

        for (const capturePos of capturePositions) {
          if (this.boardManager.isValidPosition(capturePos) &&
              this.boardManager.getUnit(capturePos) === null) {
            // Find an enemy to move there
            for (const enemy of enemyUnits) {
              const enemyPos = enemy.getPosition();
              // Try to move this enemy to the capture position
              if (this.boardManager.isValidPosition(capturePos)) {
                const targetUnit = this.boardManager.getUnit(capturePos);
                if (targetUnit === null) {
                  // Position is empty, try moving the enemy there
                  const captured = this.boardManager.moveUnit(enemyPos, capturePos);
                  // Move succeeded (captured is null or a unit, both are fine)
                  // Update sprite position
                  const sprite = this.unitSprites.get(enemy);
                  if (sprite) {
                    const newX = this.boardStartX + capturePos.col * this.tileSize + this.tileSize / 2;
                    const newY = this.boardStartY + capturePos.row * this.tileSize + this.tileSize / 2;
                    sprite.setPosition(newX, newY);
                  }
                  console.log('Fixed: Moved enemy to capture position');
                  return true;
                }
              }
            }
          }
        }
      }
    }

    // Strategy 2: Move a blocking enemy away from player units
    for (const playerUnit of playerUnits) {
      const playerPos = playerUnit.getPosition();
      const validMoves = playerUnit.getPossibleMoves(playerPos, this.boardManager);

      // Find positions that are blocking valid moves
      for (const move of validMoves) {
        const blockingUnit = this.boardManager.getUnit(move);
        if (blockingUnit && blockingUnit.getTeam() === Team.ENEMY) {
          // Try to move this blocking enemy away
          const blockingPos = blockingUnit.getPosition();
          const enemyMoves = this.boardManager.getValidMoves(blockingPos);

          // Find a position that's not blocking player moves
          for (const enemyMove of enemyMoves) {
            if (enemyMove.row !== move.row || enemyMove.col !== move.col) {
              // Move the enemy away using moveUnit for atomic operation
              const moved = this.boardManager.moveUnit(blockingPos, enemyMove);
              // Update sprite position
              const sprite = this.unitSprites.get(blockingUnit);
              if (sprite) {
                const newX = this.boardStartX + enemyMove.col * this.tileSize + this.tileSize / 2;
                const newY = this.boardStartY + enemyMove.row * this.tileSize + this.tileSize / 2;
                sprite.setPosition(newX, newY);
              }
              console.log('Fixed: Moved blocking enemy away');
              return true;
            }
          }
        }
      }
    }

    // Strategy 3: Move an enemy to a random valid position
    for (const enemy of enemyUnits) {
      const enemyPos = enemy.getPosition();
      const validMoves = this.boardManager.getValidMoves(enemyPos);

      if (validMoves.length > 0) {
        const randomMove = Phaser.Math.RND.pick(validMoves);
        // Use moveUnit for atomic operation
        this.boardManager.moveUnit(enemyPos, randomMove);
        // Update sprite position
        const sprite = this.unitSprites.get(enemy);
        if (sprite) {
          const newX = this.boardStartX + randomMove.col * this.tileSize + this.tileSize / 2;
          const newY = this.boardStartY + randomMove.row * this.tileSize + this.tileSize / 2;
          sprite.setPosition(newX, newY);
        }
        console.log('Fixed: Moved enemy to random position');
        return true;
      }
    }

    return false;
  }

  /**
   * Makes an enemy AI move
   * Finds a random enemy with valid moves and executes one
   */
  private makeEnemyMove(): void {
    // Check if game is already over
    if (this.checkBattleEnd()) {
      return;
    }

    const enemyUnits = this.boardManager.getUnitsByTeam(Team.ENEMY);

    if (enemyUnits.length === 0) {
      return; // No enemies left
    }

    // Find enemies with valid moves
    const enemiesWithMoves: Array<{ unit: Unit; position: Position; moves: Position[] }> = [];

    for (const enemy of enemyUnits) {
      const pos = enemy.getPosition();
      const validMoves = this.boardManager.getValidMoves(pos);

      if (validMoves.length > 0) {
        enemiesWithMoves.push({ unit: enemy, position: pos, moves: validMoves });
      }
    }

    if (enemiesWithMoves.length === 0) {
      console.log('No enemy units have valid moves');
      return; // No enemies can move
    }

    // Pick a random enemy with moves
    const selected = Phaser.Math.RND.pick(enemiesWithMoves);

    // Pick a random valid move
    const targetMove = Phaser.Math.RND.pick(selected.moves);

    console.log(`Enemy ${selected.unit.getType()} moving from (${selected.position.row}, ${selected.position.col}) to (${targetMove.row}, ${targetMove.col})`);

    // Execute the enemy move
    this.executeMove(selected.position, targetMove, true);
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
   * Calculates board layout parameters based on screen size
   */
  private calculateBoardLayout(): void {
    const { width, height } = this.cameras.main;
    const dimensions = this.boardManager.getDimensions();

    // Calculate available space (accounting for UI)
    const availableWidth = width - (this.BOARD_PADDING * 2);
    const availableHeight = height - this.UI_HEIGHT - (this.BOARD_PADDING * 2);

    // Calculate tile size to fit the board
    const tileSizeByWidth = availableWidth / dimensions.cols;
    const tileSizeByHeight = availableHeight / dimensions.rows;

    // Use the smaller dimension to ensure board fits
    this.tileSize = Math.floor(Math.min(tileSizeByWidth, tileSizeByHeight));

    // Calculate board dimensions
    const boardWidth = this.tileSize * dimensions.cols;
    const boardHeight = this.tileSize * dimensions.rows;

    // Center the board
    this.boardStartX = (width - boardWidth) / 2;
    this.boardStartY = this.UI_HEIGHT + (height - this.UI_HEIGHT - boardHeight) / 2;
  }

  /**
   * Renders the chess board with alternating tile colors
   */
  private renderBoard(): void {
    const dimensions = this.boardManager.getDimensions();
    this.boardTiles = [];

    // Light and dark tile colors (chess board style)
    const lightColor = 0xf0d9b5; // Light beige
    const darkColor = 0xb58863;   // Dark brown

    for (let row = 0; row < dimensions.rows; row++) {
      this.boardTiles[row] = [];
      for (let col = 0; col < dimensions.cols; col++) {
        // Alternate colors (chess board pattern)
        const isLight = (row + col) % 2 === 0;
        const color = isLight ? lightColor : darkColor;

        const x = this.boardStartX + col * this.tileSize + this.tileSize / 2;
        const y = this.boardStartY + row * this.tileSize + this.tileSize / 2;

        const tile = this.add.rectangle(x, y, this.tileSize - 2, this.tileSize - 2, color);
        tile.setStrokeStyle(1, 0x000000, 0.2);
        tile.setInteractive({ useHandCursor: true });

        this.boardTiles[row][col] = tile;
      }
    }
  }

  /**
   * Renders all units on the board
   */
  private renderAllUnits(): void {
    const dimensions = this.boardManager.getDimensions();

    // Clear existing sprites
    this.unitSprites.forEach(sprite => sprite.destroy());
    this.unitSprites.clear();

    // Render all units
    for (let row = 0; row < dimensions.rows; row++) {
      for (let col = 0; col < dimensions.cols; col++) {
        const unit = this.boardManager.getUnit({ row, col });
        if (unit) {
          this.renderUnit(unit, { row, col });
        }
      }
    }
  }

  /**
   * Renders a single unit on the board
   */
  private renderUnit(unit: Unit, position: Position): void {
    const x = this.boardStartX + position.col * this.tileSize + this.tileSize / 2;
    const y = this.boardStartY + position.row * this.tileSize + this.tileSize / 2;

    // Circle color based on team
    const circleColor = unit.getTeam() === Team.PLAYER ? 0x00ff00 : 0xff0000;
    const circleRadius = this.tileSize * 0.35;

    // Create container for unit sprite
    const container = this.add.container(x, y);

    // Background circle
    const circle = this.add.circle(0, 0, circleRadius, circleColor);
    circle.setStrokeStyle(2, 0x000000, 0.8);

    // Piece type text
    const pieceSymbol = this.getPieceSymbol(unit.getType());
    const text = this.add.text(0, 0, pieceSymbol, {
      fontSize: `${Math.floor(this.tileSize * 0.4)}px`,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    text.setOrigin(0.5);

    // Add buff indicator if unit has buffs
    if (unit.getBuffs().length > 0) {
      const buffCount = unit.getBuffs().length;
      const buffText = this.add.text(
        circleRadius * 0.7,
        -circleRadius * 0.7,
        `+${buffCount}`,
        {
          fontSize: `${Math.floor(this.tileSize * 0.2)}px`,
          color: '#ffd700',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 1
        }
      );
      buffText.setOrigin(0.5);
      container.add(buffText);
    }

    container.add([circle, text]);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, circleRadius), Phaser.Geom.Circle.Contains);

    this.unitSprites.set(unit, container);
  }

  /**
   * Gets the symbol for a piece type
   */
  private getPieceSymbol(pieceType: PieceType): string {
    switch (pieceType) {
      case PieceType.PAWN:
        return 'P';
      case PieceType.ROOK:
        return 'R';
      case PieceType.KNIGHT:
        return 'N';
      case PieceType.BISHOP:
        return 'B';
      case PieceType.QUEEN:
        return 'Q';
      case PieceType.KING:
        return 'K';
      default:
        return '?';
    }
  }

  /**
   * Converts screen coordinates to board position
   */
  private screenToBoardPosition(screenX: number, screenY: number): Position | null {
    // Check if click is within board bounds
    if (screenX < this.boardStartX || screenX > this.boardStartX + this.boardManager.getDimensions().cols * this.tileSize) {
      return null;
    }
    if (screenY < this.boardStartY || screenY > this.boardStartY + this.boardManager.getDimensions().rows * this.tileSize) {
      return null;
    }

    const col = Math.floor((screenX - this.boardStartX) / this.tileSize);
    const row = Math.floor((screenY - this.boardStartY) / this.tileSize);

    if (row >= 0 && row < this.boardManager.getDimensions().rows &&
        col >= 0 && col < this.boardManager.getDimensions().cols) {
      return { row, col };
    }

    return null;
  }

  /**
   * Highlights valid moves for the selected unit
   */
  private highlightValidMoves(moves: Position[]): void {
    this.clearMoveHighlights();

    moves.forEach(pos => {
      const x = this.boardStartX + pos.col * this.tileSize + this.tileSize / 2;
      const y = this.boardStartY + pos.row * this.tileSize + this.tileSize / 2;

      // Check if there's a unit at this position (capture highlight)
      const targetUnit = this.boardManager.getUnit(pos);
      const isCapture = targetUnit !== null && targetUnit.getTeam() !== this.selectedUnit?.getTeam();

      // Use different color for captures
      const highlightColor = isCapture ? 0xff4444 : 0x44ff44;
      const highlight = this.add.rectangle(x, y, this.tileSize * 0.3, this.tileSize * 0.3, highlightColor);
      highlight.setAlpha(0.6);
      highlight.setStrokeStyle(2, highlightColor, 1);

      this.moveHighlights.push(highlight);
    });
  }

  /**
   * Clears all move highlights
   */
  private clearMoveHighlights(): void {
    this.moveHighlights.forEach(highlight => highlight.destroy());
    this.moveHighlights = [];
  }

  /**
   * Highlights the selected unit
   */
  private highlightSelectedUnit(position: Position): void {
    this.clearSelectionHighlight();

    const x = this.boardStartX + position.col * this.tileSize + this.tileSize / 2;
    const y = this.boardStartY + position.row * this.tileSize + this.tileSize / 2;

    this.selectionHighlight = this.add.rectangle(
      x,
      y,
      this.tileSize * 0.9,
      this.tileSize * 0.9,
      0xffff00
    );
    this.selectionHighlight.setAlpha(0.3);
    this.selectionHighlight.setStrokeStyle(3, 0xffff00, 1);
    this.selectionHighlight.setDepth(-1); // Behind units
  }

  /**
   * Clears the selection highlight
   */
  private clearSelectionHighlight(): void {
    if (this.selectionHighlight) {
      this.selectionHighlight.destroy();
      this.selectionHighlight = null;
    }
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
  private handleBoardClick(screenX: number, screenY: number): void {
    const boardPos = this.screenToBoardPosition(screenX, screenY);

    if (!boardPos) {
      // Clicked outside board - deselect
      this.deselectUnit();
      return;
    }

    const clickedUnit = this.boardManager.getUnit(boardPos);

    // If we have a selected unit, try to move it
    if (this.selectedUnit && this.selectedPosition) {
      // Check if clicking a valid move
      const isValidMove = this.validMoves.some(
        move => move.row === boardPos.row && move.col === boardPos.col
      );

      if (isValidMove) {
        // Execute the move
        this.executeMove(this.selectedPosition, boardPos);
        return;
      } else {
        // Clicked invalid square - deselect or select new unit
        this.deselectUnit();
      }
    }

    // Select a player unit
    if (clickedUnit && clickedUnit.getTeam() === Team.PLAYER) {
      this.selectUnit(clickedUnit, boardPos);
    } else {
      // Clicked empty square or enemy - deselect
      this.deselectUnit();
    }
  }

  /**
   * Selects a unit and shows valid moves
   */
  private selectUnit(unit: Unit, position: Position): void {
    this.selectedUnit = unit;
    this.selectedPosition = position;

    // Get valid moves
    this.validMoves = this.boardManager.getValidMoves(position);

    // Highlight selected unit
    this.highlightSelectedUnit(position);

    // Highlight valid moves
    this.highlightValidMoves(this.validMoves);

    console.log(`Selected ${unit.getType()} at (${position.row}, ${position.col})`);
    console.log(`Valid moves: ${this.validMoves.length}`);
  }

  /**
   * Deselects the current unit
   */
  private deselectUnit(): void {
    this.selectedUnit = null;
    this.selectedPosition = null;
    this.validMoves = [];
    this.clearMoveHighlights();
    this.clearSelectionHighlight();
  }

  /**
   * Executes a move on the board
   */
  private executeMove(from: Position, to: Position, isEnemyMove: boolean = false): void {
    const capturedUnit = this.boardManager.moveUnit(from, to);

    if (capturedUnit) {
      // Handle capture
      console.log(`${isEnemyMove ? 'Enemy' : 'Player'} captured ${capturedUnit.getType()}`);

      // Remove captured unit sprite
      const capturedSprite = this.unitSprites.get(capturedUnit);
      if (capturedSprite) {
        capturedSprite.destroy();
        this.unitSprites.delete(capturedUnit);
      }

      // If it's a player unit, remove from run state (permadeath)
      if (capturedUnit.getTeam() === Team.PLAYER) {
        this.runState.removeUnit(capturedUnit);
      }
    }

    // Update the moved unit's sprite position
    const movedUnit = this.boardManager.getUnit(to);
    if (movedUnit) {
      const sprite = this.unitSprites.get(movedUnit);
      if (sprite) {
        const newX = this.boardStartX + to.col * this.tileSize + this.tileSize / 2;
        const newY = this.boardStartY + to.row * this.tileSize + this.tileSize / 2;
        sprite.setPosition(newX, newY);
      }

      // Mark unit as moved
      movedUnit.markAsMoved();
    }

    // Clear selection (only for player moves)
    if (!isEnemyMove) {
      this.deselectUnit();
    }

    // Check for win/loss conditions
    const gameOver = this.checkBattleEnd();

    // If game is not over and it was a player move, trigger enemy AI
    if (!gameOver && !isEnemyMove) {
      // Delay enemy move by 500ms
      this.time.delayedCall(500, () => {
        this.makeEnemyMove();
      });
    }
  }

  /**
   * Checks win/loss conditions
   * @returns true if game is over, false otherwise
   */
  private checkBattleEnd(): boolean {
    const playerUnits = this.boardManager.getUnitsByTeam(Team.PLAYER);
    const enemyUnits = this.boardManager.getUnitsByTeam(Team.ENEMY);

    // Player loses if no units
    if (playerUnits.length === 0) {
      this.handleDefeat();
      return true;
    }

    // Check victory conditions
    if (this.runState.isBossStage()) {
      // Boss stage: need to checkmate or capture the king
      if (this.boardManager.isCheckmate(Team.ENEMY)) {
        this.handleVictory();
        return true;
      }
    } else {
      // Normal stage: capture all enemy pieces
      if (enemyUnits.length === 0) {
        this.handleVictory();
        return true;
      }
    }

    return false;
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

