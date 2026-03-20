'use strict';

// ================================================================
// CONSTANTS
// ================================================================

const TYPE_NAMES   = ['Papel', 'Piedra', 'Tijera'];
const TYPE_EMOJIS  = ['📄', '🪨', '✂️'];

// Images for each card face (0=Paper, 1=Rock, 2=Scissors)
const FACE_IMGS = [
    'images/Paper.png',
    'images/ROCK.png',
    'images/Scissors.png'
];

// Card back image from HuntTheAce project
const BACK_IMG = 'images/card-back-Blue.png';

// WINS[playerType][enemyType] = true → player wins, false → player loses, null → draw
const WINS = [
//          Paper    Rock     Scissors
    [null,   true,   false],   // Player = Paper
    [false,  null,   true ],   // Player = Rock
    [true,   false,  null ],   // Player = Scissors
];

const INITIAL_HAND = 5;   // cards per side at start
const DEAL_STAGGER = 110; // ms between each card dealing

// ================================================================
// STATE
// ================================================================

let phase       = 'idle'; // idle | dealing | choosing | throwing | revealing | result
let playerHand  = [];     // [{type}]
let enemyHand   = [];     // [{type}]

// ================================================================
// DOM REFERENCES
// ================================================================

const $startScreen    = document.getElementById('start-screen');
const $gameArea       = document.getElementById('game-area');
const $startBtn       = document.getElementById('start-btn');
const $playerHandArea = document.getElementById('player-hand-area');
const $enemyHandArea  = document.getElementById('enemy-hand-area');
const $playerSlot     = document.getElementById('player-battle-slot');
const $enemySlot      = document.getElementById('enemy-battle-slot');
const $roundResult    = document.getElementById('round-result');
const $statusMsg      = document.getElementById('status-msg');
const $playerCount    = document.getElementById('player-count');
const $enemyCount     = document.getElementById('enemy-count');

// ================================================================
// BOOT
// ================================================================

$startBtn.addEventListener('click', () => {
    $startScreen.style.display = 'none';
    $gameArea.classList.remove('hidden');

    // Generate starting hands (always at least one Rock, Paper, Scissors)
    playerHand = dealHand(INITIAL_HAND);
    enemyHand  = dealHand(INITIAL_HAND);

    beginRound();
});

// ================================================================
// ROUND LIFECYCLE
// ================================================================

function beginRound() {
    phase = 'dealing';
    $roundResult.textContent = '';
    clearBattleSlots();
    updateCounters();
    setStatus('Repartiendo cartas…');

    renderHand($playerHandArea, playerHand, false);
    renderHand($enemyHandArea,  enemyHand,  true);

    const dealDone = Math.max(playerHand.length, enemyHand.length) * DEAL_STAGGER + 600;
    setTimeout(() => {
        phase = 'choosing';
        setStatus('Pasa el mouse sobre tus cartas para verlas · Haz clic para lanzar');
    }, dealDone);
}

// ================================================================
// HAND RENDERING
// ================================================================

function renderHand(area, hand, isEnemy) {
    area.innerHTML = '';

    hand.forEach((card, i) => {
        const el = buildCard(card.type, isEnemy);

        el.style.animationDelay = `${i * DEAL_STAGGER}ms`;
        el.classList.add(isEnemy ? 'deal-enemy' : 'deal-player');

        if (!isEnemy) {
            el.classList.add('peekable');
            el.addEventListener('click', () => onPlayerClick(i));
        }

        area.appendChild(el);
        card.el = el;
    });
}

function buildCard(type, isEnemy) {
    const card  = document.createElement('div');
    card.className = `card ${isEnemy ? 'enemy-card' : 'player-card'}`;

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    // Front face (RPS image)
    const front = document.createElement('div');
    front.className = 'card-front';
    front.innerHTML = `<img src="${FACE_IMGS[type]}" alt="${TYPE_NAMES[type]}" class="card-img">`;

    // Card back
    const back = document.createElement('div');
    back.className = 'card-back';
    back.innerHTML = `<img src="${BACK_IMG}" alt="back" class="card-img">`;

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    return card;
}

// ================================================================
// PLAYER CLICK → THROW SEQUENCE
// ================================================================

function onPlayerClick(index) {
    if (phase !== 'choosing') return;
    if (!playerHand[index]) return;

    phase = 'throwing';

    const pickedPlayer = playerHand[index];
    const enemyIdx     = Math.floor(Math.random() * enemyHand.length);
    const pickedEnemy  = enemyHand[enemyIdx];

    // Remove from logical hands
    playerHand.splice(index, 1);
    enemyHand.splice(enemyIdx, 1);

    // Disable all player card interactions
    $playerHandArea.querySelectorAll('.player-card').forEach(c => {
        c.classList.remove('peekable');
        c.style.pointerEvents = 'none';
    });

    setStatus('¡Cartas lanzadas! …');

    // Both cards fly toward the center at the same time
    throwCard(pickedPlayer.el, $playerSlot, false, () => {
        placeBattleCard($playerSlot, pickedPlayer.type, false);
    });

    throwCard(pickedEnemy.el, $enemySlot, true, () => {
        placeBattleCard($enemySlot, pickedEnemy.type, true);
    });

    // Reveal after both have landed
    setTimeout(() => {
        revealAndResolve(pickedPlayer.type, pickedEnemy.type);
    }, 900);
}

// ================================================================
// THROW (FLYING CARD) ANIMATION
// ================================================================

function throwCard(cardEl, targetSlot, isEnemy, onLand) {
    const from   = cardEl.getBoundingClientRect();
    const target = targetSlot.getBoundingClientRect();

    // Replace card with an empty slot placeholder in the hand
    const placeholder = document.createElement('div');
    placeholder.className = 'card-placeholder';
    cardEl.parentNode.replaceChild(placeholder, cardEl);

    // Flying proxy — shows only the card back during flight
    const fly = document.createElement('div');
    fly.className = 'flying-card';

    Object.assign(fly.style, {
        left:   from.left   + 'px',
        top:    from.top    + 'px',
        width:  from.width  + 'px',
        height: from.height + 'px',
    });

    const img = document.createElement('img');
    img.src = BACK_IMG;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:9px;display:block;';
    fly.appendChild(img);
    document.body.appendChild(fly);

    // One rAF warmup so the initial position is painted before we transition
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            Object.assign(fly.style, {
                left:      target.left   + 'px',
                top:       target.top    + 'px',
                width:     target.width  + 'px',
                height:    target.height + 'px',
                transform: `rotate(${isEnemy ? 12 : -12}deg) scale(1.08)`,
            });

            setTimeout(() => {
                fly.remove();
                onLand();
            }, 570); // matches CSS transition duration
        });
    });
}

// ================================================================
// PLACE FACE-DOWN CARD IN BATTLE SLOT
// ================================================================

function placeBattleCard(slot, type, isEnemy) {
    const card = buildCard(type, isEnemy);

    // Stretch to fill the slot
    Object.assign(card.style, {
        position:      'absolute',
        top:           '0',
        left:          '0',
        width:         '100%',
        height:        '100%',
        cursor:        'default',
        pointerEvents: 'none',
    });

    // Disable smooth transition so the card appears instantly face-down
    card.querySelector('.card-inner').style.transition = 'none';

    slot.appendChild(card);
}

// ================================================================
// REVEAL ANIMATION — BOOM!
// ================================================================

function revealAndResolve(playerType, enemyType) {
    setStatus('💥  ¡REVELANDO!  💥');

    const playerCard = $playerSlot.querySelector('.card');
    const enemyCard  = $enemySlot.querySelector('.card');

    // Player card flips first
    if (playerCard) {
        const inner = playerCard.querySelector('.card-inner');
        inner.style.transition = '';          // re-enable CSS transition
        inner.classList.add('revealing');
    }

    // Enemy card flips 200ms later for a dramatic stagger
    setTimeout(() => {
        if (enemyCard) {
            const inner = enemyCard.querySelector('.card-inner');
            inner.style.transition = '';
            inner.classList.add('revealing');
        }
    }, 220);

    // Resolve after both reveals complete
    setTimeout(() => {
        resolveRound(playerType, enemyType);
    }, 950);
}

// ================================================================
// ROUND RESOLUTION
// ================================================================

function resolveRound(playerType, enemyType) {
    phase = 'result';

    const pName = `${TYPE_EMOJIS[playerType]} ${TYPE_NAMES[playerType]}`;
    const eName = `${TYPE_EMOJIS[enemyType]} ${TYPE_NAMES[enemyType]}`;

    const playerCard = $playerSlot.querySelector('.card');
    const enemyCard  = $enemySlot.querySelector('.card');

    if (playerType === enemyType) {
        // ---- DRAW ----
        showResult(`🤝  EMPATE  —  ${pName} vs ${eName}`, '#ffffff');
        setStatus('¡Empate! Las cartas regresan a tu mano.');

        // Both get their card back
        playerHand.push({ type: playerType });
        enemyHand.push({ type: enemyType });

    } else if (WINS[playerType][enemyType]) {
        // ---- PLAYER WINS ----
        showResult(`🏆  ¡GANASTE!  —  ${pName}  derrota a  ${eName}`, '#00e676');
        setStatus('¡Ganaste ambas cartas! 🎉');

        if (playerCard) playerCard.classList.add('winner-glow');
        if (enemyCard)  enemyCard.classList.add('loser-glow');

        // Player collects both cards
        playerHand.push({ type: playerType });
        playerHand.push({ type: enemyType });

    } else {
        // ---- ENEMY WINS ----
        showResult(`💀  ¡PERDISTE!  —  ${eName}  derrota a  ${pName}`, '#ff1744');
        setStatus('El enemigo se llevó las cartas… 😤');

        if (enemyCard)  enemyCard.classList.add('winner-glow');
        if (playerCard) playerCard.classList.add('loser-glow');

        // Enemy collects both cards
        enemyHand.push({ type: playerType });
        enemyHand.push({ type: enemyType });
    }

    updateCounters();

    setTimeout(() => {
        if (playerHand.length === 0) {
            showGameOver(false);
        } else if (enemyHand.length === 0) {
            showGameOver(true);
        } else {
            beginRound();
        }
    }, 2600);
}

// ================================================================
// GAME OVER
// ================================================================

function showGameOver(playerWon) {
    // Clean up the game area
    $playerHandArea.innerHTML = '';
    $enemyHandArea.innerHTML  = '';
    clearBattleSlots();
    $roundResult.textContent = '';

    const overlay  = document.createElement('div');
    overlay.id = 'gameover-screen';

    const content  = document.createElement('div');
    content.className = 'gameover-content';

    const title    = playerWon ? '🏆  ¡VICTORIA! 🏆'     : '💀  ¡DERROTA!  💀';
    const titleClr = playerWon ? '#00e676'                : '#ff1744';
    const msg      = playerWon
        ? '¡Dejaste al enemigo sin cartas!'
        : '¡Te quedaste sin cartas!';

    content.innerHTML = `
        <h2 style="color:${titleClr}">${title}</h2>
        <p>${msg}</p>
        <button id="restart-btn">¡Jugar de nuevo!</button>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    document.getElementById('restart-btn').addEventListener('click', () => {
        overlay.remove();

        // Reset state
        playerHand = dealHand(INITIAL_HAND);
        enemyHand  = dealHand(INITIAL_HAND);

        beginRound();
    });
}

// ================================================================
// UTILITIES
// ================================================================

function rndCard() {
    return { type: Math.floor(Math.random() * 3) };
}

// Returns a hand of `size` cards guaranteed to have at least one
// of each type (Rock, Paper, Scissors). Remaining slots are random.
function dealHand(size) {
    const hand = [{ type: 0 }, { type: 1 }, { type: 2 }];
    for (let i = 3; i < size; i++) hand.push(rndCard());
    // Fisher-Yates shuffle
    for (let i = hand.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [hand[i], hand[j]] = [hand[j], hand[i]];
    }
    return hand;
}

function clearBattleSlots() {
    [$playerSlot, $enemySlot].forEach(slot => {
        // Keep the slot-label element
        const label = slot.querySelector('.slot-label');
        slot.innerHTML = '';
        if (label) slot.appendChild(label);
    });
}

function updateCounters() {
    $playerCount.textContent = playerHand.length;
    $enemyCount.textContent  = enemyHand.length;
}

function setStatus(msg) {
    $statusMsg.textContent = msg;
}

function showResult(text, color) {
    $roundResult.textContent = text;
    $roundResult.style.color  = color;
}
