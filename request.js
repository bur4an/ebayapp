var keys = require('./keys'),
    ebay = require('ebay-api');
exports.list = function (req, res, next) {
    exports.items = []; var keyword;
        //res.send('Profile page of '+ req.session.user.username +'<br>'+' click to <a href="/logout">logout</a>');
        if(req.session.brand)
            keyword = req.session.brand;
        else
            keyword = req.body.keyword;
        var store = 'eSuperPrices';
        console.log(keyword);
        ebay.xmlRequest({
          serviceName : 'Finding',
          opType : 'findItemsIneBayStores',
          devId: keys.devId,
          certId: keys.certId,
          appId: keys.appId,
          //sandbox: false,
          //authToken: keys.token,
          params: {
				storeName: store,
				keywords: keyword,
                paginationInput:{
								entriesPerPage: '100',
								pageNumber: 1,
                                },
                itemFilter: [{
                                name: 'HideDuplicateItems',
                                value: 'true'
                            },],
                sortOrder: 'BestMatch'
                }
        }, function(err, out){
        if(err) console.log(err);
        if(out && out.ack == 'Success')
            for(var i=1; i<=out.paginationOutput.totalPages; i++)
                ebay.xmlRequest({
				serviceName: 'Finding',
				opType: 'findItemsIneBayStores',
				appId: keys.appId,
				params: {
						storeName: store,
						keywords: keyword,
						paginationInput:{
										entriesPerPage: '100',
										pageNumber: i,
										},
						itemFilter: [{
										name: 'HideDuplicateItems',
										value: 'true'
									},]
						},
				}, function(error, result) {
				// ...
					if(error)
						console.log(error);
					if(result && result.ack == 'Success')
						result.searchResult.item.forEach(function(item){
						ebay.xmlRequest({
							serviceName: 'Shopping',
							opType: 'GetSingleItem',
							appId: keys.appId,
							params: {
								'ItemID': item.itemId,
								'IncludeSelector': 'Details,ItemSpecifics',
							}
						}, function(errr, detail) {
							// ...
							if (errr)
								console.log(errr)
							if(detail && detail.Ack == 'Success'){
								exports.items.push(detail.Item);
                                if(exports.items.length == out.paginationOutput.totalEntries)
                                    next();
                            }
						});
                        });
				});
        
        else res.redirect('/listing');
    });
        
}
exports.update = function (req, res, next){
    exports.revisedItem = {};
    if(req.body.price > 0 && req.body.id)
	ebay.xmlRequest({
				  serviceName : 'Trading',
				  opType : 'ReviseFixedPriceItem',
				  devId: keys.devId,
				  certId: keys.certId,
				  appId: keys.appId,
				  sandbox: false,
				  authToken: keys.token,
				  params: {
					  Item:{
						ItemID: req.body.id,
						StartPrice: req.body.price,
						}
					  }
					}, function(er, update) {
					  // ...
						if(er) console.log(er);
				        if(update){
                            exports.revisedItem = update;
                            next();
                        }
                            
					});
    else res.redirect('/listing');
}