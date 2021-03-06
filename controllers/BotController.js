var builder = require('botbuilder');
var openExchangeRate = require ("../apis/OpenExchangeRate");
var contosoDatabase = require ("../apis/ContosoDatabase");
var customVision = require ("../apis/CustomVision");

exports.initializeBot = function (connector) {
        
    // Create bot
    var bot = new builder.UniversalBot(connector, function (session) {
        
        // Default dialog for handling all unrecognized user inputs
        session.message.address.bot.name = "Toby";
        session.send("Hello! I am Toby, the Contoso Bank chatbot");
        session.send("I am still at the testing stage and can only help you with the following:\n\n- Find exchange rate between two currencies (e.g. \"Convert 100 USD to EUR\")\n- Give / view feedback about Contoso branches");
    });

    // Attach LUIS recognizer
    var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/98da5859-9a47-4260-9c55-c0680414913f?subscription-key=4307015bdfd546d9891e69118fb0bd1a&verbose=true&timezoneOffset=0&q=');
    bot.recognizer(recognizer);

    // Dialog for retrieving exchange rates
    bot.dialog('GetExchangeRateSpecific', function (session, args) {
        
        session.message.address.bot.name = "Toby";        
        session.send("Retrieving exchange rate...");        

        // Retrieve entities from LUIS analysis
        var fromCurrencyType = builder.EntityRecognizer.findEntity(args.intent.entities, 'FromCurrencyType');
        var toCurrencyType = builder.EntityRecognizer.findEntity(args.intent.entities, 'ToCurrencyType');
        var baseCurrencyAmount = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.number');

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
                        session.send("Either your currency code is invalid or is not supported. Please try again");
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
                    session.send("Either your currency code is invalid or is not supported. Please try again");
                }          
            });                    
        }
        else {
            session.send("I didn't get the currency types you specified. Please try again using the standard currency codes (e.g. \"USD\" for US dollars)");
        }

        session.endDialog();

    }).triggerAction({
        matches: 'GetExchangeRateSpecific'
    });

    // Dialog for sending feedback
    bot.dialog('SendFeedback', [
        function (session, args, next) {
            session.message.address.bot.name = "Toby";                    
            builder.Prompts.choice(session, "Which branch do you want to give feedback on?", "Bank in general|Queen Street|Newmarket|Wynyard Quarters|Upload photo of branch", { listStyle: builder.ListStyle.button });            
        },
        function (session, results, next) {
            if (results.response.entity == "Upload photo of branch") {
                session.beginDialog("AskForPhoto");
            }
            else if (results.response.entity == "Bank in general") {
                session.dialogData.branchName = "General";
                next();                
            }
            else {
                session.dialogData.branchName = results.response.entity;                
                next();               
            }
        },
        function (session, results, next) {
            if (results.predictedBranch) {
                if (results.predictedBranch == "Error") {
                    session.send("Sorry, I can't identify your branch. Please try again.");
                    session.replaceDialog("SendFeedback");
                }
                else {
                    session.dialogData.branchName = results.predictedBranch; 
                    builder.Prompts.text(session, "Got it, your branch is " + results.predictedBranch + ", please tell us your opinions:");
                }                                                
            } 
            else {
                builder.Prompts.text(session, "Got it, please tell us your opinions:");                                
            }
        },
        function (session, results, next) {
            session.send("Receiving your feedback...");            
            session.dialogData.feedback = results.response;            
            contosoDatabase.postContosoFeedback(session.message.address.conversation.id, session.dialogData.branchName, session.dialogData.feedback, function (postResults) {
                console.log(postResults);
                if (postResults == "success") {
                    session.send("Feedback received, thank you for your time!")                    
                }
                else {
                    session.send("Sorry, something's wrong with our system. Please try again later.")
                }
            })
            session.endDialog();
        },
    ]).triggerAction({
        matches: 'SendFeedback'
    });

    // Dialog for viewing feedback
    bot.dialog('SeeFeedback', [
        function (session, args, next) {
            session.message.address.bot.name = "Toby";                    
            builder.Prompts.choice(session, "Which branch do you want to see feedback on?", "Bank in general|Queen Street|Newmarket|Wynyard Quarters|Upload photo of branch", { listStyle: builder.ListStyle.button });            
        },
        function (session, results, next) {
            if (results.response.entity == "Upload photo of branch") {
                session.beginDialog("AskForPhoto");
            }
            else if (results.response.entity == "Bank in general") {
                session.send("Retrieving feedback for Contoso in general...");
                session.dialogData.branchName = "General";                
                next();                
            }
            else {
                session.send("Retrieving feedback for %s...", results.response.entity);
                session.dialogData.branchName = results.response.entity;                
                next();                                
            }
        },
        function (session, results, next) {
            if (results.predictedBranch) {
                if (results.predictedBranch == "Error") {
                    session.send("Sorry, I can't identify your branch. Please try again.");
                    session.replaceDialog("SeeFeedback");
                }
                else {
                    session.send("This is the %s branch. Retrieving its feedback...", results.predictedBranch)
                    session.dialogData.branchName = results.predictedBranch; 
                }                                                
            } 

            contosoDatabase.getContosoFeedback(function(getResults) {
                
                if (getResults) {
                    var msg = new builder.Message(session);
                    msg.attachmentLayout(builder.AttachmentLayout.carousel)
                    var attachment = [];

                    //console.log(getResults);
                    for (x in getResults) {
                        if (getResults[x].branchName == session.dialogData.branchName) {
                            attachment.push(new builder.HeroCard(session)
                                .title((getResults[x].createdAt.split("T"))[0])
                                .text(getResults[x].feedback));
                        }
                    }
                    
                    console.log(attachment);               
                    if (attachment.length > 0) {
                        msg.attachments(attachment);
                        session.send(msg).endDialog();
                    }
                    else {
                        session.send("There are no feedback.").endDialog();
                    }
                } 
                else {
                    session.send("Sorry, something's wrong with our system. Please try again later.").endDialog();                    
                }               
            });  
        },
    ]).triggerAction({
        matches: 'SeeFeedback'
    });

    // Dialog for deleting feedback
    bot.dialog('DeleteFeedback', [
        function (session, args, next) {
            session.message.address.bot.name = "Toby";
            session.send("Retrieving your previous feedback this session...")   
            
            contosoDatabase.getContosoFeedback(function(getResults) {

                if (getResults) {                    
                    session.dialogData.getResults = [];
                    
                    var msg = new builder.Message(session);
                    msg.attachmentLayout(builder.AttachmentLayout.carousel)
                    var attachment = [];

                    //console.log(getResults);
                    var options = "";
                    var count = 1;
                    for (x in getResults) {
                        if (getResults[x].sessionId == session.message.address.conversation.id) {
                            attachment.push(new builder.HeroCard(session)
                                .title(String(count))
                                .text(getResults[x].feedback));
                            options = options + count + "|";                                
                            count++;                                
                            session.dialogData.getResults.push(getResults[x]);                                                            
                        }
                    }
                    options = options + "I don't want to delete anything";
                    
                    console.log(attachment);               
                    if (attachment.length > 0) {
                        msg.attachments(attachment);
                        session.send(msg);
                        builder.Prompts.choice(session, "Which feedback do you want to delete?", options, { listStyle: builder.ListStyle.button });                                                
                    } 
                    else {
                        session.send("You don't have any feedback this session!").endDialog();
                    } 
                }
                else {
                    session.send("Sorry, something's wrong with our system. Please try again later.").endDialog();                                        
                }              
            });      
        },
        function (session, results, next) {
            if (results.response.entity == "I don't want to delete anything") {
                session.send("Sure, nothing's deleted.").endDialog();
            }
            else {
                contosoDatabase.deleteContosoFeedback(session.dialogData.getResults[Number(results.response.entity) - 1].id, function(deleteResults) {
                   
                    if (deleteResults == "success") {
                        session.send("Feedback deleted.").endDialog();
                    } 
                    else {
                        session.send("Sorry, something's wrong with our system. Please try again later.").endDialog();                    
                    }               
                });
            }
        },
    ]).triggerAction({
        matches: 'DeleteFeedback'
    });

    // Separate dialog for asking for attachments
    bot.dialog('AskForPhoto', [
        function (session) {
            builder.Prompts.attachment(session, "Please send me a photo with the street view of the branch:");
        },
        function (session, results) {
            session.send("Identifying branch...");
            customVision.identifyBranch(results.response[0].contentUrl, function(predictedBranch) {
                results.predictedBranch = predictedBranch; 
                session.endDialogWithResult(results);                                                   
            });
        }
    ]);
}