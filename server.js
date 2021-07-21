const express = require('express');
const app = express();
const http = require('http').Server(app);
const port = process.env.PORT || 80;



// app.get('/', (request, response) => {
//   response.send(`<html><head></head><body><p style="font-size: 500; font-family: sans-serif;">>:)</p></body></html>`)
//   console.log(request.ip)

// })

app.use(express.static(__dirname + '/dist'));

http.listen(port, () => console.log('listening on port ' + port));