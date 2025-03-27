import Pokemon from "./Pokemon.js";
import Signal from './../Signal.js';

export default class Egg extends Pokemon {
    constructor(pc, table = "default", seconds = 5, row, col) {
        super(pc, "egg", 0, "https://github.com/Garkatron/PC-PokeApi/blob/main/assets/egg/egg0.png?raw=true", "https://github.com/Garkatron/PC-PokeApi/blob/main/assets/egg/egg0.png?raw=true", -1, row, col);
        this.seconds = seconds;
        this.pokemon = null;
        this.freeze = false;
        this.freezeSignal = new Signal();
        this.timer = null;
        this.table = table;
        this.abortController = new AbortController();
        this.startTime = null;
        this.leftSeconds = seconds;

        this.init();

        this.freezeSignal.connect((value) => {
            if (value) {
                this.cancelEclosion();
            } else {
                this.resumeEclosion();
            }
        });
    }

    async init() {
        try {
            this.abortController = new AbortController();

            do {
                this.pokemon = await Promise.race([
                    Pokemon.getFullRandom(this.pc),
                    new Promise((_, reject) => this.abortController.signal.addEventListener("abort", () => reject()))
                ]);

            } while (!this.pokemon || this.pokemon.noSprites());

            this.startTimer();

        } catch (error) {
            if (error !== undefined) {
                console.error("Egg hatching error:", error);
            }
        }
    }

    startTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
        }

        if (!this.freeze) {
            this.startTime = Date.now();
            this.timer = setTimeout(() => this.replace(), this.leftSeconds * 1000);
        }
    }

    async replace() {
        if (!this.pokemon || this.freeze) {
            this.init();
            return;
        }

        this.pc.replace(this.table, this.col, this.row, this.pokemon);
    }

    async playCrie() {
        await this.pc.play("../assets/menu select.wav");
    }

    setFreeze(value) {
        this.freeze = value;
        this.freezeSignal.emit(value);
    }

    cancelEclosion() {
        clearTimeout(this.timer);
        this.leftSeconds = Math.max(0, this.seconds - ((Date.now() - this.startTime) / 1000));
        this.abortController.abort();
    }

    resumeEclosion() {
        this.init();
    }

    genJSON() {
        const p = JSON.parse(super.genJSON());
        p["leftSeconds"] = this.leftSeconds;
        return JSON.stringify(p);
    }

    static fromJSON(pc, json = {}) {
        return new Egg(pc, json.table, json.leftSeconds || json.seconds, json.row, json.col);
    }
}
