export const PONG_UI = {
    //Menu Element
    pongMenu: document.getElementById("pong-menu"),
    pongButton: document.getElementById("pong-button"),
    qmatchButton: document.getElementById("quick-match-button"),
    tournamentButton: document.getElementById("tournament-button"),
    // Text & Counters
    enterPlayerNbrText: document.getElementById("enterPlayerNbr-text"),
    playerNbrText: document.getElementById("playerNbr-text"),
    playerIncrButton: document.getElementById("increasePlayer-button"),
    playerDecrButton: document.getElementById("decreasePlayer-button"),
    aiCounter: document.getElementById("ai-counter"),
    aiNbrText: document.getElementById("aiNbr-text"),
    // Game Setup
    okButton: document.getElementById("OK-button"),
    playButton: document.getElementById("play-button"),
    readyText: document.getElementById("ready-text"),
    goText: document.getElementById("go-text"),
    backButton: document.getElementById("back-button"),
    //Paddle & Ball
    leftPaddle: document.getElementById("left-paddle"),
    rightPaddle: document.getElementById("right-paddle"),
    ball: document.getElementById("ball"),
    // Game Area
    playersArea: document.getElementById("players-area"),
    aiView: document.getElementById("AIview"),
    aiViewsCanvas: document.getElementById('canvas-AI-views'),
    aiViewCheckBox: document.getElementById("ai-view-label"),
    aiViewCheckboxInput: document.getElementById("ai-view-checkbox"),
    decreasePlayerButton: document.getElementById("decreasePlayer-button"),
    increasePlayerButton: document.getElementById("increasePlayer-button"),
    scoreLeft: document.getElementById("score-left"),
    scoreRight: document.getElementById("score-right"),
    // Player Setup
    playerNameContainer: document.getElementById("playerName-container"),
    playerNameInput: document.getElementById("playerName-input"),
    playersList: document.getElementById("players-list"),
    // Winner & End Game
    finalList: document.getElementById("final-list"),
    winnerName: document.getElementById("winner-name"),
    crownImage: document.getElementById("crown-image"),
    // Constants
    playerColors: ["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400"]
};
