/**
 * Storage Manager for Bingo Master
 * Exclusively uses Browser Storage (localStorage) as requested by specification.
 */
class BingoStorage {
    constructor() {
        this.KEYS = {
            CURRENT_ROUND: 'bingo_current_round',
            PARTICIPANTS: 'bingo_participants',
            HISTORY: 'bingo_rounds_history',
            CONFIG: 'bingo_config'
        };
    }

    /* =========================================================================
       Current Game & Round
       ========================================================================= */
    getCurrentRound() {
        try {
            const data = localStorage.getItem(this.KEYS.CURRENT_ROUND);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.error('Erro ao ler rodada atual do storage:', e);
        }
        return {
            roundNumber: 1,
            drawnBalls: [], // Array de números em ordem de sorteio
            isFinished: false,
            winner: null,
            startedAt: new Date().toISOString()
        };
    }

    saveCurrentRound(roundData) {
        try {
            localStorage.setItem(this.KEYS.CURRENT_ROUND, JSON.stringify(roundData));
        } catch (e) {
            console.error('Erro ao salvar rodada atual no storage:', e);
        }
    }

    resetCurrentRound(roundNumber = 1) {
        const freshRound = {
            roundNumber: roundNumber,
            drawnBalls: [],
            isFinished: false,
            winner: null,
            startedAt: new Date().toISOString()
        };
        this.saveCurrentRound(freshRound);
        return freshRound;
    }

    /* =========================================================================
       Participants & Cards
       ========================================================================= */
    getParticipants() {
        try {
            const data = localStorage.getItem(this.KEYS.PARTICIPANTS);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.error('Erro ao ler participantes do storage:', e);
        }
        return [];
    }

    saveParticipants(participants) {
        try {
            localStorage.setItem(this.KEYS.PARTICIPANTS, JSON.stringify(participants));
        } catch (e) {
            console.error('Erro ao salvar participantes no storage:', e);
        }
    }

    addParticipant(participant) {
        const participants = this.getParticipants();
        participants.push(participant);
        this.saveParticipants(participants);
        return participants;
    }

    removeParticipant(participantId) {
        let participants = this.getParticipants();
        participants = participants.filter(p => p.id !== participantId);
        this.saveParticipants(participants);
        return participants;
    }

    /* =========================================================================
       History of Previous Rounds
       ========================================================================= */
    getHistory() {
        try {
            const data = localStorage.getItem(this.KEYS.HISTORY);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.error('Erro ao ler histórico de rodadas do storage:', e);
        }
        return [];
    }

    saveRoundToHistory(roundRecord) {
        try {
            const history = this.getHistory();
            // Inserir no topo (mais recente primeiro)
            history.unshift(roundRecord);
            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
            return history;
        } catch (e) {
            console.error('Erro ao salvar registro no histórico:', e);
            return [];
        }
    }

    clearHistory() {
        try {
            localStorage.removeItem(this.KEYS.HISTORY);
            return true;
        } catch (e) {
            console.error('Erro ao limpar histórico:', e);
            return false;
        }
    }

    exportHistoryJSON() {
        const history = this.getHistory();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `bingo_historico_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    /* =========================================================================
       Global Reset
       ========================================================================= */
    resetAll() {
        localStorage.removeItem(this.KEYS.CURRENT_ROUND);
        localStorage.removeItem(this.KEYS.PARTICIPANTS);
        // Não apagamos o histórico na redefinição simples, a menos que solicitado
    }
}

window.BingoStorage = new BingoStorage();
