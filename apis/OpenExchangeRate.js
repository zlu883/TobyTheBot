var request = require('request');

// NOT USED
exports.getCurrencyList = function (callback){

    request.get("https://openexchangerates.org/api/currencies.json?app_id=ca835d6b079449cf915a03993f0938ed", function (err,res,body){
        if (err){
            console.log(err);
            callback(null);            
        } else {
            callback(JSON.parse(body));
        }
    });
}

exports.getExchangeRate = function (targetCurrency, baseCurrency, callback){

    request.get("https://api.fixer.io/latest" + "?base=" + baseCurrency.toUpperCase() + "&symbols=" + targetCurrency.toUpperCase(), function (err, res, body){
        if (err){
            console.log(err);
            callback(null);
        } else {
            callback(JSON.parse(body));            
        }
    });
};