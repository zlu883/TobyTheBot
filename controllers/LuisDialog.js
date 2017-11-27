var builder = require('botbuilder');
// Some sections have been omitted

exports.startDialog = function (bot) {
    
    var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/d6fdac81-dbcc-46c0-ab6b-eb78bd0da369?subscription-key=4307015bdfd546d9891e69118fb0bd1a&spellCheck=true&verbose=true&timezoneOffset=12.0&q=');

    bot.recognizer(recognizer);

    bot.dialog('GetCalories', function (session, args) {
        //if (!isAttachment(session)) {
            console.log(args);
            console.log(session);
            // Pulls out the food entity from the session if it exists
            var foodEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Food');

            // Checks if the for entity was found
            if (foodEntity) {
                session.send('Calculating calories in %s...', foodEntity.entity);
               // Here you would call a function to get the foods nutrition information

            } else {
                session.send("No food identified! Please try again");
            }
        //}
    }).triggerAction({
        matches: 'GetCalories'
    });
}