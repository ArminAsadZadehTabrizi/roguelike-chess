# Contributing to Roguelike Chess

Thank you for considering contributing to Roguelike Chess! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Bugs
1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, browser, etc.)

### Suggesting Features
1. Open an issue with the "enhancement" label
2. Describe the feature in detail
3. Explain why it would be valuable
4. Include mockups or examples if possible

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 💻 Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/roguelike-chess.git

# Add upstream remote
git remote add upstream https://github.com/ArminAsadZadehTabrizi/roguelike-chess.git

# Install dependencies
npm install

# Start development
npm run dev
```

## 📝 Code Guidelines

### TypeScript
- Use strict type checking (already enabled)
- Avoid `any` types
- Document public methods with JSDoc
- Use interfaces for complex types

### Code Style
- Use meaningful variable names
- Keep functions focused and small
- Follow existing code structure
- Add comments for complex logic

### Commits
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Reference issues when applicable (`Fix #123`)

## 🧪 Testing

Before submitting:
- [ ] Code compiles without errors (`npm run typecheck`)
- [ ] Game runs without crashes (`npm run dev`)
- [ ] New features work as expected
- [ ] No regressions in existing features
- [ ] Console has no errors

## 🎯 Good First Issues

Look for issues labeled `good first issue` - these are great for newcomers!

## 📚 Resources

- [Project README](../README.md)
- [Development Guide](../DEVELOPMENT.md)
- [Quick Start Guide](../QUICKSTART.md)

## 💡 Ideas for Contributions

### Code
- New buff types
- Additional piece types
- Enemy AI improvements
- Visual effects and animations
- Save/load system
- Mobile support

### Art & Assets
- Chess piece sprites
- Board tile designs
- UI elements
- Sound effects
- Music tracks

### Documentation
- Tutorial improvements
- API documentation
- Code examples
- Video guides

## ❓ Questions?

Feel free to:
- Open an issue for discussion
- Comment on existing issues
- Reach out to maintainers

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Roguelike Chess! 🎉

