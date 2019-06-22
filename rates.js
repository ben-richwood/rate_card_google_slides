/**
 * Get the license data from BigQuery and our license data.
 */

 const google = require('googleapis');
 const sheets = google.sheets('v4');
 const drive = google.drive('v3');
 const openurl = require('openurl');
 const commaNumber = require('comma-number');
 const localRates = require('./localRates');
 const spreadsheetID = require('SPREADSHEET_RATE_CARD_ID')
 import { DRIVE_PRESENTATION_FILE_ID, SPREADSHEET_RATE_CARD_ID, SLIDES_TEMPLATE_ID } from './variables.js';

module.exports.getRates = (authClient) => new Promise((resolve, reject) => {
    console.log('Getting Data from GSheet');
    // console.log('auth: ', authClient);

    // Sending request to Google Sheet
    var request = {
      spreadsheetId: SPREADSHEET_RATE_CARD_ID,
      // The ranges to retrieve from the spreadsheet.
      range: "features!A2:G40",
      majorDimension: "ROWS",


      // True if grid data should be returned.
      // includeGridData: false,
      auth: authClient,
    };


    // console.log(JSON.stringify(localRates.localData));
    sheets.spreadsheets.values.get(request, function(err, response) {
      if (err) return reject('Error when loading data from Sheets: ' + err);

      // resolve([authClient, localRates.localData ]); // DEV

      // Used for Local DEV. Uncomment the line below in PROD
      // console.log(JSON.stringify(response));
      // console.log("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-");
      // console.log(JSON.stringify(formatPrices( response)));
      // reject('end')
      resolve([authClient, formatPrices( response ) ]); // PROD
    });
    // console.log(JSON.stringify(response, null, 2));
  });

  function formatPrices (jsonObj) {
    var formattedJson = [];
    var tempArray = {};
    var j = 0;
    var newCatCounter = -1;
    var newProdCounter = -1;

    // console.log(jsonObj.values);

    jsonObj['values'].filter(e => e[4] != 1).forEach(function(el){ // number of total entries
    	if (el[0] != "") {
    		formattedJson.push({category: el[0], description: el[1], products: []})
    		newCatCounter++;
    		newProdCounter = -1;
    	}
    	if (el[3] != "") {
    		formattedJson[newCatCounter]['products'].push({product_name: el[3], show: true, features: []})
        newProdCounter++;
        if (el[2] == 1) {
          formattedJson[newCatCounter]['products'][newProdCounter].show = false;
        }
    	}
    	tempArray = { feature_name: el[5] || '/', price: el[6] || '0' }
    	formattedJson[newCatCounter]['products'][newProdCounter].features.push(tempArray)

    	j++;
    });
    return formattedJson;
  }
