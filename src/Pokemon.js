import Deck from "./Deck.js";

export default class Pokemon {
    constructor(
        pc = null,
        name = "missigno",
        id = -1,
        tinySpriteSrc = null,
        defaultSpriteSrc = null,
        level = 0,
        row,
        col,
        table,
        abilities = { none: ":)" },
        moves = { none: ":)" }
    ) {
        this.pc = pc;
        this.id = id;
        this.name = name;
        this.tinySpriteSrc = tinySpriteSrc;
        this.defaultSpriteSrc = defaultSpriteSrc;        
        this.level = level;
        this.row = row;
        this.col = col;
        this.table = table;
        this.abilities = abilities;
        this.moves = moves;
        this.color = "black";
        this.isShiny = false;
        this.gifSrc = null;
        this.shinySrc = null;
    
        if (this.name.toLowerCase() === "egg") return;
            
        this.loadPokemonData();
    }
    
    async loadPokemonData() {
        try {
            const [sprites, spritesTiny, shiny, color, gif] = await Promise.all([
                Deck.getSprites(this.name, false),
                Deck.getSprites(this.name, true),
                Deck.getShiny(this.name),
                Deck.getColor(this.name),
                Deck.getGif(this.name, "front_default")
            ]);            
    
            this.tinySpriteSrc = this.tinySpriteSrc || spritesTiny.front_default || "";
            this.defaultSpriteSrc = this.defaultSpriteSrc || sprites.front_default;
            this.shinySrc = shiny || null;
            this.color = color || "black";
            this.gifSrc = gif || null;
        } catch (error) {
            console.error(`Error loading data for ${this.name}:`, error);
        }
    }

    static async get(pc, name) {
        try {
            const [spriteDefault, spriteData] = await Promise.all([Deck.getSprites(name, false), Deck.getSprites(name, true)]);
            const urlSprite = spriteData?.front_default || "";
            const urlDef = spriteDefault?.front_default;            
            
            return new Pokemon(pc, name, 0, urlSprite, urlDef, 0, 0, 0, "default");
        } catch (error) {
            console.error(`Error fetching Pokémon ${name}:`, error);
            return null;
        }
    }
    
    static async random(pc) {
        try {
            const index = Math.floor(Math.random() * Deck.pokemons.length);
            const pname = Deck.pokemons[index]?.name;
            
    
            if (!pname) throw new Error(`Invalid Pokémon name: ${pname}`);

            const [spriteDef, spriteTiny, abilities] = await Promise.all([
                Deck.getSprites(pname, false),
                Deck.getSprites(pname, true),
                Deck.getAbilities(pname)
            ]);
    
            const urlSprite = spriteTiny?.front_default || "";
            const urlSpriteDef = spriteDef?.front_default || "";
    
            return new Pokemon(pc, pname, 0, urlSprite, urlSpriteDef, 0, 0, 0, "default", abilities);
        } catch (error) {
            console.error("Error fetching random Pokémon:", error);
            return null;
        }
    }
    

    static async getFullRandom(pc) {
        const pk = await Pokemon.random(pc);
        pk.randomizeStats();
        return pk;
    }


    noSprites() {
        return !this.defaultSpriteSrc?.trim()?.length || !this.tinySpriteSrc?.trim()?.length;
    }
    
    setTable(table) {
        this.table = table;
        return this;
    }

    setColRow(col, row) {
        this.row = row;
        this.col = col;
        return this;
    }

    async getCardBodyElement() {
        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body");
        cardBody.style.setProperty("background-color", this.color, "important");

        const title = document.createElement("h5");
        title.classList.add("card-title");
        title.style.textAlign = "center";
        title.textContent = this.name;

        const img = document.createElement("img");
        img.src = this.isShiny ? this.shinySrc : this.defaultSpriteSrc;
        img.classList.add("poke-photo", "pixelated", "d-block", "mx-auto", "img-fluid");
        img.alt = this.name;

        const genderText = document.createElement("p");
        genderText.classList.add("card-text");
        genderText.textContent = `IsShiny: ${this.isShiny}`;

        const levelText = document.createElement("p");
        levelText.classList.add("card-text");
        levelText.textContent = `Level: ${this.level}`;

        const abilitiesText = document.createElement("p");
        abilitiesText.classList.add("card-text");
        abilitiesText.textContent = "Abilities";

        const abilitiesContainer = document.createElement("div");
        abilitiesContainer.classList.add("accordion", "accordion-flush");
        abilitiesContainer.id = "accordionFlushAbilities";

        let index = 1;

        for (const [ability, description] of Object.entries(this.abilities )) {
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

        const movesText = document.createElement("p");
        movesText.classList.add("card-text");
        movesText.textContent = "Moves";

        const movesContainer = document.createElement("div");
        movesContainer.classList.add("accordion", "accordion-flush");
        movesContainer.id = "accordionFlushMoves";

        let index2 = 1;

        for (const [move, description] of Object.entries(this.moves)) {
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

        const button = document.createElement("button");
        button.classList.add("btn", "btn-primary");
        button.type = "button";
        button.setAttribute("data-bs-toggle", "offcanvas");
        button.setAttribute("data-bs-target", "#offcanvasExample");
        button.setAttribute("aria-controls", "offcanvasExample");
        button.textContent = "About us";

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

    getImgDraggable(dragId) {
        const div = document.createElement("div");
        div.classList.add("tiny-pokemon-container");
        const img = document.createElement("img");
        img.classList.add("tiny-pokemon");
        
        img.src = this.tinySpriteSrc;
        // img.ondragstart="drag(event)";
        // img.draggable = true;
        div.id = dragId;
        div.dataset.rw = `${this.row}-${this.col}`;
        div.onclick = () => {
            this.pc.onSelectPokemon$.emit(this.row, this.col);
            this.pc.takePokemon(this.pc.currentTable, this.row, this.col);
        }
        div.appendChild(img);
        return div;
    }

    async playCrie() {
        try {
            const url = await Deck.getSoundUrl(this.name);
            const resp = await fetch(url);
            const blob = await resp.blob();
            const objURL = URL.createObjectURL(blob);
            const audio = new Audio(objURL);
            audio.volume = 0.2;
            audio.play();
        } catch (error) {
            console.error("Error: ", error);
        }
    }

    getImg() {
        const img = document.createElement("img");
        img.classList.add("tiny-pokemon")
        img.src = this.tinySpriteSrc;
        return img;
    }

    async randomizeStats() {
        this.level = Math.floor(Math.random() * 100) + 1;
        this.abilities = Deck.getAbilities(this.name);
        this.stats = Deck.getStats(this.name);
    
        const allMoves = await Deck.getMoves(this.name);
        const maxMoves = 4;
        
        this.moves = Object.keys(allMoves)
            .slice(0, maxMoves)
            .reduce((movesDict, move) => {
                movesDict[move] = allMoves[move];
                return movesDict;
            }, {});
    
        this.isShiny = Math.random() * 512 < 1;
        return this;
    }
    

    genDragHtml(img_src = "", drag_id = null, row = 0, col = 0) {
        return `
        <img src='${img_src}' id='${drag_id}' data-rw='${row}-${col}' class='draggable' draggable='true' 
        ondragstart='drag(event)'`;
    }

    genJSON() {
        return JSON.stringify({
            name: this.name,
            id: this.id,
            level: this.level,
            col: this.col,
            row: this.row,
            table: this.table,
            tinySpriteSrc: this.tinySpriteSrc,
            defaultSpriteSrc: this.defaultSpriteSrc,
            abilities: this.abilities,
            moves: this.moves
        });
    }

    static fromJSON(pc, json = {}) {
        
        return new Pokemon(pc, json.name, json.id, json.tinySpriteSrc, json.defaultSpriteSrc, json.level, json.row, json.col, json.table, json.abilities, json.moves);
    }

    getGifElement() {
        const img = this.getImg();
        img.src = this.gifSrc
        return img;
    }


}
