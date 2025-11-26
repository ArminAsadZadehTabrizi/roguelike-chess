/**
 * Core type definitions for Roguelike Chess
 */

export interface Position {
  row: number;
  col: number;
}

export enum PieceType {
  PAWN = 'PAWN',
  ROOK = 'ROOK',
  KNIGHT = 'KNIGHT',
  BISHOP = 'BISHOP',
  QUEEN = 'QUEEN',
  KING = 'KING'
}

export enum Team {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY'
}

export enum BuffType {
  SHIELD = 'SHIELD',
  BACKWARD_MOVEMENT = 'BACKWARD_MOVEMENT',
  EXTRA_RANGE = 'EXTRA_RANGE',
  FIRE_DAMAGE = 'FIRE_DAMAGE',
  ICE_SLOW = 'ICE_SLOW',
  LIGHTNING_CHAIN = 'LIGHTNING_CHAIN',
  DOUBLE_MOVE = 'DOUBLE_MOVE',
  HEAL_ON_CAPTURE = 'HEAL_ON_CAPTURE'
}

export interface Buff {
  type: BuffType;
  name: string;
  description: string;
  value?: number;
}

export enum GamePhase {
  BATTLE = 'BATTLE',
  PATH_SELECTION = 'PATH_SELECTION',
  SHOP = 'SHOP',
  BLACKSMITH = 'BLACKSMITH',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum PathType {
  SHOP = 'SHOP',
  BLACKSMITH = 'BLACKSMITH'
}

export interface PathNode {
  type: PathType;
  description: string;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  type: 'PIECE' | 'CONSUMABLE' | 'BOARD_EXPANSION';
  pieceType?: PieceType;
  description: string;
}

export interface UpgradeOption {
  id: string;
  name: string;
  cost: number;
  buff: Buff;
  description: string;
  applicableTo: PieceType[];
}

