const express = require('express')
const app = express()
const port = 3000
const mainScript = require('./index')

app.get('/', function (req, res) {
  res.send('The script is running.')
  console.log("launching script");
  mainScript.mainScript.launch();
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))