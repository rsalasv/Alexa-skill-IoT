const fetch = require('node-fetch')

module.exports = {
    fetchAPI(action, code){
        const endpoint = 'http://189.211.188.70:16000/';
        // List of actors with pictures and date of birth
        const query  = action==="add"?"registerCommand/comando":"sendCommand/"+code.toString();
        //const query = ""
        const url = endpoint + query;
        //const headers = {};
        console.log(url);

        async function getJsonResponse(url){
            const res = await fetch(url);
            return await res.json();
        }

        return getJsonResponse(url).then((result) => {
            return result;
        }).catch((error) => {
            return null;
        });
    },
    callDirectiveService(handlerInput, msg) {
        // Call Alexa Directive Service.
        const {requestEnvelope} = handlerInput;
        const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();
        const requestId = requestEnvelope.request.requestId;
        const {apiEndpoint, apiAccessToken} = requestEnvelope.context.System;

        // build the progressive response directive
        const directive = {
          header: {
            requestId,
          },
          directive:{
              type: 'VoicePlayer.Speak',
              speech: msg
          },
        };
        // send directive
        return directiveServiceClient.enqueue(directive, apiEndpoint, apiAccessToken);
    }
}