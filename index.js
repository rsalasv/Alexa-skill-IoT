/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */

const Alexa = require('ask-sdk-core');
const fetchAPI = require('./fetch.js');

var persistenceAdapter = getPersistenceAdapter()



function getPersistenceAdapter() {
    // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
    function isAlexaHosted() {
        return process.env.S3_PERSISTENCE_BUCKET ? true : false;
    }
    const tableName = 'happy_birthday_table';
    if(isAlexaHosted()) {
        const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
        return new S3PersistenceAdapter({ 
            bucketName: process.env.S3_PERSISTENCE_BUCKET
        });
    } else {
        // IMPORTANT: don't forget to give DynamoDB access to the role you're to run this lambda (IAM)
        const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
        return new DynamoDbPersistenceAdapter({ 
            tableName: tableName,
            createTable: true
        });
    }
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome, you can add, remove, turn on or turn off any item. Which would you like to try?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    async handle(handlerInput) {
        
        //const attributesManager = ;
        //const requestAttributes = attributesManager.requestAttributes()
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()
        const intent = handlerInput.requestEnvelope.request.intent
        const action = intent.slots.action.value
        const item = intent.slots.item.value
        
        let speakText = ""
        let code = 0;
        let itemExist = false
        for(let i = 0; i < sessionAttributes["item"].length; i++)
             itemExist = sessionAttributes["item"][i]["item"] === item
        
        //console.log(sessionAttributes["item"].length)
        
        if (action === "add"){
            if(!itemExist){
                const response = await fetchAPI.fetchAPI(action, code);
                //TODO sacar el código del request y añadirlo a una variable
                //console.log(JSON.stringify(response["userId"])) 
                console.log(item)
                sessionAttributes["item"].push({"item":item, "code":code})
                speakText = item + " has been added"
            }else
                speakText = item + " already exist in the list of items"
        }else if(itemExist){
            if(action === "remove"){
                for(let i = 0; i < sessionAttributes["item"].length; i++){
                    if(sessionAttributes["item"][i]["item"] === item){
                        sessionAttributes["item"].splice(i, 1)
                    }
                }
                speakText = "Item removed"
            }else {
                if(action === "turn on"){
                    speakText = "turning on " + item
                }else if(action === "turn off"){
                    speakText = "turning off " + item
                }
                
                let index = null;
                for(let i = 0; i < sessionAttributes["item"].length; i++){
                    if(sessionAttributes["item"][i]["item"] === item){
                        index = i;
                    }
                }
                console.log(sessionAttributes["item"][index]["code"])
                const response = await fetchAPI.fetchAPI(action, sessionAttributes["item"][index]["code"]);
            }
         
        }else if(!itemExist)
            speakText = "That item hasn't been added, please add it before using it with the skill"
        
        return handlerInput.responseBuilder
            .speak(speakText)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/*const APIReqIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'APIReqIntent';
    },
    async handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const sessionAttributes = attributesManager.getSessionAttributes()
        const intent = handlerInput.requestEnvelope.request.intent
        const action = intent.slots.action.value
        const item = intent.slots.item.value
        const {requestEnvelope, serviceClientFactory} = handlerInput;
        
        try {
            // call the progressive response service
            await fetchAPI.callDirectiveService(handlerInput, handlerInput.t('Processing'));
          } catch (error) {
            // if it fails we can continue, but the user will wait without progressive response
            console.log("Progressive directive error : " + error);
        }

        const response = await fetchAPI.fetchAPI(item, action);

        let speechText = handlerInput.t('API Error, try again later');
        console.log("hi, intent runing")
        console.log(speechText)
        if(response) {
            console.log(JSON.stringify(response));
            const results = response.results.bindings;
            //speechText = handlerInput.t('');
            /*results.forEach((person, index) => {
                console.log(person);
                if(index === Object.keys(results).length - 2)
                    speechText += person.humanLabel.value + handlerInput.t('CONJUNCTION_MSG');
                else
                    speechText += person.humanLabel.value + '. '
            });*/
        /*}else
            speechText = "No API response"
        //speechText += handlerInput.t('HELP_MSG');
        speechText = "Hello"
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};*/

const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        if(handlerInput.requestEnvelope.session['new']){ //is this a new session?
            const {attributesManager} = handlerInput;
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            //copy persistent attribute to session attributes
            handlerInput.attributesManager.setSessionAttributes(persistentAttributes);
        }
    }
};

const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession);//is this a session end?
        if(shouldEndSession || handlerInput.requestEnvelope.request.type === 'SessionEndedRequest') { // skill was stopped or timed out            
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        }
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withPersistenceAdapter(persistenceAdapter)
    .addRequestInterceptors(LoadAttributesRequestInterceptor)
    .addResponseInterceptors(SaveAttributesResponseInterceptor)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();