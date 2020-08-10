/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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

// Import the Firebase SDK for Google Cloud Functions.
const functions = require('firebase-functions');
// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
admin.initializeApp();

// Adds a message that welcomes new users into the chat.
// exports.addWelcomeMessages = functions.auth.user().onCreate(async (user) => {
//     console.log('A new user signed in for the first time.');
//     const fullName = user.displayName || 'Anonymous';

//     // Saves the new welcome message into the database
//     // which then displays it in the FriendlyChat clients.
//     await admin.firestore().collection('messages').add({
//       name: 'Firebase Bot',
//       profilePicUrl: '/images/firebase-logo.png', // Firebase logo
//       text: `${fullName} signed in for the first time! Welcome!`,
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     });
//     console.log('Welcome message written to database.');
//   });

exports.getProfile = functions.https.onCall(async (data, context) => {
  const uId = data.data;
  const userRef = admin.firestore().collection('users').doc(uId);
  const doc = await userRef.get();
  if (!doc.exists) {
    return 'No such document!';
  } else {
    if (doc.data().type == 0) {
      return 0;
    } else if (doc.data().type == 1) {
      return {
        inboxLimit: doc.data().inboxLimit,
        shortMailCost: doc.data().shortMailCost,
        longMailCost: doc.data().longMailCost
      };
    } else {
      return 0;
    }

  }


  // if (text == 5) {
  //   var cars = new Array();
  //   var carA = { type: "Fiat", model: "500", color: "white" };
  //   var carB = { type: "subaru", model: "600", color: "black" };
  //   var carC = { type: "punto", model: "700", color: "yellow" };
  //   cars.push(carA);
  //   cars.push(carB);
  //   cars.push(carC);
  //   return cars;
  // } else {
  //   return "yeyeye";
  // }
});


exports.getChats = functions.https.onCall(async (data, context) => {
  const uId = data.data;
  const userRef = admin.firestore().collection('users').doc(context.auth.uid).collection("conversations");
  const snapshot = await userRef.orderBy('timestamp', 'desc').limit(12).get();
  var chats = new Array();
  snapshot.forEach(doc => {
    // var data=doc.data();
    // data.elementId=doc.id;
    // data.userName= doc.data().displayName;
    // data.photoURL= doc.data().photoURL;
    // data.replied= doc.data().replied;
    // data.timestamp= doc.data().timestamp;
    var chatType = context.auth.uid.localeCompare(doc.data().senderUid);
    chats.push({
      elementId: doc.id,
      userName: doc.data().displayName,
      photoURL: doc.data().photoURL,
      replied: doc.data().replied,
      timestamp: doc.data().timestamp,
      chatType: chatType
    });
  });
  return chats;
});


exports.getMessages = functions.https.onCall(async (data, context) => {
  const displayName = data.data;
  const chatType = data.chatType;
  const otherUserRef = admin.firestore().collection('users');
  const snapshotUsr = await otherUserRef.where('displayName', '==', displayName).get();
  if (snapshotUsr.empty) {
    console.log('No matching documents.');
    return;
  }
  var chatId;
  snapshotUsr.forEach(doc => {
    if (chatType == 0) {
      chatId = context.auth.uid.concat(doc.id);
    } else {
      chatId = doc.id.concat(context.auth.uid);
    }
  });

  const chatRef = admin.firestore().collection('data').doc('conversations').collection(chatId);
  const snapshot = await chatRef.orderBy('timestamp', 'desc').limit(12).get();
  var messageArray = new Array();
  if (snapshot.empty) {
    console.log('No matching documents.');
    return;
  }
  snapshot.forEach(doc => {
    messageArray.push({
      elementId: doc.id,
      timestamp: doc.data().timestamp,
      displayName: doc.data().name,
      text: doc.data().text,
      photoURL: doc.data().profilePicUrl
    });
  });
  return messageArray;
});




exports.adminSet = functions.https.onCall(async (data, context) => {
  var access = "79.117.182.138".localeCompare(data.ip);
  if (access == 0) {
    const dataA = {
      name: 'Los Angeles',
      state: 'CA',
      country: 'USA'
    };

    // Add a new document in collection "cities" with ID 'LA'
    const res = await admin.firestore().collection('users').doc('33333').set(dataA);
    // [END set_document]

    console.log('Set: ', res);
    return res;
  } else {
    return "error" + data.ip;
  }

});


// TODO(DEVELOPER): Write the blurOffensiveImages Function here.

// TODO(DEVELOPER): Write the sendNotifications Function here.
