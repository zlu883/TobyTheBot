var request = require('request');

exports.identifyBranch = function (session){

    request.post({
        url: 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.0/Prediction/2588741c-f8b1-46c5-83a6-28b1398fa8c0/url?iterationId=a6a01985-8e2d-43e8-8ceb-eb84028e7387',
        json: true,
        headers: {
            'Content-Type': 'application/json',
            'Prediction-Key': 'f54f43d9c86d42608a75adedbd4fc737'
        },
        body: { 'Url': "http://www.peddlethorp.co.nz/assets/Uploads/Westpac-Charter-House-02.jpg" }
    }, function(error, response, body){
        console.log(error);
        console.log(body);        
        session.send(validResponse(body));
    });
}

function validResponse(body){
    if (body && body.Predictions && body.Predictions[0].Tag){
        return "This is " + body.Predictions[0].Tag
    } else{
        console.log('Oops, please try again!');
    }
}