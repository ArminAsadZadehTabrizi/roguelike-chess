import { Position, Team } from './types';
import { Unit } from './Unit';

/**
 * BoardManager handles the dynamic chess grid system
 * Supports variable grid sizes (starting at 5x5) and expansion via upgrades
 */
export class BoardManager {
  private grid: (Unit | null)[][];
  private rows: number;
  private cols: number;

  constructor(initialRows: number = 5, initialCols: number = 5) {
    this.rows = initialRows;
    this.cols = initialCols;
    this.grid = this.createEmptyGrid(initialRows, initialCols);
  }

  /**
   * Creates an empty grid of the specified size
   */
  private createEmptyGrid(rows: number, cols: number): (Unit | null)[][] {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null)
    );
  }

  /**
   * Gets the current board dimensions
   */
  public getDimensions(): { rows: number; cols: number } {
    return { rows: this.rows, cols: this.cols };
  }

  /**
   * Checks if a position is within the board boundaries
   */
  public isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < this.rows &&
           pos.col >= 0 && pos.col < this.cols;
  }

  /**
   * Gets the unit at a specific position
   */
  public getUnit(pos: Position): Unit | null {
    if (!this.isValidPosition(pos)) {
      return null;
    }
    return this.grid[pos.row][pos.col];
  }

  /**
   * Places a unit at a specific position
   */
  public placeUnit(unit: Unit, pos: Position): boolean {
    if (!this.isValidPosition(pos)) {
      console.warn('Invalid position:', pos);
      return false;
    }

    if (this.grid[pos.row][pos.col] !== null) {
      console.warn('Position already occupied:', pos);
      return false;
    }

    this.grid[pos.row][pos.col] = unit;
    unit.setPosition(pos);
    return true;
  }

  /**
   * Moves a unit from one position to another
   * Returns the captured unit if any
   */
  public moveUnit(from: Position, to: Position): Unit | null {
    if (!this.isValidPosition(from) || !this.isValidPosition(to)) {
      console.warn('Invalid move positions:', from, to);
      return null;
    }

    const unit = this.grid[from.row][from.col];
    if (!unit) {
      console.warn('No unit at source position:', from);
      return null;
    }

    const capturedUnit = this.grid[to.row][to.col];

    // Move the unit
    this.grid[to.row][to.col] = unit;
    this.grid[from.row][from.col] = null;
    unit.setPosition(to);

    return capturedUnit;
  }

  /**
   * Removes a unit from the board
   */
  public removeUnit(pos: Position): Unit | null {
    if (!this.isValidPosition(pos)) {
      return null;
    }

    const unit = this.grid[pos.row][pos.col];
    this.grid[pos.row][pos.col] = null;
    return unit;
  }

  /**
   * Expands the board by adding rows
   */
  public addRows(count: number, addToTop: boolean = false): void {
    const newRows = Array.from({ length: count }, () =>
      Array.from({ length: this.cols }, () => null)
    );

    if (addToTop) {
      this.grid = [...newRows, ...this.grid];
      // Update positions of all existing units
      this.updateAllUnitPositions(count, 0);
    } else {
      this.grid = [...this.grid, ...newRows];
    }

    this.rows += count;
  }

  /**
   * Expands the board by adding columns
   */
  public addColumns(count: number, addToLeft: boolean = false): void {
    for (let row = 0; row < this.rows; row++) {
      const newCells = Array.from({ length: count }, () => null);

      if (addToLeft) {
        this.grid[row] = [...newCells, ...this.grid[row]];
      } else {
        this.grid[row] = [...this.grid[row], ...newCells];
      }
    }

    if (addToLeft) {
      // Update positions of all existing units
      this.updateAllUnitPositions(0, count);
    }

    this.cols += count;
  }

  /**
   * Updates positions of all units after board expansion
   */
  private updateAllUnitPositions(rowOffset: number, colOffset: number): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const unit = this.grid[row][col];
        if (unit) {
          unit.setPosition({ row: row + rowOffset, col: col + colOffset });
        }
      }
    }
  }

  /**
   * Gets all units of a specific team
   */
  public getUnitsByTeam(team: Team): Unit[] {
    const units: Unit[] = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const unit = this.grid[row][col];
        if (unit && unit.getTeam() === team) {
          units.push(unit);
        }
      }
    }

    return units;
  }

  /**
   * Gets all valid moves for a unit at a position
   */
  public getValidMoves(pos: Position): Position[] {
    const unit = this.getUnit(pos);
    if (!unit) {
      return [];
    }

    const possibleMoves = unit.getPossibleMoves(pos, this);

    // Filter out moves that would result in invalid positions
    return possibleMoves.filter(move => {
      if (!this.isValidPosition(move)) {
        return false;
      }

      const targetUnit = this.getUnit(move);
      // Can move to empty squares or capture enemy pieces
      return targetUnit === null || targetUnit.getTeam() !== unit.getTeam();
    });
  }

  /**
   * Clears the entire board
   */
  public clear(): void {
    this.grid = this.createEmptyGrid(this.rows, this.cols);
  }

  /**
   * Gets a copy of the grid for rendering or AI purposes
   */
  public getGrid(): (Unit | null)[][] {
    return this.grid.map(row => [...row]);
  }

  /**
   * Checks if a team's King is in check
   */
  public isKingInCheck(team: Team): boolean {
    // Find the king
    const king = this.getUnitsByTeam(team).find(unit => unit.getType() === 'KING');
    if (!king) {
      return false; // No king, no check (for non-boss rounds)
    }

    const kingPos = king.getPosition();
    const enemyTeam = team === Team.PLAYER ? Team.ENEMY : Team.PLAYER;
    const enemyUnits = this.getUnitsByTeam(enemyTeam);

    // Check if any enemy unit can attack the king
    for (const enemy of enemyUnits) {
      const validMoves = this.getValidMoves(enemy.getPosition());
      if (validMoves.some(move => move.row === kingPos.row && move.col === kingPos.col)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if a team is in checkmate
   */
  public isCheckmate(team: Team): boolean {
    if (!this.isKingInCheck(team)) {
      return false;
    }

    // Check if any move can get out of check
    const friendlyUnits = this.getUnitsByTeam(team);

    for (const unit of friendlyUnits) {
      const validMoves = this.getValidMoves(unit.getPosition());

      for (const move of validMoves) {
        // Simulate the move
        const originalPos = unit.getPosition();
        const capturedUnit = this.simulateMove(originalPos, move);

        const stillInCheck = this.isKingInCheck(team);

        // Undo the move
        this.undoMove(originalPos, move, unit, capturedUnit);

        if (!stillInCheck) {
          return false; // Found a move that gets out of check
        }
      }
    }

    return true; // No moves can get out of check
  }

  /**
   * Simulates a move without triggering game events
   */
  private simulateMove(from: Position, to: Position): Unit | null {
    const unit = this.grid[from.row][from.col];
    const capturedUnit = this.grid[to.row][to.col];

    this.grid[to.row][to.col] = unit;
    this.grid[from.row][from.col] = null;

    return capturedUnit;
  }

  /**
   * Undoes a simulated move
   */
  private undoMove(from: Position, to: Position, unit: Unit, capturedUnit: Unit | null): void {
    this.grid[from.row][from.col] = unit;
    this.grid[to.row][to.col] = capturedUnit;
  }
}

