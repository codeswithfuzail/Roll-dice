let WIN_SCORE = 100;
const winScoreInput = document.getElementById('winScoreInput');
const dicePatterns = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
};

let scores = [0, 0];
let currentScore = 0;
let activePlayer = 0;
let gameActive = true;

const totalEls = [document.getElementById('totalOne'), document.getElementById('totalTwo')];
const currentEls = [document.getElementById('currentOne'), document.getElementById('currentTwo')];
const currentBoxEls = [document.getElementById('currentBoxOne'), document.getElementById('currentBoxTwo')];
const panelEls = [document.getElementById('panelOne'), document.getElementById('panelTwo')];
const nameDisplayEls = [document.getElementById('nameOneDisplay'), document.getElementById('nameTwoDisplay')];
const nameInputEls = [document.getElementById('playerOneInput'), document.getElementById('playerTwoInput')];
const statusLine = document.getElementById('statusLine');
const diceEl = document.getElementById('dice');
const pips = diceEl.querySelectorAll('.pip');

function getName(idx) {
    const val = nameInputEls[idx].value.trim();
    return val !== '' ? val : (idx === 0 ? 'Player 1' : 'Player 2');
}

function refreshNames() {
    nameDisplayEls[0].textContent = getName(0);
    nameDisplayEls[1].textContent = getName(1);
}

function setDiceFace(num) {
    pips.forEach(p => p.classList.remove('active'));
    dicePatterns[num].forEach(i => pips[i].classList.add('active'));
}

function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
}

function shakeBox(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
}

function switchPlayer() {
    currentScore = 0;
    currentEls[activePlayer].textContent = 0;
    panelEls[activePlayer].classList.remove('active');
    activePlayer = activePlayer === 0 ? 1 : 0;
    panelEls[activePlayer].classList.add('active');
    statusLine.textContent = `${getName(activePlayer)}'s turn — roll the dice!`;
}

document.getElementById('rollBtn').addEventListener('click', () => {
    if (!gameActive) return;
    winScoreInput.disabled = true;

    diceEl.classList.remove('rolling');
    void diceEl.offsetWidth;
    diceEl.classList.add('rolling');

    const roll = Math.trunc(Math.random() * 6) + 1;
    setTimeout(() => setDiceFace(roll), 220);

    setTimeout(() => {
        if (roll === 1) {
            statusLine.textContent = `💥 ${getName(activePlayer)} rolled a 1! Turn lost.`;
            shakeBox(currentBoxEls[activePlayer]);
            switchPlayer();
        } else {
            currentScore += roll;
            currentEls[activePlayer].textContent = currentScore;
            bump(currentEls[activePlayer]);
            statusLine.textContent = `${getName(activePlayer)} rolled a ${roll}. Current: ${currentScore}`;
        }
    }, 260);
});

document.getElementById('holdBtn').addEventListener('click', () => {
    if (!gameActive) return;

    scores[activePlayer] += currentScore;
    totalEls[activePlayer].textContent = scores[activePlayer];
    bump(totalEls[activePlayer]);
    currentScore = 0;
    currentEls[activePlayer].textContent = 0;

    if (scores[activePlayer] >= WIN_SCORE) {
        gameActive = false;
        const winnerName = getName(activePlayer);
        const loserName = getName(activePlayer === 0 ? 1 : 0);
        panelEls[activePlayer].classList.add('winner');
        statusLine.textContent = `🎉 ${winnerName} wins with ${scores[activePlayer]} points!`;
        document.getElementById('gameCard').classList.add('win-glow');
        saveStats(winnerName, loserName);
        launchConfetti();
        setTimeout(() => showWinModal(winnerName), 200);
    } else {
        statusLine.textContent = `${getName(activePlayer)} holds at ${scores[activePlayer]}.`;
        switchPlayer();
    }
});

function launchConfetti() {
    const colors = ['#ff6b81', '#7c6bff', '#ffd93d', '#4ecdc4', '#ff9f43'];
    for (let i = 0; i < 90; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.backgroundColor = colors[Math.trunc(Math.random() * colors.length)];
        piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
        piece.style.animationDelay = (Math.random() * 0.4) + 's';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 4000);
    }
}

function showWinModal(winnerName) {
    document.getElementById('winnerText').textContent = `🎉 ${winnerName} Wins!`;
    document.getElementById('winModal').classList.add('open');
}

function resetGame() {
    const enteredScore = parseInt(winScoreInput.value, 10);
    WIN_SCORE = (!isNaN(enteredScore) && enteredScore > 0) ? enteredScore : 100;
    winScoreInput.value = WIN_SCORE;
    winScoreInput.disabled = false;

    scores = [0, 0];
    currentScore = 0;
    activePlayer = 0;
    gameActive = true;

    totalEls.forEach(el => el.textContent = 0);
    currentEls.forEach(el => el.textContent = 0);
    panelEls.forEach(p => { p.classList.remove('active', 'winner'); });
    panelEls[0].classList.add('active');
    document.getElementById('gameCard').classList.remove('win-glow');
    setDiceFace(1);
    refreshNames();
    statusLine.textContent = `Playing to ${WIN_SCORE}. ${getName(0)}'s turn — roll the dice!`;
}

document.getElementById('newGameBtn').addEventListener('click', resetGame);
document.getElementById('startGameBtn').addEventListener('click', resetGame);
document.getElementById('playAgainBtn').addEventListener('click', () => {
    document.getElementById('winModal').classList.remove('open');
    resetGame();
});

// ===== Leaderboard =====
function getStats() {
    return JSON.parse(localStorage.getItem('dice_stats') || '{}');
}

function saveStats(winner, loser) {
    const stats = getStats();
    if (!stats[winner]) stats[winner] = { wins: 0, losses: 0 };
    if (!stats[loser]) stats[loser] = { wins: 0, losses: 0 };
    stats[winner].wins++;
    stats[loser].losses++;
    localStorage.setItem('dice_stats', JSON.stringify(stats));
}

function deletePlayerStat(name) {
    const stats = getStats();
    delete stats[name];
    localStorage.setItem('dice_stats', JSON.stringify(stats));
    renderLeaderboard();
}

function renderLeaderboard() {
    const stats = getStats();
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';
    const players = Object.keys(stats);

    if (players.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No records yet</td></tr>`;
        return;
    }

    players.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
                <td><strong>${p}</strong></td>
                <td style="color:#4ade80;">${stats[p].wins}</td>
                <td style="color:#ef4444;">${stats[p].losses}</td>
                <td><button class="row-delete-btn" data-player="${p}">✕</button></td>
            `;
        tbody.appendChild(row);
    });

    tbody.querySelectorAll('.row-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deletePlayerStat(btn.getAttribute('data-player')));
    });
}

document.getElementById('openLeaderboardBtn').addEventListener('click', () => {
    renderLeaderboard();
    document.getElementById('leaderboardModal').classList.add('open');
});
document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
    document.getElementById('leaderboardModal').classList.remove('open');
});
document.getElementById('clearStatsBtn').addEventListener('click', () => {
    localStorage.removeItem('dice_stats');
    renderLeaderboard();
});

// init
setDiceFace(1);
refreshNames();