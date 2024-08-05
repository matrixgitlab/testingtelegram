const MTProto = require('@mtproto/core');
const prompts = require('prompts');
const fs = require('fs');
const path = require('path');
const { send } = require('process');
const { extractAndResolveUrls } = require('./textmsgurlmodif.js');
const { pingGlitchForever } = require("./wakeupPing.js");
const express = require('express');
const { Console } = require('console');
const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Hello World!');
  (async () => {
    try {
      // Demander à l'utilisateur d'entrer son numéro de téléphone
      //const { phone_number } = await prompts({ type: 'text', name: 'phone_number', message: 'Enter your phone number:' });
      const phone_number = '+212617987325';
      const mtproto = initMTProto(phone_number);
  
      let needLogin = true;
      try {
        // Vérifier si la session existe déjà
        const me = await call(mtproto, 'users.getFullUser', { id: { _: 'inputUserSelf' } });
        const user = me.users;
        console.log('Already logged in as', user.phone);
        needLogin = false;
      } catch (error) {
        // Si l'erreur est liée à une session invalide, afficher un message approprié
        if (error.error_code === 401) {
          console.log('Session invalid, proceeding to login...');
        } else {
          throw error;
        }
      }
  
      if (needLogin) {
        await login(mtproto, phone_number);
        console.log('Successfully logged in!');
      }
  
      // Votre logique après connexion
      console.log('You are now connected to Telegram!');
   
      // Commencer à écouter les messages reçus
      mtproto.updates.on('updates', async (updateInfo) => {
          
          for (const update of updateInfo.updates) {
            if (update._ === 'updateNewChannelMessage') {
              
              try {
                const message = update.message;
                const readmsg = message.message;
                // Extraction des informations de la photo
                const photo = message.media.photo;
                const photoId = photo.id;
                const photoAccessHash = photo.access_hash;
                const fileReference = photo.file_reference;
                  const { modifiedText, finalPart, replacedUrl } = await extractAndResolveUrls(readmsg);
                  //console.log('updateNewMessage : ', message);
                  console.log('New channel message');//, readmsg
                //await sendMessageToGroup('2161484717', '7758411080155062443', modifiedText, mtproto);
                  await sendMediaMessageToGroup('2161484717', '7758411080155062443', photoAccessHash, photoId, fileReference, modifiedText, mtproto);
    
  
              } catch (error) {
                console.error('Error extracting and resolving URLs:', error.message);
              }
              //console.log('New channel message');//, readmsg
              
            } else if (update._ === 'updateNewMessage') {
  
              try {
                const message = update.message;
              const readmsg = message.message;
              // Extraction des informations de la photo
              const photo = message.media.photo;
              const photoId = photo.id;
              const photoAccessHash = photo.access_hash;
              const fileReference = photo.file_reference;
                const { modifiedText, finalPart, replacedUrl } = await extractAndResolveUrls(readmsg);
                //console.log('updateNewMessage : ', message);
                console.log('New channel message');//, readmsg
              //await sendMessageToGroup('2161484717', '7758411080155062443', modifiedText, mtproto);
                await sendMediaMessageToGroup('2161484717', '7758411080155062443', photoAccessHash, photoId, fileReference, modifiedText, mtproto);
  
  
              } catch (error) {
                console.error('Error extracting and resolving URLs:', error.message);
              }
             
              console.log('Message has Media we can\'t make transfer');//, updateInfo
            }
          }
          
        });
      
  
       /* mtproto.updates.on('updateShortMessage', async (updateInfo) => {
              const readmsg = updateInfo.message;
              try {
                const { modifiedText, finalPart, replacedUrl } = await extractAndResolveUrls(readmsg);
                console.log(replacedUrl);
                console.log('New channel message');//, readmsg
                sendMessageToGroup('2161484717', '7758411080155062443', modifiedText, mtproto);
              } catch (error) {
                console.error('Error extracting and resolving URLs:', error.message);
              }
              console.log('Short message received:');//, readmsg
              
          
        });*/
      
        mtproto.updates.on('updateNewMessage', (updateInfo) => {
          console.log('New message received');//, updateInfo
        });
      
        console.log('Listening for updates...');
  
  
    } catch (error) {
      console.error('Error:', error);
    }
  })();
  
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// Charger la configuration
//const config = JSON.parse(fs.readFileSync('mtproto.json'));

//const api_id = config.api_id;
//const api_hash = config.api_hash;
require('dotenv').config();
const api_id = process.env.API_ID;
const api_hash = process.env.API_HASH;

// Fonction pour obtenir le chemin du fichier de session pour un utilisateur spécifique
const getSessionFilePath = (phone_number) => {
  return path.join(__dirname, `./sessions/${phone_number}.json`);
};

// Fonction pour lire la session depuis le fichier
const readSession = (phone_number) => {
  const sessionFilePath = getSessionFilePath(phone_number);
  try {
    return JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
  } catch (error) {
    return {};
  }
};

// Fonction pour écrire la session dans le fichier
const writeSession = (phone_number, session) => {
  const sessionFilePath = getSessionFilePath(phone_number);
  fs.mkdirSync(path.dirname(sessionFilePath), { recursive: true });
  fs.writeFileSync(sessionFilePath, JSON.stringify(session));
};

// Initialisation de MTProto avec les options de stockage
const initMTProto = (phone_number) => {
  const sessionFilePath = getSessionFilePath(phone_number);

  return new MTProto({
    api_id,
    api_hash,
    storageOptions: {
      path: sessionFilePath,
      get: key => {
        const session = readSession(phone_number);
        return session[key];
      },
      set: (key, value) => {
        const session = readSession(phone_number);
        session[key] = value;
        writeSession(phone_number, session);
      }
    }
  });
};

// Fonction pour gérer les erreurs
const handleError = ({ error_code, error_message }, mtproto) => {
  switch (error_code) {
    case 303:
      const [type, dcIdAsString] = error_message.split('_MIGRATE_');
      const dcId = Number(dcIdAsString);
      mtproto.setDefaultDc(dcId);
      return true;
    default:
      return false;
  }
};

const call = async (mtproto, method, params, options = {}) => {
  try {
    return await mtproto.call(method, params, options);
  } catch (error) {
    if (handleError(error, mtproto)) {
      return call(mtproto, method, params, options);
    }
    throw error;
  }
};

const login = async (mtproto, phone_number) => {
  const { phone_code_hash } = await call(mtproto, 'auth.sendCode', { phone_number, settings: { _: 'codeSettings' } });
  const { code } = await prompts({ type: 'text', name: 'code', message: 'Enter the code you received:' });
  const signInResult = await call(mtproto, 'auth.signIn', { phone_number, phone_code_hash, phone_code: code });

  if (signInResult._ === 'auth.authorizationSignUpRequired') {
    const { first_name, last_name } = await prompts([
      { type: 'text', name: 'first_name', message: 'Enter your first name:' },
      { type: 'text', name: 'last_name', message: 'Enter your last name:' }
    ]);
    await call(mtproto, 'auth.signUp', { phone_number, phone_code_hash, phone_code: code, first_name, last_name });
  }
};

///// Envoie de message Photo ///////
// Fonction pour envoyer un message média à un groupe
const sendMediaMessageToGroup = async (chatId, channelAccessHash, photoAccessHash, photoId, fileReference, text, mtproto) => {
  try {
    const result = await mtproto.call('messages.sendMedia', {
      peer: {
        _: 'inputPeerChannel',
        channel_id: chatId,
        access_hash: channelAccessHash
      },
      media: {
        _: 'inputMediaPhoto',
        id: {
          _: 'inputPhoto',
          id: photoId,
          access_hash: photoAccessHash,
          file_reference: fileReference
        },
        caption: 'Here is the photo you requested!'
      },
      message: text, // Texte du message
      random_id: Math.floor(Math.random() * 0xffffffff)
    });

    console.log('Message Media sent Successfully');
  } catch (error) {
    console.error('Error sending media message:', error);
  }
};

async function processUrls(text) {
  try {
    const result =  await extractAndResolveUrls(text);
    /*console.log('Modified Text:', result.modifiedText);
    console.log('Final Part:', result.finalPart);*/
    const textresult = result.modifiedText;
    return {textresult};
  } catch (error) {
    console.error('Error:', error.message);
  }
  
}


// ping glitch forever
// not needed of your server is always on by default
pingGlitchForever();
