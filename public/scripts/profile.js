var addMessage = firebase.functions().httpsCallable('addMessage');
addMessage({locator: "ooWiSmzZevSSiPwo75wWpK5upcE3"}).then(function(result) {
  // Read result of the Cloud Function.
//   var sanitizedMessage = result.data.text;
  console.log(result.data)
}).catch(function(error) {
  // Getting the Error details.
  var code = error.code;
  var message = error.message;
  var details = error.details;
  // ...
});