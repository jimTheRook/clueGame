export class Deck {
    cards = new Map();
    constructor() {
      this.cards.set("green", "suspect");
      this.cards.set("mustard", "suspect");
      this.cards.set("peacock", "suspect");
      this.cards.set("plum", "suspect");
      this.cards.set("scarlet", "suspect");
      this.cards.set("white", "suspect");
      this.cards.set("knife", "weapon");
      this.cards.set("candlestick", "weapon");
      this.cards.set("revolver", "weapon");
      this.cards.set("rope", "weapon");
      this.cards.set("lead-pipe", "weapon");
      this.cards.set("wrench", "weapon");
      this.cards.set("hall", "room");
      this.cards.set("lounge", "room");
      this.cards.set("dining-room", "room");
      this.cards.set("kitchen", "room");
      this.cards.set("ball-room", "room");
      this.cards.set("conservatory", "room");
      this.cards.set("billiard-room", "room");
      this.cards.set("library", "room");
      this.cards.set("study", "room");
    }
  }
  
  export default class Player {
    name;
    turnNumber;
    cardsHas;
    cardsHasNot;
  
    constructor(name, turnNumber) {
      this.name = name;
      this.turnNumber = turnNumber;
      this.cardsHas = [];
      this.cardsHasNot = [];
    }
  
    addCard(card) {
      if (!this.cardsHas.includes(card)) {
        this.cardsHas.push(card);
        console.log(`Card added to ${this.name}'s hand!`);
      }
    }
  
    //returns true if a card was actually added to the cardsHasNot list (i.e. it was NOT already in the list). Else returns false.
    addNotHaveCard(card) {
      if (!this.cardsHasNot.includes(card)) {
        this.cardsHasNot.push(card);
        console.log(`Card added to ${this.name}'s "has not cards"`);
        return true;
      }
      return false;
    }
  
    toString() {
      return this.name + ", " + this.turnNumber;
    }
  }
  
  export class GameApp {
    deck; //contains remaining cards for which we do not know the owners
    players = [];
    sharedCards; //store the cards that do not go evenly into the player's hands
    queries = []; //all queries made in the game
    solution = { suspect: "", weapon: "", room: "" };
    numCardsDeck;
    secretHandNum = 3;
    playerHandNum;
    deckMap;
  
    constructor(players, extraCards = []) {
      // store players
      this.players = players;
      this.sharedCards = extraCards;
      // init the deck
      this.deck = new Deck().cards;
      this.numCardsDeck = this.deck.size;
  
      this.playerHandNum =
        (this.numCardsDeck - this.secretHandNum - this.sharedCards.length) /
        this.players.length;
  
      //create a probabilty map of the deck of cards
      this.deckMap = new Map();
  
      this.deck.forEach((cat, card, mp) => {
        this.deckMap.set(card, new Map());
        this.players.forEach((player) =>
          this.deckMap
            .get(card)
            .set(player.name, this.playerHandNum / this.deck.size)
        );
      });
  
      // load player[0] cards
      this.loadCards(players[0].cardsHas);
  
      // // deal with shared cards that all players can see
      // for(const card of extraCards){
  
      // }
    }
  
    // ///////////////////METHODS
  
    // load player1's cards to the game
    loadCards(cards) {
      // cards is an object with properties 'green : 1' 'revolver: 2' etc.
      for (const [_, cardName] of Object.entries(cards)) {
        this.playerHasCard(this.players[0].name, cardName);
      }
      // now we can mark all other cards for the user as 'not having'
      this.deck.forEach((value, key, map) => {
        if (!this.players[0].cardsHas.includes(key)) {
          this.playerHasNotCard(this.players[0].name, key);
        }
      });
      console.log(`User's cards are: ${this.players[0].cardsHas}`);
    }
  
    // record that a player has a card
    playerHasCard(playerName, cardName) {
      const player = this.getPlayerByName(playerName);
      // if card is in the deck, assign the card to player hand and remove card from deck
      if (this.deck.has(cardName)) {
        player.addCard(cardName);
        //set the probablities
        this.players.forEach((player) => {
          if (player.name === playerName) {
            this.deckMap.get(cardName).set(playerName, 1);
          } else {
            this.deckMap.get(cardName).set(player.name, 0);
          }
        });
  
        this.deck.delete(cardName);
      }
    }
  
    //returns true if the player's notHave cards was updated. Returns false if it was not (we already knew the player did not have the card)
    playerHasNotCard(playerName, cardName) {
      const player = this.getPlayerByName(playerName);
      if (player) {
        //we will not mark the player as not having the card if the card is one of the shared cards
        if (!this.sharedCards.includes(cardName)) {
          if (player.addNotHaveCard(cardName)) {
            this.deckMap.get(cardName).set(playerName, 0);
            return true;
          }
        }
      }
      return false;
    }
  
    queryNumber = 1; // for console purposes only
  
    // submit a query object from the front end
    submitQuery(query) {
      console.log(
        `Query: ${this.queryNumber++}---------------------------------`
      );
  
      if (query instanceof Object) {
        //this is the first query of the game
        if (this.queries.length === 0) {
          this.processQuery(query);
          //subsequent queries
        } else {
          //has query already been asked?
          let alreadyAsked = false;
  
          for (const storedQuery of this.queries) {
            if (
              JSON.stringify(query.cards + "," + query.answerer) ===
              JSON.stringify(storedQuery.cards + "," + storedQuery.answerer)
            ) {
              console.log("This query was already asked of this player. ");
              alreadyAsked = true;
              return;
            }
          }
  
          if (!alreadyAsked) {
            this.processQuery(query);
          }
        }
      } else {
        console.log("Argument was not of an object type.");
        return undefined;
      }
    }
  
    processQuery(query) {
      this.queries.push(query);
      this.analyzeQuery(query);
      this.updateStats();
    }
  
    analyzeQuery(query) {
      //at this point, we know the query is not the first query and is not a repeat query
      let informative = true;
      let changed = false;
  
      //get the answerer (queried player)
      const queriedPlayer = this.getPlayerByName(query.answerer);
  
      //1. Was a card returned?
      if (!query.returnedCard) {
        console.log(`${query.answerer} did not show a card.`);
        //mark the answerer as not having the cards.
        query.cards.forEach((card) => {
          changed = this.playerHasNotCard(query.answerer, card);
        });
      } else {
        // 2. check to see if anyone is known to have any of the cards, and if so, is it the answerer?
        const queryUnknownCards = [];
  
        //create a map of known cards where key: card, value: 'player name'
        const knownCards = this.players
          .filter((player) => player.cardsHas.length !== 0)
          .reduce((map, player) => {
            player.cardsHas.forEach((card) => map.set(card, player.name));
            return map;
          }, new Map());
  
        query.cards.forEach((card) => {
          if (knownCards.has(card)) {
            console.log(`${knownCards.get(card)} has card ${card}`);
            //is the player known to have the card the answerer?
            if (knownCards.get(card) === query.answerer) {
              console.log(`${query.answerer} has card ${card}`);
              informative = false; //answerer probably showed card we already knew he had
            } else {
              console.log(`${query.answerer} does not have ${card}`);
            }
          } else {
            // check to see if the card was included in the shared cards dealt at the beginning of the game. If not then push into the queryUnknownCards
            if (!this.sharedCards.includes(card)) queryUnknownCards.push(card);
          }
        });
  
        // 3. if the answerer had one of the cards, there is no need to continue as he probably gave the asker the card we know he has.
        if (!informative) {
          console.log("No information to be had. Go to the next turn. ");
        } else {
          //logic to process the information
          console.log(`Unknown cards are ${queryUnknownCards}`);
          changed = this.setQueryProb(queryUnknownCards, query);
        }
      }
      return changed;
    }
  
    setQueryProb(queryUnknownCards, query) {
      //NOTE: we are only here if the answerer returned a card. All the queryUknownCards are cards that we do not know who has yet.
      let changed = false;
      let prob;
  
      // check the query.answerer's list of items he has said in the past that he does not have. If two of the items in the this query are in the list, then we know the card shown was the third item.
      //create an array which will only cotain the cards from the queryUnknownCards which John has not already said he did not have.
  
      const player = this.getPlayerByName(query.answerer);
  
      const filtQueryUknownCards = queryUnknownCards.filter(
        (card) => !player.cardsHasNot.includes(card)
      );
  
      if (filtQueryUknownCards.size === 1) {
        console.log(
          `${query.answerer} has the unknown card ${filtQueryUknownCards[0]}`
        );
        prob = 1;
      } else {
        // there were 2 or 3 unknown cards in the question
        prob = 1 / filtQueryUknownCards.length;
      }
  
      //we could check here to see if what the current prob of the player having each of the cards is.
      queryUnknownCards.forEach((card) => {
        const curProb = this.deckMap.get(card).get(query.answerer);
        if (curProb !== prob && curProb !== 0) {
          //prob has changed and the curProb is not 0 (we don't want to change the prob if it is 0)
  
          //is the prob 100?
          if (prob === 1) {
            this.playerHasCard(query.answerer, filtQueryUknownCards[0]);
          } else {
            this.deckMap.get(card).set(query.answerer, prob);
          }
          console.log(
            `There were ${queryUnknownCards.length} unknown cards. The prob of ${query.answerer} having the card ${card} is ${prob}`
          );
          changed = true;
        }
      });
      return changed;
    }
  
    updateStats() {
      // 1. Here we want to loop through all the queries from the past and compute probabilites again (we may know more about the players hands now compared to when the queries were asked)
      //this.analyzeAllQueries();
  
      // 2. FOLLOW UP Questions:
      // - Is the sum of any innerMap of the deckMap 0? This would mean no one has the card and the map value (card) is in the solution hand.
      // - Is there only one unknown item in a category? Then it must be in the solution.
      // - Does the solution contain all 3 items? Then we have the full solution.
      // 3. Keep REPEATING the checks above until all the questions in step 2 are false.
  
      console.log("... updating stats ...");
  
      let repeat = true;
      while (repeat) {
        //methods return true if data was adjusted
        console.log(`- Analyzing queries started...`);
        const check1 = this.analyzeAllQueries();
        console.log(`- Analyzed queries ... data changed: ${check1}`);
  
        console.log(`- Checking if no one has a card started...`);
        const check2 = this.checkNoOneHasCard();
        console.log(`- Checked if no one has a card ... data changed: ${check2}`);
  
        console.log(`- Checking if only one item left in category started...`);
        const check3 = this.checkOneItemLeftInCategories();
        console.log(
          `- Checked if only one item left in category ... data changed: ${check3}`
        );
  
        if (!check1 && !check2 && !check3) {
          repeat = false;
        }
      }
  
      console.log("... stats updated ...");
  
      //finally we will see if there is a solution
      if (this.haveSolution()) {
        console.log("We know the solution!! 🥳 👏");
      }
    }
  
    analyzeAllQueries() {
      //returns true if changes were made
  
      let change = false;
  
      this.queries.forEach((query) => {
        if (this.analyzeQuery(query)) {
          change = true;
        }
      });
      return change;
    }
    // check to see if there is an item which we know no one has (then it is in the solution). Check by adding the values of the innerMap of deckMap for each item. If the sum is 0 then, no one has the item.
    checkNoOneHasCard() {
      let changesMade = false;
  
      for (const [cardName, playerMap] of this.deckMap) {
        const valArr = Number(
          Array.from(playerMap.values()).reduce((acc, cur) => acc + cur, 0)
        );
  
        if (valArr === 0 && this.deck.has(cardName)) {
          //card is in the solution
          this.submitSolutionCard(cardName);
          changesMade = true;
        }
      }
      return changesMade;
    }
  
    // record a solution card
    submitSolutionCard(cardName) {
      const cardCat = this.deck.get(cardName);
      this.solution[cardCat] = cardName;
      console.log(`Stored ${cardName} in solution set`);
      //remove card from deck
      this.deck.delete(cardName);
    }
  
    // check to see if there is a category that only has one uknown card. If so it should be placed in solution object and true should be returned
    checkOneItemLeftInCategories() {
      const suspectChange = this.checkOneItemLeftInCat("suspect");
      const weaponChange = this.checkOneItemLeftInCat("weapon");
      const roomChange = this.checkOneItemLeftInCat("room");
  
      return suspectChange || weaponChange || roomChange;
    }
  
    checkOneItemLeftInCat(category) {
      // only need to do this if a solution for the category does not exist
      if (this.solution[category] === "") {
        //convert the deck (which contains all unknown cards) into an array, filtering by category, and then checking to see if there is only one item in the category (i.e. only one item that is uknown). If so, we can send this to the solution.
        const cardsByCat = Array.from(this.deck).filter(
          (card) => card[1] === category
        );
        if (cardsByCat.length === 1) {
          //it is the solution for this category
          this.submitSolutionCard(cardsByCat[1]);
          return true;
        }
      }
      return false;
    }
  
    haveSolution() {
      return (
        this.solution.suspect !== "" &&
        this.solution.weapon !== "" &&
        this.solution.room !== ""
      );
    }
  
    getPlayerByName(name) {
      return this.players.filter((playerObj) => playerObj.name === name)[0];
    }
  }
  