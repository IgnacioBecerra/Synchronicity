const config = require('./config')
const express = require("express");
const path = require("path");
var cors = require('cors');
var cookieParser = require('cookie-parser');
const url = require('url');
var request = require('request'); 
var querystring = require('querystring');
require('dotenv').config();

console.log(process.env.client_id)

const app = express();
const port = process.env.PORT || "3000";


var code = '';

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get("/callback", (req, res) => {
  const queryObject = url.parse(req.url,true).query;
  authCode = queryObject.code;

  var authOptions = {
	url: 'https://accounts.spotify.com/api/token',
	form: {
	  client_id: process.env.client_id,
	  client_secret: process.env.client_secret,
	  code: authCode,
	  redirect_uri: 'http://localhost:3000/callback',
	  grant_type: 'authorization_code'
	},
	json: true
  };
  
  request.post(authOptions, function(error, response, body) {

    console.log(body)
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var time = 0;
        var options = {
          url: 'https://api.spotify.com/v1/me/player/seek?position_ms='+time,
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true,
        };

        // use the access token to access the Spotify Web API
        request.put(options, function(error, response, body) {
          console.log(body);
        });
      }
    });

res.send('eme')

});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});

app.get('/login', function(req, res) {
	var scopes = 'user-read-currently-playing user-modify-playback-state';
	var redirect_uri = 'http://localhost:3000/callback'

	res.redirect('https://accounts.spotify.com/authorize' +
	  '?response_type=code' +
	  '&client_id=' + config.client_id +
	  (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
	  '&redirect_uri=' + encodeURIComponent(redirect_uri));

});
