import { API_ALL_PK, API_URL } from "./Constants.js";
import Signal from "./../Signal.js";

export default class Deck {
    static pokemons = [];
    static colors = {
        "yellow": "#f8e454",
        "black": "#000000",
        "blue": "#1d3557",
        "green": "#2a9d8f",
        "red": "#d62828",
        "white": "#ffffff",
        "brown": "#8b5a2b",
        "purple": "#6a0dad",
        "pink": "#ffafcc",
        "gray": "#a8a8a8",
    };

    static async init() {
        const pkapi = await Deck.callPokeApi();
        Deck.pokemons = pkapi ? pkapi["results"] : [];
    }

    static async getColor(pokemon) {
        const speciesData = await Deck.getSpecies(pokemon);
        const colorName = speciesData ? speciesData["color"]["name"] : "black";
        return Deck.colors[colorName] || Deck.colors["black"];
    }

    static async callPokeApi() {
        try {
            const response = await fetch(`${API_ALL_PK}`);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error("Error:", error);
            return null;
        }
    }

    static getPokemonList() {
        return Deck.pokemons;
    }

    static async getTypes(pokemon) {
        const data = await Deck.getPokemon(pokemon);
        const types = data["types"];
        const r = types.map(type => type["type"]["name"]);
        return r;
    }


    static async getPokemon(pokemon) {
        try {
            const response = await fetch(`${API_URL}/${pokemon}`);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error("Error on get pokemon:", pokemon, "\nError:", error);
            return await Deck.getPokemon("pikachu");
        }
    }

    static getRandomPokemonName() {
        return Deck.pokemons[Math.floor(Math.random() * Deck.pokemons.length)]["name"];
    }

    static async getMoves(pokemon) {
        const data = await Deck.getPokemon(pokemon);
        return data["moves"].reduce((allMoves, move) => {
            allMoves[move["move"]["name"]] = move["move"]["url"];
            return allMoves;
        }, {});
    }

    static async getAbilities(pokemon) {
        const skills = await Deck.getPokemon(pokemon);
        return skills["abilities"].reduce((all, abil) => {
            all[abil["ability"]["name"]] = abil["ability"]["url"];
            return all;
        }, {});
    }

    static async getSpecies(pokemon) {
        try {
            const pokemonData = await Deck.getPokemon(pokemon);
            const response = await fetch(pokemonData.species.url);
            return await response.json();
        } catch (error) {
            console.error("Error on get the specie:", error);
            return null;
        }
    }

    static async getSprites(pokemon, small = false) {
        const data = await Deck.getPokemon(pokemon);
        return small ? data["sprites"]["versions"]["generation-viii"]["icons"] : data["sprites"];
    }

    static async getShiny(pokemon, view = "front") {
        const data = await Deck.getPokemon(pokemon);
        return data["sprites"][`${view}_shiny`];
    }

    static async getGif(pokemon, type = "front_default") {
        const data = await Deck.getPokemon(pokemon);
        return data["sprites"]["versions"]["generation-v"]["black-white"]["animated"][type];
    }

    static async getSoundUrl(pokemon) {
        const data = await Deck.getPokemon(pokemon);
        return data["cries"]["latest"];
    }

    static async getStats(pokemon) {
        const data = await Deck.getPokemon(pokemon);
        return data["stats"].map(stat => ({
            name: stat["stat"]["name"],
            url: stat["stat"]["url"],
            base: stat["base_stat"],
            effort: stat["effort"],
        }));
    }

    static async playSound(pokemon) {
        try {
            const url = await Deck.getSoundUrl(pokemon);
            const resp = await fetch(url);
            const blob = await resp.blob();
            const objURL = URL.createObjectURL(blob);
            const audio = new Audio(objURL);
            audio.play();
        } catch (error) {
            console.error("Error: ", error);
        }
    }

    static async getForms(pokemon) {
        const skills = await Deck.getPokemon(pokemon);
        return skills["forms"];
    }

    static async getMovesNames(pokemon) {
        const skills = await Deck.getMoves(pokemon);
        return Object.keys(skills);
    }

    static async genDragPokemon(pokemon) {
        const sprite = await Deck.getSprites(pokemon, true);
        return Deck.genDrag(sprite["front_default"], Deck.dragID++);
    }

    static async addRandomPokemon(tableName) {
        if (!Deck.tables[tableName]) {
            console.error(`Table "${tableName}" not found.`);
            return;
        }
        const table = Deck.tables[tableName];
        for (let i = 0; i < table.length; i++) {
            for (let j = 0; j < table[i].length; j++) {
                if (!table[i][j]) {
                    const pk = await Deck.getRandomPokemon();
                    table[i][j] = { ...pk, row: i, col: j };
                    return;
                }
            }
        }
        console.warn(`Not enough space in "${tableName}".`);
    }

    static genSlot(id = "slot1", drag = "") {
        return `<td><div class='slot' id="${id}" ondrop='drop(event)' ondragover='allowDrop(event)'>${drag}</div></td>`;
    }
}
