const express = require('express')
const bodyParser = require('body-parser')
const ngrok = require('ngrok')
const decodeJWT = require('did-jwt').decodeJWT
const { Credentials } = require('uport-credentials')
const transports = require('uport-transports').transport
const message = require('uport-transports').message.util

let endpoint = ''
const app = express();
app.use(bodyParser.json({ type: '*/*' }))

//const identity = Credentials.createIdentity();
//console.log(identity)
//setup Credentials object with newly created application identity.
/*const credentials = new Credentials({
  appName: 'Ahoj Network',
  network: "rinkeby",
  did: identity.did,
  privateKey: identity.privateKey
})*/
//console.log(credentials)
const credentials = new Credentials({
  appName: 'Ahoj Network',
  network: "rinkeby",
  did: 'did:ethr:0xd7dcf16be661035df87833e0491e35728ba681fc',
  privateKey: 'a7dec28ec91be5783f8a5ff0e912347bd71a85c73ad42d5fc1201e0b87f205fa'
})

app.get('/', (req, res) => {
  //Create a new disclosure request, requesting the push notification token and a new key
  credentials.createDisclosureRequest({
    requested: ["name"],
    notifications: true,
    accountType: 'keypair',
    network_id: '0x4',
    callbackUrl: endpoint + '/callback'
  }).then(requestToken => {
    console.log(decodeJWT(requestToken));  //log request token to console
    const uri = message.paramsToQueryString(message.messageToURI(requestToken), {callback_type: 'post'});
    const qr =  transports.ui.getImageDataURI(uri);
    res.send(`<div><img src="${qr}"/></div>`)
  });
});

app.post('/callback', (req, res) => {
  console.log("Callback hit");
  const jwt = req.body.access_token;
  credentials.authenticateDisclosureResponse(jwt).then(creds => {
    // take this time to perform custom authorization steps... then,
    // set up a push transport with the provided 
    // push token and public encryption key (boxPub)
    console.log("Creds",creds);
    const push = transports.push.send(creds.pushToken, creds.boxPub);
    //0xcc9bf465d521b09b00c5c4e7207c00f37c865c95
    const mnid = require('mnid');
    
    const abi = [{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":true,"inputs":[],"name":"contractOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getResultado","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"uint16","name":"_x","type":"uint16"},{"internalType":"uint16","name":"_y","type":"uint16"}],"name":"multiplicar","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"internalType":"uint16","name":"_x","type":"uint16"},{"internalType":"uint16","name":"_y","type":"uint16"}],"name":"sumar","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"sumar2","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"payable":false,"stateMutability":"nonpayable","type":"function"}];
    const contractAddress = '0xc7486a3fedf61856c550117735d251d37fc3d1ac'; //'0xbfef8f1e74fd44c2e1a50175310499bdedfc10f7'; 
    const addressEncode = mnid.encode({
      network: '0x4',
      address: contractAddress
    })
    const myContract = credentials.contract(abi).at(contractAddress);
    // creates a request for the user to call the transfer() function on the smart contract
    console.log("Contrato",myContract);
    console.log("Creds",creds);
    myContract.sumar2().then(txRequestToken => {
      console.log("txRequestToken:",txRequestToken);
      credentials.createTxRequest(txRequestToken, {callbackUrl: `${endpoint}/txcallback`, callback_type: 'post'}).then(attestation => {
        console.log(`Encoded JWT sent to user: ${attestation}`)
        return push(attestation)  // *push* the notification to the user's uPort mobile app.
      }).then(res => {
        console.log(res)
        console.log('Push notification sent and should be recieved any moment...');
        console.log('Accept the push notification in the uPort mobile application');
      });
    });
  
app.post('/txcallback', (req, res) => {
  //console.log("Txcallback",res);
});
    
   // Esto si funciona para poder mandar ether de una cuenta a otra
   /*
   const txObject = {
    to: mnid.encode({
      network: '0x4',
      address: '0xcc9bf465d521b09b00c5c4e7207c00f37c865c95'
      }),
      value: '10000000000000000',
    };
    credentials.createTxRequest(txObject, {callbackUrl: `${endpoint}/txcallback`, callback_type: 'post'}).then(attestation => {
      console.log(`Encoded JWT sent to user: ${attestation}`)
      return push(attestation)  // *push* the notification to the user's uPort mobile app.
    }).then(res => {
      console.log(res)
      console.log('Push notification sent and should be recieved any moment...');
      console.log('Accept the push notification in the uPort mobile application');
    });
    */
    /*
    const txObject = { 
      to: mnid.encode({
        address: '0xcc9bf465d521b09b00c5c4e7207c00f37c865c95',
        network: '0x4'
      }),
      fn: "updateUser(address '"+creds.address+"', string memory 'Alan', string memory 'Lerdo', uint16 '32', string memory '111')", 
      appName: 'PoC_CIIANFirmado',
    };
    */
  });
});

/*
app.post('/callback', (req, res) => {
  const access_token = req.body.access_token
  credentials.authenticateDisclosureResponse(access_token).then(userProfile => {
    console.log("Ya se Logeo \n\n");
    console.log({userProfile}, "\n\n");
    /*const attestation = {
      sub: userProfile.did,
      claim: { 
        Ahoj_Network:{
          name: userProfile.name,//'Test User', 
          profile: 'productor',
          profileImage: {"/": "/ipfs/QmTZ7QdGKU2Dr14z4RhodKoPj4FADvYkGeErqripvLAXs8"},
          bannerImage: {"/": "/ipfs/QmZq8Kr7pST2zoUacgLgEWNeXt1Y9L7mqs73FyXpNvvTTU"},
          kyc: 'passed'
        }
      }
    };
    */
    /*
    credentials.createVerification(attestation)
    .then( credential => {
      //Push credential to user
      const pushTransport = transports.push.send(userProfile.pushToken, userProfile.boxPub)
      return pushTransport(credential)
    })
    .then(pushData => {
      console.log("Pushed to user: "+JSON.stringify(pushData))
      
    });
  });
});
*/

// run the app server and tunneling service
const server = app.listen(8088, () => {
  ngrok.connect(8088).then(ngrokUrl => {
    endpoint = ngrokUrl
    console.log(`Login Service running, open at ${endpoint}`)
  }).catch(error => console.error(error))
})
