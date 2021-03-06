function authStateObserver(user) {
    if (user) {
        console.log("user logged");
        _userUid = user.uid;
        _userDisplayName = user.displayName;
        _userPic = user.PhotoUrl;
    } else {
        console.log("user not logged");
        window.location.href = "login.html";
    }
}


function initFirebaseAuth() {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);
}

function signOut() {
    firebase.auth().signOut().then(function() {
        // Sign-out successful.
    }).catch(function(error) {
        // An error happened.
    });
}

var _userUid;
var _userDisplayName;
var _userPic;
initFirebaseAuth();