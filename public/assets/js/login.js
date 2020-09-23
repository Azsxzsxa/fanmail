function addUserToDb(userEmail, userName, userUid, photoURL) {
    var db = firebase.firestore();
    db.collection("users").doc(userUid).set({
            displayName: userName,
            photoURL: photoURL,
            email: userEmail,
            uid: userUid,
            type: 0
        })
        .then(function() {
            window.location.href = "inbox.html";
        })
        .catch(function(error) {
            window.alert(error);
        });

}


// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
    if (user) {

        var docRef = firebase.firestore().collection("users").doc(user.uid);
        docRef.get().then(function(doc) {
            if (doc.exists) {
                window.location.href = "inbox.html";
            } else {
                addUserToDb(user.email, user.displayName, user.uid, user.photoURL);
            }
        }).catch(function(error) {
            console.log("Error getting document:", error);
        });

    } else {
        window.alert("fail login");
    }
}



var emailInput = document.getElementById('input email');
var passInput = document.getElementById('input pass');
var login = document.getElementById('login');
var loginGoogle = document.getElementById('login google');
var googleLogIn = false;


login.onclick = function() {
    googleLogIn = false;
    var emailVal = emailInput.value;
    var passVal = passInput.value;
    console.log(emailVal + passVal);
    firebase.auth().signInWithEmailAndPassword(emailVal, passVal).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        window.alert("error" + emailVal + passVal + errorCode + errorMessage);
    });

}

loginGoogle.onclick = function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
    googleLogIn = true;

}

firebase.auth().onAuthStateChanged(authStateObserver);