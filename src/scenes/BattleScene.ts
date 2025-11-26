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

    // After spawning, ensure reachability (especially for pawns)
    this.ensureReachability();
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
   * Ensures player units can reach enemy units (reachability check)
   * Specifically checks pawn lanes to prevent "walking past each other" scenarios
   */
  private ensureReachability(): void {
    const playerUnits = this.boardManager.getUnitsByTeam(Team.PLAYER);
    const enemyUnits = this.boardManager.getUnitsByTeam(Team.ENEMY);
    const dimensions = this.boardManager.getDimensions();

    if (playerUnits.length === 0 || enemyUnits.length === 0) {
      return;
    }

    // Check each player unit for reachability
    for (const playerUnit of playerUnits) {
      const playerPos = playerUnit.getPosition();
      const unitType = playerUnit.getType();

      // Special handling for pawns (most constrained movement)
      if (unitType === PieceType.PAWN) {
        const pawnCol = playerPos.col;
        const reachableColumns = [pawnCol - 1, pawnCol, pawnCol + 1].filter(
          col => col >= 0 && col < dimensions.cols
        );

        // Check if any enemy is in reachable columns
        let hasEnemyInLane = false;
        for (const enemy of enemyUnits) {
          const enemyPos = enemy.getPosition();
          if (reachableColumns.includes(enemyPos.col)) {
            hasEnemyInLane = true;
            break;
          }
        }

        // If no enemy in lane, move one into the lane
        if (!hasEnemyInLane && enemyUnits.length > 0) {
          console.log(`Pawn at column ${pawnCol} has no reachable enemies - fixing...`);

          // Find the closest enemy to the pawn's column
          let closestEnemy: Unit | null = null;
          let minDistance = Infinity;

          for (const enemy of enemyUnits) {
            const enemyPos = enemy.getPosition();
            const distance = Math.abs(enemyPos.col - pawnCol);
            if (distance < minDistance) {
              minDistance = distance;
              closestEnemy = enemy;
            }
          }

          if (closestEnemy) {
            // Move the closest enemy into the pawn's lane
            // Try columns in order: C+1, C, C-1 (prefer positions in front/center)
            const preferredColumns = [
              pawnCol + 1 < dimensions.cols ? pawnCol + 1 : null,
              pawnCol,
              pawnCol - 1 >= 0 ? pawnCol - 1 : null
            ].filter(col => col !== null) as number[];

            // Find a row in front of the player (closer to player's row)
            // Place enemy in rows 0 to playerRow-1
            const playerRow = playerPos.row;
            const targetRows = Array.from({ length: playerRow }, (_, i) => i);

            // Try to place in a random row in front of the player
            const shuffledRows = Phaser.Utils.Array.Shuffle([...targetRows]);

            let moved = false;
            for (const targetCol of preferredColumns) {
              for (const targetRow of shuffledRows) {
                const targetPos = { row: targetRow, col: targetCol };

                if (this.boardManager.isValidPosition(targetPos) &&
                    this.boardManager.getUnit(targetPos) === null) {
                  const enemyPos = closestEnemy.getPosition();
                  const captured = this.boardManager.moveUnit(enemyPos, targetPos);

                  // Update sprite position
                  const sprite = this.unitSprites.get(closestEnemy);
                  if (sprite) {
                    const newX = this.boardStartX + targetPos.col * this.tileSize + this.tileSize / 2;
                    const newY = this.boardStartY + targetPos.row * this.tileSize + this.tileSize / 2;
                    sprite.setPosition(newX, newY);
                  }

                  console.log(`Fixed: Moved enemy to lane (col ${targetPos.col}) for pawn at col ${pawnCol}`);
                  moved = true;
                  break; // Successfully moved enemy
                }
              }
              if (moved) break;
            }
          }
        }
      }
    }

    // Re-render to update visuals
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

    // Strategy 0: Check reachability first (especially for pawns)
    // This prevents "walking past each other" scenarios
    for (const playerUnit of playerUnits) {
      if (playerUnit.getType() === PieceType.PAWN) {
        const playerPos = playerUnit.getPosition();
        const pawnCol = playerPos.col;
        const reachableColumns = [pawnCol - 1, pawnCol, pawnCol + 1].filter(
          col => col >= 0 && col < dimensions.cols
        );

        // Check if any enemy is in reachable columns
        let hasEnemyInLane = false;
        for (const enemy of enemyUnits) {
          const enemyPos = enemy.getPosition();
          if (reachableColumns.includes(enemyPos.col)) {
            hasEnemyInLane = true;
            break;
          }
        }

        // If no enemy in lane, move one into the lane
        if (!hasEnemyInLane && enemyUnits.length > 0) {
          // Find the closest enemy
          let closestEnemy: Unit | null = null;
          let minDistance = Infinity;

          for (const enemy of enemyUnits) {
            const enemyPos = enemy.getPosition();
            const distance = Math.abs(enemyPos.col - pawnCol);
            if (distance < minDistance) {
              minDistance = distance;
              closestEnemy = enemy;
            }
          }

          if (closestEnemy) {
            // Move enemy into pawn's lane
            // Try columns in order: C+1, C, C-1 (prefer positions in front/center)
            const preferredColumns = [
              pawnCol + 1 < dimensions.cols ? pawnCol + 1 : null,
              pawnCol,
              pawnCol - 1 >= 0 ? pawnCol - 1 : null
            ].filter(col => col !== null) as number[];

            const playerRow = playerPos.row;
            const targetRows = Array.from({ length: playerRow }, (_, i) => i);
            const shuffledRows = Phaser.Utils.Array.Shuffle([...targetRows]);

            for (const targetCol of preferredColumns) {
              for (const targetRow of shuffledRows) {
                const targetPos = { row: targetRow, col: targetCol };

                if (this.boardManager.isValidPosition(targetPos) &&
                    this.boardManager.getUnit(targetPos) === null) {
                  const enemyPos = closestEnemy.getPosition();
                  this.boardManager.moveUnit(enemyPos, targetPos);

                  // Update sprite position
                  const sprite = this.unitSprites.get(closestEnemy);
                  if (sprite) {
                    const newX = this.boardStartX + targetPos.col * this.tileSize + this.tileSize / 2;
                    const newY = this.boardStartY + targetPos.row * this.tileSize + this.tileSize / 2;
                    sprite.setPosition(newX, newY);
                  }

                  console.log('Fixed: Moved enemy into pawn lane for reachability');
                  return true;
                }
              }
            }
          }
        }
      }
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
   * Implements stage-based difficulty with blunder chance and enhanced heuristics
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

    // Get current stage for difficulty calculation
    const currentStage = this.runState.getCurrentStage();

    // Calculate blunder chance based on stage
    let blunderChance: number;
    if (currentStage >= 10) {
      blunderChance = 0; // 0% chance at stage 10+
    } else if (currentStage >= 5) {
      blunderChance = 0.2; // 20% chance at stage 5-9
    } else {
      // Linear interpolation between stage 1 (40%) and stage 5 (20%)
      blunderChance = 0.4 - ((currentStage - 1) / 4) * 0.2;
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

    // Roll for blunder chance
    const roll = Math.random();
    let targetMove: Position;

    if (roll < blunderChance) {
      // Blunder: pick a random move
      targetMove = Phaser.Math.RND.pick(selected.moves);
      console.log(`[BLUNDER] Enemy ${selected.unit.getType()} making random move from (${selected.position.row}, ${selected.position.col}) to (${targetMove.row}, ${targetMove.col})`);
    } else {
      // Smart move: pick the highest scoring move
      targetMove = this.selectBestMove(selected.unit, selected.position, selected.moves, currentStage);
      console.log(`[SMART] Enemy ${selected.unit.getType()} moving from (${selected.position.row}, ${selected.position.col}) to (${targetMove.row}, ${targetMove.col})`);
    }

    // Execute the enemy move
    this.executeMove(selected.position, targetMove, true);
  }

  /**
   * Selects the best move for an enemy unit based on heuristics
   */
  private selectBestMove(unit: Unit, from: Position, moves: Position[], currentStage: number): Position {
    let bestMove = moves[0];
    let bestScore = -Infinity;

    // Get player units for distance calculation
    const playerUnits = this.boardManager.getUnitsByTeam(Team.PLAYER);
    const closestPlayerPos = this.findClosestPlayerPosition(from, playerUnits);

    for (const move of moves) {
      let score = 0;

      // Capture score: +100 if capturing
      const targetUnit = this.boardManager.getUnit(move);
      if (targetUnit && targetUnit.getTeam() === Team.PLAYER) {
        score += 100;
      }

      // Safety score (only for high difficulty > Stage 4): -50 if target square is under attack
      if (currentStage > 4) {
        if (this.isSquareUnderAttack(move, Team.ENEMY)) {
          score -= 50;
        }
      }

      // Aggression: +10 points for moving closer to player
      if (closestPlayerPos) {
        const currentDistance = this.getManhattanDistance(from, closestPlayerPos);
        const newDistance = this.getManhattanDistance(move, closestPlayerPos);
        if (newDistance < currentDistance) {
          score += 10;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /**
   * Checks if a square is under attack by units of the specified team
   */
  private isSquareUnderAttack(pos: Position, defendingTeam: Team): boolean {
    const attackingTeam = defendingTeam === Team.PLAYER ? Team.ENEMY : Team.PLAYER;
    const attackers = this.boardManager.getUnitsByTeam(attackingTeam);

    for (const attacker of attackers) {
      const attackerPos = attacker.getPosition();
      const validMoves = this.boardManager.getValidMoves(attackerPos);

      // Check if this attacker can reach the target position
      if (validMoves.some(move => move.row === pos.row && move.col === pos.col)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Finds the closest player unit position to a given position
   */
  private findClosestPlayerPosition(from: Position, playerUnits: Unit[]): Position | null {
    if (playerUnits.length === 0) {
      return null;
    }

    let closestPos: Position | null = null;
    let minDistance = Infinity;

    for (const playerUnit of playerUnits) {
      const playerPos = playerUnit.getPosition();
      const distance = this.getManhattanDistance(from, playerPos);

      if (distance < minDistance) {
        minDistance = distance;
        closestPos = playerPos;
      }
    }

    return closestPos;
  }

  /**
   * Calculates Manhattan distance between two positions
   */
  private getManhattanDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
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

      // Check for pawn promotion (only for player pawns)
      if (!isEnemyMove) {
        this.checkForPromotion(movedUnit, to);
      }
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
   * Checks if a pawn should be promoted and handles the promotion
   */
  private checkForPromotion(unit: Unit, position: Position): void {
    // Only promote player pawns that reach row 0
    if (unit.getType() !== PieceType.PAWN ||
        unit.getTeam() !== Team.PLAYER ||
        position.row !== 0) {
      return;
    }

    console.log('Pawn reached top row - promoting!');

    // Promotion pool: ROOK, KNIGHT, BISHOP (no Queen - too OP for 5x5)
    const promotionTypes: PieceType[] = [
      PieceType.ROOK,
      PieceType.KNIGHT,
      PieceType.BISHOP
    ];

    // Randomly select promotion type
    const promotedType = Phaser.Math.RND.pick(promotionTypes);

    // Store the pawn's buffs to transfer them
    const buffs = unit.getBuffs();

    // Remove the old pawn from RunState
    this.runState.removeUnit(unit);

    // Remove the old pawn from BoardManager
    this.boardManager.removeUnit(position);

    // Destroy the old pawn sprite
    const oldSprite = this.unitSprites.get(unit);
    if (oldSprite) {
      oldSprite.destroy();
      this.unitSprites.delete(unit);
    }

    // Create the new promoted unit
    let promotedUnit: Unit;
    switch (promotedType) {
      case PieceType.ROOK:
        promotedUnit = new Rook(Team.PLAYER, position);
        break;
      case PieceType.KNIGHT:
        promotedUnit = new Knight(Team.PLAYER, position);
        break;
      case PieceType.BISHOP:
        promotedUnit = new Bishop(Team.PLAYER, position);
        break;
      default:
        // Fallback (shouldn't happen)
        promotedUnit = new Rook(Team.PLAYER, position);
    }

    // Transfer buffs from the pawn to the promoted unit
    for (const buff of buffs) {
      promotedUnit.addBuff(buff);
    }

    // Add the new unit to RunState
    this.runState.addUnit(promotedUnit);

    // Place the new unit on the board at the same position
    this.boardManager.placeUnit(promotedUnit, position);

    // Render the new unit visually
    this.renderUnit(promotedUnit, position);

    console.log(`Pawn promoted to ${promotedType}!`);
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

