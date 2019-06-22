  // Copyright 2017 Google Inc.
  //
  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  //      http://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.

  /*
  * Process of the script:
  * createSlideJSON()
  *  ↓
  *  createBlockProduct() -> return Array
  *    ↓
  *    buildAFeature() -> return Array
  *  ↓
  *  createNewSlidePage ()
  *  ↓
  *  slides.presentations.batchUpdate()
  *
  */
  const google = require('googleapis');
  const slides = google.slides('v1');
  const drive = google.drive('v3');
  const openurl = require('openurl');
  const commaNumber = require('comma-number');
  import { DRIVE_PRESENTATION_FILE_ID, SPREADSHEET_RATE_CARD_ID, SLIDES_TEMPLATE_ID } from './variables.js';


  let additionalID = 0;
  let pageNumberIdx = 1; // starts at 1 because of the intro page

  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  today = today.getFullYear() + '' + mm + '' + dd;
  const SLIDE_TITLE_TEXT = 'BLISS Card rates-' + today;
  const ID_TITLE_SLIDE = 'id_title_slide';
  const ID_TITLE_SLIDE_TITLE = 'id_title_slide_title';
  const ID_TITLE_SLIDE_SUBTITLE = 'id_title_slide_subtitle';
  const ID_TITLE_SLIDE_BODY = 'id_title_slide_body';
  const ID_SECTION_NUMBER = 'id_section_number';

  const TOTAL_PAGE_HEIGHT = 841.88; // PT
  const BOX_WIDTH = 523;
  const MARGIN_BETWEEN_BOXES = 12;
  const PADDING_BOX = 9.5;
  const HOR_OFFSET_FEATURE_TABLE = 55;
  const FEATURE_TABLE_LENGTH = BOX_WIDTH - (PADDING_BOX * 2) - HOR_OFFSET_FEATURE_TABLE ; // 400
  const COORD_FIRST_BLOCK = [36, 180];
  const BOX_TITLE_HEIGHT = 40;
  const MARGIN_BELOW_PD_NAME = 45

 function createSlideJSON(productData, index, nberCategories) {
   let pageID = index;
   let productID = 0
   pageNumberIdx++;
   var cmd = [
     {
     createSlide: {
       objectId: `${ID_TITLE_SLIDE}_${pageID}`,
       slideLayoutReference: {
         predefinedLayout: 'SECTION_TITLE_AND_DESCRIPTION'
       },
       placeholderIdMappings: [{
         layoutPlaceholder: {
           type: 'TITLE'
         },
         objectId: `${ID_TITLE_SLIDE_TITLE}_${pageID}`
       }, {
         layoutPlaceholder: {
           type: 'SUBTITLE'
         },
         objectId: `${ID_TITLE_SLIDE_SUBTITLE}_${pageID}`
       }, {
         layoutPlaceholder: {
           type: 'BODY'
         },
         objectId: `${ID_TITLE_SLIDE_BODY}_${pageID}`
       }]
     }
    //
    }, {
      createShape: {
        objectId: `DescriptionField_${pageID}`,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: `${ID_TITLE_SLIDE}_${pageID}`,
          size: {
            width: {
              magnitude: 250,
              unit: "PT"
            },
            height: {
              magnitude: 425,
              unit: "PT"
            }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 321,
            translateY: 60,
            unit: "PT"
          }
        }
      }
   }, {
     insertText: {
       objectId: `${ID_TITLE_SLIDE_TITLE}_${pageID}`,
       text: `[${productData.category.toUpperCase()}]`
     }
   }, {
     insertText: {
       objectId: `${ID_TITLE_SLIDE_SUBTITLE}_${pageID}`,
       text: `${productData.category.toUpperCase()}`
     }
   // }, {...subFeature}
   }, {
     insertText: {
       objectId: `${ID_TITLE_SLIDE_BODY}_${pageID}`,
       text: productData.description,
     }
   }
 ];

  // Check the potential length of the product and their features
  // To ensure it fits into one page
   let accumulatedHeight = COORD_FIRST_BLOCK[1];
   let sizeOfTheNewBox = 0;
   let newBlock = [];

   productIteration: // label for break; statement
   for (var i = 0, j = productData.products.length; i < j; i++) {

     if (productData.products[i].show){
       sizeOfTheNewBox = BOX_TITLE_HEIGHT + (productData.products[i].features.length * 23.4) + (PADDING_BOX * 2) + MARGIN_BETWEEN_BOXES // == height of a product box
       if (accumulatedHeight + sizeOfTheNewBox > TOTAL_PAGE_HEIGHT) {
         // break productIteration; // for testing
         additionalID++;
         pageID = index + '-' + additionalID
         cmd.push(...createNewSlidePage(index+'-'+additionalID, productData.category));
         accumulatedHeight = 45; // ~ height of the gradient header
       }
       newBlock = createBlockProduct([COORD_FIRST_BLOCK[0], accumulatedHeight], productData.products[i], productID, index, `${ID_TITLE_SLIDE}_${pageID}`);
       cmd.push(...newBlock);

       accumulatedHeight += sizeOfTheNewBox;
       productID++;

     }
   }

   additionalID = 0;

   console.log("index: ", index);
   console.log("nberCategories: ", nberCategories);

   if (index === nberCategories-1){
      cmd.push(moveGlossaryAtEnd(pageNumberIdx))
   }

   return cmd;
 }

function moveGlossaryAtEnd (idx) {
  console.log("idx: ", idx);
  return {
    updateSlidesPosition: {
      slideObjectIds: [
        "g5c1069c3fa_1_0", // first glossary page
        "g5c1069c3fa_1_8" // outro
      ],
      "insertionIndex": idx+2
    }
  }
}

 /**
  * Creates slides for our presentation.
  * @param {authAndGHData} An array with our Auth object and the GitHub data.
  * @return {Promise} A promise to return a new presentation.
  * @see https://developers.google.com/apis-explorer/#p/slides/v1/
  */
 module.exports.createSlides = (authAndGHData) => new Promise((resolve, reject) => {
   console.log('Generating the slides...');
   const [auth, ghData] = authAndGHData;
   const nberCategories = ghData.length

   // First copy the template slide from drive.
   drive.files.copy({
     auth: auth,
     fileId: DRIVE_PRESENTATION_FILE_ID,
     fields: 'id,name,webViewLink',
     resource: {
       name: SLIDE_TITLE_TEXT
     }
   }, (err, presentation) => {
     if (err) return reject('Error while processing drive.files.copy',err);

     const allSlides = ghData.map((data, index) => createSlideJSON(data, index, nberCategories));
     slideRequests = [].concat.apply([], allSlides); // flatten the slide requests

     // Execute the requests
     slides.presentations.batchUpdate({
       auth: auth,
       presentationId: presentation.id,
       resource: {
         requests: slideRequests
       }
     }, (err, res) => {
       if (err) {
         reject('Error while processing slides.presentations.batchUpdate',err);
       } else {
         resolve(presentation);
       }
     });

   });
 // });
}, (err, res) => {
   if (err) {
     reject('Error with createSlides - global Promise', err);
   } else {
     resolve(presentation);
   }
});

 /**
 * Opens the presentation in a browser.
 * @param {String} presentation The presentation object.
 */
module.exports.openSlidesInBrowser = (presentation) => {
  console.log('Presentation URL:', presentation.webViewLink);
  openurl.open(presentation.webViewLink);
}

/**
* Create a new block which is dedicated to one product
* @param coord: Array that contains the coordiates of the starting point for the new block
*    prod: Obj with all the properties of the current product (including the all features)
*    prodIdx: Int | Index of the product within the product Category
*    idx: Int | Index of the Category (used when creating the slide)
*    pageId: String | Id of the current slide. Required to insert a shape into a Slide
* @return Array of objects with all the directive to create the shapes.
*/
function createBlockProduct (coord, prod, prodIdx, idx, pageId) {
  let boxHeight = BOX_TITLE_HEIGHT + (prod.features.length * 23.4) + (PADDING_BOX * 2);
  let listOfFeatures = [];
  var coordFeatures = [coord[0] + HOR_OFFSET_FEATURE_TABLE, coord[1] + MARGIN_BELOW_PD_NAME];
  let i = 1;
  prod.features.forEach(function(ft){
    // buildAFeature (coord, feat, featIdx, idx, pageId)
    let feat = buildAFeature(coordFeatures, ft, prodIdx, i, idx, pageId)
    listOfFeatures.push(...feat);
    coordFeatures[1] += 23.5;
    i++;
  });

  var allBlock = [
  {
    createShape: {
      objectId: `box_${idx}-${prodIdx}`, shapeType: "RECTANGLE",
      elementProperties: {
        pageObjectId: pageId,
        size: {
          width: { magnitude: BOX_WIDTH, unit: "PT" },
          height: { magnitude: boxHeight, unit: "PT" }
        },
        transform: { scaleX: 1, scaleY: 1, unit: "PT",
          translateX: coord[0],
          translateY: coord[1]
        }
      }
    }
   }, {
     createShape: {
       objectId: `bigNumber_${idx}-${prodIdx}`, shapeType: "TEXT_BOX",
       elementProperties: {
         pageObjectId: pageId,
         size: {
           width: { magnitude: 82, unit: "PT" },
           height: { magnitude: 120, unit: "PT" }
         },
         transform: { scaleX: 1, scaleY: 1, unit: "PT",
           translateX: coord[0] + 1,
           translateY: coord[1] + PADDING_BOX - 5
         }
       }
     }
   }, {
     createShape: {
       objectId: `productName_${idx}-${prodIdx}`, shapeType: "TEXT_BOX",
       elementProperties: {
         pageObjectId: pageId,
         size: {
           width: { magnitude: 264, unit: "PT" },
           height: { magnitude: 18, unit: "PT" }
         },
         transform: { scaleX: 1, scaleY: 1, unit: "PT",
           translateX: coord[0] + 75,
           translateY: coord[1] + PADDING_BOX
         }
       }
     }
   }, {
     createShape: {
       objectId: `priceBasic_${idx}-${prodIdx}`, shapeType: "TEXT_BOX",
       elementProperties: {
         pageObjectId: pageId,
         size: {
           width: { magnitude: 110, unit: "PT" },
           height: { magnitude: 20, unit: "PT" }
         },
         transform: { scaleX: 1, scaleY: 1, unit: "PT",
           translateX: coord[0] + 400,
           translateY: coord[1] + 12
         }
       }
     }
    }, {
      insertText: {
        objectId: `productName_${idx}-${prodIdx}`,
        text: `${prod.product_name}`
      }
    }, {
      insertText: {
        objectId: `bigNumber_${idx}-${prodIdx}`,
        text: `0${prodIdx+1}`
      }
    }, {
      insertText: {
        objectId: `priceBasic_${idx}-${prodIdx}`,
        text: `USD ${Math.round(prod.features[0].price, 2)}`
      }
    }, {
      updateTextStyle: {
        objectId: `productName_${idx}-${prodIdx}`,
        'style': {'fontSize': { 'magnitude': 16, 'unit': 'PT' }, 'fontFamily': 'Oswald', bold: true,},
        'textRange': {'type': 'ALL'},
        fields: '*',
      }
    }, {
      updateTextStyle: {
        objectId: `bigNumber_${idx}-${prodIdx}`,
        'style': {'fontSize': { 'magnitude': 60, 'unit': 'PT' }, 'fontFamily': 'Oswald', bold: true, foregroundColor: { opaqueColor: { rgbColor: { blue: 0.88, green: 0.88, red: 0.88, } } } },
        'textRange': {'type': 'ALL'},
        fields: '*',
      }
    }, {
      updateTextStyle: {
        objectId: `priceBasic_${idx}-${prodIdx}`,
        'style': {'fontSize': { 'magnitude': 16, 'unit': 'PT' }, 'fontFamily': 'Oswald', bold: true, foregroundColor: { opaqueColor: { rgbColor: { blue: 0.1, green: 0.1, red: 0.1, } } } },
        'textRange': {'type': 'ALL'},
        fields: '*',
      }
    }, {
      updateParagraphStyle: {
        objectId: `priceBasic_${idx}-${prodIdx}`,
        'style': {alignment: 'END'},
        'textRange': {'type': 'ALL'},
        fields: '*',
      }
    },  {
      updateShapeProperties: {
        objectId: `box_${idx}-${prodIdx}`,
        fields: "*",
        shapeProperties: {
          shapeBackgroundFill: {
            solidFill: {
              color: {
                  rgbColor: { blue: 0.949, green: 0.949, red: 0.949 }
              }
            }
          },
          outline: {
            propertyState: 'NOT_RENDERED'
          }
        }
      }
    }
  ];

  if(listOfFeatures && listOfFeatures.length > 0) {
    allBlock.push(...listOfFeatures);
  }

  return allBlock;
};

/**
* Create a new line fedicated for one features (belonging to a Product)
* @param coord: Array that contains the coordiates of the starting point for the new Feature line
*    feat: Obj containing name and price
*    featIdx: Int | Index of the feature within the Product
*    prodIdx: Int | Index of the Product within the Category
*    idx: Int | Index of the Category (used when creating the slide)
*    pageId: String | Id of the current slide. Required to insert a shape into a Slide
* @return Array of objects with all the directive to create the shapes.
*/
function buildAFeature (coord, feat, featIdx, prodIdx, idx, pageId) {
  return [
    {
      createShape: {
        objectId: `featureName_${idx}-${prodIdx}-${featIdx}`, shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: pageId,
          size: {
            width: { magnitude: 375, unit: "PT" },
            height: { magnitude: 23, unit: "PT" }
          },
          transform: { scaleX: 1, scaleY: 1, unit: "PT",
            translateX: coord[0] + HOR_OFFSET_FEATURE_TABLE,
            translateY: coord[1]
          }
        }
      }
     }, {
      createShape: {
        objectId: `featurePrice_${idx}-${prodIdx}-${featIdx}`, shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: pageId,
          size: {
            width: { magnitude: 105, unit: "PT" },
            height: { magnitude: 23, unit: "PT" }
          },
          transform: { scaleX: 1, scaleY: 1, unit: "PT",
            translateX: coord[0] + 345,
            translateY: coord[1]
          }
        }
      }
     }, {
      createShape: {
        objectId: `featureSeparator_${idx}-${prodIdx}-${featIdx}`, shapeType: "RECTANGLE",
        elementProperties: {
          pageObjectId: pageId,
          size: {
            width: { magnitude: FEATURE_TABLE_LENGTH - 55, unit: "PT" },
            height: { magnitude: 1, unit: "PT" }
          },
          transform: { scaleX: 1, scaleY: 1, unit: "PT",
            translateX: coord[0] + HOR_OFFSET_FEATURE_TABLE,
            translateY: coord[1] + 23.5
          }
        }
      }
    }, {
      insertText: {
        objectId: `featureName_${idx}-${prodIdx}-${featIdx}`,
        text: feat.feature_name
      }
    }, {
      insertText: {
        objectId: `featurePrice_${idx}-${prodIdx}-${featIdx}`,
        text: feat.price
      }
    }, {
      updateTextStyle: {
        objectId: `featureName_${idx}-${prodIdx}-${featIdx}`,
        'style': {'fontSize': { 'magnitude': 10, 'unit': 'PT' }, 'fontFamily': 'Montserrat', bold: false,},
        'textRange': {'type': 'ALL'},
        fields: '*',
      }
    }, {
      updateTextStyle: {
        objectId: `featurePrice_${idx}-${prodIdx}-${featIdx}`,
        'style': {'fontSize': { 'magnitude': 10, 'unit': 'PT' }, 'fontFamily': 'Oswald', bold: false, foregroundColor: { opaqueColor: { rgbColor: { blue: 0.5, green: 0.5, red: 0.5, }}} },
        'textRange': {'type': 'ALL'},
        fields: '*',
      }
    }, {
      updateParagraphStyle: {
        objectId: `featurePrice_${idx}-${prodIdx}-${featIdx}`,
        'style': {alignment: 'END'},
        'textRange': {'type': 'ALL'},
        fields: '*',
      }
    },  {
      updateShapeProperties: {
        objectId: `featureSeparator_${idx}-${prodIdx}-${featIdx}`,
        fields: "*",
        shapeProperties: {
          outline: {
            propertyState: 'NOT_RENDERED',
          },
          shapeBackgroundFill: {
            solidFill: {
              color: {
                  rgbColor: { blue: 0.9, green: 0.9, red: 0.9 }
              }
            }
          },
        }
      }
    }
  ]
};

function createNewSlidePage (newId, category) {
  pageNumberIdx++;
  return [
    {
    createSlide: {
      objectId: `${ID_TITLE_SLIDE}_${newId}`,
      slideLayoutReference: {
        predefinedLayout: 'TITLE_AND_BODY'
      },
      placeholderIdMappings: [{
        layoutPlaceholder: {
          type: 'SUBTITLE'
        },
        objectId: `${ID_TITLE_SLIDE_SUBTITLE}_${newId}`
      }]
    }
    }, {
      insertText: {
        objectId: `${ID_TITLE_SLIDE_SUBTITLE}_${newId}`,
        text: `${category.toUpperCase()}`
      }
    }
  ];
}



module.exports.getSlides = (authAndGHData) => new Promise((resolve, reject) => {
  console.log('Getting the slides...');
  const auth = authAndGHData;

  // Execute the requests
  slides.presentations.get({
    auth: auth,
    // presentationId: '19g9bAi6zt6AXDIFAcrZJvUZk8IHiULrYyyMS99tEQ_s',
    presentationId: SLIDES_TEMPLATE_ID,
  }, (err, res) => {
    if (err) {
      reject('Error while processing slides.presentations.batchUpdate',err);
    } else {
      console.log("presentation: ", res);
      resolve(res);
    }
  });
});