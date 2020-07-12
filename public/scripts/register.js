function addUserToDb(userEmail, userName, userUid) {
    var db = firebase.firestore();
    db.collection("users").doc(userUid).set({
        name: userName,
        email: userEmail,
        uid: userUid,
        type: 0
    })
        .then(function () {
            console.log("Document successfully written!");
        })
        .catch(function (error) {
            window.alert(error);
        });

}


function authStateObserver(user) {
    if (user) { // User is signed in!
        addUserToDb(email, firstName + " " + lastName, user.uid);
        window.alert("success login");
        window.location.href = "index.html";
    } else {
        window.alert("fail login");
    }
}

var registerForm = document.getElementById("register-form");
var firstName = registerForm.elements[0].value;
var lastName = registerForm.elements[1].value;
var password = registerForm.elements[2].value;
var email = registerForm.elements[3].value;

firebase.auth().onAuthStateChanged(authStateObserver);

registerForm.elements[4].onclick = function () {
    firstName = registerForm.elements[0].value;
    lastName = registerForm.elements[1].value;
    password = registerForm.elements[2].value;
    email = registerForm.elements[3].value;
    console.log(firstName + lastName + password + email);

    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        window.alert(errorCode + " " + errorMessage);
    });
};

