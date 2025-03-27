import Deck from "./src/Deck.js";
import Egg from "./src/Egg.js";
import PC from "./src/PC.js";
import Pokemon from "./src/Pokemon.js";

await Deck.getColor("pikachu");
await Deck.init();
await Deck.init();
const pc = new PC(document.getElementById("poketablebody"), document.getElementById("pokemoncard"));

console.log(await Deck.getPokemon("pikachu"));



// await pc.addPokemon("default", await Pokemon.get(deck, pc, "pikachu"));

for (let index = 0; index < 2; index++) {
    await pc.addPokemon("default", new Egg(pc));
}

/*
const slotSelector = document.querySelector('.slot-selector');
const table = document.querySelector('#poketablebody');

table.addEventListener('mousemove', (e) => {
    const rect = table.getBoundingClientRect();
    let offsetX = e.clientX - rect.left;
    let offsetY = e.clientY - rect.top;

    offsetX = Math.floor(offsetX / 200) * 200;
    offsetY = Math.floor(offsetY / 200) * 200;


    slotSelector.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
});

*/
