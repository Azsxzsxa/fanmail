
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) {

    var userUid = user.uid;
    var userName = user.displayName;
    var userPic = user.photoURL;
    var userEmail = user.email;
    var getProfile = firebase.functions().httpsCallable('getProfile');
    getProfile({ data: userUid }).then(function (result) {
      console.log(result.data);
      if (result.data == 0) {
        displayName.innerHTML = userName;
        email.innerHTML = userEmail;
      } else {
        displayName.innerHTML = userName;
        email.innerHTML = userEmail;

        inboxLimit.innerHTML = result.data.inboxLimit;
        shortMailCost.innerHTML = result.data.shortMailCost;
        longMailCost.innerHTML = result.data.longMailCost;
      }
    }).catch(function (error) {
      // Getting the Error details.
      var code = error.code;
      var message = error.message;
      var details = error.details;
      // ...
    });

  } else {
    window.location.href = "login.html";
  }
}


var displayName = document.getElementById('displayName');
var inboxLimit = document.getElementById('inboxLimit');
var shortMailCost = document.getElementById('shortMailCost');
var longMailCost = document.getElementById('longMailCost');
var email = document.getElementById('email');
initFirebaseAuth();