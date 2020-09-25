const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

//DB REFS
const DB_USERS = "users";
const DB_CONVERSATIONS = "conversations";
const DB_DATA = "data";

//RET CODES
const NO_ERR = 0;
const ERR_OTHR = 100;

const ERR_WORDLIMIT = 101;
const ERR_INBOXLIMIT = 102;


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

exports.getProfile = functions.https.onCall(async(data, context) => {
    const uId = data.data;
    const userRef = admin.firestore().collection(DB_USERS).doc(uId);
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


exports.getChats = functions.https.onCall(async(data, context) => {
    const uId = data.data;
    const userRef = admin.firestore().collection(DB_USERS).doc(context.auth.uid).collection(DB_CONVERSATIONS);
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
            lastMessage: doc.data().lastMessage,
            chatType: chatType
        });
    });
    return chats;
});


exports.getMessages = functions.https.onCall(async(data, context) => {
    const displayName = data.data;
    const chatType = data.chatType;
    const otherUserRef = admin.firestore().collection(DB_USERS);
    console.log('look for displayName:' + displayName);
    const snapshotUsr = await otherUserRef.where('displayName', '==', displayName).get();
    if (snapshotUsr.empty) {
        console.log('No matching documents.');
        return;
    }
    var chatId;
    var otherUserName;
    var otherUserDescr;
    var otherUserPic;
    snapshotUsr.forEach(doc => {
        if (chatType == 0) {
            chatId = context.auth.uid.concat(doc.id);
        } else {
            chatId = doc.id.concat(context.auth.uid);
        }
        otherUserName = doc.data().displayName;
        otherUserDescr = doc.data().description;
        otherUserPic = doc.data().photoURL;
    });

    const chatRef = admin.firestore().collection(DB_DATA).doc(DB_CONVERSATIONS).collection(chatId);
    const snapshot = await chatRef.orderBy('timestamp', 'desc').limit(12).get();
    var messageArray = new Array();
    if (snapshot.empty) {
        console.log('No matching conversation documents.');
        return {
            messageArray,
            otherUserName,
            otherUserDescr,
            otherUserPic
        };
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
    return {
        messageArray,
        otherUserName,
        otherUserDescr,
        otherUserPic
    };
});


exports.getPowerUsers = functions.https.onCall(async(data, context) => {
    const pUserRef = admin.firestore().collection(DB_USERS);
    const snapshotPUsr = await pUserRef.where('type', '==', 1).limit(12).get();
    if (snapshotPUsr.empty) {
        console.log('No matching documents.');
        return;
    }
    var pUserArray = new Array();
    snapshotPUsr.forEach(doc => {
        pUserArray.push({
            elementId: doc.id,
            displayName: doc.data().displayName,
            photoURL: doc.data().photoURL,
            description: doc.data().description
        });
    });
    return pUserArray;
});


exports.setSubmitMessage = functions.https.onCall(async(data, context) => {
    const displayName = data.displayName;
    const text = data.text;
    const chatType = data.chatType;
    const userUid = context.auth.uid;
    const userName = context.auth.token.name;
    const userPic = context.auth.token.picture;
    var otherUserUid;
    var otherUserName;
    var otherUserPic;

    //message length check
    if (text.trim().split(/\s+/).length >= 80) {
        return { retCode: ERR_WORDLIMIT };
    }

    const otherUsrRef = admin.firestore().collection(DB_USERS);
    const ssOtherUsr = await otherUsrRef.where('displayName', '==', displayName).get();
    if (ssOtherUsr.empty) {
        console.log('No matching documents.');
        return { retCode: ERR_OTHR };
    }
    var chatId;
    var receiverSent = 1;
    var limitReached = false;
    ssOtherUsr.forEach(doc => {
        otherUserUid = doc.id;
        otherUserName = doc.data().displayName;
        otherUserPic = doc.data().photoURL;
        if (chatType == 0) {
            chatId = context.auth.uid.concat(doc.id);
        } else {
            chatId = doc.id.concat(context.auth.uid);
            receiverSent = 0;
        }
        //power user limit check
        console.log(doc.data().inboxNo);
        console.log(doc.data().inboxLimit);
        if (doc.data().inboxNo >= doc.data().inboxLimit) {
            console.log("should ret");
            limitReached = true;
        }
    });
    if (limitReached == true) {
        return { retCode: ERR_INBOXLIMIT };
    }


    const senderRef = admin.firestore().collection(DB_USERS).doc(context.auth.uid).collection(DB_CONVERSATIONS).doc(otherUserUid);
    const receiverRef = admin.firestore().collection(DB_USERS).doc(otherUserUid).collection(DB_CONVERSATIONS).doc(context.auth.uid);
    const convRef = admin.firestore().collection(DB_USERS).doc(context.auth.uid).collection(DB_CONVERSATIONS).doc(otherUserUid);
    const convDoc = await convRef.get();
    if (!convDoc.exists) {
        //new
        var setBatch = admin.firestore().batch();
        setBatch.set(senderRef, {
            senderUid: userUid,
            receiverUid: otherUserUid,
            replied: 0,
            displayName: otherUserName,
            photoURL: otherUserPic,
            lastMessage: text,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        setBatch.set(receiverRef, {
            senderUid: userUid,
            receiverUid: otherUserUid,
            replied: 0,
            displayName: userName,
            photoURL: userPic,
            lastMessage: text,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        setBatch.update(admin.firestore().collection(DB_USERS).doc(otherUserUid), {
            inboxNo: admin.firestore.FieldValue.increment(1)
        });

        const ref = admin.firestore().collection(DB_DATA).doc(DB_CONVERSATIONS).collection(chatId).doc()
        const id = ref.id;
        setBatch.set(admin.firestore().collection(DB_DATA).doc(DB_CONVERSATIONS).collection(chatId).doc(id), {
            name: context.auth.token.name,
            text: text,
            profilePicUrl: " ",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return setBatch.commit().then(() => {
            return {
                retCode: NO_ERR,
                id: id
            };
        }).catch(e => {
            return { retCode: ERR_OTHR };
        })


    } else {
        //exists
        var updateBatch = admin.firestore().batch();
        if (receiverSent == 0) {
            //message from pUser
            updateBatch.update(senderRef, {
                "replied": 1,
                lastMessage: text,
                "timestamp": admin.firestore.FieldValue.serverTimestamp()
            });
            updateBatch.update(receiverRef, {
                "replied": 1,
                lastMessage: text,
                "timestamp": admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            //new message to pUser
            updateBatch.update(senderRef, {
                "replied": 0,
                lastMessage: text,
                "timestamp": admin.firestore.FieldValue.serverTimestamp()
            });
            updateBatch.update(receiverRef, {
                "replied": 0,
                lastMessage: text,
                "timestamp": admin.firestore.FieldValue.serverTimestamp()
            });
            updateBatch.update(admin.firestore().collection('users').doc(otherUserUid), {
                inboxNo: admin.firestore.FieldValue.increment(1)
            });

        }
        const ref = admin.firestore().collection(DB_DATA).doc(DB_CONVERSATIONS).collection(chatId).doc()
        const id = ref.id;
        updateBatch.set(admin.firestore().collection(DB_DATA).doc(DB_CONVERSATIONS).collection(chatId).doc(id), {
            name: context.auth.token.name,
            text: text,
            profilePicUrl: " ",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return updateBatch.commit().then(() => {
            return {
                retCode: NO_ERR,
                id: id
            };
        }).catch(e => {
            return { retCode: ERR_OTHR };
        })
    }

});




exports.adminSet = functions.https.onCall(async(data, context) => {
    var access = "79.117.182.138".localeCompare(data.ip);
    if (access == 0) {
        const dataA = {
            name: 'Los Angeles',
            state: 'CA',
            country: 'USA'
        };

        // Add a new document in collection "cities" with ID 'LA'
        const res = await admin.firestore().collection(DB_USERS).doc('33333').set(dataA);
        // [END set_document]

        console.log('Set: ', res);
        return res;
    } else {
        return "error" + data.ip;
    }

});


// TODO(DEVELOPER): Write the blurOffensiveImages Function here.

// TODO(DEVELOPER): Write the sendNotifications Function here.