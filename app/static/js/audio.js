/**
 * Audio & Voice Synthesizer for Bingo Master
 * Uses Web Audio API for synthetic sound effects & Web Speech API for voice announcement.
 */
class BingoAudio {
    constructor() {
        this.soundEnabled = localStorage.getItem('bingo_sound_enabled') !== 'false';
        this.voiceEnabled = localStorage.getItem('bingo_voice_enabled') !== 'false';
        this.audioCtx = null;
    }

    _initContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('bingo_sound_enabled', this.soundEnabled);
        return this.soundEnabled;
    }

    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        localStorage.setItem('bingo_voice_enabled', this.voiceEnabled);
        return this.voiceEnabled;
    }

    playClick() {
        if (!this.soundEnabled) return;
        this._initContext();
        if (!this.audioCtx) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.05);
    }

    playBallRoll() {
        if (!this.soundEnabled) return;
        this._initContext();
        if (!this.audioCtx) return;

        // Roll rumble effect
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(240, now + 0.25);
        osc.frequency.linearRampToValueAtTime(140, now + 0.5);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    playBallPop() {
        if (!this.soundEnabled) return;
        this._initContext();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        // Two-tone bell ding
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0.15, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.35);
        });
    }

    playWinFanfare() {
        if (!this.soundEnabled) return;
        this._initContext();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const fanfareNotes = [
            { f: 523.25, d: 0.15 }, // C5
            { f: 659.25, d: 0.15 }, // E5
            { f: 783.99, d: 0.15 }, // G5
            { f: 1046.50, d: 0.5 }  // C6
        ];

        let offset = 0;
        fanfareNotes.forEach(note => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, now + offset);

            gain.gain.setValueAtTime(0.2, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + note.d);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + note.d);
            offset += note.d * 0.85;
        });
    }

    speakBall(letter, number) {
        if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel(); // Stop any pending speech

        const text = `${letter}, ${number}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
    }

    speakBingo(winnerName) {
        if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();

        const text = `Atenção! BINGO de ${winnerName}!`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.1;

        window.speechSynthesis.speak(utterance);
    }
}

window.BingoAudio = new BingoAudio();
