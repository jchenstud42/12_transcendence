"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pong_utils_1 = require("./pong_utils");
var paddle_left = document.getElementById("left-paddle");
var paddle_right = document.getElementById("right-paddle");
var ball = document.getElementById("ball");
var PONG_WIDTH = 600;
var PONG_HEIGHT = 400;
var PADDLE_WIDTH = 10;
var PADDLE_HEIGHT = 80;
var BALL_SIZE = 10;
var pong_button = document.getElementById("pong-button");
/* const qmatch_button 	= 	document.getElementById("quick-match-button")!;
const tournament_button = 	document.getElementById("tournament-button")!; */
var enterPlayerNbr_text = document.getElementById("enterPlayerNbr-text");
var playerNbr_text = document.getElementById("playerNbr-text");
var playerIncr_button = document.getElementById("increasePlayer-button");
var playerDecr_button = document.getElementById("decreasePlayer-button");
var OK_button = document.getElementById("OK-button");
var play_button = document.getElementById("play-button");
var playerName_container = document.getElementById("playerName-container");
var playerName_input = document.getElementById("playerName-input");
var playerColors = ["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400"];
var playersList = document.getElementById("players-list");
var Player = /** @class */ (function () {
    function Player(name, isAi) {
        this.name = "";
        this.paddle = null;
        this.point = 0;
        this.gameWon = 0;
        this.isAi = false;
        this.name = name;
        this.isAi = isAi;
    }
    return Player;
}());
var Game = /** @class */ (function () {
    function Game(playersName) {
        this.players = [];
        this.winner = null;
        this.players = playersName.map(function (name) { return new Player(name[0], name[1]); });
        if (playersName.length > 2)
            this.createTournament();
        /* else play a normal game */
    }
    Game.prototype.createTournament = function () {
        var shuffled = (0, pong_utils_1.shuffleArray)(this.players);
        playersList.innerHTML = "";
        shuffled.forEach(function (_a, i) {
            var name = _a.name;
            addPlayerNameLabel(name, i);
        });
    };
    return Game;
}());
//////////////////////////////////////////////////
//				EVENT / LISTENER				//
/////////////////////////////////////////////////
pong_button.addEventListener("click", function () {
    pong_button.classList.add("hidden");
    enterPlayerNbr();
});
//////////////////////////////////////////////////
//				CHANGE DISPLAY					//
/////////////////////////////////////////////////
var playerNbr = 1;
var aiNbr = 0;
var maxPlayer = 4;
var mode = "players";
function enterPlayerNbr() {
    enterPlayerNbr_text.classList.remove("hidden");
    playerNbr_text.classList.remove("hidden");
    playerIncr_button.classList.remove("hidden");
    playerDecr_button.classList.remove("hidden");
    OK_button.classList.remove("hidden");
}
playerIncr_button.addEventListener("click", function () {
    if (mode === "players") {
        if (playerNbr < maxPlayer) {
            playerNbr++;
            playerNbr_text.textContent = playerNbr.toString();
        }
    }
    else {
        if (aiNbr + playerNbr < maxPlayer) {
            aiNbr++;
            playerNbr_text.textContent = aiNbr.toString();
        }
    }
});
playerDecr_button.addEventListener("click", function () {
    if (mode === "players") {
        if (playerNbr > 1) {
            playerNbr--;
            playerNbr_text.textContent = playerNbr.toString();
        }
    }
    else {
        var minAi = 0;
        if (playerNbr === 1)
            minAi = 1;
        if (aiNbr > minAi) {
            aiNbr--;
            playerNbr_text.textContent = aiNbr.toString();
        }
    }
});
OK_button.addEventListener("click", function () {
    if (mode == "players") {
        mode = "ai";
        enterAiNbr();
    }
    else
        enterPlayerName();
});
var playerNames = [];
var aiNames = ["AI-Nietzche", "AI-Aurele", "AI-Sun Tzu"];
var nameEntered = 0;
playerName_input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        var playerName_1 = playerName_input.value.trim();
        var nameAlreadyUsed = playerNames.some(function (_a) {
            var name = _a[0], _isAI = _a[1];
            return name === playerName_1;
        });
        if (playerName_1 !== "" && !nameAlreadyUsed) {
            playerName_input.value = "";
            playerNames.push([playerName_1, false]);
            addPlayerNameLabel(playerName_1, nameEntered);
            nameEntered++;
        }
        if (nameEntered === playerNbr) {
            playerName_container.classList.add("hidden");
            for (var y = 0; y < aiNbr; y++) {
                var aiName = aiNames[y];
                addPlayerNameLabel(aiName, nameEntered + y);
                playerNames.push([aiName, true]);
            }
            //const game = new Game(players);
        }
    }
});
function enterAiNbr() {
    enterPlayerNbr_text.textContent = "How Many Player (AI):";
    if (playerNbr === 1) {
        aiNbr = 1;
        playerNbr_text.textContent = playerNbr.toString();
    }
    else
        playerNbr_text.textContent = "0";
}
function enterPlayerName() {
    enterPlayerNbr_text.classList.add("hidden");
    playerNbr_text.classList.add("hidden");
    playerIncr_button.classList.add("hidden");
    playerDecr_button.classList.add("hidden");
    OK_button.classList.add("hidden");
    playerName_container.classList.remove("hidden");
    playersList.classList.remove("hidden");
}
function addPlayerNameLabel(name, index) {
    var label = document.createElement("div");
    var colorClass = playerColors[index];
    label.className = "player-name-item text-center font-bold ".concat(colorClass, " text-2xl min-w-[120px]");
    label.innerHTML = "<span class=\"text-sm text-gray-400 whitespace-nowarp\">Player ".concat(index + 1, "</span><br>").concat(name);
    playersList.appendChild(label);
}
