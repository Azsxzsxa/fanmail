/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Signs-in Friendly Chat.
function signIn() {
  // Sign into Firebase using popup auth & Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
}

function signInEmail() {
  // var email = signInEmailInput.value;
  // var password = signInPassInput.value;



  firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    window.alert("error" + email + password + error.code + errorMessage);
  });
}

// Signs-out of Friendly Chat.
function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut();
}

// Initiate Firebase Auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns the signed-in user's profile pic URL.
function getProfilePicUrl() {
  return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

//load influencers on UI
function loadSuperUsers() {
  // Create the query to load the last 12 messages and listen for new ones.
  // var query = firebase.firestore()
  //   .collection(DB_USERS).doc(userUid).collection(DB_CONVERSATIONS)
  //   // .where("type", "==", 1)
  //   .limit(12);

  // query.get()
  //   .then(function (querySnapshot) {
  //     querySnapshot.forEach(function (doc) {
  //       // doc.data() is never undefined for query doc snapshots
  //       //   console.log(doc.data().profilePic);
  //       displayChats(doc.id, doc.data().displayName, doc.data().photoURL, doc.data().receiverUid);

  //     });
  //   })
  //   .catch(function (error) {
  //     console.log("Error getting documents: ", error);
  //   });


    var getChats = firebase.functions().httpsCallable('getChats');
    getChats({data: userUid }).then(function (result) {
      result.data.forEach(element => {
        displayChats(element.elementId, element.userName, element.photoURL);
      });
    }).catch(function (error) {
      // Getting the Error details.
      var code = error.code;
      var message = error.message;
      var details = error.details;
      console.log("loading chats fail"+code+message+details);
      // ...
    });


}

// Requests permission to show notifications.
function requestNotificationsPermissions() {
  console.log('Requesting notifications permission...');
  firebase.messaging().requestPermission().then(function () {
    // Notification permission granted.
    saveMessagingDeviceToken();
  }).catch(function (error) {
    console.error('Unable to get permission to notify.', error);
  });
}


// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) { // User is signed in!
    // Get the signed-in user's profile pic and name.
    //   var profilePicUrl = getProfilePicUrl();
    //   var userName = getUserName();
    userUid = user.uid;
    userName = user.displayName;
    userPic = user.photoURL;

    // Set the user's profile pic and name.
    //   userPicElement.style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    //   userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    //   userNameElement.removeAttribute('hidden');
    //   userPicElement.removeAttribute('hidden');
    //   signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    //   signInButtonElement.setAttribute('hidden', 'true');

    loadSuperUsers();

    // We save the Firebase Messaging Device token and enable notifications.
    //   saveMessagingDeviceToken();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    // userNameElement.setAttribute('hidden', 'true');
    // userPicElement.setAttribute('hidden', 'true');
    // signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    // signInButtonElement.removeAttribute('hidden');
    window.location.href = "login.html";
  }
}

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

// Resets the given MaterialTextField.
function resetMaterialTextfield(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

// Template for messages.
var MESSAGE_TEMPLATE =
  '<div class="message-container">' +
  '<div class="spacing"><div class="pic"></div></div>' +
  '<div class="message"></div>' +
  '<div class="name"></div>' +
  '</div>';


var POWER_USER =
  '<div class="message-container">' +
  '<div class="spacing"><div class="pic"></div></div>' +
  '<div class="message"></div>' +
  '<div class="name"></div>' +
  '</div>';

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

// A loading image URL.
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// Delete a Message from the UI.
function deleteMessage(id) {
  var div = document.getElementById(id);
  // If an element for that message exists we delete it.
  if (div) {
    div.parentNode.removeChild(div);
  }
}

function createAndInsertMessage(id, timestamp) {
  const container = document.createElement('div');
  container.innerHTML = MESSAGE_TEMPLATE;
  const div = container.firstChild;
  div.setAttribute('id', id);

  // If timestamp is null, assume we've gotten a brand new message.
  // https://stackoverflow.com/a/47781432/4816918
  timestamp = timestamp ? timestamp.toMillis() : Date.now();
  div.setAttribute('timestamp', timestamp);

  // figure out where to insert new message
  const existingMessages = messageListElement.children;
  if (existingMessages.length === 0) {
    messageListElement.appendChild(div);
  } else {
    let messageListNode = existingMessages[0];

    while (messageListNode) {
      const messageListNodeTime = messageListNode.getAttribute('timestamp');

      if (!messageListNodeTime) {
        throw new Error(
          `Child ${messageListNode.id} has no 'timestamp' attribute`
        );
      }

      if (messageListNodeTime > timestamp) {
        break;
      }

      messageListNode = messageListNode.nextSibling;
    }

    messageListElement.insertBefore(div, messageListNode);
  }

  return div;
}

function createAndInsertPUser(id) {
  const container = document.createElement('div');
  container.innerHTML = POWER_USER;
  const div = container.firstChild;
  div.setAttribute('id', id);

  // If timestamp is null, assume we've gotten a brand new message.
  // https://stackoverflow.com/a/47781432/4816918
  // timestamp = timestamp ? timestamp.toMillis() : Date.now();
  // div.setAttribute('timestamp', timestamp);

  // figure out where to insert new message
  const existingUsers = pUserListElement.children;
  if (existingUsers.length === 0) {
    pUserListElement.appendChild(div);
  } else {
    let pUserListNode = existingUsers[0];

    // while (messageListNode) {
    //   const messageListNodeTime = messageListNode.getAttribute('timestamp');

    //   if (!messageListNodeTime) {
    //     throw new Error(
    //       `Child ${messageListNode.id} has no 'timestamp' attribute`
    //     );
    //   }

    //   if (messageListNodeTime > timestamp) {
    //     break;
    //   }

    //   messageListNode = messageListNode.nextSibling;
    // }

    pUserListElement.insertBefore(div, pUserListNode);
  }

  return div;
}

// Displays a Message in the UI.
function displayMessage(id, timestamp, name, text, picUrl, imageUrl) {
  var div = document.getElementById(id) || createAndInsertMessage(id, timestamp);

  // profile picture
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
  }

  div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.message');

  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUrl) { // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function () {
      messageListElement.scrollTop = messageListElement.scrollHeight;
    });
    image.src = imageUrl + '&' + new Date().getTime();
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function () { div.classList.add('visible') }, 1);
  messageListElement.scrollTop = messageListElement.scrollHeight;
  messageInputElement.focus();
}

// Displays a Message in the UI.
function displayChats(elementId, displayName, photoURL) {
  var div = document.getElementById(elementId) || createAndInsertPUser(elementId);
  div.querySelector('.name').textContent = displayName;
  //   div.querySelector('.profilePic').src = "profilepic.png";

  // div.querySelector('.message').textContent = text;
  // div.querySelector('.message').innerHTML = div.querySelector('.message').innerHTML.replace(/\n/g, '<br>');



  setTimeout(function () { div.classList.add('visible') }, 1);
  pUserListElement.scrollTop = pUserListElement.scrollHeight;

  div.onclick = function () {
    onChatClick(displayName);
  }

}

function onChatClick(displayName) {
  // window.location.href = "message.html?ou=" + othUsrUid+"&ru="+receiverUid+"&p="+1;
  // loadMessages(displayName);
  chatCardContainer.setAttribute('hidden', true);
  messageCardContainer.removeAttribute('hidden');
  backBtn.removeAttribute('hidden');

  // sessionStorage.setItem("ou", othUsrUid);
  // sessionStorage.setItem("ru", receiverUid);
  // sessionStorage.setItem("p", 1);
  // window.location.href = "message.html";
  
  
  // otherUserUid = othUsrUid;
  // otherUserName = othUsrDisplayName;
  // otherUserPic = othUsrPic;
  // chatCardContainer.setAttribute('hidden', true);
  // messageCardContainer.removeAttribute('hidden');
  // backBtn.removeAttribute('hidden');
  // while (messageListElement.firstChild) {
  //   messageListElement.firstChild.remove();
  // }

  // loadMessages(userUid, othUsrUid, receiverUid);

  //TODO : window.location.hfred= "message.html?cu=123,ou=123"

}

// Enables or disables the submit button depending on the values of the input
// fields.
function toggleButton() {
  console.log("asdf");
  var words = messageInputElement.value.match(/(\w+)/g);
  output.value = words ? words.length : 0;

  if (messageInputElement.value) {
    submitButtonElement.removeAttribute('disabled');
  } else {
    submitButtonElement.setAttribute('disabled', 'true');
  }
}

// Checks that the Firebase SDK has been correctly setup and configured.
function checkSetup() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
      'Make sure you go through the codelab setup instructions and make ' +
      'sure you are running the codelab using `firebase serve`');
  }
}

// Checks that Firebase has been imported.
checkSetup();

// Shortcuts to DOM Elements.
// var imageButtonElement = document.getElementById('submitImage');
;

var signInSnackbarElement = document.getElementById('must-signin-snackbar');

// Saves message on form submit.
// signInButtonElement.addEventListener('click', signIn);
// signInEmailSubmit.addEventListener('click',signInEmail);

// Toggle for the button.
// messageInputElement.addEventListener('keyup', toggleButton);
// messageInputElement.addEventListener('change', toggleButton);

var userUid;
var userName;
var userPic;
var othUsrUid;
var otherUserName;
var otherUserPic;
var conversationId;
var puserLimitUid;

// var emailLog = "anamere@gmail.com";
// var passwordLog = "123456"

var pUserListElement = document.getElementById('pusers');
var chatCardContainer = document.getElementById('pusers-card-container');
var profileContainer = document.getElementById('profile-container');

messageCardContainer.setAttribute('hidden', true);
backBtn.setAttribute('hidden',true);
// Events for image upload.
// imageButtonElement.addEventListener('click', function(e) {
//   e.preventDefault();
//   mediaCaptureElement.click();
// });
// mediaCaptureElement.addEventListener('change', onMediaFileSelected);

// initialize Firebase
initFirebaseAuth();

// query string
// window.location.href = "Posts?Category=" + sel;
// var url_string = window.location.href ;
// var url = new URL(url_string);
// var c = url.searchParams.get("crcat");
// console.log(c);






