# Development Guide

This document provides technical details for developers working on Roguelike Chess.

## Architecture Overview

### Core Systems

#### BoardManager (`src/core/BoardManager.ts`)
The `BoardManager` is responsible for:
- Managing the dynamic grid system
- Validating positions and moves
- Handling unit placement and movement
- Detecting check and checkmate conditions
- Board expansion (adding rows/columns)

**Key Methods:**
- `placeUnit(unit, position)` - Places a unit on the board
- `moveUnit(from, to)` - Moves a unit and handles captures
- `getValidMoves(position)` - Returns valid moves for a unit
- `addRows(count)` / `addColumns(count)` - Expands the board
- `isCheckmate(team)` - Checks for checkmate

#### Unit System (`src/core/Unit.ts`)
The `Unit` class is an abstract base class for all chess pieces. Each piece type implements its own `getPossibleMoves()` method.

**Piece Types:**
- `Pawn` - Forward movement, diagonal captures
- `Rook` - Straight lines (horizontal/vertical)
- `Knight` - L-shaped jumps
- `Bishop` - Diagonal movement
- `Queen` - Combined rook + bishop movement
- `King` - One square in any direction

**Buff System:**
Units can have multiple buffs applied:
- Buffs are stored in the `buffs` array
- Common buffs: Shield, Extra Range, Double Move, etc.
- Buffs modify behavior in `getPossibleMoves()`

#### RunState (`src/core/RunState.ts`)
Manages the player's progression through a run:
- Gold balance and transactions
- Player unit collection (with permadeath)
- Current stage number
- Board dimensions
- Difficulty scaling

**Important:** Units removed from the board are permanently lost (permadeath).

### Scene Flow

```
BattleScene (Battle)
    ↓
PathSelectionScene (Choose path)
    ↓
ShopScene OR BlacksmithScene
    ↓
Back to BattleScene (Next stage)
```

#### BattleScene
- Sets up the board based on `RunState` dimensions
- Spawns player units from the deck
- Spawns enemy units based on difficulty
- Handles turn-based chess gameplay
- Checks victory/defeat conditions

**Victory Conditions:**
- Normal Round: All enemy pieces captured
- Boss Round (every 4th stage): Enemy king checkmated

#### PathSelectionScene
Simple UI to choose between Shop and Blacksmith paths.

#### ShopScene
- Generates random purchasable items
- Allows buying new pieces
- Allows buying board expansions
- Items are randomized each visit

#### BlacksmithScene
- Displays player units for selection
- Offers random upgrades applicable to selected unit
- Applies buffs to units

#### GameOverScene
- Displays final statistics
- Allows restarting with a fresh `RunState`

## Type System (`src/core/types.ts`)

Key interfaces and enums:
- `Position` - Row/column coordinates
- `PieceType` - Enum of chess piece types
- `Team` - PLAYER or ENEMY
- `BuffType` - Enum of available buffs
- `GamePhase` - Current phase of the game
- `ShopItem` - Shop purchase definitions
- `UpgradeOption` - Blacksmith upgrade definitions

## Adding New Features

### Adding a New Buff

1. Add the buff type to `BuffType` enum in `types.ts`
2. Implement the buff logic in the appropriate `Unit` class method (usually `getPossibleMoves()`)
3. Add the buff to available upgrades in `BlacksmithScene.ts`

Example:
```typescript
// In types.ts
export enum BuffType {
  // ...existing buffs...
  MY_NEW_BUFF = 'MY_NEW_BUFF'
}

// In Unit.ts (e.g., in Pawn class)
public getPossibleMoves(currentPos: Position, board: BoardManager): Position[] {
  const moves: Position[] = [];

  if (this.hasBuff('MY_NEW_BUFF')) {
    // Custom logic for your buff
  }

  return moves;
}

// In BlacksmithScene.ts
{
  id: 'my_new_buff',
  name: 'My New Buff',
  cost: 100,
  buff: {
    type: BuffType.MY_NEW_BUFF,
    name: 'My New Buff',
    description: 'Does something cool'
  },
  description: 'Detailed description',
  applicableTo: ['PAWN', 'KNIGHT'] // Which pieces can use it
}
```

### Adding a New Piece Type

1. Add the piece type to `PieceType` enum
2. Create a new class extending `Unit`
3. Implement `getPossibleMoves()`
4. Add to shop items if purchasable
5. Add to enemy spawn logic if enemies can use it

### Modifying Difficulty Scaling

The difficulty system is in `RunState.ts`:
- `getDifficultyFactor()` - Returns a multiplier based on current stage
- Used in `BattleScene.spawnEnemyUnits()` to determine enemy count and types
- Can be adjusted for easier/harder progression

## Testing Checklist

When adding new features, test:
- [ ] Unit movement is correct and follows chess rules
- [ ] Buffs are applied correctly
- [ ] Permadeath works (lost units don't return)
- [ ] Gold transactions work correctly
- [ ] Board expansion doesn't break unit positions
- [ ] Victory/defeat conditions trigger properly
- [ ] Scene transitions maintain `RunState`

## Performance Considerations

- Board validation happens frequently - keep `isValidPosition()` fast
- Valid move calculation can be expensive on large boards
- Consider caching valid moves if performance becomes an issue
- Large boards (10x10+) may need optimization

## Future Improvements

### High Priority
- Implement actual board rendering (currently logic only)
- Add move animations
- Add visual effects for captures
- Implement AI for enemy turns

### Medium Priority
- Save/load system
- More buff types
- Special enemy types with unique behaviors
- Consumable items

### Low Priority
- Multiple board themes
- Particle effects
- Achievement system
- Daily challenges

## Debugging Tips

**Enable Phaser debug mode:**
```typescript
// In main.ts
physics: {
  default: 'arcade',
  arcade: {
    debug: true // Set to true
  }
}
```

**Log game state:**
```typescript
console.log('RunState:', this.runState.toJSON());
console.log('Board dimensions:', this.boardManager.getDimensions());
console.log('Player units:', this.runState.getPlayerUnits());
```

**Common Issues:**
- Units not moving: Check `getPossibleMoves()` implementation
- Invalid positions: Ensure board expansion updates unit positions
- Missing units after battle: Check if permadeath removed them
- Scene not starting: Verify `RunState` is passed correctly

## Code Style

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Document public methods with JSDoc comments
- Use descriptive variable names
- Keep methods focused and single-purpose

## Git Workflow

1. Create a feature branch from `main`
2. Make atomic commits with clear messages
3. Test thoroughly before submitting PR
4. Update documentation if adding features

---

For questions, open an issue on GitHub!

