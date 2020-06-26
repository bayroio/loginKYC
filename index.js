const express = require('express')
const bodyParser = require('body-parser')
const ngrok = require('ngrok')
const decodeJWT = require('did-jwt').decodeJWT
const { Credentials } = require('uport-credentials')
const transports = require('uport-transports').transport
const message = require('uport-transports').message.util

let endpoint = ''
const app = express();
app.use(bodyParser.json({ type: '*/*' }));

// Address Identidad: 0xbfef8f1e74fd44c2e1a50175310499bdedfc10f7
// Address Calculadora: 0xc7486a3fedf61856c550117735d251d37fc3d1ac
// Address Prueba: 0xcb5c7c92f78a58d60fa74f1317948ce809de09ed

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
    const mnid = require('mnid');
    const txObject = { 
      to: mnid.encode({
        address: '0xbfef8f1e74fd44c2e1a50175310499bdedfc10f7',
        network: '0x4'
      }),
      //fn: "pushDos(uint32 13, string 'Azael Ruiz')", // Ejemplo envio Int y String
      //fn: "pushDireccion(address 0xcb5c7c92f78a58d60fa74f1317948ce809de09ed)", //Ejemplo envio Address
      //fn: "pushNumero(uint32 32)", //Ejemplo Envio Numerico
      //fn: "sumar2()", // Llamado de una funcion sin parametros
      fn: "updateUser(address "+creds.address+", string 'Alan', string 'Lerdo', uint16 32, string '111')",
    };
    credentials.createTxRequest(txObject, {callbackUrl: `${endpoint}/txcallback`, callback_type: 'post'}).then(attestation => {
      console.log(`Encoded JWT sent to user: ${attestation}`)
      return push(attestation)  // *push* the notification to the user's uPort mobile app.
    }).then(res => {
      console.log(res)
      console.log('Push notification sent and should be recieved any moment...');
      console.log('Accept the push notification in the uPort mobile application');
    });
    
  });
});

app.post('/txcallback', (req, res) => {
  console.log("Txcallback",res);
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
