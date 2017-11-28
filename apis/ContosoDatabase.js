var request = require('request')

var url = "https://msa-contoso-bank-database.azurewebsites.net/tables/ContosoFeedback";

exports.postContosoFeedback = function (sessionId, branchName, feedback, callback){
    var options = {
        url: url,
        method: 'POST',
        headers: {
            'ZUMO-API-VERSION': '2.0.0',
            'Content-Type':'application/json'
        },
        json: {
            "sessionId" : sessionId,
            "feedback" : feedback,
            "branchName" : branchName
        }
    };
      
    request(options, function (err, res, body) {
        console.log(res.statusCode);
        if (!err && res.statusCode === 201) {
            console.log(body);
            callback("success");
        }
        else {
            console.log(err);
            callback("error");
        }
    });
};

exports.getContosoFeedback = function (callback) {

    request.get(url, {'headers':{'ZUMO-API-VERSION': '2.0.0'}}, function(err,res,body){
        if(err){
            console.log(err);
            callback(null);
        } else {
            callback(JSON.parse(body));
        }
    });
};

exports.deleteContosoFeedback = function (id, callback){
    var options = {
        url: url + "\\" + id,
        method: 'DELETE',
        headers: {
            'ZUMO-API-VERSION': '2.0.0',
            'Content-Type':'application/json'
        }
    };

    request(options,function (err, res, body){
        if( !err && res.statusCode === 200){
            console.log(body);
            callback("success");
        } else {
            console.log(err);
            console.log(res);
            callback("error");            
        }
    })

};