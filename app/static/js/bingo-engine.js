/**
 * Core Game Engine for Bingo Master (75-ball specification)
 * Pure, reusable and decoupled logic.
 */
class BingoEngine {
    constructor() {
        this.TOTAL_BALLS = 75;
        this.RANGES = {
            'B': [1, 15],
            'I': [16, 30],
            'N': [31, 45],
            'G': [46, 60],
            'O': [61, 75]
        };
        this.LETTERS = ['B', 'I', 'N', 'G', 'O'];
    }

    getLetterForNumber(number) {
        if (number >= 1 && number <= 15) return 'B';
        if (number >= 16 && number <= 30) return 'I';
        if (number >= 31 && number <= 45) return 'N';
        if (number >= 46 && number <= 60) return 'G';
        if (number >= 61 && number <= 75) return 'O';
        return 'B';
    }

    generateCard() {
        const card = {};
        for (const letter of this.LETTERS) {
            const [min, max] = this.RANGES[letter];
            const pool = [];
            for (let i = min; i <= max; i++) {
                pool.push(i);
            }
            // Shuffle and pick 5 numbers
            const selected = [];
            for (let i = 0; i < 5; i++) {
                const randIndex = Math.floor(Math.random() * pool.length);
                selected.push(pool.splice(randIndex, 1)[0]);
            }
            if (letter === 'N') {
                // Pos 2 is FREE space
                selected[2] = null;
            }
            card[letter] = selected;
        }
        return card;
    }

    checkCard(card, drawnNumbers) {
        const drawnSet = drawnNumbers instanceof Set ? drawnNumbers : new Set(drawnNumbers);
        let hitsCount = 0;
        const totalNeeded = 24; // 25 células menos a casa FREE

        // Matriz 5x5 de acertos
        const matrix = [];
        for (let row = 0; row < 5; row++) {
            const rowHits = [];
            for (const letter of this.LETTERS) {
                const num = card[letter][row];
                if (num === null) {
                    // Casa FREE sempre conta como acerto
                    rowHits.push(true);
                } else if (drawnSet.has(num)) {
                    rowHits.push(true);
                    hitsCount++;
                } else {
                    rowHits.push(false);
                }
            }
            matrix.push(rowHits);
        }

        // Checagem de Linhas completas
        let completedRows = 0;
        for (let r = 0; r < 5; r++) {
            if (matrix[r].every(val => val === true)) completedRows++;
        }

        // Checagem de Colunas completas
        let completedCols = 0;
        for (let c = 0; c < 5; c++) {
            let colComplete = true;
            for (let r = 0; r < 5; r++) {
                if (!matrix[r][c]) {
                    colComplete = false;
                    break;
                }
            }
            if (colComplete) completedCols++;
        }

        // Checagem de Diagonais
        let diag1 = true;
        let diag2 = true;
        for (let i = 0; i < 5; i++) {
            if (!matrix[i][i]) diag1 = false;
            if (!matrix[i][4 - i]) diag2 = false;
        }

        const isFullCard = (hitsCount === totalNeeded);
        const remaining = totalNeeded - hitsCount;
        const progressPercent = Math.round((hitsCount / totalNeeded) * 100);

        return {
            hits: hitsCount,
            totalNeeded,
            remaining,
            progressPercent,
            isFullCard,
            completedRows,
            completedCols,
            hasDiagonal: (diag1 || diag2),
            // Status descritivo para o placar dinâmico
            statusText: isFullCard 
                ? 'BINGO! 🏆' 
                : remaining === 1 
                    ? 'Falta 1! 🎯' 
                    : remaining === 2 
                        ? 'Faltam 2! 🔥' 
                        : `Faltam ${remaining}`,
            statusClass: isFullCard 
                ? 'bg-warning text-dark fw-bold animate-pulse' 
                : remaining === 1 
                    ? 'bg-danger text-white fw-bold' 
                    : remaining === 2 
                        ? 'bg-primary text-white' 
                        : 'bg-secondary-subtle text-light'
        };
    }
}

window.BingoEngine = new BingoEngine();
