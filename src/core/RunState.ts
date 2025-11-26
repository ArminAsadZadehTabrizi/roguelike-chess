import { Unit } from './Unit';
import { GamePhase } from './types';

/**
 * RunState tracks the player's progress through a single run
 * Manages gold, unit deck, stage progression, and permadeath
 */
export class RunState {
  private gold: number;
  private playerUnits: Unit[];
  private currentStage: number;
  private gamePhase: GamePhase;
  private boardRows: number;
  private boardCols: number;

  constructor() {
    this.gold = 100; // Starting gold
    this.playerUnits = [];
    this.currentStage = 1;
    this.gamePhase = GamePhase.BATTLE;
    this.boardRows = 5;
    this.boardCols = 5;
  }

  /**
   * Gets the current gold amount
   */
  public getGold(): number {
    return this.gold;
  }

  /**
   * Adds gold to the player's balance
   */
  public addGold(amount: number): void {
    this.gold += amount;
  }

  /**
   * Spends gold if the player has enough
   * Returns true if successful, false if insufficient funds
   */
  public spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      return true;
    }
    return false;
  }

  /**
   * Gets all player units
   */
  public getPlayerUnits(): Unit[] {
    return [...this.playerUnits];
  }

  /**
   * Adds a unit to the player's deck
   */
  public addUnit(unit: Unit): void {
    this.playerUnits.push(unit);
  }

  /**
   * Removes a unit from the player's deck (permadeath)
   */
  public removeUnit(unit: Unit): void {
    this.playerUnits = this.playerUnits.filter(u => u !== unit);
  }

  /**
   * Gets the number of units in the player's deck
   */
  public getUnitCount(): number {
    return this.playerUnits.length;
  }

  /**
   * Checks if the player has any units left
   */
  public hasUnitsRemaining(): boolean {
    return this.playerUnits.length > 0;
  }

  /**
   * Gets the current stage number
   */
  public getCurrentStage(): number {
    return this.currentStage;
  }

  /**
   * Advances to the next stage
   */
  public advanceStage(): void {
    this.currentStage++;
  }

  /**
   * Checks if the current stage is a boss stage
   * Boss stages occur every 4th round (4, 8, 12, etc.)
   */
  public isBossStage(): boolean {
    return this.currentStage % 4 === 0;
  }

  /**
   * Gets the current game phase
   */
  public getGamePhase(): GamePhase {
    return this.gamePhase;
  }

  /**
   * Sets the current game phase
   */
  public setGamePhase(phase: GamePhase): void {
    this.gamePhase = phase;
  }

  /**
   * Gets the current board dimensions
   */
  public getBoardDimensions(): { rows: number; cols: number } {
    return { rows: this.boardRows, cols: this.boardCols };
  }

  /**
   * Expands the board by adding rows
   */
  public expandBoardRows(count: number): void {
    this.boardRows += count;
  }

  /**
   * Expands the board by adding columns
   */
  public expandBoardCols(count: number): void {
    this.boardCols += count;
  }

  /**
   * Resets the run state for a new game
   */
  public reset(): void {
    this.gold = 100;
    this.playerUnits = [];
    this.currentStage = 1;
    this.gamePhase = GamePhase.BATTLE;
    this.boardRows = 5;
    this.boardCols = 5;
  }

  /**
   * Calculates gold reward based on stage difficulty
   */
  public calculateGoldReward(): number {
    const baseReward = 50;
    const stageMultiplier = Math.floor(this.currentStage / 4);
    const bossBonus = this.isBossStage() ? 100 : 0;

    return baseReward + (stageMultiplier * 10) + bossBonus;
  }

  /**
   * Gets the difficulty factor for the current stage
   */
  public getDifficultyFactor(): number {
    return 1 + (this.currentStage - 1) * 0.2;
  }

  /**
   * Serializes the run state to JSON for saving
   */
  public toJSON(): object {
    return {
      gold: this.gold,
      currentStage: this.currentStage,
      gamePhase: this.gamePhase,
      boardRows: this.boardRows,
      boardCols: this.boardCols,
      unitCount: this.playerUnits.length
    };
  }
}

