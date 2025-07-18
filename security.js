// Middleware to check the API Key
require('dotenv').config(); // Load environment variables from .env file

var crypto = require('crypto');

let apiKey = null;
let apiKeys = new Map();

function getNewApiKey(email){
  let newApiKey = crypto.randomBytes(6).toString('hex');
  apiKeys.set(email, newApiKey);
  displayApiKeys();
  return newApiKey;
}

function displayApiKeys(){
  console.log("apiKeys:");
  for(let entry of apiKeys.entries()){
    console.log(entry)
  }
}

function setApiKey(){
  apiKey = process.env.API_KEY;
  console.log("setApiKey");
  console.log("argv " + process.argv);

  if(process.argv[2] != null){
      if(process.argv[2].indexOf('=') >= 0){
          apiKey = process.argv[2].substring(process.argv[2].indexOf('=')+1,process.argv[2].length );
      }
  }
  if(apiKey && apiKey.length >0){
      apiKeys.set("default", apiKey );
      displayApiKeys();
  }else{
      console.log("apiKey has no value. Please provide a value through the API_KEY env var or --api-key cmd line parameter.");
      process.exit(0);
  }  
}


function checkApiKey(req, res, next) {
    const apiKeyInput = req.query.api_key || req.headers['x-api-key'];
    // get the key from environment variable or hardcoded for simplicity
    // In production, you should use environment variables for sensitive data
    const apiKey = process.env.API_KEY;

    if (!apiKeyInput){
        res.status(401).json({ message: 'Unauthorized: Missing API key' });
        return;
    }

    let keyValid = false;    
    for( let value of apiKeys.values()){
      if (apiKeyInput === value){
        keyValid = true;
      }
    }
    if (!keyValid ) {
      return res.status(403).json({ message: 'Forbidden: Invalid API key' });
    }


    next();
};

setApiKey();

module.exports = { getNewApiKey, setApiKey, checkApiKey };