////////////// Server Implimentaton /////////////////////////////////////////////////////////////////////////////////////

import express from "express";
import bodyParser from "body-parser";
import Player from "../public/classes.js";
import serverless from "serverless-http";

const app = express();
const port = 3000;

const setupData = {
  players: [],
  sharedCards: [],
};

app.use(express.static("public")); //we need to send the public folder to the server so that all the css and html files (as well as any js files) are available to be served. We do not even need to show a route for the "/" homepage!! Awesome.

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Listenings on port ${port}`);
});

app.get("/setup", (req, res) => {
  res.render("setup.ejs");
});

//route to post and store the player data from the user
app.post("/load-players", (req, res) => {
  parsePlayers(req.body);
});

app.post("/load-Cards", (req, res) => {
  loadCards(req.body);
});

app.post("/load-SharedCards", (req, res) => {
  loadSharedCards(req.body);
});

app.get("/score-Card", (req, res) => {
  res.render("score-card.ejs", { setupData });
});

app.get("/getGameData", (req, res) => {
  console.log("sending GameData...");
  console.log(setupData);

  res.send(setupData);
});

//////////////////////  METHODS FOR SETUP DATA ////////////////////////////////////////////////////////////////////////////////

function parsePlayers(players) {
  //first we will clear the setupData in case anything remains from previous games
  setupData.players = [];

  console.log(`Players from back end`, players);

  let turn = 1;

  for (const [_, name] of Object.entries(players)) {
    if (name !== "") {
      setupData.players.push(new Player(name, turn++));
    }
  }
  console.log("Players: ", setupData.players);
}

function loadCards(cards) {
  //cards is an object with properties 'green : 1' 'revolver: 2' etc.
  //here we will add cards to the player class
  for (const [cardName, _] of Object.entries(cards)) {
    setupData.players[0].addCard(cardName);
  }
  console.log(`User's cards are: ${setupData.players[0].cardsHas}`);
  console.log("SetupData after Card Load: ", setupData);
}

function loadSharedCards(cards) {
  //cards is an object with properties 'green : 1' 'revolver: 2' etc.
  for (const [card, _] of Object.entries(cards)) {
    setupData.sharedCards.push(card);
  }
}
