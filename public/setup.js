"use strict";

// variables
const pModal = new bootstrap.Modal($("#player-modal"), { keyboard: false });
const pForm = $("#player-form");
const cModal = new bootstrap.Modal($("#enter-cards-modal"), {
  keyboard: false,
});
const cModal2 = new bootstrap.Modal($("#enter-cards-modal"), {
  keyboard: false,
});

const cForm = $("#my-cards-form");
const submitPlayerBtn = $("#submit-player-form");
const recordCardsBtn = $("#recordCards");

const enteredPlayers = [];
let requiredSelections = 1; //number of required cads to select for the modal in the event the cards do not divide evenly amongst the players.
let sharedCardsPresent = false;
let sharedCards;

///////// Execution Code /////////////////////////////

//We start with a modal after page loads
pModal.show();

//Problem:
//1.) a form refreshes page after submit is called
//2.) since we are loading the modal on the page load, this means that after submitting the form, the same modal reopens again when the page refreshes.

//Solution:
//1.) We will first prevent the form from refreshing the page by calleing the event.preventDefault();

//There is no type="submit" button for the form. We will use the  "save chagnes" button to submit the form AND to close the modal. Closing the modal is automatic since there is the "data-bs-dismiss" attribute in the button element. However this prevents the use of a type="submit" attribute (closes before submission). So, we need to create an eventListener for the click of the button to handle the submission of the form.

//First though we need to prevent the form from refreshing the page after it is submited (which would cause our modal to open again).

$(pForm).on("submit", function (e) {
  e.preventDefault();
});

$(cForm).on("submit", function (e) {
  e.preventDefault();
});

//now we can add the manual submission from the button click and save the data (NOTE: this does not refresh the page).
$(submitPlayerBtn).on("click", function (e) {
  //we check to see if the form is validly filled out (note that Jquery variables are actually an array of info, so we need to tak the first item in the array which is the html code that has the checkValidity method defined in the browser)
  if (pForm[0].checkValidity()) {
    //submit form
    //$(pForm).trigger("submit");

    // get form data
    const playerData = jQuery.makeArray($(pForm.serializeArray()));

    for (const [index, player] of Object.entries(playerData)) {
      if (player.value !== "") {
        enteredPlayers.push(player);
      }
    }

    // we want to post the data to the backend
    $.post("/load-players", enteredPlayers);

    // hide modal
    pModal.hide();

    // determine if a third modal is needed to get the shared cards
    sharedCards = 18 % enteredPlayers.length;
    if (sharedCards !== 0) {
      sharedCardsPresent = true;
    }

    // show the modal to get the cards for the main player
    requiredSelections = Math.trunc(18 / enteredPlayers.length);
    cModal.show();
  } else {
    //not valid
    e.preventDefault();
    e.stopPropagation();
  }
  //add validation css to form
  $(pForm).addClass("was-validated");
});

let cardModalInstance1 = true;

//same process as above for the recording of the players card modal
$(recordCardsBtn).on("click", function (e) {
  //get data
  const myCardData = jQuery.makeArray(cForm.serializeArray());
  if (myCardData.length !== requiredSelections) {
    //not enough cards entered
    e.preventDefault();
    e.stopPropagation();
    $("#instructions").text("You forgot to enter cards!");
    $("#instructions").addClass("errorFont");
    //add validation css to form
    $(cForm).addClass("was-validated");
  } else {
    //send cards to backend
    if (cardModalInstance1) {
      $.post("/load-Cards", myCardData);
    } else {
      $.post("/load-SharedCards", myCardData);
    }

    //hide cards modal
    cModal.hide();

    if (sharedCards !== 0 && cardModalInstance1) {
      //cards did not distribute evenly, so we need to show the card modal again to store the number of shared cards
      requiredSelections = sharedCards;
      $("#instructions").text(
        "Check the boxes of the cards that are shared with all players."
      );
      cardModalInstance1 = false;
      cForm.trigger("reset");
      cForm.removeClass("was-validated");
      $("#instructions").removeClass("errorFont");
      cModal2.show();
    } else {
      cModal2.hide();
      //open the score card page
      $(location).prop("href", "/score-card");
    }
  }
});
