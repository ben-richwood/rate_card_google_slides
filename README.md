# Card rates Slide API

Node script to generate a Google Slide and populate it with data from Google Sheets.
It requires to have edition privilege on the Google Drive directory where the spreadsheet and the template are located.

This script is largely inspired by Google tutorial [CodeLabs](https://codelabs.developers.google.com/codelabs/slides-api/index.html?index=..%2F..index#0).

For the complete Slides Reference & Documentation: https://developers.google.com/slides/reference/rest/

The 2 required files in your Google Drive directory:

1. `rate_card` -> the card rate spreadsheet.
2. `Slide master` -> the template presentation used to build up the presentation.

*Note: the names are not important; only their ID are. Adapt with your values in `variables.js`*

![Technical scheme of the script](https://raw.githubusercontent.com/ben-richwood/rate_card_google_slides/master/images/card_rates_scheme-01.png)


## Usage

1. First, edit the spreadsheet. See below for the format
2. You can add as many rows as wanted, the script will automatically add as many pages as needed. Ensure to merge the new row for the first and the second columns (as it is by default).
4. Launch the script

To launch the script, there are 2 options: locally (Node - from command line) or from a API call (GET request)

**Option 1**

Reach the folder where you cloned the repo and run `node app.js`. If you pass the argument `open` when calling the script, it will open the presentation in the browser after generation -> `node app.js open`

**Option 2**

You can prefer to install the script on a server - such as Heroku or Netlify. Express is installed and can be easily launched. To run Express, input `npm server.js`. Then go to `localhost:3000`. It will launch the script and respond with a confirmation message.

![Generated Presentation after script](https://raw.githubusercontent.com/ben-richwood/rate_card_google_slides/master/images/generated_presentation.png)


Both approaches launch the same script at the end. It works as follow:
  1. Call Google OAuth and opens the login page. It records all the auth info in a `service_account_secret.json`
  2. The script fetches the Google Sheets data
  3. Then it duplicates the `Slide master` presentation (Drive API)
  4. It populates the presentation with the products and features
  5. The file name can be changed in `slides.js` (`SLIDE_TITLE_TEXT` variable).

### Formatting the spreadsheet

Here is how you should format the spreadsheet. Feel free to adapt it.
The Google Sheets API returns an array for each line of the range you provide. on the `rates.js`, the function `formatPrices()` turns the Array into a JSON; feel free to adapt this function to your needs. For this script, the spreadsheet look like this:

| Category      | Description     | Product name  | Product visibility  | Feature name | Feature visibility | Price  |
| ------------- |:---------------:|--------------| ------------------- | ------------ | ------------------ | ------ |
| Name          | Category's blob | Name          | 0 or 1 (1 to hide)  | Name         | 0 or 1 (1 to hide) | Number |


### Additional notes

The script uses the Slide master of the 'Slide master' presentation. Because of that, please do not edit the slide master directly.
Besides, the script automatically creates new pages to ensure the product fits the height of the page. Then you can add as many products as you want, it will not overflow the page.
To easily edit the layout, just tweak the const variables at the top of the `slides.js` file

You can use the slide master to simplify the layout.

## To improve
1. Enhance the presentation layout/design
