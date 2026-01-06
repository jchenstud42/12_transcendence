export const UI = {
    //Menu Element
    get pongMenu() { return document.getElementById("pong-menu"); },
    get pongButton() { return document.getElementById("pong-button"); },
    get qmatchButton() { return document.getElementById("quick-match-button"); },
    get tournamentButton() { return document.getElementById("tournament-button"); },
    // Text & Counters
    get enterPlayerNbrText() { return document.getElementById("enterPlayerNbr-text"); },
    get playerNbrText() { return document.getElementById("playerNbr-text"); },
    get playerIncrButton() { return document.getElementById("increasePlayer-button"); },
    get playerDecrButton() { return document.getElementById("decreasePlayer-button"); },
    get aiCounter() { return document.getElementById("ai-counter"); },
    get aiNbrText() { return document.getElementById("aiNbr-text"); },
    // Game Controls
    get okButton() { return document.getElementById("OK-button"); },
    get playButton() { return document.getElementById("play-button"); },
    get readyText() { return document.getElementById("ready-text"); },
    get goText() { return document.getElementById("go-text"); },
    get leftPaddle() { return document.getElementById("left-paddle"); },
    get rightPaddle() { return document.getElementById("right-paddle"); },
    get ball() { return document.getElementById("ball"); },
    // Game Area
    get playersArea() { return document.getElementById("players-area"); },
    get aiViewCheckBox() { return document.getElementById("ai-view-label"); },
    get aiViewCheckboxInput() { return document.getElementById("ai-view-checkbox"); },
    get scoreLeft() { return document.getElementById("score-left"); },
    get scoreRight() { return document.getElementById("score-right"); },
    // Player Setup
    get playerNameContainer() { return document.getElementById("playerName-container"); },
    get playerNameInput() { return document.getElementById("playerName-input"); },
    get playersList() { return document.getElementById("players-list"); },
    // Winner & End Game
    get finalList() { return document.getElementById("final-list"); },
    get winnerName() { return document.getElementById("winner-name"); },
    get crownImage() { return document.getElementById("crown-image"); },
    // Constants (Keep these as standard properties since they aren't DOM elements)
    playerColors: ["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400"]
};
