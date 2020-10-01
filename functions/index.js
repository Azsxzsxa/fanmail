const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

//DB REFS
const DB_USERS = "users";
const DB_CONVERSATIONS = "conversations";
const DB_DATA = "data";
const DB_MESSAGES = "messages";

//RET CODES
const NO_ERR = 0;
const ERR_OTHR = 100;
const ERR_WRITEDB = 103;

const ERR_WORDLIMIT = 101;
const ERR_INBOXLIMIT = 102;

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
    const userRef = admin.firestore().collection(DB_USERS).doc(context.auth.uid).collection(DB_CONVERSATIONS);
    const snapshot = await userRef.orderBy('timestamp', 'desc').limit(12).get();
    var chats = new Array();
    snapshot.forEach(doc => {
        chats.push({
            elementId: doc.id,
            userName: doc.data().displayName,
            photoURL: doc.data().photoURL,
            replied: doc.data().replied,
            timestamp: doc.data().timestamp,
            lastMessage: doc.data().lastMessage,
            chatType: doc.data().chatType
        });
    });
    return chats;
});


exports.getMessages = functions.https.onCall(async(data, context) => {
    const displayName = data.data;
    const chatType = data.chatType;
    const userUid = context.auth.uid;
    const otherUserRef = admin.firestore().collection(DB_USERS);
    console.log('look for displayName:' + displayName);
    const snapshotUsr = await otherUserRef.where('displayName', '==', displayName).get();
    if (snapshotUsr.empty) {
        console.log('No matching documents.');
        return;
    }

    var otherUserName;
    var otherUserDescr;
    var otherUserPic;
    var otherUserUid;
    snapshotUsr.forEach(doc => {
        otherUserUid = doc.id;
        otherUserName = doc.data().displayName;
        otherUserDescr = doc.data().description;
        otherUserPic = doc.data().photoURL;
    });

    const chatRef = admin.firestore().collection(DB_USERS).doc(userUid).collection(DB_CONVERSATIONS);
    var messageArray = new Array();
    if (chatType == 0) {
        const snapshot = await chatRef.where('receiverUid', '==', otherUserUid)
            .get();
        if (snapshot.empty) {
            console.log('No matching conversation documents.');
            return ERR_OTHR;
        }
        let messageRef;
        snapshot.forEach(doc => {
            if (doc.data().chatType == 0) {
                messageRef = chatRef.doc(doc.id).collection(DB_MESSAGES);
            }
        });

        const messageSnapShot = await messageRef
            .orderBy('timestamp', 'desc')
            .limit(12)
            .get();

        if (messageSnapShot.empty) {
            messageArray,
            otherUserName,
            otherUserDescr,
            otherUserPic
        }
        messageSnapShot.forEach(doc => {
            messageArray.push({
                elementId: doc.id,
                timestamp: doc.data().timestamp,
                displayName: doc.data().name,
                text: doc.data().text,
                photoURL: doc.data().profilePicUrl
            });
        });

    } else {
        //chat type 1
        const snapshot = await chatRef.where('senderUid', '==', otherUserUid)
            .get();
        if (snapshot.empty) {
            console.log('No matching conversation documents.');
            return ERR_OTHR;
        }
        let messageRef
        snapshot.forEach(doc => {
            if (doc.data().chatType == 1) {
                messageRef = chatRef.doc(doc.id).collection(DB_MESSAGES);
            }
        });

        const messageSnapShot = await messageRef
            .orderBy('timestamp', 'desc')
            .limit(12)
            .get();

        if (messageSnapShot.empty) {
            messageArray,
            otherUserName,
            otherUserDescr,
            otherUserPic
        }
        messageSnapShot.forEach(doc => {
            messageArray.push({
                elementId: doc.id,
                timestamp: doc.data().timestamp,
                displayName: doc.data().name,
                text: doc.data().text,
                photoURL: doc.data().profilePicUrl
            });
        });
    }
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

    var limitReached = false;
    ssOtherUsr.forEach(doc => {
        otherUserUid = doc.id;
        otherUserName = doc.data().displayName;
        otherUserPic = doc.data().photoURL;

        //power user limit check
        if (doc.data().type == 1) {
            if (doc.data().inboxNo >= doc.data().inboxLimit) {
                limitReached = true;
            }
        }
    });
    if (limitReached == true) {
        return { retCode: ERR_INBOXLIMIT };
    }


    let userMessagesId;
    let otherUserMessageId;
    let chatExists = false;
    const userRef = admin.firestore().collection(DB_USERS).doc(userUid).collection(DB_CONVERSATIONS);
    const otherUserRef = admin.firestore().collection(DB_USERS).doc(otherUserUid).collection(DB_CONVERSATIONS);
    if (chatType == 0) {
        console.log("CHAT TYPE = 0");
        const userChatQuery = await userRef.where('receiverUid', '==', otherUserUid).where("chatType", "==", 0).get();
        if (userChatQuery.empty) {
            chatExists = false;
        } else {
            userChatQuery.forEach(doc => {
                chatExists = true;
                userMessagesId = doc.id;
            });
        }

        const otherUserChatQuery = await otherUserRef.where('senderUid', '==', userUid).where("chatType", "==", 1).get();
        if (otherUserChatQuery.empty) {
            chatExists = false;
        } else {
            otherUserChatQuery.forEach(doc => {
                chatExists = true;
                otherUserMessageId = doc.id;
            });
        }



    } else {
        console.log("CHAT TYPE = 1");
        const userChatQuery = await userRef.where('senderUid', '==', otherUserUid).where("chatType", "==", 1).get();
        if (userChatQuery.empty) {
            chatExists = false;
        } else {
            userChatQuery.forEach(doc => {
                chatExists = true;
                userMessagesId = doc.id;
            });
        }

        const otherUserChatQuery = await otherUserRef.where('receiverUid', '==', userUid).where("chatType", "==", 0).get();
        if (otherUserChatQuery.empty) {
            chatExists = false;
        } else {
            otherUserChatQuery.forEach(doc => {
                chatExists = true;
                otherUserMessageId = doc.id;
            });
        }

    }

    console.log("ChAT EXISTS:" + chatExists);
    if (chatExists) {
        //exists
        const userMessageRef = userRef.doc(userMessagesId);
        const otherUserMessageRef = otherUserRef.doc(otherUserMessageId);
        var updateBatch = admin.firestore().batch();
        if (chatType == 1) {
            //message from pUser
            updateBatch.update(userMessageRef, {
                "replied": 1,
                lastMessage: text,
                "timestamp": admin.firestore.FieldValue.serverTimestamp()
            });
            updateBatch.update(otherUserMessageRef, {
                "replied": 1,
                lastMessage: text,
                "timestamp": admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            //new message to pUser
            updateBatch.update(userMessageRef, {
                "replied": 0,
                lastMessage: text,
                "timestamp": admin.firestore.FieldValue.serverTimestamp()
            });
            updateBatch.update(otherUserMessageRef, {
                "replied": 0,
                lastMessage: text,
                "timestamp": admin.firestore.FieldValue.serverTimestamp()
            });
            updateBatch.update(admin.firestore().collection('users').doc(otherUserUid), {
                inboxNo: admin.firestore.FieldValue.increment(1)
            });

        }

        const senderRefMessage = userRef.doc(userMessagesId).collection(DB_MESSAGES);
        const senderRefMessageDoc = senderRefMessage.doc();
        const senderMsgid = senderRefMessageDoc.id;
        updateBatch.set(senderRefMessage.doc(senderMsgid), {
            name: context.auth.token.name,
            text: text,
            profilePicUrl: " ",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        const receiverRefMessage = otherUserRef.doc(otherUserMessageId).collection(DB_MESSAGES);
        const receiverRefMessageDoc = receiverRefMessage.doc();
        const receiverMsgid = receiverRefMessageDoc.id;
        updateBatch.set(receiverRefMessage.doc(receiverMsgid), {
            name: context.auth.token.name,
            text: text,
            profilePicUrl: " ",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return updateBatch.commit().then(() => {
            return {
                retCode: NO_ERR,
                id: senderMsgid
            };
        }).catch(e => {
            console.log(e);
            return { retCode: ERR_WRITEDB };
        })
    } else {
        //chat doesn't exist
        const userRefConvDoc = userRef.doc();
        const userConvid = userRefConvDoc.id;
        var setBatch = admin.firestore().batch();
        setBatch.set(userRef.doc(userConvid), {
            senderUid: userUid,
            receiverUid: otherUserUid,
            replied: 0,
            displayName: otherUserName,
            photoURL: otherUserPic,
            lastMessage: text,
            chatType: 0,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        const otherUserRefConvDoc = otherUserRef.doc();
        const otherUserreceiverConvid = otherUserRefConvDoc.id;
        setBatch.set(otherUserRef.doc(otherUserreceiverConvid), {
            senderUid: userUid,
            receiverUid: otherUserUid,
            replied: 0,
            displayName: userName,
            photoURL: userPic,
            lastMessage: text,
            chatType: 1,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        if (chatType == 0) {
            setBatch.update(admin.firestore().collection(DB_USERS).doc(otherUserUid), {
                inboxNo: admin.firestore.FieldValue.increment(1)
            });
        }

        const senderRefMessage = userRef.doc(userConvid).collection(DB_MESSAGES);
        const senderRefMessageDoc = senderRefMessage.doc();
        const senderMsgid = senderRefMessageDoc.id;
        setBatch.set(senderRefMessage.doc(senderMsgid), {
            name: context.auth.token.name,
            text: text,
            profilePicUrl: " ",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        const receiverRefMessage = otherUserRef.doc(otherUserreceiverConvid).collection(DB_MESSAGES);
        const receiverRefMessageDoc = receiverRefMessage.doc();
        const receiverMsgid = receiverRefMessageDoc.id;
        setBatch.set(receiverRefMessage.doc(receiverMsgid), {
            name: context.auth.token.name,
            text: text,
            profilePicUrl: " ",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return setBatch.commit().then(() => {
            return {
                retCode: NO_ERR,
                id: senderMsgid
            };
        }).catch(e => {
            console.log(e);
            return { retCode: ERR_WRITEDB };
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