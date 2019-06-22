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

require('dotenv').config();
const auth = require('./auth');
const slides = require('./slides');
const rates = require('./rates')

process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

module.exports.mainScript = {
  // launch: fct()
  launch: function () {
    console.log('-- Start generating slides. --');
    auth.getClientSecrets()
      .then(auth.authorize)
      .then(rates.getRates)
      .then(slides.createSlides)
      .then( e => {
        if(process.argv[2] === 'open'){
          slides.openSlidesInBrowser(e);
        }
      })
      .then(() => {
        console.log('-- Finished generating slides. --');
      });
  }
}

/**
 * Generates slides using the Google Slides, Drive, and BigQuery APIs.
 */