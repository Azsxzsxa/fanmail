$(document).ready(function() {
    // var nav_open = $("#nav-open");
    // $(nav_open).click(function () {
    //     if ($(nav_open).hasClass("m-l-2220")) {
    //         $(nav_open).removeClass("m-l-2220");
    //     } else {
    //         $(nav_open).addClass("m-l-2220");
    //     }
    // });
    // var nav_open_2 = $("#nav-open-2");
    // $(nav_open_2).click(function () {
    //     if ($(nav_open_2).hasClass("m-l-2220")) {
    //         $(nav_open_2).removeClass("m-l-2220");
    //     } else {
    //         $(nav_open_2).addClass("m-l-2220");
    //     }
    // });
    // var pageURL = $(location).attr("href");
    let pageName = document.location.href.match(/[^\/]+$/)[0];
    switch (pageName) {
        case "inbox":
            inboxGetChats();
            break;
        case "people":
            // code block
            break;
        case "profile":
            // code block
            break;
        default:
            // code block
    }
});


var CHAT_CARD =
    '<div class="message-block">' +
    '<div style="width:55px" class="hidden-xs-down align-self-center">' +
    '<img src="assets/images/users/1.jpg" alt="user" width="60" class="img-circle" />' +
    '</div>' +
    '<div class="message-sender-parent">' +
    '<div class="sender-name"></div>' +
    '<div class="send-message"></div>' +
    '<span class="message-time"></span>' +
    '</div>' +
    '</div>';

function inboxGetChats() {
    var getChats = firebase.functions().httpsCallable('getChats');
    getChats({ data: _userUid }).then(function(result) {
        result.data.forEach(element => {
            inboxDisplayChats(element.elementId, element.userName, element.lastMessage, element.photoURL, element.chatType, element.replied, element.timestamp);
            console.log(element.lastMessage)
        });
    }).catch(function(error) {
        // Getting the Error details.
        var code = error.code;
        var message = error.message;
        var details = error.details;
        console.log("loading chats fail" + code + message + details);
        // ...
    });
}

function inboxDisplayChats(elementId, userName, lastMessage, photoURL, chatType, replied, timestamp) {
    let section;
    if (replied == 1) {
        section = document.getElementById('replied-section');
    } else {
        section = document.getElementById('new-section');
    }
    let date = new Date(timestamp._seconds * 1000);
    let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
    let mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(date);
    let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
    console.log(`${da}-${mo}-${ye}`);
    const container = document.createElement('a');
    container.id = elementId;
    container.innerHTML = CHAT_CARD;
    container.querySelector('.sender-name').textContent = userName;
    container.querySelector('.send-message').textContent = lastMessage;
    container.querySelector('.message-time').textContent = "" + da + " " + mo;
    section.appendChild(container);
    userName = userName.replace(/\s/g, '');
    container.onclick = function() {
        window.location.href = "message.html?name=" + userName;
    }

}