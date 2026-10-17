/**
 * Main Application Orchestrator for Bingo Master
 * Coordinates UI, Storage, Audio, Engine and Real-time Updates.
 * Adapted for Physical Cards: Real-time Master Board, Participant Manager with BINGO button,
 * and Modern Confirmation Modals (no browser native alerts).
 */
class BingoApp {
    constructor() {
        this.storage = window.BingoStorage;
        this.engine = window.BingoEngine;
        this.audio = window.BingoAudio;

        this.currentRound = null;
        this.participants = [];
        this.autoDrawInterval = null;
        this.autoSpeedMs = 3500;
        this.isDrawing = false;

        this.dom = {};
    }

    _escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    init() {
        this._cacheDom();
        this._initSoundToggles();
        this._loadOrCreateState();
        this._renderAll();
        this._bindEvents();
    }

    _cacheDom() {
        this.dom = {
            roundNumber: document.getElementById('stat-round-number'),
            drawnCount: document.getElementById('stat-drawn-count'),
            remainingCount: document.getElementById('stat-remaining-count'),
            historyCountBadge: document.getElementById('badge-history-count'),
            participantsCountBadge: document.getElementById('badge-participants-count'),

            ballDisplay: document.getElementById('current-ball-display'),
            ballLetter: document.getElementById('current-ball-letter'),
            ballNumber: document.getElementById('current-ball-number'),
            ballStatus: document.getElementById('ball-status-label'),
            btnDrawBall: document.getElementById('btn-draw-ball'),

            btnToggleAuto: document.getElementById('btn-toggle-auto'),
            iconAutoDraw: document.getElementById('icon-auto-draw'),
            labelAutoDraw: document.getElementById('label-auto-draw'),
            spinnerAutoDraw: document.getElementById('spinner-auto-draw'),
            selectSpeed: document.getElementById('select-speed'),

            recentTray: document.getElementById('recent-balls-tray'),
            recentCount: document.getElementById('recent-balls-count'),

            participantsList: document.getElementById('leaderboard-container'),

            btnToggleSound: document.getElementById('btn-toggle-sound'),
            iconSound: document.getElementById('icon-sound'),
            btnToggleVoice: document.getElementById('btn-toggle-voice'),
            iconVoice: document.getElementById('icon-voice'),

            historyRoundsList: document.getElementById('history-rounds-list'),
            modalHistoryTotal: document.getElementById('modal-history-total')
        };
    }

    _initSoundToggles() {
        this._updateSoundIcon();
        this._updateVoiceIcon();

        if (this.dom.btnToggleSound) {
            this.dom.btnToggleSound.addEventListener('click', () => {
                this.audio.toggleSound();
                this._updateSoundIcon();
            });
        }
        if (this.dom.btnToggleVoice) {
            this.dom.btnToggleVoice.addEventListener('click', () => {
                this.audio.toggleVoice();
                this._updateVoiceIcon();
            });
        }
    }

    _updateSoundIcon() {
        if (!this.dom.iconSound) return;
        if (this.audio.soundEnabled) {
            this.dom.iconSound.className = 'bi bi-volume-up-fill text-warning';
        } else {
            this.dom.iconSound.className = 'bi bi-volume-mute-fill text-secondary';
        }
    }

    _updateVoiceIcon() {
        if (!this.dom.iconVoice) return;
        if (this.audio.voiceEnabled) {
            this.dom.iconVoice.className = 'bi bi-mic-fill text-info';
        } else {
            this.dom.iconVoice.className = 'bi bi-mic-mute-fill text-secondary';
        }
    }

    _loadOrCreateState() {
        this.currentRound = this.storage.getCurrentRound();
        this.participants = this.storage.getParticipants();

        // Se não houver participantes, adiciona participantes padrão de demonstração
        if (this.participants.length === 0) {
            const defaults = [
                { name: 'Lívia', color: '#6366f1' },
                { name: 'Rodrigo', color: '#06b6d4' },
                { name: 'Beatriz', color: '#10b981' }
            ];
            this.participants = defaults.map(item => ({
                id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                name: item.name,
                color: item.color,
                createdAt: new Date().toISOString()
            }));
            this.storage.saveParticipants(this.participants);
        }
    }

    _bindEvents() {
        const historyModalEl = document.getElementById('historyModal');
        if (historyModalEl) {
            historyModalEl.addEventListener('show.bs.modal', () => {
                this.renderHistoryModal();
            });
        }
    }

    /* =========================================================================
       Drawing Balls & Game Loop
       ========================================================================= */
    drawNextBall() {
        if (this.isDrawing) return;
        if (this.currentRound.isFinished) {
            this.showConfirmModal({
                title: 'Rodada Finalizada',
                message: `Esta rodada já foi finalizada com a vitória de <strong class="text-warning">${this.currentRound.winner}</strong>. Deseja iniciar uma nova rodada?`,
                actionText: 'Iniciar Nova Rodada',
                actionClass: 'btn-warning text-dark',
                iconClass: 'bi-flag-fill text-warning',
                onConfirm: () => this.startNewRound()
            });
            return;
        }

        const drawnSet = new Set(this.currentRound.drawnBalls);
        if (drawnSet.size >= 75) {
            this.stopAutoDraw();
            this.showConfirmModal({
                title: 'Fim do Globo',
                message: 'Todas as 75 pedras já foram sorteadas nesta rodada!',
                actionText: 'Entendido',
                actionClass: 'btn-secondary',
                iconClass: 'bi-check-circle-fill text-success',
                onConfirm: () => {}
            });
            return;
        }

        // Seleciona pedra disponível
        const available = [];
        for (let i = 1; i <= 75; i++) {
            if (!drawnSet.has(i)) available.push(i);
        }

        const nextNum = available[Math.floor(Math.random() * available.length)];
        const nextLetter = this.engine.getLetterForNumber(nextNum);

        this.isDrawing = true;
        this.audio.playBallRoll();

        // Animação de giro
        this.dom.ballDisplay.classList.add('rolling');
        this.dom.ballStatus.innerText = 'Girando o globo...';

        setTimeout(() => {
            this.dom.ballDisplay.classList.remove('rolling');
            this.dom.ballDisplay.classList.add('popping');
            this.audio.playBallPop();

            // Atualiza pedra atual
            this.dom.ballLetter.innerText = nextLetter;
            this.dom.ballNumber.innerText = nextNum;
            this.dom.ballStatus.innerText = `Pedra sorteada: ${nextLetter}-${nextNum}`;

            // Narração de voz
            this.audio.speakBall(nextLetter, nextNum);

            // Registra sorteio
            this.currentRound.drawnBalls.push(nextNum);
            this.storage.saveCurrentRound(this.currentRound);

            // Atualiza a interface
            this._updateStats();
            this._updateMasterBoard(nextNum);
            this._updateRecentBalls();

            setTimeout(() => {
                this.dom.ballDisplay.classList.remove('popping');
                this.isDrawing = false;
            }, 400);

        }, 400);
    }

    toggleAutoDraw() {
        if (this.autoDrawInterval) {
            this.stopAutoDraw();
        } else {
            this.startAutoDraw();
        }
    }

    startAutoDraw() {
        if (this.currentRound.isFinished) {
            this.showConfirmModal({
                title: 'Rodada Finalizada',
                message: `Esta rodada já terminou com a vitória de <strong class="text-warning">${this.currentRound.winner}</strong>. Inicie uma nova rodada para continuar sorteando.`,
                actionText: 'Nova Rodada',
                actionClass: 'btn-warning text-dark',
                iconClass: 'bi-trophy-fill text-warning',
                onConfirm: () => this.startNewRound()
            });
            return;
        }
        this.dom.iconAutoDraw.className = 'bi bi-pause-fill';
        this.dom.labelAutoDraw.innerText = 'Pausar';
        this.dom.btnToggleAuto.classList.replace('btn-outline-info', 'btn-info');
        this.dom.spinnerAutoDraw.classList.remove('d-none');

        this.drawNextBall();

        this.autoDrawInterval = setInterval(() => {
            if (!this.isDrawing) {
                if (this.currentRound.isFinished || this.currentRound.drawnBalls.length >= 75) {
                    this.stopAutoDraw();
                } else {
                    this.drawNextBall();
                }
            }
        }, this.autoSpeedMs);
    }

    stopAutoDraw() {
        if (this.autoDrawInterval) {
            clearInterval(this.autoDrawInterval);
            this.autoDrawInterval = null;
        }
        if (this.dom.iconAutoDraw) this.dom.iconAutoDraw.className = 'bi bi-play-fill';
        if (this.dom.labelAutoDraw) this.dom.labelAutoDraw.innerText = 'Auto-Sorteio';
        if (this.dom.btnToggleAuto) this.dom.btnToggleAuto.classList.replace('btn-info', 'btn-outline-info');
        if (this.dom.spinnerAutoDraw) this.dom.spinnerAutoDraw.classList.add('d-none');
    }

    changeSpeed(speedVal) {
        this.autoSpeedMs = parseInt(speedVal, 10) || 3500;
        if (this.autoDrawInterval) {
            this.stopAutoDraw();
            this.startAutoDraw();
        }
    }

    /* =========================================================================
       UI Updaters
       ========================================================================= */
    _renderAll() {
        this._updateStats();
        this._renderMasterBoardFull();
        this._updateRecentBalls();
        this._renderCurrentBall();
        this._renderParticipants();
        this._updateHistoryBadge();
    }

    _updateStats() {
        const drawn = this.currentRound.drawnBalls.length;
        this.dom.roundNumber.innerText = this.currentRound.roundNumber;
        this.dom.drawnCount.innerText = drawn;
        this.dom.remainingCount.innerText = 75 - drawn;
        this.dom.participantsCountBadge.innerText = `${this.participants.length} Jogadores`;
    }

    _renderCurrentBall() {
        const drawn = this.currentRound.drawnBalls;
        if (drawn.length > 0) {
            const last = drawn[drawn.length - 1];
            this.dom.ballLetter.innerText = this.engine.getLetterForNumber(last);
            this.dom.ballNumber.innerText = last;
            this.dom.ballStatus.innerText = `Última pedra: ${this.engine.getLetterForNumber(last)}-${last}`;
        } else {
            this.dom.ballLetter.innerText = '--';
            this.dom.ballNumber.innerText = '--';
            this.dom.ballStatus.innerText = 'Pronto para sortear!';
        }
    }

    _renderMasterBoardFull() {
        const drawnSet = new Set(this.currentRound.drawnBalls);
        const lastNum = this.currentRound.drawnBalls.length > 0 
            ? this.currentRound.drawnBalls[this.currentRound.drawnBalls.length - 1] 
            : null;

        for (let i = 1; i <= 75; i++) {
            const ballEl = document.getElementById(`board-ball-${i}`);
            if (ballEl) {
                ballEl.classList.remove('drawn', 'last-drawn');
                if (drawnSet.has(i)) {
                    if (i === lastNum) {
                        ballEl.classList.add('last-drawn');
                    } else {
                        ballEl.classList.add('drawn');
                    }
                }
            }
        }
    }

    _updateMasterBoard(newNum) {
        const prevLast = document.querySelector('.board-ball.last-drawn');
        if (prevLast) {
            prevLast.classList.remove('last-drawn');
            prevLast.classList.add('drawn');
        }

        const newEl = document.getElementById(`board-ball-${newNum}`);
        if (newEl) {
            newEl.classList.remove('drawn');
            newEl.classList.add('last-drawn');
        }
    }

    _updateRecentBalls() {
        const drawn = this.currentRound.drawnBalls;
        this.dom.recentTray.innerHTML = '';

        if (drawn.length === 0) {
            this.dom.recentTray.innerHTML = '<span class="text-secondary fs-xs px-2" id="recent-balls-empty">Nenhuma pedra sorteada nesta rodada.</span>';
            this.dom.recentCount.innerText = '0 saíram';
            return;
        }

        this.dom.recentCount.innerText = `${drawn.length} saíram`;

        const recent = drawn.slice(-10).reverse();
        recent.forEach((num, idx) => {
            const letter = this.engine.getLetterForNumber(num);
            const pill = document.createElement('div');
            pill.className = `recent-ball-pill ${idx === 0 ? 'is-newest' : ''}`;
            pill.innerHTML = `<span>${letter}</span><strong>${num}</strong>`;
            this.dom.recentTray.appendChild(pill);
        });
    }

    /* =========================================================================
       Participants & Manual Winner Trigger
       ========================================================================= */
    _renderParticipants() {
        if (!this.dom.participantsList) return;

        if (this.participants.length === 0) {
            this.dom.participantsList.innerHTML = `
                <div class="text-center py-4 text-secondary" id="leaderboard-empty">
                    <i class="bi bi-people fs-2 mb-2 d-block opacity-50"></i>
                    <p class="mb-1">Nenhum participante adicionado.</p>
                    <button class="btn btn-sm btn-outline-warning rounded-pill mt-2" data-bs-toggle="modal" data-bs-target="#participantModal">
                        Adicionar Primeiro Participante
                    </button>
                </div>
            `;
            return;
        }

        this.dom.participantsList.innerHTML = '';
        this.participants.forEach((p) => {
            const safeName = this._escapeHtml(p.name);
            const item = document.createElement('div');
            item.className = 'participant-item d-flex align-items-center justify-content-between gap-2';

            item.innerHTML = `
                <div class="d-flex align-items-center gap-2 text-truncate">
                    <div class="avatar-circle-sm flex-shrink-0" style="background-color: ${p.color};">
                        ${safeName.charAt(0).toUpperCase()}
                    </div>
                    <div class="text-truncate">
                        <strong class="text-white fs-sm d-block text-truncate">${safeName}</strong>
                        <span class="fs-xs text-secondary">Cartela Física</span>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2 flex-shrink-0">
                    <button class="btn btn-sm btn-winner-bingo rounded-pill px-3 py-1 fs-xs d-flex align-items-center gap-1 shadow-sm"
                            onclick="window.BingoApp.declareWinner('${p.id}')"
                            title="Declarar ${safeName} como vencedor da rodada">
                        <i class="bi bi-trophy-fill"></i>
                        <span>BINGO!</span>
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                            style="width: 32px; height: 32px;"
                            title="Remover participante"
                            onclick="window.BingoApp.promptRemoveParticipant('${p.id}', '${safeName}')">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            `;
            this.dom.participantsList.appendChild(item);
        });
    }

    declareWinner(participantId) {
        const participant = this.participants.find(p => p.id === participantId);
        if (!participant) return;

        if (this.currentRound.isFinished) {
            this.showConfirmModal({
                title: 'Rodada Já Finalizada',
                message: `A rodada #${this.currentRound.roundNumber} já tem um vencedor registrado (<strong class="text-warning">${this.currentRound.winner}</strong>). Deseja iniciar uma nova rodada?`,
                actionText: 'Iniciar Nova Rodada',
                actionClass: 'btn-warning text-dark',
                iconClass: 'bi-trophy-fill text-warning',
                onConfirm: () => this.startNewRound()
            });
            return;
        }

        // Finaliza a rodada atual
        this.stopAutoDraw();
        this.currentRound.isFinished = true;
        this.currentRound.winner = participant.name;
        this.storage.saveCurrentRound(this.currentRound);

        // Áudio & celebração
        this.audio.playWinFanfare();
        this.audio.speakBingo(participant.name);
        this._launchConfetti();

        // Registra histórico
        const lastNum = this.currentRound.drawnBalls.length > 0 
            ? this.currentRound.drawnBalls[this.currentRound.drawnBalls.length - 1] 
            : null;

        const roundRecord = {
            id: 'rnd_' + Date.now(),
            roundNumber: this.currentRound.roundNumber,
            date: new Date().toLocaleString('pt-BR'),
            winnerName: participant.name,
            winnerColor: participant.color,
            ballsDrawnCount: this.currentRound.drawnBalls.length,
            lastBall: lastNum,
            participants: this.participants.map(p => ({
                name: p.name,
                color: p.color
            })),
            drawnBalls: [...this.currentRound.drawnBalls]
        };
        this.storage.saveRoundToHistory(roundRecord);
        this._updateHistoryBadge();

        // Exibe modal de vitória e preenche dados
        document.getElementById('winner-name-display').innerText = participant.name;
        document.getElementById('winner-balls-count').innerText = this.currentRound.drawnBalls.length;
        document.getElementById('winner-last-ball').innerText = lastNum 
            ? `${this.engine.getLetterForNumber(lastNum)}-${lastNum}` 
            : '-';

        // Preenche o nome no banner de conferência da mesa
        const bannerWinnerName = document.getElementById('verification-winner-name');
        if (bannerWinnerName) bannerWinnerName.innerText = participant.name;

        // Preenche a lista de pedras sorteadas para conferência no próprio modal
        const drawnContainer = document.getElementById('winner-drawn-balls-container');
        const drawnBadge = document.getElementById('winner-balls-badge');
        const drawnList = this.currentRound.drawnBalls || [];

        if (drawnBadge) drawnBadge.innerText = `${drawnList.length} pedras sorteadas`;
        if (drawnContainer) {
            drawnContainer.innerHTML = '';
            if (drawnList.length === 0) {
                drawnContainer.innerHTML = '<small class="text-secondary">Nenhuma pedra sorteada nesta rodada.</small>';
            } else {
                drawnList.forEach(num => {
                    const letter = this.engine.getLetterForNumber(num);
                    const pill = document.createElement('span');
                    pill.className = 'badge bg-dark-subtle border border-secondary-subtle text-light fs-xs px-2 py-1';
                    pill.innerHTML = `<span class="text-warning fw-bold">${letter}</span>-${num}`;
                    drawnContainer.appendChild(pill);
                });
            }
        }

        const winnerModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('winnerModal'));
        winnerModal.show();
    }

    goToBoardVerification() {
        const modalEl = document.getElementById('winnerModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Ativa o banner de modo conferência na mesa
        const banner = document.getElementById('verification-banner');
        if (banner) {
            banner.classList.remove('d-none');
            banner.classList.add('d-flex');
        }

        // Rola a tela suavemente até o Painel Geral das 75 Pedras
        const boardCard = document.getElementById('master-board-card');
        if (boardCard) {
            boardCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            boardCard.classList.add('border-warning', 'shadow-2xl');
            setTimeout(() => {
                boardCard.classList.remove('border-warning', 'shadow-2xl');
            }, 3000);
        }
    }

    reopenWinnerModal() {
        const winnerModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('winnerModal'));
        winnerModal.show();
    }

    _launchConfetti() {
        if (typeof confetti === 'function') {
            const count = 200;
            const defaults = { origin: { y: 0.7 } };

            function fire(particleRatio, opts) {
                confetti(Object.assign({}, defaults, opts, {
                    particleCount: Math.floor(count * particleRatio)
                }));
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        }
    }

    /* =========================================================================
       Participant Management & Custom Modal Confirmation
       ========================================================================= */
    addParticipantFromForm() {
        const inputName = document.getElementById('input-participant-name');
        const name = (inputName.value || '').trim();
        if (!name) return;

        const selectedColorEl = document.querySelector('input[name="participant-color"]:checked');
        const color = selectedColorEl ? selectedColorEl.value : '#6366f1';

        const newParticipant = {
            id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            color: color,
            createdAt: new Date().toISOString()
        };

        this.participants.push(newParticipant);
        this.storage.saveParticipants(this.participants);

        inputName.value = '';
        const modalEl = document.getElementById('participantModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        this.audio.playClick();
        this._updateStats();
        this._renderParticipants();
    }

    promptRemoveParticipant(id, name) {
        this.showConfirmModal({
            title: 'Remover Participante',
            message: `Tem certeza de que deseja remover <strong class="text-white">${name}</strong> desta partida?`,
            actionText: 'Sim, remover',
            actionClass: 'btn-danger',
            iconClass: 'bi-person-x-fill text-danger',
            onConfirm: () => {
                this.participants = this.storage.removeParticipant(id);
                this.audio.playClick();
                this._updateStats();
                this._renderParticipants();
            }
        });
    }

    /* =========================================================================
       Modal de Confirmação Moderno (Substitui confirm/alert nativos)
       ========================================================================= */
    showConfirmModal({ title, message, actionText, actionClass, iconClass, onConfirm }) {
        const titleEl = document.getElementById('confirmModalLabel');
        const messageEl = document.getElementById('confirm-modal-message');
        const iconEl = document.getElementById('confirm-modal-icon');
        const iconContainer = document.getElementById('confirm-modal-icon-container');
        const actionBtn = document.getElementById('btn-confirm-action');

        if (titleEl) titleEl.innerText = title || 'Confirmar';
        if (messageEl) messageEl.innerHTML = message || 'Tem certeza?';
        if (iconEl) iconEl.className = `bi ${iconClass || 'bi-exclamation-triangle-fill text-warning'} fs-1`;
        if (iconContainer) {
            iconContainer.className = 'confirm-icon-wrapper mb-3 mx-auto d-flex align-items-center justify-content-center';
            if (actionClass && actionClass.includes('danger')) {
                iconContainer.classList.add('danger');
            }
        }

        if (actionBtn) {
            actionBtn.innerText = actionText || 'Confirmar';
            actionBtn.className = `btn ${actionClass || 'btn-danger'} px-4 rounded-pill fw-semibold shadow-sm`;

            // Remove ouvintes antigos clonando o elemento
            const newActionBtn = actionBtn.cloneNode(true);
            actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);

            newActionBtn.addEventListener('click', () => {
                const modalEl = document.getElementById('confirmModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
            });
        }

        const modalEl = document.getElementById('confirmModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }

    /* =========================================================================
       Rounds & History Management
       ========================================================================= */
    promptNewRound() {
        if (this.currentRound.drawnBalls.length > 0 && !this.currentRound.isFinished) {
            this.showConfirmModal({
                title: 'Iniciar Nova Rodada',
                message: 'A rodada atual ainda não foi finalizada. Deseja realmente iniciar uma nova rodada e descartar o progresso atual?',
                actionText: 'Sim, Nova Rodada',
                actionClass: 'btn-warning text-dark',
                iconClass: 'bi-arrow-repeat text-warning',
                onConfirm: () => this.startNewRound()
            });
            return;
        }
        this.startNewRound();
    }

    startNewRoundFromWinnerModal() {
        const modalEl = document.getElementById('winnerModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        this.startNewRound();
    }

    startNewRound() {
        this.stopAutoDraw();
        const nextRoundNum = (this.currentRound.roundNumber || 1) + 1;
        this.currentRound = this.storage.resetCurrentRound(nextRoundNum);

        // Oculta o banner de conferência da rodada anterior
        const banner = document.getElementById('verification-banner');
        if (banner) {
            banner.classList.add('d-none');
            banner.classList.remove('d-flex');
        }

        this.audio.playClick();
        this._renderAll();
    }

    promptResetAll() {
        this.showConfirmModal({
            title: 'Resetar Jogo Completo',
            message: 'Isso irá reiniciar o jogo atual para a Rodada #1 e limpar as pedras sorteadas. O histórico de rodadas anteriores será preservado. Deseja continuar?',
            actionText: 'Sim, Resetar',
            actionClass: 'btn-danger',
            iconClass: 'bi-power text-danger',
            onConfirm: () => {
                this.stopAutoDraw();
                this.currentRound = this.storage.resetCurrentRound(1);
                this._renderAll();
            }
        });
    }

    _updateHistoryBadge() {
        const history = this.storage.getHistory();
        if (this.dom.historyCountBadge) {
            this.dom.historyCountBadge.innerText = history.length;
        }
    }

    renderHistoryModal() {
        const history = this.storage.getHistory();
        if (this.dom.modalHistoryTotal) {
            this.dom.modalHistoryTotal.innerText = history.length;
        }

        if (!this.dom.historyRoundsList) return;
        this.dom.historyRoundsList.innerHTML = '';

        if (history.length === 0) {
            this.dom.historyRoundsList.innerHTML = `
                <div class="text-center py-5 text-secondary" id="history-empty-state">
                    <i class="bi bi-journal-x fs-1 opacity-50 mb-2 d-block"></i>
                    <p class="mb-0">Nenhuma rodada anterior registrada ainda.</p>
                    <small>Ao declarar um vencedor do Bingo, a rodada será salva aqui automaticamente!</small>
                </div>
            `;
            return;
        }

        history.forEach((round) => {
            const item = document.createElement('div');
            item.className = 'history-round-item';

            const lastBallText = round.lastBall 
                ? `${this.engine.getLetterForNumber(round.lastBall)}-${round.lastBall}` 
                : '-';
            const safeWinner = this._escapeHtml(round.winnerName);

            const participantsList = (round.participants || round.participantsRanking || []).map(p => {
                const safePName = this._escapeHtml(p.name);
                const isWinner = safePName === safeWinner;
                return `
                    <span class="badge ${isWinner ? 'bg-warning text-dark fw-bold' : 'bg-dark border border-secondary-subtle'} text-truncate" style="max-width: 140px;">
                        ${isWinner ? '🏆 ' : ''}${safePName}
                    </span>
                `;
            }).join(' ');

            item.innerHTML = `
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-primary fs-xs">Rodada #${round.roundNumber}</span>
                        <strong class="text-white fs-sm">Vencedor: <span class="text-warning">${safeWinner}</span></strong>
                    </div>
                    <small class="text-secondary fs-xs">
                        <i class="bi bi-calendar3 me-1"></i>${round.date}
                    </small>
                </div>

                <div class="d-flex flex-wrap align-items-center gap-3 fs-xs text-secondary mb-2">
                    <div>Pedras sorteadas: <strong class="text-info">${round.ballsDrawnCount}</strong> / 75</div>
                    <div>Pedra do Bingo: <strong class="text-warning">${lastBallText}</strong></div>
                </div>

                <div class="pt-2 border-top border-secondary-subtle">
                    <small class="text-secondary d-block mb-1 fs-xs">Participantes da rodada:</small>
                    <div class="d-flex flex-wrap gap-1">
                        ${participantsList}
                    </div>
                </div>
            `;
            this.dom.historyRoundsList.appendChild(item);
        });
    }

    exportHistory() {
        this.storage.exportHistoryJSON();
    }

    clearHistoryPrompt() {
        this.showConfirmModal({
            title: 'Limpar Todo o Histórico',
            message: 'Tem certeza de que deseja apagar todo o histórico de rodadas anteriores armazenado no seu navegador? Esta ação não pode ser desfeita.',
            actionText: 'Sim, Limpar Tudo',
            actionClass: 'btn-danger',
            iconClass: 'bi-trash3-fill text-danger',
            onConfirm: () => {
                this.storage.clearHistory();
                this._updateHistoryBadge();
                this.renderHistoryModal();
            }
        });
    }
}

// Inicializa a aplicação no carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    window.BingoApp = new BingoApp();
    window.BingoApp.init();
});
