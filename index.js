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
console.log(credentials)
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
   // vc: ['/ipfs/QmWE2pDhzcaa6jN1YQCgisBtBqF5uUCeQrfVAvGqoX4BEx'],
    callbackUrl: endpoint + '/callback'
  }).then(disclosureRequestJWT => {
    console.log(decodeJWT(disclosureRequestJWT))  //log request token to console
    
    //Create QR code with the disclosure request.
    const uri = message.paramsToQueryString(message.messageToURI(disclosureRequestJWT), {callback_type: 'post'})
    const qr =  transports.ui.getImageDataURI(uri)
    res.send(`<div><img src="${qr}"/></div>`)
  })
})

app.post('/callback', (req, res) => {
  const access_token = req.body.access_token
  credentials.authenticateDisclosureResponse(access_token).then(userProfile => {
    console.log({userProfile}, "\n\n")

    const attestation = {
      sub: userProfile.did,
      claim: { 
        iAgrinetCIIAN:{
          name: userProfile.name,//'Test User', 
          profile: 'productor',
          kyc: 'passed'
        }
      }
    }

    credentials.createVerification(attestation)
    .then( credential => {
      //Push credential to user
      const pushTransport = transports.push.send(userProfile.pushToken, userProfile.boxPub)
      return pushTransport(credential)
    })
    .then(pushData => {
      console.log("Pushed to user: "+JSON.stringify(pushData))
      
    })

  })
})

// run the app server and tunneling service
const server = app.listen(8088, () => {
  ngrok.connect(8088).then(ngrokUrl => {
    endpoint = ngrokUrl
    console.log(`Login Service running, open at ${endpoint}`)
  }).catch(error => console.error(error))
})
