import { PONG_UI } from './elements.js';
import { shuffleArray } from "../utils/utils.js";
import { resetGameMenu } from './menu.js';
import { Match } from './Match.js';
export class Tournament {
    constructor(playersName, players) {
        this.paddleLoopRunning = false;
        this.starting = false; // true while countdown/start sequence is running
        this.players = []; //Should add a boolean to knwo if its ai or not
        this.matchPlayer = null;
        this.winner = null;
        this.playersName = playersName;
        this.players = players;
        //Setup name depending on username logged
        const currentUserRaw = localStorage.getItem("user");
        this.currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    }
    ///////////////////////////////////////////////////////////
    /////					SETUP						 /////
    //////////////////////////////////////////////////////////
    resetTournament() {
        // Clear players array
        this.players = [];
        this.playersName = [];
        this.winner = null;
        // Reset loop flags
        this.starting = false;
        this.paddleLoopRunning = false;
        resetGameMenu();
    }
    ///////////////////////////////////////////////////////////
    /////				TOURNAMENT						  /////
    //////////////////////////////////////////////////////////
    /**
     * Save a tournament match result to the backend
     * Posts match data including scores and winner
     */
    async startTournament() {
        console.log("startTournament started");
        let bracket = shuffleArray(this.players.slice());
        const BRACKETS_UI = {
            bracketDisplay: null,
            playersRow: null,
            semifinalsRow: null,
            champRow: null,
            finalDiv: null
        };
        this.initBracketsUI(BRACKETS_UI, bracket);
        PONG_UI.finalList.classList.remove("hidden");
        //TOURNAMENT LOGIC STARTS HERE
        let round = 1;
        // Allow aborting the whole tournament via back button at any time
        let tournamentAborted = false;
        let currentMatch = null;
        const tournamentBackHandler = () => {
            tournamentAborted = true;
            PONG_UI.backButton.removeEventListener("click", tournamentBackHandler);
            PONG_UI.backButton.classList.add("hidden");
            if (currentMatch) {
                currentMatch.isMatchOver = true; // Signal match to end
                currentMatch.quitMatch();
            }
            this.resetTournament();
        };
        PONG_UI.backButton.classList.remove("hidden");
        PONG_UI.backButton.addEventListener("click", tournamentBackHandler);
        while (bracket.length > 1 && !tournamentAborted) {
            console.log(`Round ${round} started with ${bracket.length} players`);
            const nextRound = [];
            for (let i = 0; i < bracket.length; i += 2) {
                if (tournamentAborted)
                    break;
                this.matchPlayer = [bracket[i], bracket[i + 1]];
                this.winner = null;
                //PONG_UI.playButton.classList.remove("hidden");
                const match = new Match(true, [this.matchPlayer[0], this.matchPlayer[1]]);
                currentMatch = match;
                this.winner = await match.playMatch();
                currentMatch = null;
                if (tournamentAborted)
                    break;
                if (!this.winner) {
                    // Clean up and exit
                    PONG_UI.backButton.removeEventListener("click", tournamentBackHandler);
                    PONG_UI.backButton.classList.add("hidden");
                    resetGameMenu();
                    console.error("ERROR: No winner determined for match!");
                    return;
                }
                nextRound.push(this.winner);
                this.updateBracketsUI(this.winner, round, i);
            }
            bracket = nextRound;
            if (tournamentAborted)
                break;
            round++;
            PONG_UI.playersList.innerHTML = "";
        }
        // Cleanup tournament-level back handler if still attached
        //PONG_UI.backButton.removeEventListener("click", tournamentBackHandler);
        //PONG_UI.backButton.classList.add("hidden");
        // Only show completion message if tournament wasn't aborted
        if (!tournamentAborted) {
            const champion = bracket[0];
            if (champion) {
                alert(`${champion.name} remporte le tournoi !`);
                resetGameMenu();
            }
        }
        if (PONG_UI.playersArea)
            PONG_UI.playersArea.classList.add("hidden");
        if (PONG_UI.scoreLeft)
            PONG_UI.scoreLeft.textContent = "0";
        if (PONG_UI.scoreRight)
            PONG_UI.scoreRight.textContent = "0";
    }
    createQuickMatch() {
        PONG_UI.playButton.classList.remove("hidden");
    }
    ///////////////////////////////////////////////////////////
    /////				BRACKETS UI						  /////
    //////////////////////////////////////////////////////////
    initBracketsUI(BRACKETS_UI, bracket) {
        PONG_UI.playersList.innerHTML = "";
        PONG_UI.finalList.innerHTML = "";
        PONG_UI.winnerName.innerHTML = "";
        // Create tournament bracket structure
        BRACKETS_UI.bracketDisplay = document.createElement("div");
        BRACKETS_UI.bracketDisplay.className = "flex flex-col gap-1 w-full h-full justify-center";
        // Initialize bracket with all players and placeholders
        BRACKETS_UI.playersRow = document.createElement("div");
        BRACKETS_UI.playersRow.className = "flex gap-2 justify-center";
        BRACKETS_UI.semifinalsRow = document.createElement("div");
        BRACKETS_UI.semifinalsRow.className = "flex gap-2 justify-center";
        BRACKETS_UI.champRow = document.createElement("div");
        BRACKETS_UI.champRow.className = "flex gap-1 justify-center";
        // Add final placeholder (Champion at top)
        BRACKETS_UI.finalDiv = document.createElement("div");
        BRACKETS_UI.finalDiv.id = "final-winner";
        BRACKETS_UI.finalDiv.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
        BRACKETS_UI.finalDiv.innerHTML = `<span class="text-sm text-gray-400">Champion</span><br>?`;
        BRACKETS_UI.champRow.appendChild(BRACKETS_UI.finalDiv);
        // Add semifinals placeholders
        for (let i = 0; i < 2; i++) {
            const playerDiv = document.createElement("div");
            playerDiv.id = `semi-${i}`;
            playerDiv.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
            playerDiv.innerHTML = `<span class="text-sm text-gray-400">Semifinal ${i + 1}</span><br>?`;
            BRACKETS_UI.semifinalsRow.appendChild(playerDiv);
        }
        // Add initial 4 players at bottom
        for (let i = 0; i < 4; i++) {
            const playerDiv = document.createElement("div");
            playerDiv.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
            playerDiv.innerHTML = `<span class="text-sm text-gray-400">Player ${bracket[i].playerNbr + 1}</span><br>${bracket[i].name}`;
            BRACKETS_UI.playersRow.appendChild(playerDiv);
        }
        BRACKETS_UI.bracketDisplay.appendChild(BRACKETS_UI.champRow);
        BRACKETS_UI.bracketDisplay.appendChild(BRACKETS_UI.semifinalsRow);
        BRACKETS_UI.bracketDisplay.appendChild(BRACKETS_UI.playersRow);
        PONG_UI.finalList.appendChild(BRACKETS_UI.bracketDisplay);
    }
    updateBracketsUI(winner, round, i) {
        // Update the bracket display with the winner
        if (round === 1) {
            const semiDiv = document.getElementById(`semi-${i / 2}`);
            if (semiDiv) {
                const colorClass = PONG_UI.playerColors[winner.playerNbr];
                semiDiv.innerHTML = `<span class="text-sm text-gray-400">Semifinal ${i / 2 + 1}</span><br><span class="${colorClass}">${winner.name}</span>`;
            }
        }
        else if (round === 2) {
            const finalDiv = document.getElementById("final-winner");
            if (finalDiv) {
                const colorClass = PONG_UI.playerColors[winner.playerNbr];
                finalDiv.innerHTML = `<span class="text-sm text-gray-400">Champion</span><br><span class="${colorClass}">${winner.name}</span>`;
            }
        }
    }
}
;
export async function saveTournamentMatch(player1, player2, score1, score2, winner) {
    const token = localStorage.getItem("accessToken");
    if (!token)
        return;
    const payload = {
        player1Id: player1.userId,
        player2Id: player2.userId,
        score1,
        score2,
        winnerId: winner.userId,
        player1Name: player1.userId >= 100 ? player1.name : undefined,
        player2Name: player2.userId >= 100 ? player2.name : undefined,
    };
    try {
        const res = await fetch("/match", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok)
            console.error("Tournament match save failed:", await res.text());
    }
    catch (err) {
        console.error("Error saving tournament match:", err);
    }
}
