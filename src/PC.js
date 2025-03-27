import Signal from "../Signal.js";
import Egg from "./Egg.js";
import Pokemon from "./Pokemon.js";

export default class PC {

    constructor() {

        /**
         * ! VARIABLES 
         */

        this.dragID = 0;

        this.tables = {};
        this.currentTable = "default";

        this.tableBodyElement = document.getElementById("poketable");
        this.pokecard = document.getElementById("pokemoncard");

        this.tableHeight = 5;
        this.tableWidth = 6;

        this.canMove = false;

        this.newEggMaxSecondsDelay = 600;
        this.newEggMinSecondsDelay = 200;
        this.newEggSecondsLeft = 0;

        /**
         * ! SIGNALS
         */

        this.onSelectPokemon$ = new Signal()
        this.resfreshTable$ = new Signal();

        /**
         * ! ON BUILD
         */

        if (!this.tables["default"]) {
            this.createTable("default");
            const data = this.createTableBody("default");
            this.tableBodyElement.appendChild(data);
        }
        this._showTables();

        this.resfreshTable$.connect(() => {
            this.refreshTable();

        });


        this.onSelectPokemon$.connect(
            async (row, col) => {

                const pokemon = this.getPokemonObject(this.currentTable, row, col);
                await this.replaceCardBody(pokemon);
            }
        )

        // ----------------------------------------------------------------------------------- //

        this.askDeleteTableButton = document.getElementById("ask-delete-table-button");
        this.buttonBack = document.getElementById("button-back");
        this.tableName = document.getElementById("table-name");
        this.buttonNext = document.getElementById("button-next");
        this.askNewTableButton = document.getElementById("ask-new-table-button");
        this.addEggButton = document.getElementById("add-egg");
        this.timeRemainingElement = document.getElementById("time-remaining");

        this.buttonNext.onclick = this.nextTable.bind(this);
        this.buttonBack.onclick = this.prevTable.bind(this);
        this.askDeleteTableButton.onclick = this.askDeleteTable.bind(this);
        this.askNewTableButton.onclick = this.askCreateTable.bind(this);
        this.updateTablesAvailable();
        this.tableName.onchange = () => {
            this.currentTable = this.tableName.value;
            this.refreshTable();
        };
        this.addEggButton.onclick = this.addNewEgg.bind(this)

        this.loadState();
        this.loadPokemons()

        window.addEventListener("beforeunload", () => {
            this.savePokemons();
            this.saveState();
        });

        setInterval(() => {
            this.savePokemons();
            this.saveState();
            console.info("Saved pokemons");
        }, 30000);

        if (this.newEggSecondsLeft > 0) {
            this.setRandomNewEggInterval(this.newEggSecondsLeft);
        } else {
            this.addEggButton.disabled = false;
        }
        this.refreshTable();
    }

    async replaceCardBody(pokemon) {

        this.pokecard.innerHTML = "";
        this.pokecard.appendChild(await pokemon.getCardBodyElement());

    }


    _showTables() {
        console.log("Existing tables:");
        for (const [a, b] of Object.entries(this.tables)) {
            console.log("Name:", a, "\ntable:", b);
        }
    }

    /**
     * Creates a table bodythis.tableSize
     * @param {*} tableName 
     * @returns 
     */
    createTableBody(tableName) {
        if (!Object.hasOwn(this.tables, tableName)) {
            console.error(`Table "${tableName}" not found.`);
            return "<p>Table not found</p>";
        }

        const tableElement = document.createElement("tbody");

        for (let row = 0; row < this.tables[tableName].length; row++) {
            let tr = document.createElement("tr");

            for (let col = 0; col < this.tables[tableName][row].length; col++) {
                let img = null;
                const pokemon = this.tables[tableName][row][col];

                if (pokemon) {
                    img = pokemon.getImgDraggable(this.dragID++);
                }

                tr.appendChild(this.createSlot(`slot-${row}-${col}`, img, row, col));
            }

            tableElement.appendChild(tr);
        }

        return tableElement;
    }



    getAllPokemons(tableName) {
        if (!this.tables.hasOwnProperty(tableName)) {
            console.error(`This table doesn't exist`);
            return [];
        }

        return this.tables[tableName].flat().filter(Boolean);
    }


    getPokemonObject(table, row, col) {
        return this.tables[table][row][col];
    }


    /**
     * Refresh the whole table body with the new table info 
     */
    refreshTable() {
        const data = this.createTableBody(this.currentTable);
        this.tableBodyElement.innerHTML = "";
        this.tableBodyElement.appendChild(data);

        //this.tableName.innerText = this.currentTable;
    }

    updateTablesAvailable() {
        const tablesKeys = Object.keys(this.tables);
        this.tableName.innerHTML = '';

        tablesKeys.forEach((n) => {
            const option = document.createElement("option");
            option.value = n;
            option.text = n;

            if (n === this.currentTable) {
                option.selected = true;
            }

            this.tableName.appendChild(option);
        });
    }



    /**
     * Creates a slots for the table
     * @param {*} id 
     * @param {*} drag 
     * @param {*} row 
     * @param {*} col 
     * @returns 
     */
    createSlot(id = "slot1", drag = null, row, col) {
        const div = document.createElement("div");
        div.classList.add("slot");
        div.id = id;
        div.dataset.rw = `${row}-${col}`;
        div.onclick = () => {
            this.dropPokemon(this.currentTable, row, col);
        }


        if (drag) div.appendChild(drag);

        const td = document.createElement("td");
        td.appendChild(div);

        return td;
    }

    /**
     * Creates a new table 
     * @param {*} name 
     */
    createTable(name) {
        let arr = Array(this.tableHeight);
        for (let index = 0; index < arr.length; index++) {
            arr[index] = new Array(this.tableWidth).fill(null);
        }

        const fname = name ? name : "Table" + String(this.tables.length);

        this.tables[fname] = arr;
        return true;
    }

    /**
     * Adds pokemon into a table if exists some free space
     * @param {*} tableName 
     * @param {*} pokemon 
     * @returns 
     */
    async addPokemon(tableName, pokemon) {
        if (!this.tables[tableName]) {
            console.error(`Table "${tableName}" not found.`);
            return;
        }

        const table = this.tables[tableName];

        for (let i = 0; i < table.length; i++) {
            for (let j = 0; j < table[i].length; j++) {
                if (!table[i][j]) {
                    pokemon.setColRow(j, i);
                    pokemon.setTable(tableName);
                    table[i][j] = pokemon;
                    this.resfreshTable$.emit();
                    return;
                }
            }

        }
        console.warn(`Not enough space "${table}".`);
    }


    /**
     * Replaces a specific pokemon in the table and sends a signal to refresh the html
     * @param {*} table 
     * @param {*} col 
     * @param {*} row 
     * @param {*} pokemon 
     */
    replace(table, col, row, pokemon) {
        pokemon.setTable(table);
        pokemon.setColRow(col, row);
        this.tables[table][row][col] = pokemon;
        this.resfreshTable$.emit();
    }

    takePokemon(table, row, col) {
        if (this.canMove) return;

        const swap = this.tables[table][row][col];

        if (swap instanceof Egg) {
            swap.setFreeze(true);
        }

        if (!swap) {
            console.warn(`the pokemon that you're trying to move is null`);
            return;
        }

        console.info(`Taken pokemon ${swap}`);

        swap.playCrie();


        this.tables[table][row][col] = null;
        this.takenPokemon = swap;

        this.refreshTable();
        this.savePokemons();

        setTimeout(() => {
            this.canMove = true;
        }, 100);

    }

    dropPokemon(table, row, col) {
        if (!this.canMove) return;

        const swap = this.tables[table][row][col];

        if (swap) {
            console.info("Swiching pokemons...");
            this.takePokemon(table, row, col);
            swap.setColRow(col, row);
            this.tables[table][row][col] = swap;
            return;
        }

        if (!this.takenPokemon) {
            console.info("You need to take a pokemon!");
            return;
        }

        console.info("Droped pokemon");
        this.takenPokemon.setColRow(col, row);
        this.takenPokemon.setTable(this.currentTable);
        this.tables[table][row][col] = this.takenPokemon;

        if (this.takenPokemon instanceof Egg) {
            this.takenPokemon.setFreeze(false);
        }

        this.takenPokemon = null;

        this.refreshTable();
        this.savePokemons();

        setTimeout(() => {
            this.canMove = false;
        }, 100);

    }

    clearMemory() {
        sessionStorage.setItem("tables", null);
    }

    savePokemons() {
        const tables_to_save = {};

        for (const name of Object.keys(this.tables)) {
            tables_to_save[name] = this.tables[name].map(row =>
                row.map(pokemon => (pokemon ? pokemon.genJSON() : null))
            );
        }

        console.table(tables_to_save);
        localStorage.setItem("pokemons", JSON.stringify(tables_to_save));

    }

    loadPokemons() {
        const tables = localStorage.getItem("pokemons");

        if (!tables) {
            console.error("Can't load tables");
            return;
        }

        try {
            const parsedTables = JSON.parse(tables);

            for (const [table, pokemons] of Object.entries(parsedTables)) {
                console.log("Loading table: " + table);

                this.tables[table] = pokemons.map(row =>
                    row.map(pokemonData => {
                        if (!pokemonData) return null;

                        const parsedData = JSON.parse(pokemonData);
                        return parsedData.name === "egg"
                            ? Egg.fromJSON(this, parsedData)
                            : Pokemon.fromJSON(this, parsedData);
                    })
                );
            }

            console.info("Tables loaded successfully!");

        } catch (error) {
            console.error("Error parsing tables from sessionStorage:", error);
        }
    }

    saveState() {
        console.info("Saving newEggSecondsLeft:", this.newEggSecondsLeft);
        localStorage.setItem("newEggSecondsLeft", this.newEggSecondsLeft);
    }

    loadState() {
        const savedTime = localStorage.getItem("newEggSecondsLeft");

        if (savedTime !== null) {
            const parsedTime = parseInt(savedTime, 10);
            if (!isNaN(parsedTime)) {
                this.newEggSecondsLeft = parsedTime;
                console.info("Loaded state:");
                console.info("Time left: ", this.newEggSecondsLeft);
            } else {
                console.warn("Invalid saved time value, resetting to 0.");
                this.newEggSecondsLeft = 0;
            }
        } else {
            this.newEggSecondsLeft = 0;
        }
    }



    deleteTable(tablename) {
        if (this.tables.hasOwnProperty(tablename)) {
            delete this.tables[tablename];
            return true;
        }
        console.warn(`Table ${tablename} doens't exists.`);
        return false;

    }

    moveToTable(name) {
        if (this.tables.hasOwnProperty(name)) {
            this.currentTable = name;
            this.refreshTable();
        }
    }

    askDeleteTable() {
        const name = prompt("Insert table name to delete, or press Enter to cancel", "not default").trim();

        if (!name || name === "default") return;

        if (!this.deleteTable(name)) {
            window.alert(`Table "${name}" doesn't exist.`);
        }
        this.updateTablesAvailable();
        this.currentTable = "default";
        this.refreshTable();
    }

    askCreateTable() {
        const name = prompt("Insert new table name, or press Enter to cancel").trim();

        if (!name) return;

        if (this.tables.hasOwnProperty(name)) {
            window.alert(`Cannot create table "${name}" because it already exists.`);
            return;
        }

        this.createTable(name);
        this.moveToTable(name);
        this.updateTablesAvailable();
    }

    nextTable() {
        const keys = Object.keys(this.tables);
        const index = keys.findIndex(n => n === this.currentTable);

        if (index === -1 || index + 1 >= keys.length) return;

        this.currentTable = keys[index + 1];
        this.updateTablesAvailable();
        this.refreshTable();
    }

    prevTable() {
        const keys = Object.keys(this.tables);
        const index = keys.findIndex(n => n === this.currentTable);

        if (index <= 0) return;

        this.currentTable = keys[index - 1];
        this.updateTablesAvailable();
        this.refreshTable();
    }

    async play(path) {
        try {
            const resp = await fetch(path);
            const blob = await resp.blob();
            const objURL = URL.createObjectURL(blob);
            const audio = new Audio(objURL);
            audio.play();
        } catch (error) {
            console.error("Error: ", error);
        }

    }

    addNewEgg() {
        this.addEggButton.disabled = true;
        this.addPokemon(this.currentTable, new Egg(this));

        this.setRandomNewEggInterval();
    }

    setRandomNewEggInterval(remaining_time = null) {
        const randomDelay = Math.floor(Math.random() * (this.newEggMaxSecondsDelay - this.newEggMinSecondsDelay + 1)) + this.newEggMinSecondsDelay;

        this.newEggSecondsLeft = remaining_time ? remaining_time : randomDelay;

        this.updateTimeRemaining();

        this.intervalId = setInterval(() => {
            if (this.newEggSecondsLeft > 0) {
                this.newEggSecondsLeft--;

                this.updateTimeRemaining();
            } else {
                this.addEggButton.disabled = false;

                clearInterval(this.intervalId);
            }

        }, 1000);
    }

    updateTimeRemaining() {
        if (this.timeRemainingElement) {
            this.timeRemainingElement.textContent = `${this.newEggSecondsLeft}s`;
        }
    }

}