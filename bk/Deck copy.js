import { API_ALL_PK, API_URL } from "./Constants.js";
import Signal from './../Signal.js';

export default class Deck {

    constructor() {
        this.pokemons = [];
        this.dragID = 0;
        this.tables = {};
        this.selectedPokemonPositionSignal = new Signal()
        this.selectedPokemonPositionSignal.connect((row, col)=>{
            console.log("TEST: ", row, col);
            
        })
    }

    async init() {
        const pkapi = await Deck.callPokeApi();
        this.pokemons = pkapi["results"];

    }

    static async callPokeApi() {
        try {
            const response = await fetch(`${API_ALL_PK}`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error:", error);
            return null;
        }
    }

    getPokemonList() {
        return this.pokemons;
    }

    getPokemonObject(table, row, col) {
        return this.tables[table][row][col];
    }

    async getPokemon(pokemon) {
        const skills = await fetch(`${API_URL}/${pokemon}`);
        const data = await skills.json();
        return data;
    }

    async getMoves(pokemon) {
        const data = await this.getPokemon(pokemon);
        const allMoves = {};
        const moves = data["moves"];
        for (let index = 0; index < moves.length; index++) {
            allMoves[moves[index]["move"]["name"]] = moves[index]["move"]["url"];
        }
        return allMoves;
    }
    

    async getAbilities(pokemon) {
        const skills = await this.getPokemon(pokemon);
        const all = {};
        const abil = skills["abilities"];
        for (let index = 0; index < abil.length; index++) {
            all[abil[index]["ability"]["name"]]=abil[index]["ability"]["url"];
        }
        return all;
    }

    async getSpecies(pokemon) {
        const data = await this.getPokemon(pokemon);
        return data["species"];
    }

    async getSprites(pokemon, small = false) {
        const data = await this.getPokemon(pokemon);
        if (small) {
            return data["sprites"]["versions"]["generation-viii"]["icons"];

        } else {
            return data["sprites"];
        }
    }

    async getSoundUrl(pokemon) {
        const data = await this.getPokemon(pokemon);
        return data["cries"]["latest"];
    }

    async getStats(pokemon) {
        const data = await this.getPokemon(pokemon);
        const stats = data["stats"];
        const stuff = [];

        for (const obj of stats) {
            stuff.push(
                {
                    name: obj["stat"]["name"],
                    url: obj["stat"]["url"],
                    base: obj["base_stat"],
                    effort: obj["effort"],
                }
            )
        }

        return stuff;
    }

    async playSound(pokemon) {
        try {
            const url = await this.getSoundUrl(pokemon);
            const resp = await fetch(url);
            const blob = await resp.blob();
            const objURL = URL.createObjectURL(blob);
            const audio = new Audio(objURL);
            audio.play();
        } catch (error) {
            console.error("Error: ", error);
        }
    }

    async getForms(pokemon) {
        const skills = await this.getPokemon(pokemon);
        return skills["forms"];
    }

    async getMovesNames(pokemon) {
        const skills = await this.getMoves(pokemon);
        return skills.map((m) => m["move"]["name"]);
    }

    async genDragPokeom(pokemon) {
        return this.genDrag(await this.getSprites(pokemon, true)["front_default"], this.dragID++);
    }

    createTable(name) {
        let arr = Array(12);
        for (let index = 0; index < arr.length; index++) {
            arr[index] = new Array(12).fill(null);

        }

        const fname = name ? name : "Table" + String(this.tables.length);

        this.tables[fname] = arr;
    }
    
    async addPokemon(tableName, pokemon) {
        if (!this.tables[tableName]) {
            console.error(`Table "${tableName}" not found.`);
            return;
        }

        const urlSprite = (await this.getSprites(pokemon, true))["front_default"];
        const urlSpriteDefault = (await this.getSprites(pokemon))["front_default"];

        const table = this.tables[tableName];

        for (let i = 0; i < table.length; i++) {
            for (let j = 0; j < table[i].length; j++) {
                if (!table[i][j]) {
                    table[i][j] = { name: pokemon, url: urlSprite, default_url: urlSpriteDefault, row: i, col: j};
                    return;
                }
            }
            
        }
        
        console.warn(`Not enough space "${table}".`);
    }

    async addRandomPokemon(tableName) {
        if (!this.tables[tableName]) {
            console.error(`Table "${tableName}" not found.`);
            return;
        }

        const table = this.tables[tableName];

        for (let i = 0; i < table.length; i++) {
            for (let j = 0; j < table[i].length; j++) {
                if (!table[i][j]) {
                    const pk = await this.genRandomPokemon();

                    table[i][j] = { name: pk["name"], url: pk["url"], urlSprite: pk["url"], moves: pk["moves"],  abilities: pk["abilities"],  default_url: pk["default_url"], row: i, col: j};
                    return;
                }
            }
            
        }
        
        console.warn(`Not enough space "${table}".`);
    }

    async genRandomPokemon() {
        const pname = this.pokemons[Math.floor(Math.random() * this.pokemons.length)]["name"];
        
        const urlSprite = (await this.getSprites(pname, true))["front_default"];
        const urlSpriteDefault = (await this.getSprites(pname))["front_default"];
        
        const abilities = await this.getAbilities(pname);
        
        const maxMoves = 6;
        const allMoves = await this.getMoves(pname);
        const moves = Object.keys(allMoves).slice(0, maxMoves);
    
        const movesDict = {};
        moves.forEach((move) => {
            movesDict[move] = allMoves[move];  
        });
    
        return {
            name: pname,
            url: urlSprite,
            default_url: urlSpriteDefault,
            abilities,
            moves: movesDict 
        };
    }
    

    genTableHTML(tableName) {
        if (!Object.hasOwn(this.tables, tableName)) {
            console.error(`Table "${tableName}" not found.`);
            return "<p>Table not found</p>";
        }

        let id = 0;
        let dragId = 0;
        let tableHTML = "";

        for (const row of this.tables[tableName]) {
            tableHTML += "<tr>";

            for (const pokemon of row) {
                if (!pokemon) {
                    tableHTML += this.genSlot(id++);
                } else {
                    const src = pokemon["url"];
                    tableHTML += this.genSlot(id++, this.genDrag(src, dragId++, pokemon["row"], pokemon["col"]));
                }
            }

            tableHTML += "</tr>";
        }

        return tableHTML;
    }

    createTableBody(tableName) {
        if (!Object.hasOwn(this.tables, tableName)) {
            console.error(`Table "${tableName}" not found.`);
            return "<p>Table not found</p>";
        }
    
        let id = 0;
        let dragId = 0;
        let tableElement = document.createElement("tbody");
    
        for (const row of this.tables[tableName]) {
            let tr = document.createElement("tr");
    
            for (const pokemon of row) {
                let img = null;
                if (pokemon) {
                    const src = pokemon["url"];
                    img = this.createDrag(src, dragId++, pokemon["row"], pokemon["col"]);
                }
                tr.appendChild(this.createSlot(`slot-${id++}`, img));
            }
    
            tableElement.appendChild(tr);
        }
    
        return tableElement;
    }
    

    createSlot(id = "slot1", drag = null) {
        const div = document.createElement("div");
        div.classList.add("slot");
        div.id = id;
        div.ondrop = (event) => drop(event);
        div.ondragover = (event) => allowDrop(event);
    
        if (drag) div.appendChild(drag);
    
        const td = document.createElement("td");
        td.appendChild(div);
        
        return td;
    }
    

    saveData() {

    }

    genSlot(id = "slot1", drag = "") {
        return `
    <td>
        <div class='slot' id="${id}" ondrop='drop(event)' ondragover='allowDrop(event)'>
            ${drag}
        </div>
    </td>`;
    }

    genDrag(img_src = "", drag_id = null, row = 0, col = 0) {
        return `
            <img src='${img_src}' id='${drag_id}' data-rw='${row}-${col}' class='draggable' draggable='true' 
            ondragstart='drag(event)'`;
    }

    createDrag(img_src = "", drag_id = null, row = 0, col = 0) {
        const img = document.createElement("img");
        img.classList.add("draggable")
        img.src = img_src;
        img.draggable = true;
        img.id = drag_id;
        img.dataset.rw = `${row}-${col}`;
        img.onclick = () => {this.selectedPokemonPositionSignal.emit(row, col)}
        return img;
    }

    async createPokemonCardBody(name, imgSrc, gender, level, abilities, moves) {
        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body");
    
        const title = document.createElement("h5");
        title.classList.add("card-title");
        title.style.textAlign = "center";
        title.textContent = name;
    
        const img = document.createElement("img");
        img.src = imgSrc;
        img.classList.add("poke-photo", "pixelated", "d-block", "mx-auto", "img-fluid");
        img.alt = name;
    
        const genderText = document.createElement("p");
        genderText.classList.add("card-text");
        genderText.textContent = gender;
    
        const levelText = document.createElement("p");
        levelText.classList.add("card-text");
        levelText.textContent = `Level: ${level}`;
    
        const abilitiesText = document.createElement("p");
        abilitiesText.classList.add("card-text");
        abilitiesText.textContent = "Abilities";
    
        // Contenedor para las habilidades
        const abilitiesContainer = document.createElement("div");
        abilitiesContainer.classList.add("accordion", "accordion-flush");
        abilitiesContainer.id = "accordionFlushAbilities";
    
        // Obtener las habilidades
        const abil = await this.getAbilities(name);
        let index = 1;
    
        for (const [ability, description] of Object.entries(abilities ? abilities : abil)) {
            const accordionItem = document.createElement("div");
            accordionItem.classList.add("accordion-item");
    
            const header = document.createElement("h2");
            header.classList.add("accordion-header");
    
            const button = document.createElement("button");
            button.classList.add("accordion-button", "collapsed");
            button.type = "button";
            button.setAttribute("data-bs-toggle", "collapse");
            button.setAttribute("data-bs-target", `#flush-collapseAbility${index}`);
            button.setAttribute("aria-expanded", "false");
            button.setAttribute("aria-controls", `flush-collapseAbility${index}`);
            button.textContent = ability;
    
            header.appendChild(button);
            accordionItem.appendChild(header);
    
            const collapseDiv = document.createElement("div");
            collapseDiv.id = `flush-collapseAbility${index}`;
            collapseDiv.classList.add("accordion-collapse", "collapse");
            collapseDiv.setAttribute("data-bs-parent", "#accordionFlushAbilities");
    
            const body = document.createElement("div");
            body.classList.add("accordion-body");
            body.textContent = description;
    
            collapseDiv.appendChild(body);
            accordionItem.appendChild(collapseDiv);
            abilitiesContainer.appendChild(accordionItem);
    
            index++;
        }
    
        // Contenedor para los movimientos
        const movesText = document.createElement("p");
        movesText.classList.add("card-text");
        movesText.textContent = "Moves";
    
        const movesContainer = document.createElement("div");
        movesContainer.classList.add("accordion", "accordion-flush");
        movesContainer.id = "accordionFlushMoves";
    
        // Obtener los movimientos
        const _moves = await this.getMoves(name);
        let index2 = 1;
    
        for (const [move, description] of Object.entries(moves ? moves : _moves)) {
            const accordionItem = document.createElement("div");
            accordionItem.classList.add("accordion-item");
    
            const header = document.createElement("h2");
            header.classList.add("accordion-header");
    
            const button = document.createElement("button");
            button.classList.add("accordion-button", "collapsed");
            button.type = "button";
            button.setAttribute("data-bs-toggle", "collapse");
            button.setAttribute("data-bs-target", `#flush-collapseMove${index2}`);
            button.setAttribute("aria-expanded", "false");
            button.setAttribute("aria-controls", `flush-collapseMove${index2}`);
            button.textContent = move;
    
            header.appendChild(button);
            accordionItem.appendChild(header);
    
            const collapseDiv = document.createElement("div");
            collapseDiv.id = `flush-collapseMove${index2}`;
            collapseDiv.classList.add("accordion-collapse", "collapse");
            collapseDiv.setAttribute("data-bs-parent", "#accordionFlushMoves");
    
            const body = document.createElement("div");
            body.classList.add("accordion-body");
            body.textContent = description;
    
            collapseDiv.appendChild(body);
            accordionItem.appendChild(collapseDiv);
            movesContainer.appendChild(accordionItem);
    
            index2++;
        }
    
        // Crear botón para "About us"
        const button = document.createElement("button");
        button.classList.add("btn", "btn-primary");
        button.type = "button";
        button.setAttribute("data-bs-toggle", "offcanvas");
        button.setAttribute("data-bs-target", "#offcanvasExample");
        button.setAttribute("aria-controls", "offcanvasExample");
        button.textContent = "About us";
    
        // Añadir todos los elementos al cardBody
        cardBody.appendChild(title);
        cardBody.appendChild(img);
        cardBody.appendChild(genderText);
        cardBody.appendChild(levelText);
        cardBody.appendChild(abilitiesText);
        cardBody.appendChild(abilitiesContainer);
        cardBody.appendChild(movesText);
        cardBody.appendChild(movesContainer);
        cardBody.appendChild(button);
    
        return cardBody;
    }
    
    

}