import { Position, PieceType, Team, Buff } from './types';
import type { BoardManager } from './BoardManager';

/**
 * Base class for all chess pieces
 * Supports custom movement rules and buff system for upgrades
 */
export abstract class Unit {
  protected type: PieceType;
  protected team: Team;
  protected position: Position;
  protected buffs: Buff[];
  protected health: number;
  protected maxHealth: number;
  protected hasMoved: boolean;

  constructor(type: PieceType, team: Team, position: Position) {
    this.type = type;
    this.team = team;
    this.position = position;
    this.buffs = [];
    this.health = 1;
    this.maxHealth = 1;
    this.hasMoved = false;
  }

  /**
   * Gets the unit's piece type
   */
  public getType(): PieceType {
    return this.type;
  }

  /**
   * Gets the unit's team
   */
  public getTeam(): Team {
    return this.team;
  }

  /**
   * Gets the unit's current position
   */
  public getPosition(): Position {
    return { ...this.position };
  }

  /**
   * Sets the unit's position
   */
  public setPosition(pos: Position): void {
    this.position = pos;
  }

  /**
   * Gets all buffs applied to this unit
   */
  public getBuffs(): Buff[] {
    return [...this.buffs];
  }

  /**
   * Adds a buff to this unit
   */
  public addBuff(buff: Buff): void {
    this.buffs.push(buff);
  }

  /**
   * Checks if the unit has a specific buff
   */
  public hasBuff(buffType: string): boolean {
    return this.buffs.some(buff => buff.type === buffType);
  }

  /**
   * Removes a buff from this unit
   */
  public removeBuff(buffType: string): void {
    this.buffs = this.buffs.filter(buff => buff.type !== buffType);
  }

  /**
   * Gets the unit's current health
   */
  public getHealth(): number {
    return this.health;
  }

  /**
   * Sets the unit's health
   */
  public setHealth(health: number): void {
    this.health = Math.max(0, Math.min(health, this.maxHealth));
  }

  /**
   * Damages the unit
   */
  public takeDamage(damage: number): void {
    // Check for shield buff
    if (this.hasBuff('SHIELD')) {
      this.removeBuff('SHIELD');
      return; // Shield absorbs the damage
    }

    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
    }
  }

  /**
   * Checks if the unit is alive
   */
  public isAlive(): boolean {
    return this.health > 0;
  }

  /**
   * Marks the unit as having moved
   */
  public markAsMoved(): void {
    this.hasMoved = true;
  }

  /**
   * Resets the moved flag
   */
  public resetMoved(): void {
    this.hasMoved = false;
  }

  /**
   * Checks if the unit has moved this turn
   */
  public getHasMoved(): boolean {
    return this.hasMoved;
  }

  /**
   * Abstract method to get possible moves for this unit
   * Must be implemented by each piece type
   */
  public abstract getPossibleMoves(currentPos: Position, board: BoardManager): Position[];

  /**
   * Helper method to check if a position is within bounds and not occupied by a friendly unit
   */
  protected isValidMove(pos: Position, board: BoardManager): boolean {
    if (!board.isValidPosition(pos)) {
      return false;
    }

    const targetUnit = board.getUnit(pos);
    return targetUnit === null || targetUnit.getTeam() !== this.team;
  }
}

/**
 * Pawn implementation
 */
export class Pawn extends Unit {
  constructor(team: Team, position: Position) {
    super(PieceType.PAWN, team, position);
  }

  public getPossibleMoves(currentPos: Position, board: BoardManager): Position[] {
    const moves: Position[] = [];
    const direction = this.team === Team.PLAYER ? -1 : 1; // Players move up, enemies move down
    const canMoveBackward = this.hasBuff('BACKWARD_MOVEMENT');

    // Forward move
    const forwardPos = { row: currentPos.row + direction, col: currentPos.col };
    if (board.isValidPosition(forwardPos) && board.getUnit(forwardPos) === null) {
      moves.push(forwardPos);

      // Double move on first move
      if (!this.hasMoved) {
        const doubleForwardPos = { row: currentPos.row + direction * 2, col: currentPos.col };
        if (board.isValidPosition(doubleForwardPos) && board.getUnit(doubleForwardPos) === null) {
          moves.push(doubleForwardPos);
        }
      }
    }

    // Diagonal captures
    const capturePositions = [
      { row: currentPos.row + direction, col: currentPos.col - 1 },
      { row: currentPos.row + direction, col: currentPos.col + 1 }
    ];

    for (const pos of capturePositions) {
      if (board.isValidPosition(pos)) {
        const targetUnit = board.getUnit(pos);
        if (targetUnit && targetUnit.getTeam() !== this.team) {
          moves.push(pos);
        }
      }
    }

    // Backward movement (with buff)
    if (canMoveBackward) {
      const backwardPos = { row: currentPos.row - direction, col: currentPos.col };
      if (board.isValidPosition(backwardPos) && board.getUnit(backwardPos) === null) {
        moves.push(backwardPos);
      }
    }

    return moves;
  }
}

/**
 * Rook implementation
 */
export class Rook extends Unit {
  constructor(team: Team, position: Position) {
    super(PieceType.ROOK, team, position);
  }

  public getPossibleMoves(currentPos: Position, board: BoardManager): Position[] {
    const moves: Position[] = [];
    const directions = [
      { row: 1, col: 0 },   // Down
      { row: -1, col: 0 },  // Up
      { row: 0, col: 1 },   // Right
      { row: 0, col: -1 }   // Left
    ];

    for (const dir of directions) {
      let distance = 1;
      const maxRange = this.hasBuff('EXTRA_RANGE') ? 10 : 8;

      while (distance <= maxRange) {
        const newPos = {
          row: currentPos.row + dir.row * distance,
          col: currentPos.col + dir.col * distance
        };

        if (!board.isValidPosition(newPos)) {
          break;
        }

        const targetUnit = board.getUnit(newPos);
        if (targetUnit === null) {
          moves.push(newPos);
        } else {
          if (targetUnit.getTeam() !== this.team) {
            moves.push(newPos);
          }
          break; // Can't move through pieces
        }

        distance++;
      }
    }

    return moves;
  }
}

/**
 * Knight implementation
 */
export class Knight extends Unit {
  constructor(team: Team, position: Position) {
    super(PieceType.KNIGHT, team, position);
  }

  public getPossibleMoves(currentPos: Position, board: BoardManager): Position[] {
    const moves: Position[] = [];
    const knightMoves = [
      { row: 2, col: 1 },
      { row: 2, col: -1 },
      { row: -2, col: 1 },
      { row: -2, col: -1 },
      { row: 1, col: 2 },
      { row: 1, col: -2 },
      { row: -1, col: 2 },
      { row: -1, col: -2 }
    ];

    for (const move of knightMoves) {
      const newPos = {
        row: currentPos.row + move.row,
        col: currentPos.col + move.col
      };

      if (this.isValidMove(newPos, board)) {
        moves.push(newPos);
      }
    }

    // Double move buff allows knight to move twice
    if (this.hasBuff('DOUBLE_MOVE')) {
      const secondaryMoves = [...moves];
      for (const intermediatePos of secondaryMoves) {
        for (const move of knightMoves) {
          const newPos = {
            row: intermediatePos.row + move.row,
            col: intermediatePos.col + move.col
          };

          if (this.isValidMove(newPos, board) &&
              !moves.some(m => m.row === newPos.row && m.col === newPos.col)) {
            moves.push(newPos);
          }
        }
      }
    }

    return moves;
  }
}

/**
 * Bishop implementation
 */
export class Bishop extends Unit {
  constructor(team: Team, position: Position) {
    super(PieceType.BISHOP, team, position);
  }

  public getPossibleMoves(currentPos: Position, board: BoardManager): Position[] {
    const moves: Position[] = [];
    const directions = [
      { row: 1, col: 1 },    // Down-right
      { row: 1, col: -1 },   // Down-left
      { row: -1, col: 1 },   // Up-right
      { row: -1, col: -1 }   // Up-left
    ];

    for (const dir of directions) {
      let distance = 1;
      const maxRange = this.hasBuff('EXTRA_RANGE') ? 10 : 8;

      while (distance <= maxRange) {
        const newPos = {
          row: currentPos.row + dir.row * distance,
          col: currentPos.col + dir.col * distance
        };

        if (!board.isValidPosition(newPos)) {
          break;
        }

        const targetUnit = board.getUnit(newPos);
        if (targetUnit === null) {
          moves.push(newPos);
        } else {
          if (targetUnit.getTeam() !== this.team) {
            moves.push(newPos);
          }
          break;
        }

        distance++;
      }
    }

    return moves;
  }
}

/**
 * Queen implementation
 */
export class Queen extends Unit {
  constructor(team: Team, position: Position) {
    super(PieceType.QUEEN, team, position);
  }

  public getPossibleMoves(currentPos: Position, board: BoardManager): Position[] {
    const moves: Position[] = [];
    const directions = [
      { row: 1, col: 0 },    // Down
      { row: -1, col: 0 },   // Up
      { row: 0, col: 1 },    // Right
      { row: 0, col: -1 },   // Left
      { row: 1, col: 1 },    // Down-right
      { row: 1, col: -1 },   // Down-left
      { row: -1, col: 1 },   // Up-right
      { row: -1, col: -1 }   // Up-left
    ];

    for (const dir of directions) {
      let distance = 1;
      const maxRange = this.hasBuff('EXTRA_RANGE') ? 10 : 8;

      while (distance <= maxRange) {
        const newPos = {
          row: currentPos.row + dir.row * distance,
          col: currentPos.col + dir.col * distance
        };

        if (!board.isValidPosition(newPos)) {
          break;
        }

        const targetUnit = board.getUnit(newPos);
        if (targetUnit === null) {
          moves.push(newPos);
        } else {
          if (targetUnit.getTeam() !== this.team) {
            moves.push(newPos);
          }
          break;
        }

        distance++;
      }
    }

    return moves;
  }
}

/**
 * King implementation
 */
export class King extends Unit {
  constructor(team: Team, position: Position) {
    super(PieceType.KING, team, position);
  }

  public getPossibleMoves(currentPos: Position, board: BoardManager): Position[] {
    const moves: Position[] = [];
    const directions = [
      { row: 1, col: 0 },    // Down
      { row: -1, col: 0 },   // Up
      { row: 0, col: 1 },    // Right
      { row: 0, col: -1 },   // Left
      { row: 1, col: 1 },    // Down-right
      { row: 1, col: -1 },   // Down-left
      { row: -1, col: 1 },   // Up-right
      { row: -1, col: -1 }   // Up-left
    ];

    for (const dir of directions) {
      const newPos = {
        row: currentPos.row + dir.row,
        col: currentPos.col + dir.col
      };

      if (this.isValidMove(newPos, board)) {
        moves.push(newPos);
      }
    }

    return moves;
  }
}

