# Roguelike Chess

A 2D Chess Roguelike inspired by **Balatro** and **Into the Breach**, built with Phaser 3 and TypeScript.

**Repository:** [https://github.com/ArminAsadZadehTabrizi/roguelike-chess](https://github.com/ArminAsadZadehTabrizi/roguelike-chess)

---

## 🎮 Game Overview

Roguelike Chess combines strategic chess gameplay with roguelike progression systems. Fight through increasingly difficult battles, upgrade your pieces, and expand your board to survive as long as possible!

### Core Gameplay Loop

1. **Battle Phase** - Defeat all enemy pieces using chess mechanics
2. **Path Selection** - Choose between Shop or Blacksmith
3. **Upgrade Phase** - Buy new pieces or enhance existing ones
4. **Repeat** - Progress through stages with increasing difficulty

---

## ✨ Key Features

### Dynamic Board System
- **Variable Grid Size** - Start with a 5x5 board (not the traditional 8x8)
- **Expandable** - Purchase board expansions to add rows and columns
- **Adaptive Strategy** - Larger boards open new tactical possibilities

### Victory Conditions
- **Normal Rounds** - Capture all enemy pieces
- **Boss Rounds** (Every 4th stage) - Checkmate or capture the enemy King

### Permadeath & Economy
- **Permadeath** - Lost pieces are gone for the entire run
- **Gold System** - Earn gold from victories to purchase upgrades
- **Strategic Investment** - Balance buying new pieces vs. upgrading existing ones

### Unit Buffs & Upgrades
Enhance your pieces with powerful buffs:
- **Shield** - Absorbs one hit
- **Backward Movement** - Pawns can move backward
- **Extra Range** - Increased movement range
- **Double Move** - Knights can jump twice
- **Fire Damage** - Deal elemental damage
- **And more!**

### Path System
After each battle, choose your path:
- **🛒 Shop** - Buy new pieces, board expansions, or consumables
- **⚒️ Blacksmith** - Upgrade existing pieces with powerful buffs

---

## 🏗️ Technical Architecture

### Core Systems

#### `BoardManager`
Handles the dynamic chess grid system:
- Variable board dimensions (starting at 5x5)
- Board expansion functionality
- Unit placement and movement
- Valid move calculation
- Check and checkmate detection

#### `Unit` (Base Class)
Abstract base class for all chess pieces:
- Custom movement rules per piece type
- Buff system for upgrades
- Health and damage system
- Position tracking

**Implemented Pieces:**
- Pawn
- Rook
- Knight
- Bishop
- Queen
- King

#### `RunState`
Manages player progression:
- Gold tracking and transactions
- Unit deck management (permadeath)
- Stage progression
- Board dimension tracking
- Difficulty scaling

#### `Game Scenes`
- **BattleScene** - Main chess gameplay
- **PathSelectionScene** - Choose between Shop and Blacksmith
- **ShopScene** - Purchase new pieces and board expansions
- **BlacksmithScene** - Upgrade existing pieces
- **GameOverScene** - End screen with statistics

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ArminAsadZadehTabrizi/roguelike-chess.git

# Navigate to the project directory
cd roguelike-chess

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The game will open in your browser at `http://localhost:3000`

### Build for Production

```bash
# Create a production build
npm run build

# Preview the production build
npm run preview
```

### Type Checking

```bash
# Run TypeScript type checking
npm run typecheck
```

---

## 📁 Project Structure

```
roguelike-chess/
├── src/
│   ├── core/                 # Core game logic
│   │   ├── BoardManager.ts   # Grid system and movement
│   │   ├── Unit.ts           # Chess pieces and buffs
│   │   ├── RunState.ts       # Game state management
│   │   └── types.ts          # TypeScript type definitions
│   │
│   ├── scenes/               # Phaser scenes
│   │   ├── BattleScene.ts    # Chess battle gameplay
│   │   ├── PathSelectionScene.ts
│   │   ├── ShopScene.ts
│   │   ├── BlacksmithScene.ts
│   │   └── GameOverScene.ts
│   │
│   └── main.ts               # Game entry point
│
├── index.html                # HTML entry point
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── README.md                 # This file
```

---

## 🎯 Game Design Goals

### Inspired by Balatro
- **Deck Building** - Collect and customize your chess pieces
- **Synergies** - Combine buffs for powerful combinations
- **Strategic Choices** - Every decision matters

### Inspired by Into the Breach
- **Perfect Information** - See enemy positions and plan accordingly
- **Tactical Depth** - Use chess mechanics for deep strategy
- **Difficulty Scaling** - Progressive challenge with fair difficulty

### Unique Mechanics
- **Dynamic Board** - The board itself is a strategic resource
- **Permadeath** - Every piece loss is meaningful
- **Chess Foundation** - Classic chess rules with roguelike twists

---

## 🛠️ Development Roadmap

### Phase 1: Core Mechanics ✅
- [x] Board system with dynamic sizing
- [x] All chess piece implementations
- [x] Buff system for upgrades
- [x] Basic game loop (Battle → Path → Shop/Blacksmith)
- [x] Boss stage detection

### Phase 2: Visual Polish (In Progress)
- [ ] Sprite assets for chess pieces
- [ ] Board rendering with tiles
- [ ] Animations for moves and captures
- [ ] UI polish and effects
- [ ] Sound effects and music

### Phase 3: Content Expansion
- [ ] More buff types
- [ ] Consumable items
- [ ] Special enemy types
- [ ] Multiple biomes/themes
- [ ] Achievements

### Phase 4: Balance & Polish
- [ ] Difficulty tuning
- [ ] Save/load system
- [ ] Daily challenges
- [ ] Leaderboards
- [ ] Mobile support

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Balatro** - For inspiring the deck-building and synergy mechanics
- **Into the Breach** - For tactical combat design principles
- **Phaser 3** - For the excellent game framework
- **Chess** - For centuries of strategic gameplay

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

**Repository:** [https://github.com/ArminAsadZadehTabrizi/roguelike-chess](https://github.com/ArminAsadZadehTabrizi/roguelike-chess)

