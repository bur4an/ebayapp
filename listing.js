var keys = require('./keys'),
	ebay = require('ebay-api'),
	fs = require('fs'),
	csv = require("fast-csv"),
	_ = require('lodash');

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
					}, function(error, results) {
					  // ...
						//console.log(results.searchResult)
                        module.exports = results;
					});