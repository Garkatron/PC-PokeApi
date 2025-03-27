
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