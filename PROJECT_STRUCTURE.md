# Project Structure

## 📁 Directory Overview

```
roguelike-chess/
│
├── 📄 Configuration Files
│   ├── package.json          # Dependencies and npm scripts
│   ├── tsconfig.json         # TypeScript configuration
│   ├── vite.config.ts        # Vite build configuration
│   └── .gitignore           # Git ignore patterns
│
├── 📝 Documentation
│   ├── README.md            # Main project documentation
│   ├── QUICKSTART.md        # Quick start guide
│   ├── DEVELOPMENT.md       # Developer guide
│   ├── PROJECT_STRUCTURE.md # This file
│   ├── LICENSE              # MIT License
│   └── .github/
│       └── CONTRIBUTING.md  # Contribution guidelines
│
├── 🌐 Entry Point
│   └── index.html           # HTML entry point
│
└── 💻 Source Code (src/)
    │
    ├── 🎮 main.ts           # Phaser game initialization
    │
    ├── 🎯 core/             # Core game logic
    │   ├── types.ts         # TypeScript type definitions
    │   ├── BoardManager.ts  # Dynamic grid system
    │   ├── Unit.ts          # Chess pieces and buffs
    │   └── RunState.ts      # Game state management
    │
    └── 🎬 scenes/           # Phaser game scenes
        ├── BattleScene.ts           # Chess battle gameplay
        ├── PathSelectionScene.ts    # Path choice UI
        ├── ShopScene.ts             # Purchase pieces
        ├── BlacksmithScene.ts       # Upgrade pieces
        └── GameOverScene.ts         # End screen
```

---

## 📦 Core Modules

### `src/core/types.ts`
**Purpose:** Central type definitions

**Exports:**
- `Position` - Board coordinates (row, col)
- `PieceType` - Enum of chess pieces
- `Team` - PLAYER or ENEMY
- `BuffType` - Available buff types
- `GamePhase` - Current game state
- `PathType` - Shop or Blacksmith
- `ShopItem` - Shop purchase data
- `UpgradeOption` - Blacksmith upgrade data
- `Buff` - Buff definition interface

---

### `src/core/BoardManager.ts`
**Purpose:** Dynamic chess grid management

**Key Features:**
- Variable board size (starts 5x5)
- Board expansion (add rows/columns)
- Unit placement and movement
- Valid move calculation
- Check/checkmate detection

**Main Methods:**
```typescript
placeUnit(unit, position)         // Place unit on board
moveUnit(from, to)                // Move and capture
getValidMoves(position)           // Get legal moves
addRows(count, addToTop)         // Expand board vertically
addColumns(count, addToLeft)     // Expand board horizontally
getUnitsByTeam(team)             // Get all units of a team
isKingInCheck(team)              // Check detection
isCheckmate(team)                // Checkmate detection
```

**Dependencies:**
- `Unit` classes
- `Position`, `Team` types

---

### `src/core/Unit.ts`
**Purpose:** Chess piece implementations

**Class Hierarchy:**
```
Unit (abstract)
├── Pawn
├── Rook
├── Knight
├── Bishop
├── Queen
└── King
```

**Base Unit Class:**
```typescript
abstract class Unit {
  protected type: PieceType
  protected team: Team
  protected position: Position
  protected buffs: Buff[]
  protected health: number

  // Abstract method each piece implements
  abstract getPossibleMoves(pos, board): Position[]

  // Buff management
  addBuff(buff)
  hasBuff(buffType)
  removeBuff(buffType)

  // Game mechanics
  takeDamage(damage)
  isAlive()
  markAsMoved()
}
```

**Piece Implementations:**
Each piece class implements unique movement patterns in `getPossibleMoves()`.

**Dependencies:**
- `BoardManager` (for move validation)
- `Position`, `PieceType`, `Team`, `Buff` types

---

### `src/core/RunState.ts`
**Purpose:** Track player progression

**Manages:**
- Gold balance
- Player unit collection
- Current stage number
- Board dimensions
- Game phase
- Difficulty scaling

**Key Methods:**
```typescript
getGold() / addGold(amount) / spendGold(amount)
getPlayerUnits() / addUnit(unit) / removeUnit(unit)
getCurrentStage() / advanceStage()
isBossStage()                    // Every 4th stage
getBoardDimensions()
expandBoardRows() / expandBoardCols()
calculateGoldReward()            // Based on stage
getDifficultyFactor()            // Scales with stage
```

**Dependencies:**
- `Unit` classes
- `GamePhase` type

---

## 🎬 Scene Flow

### Scene Transition Diagram

```
┌─────────────────┐
│  BattleScene    │ ← Game starts here
│  (Chess Battle) │
└────────┬────────┘
         │
    Victory/Defeat
         │
    ┌────▼─────┐           ┌──────────────┐
    │ Victory? │──Yes──────►│ PathSelection│
    └────┬─────┘           └──────┬───────┘
         │                         │
         No                  ┌─────┴─────┐
         │                   │           │
    ┌────▼────────┐    ┌────▼────┐  ┌──▼─────────┐
    │ GameOverScene│    │ShopScene│  │Blacksmith  │
    │  (Restart)   │    └────┬────┘  └──┬─────────┘
    └──────────────┘         │          │
                            └───┬───────┘
                                │
                         ┌──────▼────────┐
                         │  BattleScene  │
                         │  (Next Stage) │
                         └───────────────┘
```

---

### `src/scenes/BattleScene.ts`
**Purpose:** Main chess gameplay

**Responsibilities:**
- Initialize board from RunState dimensions
- Spawn player units from deck
- Spawn enemy units (difficulty-scaled)
- Handle player input (TODO: rendering)
- Validate and execute moves
- Check victory/defeat conditions
- Award gold and advance stage

**Game Loop:**
1. Setup board
2. Place units
3. Player turn (select & move)
4. Check victory conditions
5. Transition to next scene

**Dependencies:**
- `BoardManager`
- `RunState`
- All `Unit` classes

---

### `src/scenes/PathSelectionScene.ts`
**Purpose:** Choose upgrade path

**UI Elements:**
- Shop button → ShopScene
- Blacksmith button → BlacksmithScene
- Stage/gold display

**Simple scene - just handles path choice.**

---

### `src/scenes/ShopScene.ts`
**Purpose:** Purchase new pieces and expansions

**Features:**
- Random item generation
- Chess piece purchases (Pawn, Knight, Rook, etc.)
- Board expansion purchases
- Gold validation
- Continue to next battle

**Item Generation:**
- Shuffles available items
- Shows 4 random options
- Prices increase with rarity

**Dependencies:**
- `RunState` (for gold and units)
- `ShopItem` type

---

### `src/scenes/BlacksmithScene.ts`
**Purpose:** Upgrade existing pieces

**Features:**
- Display player units
- Unit selection
- Random upgrade generation
- Buff application
- Gold validation

**Workflow:**
1. Player selects a unit
2. Shows applicable upgrades
3. Player purchases upgrade
4. Buff added to unit

**Dependencies:**
- `RunState` (for gold and units)
- `UpgradeOption`, `Buff` types

---

### `src/scenes/GameOverScene.ts`
**Purpose:** End screen

**Displays:**
- Final stage reached
- Final gold total

**Actions:**
- Restart with new RunState

---

## 🎮 Main Game Entry

### `src/main.ts`
**Purpose:** Initialize Phaser game

**Configuration:**
- Canvas size: 1280x920
- Background: Dark theme
- All scenes registered
- Physics: Arcade (minimal use)

**Starts with:** `BattleScene`

---

## 🔄 Data Flow

### Typical Game Run

```
1. Game Start
   └─> BattleScene creates new RunState
       └─> Gold: 100, Units: 1 Pawn, Board: 5x5

2. Battle Victory
   └─> Add gold reward
   └─> Advance stage
   └─> Transition to PathSelection

3. Path Selection
   └─> Player chooses Shop or Blacksmith
   └─> RunState passed to chosen scene

4. Shop/Blacksmith
   └─> Player spends gold
   └─> Units added or upgraded
   └─> RunState modified
   └─> Continue to next BattleScene

5. Repeat 2-4
   └─> Difficulty scales each stage
   └─> Every 4th stage is Boss
   └─> Run continues until defeat

6. Defeat (All units lost)
   └─> GameOverScene
   └─> Display stats
   └─> Restart = new RunState
```

---

## 🛠️ Build Pipeline

### Development Mode (`npm run dev`)
```
index.html
    ↓
src/main.ts
    ↓
Import all scenes and core modules
    ↓
Vite bundles with HMR
    ↓
Browser at localhost:3000
```

### Production Build (`npm run build`)
```
TypeScript compilation (tsc)
    ↓
Vite optimized build
    ↓
Output to dist/
    ↓
Static files ready for deployment
```

---

## 📊 State Management

### RunState as Single Source of Truth

```
RunState
├── gold (number)
├── currentStage (number)
├── gamePhase (GamePhase)
├── playerUnits (Unit[])
└── boardDimensions ({ rows, cols })
```

**Passed between scenes:**
- Each scene receives `RunState` via `init(data)`
- Scenes modify `RunState` directly
- Modified `RunState` passed to next scene
- Ensures consistent game state

---

## 🔌 External Dependencies

### Runtime Dependencies
- **phaser@3.70.0** - Game framework

### Dev Dependencies
- **typescript@5.3.3** - Type system
- **vite@5.0.10** - Build tool
- **@types/node@20.10.6** - Node types

---

## 🎨 Future Structure Additions

### Planned Directories

```
src/
├── assets/              # Game assets
│   ├── sprites/        # Chess piece sprites
│   ├── tiles/          # Board tiles
│   ├── ui/             # UI elements
│   ├── sounds/         # Sound effects
│   └── music/          # Background music
│
├── utils/              # Helper functions
│   ├── constants.ts    # Game constants
│   ├── helpers.ts      # Utility functions
│   └── ai.ts           # Enemy AI
│
└── components/         # Reusable components
    ├── UIButton.ts     # Button component
    ├── InfoPanel.ts    # Info display
    └── Tooltip.ts      # Tooltip system
```

---

## 📝 File Naming Conventions

- **PascalCase**: Class files (BoardManager.ts, Unit.ts)
- **PascalCase**: Scene files (BattleScene.ts)
- **camelCase**: Utility files (types.ts, main.ts)
- **UPPERCASE**: Documentation (README.md, LICENSE)

---

## 🔍 Key Design Patterns

### Architecture Pattern
**Component-Based with Scene Management**
- Phaser scenes act as controllers
- Core classes handle game logic
- Clear separation of concerns

### State Management
**Shared RunState Object**
- Passed between scenes
- Mutable state (acceptable for game)
- Single source of truth

### OOP Patterns
**Abstract Base Classes**
- Unit as abstract base
- Each piece extends Unit
- Polymorphism for move calculation

**Manager Pattern**
- BoardManager handles board logic
- Encapsulates grid operations

---

This structure provides a solid foundation for a scalable roguelike chess game!

