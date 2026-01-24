import { PONG_UI } from './elements.js';
import { Tournament } from './Tournament.js';
import { GameInfo } from './GameInfo.js';
import { Match } from './Match.js';
import { t } from '../traduction/i18n.js';
const PONG_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
let game;
///////////////////////////////////////////////////////////
/////				HELPER FUNCTION					 /////
//////////////////////////////////////////////////////////
/**
      1 - Initialize or get the game instance
      2 - Ensures game is always available
*/
function getGameInfo() {
    if (!game)
        game = new GameInfo();
    return game;
}
///////////////////////////////////////////////////////////
/////				EVENTS LISTENER					 /////
//////////////////////////////////////////////////////////
export function initMenuEvents() {
    PONG_UI.pongButton.addEventListener("click", () => {
        getGameInfo();
        showMatchSelectionMenu();
    });
    PONG_UI.qmatchButton.addEventListener("click", () => {
        hideMatchSelectionMenu();
        showPlayerNbrMenu();
    });
    PONG_UI.tournamentButton.addEventListener("click", () => {
        hideMatchSelectionMenu();
        game.isTournament = true;
        game.playerNbr = 4;
        game.maxPlayer = 4;
        PONG_UI.playerNbrText.textContent = game.playerNbr.toString();
        showPlayerNbrMenu();
    });
    PONG_UI.playerIncrButton.addEventListener("click", () => {
        if (game.playerNbr < game.maxPlayer) {
            game.playerNbr++;
            PONG_UI.playerNbrText.textContent = game.playerNbr.toString();
            game.aiNbr--;
            PONG_UI.aiNbrText.textContent = game.aiNbr.toString();
        }
    });
    PONG_UI.playerDecrButton.addEventListener("click", () => {
        if (game.playerNbr > 0) {
            game.playerNbr--;
            PONG_UI.playerNbrText.textContent = game.playerNbr.toString();
            game.aiNbr++;
            PONG_UI.aiNbrText.textContent = game.aiNbr.toString();
        }
    });
    PONG_UI.okButton.addEventListener("click", () => {
        hidePlayerNbrMenu();
        if (PONG_UI.playersArea)
            PONG_UI.playersArea.classList.remove("hidden");
        const loggedUsername = getLoggedUsername();
        PONG_UI.playersList.classList.remove("hidden");
        if (loggedUsername && game.maxPlayer > game.aiNbr) {
            game.playersName.push([loggedUsername, false]);
            showPlayerName(loggedUsername, 0, false);
            game.nameEntered = 1;
        }
        if (game.nameEntered < game.playerNbr) {
            console.log("1 - Show player name menu");
            showPlayerNameMenu();
        }
        else {
            //Start match or tournament directly (no need to enter player names)
            console.log("2 - Start match directly");
            game.createAiName();
            game.setCurrentUser(getLoggedUser());
            game.createPlayers();
            if (game.maxPlayer > 2) {
                game.isTournament = true;
                const tournament = new Tournament(game.playersName, game.players);
                tournament.startTournament();
            }
            else {
                const match = new Match(game.isTournament, [game.players[0], game.players[1]]);
                match.playMatch();
            }
            game.resetGameInfo();
        }
    });
    PONG_UI.playerNameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const playerName = PONG_UI.playerNameInput.value.trim();
            const nameAlreadyUsed = game.playersName.some(([name, _isAI]) => name === playerName);
            if (playerName !== "" && !nameAlreadyUsed) {
                PONG_UI.playerNameInput.value = "";
                game.playersName.push([playerName, false]);
                showPlayerName(playerName, game.nameEntered, false);
                game.nameEntered++;
            }
            if (game.nameEntered === game.playerNbr) {
                PONG_UI.playerNameContainer.classList.add("hidden");
                // Reset scores display
                if (PONG_UI.scoreLeft)
                    PONG_UI.scoreLeft.textContent = "0";
                if (PONG_UI.scoreRight)
                    PONG_UI.scoreRight.textContent = "0";
                //Fill the rest of the players with AI names
                game.createAiName();
                game.setCurrentUser(getLoggedUser());
                game.createPlayers();
                if (game.maxPlayer > 2) {
                    game.isTournament = true;
                    const tournament = new Tournament(game.playersName, game.players);
                    tournament.startTournament();
                }
                else {
                    game.isTournament = false;
                    const match = new Match(game.isTournament, [game.players[0], game.players[1]]);
                    match.playMatch();
                }
                game.resetGameInfo();
            }
        }
    });
    //Start the next match after a point
    /* 	PONG_UI.playButton.addEventListener("click", () => {
            .playPoint();
        }); */
}
///////////////////////////////////////////////////////////
/////				SHOW/HIDE MENU					  /////
//////////////////////////////////////////////////////////
export function showPongMenu() {
    showMenu(PONG_UI.pongButton);
    hideMenu(PONG_UI.qmatchButton, PONG_UI.tournamentButton, PONG_UI.playButton);
}
function showMatchSelectionMenu() {
    hideMenu(PONG_UI.pongButton);
    showMenu(PONG_UI.qmatchButton, PONG_UI.tournamentButton);
}
function hideMatchSelectionMenu() {
    hideMenu(PONG_UI.qmatchButton, PONG_UI.tournamentButton);
}
function showPlayerNbrMenu() {
    showMenu(PONG_UI.enterPlayerNbrText, PONG_UI.playerNbrText, PONG_UI.playerIncrButton, PONG_UI.playerDecrButton, PONG_UI.aiCounter, PONG_UI.okButton);
}
function hidePlayerNbrMenu() {
    hideMenu(PONG_UI.enterPlayerNbrText, PONG_UI.playerNbrText, PONG_UI.aiCounter, PONG_UI.playerIncrButton, PONG_UI.playerDecrButton, PONG_UI.okButton);
}
function showPlayerNameMenu() {
    showMenu(PONG_UI.playerNameContainer);
}
export function showPlayerName(name, index, isAi) {
    const label = document.createElement("div");
    const colorClass = PONG_UI.playerColors[index];
    label.className = `player-name-item text-center font-bold ${colorClass}/90 min-w-[120px]`;
    if (!isAi)
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowrap">${t("player")} ${index + 1}</span><br>${name}`;
    else
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;
    PONG_UI.playersList.appendChild(label);
}
export function showMenu(...toHide) {
    toHide.forEach(menu => menu === null || menu === void 0 ? void 0 : menu.classList.remove("hidden"));
}
export function hideMenu(...toHide) {
    toHide.forEach(menu => menu === null || menu === void 0 ? void 0 : menu.classList.add("hidden"));
}
export function resetGameMenu() {
    Match.pendingTimeouts.forEach(id => clearTimeout(id));
    Match.pendingTimeouts = [];
    if (PONG_UI.scoreLeft)
        PONG_UI.scoreLeft.textContent = "0";
    if (PONG_UI.scoreRight)
        PONG_UI.scoreRight.textContent = "0";
    PONG_UI.playersList.innerHTML = "";
    PONG_UI.finalList.innerHTML = "";
    PONG_UI.winnerName.innerHTML = "";
    PONG_UI.leftPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
    PONG_UI.rightPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
    PONG_UI.playerNbrText.textContent = "2";
    PONG_UI.aiNbrText.textContent = "0";
    hideMenu(PONG_UI.okButton, PONG_UI.leftPaddle, PONG_UI.rightPaddle, PONG_UI.readyText, PONG_UI.goText, PONG_UI.playerNameContainer, PONG_UI.increasePlayerButton, PONG_UI.decreasePlayerButton, PONG_UI.ball, PONG_UI.aiCounter, PONG_UI.playersArea, PONG_UI.enterPlayerNbrText, PONG_UI.playerNbrText, PONG_UI.finalList);
    //Go back to the first Pong button
    showPongMenu();
}
///////////////////////////////////////////////////////////
/////			FETCH BACKEND DATA				 	 /////
//////////////////////////////////////////////////////////
function getLoggedUsername() {
    var _a;
    const userRaw = localStorage.getItem("user");
    if (!userRaw)
        return (null);
    try {
        const user = JSON.parse(userRaw);
        return ((_a = user === null || user === void 0 ? void 0 : user.username) !== null && _a !== void 0 ? _a : null);
    }
    catch (_b) {
        return (null);
    }
}
function getLoggedUser() {
    const userRaw = localStorage.getItem("user");
    if (!userRaw)
        return (null);
    try {
        return JSON.parse(userRaw);
    }
    catch (_a) {
        return (null);
    }
}
