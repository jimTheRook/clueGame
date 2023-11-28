"use strict";

import Player, { GameApp, Deck } from "./classes.js";

// Variables
//first we get the setupData from the server
const response = await fetch("/getGameData");
const gameData = await response.json(); // { players: [{cards: Array(2), hasNotCards: Array(0), name: 'Jim', turnNumber: 1} {cards: Array(0), hasNotCards: Array(0), name: 'Sarah', turnNumber: 2}]}
console.log("GameData: ", gameData);

const playersAsObjs = gameData.players; //[{cards: Array(2), hasNotCards: Array(0), name: 'Jim', turnNumber: 1} {cards: Array(0), hasNotCards: Array(0), name: 'Sarah', turnNumber: 2}]

//We have recieved objects with all the Player Class fields but not the Player Class methods (the prototype is Object not Player). Since we are going to use these methods, we would want to either: 1. Change the prototype (using .setProtoTypeOf()) or 2. build new Player objects and setting the fields to the fields of the Objects from the response.

//Option 1 is possible and seems to work, however MDN gives a very large warning about doing this. So I have opted to go with route 2.

// New array to hold the newly created Player objects
const players = [];

// UI Variables
let currentPlayer; //player whose turn it is
let currentQueriedCards = []; //this will hold the active query cards
const btnMakeQuery = $(".btn-make-query");
const btnRecordQuery = $("#btn-recordQuery");
const btnPrevPlayer = $("#btn-previous-player");
const btnNextPlayer = $("#btn-next-player");
const btnRecordClues = $("#btn-recordClues");

// Modals
const opponentQueryModal = new bootstrap.Modal($("#opponent-modal"), {
  keyboard: false,
});
const mainPlayerQueryModal = new bootstrap.Modal($("#main-player-modal"), {
  keyboard: false,
});
const alertAccussationIncomplete = new bootstrap.Modal(
  $("#alert-accusation-incomplete"),
  { keyboard: false }
);

// Forms
const mainPlayerTurnForm = $("#main-player-info-recieved");
const queryForm = $("#who-gave-cards-form");

///////////////////////// FUNCTIONS ////////////////////////////////////

function createPlayers(playersAsObjs) {
  playersAsObjs.forEach((p, index, arr) => {
    //create a new player
    const player = new Player(p.name, p.turnNumber);
    player.cardsHas = p.cardsHas;

    player.cardsHasNot = p.cardsHasNot;
    players.push(player);
  });

  //set up the current player on UI
  currentPlayer = players[0];
  displayCurrentPlayer();
}

function displayCurrentPlayer() {
  $("#current-player").text(currentPlayer.name);
}

//function to exhonorated an item from the list
function exhonorate(cardName, playerName) {
  const playerNum = gameApp.getPlayerByName(playerName).turnNumber;

  $(`#${cardName}`).addClass("table-secondary");
  $(`#${cardName} td`).addClass("eliminated");
  $(`#${cardName} th`).addClass("eliminated");

  //mark the correct player's cell with a check and everyone else with an X
  for (let i = 1; i <= players.length; i++) {
    if (i !== playerNum) {
      $(`#${cardName} .P${i}`).text("X");
    } else {
      $(`#${cardName} .P${i}`).text("\u2713");
      $(`#${cardName} .P${i}`).addClass("table-success");
    }
  }
  //we want to remove the eliminated class from the radio buttons (so the don't get small)
  $(`.td-accused`).removeClass("eliminated");
}

function processPlayerHand(player) {
  for (let i = 0; i < player.cardsHas.length; i++) {
    const cardName = player.cardsHas[i];
    exhonorate(cardName, player.name);
  }
  renderUI();
}

function renderUI() {
  // get the deckMap from the gameApp
  const deckMap = gameApp.deckMap;
  console.log(gameApp.deckMap);

  // go through each card (key) and loop through the players (value).
  // 1 ---> call exhonerate
  // 0 ---> mark wiht X
  // >0 ---> color cell red up to number percentage

  deckMap.forEach((playersArr, card, map) => {
    playersArr.forEach((num, playerName, map) => {
      if (num === 1) {
        exhonorate(card, playerName);
      } else if (num === 0) {
        doesNotHave(card, playerName);
      } else {
        displayProb(card, playerName, num);
      }
    });
  });

  // Mark any shared cards with just a check (unlike exhonerated which also has a green background)
  for (const card of gameData.sharedCards) {
    $(`#${card}`).addClass("table-secondary");
    $(`#${card} td`).addClass("eliminated");
    $(`#${card} th`).addClass("eliminated");

    players.forEach((player) => {
      $(`#${card} .P${player.turnNumber}`).text("\u2713");
    });
    //we want to remove the eliminated class from the radio buttons (so the don't get small)
    $(`.td-accused`).removeClass("eliminated");
  }

  //finally mark any solution rows as solved
  const solution = gameApp.solution;
  for (const [cat, item] of Object.entries(solution)) {
    if (item !== "") {
      //mark the row as solved
      $(`#${item}`).addClass("table-danger");
      $(`#${item} th`).removeClass("eliminated");

      //lastly change all other rows in the category to faded out grey
      const deck = new Deck().cards;

      const catCards = [...deck].filter((card) => card[1] === cat);
      catCards.forEach((card) => {
        $(`#${card[0]}`).addClass("table-secondary");
        $(`#${card[0]} td`).addClass("eliminated");
        $(`#${card[0]} .prob-bar`).css("opacity", `20%`);

        if (card[0] !== item) {
          $(`#${card[0]} th`).addClass("eliminated");
        }
      });
    }
  }
}

function doesNotHave(card, playerName) {
  const player = gameApp.getPlayerByName(playerName);

  $(`#${card} .P${player.turnNumber}`).text("X");
  $(`#${card} .P${player.turnNumber}`).addClass("doesNotHave");
  $(`#${card} .P${player.turnNumber}`).css("background", "");
  $(`#${card} .P${player.turnNumber}`).css("border", "");
}

function displayProb(card, playerName, prob) {
  const player = gameApp.getPlayerByName(playerName);

  const probPercent = Math.trunc(prob * 100);

  $(`#${card} .P${player.turnNumber} .prob-bar`).css(
    "height",
    `${probPercent}%`
  );
}

function nextTurn() {
  let index = players.indexOf(currentPlayer);
  if (index === players.length - 1) {
    index = 0;
  } else {
    index++;
  }
  currentPlayer = players[index];
  displayCurrentPlayer();
}

function previousTurn() {
  let index = players.indexOf(currentPlayer);
  if (index === 0) {
    index = players.length - 1;
  } else {
    index--;
  }
  currentPlayer = players[index];
  displayCurrentPlayer();
}

function resetMainPlayerForm() {
  $(".select-card").text("Which card was shown?");
  $(".select-card").removeClass("errorFont");
  mainPlayerTurnForm.trigger("reset");
  mainPlayerQueryModal.hide();
  resetRadios();
}

function addClueRequest() {
  const plWithInfo = $("#clue-input option:selected").text();
  const htmlStr = `
      <section id="clueSection">
      <p class="select-card" style="padding-top: 15px" >Which card was shown?</p>
      <div class="input-group mb-3">
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="radio" id="sus" name="card" value="${currentQueriedCards[0]}"/>
        <label class="form-check-label" for="sus">${currentQueriedCards[0]}</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="radio" id="weap" name="card" value="${currentQueriedCards[1]}"/>
        <label class="form-check-label" for="weap">${currentQueriedCards[1]}</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="radio" id="roo" name="card" value="${currentQueriedCards[2]}"/>
        <label class="form-check-label" for="roo">${currentQueriedCards[2]}</label>
      </div>
      </div>
      </section>
    `;

  if (plWithInfo !== "No One") {
    $("#clueSection").remove();
    //we want place html into form asking for which card was shown
    $(htmlStr).insertAfter("#clue-input");
  } else {
    //here we want to remove the html
    $("#clueSection").remove();
  }
}

function cyclePlayersQueries(answerer) {
  let cIndex = players.indexOf(currentPlayer);
  let startIndex = cIndex === players.length - 1 ? 0 : cIndex + 1;

  for (let i = startIndex; i < players.length; i++) {
    if (i === cIndex) {
      break;
    }

    if (players[i].name !== answerer) {
      //then this player did not have any information
      submitNewQuery(
        currentQueriedCards,
        players[i].name,
        currentPlayer.name,
        false
      );
    } else {
      // this player had information
      submitNewQuery(
        currentQueriedCards,
        players[i].name,
        currentPlayer.name,
        true
      );
      break;
    }

    if (i === players.length - 1) {
      i = -1;
    }
  }
}

function resetRadios() {
  //reset the radios
  $("input[name='suspect']").prop("checked", false);
  $("input[name='weapon']").prop("checked", false);
  $("input[name='room']").prop("checked", false);
}

function submitNewQuery(cardArray, answ, ask, cardWasGiven) {
  const query = {
    cards: cardArray,
    answerer: answ,
    asker: ask,
    returnedCard: cardWasGiven,
  };

  gameApp.submitQuery(query);
  renderUI();
}

////// EVENT HANDLERS ///////////////////////////////////////////
btnNextPlayer.on("click", nextTurn);

btnPrevPlayer.on("click", previousTurn);

btnRecordQuery.on("click", function (e) {
  // FORMAT cardData into a propery query form
  //    {
  //   cards: ["green", "lead-pipe", "hall"],
  //   answerer: "Sarah",
  //   asker: "John",
  //   returnedCard: true,
  // };

  // we will need to see whose turn it is and who answered and calculate from that who (if anyone) did not give any cards before the answerer was reached.

  const answerer = $("#answerer-input option:selected").text();

  cyclePlayersQueries(answerer);
  resetRadios();

  queryForm.trigger("reset");
  opponentQueryModal.hide();
  nextTurn();
});

btnRecordClues.on("click", function (e) {
  const plWithInfo = $("#clue-input option:selected").text();

  if (plWithInfo !== "No One") {
    //first check to make sure the user selected one of the radial buttons
    const cardShown = $(".form-check-input[name = 'card']:checked").val();

    if (!cardShown) {
      $(".select-card").text("You forget to select the card shown!");
      $(".select-card").addClass("errorFont");
      return;
    } else {
      // TODO we need to send queries for all players who did not have
      gameApp.playerHasCard(plWithInfo, cardShown);
      cyclePlayersQueries(plWithInfo);
      resetMainPlayerForm();
      renderUI();
    }
  } else {
    //no one had info.
    cyclePlayersQueries(plWithInfo); //plWithInfo will be "No One"
    resetMainPlayerForm();
    renderUI();
  }
  nextTurn();
});

btnMakeQuery.on("click", (e) => {
  // make sure we have a suspect, weapon, room selected

  const suspect = $(".accused[name='suspect']:checked").val();
  const weapon = $(".accused[name='weapon']:checked").val();
  const room = $(".accused[name='room']:checked").val();
  currentQueriedCards = [suspect, weapon, room];

  if (!suspect || !weapon || !room) {
    // alert("You must choose a person, weapon, and room!");
    alertAccussationIncomplete.show();
  } else {
    //we want to first see if it is the main player's turn
    if (players.indexOf(currentPlayer) === 0) {
      //then it is the main player's turn
      $("#clueSection").remove(); //in case it is still there
      mainPlayerTurnForm.trigger("reset");
      mainPlayerQueryModal.show();
    } else {
      //it is an opponent's turn
      opponentQueryModal.show();
    }
  }
});

mainPlayerTurnForm.on("submit", function (e) {
  console.log("Don't submit main player form");
  e.preventDefault();
});

$(queryForm).on("submit", function (e) {
  console.log("DON'T SUBMIT");

  e.preventDefault();
});

$("#clue-input").on("change", addClueRequest);

// GAME EXECUTION CODE //////////////////////////////////////////////////////////////////////////

// create players
createPlayers(playersAsObjs); // fills the players array with player objects

// determine the cards that were given out as freebees (since the deck did not divide evenly)

// game init
const gameApp = new GameApp(players, gameData.sharedCards);

// exhonerate player1's cards
processPlayerHand(players[0]);
