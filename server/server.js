'use strict';

var TMP_DIR = '/tmp';

var MY_DIR = __dirname;

var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var request = require('request');
var fs = require('fs');
var exec = require('child_process').exec;
var gpio = require('gpio');
var apicache = require('apicache').options({ debug: true }).middleware;
var key = require('/_MIRROR/conf/apikeys.conf.js');
var weatherUrl = 'https://api.forecast.io/forecast/' + key.weatherKey + '/36.1820800,-86.7278270'
var newsUrl = 'https://newsapi.org/v1/articles?source=bbc-news&sortBy=top&apiKey=' + 'e7890f76dc964c428a0b1ce2e372f492';
var quoteUrl = 'https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en';
// var quoteUrl = 'http://quotes.rest/qod.json';
// var calendarUrl = key.calUrl;
var NYTimesKey = '6b33eb7b78a214401d2766c100aeae6a:5:74631439';

var spawn = require('child_process').spawn;

app.set('view engine', 'jade')
app.use(express.static('/_MIRROR/server/public'))
app.get('/');

function logError(message) {
	console.log("ERROR!!! " + message);
}

function logDebug(message) {
	console.log("DEBUG: " + message);
}
//err
function saveStatus(key, val, callback) {
	fs.writeFile(TMP_DIR + "/" + key, val + "", function(err) {
    if(err)
			callback(err);
		else
			callback();
	});
}

function isPIDRunning(pid, callback) {
  fs.stat('/proc/' + pid, function(sErr,sStats) {
    if(sStats && sStats.isDirectory()) {
      callback(true);
    } else {
    callback(false);
    }
  });
}

//delete tmp status
saveStatus('status_centerVideo',"0", function(errSave){
	if(errSave)
		logError(errSave);
});

app.get('/api/weather', apicache('10 minutes'), function (req, res) {
  request.get(weatherUrl, function (err, response, body){
    if (err) throw err;
    res.header('Access-Controll-Allow-Origin', '*');
    console.log("weatherUrl", weatherUrl);
    var weather = JSON.parse(body);
    res.send(weather)
  })
});

app.get('/api/news', apicache('1 hour'), function (req, res){
  request.get(newsUrl, function (err, response, body){
    if (err) throw err;
    var news = JSON.parse(body);
    console.log("news");
    res.send(news)
  })
});

app.get('/api/quote', apicache('12 hours'), function (req, res){
  request.get(quoteUrl, function (err, response, body){
    if (err) throw err;
    var quote = JSON.parse(body);
    console.log("quote",quote);
    res.send(quote)
  })
});

app.get('/api/map', function (req, res) {
  var mapContent = fs.readFileSync(MY_DIR + "/map.json");
  var jsonMapContent = JSON.parse(mapContent);
  jsonMapContent.mapUrl += "&amyleeDT=" + Date.now();
  console.log("contents", jsonMapContent);
  res.send(jsonMapContent);
})

// app.get('/api/image', function (req, res) {
// 	request.get()
// })

// app.get('/api/calendar', apicache('12 hours'), function (req, res){
// 	request.get({
// 	  url: "https://api.nytimes.com/svc/books/v3/lists/best-sellers/history.json",
// 	  qs: {
// 	    'api-key': '6b33eb7b78a214401d2766c100aeae6a:5:74631439';
// 	  },
// 	}, function(err, response, body) {
// 	  res.send(body);
// 	})
// });

app.get('/api/status', function(req, res){
  var output = {};
  output.isOK = true;
  output.gpioCenterVideo = gpioCenterVideo;
  output.gpioStatus = gpioStatus;
  res.send(output);
});

app.get('/api/how', function(req, res){
  res.send(changeToHowToPage);
});

app.listen(PORT, function () {
  console.log('App listening on port ' + PORT);
});

app.all('/', function () {
  console.log('connected');
});


// //////////////////////////////////////////////////////////////////////////////////////////////////
// the howto
// //////////////////////////////////////////////////////////////////////////////////////////////////

var gpioPageChange = -1;
var changeToHowToPage = false;

function handlePageChange(val){
  gpioPageChange = val;
  if (val === 0){
    changeToHowToPage = false;
  } else{
    changeToHowToPage = true;
  }
}

var gPG = gpio.export(16, {
  direction: 'in', ready: function() {
    logDebug("gPG ready.");
    gPG._get();
    setTimeout(function(){
      handlePageChange(gPG.value);
    }, 500);
  }
});

gPG.on("change", handlePageChange);

// //////////////////////////////////////////////////////////////////////////////////////////////////
// the center video
// //////////////////////////////////////////////////////////////////////////////////////////////////
var gpioCenterVideo = -1;

function handleCenterVideoGPIOChange(val) {
  console.log('CenterVideo is NOW:' + val); // The current state of the pin
  gpioCenterVideo = val;
  if (val === 0){
    stopCenterVideo();
  } else {
    startCenterVideo();
  }
}

var gCV = gpio.export(20, {
  direction: 'in', ready: function() {
    logDebug("gCV ready.");
    //there's a problem here: https://github.com/EnotionZ/GpiO/blob/master/lib/gpio.js
    //  in that it does not properly initialize (eg, upon start it never checks sanity to ensure button is not pressed [assumes it is NOT])
    gCV._get();
    setTimeout(function(){
      handleCenterVideoGPIOChange(gCV.value);
    }, 500);
  }
});

gCV.on("change", handleCenterVideoGPIOChange);

function stopCenterVideo(){
  saveStatus('status_centerVideo',"0", function(errSave) {
    if(errSave) {
      logError(errSave);
    }
    fs.readFile('/tmp/centerVideo.pid', 'utf8', function(err, pidData){  //try and kill it either way...
      if(pidData) {
      exec('/bin/kill ' + pidData, function(){ });				}
    });
  });
}

function startCenterVideo(){
  isCenterVideoRunning(function(isRunning){
    if(!isRunning) {
      saveStatus('status_centerVideo',"1", function(errSave) {
	if(errSave) {
	  logError(errSave);
	}
      exec('/_MIRROR/system/centerVideo.sh', function(){});
      });
    }
  });
}

function isCenterVideoRunning (callback){
  fs.readFile('/tmp/centerVideo.pid', 'utf8', function(err, pidData) {
    if(!pidData){
      callback(false);
    } else {
      var pid = parseInt(pidData.trim());
      isPIDRunning(pid, function(isRunning) {
	callback(isRunning);
      });
    }
  });
}
// //////////////////////////////////////////////////////////////////////////////////////////////////
// the status
// //////////////////////////////////////////////////////////////////////////////////////////////////
var gpioStatus = -1;

function handleStatusGPIOChange(val) {
  console.log('Status is NOW:' + val); // The current state of the pin
  gpioStatus = val;
  if (val === 0){
    stopStatus();
  } else {
    startStatus();
  }
}

var gST = gpio.export(21, {
  direction: 'in', ready: function() {
    logDebug("gST ready.");
    gST._get();
    setTimeout(function(){
      handleStatusGPIOChange(gST.value);
    }, 500);
  }
});

gST.on("change", handleStatusGPIOChange);

function isStatusRunning(callback){
  fs.readFile('/tmp/statusImage.pid', 'utf8', function(err, pidData) {
    if(!pidData) {
      callback(false);
    } else {
      var pid = parseInt(pidData);
      isPIDRunning(pid, function(isRunning) {
	callback(isRunning);
      });
    }
  });
}

function startStatus(){
  logDebug("startStatus()");
  isStatusRunning(function(isRunning){
    logDebug("startStatus - isRunning:" + isRunning);
    if(!isRunning){
      exec('/_MIRROR/system/statusImage.sh', function(){
      });
    }
  });
}

function stopStatus(){
  logDebug("stopStatus()");
  exec('/usr/bin/killall fbi', function(){});
}
