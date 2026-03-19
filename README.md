# Piedra · Papel · Tijera — Card Battle

A card battle game that combines classic Rock Paper Scissors logic with animated playing card mechanics. Cards deal onto the table, flip in 3D on hover, and are thrown face-down to the center before being dramatically revealed.

---

## How to Play

1. **Peek at your hand** — hover over any of your cards to flip it in 3D and see whether it's Rock, Paper, or Scissors.
2. **Throw your card** — click a card to launch it face-down toward the center of the table.
3. **The enemy responds** — the enemy simultaneously throws a random card of their own, also face-down.
4. **BOOM — Reveal!** — both cards flip open at the center with a spring animation exposing what each player played.
5. **Winner takes all** — the winner collects both cards into their hand. The loser loses their played card.
6. **Keep going** — play continues round by round. The game ends when one side runs out of cards.

---

## Win Conditions

| Your card | Enemy card | Result |
|-----------|------------|--------|
| ✂️ Scissors | 📄 Paper   | ✅ You win  |
| 📄 Paper   | 🪨 Rock    | ✅ You win  |
| 🪨 Rock    | ✂️ Scissors | ✅ You win  |
| Same card  | Same card  | 🤝 Draw — both cards returned |
| Any other combination | — | ❌ You lose |

---

## Card Economy

- Both players **start with 5 cards**.
- **Win a round** → you gain 2 cards (yours + the enemy's).
- **Lose a round** → you lose 1 card (the enemy gains both).
- **Draw** → no cards change hands.
- **Game over** when either player reaches **0 cards**.

---

## Animations

| Animation | Trigger |
|-----------|---------|
| **Deal** | Cards fly onto the table from off-screen at the start of each round |
| **3D Hover Flip** | Mouse over your cards to peek at the face |
| **Card Throw** | Clicking a card sends it flying face-down to the center |
| **BOOM Reveal** | Both battle cards spring-flip open simultaneously |
| **Win / Lose Glow** | Green or red glow pulses on the winning / losing card |

---

## Project Structure

```
piedraPapelTijera/
├── index.html       — Game layout and structure
├── style.css        — All styles, card 3D transforms, and animations
├── game.js          — Game logic, state management, and animation control
└── images/
    ├── ROCK.png
    ├── Paper.png
    ├── Scissors.png
    ├── ROCK-Hover.png
    ├── Paper-Hover.png
    ├── Scissors-Hover.png
    └── card-back-Blue.png
```

---

## Built With

- Vanilla HTML / CSS / JavaScript — no frameworks or libraries
- CSS `transform-style: preserve-3d` + `backface-visibility` for the 3D card flips
- CSS `@keyframes` for deal and reveal animations
- JavaScript `getBoundingClientRect()` for the flying card throw effect

---

*Inspired by [The Odin Project](https://www.theodinproject.com/) — Rock Paper Scissors assignment.*
