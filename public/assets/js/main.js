$(document).ready(function() {
    let pageName = document.location.pathname.match(/[^\/]+$/)[0];
    switch (pageName) {
        case "inbox":
            inboxGetChats();
            break;
        case "people":
            peopleGetPeople();
            break;
        case "profile":
            // code block
            break;
        case "message":
            messageLoadMessages();
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

var MESSAGE_CARD =
    '<div class="chat-content">' +
    '<div class="chat-message box bg-light-info"></div>' +
    '<div class="chat-time send-receive-time"></div>' +
    '</div>';

var PEOPLE_CARD =
    '<div class="card user-profile">' +
    '<div class="user-profile-pic">' +
    '<a href="javascript:void(0)"><img class="card-img-top img-responsive" src="assets/images/big/img1.jpg" alt="Card image cap"></a>' +
    '</div>' +
    '<div class="card-body user-profile-body">' +
    '<h4 class="card-title user-name"><a href="javascript:void(0)" class="text-dark"></a></h4>' +
    '<p class="card-text user-message"><a href="javascript:void(0)" class="text-dark"></a></p>' +
    ' </div>' +
    '</div>';

function inboxGetChats() {
    var getChats = firebase.functions().httpsCallable('getChats');
    getChats({ data: _userDisplayName }).then(function(result) {
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

    const container = document.createElement('a');
    container.id = elementId;
    container.innerHTML = CHAT_CARD;
    container.querySelector('.sender-name').textContent = userName;
    container.querySelector('.send-message').textContent = lastMessage;
    container.querySelector('.message-time').textContent = "" + da + " " + mo;
    section.appendChild(container);
    container.onclick = function() {
        sessionStorage.setItem('displayName', userName);
        sessionStorage.setItem('chatType', chatType);
        window.location.href = "message.html";
    }

}

function messageLoadMessages() {
    let displayName = sessionStorage.getItem('displayName');
    let chatType = sessionStorage.getItem('chatType')

    var getMessages = firebase.functions().httpsCallable('getMessages');
    getMessages({
        data: displayName,
        chatType: chatType
    }).then(function(result) {
        console.log(result);
        console.log("loading messages");
        //set name , desc , pic 
        document.getElementById("user-name").innerHTML = result.data.otherUserName;
        document.getElementById("user-desc").innerHTML = result.data.otherUserDescr;
        result.data.messageArray.forEach(message => {
            var date = new Date(message.timestamp._seconds * 1000);
            messageDisplayMessages(message.elementId, date, message.displayName,
                message.text, message.photoURL);
        });
    });
    // .catch(function(error) {
    //     // Getting the Error details.
    //     var code = error.code;
    //     var message = error.message;
    //     var details = error.details;
    //     console.log('loading messages failed :' + code + message + details);
    //     // ...
    // });

    $("#message-send-txt").on("keyup", function() {
        var words = $("#message-send-txt").val().match(/(\w+)/g);
        $("#message-word-count").text(words ? words.length : 0);
    });


}

function messageDisplayMessages(elementId, date, displayName,
    text, photoURL) {
    let section = document.getElementById('chat-list');
    const container = document.createElement('li');
    const existingMessages = section.children;

    // var date = new Date(timestamp._seconds * 1000);
    date = date ? date.getTime() : Date.now();
    container.setAttribute('timestamp', date);


    if (existingMessages.length === 0) {
        section.appendChild(container);
    } else {
        let messageListNode = existingMessages[0];

        while (messageListNode) {
            const messageListNodeTime = messageListNode.getAttribute('timestamp');

            if (!messageListNodeTime) {
                throw new Error(
                    `Child ${messageListNode.id} has no 'timestamp' attribute`
                );
            }

            if (messageListNodeTime > date) {
                break;
            }

            messageListNode = messageListNode.nextSibling;
        }

        section.insertBefore(container, messageListNode);
    }

    var n = _userDisplayName.localeCompare(displayName);
    if (n == 0) {
        container.classList.add('reverse');
    }

    let displayTime = Intl.DateTimeFormat('default', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    }).format(date)

    container.id = elementId;
    container.innerHTML = MESSAGE_CARD;
    container.querySelector('.chat-message').textContent = text;
    container.querySelector('.chat-time').textContent = displayTime;
    $("#chat-div").scrollTop($("#chat-div")[0].scrollHeight);
}

function messageSendMessage() {

    if (parseInt($("#message-word-count").text()) <= 80) {
        console.log(sessionStorage.getItem('chatType'));
        var setSubmitMessage = firebase.functions().httpsCallable('setSubmitMessage');
        setSubmitMessage({
            displayName: sessionStorage.getItem('displayName'),
            text: $("#message-send-txt").val(),
            chatType: sessionStorage.getItem('chatType')
        }).then(function(result) {
            switch (result.data.retCode) {
                case NO_ERR:
                    console.log("sent successfully");
                    messageDisplayMessages(result.data.id, new Date(), _userDisplayName, $("#message-send-txt").val(), _userPic);
                    $("#message-send-txt").val("");
                    break;
                case ERR_INBOXLIMIT:
                    console.log("sent failure , inbox limit reached");
                    break;
                case ERR_WORDLIMIT:
                    console.log("sent failure , word limit reached");
                    break;
                case ERR_OTHR:
                    console.log("sent failure");
                    break;
                case ERR_WRITEDB:
                    console.log("sent to database failure");
                    break;
                default:
                    console.log("sent failure, unspecified issue");
            }
        });
    } else {
        console.log("too many words");
    }
}

function peopleGetPeople() {
    var getPowerUsers = firebase.functions().httpsCallable('getPowerUsers');
    getPowerUsers({ data: _userUid }).then(function(result) {

        result.data.forEach(element => {
            peopleDisplayPeople(element.elementId, element.displayName, element.photoURL, element.description);
        });
    }).catch(function(error) {
        // Getting the Error details.
        var code = error.code;
        var message = error.message;
        var details = error.details;
        console.log("loading power users failed" + code + message + details);
        // ...
    });
}

function peopleDisplayPeople(elementId, displayName, photoURL, description) {
    section = document.getElementById('people-container');

    const container = document.createElement('div');
    container.id = elementId;
    container.classList.add("col-lg-2");
    container.classList.add("col-md-12");
    container.classList.add("profile-page");
    container.innerHTML = PEOPLE_CARD;
    container.querySelector('.card-title').textContent = displayName;
    container.querySelector('.card-text').textContent = description;
    section.appendChild(container);
    container.onclick = function() {
        sessionStorage.setItem('displayName', displayName);
        sessionStorage.setItem('chatType', 0);
        window.location.href = "message.html";
    }
}