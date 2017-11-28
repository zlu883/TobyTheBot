var restify = require('restify');
var builder = require('botbuilder');
var botController = require('./controllers/BotController');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    //appId: "c380f179-1f19-4c2d-879c-8ad2d0c8339d",
    //appPassword: "lxvuXY128ypaPMJYN50?=@?"
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

botController.initializeBot(connector);

