// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
    if (user) { // User is signed in!
      // Get the signed-in user's profile pic and name.
    //   window.alert("successful login");
    //   var profilePicUrl = getProfilePicUrl();
    //   var userName = getUserName();
    //   userUid = user.uid;

    //   saveMessagingDeviceToken();
    console.log(user.uid);
    window.alert("success login");
    window.location.href = "index.html";
    } else { 
      window.alert("fail login");
    }
  }



var emailInput = document.getElementById('input email');
var passInput = document.getElementById('input pass');
var login = document.getElementById('login');
var loginGoogle = document.getElementById('login google');


login.onclick=function(){
    var emailVal = emailInput.value;
    var passVal = passInput.value;
    console.log(emailVal+passVal);
    firebase.auth().signInWithEmailAndPassword(emailVal, passVal).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        window.alert("error"+email+password +errorCode + errorMessage);
      });
    
}

loginGoogle.onclick=function(){
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
    
}

firebase.auth().onAuthStateChanged(authStateObserver);