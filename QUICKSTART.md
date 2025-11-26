# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- **Phaser 3.70.0** - Game framework
- **TypeScript 5.3.3** - Type safety
- **Vite 5.0.10** - Fast build tool

### 2. Start Development Server

```bash
npm run dev
```

The game will automatically open in your browser at `http://localhost:3000`

### 3. Start Playing!

**Initial Setup:**
- You start with 1 Pawn and 100 Gold
- Board size: 5x5 (expandable)
- Stage 1 begins automatically

**Gameplay:**
1. **Battle** - Use chess moves to capture all enemy pieces
2. **Victory** - Earn gold based on stage difficulty
3. **Path Selection** - Choose Shop or Blacksmith
4. **Upgrade** - Buy new pieces or enhance existing ones
5. **Repeat** - Continue to higher stages

**Boss Stages:**
- Every 4th stage (4, 8, 12...)
- Enemy has a King
- Victory condition: Checkmate or capture the King

---

## 🎮 How to Play

### Controls
- **Click** - Select and move pieces (logic implemented)
- Board rendering is basic - focus is on game logic

### Victory Conditions
- **Normal Rounds**: Capture all enemy pieces
- **Boss Rounds**: Checkmate the enemy King

### Defeat Condition
- Lose all your pieces = Game Over

### Economy
- Start: 100 Gold
- Earn gold after each victory
- Boss stages give bonus gold
- Spend in Shop or Blacksmith

---

## 🛒 Shop vs ⚒️ Blacksmith

### Shop
**Buy new pieces:**
- Pawn - 50 Gold
- Knight - 150 Gold
- Bishop - 180 Gold
- Rook - 200 Gold
- Queen - Available at higher difficulties

**Board Expansion:**
- 120 Gold
- Adds 1 row and 1 column to the board

### Blacksmith
**Upgrade existing pieces:**
- Shield - 80 Gold (Absorbs one hit)
- Backward Movement - 60 Gold (Pawns move backward)
- Extra Range - 100 Gold (Increased range)
- Double Move - 120 Gold (Knight jumps twice)
- Fire Damage - 90 Gold (Elemental effect)

**How to upgrade:**
1. Click a unit to select it
2. Click an upgrade that applies to that unit type
3. Spend gold to apply the buff

---

## 📋 Build Commands

```bash
# Development with hot reload
npm run dev

# Type checking (without building)
npm run typecheck

# Production build
npm run build

# Preview production build
npm run preview
```

---

## 🏗️ Project Status

### ✅ Implemented
- Dynamic board system with expansion
- All 6 chess piece types with correct movement
- Buff/upgrade system
- Shop and Blacksmith systems
- Difficulty scaling
- Boss stages every 4th round
- Permadeath system
- Gold economy
- Game loop (Battle → Path → Shop/Blacksmith)

### 🚧 In Progress (Next Steps)
- Visual board rendering with sprites
- Click-to-move interaction
- Move animations
- Unit sprites for pieces
- Sound effects
- UI polish

### 📝 Notes
The current implementation focuses on **game logic and architecture**. The Phaser scenes are set up but board rendering is minimal. This provides a solid foundation to add visuals on top of working game mechanics.

---

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Edit vite.config.ts and change the port
server: {
  port: 3001  // Change to any available port
}
```

**TypeScript errors?**
```bash
# Make sure dependencies are installed
npm install

# Run type checking
npm run typecheck
```

**Game not loading?**
- Check browser console for errors
- Ensure all files are saved
- Try clearing browser cache

---

## 📚 Next Steps

1. **Play around with the logic** - Check browser console for logs
2. **Add visual rendering** - Implement board tiles and piece sprites in `BattleScene.ts`
3. **Implement click handling** - Add coordinate conversion in `handleBoardClick()`
4. **Create assets** - Design or find sprites for chess pieces
5. **Add animations** - Use Phaser tweens for smooth movement

---

## 🔗 Useful Resources

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 3 Examples](https://phaser.io/examples)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Repository:** [https://github.com/ArminAsadZadehTabrizi/roguelike-chess](https://github.com/ArminAsadZadehTabrizi/roguelike-chess)

Enjoy building your Roguelike Chess game! 🎉

