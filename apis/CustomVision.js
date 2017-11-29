var request = require('request');

exports.identifyBranch = function (imageUrl, callback){

    request.post(
        {
            url: 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.0/Prediction/2588741c-f8b1-46c5-83a6-28b1398fa8c0/url?iterationId=a6a01985-8e2d-43e8-8ceb-eb84028e7387',
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'Prediction-Key': 'f54f43d9c86d42608a75adedbd4fc737'
            },
            body: { 'Url': imageUrl }
        }, 
        function(err, res, body) {  
            if (body && body.Predictions && body.Predictions[0].Tag) {
                if (body.Predictions[0].Probability > 0.7) {     
                    callback(body.Predictions[0].Tag);
                }
                else {
                    callback("Error");                    
                }
            }
            else {
                callback("Error");
            }
        }
    );
}