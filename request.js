var keys = require('./keys'),
    ebay = require('ebay-api'),
    _ = require('lodash');
/*
Get Listings
*/
exports.items;
exports.list = function(req, res, next) {
    exports.items = [];
    //res.send('Profile page of '+ req.session.user.username +'<br>'+' click to <a href="/logout">logout</a>');
    var keyword = req.body.keyword;
    var store = req.body.ebaystore;
    ebay.xmlRequest({
        serviceName: 'Finding',
        opType: 'findItemsIneBayStores',
        devId: keys.devId,
        certId: keys.certId,
        appId: keys.appId,
        //sandbox: false,
        //authToken: keys.token,
        params: {
            storeName: store,
            keywords: keyword,
            paginationInput: {
                entriesPerPage: '100',
                pageNumber: 1,
            },
            itemFilter: [{
                name: 'HideDuplicateItems',
                value: 'true'
            }, ],
            sortOrder: 'BestMatch'
        }
    }, function(err, out) {
        if (err) console.log(err);
        if (out && out.ack == 'Success')
            for (var i = 1; i <= out.paginationOutput.totalPages; i++)
                ebay.xmlRequest({
                    serviceName: 'Finding',
                    opType: 'findItemsIneBayStores',
                    appId: keys.appId,
                    params: {
                        storeName: store,
                        keywords: keyword,
                        paginationInput: {
                            entriesPerPage: '100',
                            pageNumber: i,
                        },
                        itemFilter: [{
                            name: 'HideDuplicateItems',
                            value: 'true'
                        }, ]
                    },
                }, function(error, result) {
                    // ...
                    if (error)
                        console.log(error);
                    if (result && result.ack == 'Success')
                        result.searchResult.item.forEach(function(item) {
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
                                if (detail && detail.Ack == 'Success') {
                                    exports.items.push(detail.Item);
                                    if (exports.items.length == out.paginationOutput.totalEntries)
                                        next();
                                }
                            });
                        });
                });

        else res.redirect('/listing');
    });

}
/*
Update Prices
*/
/*exports.update = function(req, res, next) {
    console.log(req.body.id);
    exports.revisedItem = {};
    
}*.
/*
Get Seller
*/
exports.seller = function (req, res, next) {
    //
    var storeName = req.body.seller;
	if(exports.items.length > 0)
	exports.items.forEach(function (item){
        			
		ebay.xmlRequest({
        serviceName: 'Finding',
        opType: paramMaker(storeName, item, req.body.seller).opType,
        appId: keys.appId,
        params: paramMaker(storeName, item, req.body.seller).params,
        }, function(error, results) {
        // ...
			if(error)
				console.log(error);
			if(results && results.ack == 'Success' && results.searchResult.$.count > 0){
				ebay.xmlRequest({
					serviceName: 'Shopping',
					opType: 'GetSingleItem',
					appId: keys.appId,
					params: {
						'ItemID': results.searchResult.item.itemId,
						'IncludeSelector': 'Details,ItemSpecifics',
					}
				}, function(error, detail) {
					// ...
					if (error)
						console.log(error)
					if(detail && detail.Ack == 'Success')
						item.seller = detail.Item;
                    if(exports.items.indexOf(item) == exports.items.length - 1)
                        next();
				});
			}//finding results end
		});
	});
}

function paramMaker (s,i,r){
    if(s) return {
		opType : 'findItemsIneBayStores',
		params : {
				keywords: keyword(i),
				storeName: r,
				paginationInput:{
								entriesPerPage: '1',
								pageNumber: 1,
                                },
				sortOrder: 'BestMatch',
                }
	}
	else return {
		opType : 'findItemsByKeywords',
		params : {
				keywords: keyword(i),
				sortOrder: 'PricePlusShippingAsc',
				paginationInput:{
								entriesPerPage: '1',
								pageNumber: 1,
                                },
				itemFilter: [{
								name: 'Condition',
								value: '1000'
							}, {
								name: 'LocatedIn',
								value: 'AU'
							}, {
								name: 'ListingType',
								value: 'FixedPrice'
							},
							{
								name: 'HideDuplicateItems',
								value: 'true'
							},
							{
								name: 'ListedIn',
								value: 'EBAY-AU'
							},
							{
								name: 'ExcludeSeller',
								value: ['officesupplyaustralia','mobiletechmart']
							},
							]
				}
	}   
}

exports.cost = function (req, res, next) {
    var fs = require('fs');
	var csv = require("fast-csv");
	var stream = fs.createReadStream('STDPRICE_FULL.TXT');
    
	if (exports.items.length > 0) {
	csv
		.fromStream(stream, {
			headers: true
		})
		.on("data", function(data) {
		for(var i=0; i<exports.items.length; i++)
		if(data['Vendor Part Number'] == exports.items[i].ItemSpecifics.NameValueList.filter( function(itemSpecifics){
												return itemSpecifics.Name == 'MPN';
											})[0].Value)
			exports.items[i].ingram = data;
		})
		.on("end", function() {
			next();
		});
    }
}

function keyword (item){
    
    var mpn = item.ItemSpecifics.NameValueList.filter( function(itemSpecifics){
												return itemSpecifics.Name == 'MPN';
											});
    var brand = item.ItemSpecifics.NameValueList.filter( function(itemSpecifics){
												return (itemSpecifics.Name == 'BRAND' || itemSpecifics.Name == 'Brand') ;
											});
    var pull = _.pullAt(item.Title.split(/[\s◉]+/),[0,1,2,3]);
    console.log(pull);
    if(mpn.length > 0 && brand.length > 0)
        //console.log(brand, mpn)
        return brand[0].Value +" "+ mpn[0].Value;
    //else
        return pull[0]+" "+pull[1]+" "+pull[2]+" "+pull[3];
}