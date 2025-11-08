import { shuffleArray } from "./pong_utils.js";
const paddle_left = document.getElementById("left-paddle");
const paddle_right = document.getElementById("right-paddle");
const ball = document.getElementById("ball");
const PONG_WIDTH = 600;
const PONG_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const pong_button = document.getElementById("pong-button");
const qmatch_button = document.getElementById("quick-match-button");
const tournament_button = document.getElementById("tournament-button");
const enterPlayerNbr_text = document.getElementById("enterPlayerNbr-text");
const playerNbr_text = document.getElementById("playerNbr-text");
const playerIncr_button = document.getElementById("increasePlayer-button");
const playerDecr_button = document.getElementById("decreasePlayer-button");
const aiCounter = document.getElementById("ai-counter");
const aiNbr_text = document.getElementById("aiNbr-text");
const OK_button = document.getElementById("OK-button");
const play_button = document.getElementById("play-button");
const playerName_container = document.getElementById("playerName-container");
const playerName_input = document.getElementById("playerName-input");
const playerColors = ["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400"];
const playersList = document.getElementById("players-list");
const finalList = document.getElementById("final-list");
const winnerName = document.getElementById("winner-name");
const crownImage = document.getElementById("crown-image");
class Player {
    constructor(name, isAi, playerNbr) {
        this.name = "";
        this.playerNbr = 0;
        this.paddle = null;
        this.point = 0;
        this.gameWon = 0;
        this.isAi = false;
        this.name = name;
        this.isAi = isAi;
        this.playerNbr = playerNbr;
    }
}
class Game {
    constructor(playersName) {
        this.players = [];
        this.winner = null;
        this.players = playersName.map(([playerName, isAi], playerNbr) => new Player(playerName, isAi, playerNbr));
        if (playersName.length > 2)
            this.createTournament();
        /* else play a normal game */
    }
    createTournament() {
        const shuffled = shuffleArray(this.players);
        playersList.innerHTML = "";
        shuffled.forEach(({ name, playerNbr, isAi }) => {
            addPlayerNameLabel(name, playerNbr, isAi);
        });
        showTournamentMatch();
    }
}
pong_button.addEventListener("click", () => {
    pong_button.classList.add("hidden");
    qmatch_button.classList.remove("hidden");
    tournament_button.classList.remove("hidden");
});
let isTournament = false;
let playerNbr = 2;
let maxPlayer = 2;
let aiNbr = 0;
qmatch_button.addEventListener("click", () => {
    qmatch_button.classList.add("hidden");
    tournament_button.classList.add("hidden");
    enterPlayerNbr();
});
tournament_button.addEventListener("click", () => {
    qmatch_button.classList.add("hidden");
    tournament_button.classList.add("hidden");
    isTournament = true;
    playerNbr = 4;
    maxPlayer = 4;
    playerNbr_text.textContent = playerNbr.toString();
    enterPlayerNbr();
});
function enterPlayerNbr() {
    enterPlayerNbr_text.classList.remove("hidden");
    playerNbr_text.classList.remove("hidden");
    playerIncr_button.classList.remove("hidden");
    playerDecr_button.classList.remove("hidden");
    aiCounter.classList.remove("hidden");
    OK_button.classList.remove("hidden");
}
playerIncr_button.addEventListener("click", () => {
    if (playerNbr < maxPlayer) {
        playerNbr++;
        playerNbr_text.textContent = playerNbr.toString();
        aiNbr--;
        aiNbr_text.textContent = aiNbr.toString();
    }
});
playerDecr_button.addEventListener("click", () => {
    if (playerNbr > 0) {
        playerNbr--;
        playerNbr_text.textContent = playerNbr.toString();
        aiNbr++;
        aiNbr_text.textContent = aiNbr.toString();
    }
});
OK_button.addEventListener("click", () => {
    hidePlayerNbrMenu();
    playersList.classList.remove("hidden");
    if (playerNbr > 0)
        enterPlayerName();
    else {
        addAiNameLabel();
        const game = new Game(playerNames);
    }
});
function hidePlayerNbrMenu() {
    enterPlayerNbr_text.classList.add("hidden");
    playerNbr_text.classList.add("hidden");
    aiCounter.classList.add("hidden");
    playerIncr_button.classList.add("hidden");
    playerDecr_button.classList.add("hidden");
    OK_button.classList.add("hidden");
}
let playerNames = [];
const aiNames = ["Nietzche", "Aurele", "Sun Tzu", "Socrate"];
let nameEntered = 0;
function enterPlayerName() {
    playerName_container.classList.remove("hidden");
}
playerName_input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const playerName = playerName_input.value.trim();
        const nameAlreadyUsed = playerNames.some(([name, _isAI]) => name === playerName);
        if (playerName !== "" && !nameAlreadyUsed) {
            playerName_input.value = "";
            playerNames.push([playerName, false]);
            addPlayerNameLabel(playerName, nameEntered, false);
            nameEntered++;
        }
        if (nameEntered === playerNbr) {
            playerName_container.classList.add("hidden");
            addAiNameLabel();
            const game = new Game(playerNames);
        }
    }
});
function addPlayerNameLabel(name, index, isAi) {
    const label = document.createElement("div");
    const colorClass = playerColors[index];
    label.className = `player-name-item text-center font-bold ${colorClass} min-w-[120px]`;
    if (!isAi)
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;
    else
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;
    playersList.appendChild(label);
}
function addAiNameLabel() {
    for (let y = 0; y < aiNbr; y++) {
        const aiName = aiNames[y];
        addPlayerNameLabel(aiName, nameEntered + y, true);
        playerNames.push([aiName, true]);
    }
}
function showTournamentMatch() {
    //Create/show Final Boxex (holder of the results of the first match)
    for (let i = 0; i < 2; i++) {
        const label = document.createElement("div");
        label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player x</span><br>?`;
        finalList.appendChild(label);
    }
    finalList.classList.remove("hidden");
    //Create/show Winner Box (holder of the results of the second match)
    const label = document.createElement("div");
    label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
    label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player x</span><br>?`;
    winnerName.appendChild(label);
    winnerName.classList.remove("hidden");
    crownImage.classList.remove("hidden");
}
function addFinalNameLabel(name, index, isAi) {
    const label = document.createElement("div");
    const colorClass = playerColors[index];
    label.className = `player-name-item text-center font-bold ${colorClass} min-w-[120px]`;
    if (!isAi)
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;
    else
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;
    playersList.appendChild(label);
}
