const express = require("express");
const path = require("path");
var cors = require('cors');
var cookies = require('cookie-parser');
var bodyParser = require('body-parser');
const url = require('url');
var request = require('request'); 
var querystring = require('querystring');
require('dotenv').config();

const app = express();
const port = process.env.PORT || "3000";
app.use(cookies());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var mysql = require('mysql');
var db_config = {
  host:'us-cdbr-east-05.cleardb.net',
  user:'b293e8f99f4f71',
  password: '63573abe',
  database: 'heroku_e5f3abd1443db44'
};

function handleDisconnect() {
  connection = mysql.createConnection(db_config); 

  connection.connect(function(err) {              
    if(err) {                                     
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); 
    }                                     
  });                                     

  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
      handleDisconnect();                         
    } else {                                      
      throw err;                                  
    }
  });
}

handleDisconnect();

var code = '';

// redirect to HTML homepage
app.get('/', function(req, res, next) {

  let query = "SELECT refresh_token FROM tokens WHERE refresh_token='" + req.cookies['refresh_token'] +"';";
  connection.query(query, function(err, result, fields) {
    if(result.length > 0) {
      return res.redirect('/hub');
    }

    res.sendFile(path.join(__dirname + '/public/index.html'));
  });
  
});

app.get('/hub', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/hub.html'));
})

// Obtain authorization code
app.get("/callback", (req, res) => {
  const queryObject = url.parse(req.url,true).query;
  authCode = queryObject.code;

  

  generate_tokens(res, function(response) {
    var access_token = response.access_token;
        refresh_token = response.refresh_token;
    
    var authOptions = {
      url: 'https://api.spotify.com/v1/me',
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      json: true
    };

    request.get(authOptions, function(error, response, body) {
      var sql = "INSERT INTO tokens (access_token, refresh_token, id) VALUES ('"+access_token+
                "','"+refresh_token+"', '" + body.id + "');";
      connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log('1 entry added')
        res.send('memes');
      });
    });
  })

});

function generate_tokens(res, callback) {
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

    if (!error && response.statusCode === 200) {
      res.cookie('refresh_token', body.refresh_token);
      callback(body)
    }
  });
}

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


function resetSong() {
  var time = 0;
  var options = {
    url: 'https://api.spotify.com/v1/me/player/seek?position_ms='+time,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true,
  };

  // use the access token to access the Spotify Web API
  request.put(options, function(error, response, body) {
  });
}


app.get('/login', function(req, res) {
	var scopes = 'user-read-currently-playing user-modify-playback-state user-read-email';
	var redirect_uri = 'http://localhost:3000/callback'

	res.redirect('https://accounts.spotify.com/authorize' +
	  '?response_type=code' +
	  '&client_id=' + process.env.client_id +
	  (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
	  '&redirect_uri=' + encodeURIComponent(redirect_uri));

});


app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});


app.post('/memes', (req, res) => {
  let query = "SELECT id FROM tokens WHERE id='" + req.body.id +"';";
  connection.query(query, function(err, result, fields) {
    if(result.length > 0) {

      res.send('FOUND!')
    }

    res.send("NOT FOUND")
  });
})

function getCurrentSong() {
  
}