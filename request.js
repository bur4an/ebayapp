var keys = require('./keys'),
    ebay = require('ebay-api');

exports.list = function (req, res, next) {
        //res.send('Profile page of '+ req.session.user.username +'<br>'+' click to <a href="/logout">logout</a>');
        ebay.xmlRequest({
          serviceName : 'Finding',
          opType : 'findItemsIneBayStores',
          devId: keys.devId,
          certId: keys.certId,
          appId: keys.appId,
          //sandbox: false,
          //authToken: keys.token,
          params: {
              keywords: '',
              storeName: 'eSuperPrices'
          }
        }, function(err, result){
        if(result.ack == 'Success'){
            exports.results = result;
            next();
        }
    });
        
}