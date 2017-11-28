var builder = require('botbuilder');
var openExchangeRate = require ("../apis/OpenExchangeRate");

exports.initializeBot = function (connector) {
    
    // Create bot
    var bot = new builder.UniversalBot(connector, function (session) {
        session.send("Hello! I am Toby, the Contoso Bank chatbot");
        session.send("I am still at the testing stage and can only help you with the following:\n- Find exchange rate between two currencies\n- Get Contoso branch information\n- Give feedback about a Contoso branch");
    });

    // Attach LUIS recognizer
    var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/98da5859-9a47-4260-9c55-c0680414913f?subscription-key=4307015bdfd546d9891e69118fb0bd1a&verbose=true&timezoneOffset=0&q=');
    bot.recognizer(recognizer);

    bot.dialog('GetExchangeRateSpecific', function (session, args) {
        //if (!isAttachment(session)) {

            session.send("Retrieving exchange rate...");        
            console.log(args);

            // Retrieve entities from LUIS analysis
            var fromCurrencyType = builder.EntityRecognizer.findEntity(args.intent.entities, 'FromCurrencyType');
            var toCurrencyType = builder.EntityRecognizer.findEntity(args.intent.entities, 'ToCurrencyType');
            var baseCurrencyAmount = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.number');
            console.log(baseCurrencyAmount);            

            // Calculates equivalent value for specific amount of base currency
            if (fromCurrencyType && toCurrencyType && baseCurrencyAmount) {
                if (baseCurrencyAmount.resolution.value <= 0) {
                    session.send("The specified amount of currency to convert cannot be negative. Please try again");
                } 
                else {
                    openExchangeRate.getExchangeRate(toCurrencyType.entity, fromCurrencyType.entity, function(results) {
                        if (results) {
                            var equivalentValue = results.rates[toCurrencyType.entity.toUpperCase()] * baseCurrencyAmount.resolution.value;
                            session.send("The equivalent of %s %s is %s %s", baseCurrencyAmount.resolution.value, fromCurrencyType.entity.toUpperCase(), 
                                equivalentValue, toCurrencyType.entity.toUpperCase());                                            
                        }
                        else {
                            session.send("Either your currency code is invalid or is not supported. Please try again")
                        }
                    });                   
                }
            }
            // Calculates equivalent value for 1 unit of base currency 
            else if (fromCurrencyType && toCurrencyType) {
                openExchangeRate.getExchangeRate(toCurrencyType.entity, fromCurrencyType.entity, function(results) {
                    if (results) {                
                        session.send("The equivalent of 1 %s is %s %s", fromCurrencyType.entity.toUpperCase(), results.rates[toCurrencyType.entity.toUpperCase()], 
                            toCurrencyType.entity.toUpperCase());
                    }
                    else {
                        session.send("Either your currency code is invalid or is not supported. Please try again")
                    }          
                });                    
            }
            else {
                session.send("I didn't get the currency types you specified. Please try again using the standard currency codes (e.g. \"USD\" for US dollars)");
            }
            
        //}
    }).triggerAction({
        matches: 'GetExchangeRateSpecific'
    });
}