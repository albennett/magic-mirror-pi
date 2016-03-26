'use strict';

var TMP_DIR = '/tmp';

var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var request = require('request');
var fs = require('fs');
var exec = require('child_process').exec;
//var cmd = '/_MIRROR/gpio/readNode.sh 28';
//var cmd2 = '/_MIRROR/gpio/readNode.sh 29';
//var gpio = require("pi-gpio");
var gpio = require('gpio');
var apicache = require('apicache').options({ debug: true }).middleware;
var key = require('/_MIRROR/conf/apikeys.conf.js');
var weatherUrl = 'https://api.forecast.io/forecast/' + key.weatherKey + '/36.1820800,-86.7278270'
var newsUrl = 'http://api.nytimes.com/svc/topstories/v1/world.json?api-key=' + key.newsKey;
var quoteUrl = 'http://quotes.rest/qod.json';
var calendarUrl = key.calUrl;

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

app.get('/api/map', apicache('10 mins'), function (req, res) {
  var mapContent = fs.readFileSync("map.json");
  var jsonMapContent = JSON.parse(mapContent);
  console.log("contents", jsonMapContent);
  res.send(jsonMapContent);
})

app.get('/api/calendar', apicache('12 hours'), function (req, res){
  request.get(calendarUrl, function (err, response, body){
    if (err) throw err;
    var calendar = JSON.parse(body);
    console.log("cal",calendar);
    res.send(calendar)
  })
});

app.get('/api/status', function(req, res){
	var output = {};
	output.isOK = true;
	output.gpioCenterVideo = gpioCenterVideo;
	output.gpioStatus = gpioStatus;

	res.send(output);
});

app.listen(PORT, function () {
  console.log('App listening on port ' + PORT);
});

app.all('/', function () {
console.log('connected');
});


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
         exec('/bin/kill ' + pidData, function(){ });
				}
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

// ////////////////////////////////////////////////////////////////////////////////////////////////////////
// OLD STUFF :)
// ////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
setInterval(function() {
  gpio.open(40, "input", function(err) {     // Open pin for input
      gpio.read(40, function(err, value) {
      if(err) throw err;
      var sData = value.toString();
      var iData = parseInt(sData);
      if (iData !== gpioStatus){
      console.log('29 is now:' + iData); // The current state of the pin
      gpioStatus = iData;
        if (iData === 0){
        stopStatus()
        } else {
          startStatus();
        }
      }
      gpio.close(40)
    });
  });
}, 1000);
*/

/*
setInterval(function() {
  gpio.open(38, "input", function(err) {     // Open pin for input
      gpio.read(38, function(err, value) {
      if(err) throw err;
      var sData = value.toString();
      var iData = parseInt(sData);
      if (iData !== gpioCenterVideo){
      console.log('28 is now:' + iData); // The current state of the pin
      gpioCenterVideo = iData;
        if (iData === 0){
          stopCenterVideo();
        } else {
          startCenterVideo();
        }
      }
      gpio.close(38)
    });
  });
}, 1000);
*/

// var read28 = spawn('/_MIRROR/gpio/readNode.sh', ['28']);
// read28.stdout.on('data', function (data) {
//   var sData = data.toString();
//   var iData = parseInt(sData);
//   console.log('28 is now:' + iData);
//     if(iData === 0) {
//
//     } else {
//       exec('/bin/echo -n "1" > /tmp/centerVideo-last', function(){});
//         fs.readFile('/tmp/centerVideo.pid', 'utf8', function(err, pidData)
//             {
//             if(!pidData)
//             {
//               console.log("AM starting (no PID)...");
//               exec('/_MIRROR/system/centerVideo.sh', function(){
//           });
//             }
//         else {
//                 var pid = parseInt(pidData.trim());
//                 fs.stat('/proc/' + pid, function(sErr,sStats) {
//                     if(sStats && sStats.isDirectory()) {
//                         console.log('NOT starting...');
//                     } else {
//                         console.log("AM starting...");
//                         exec('/_MIRROR/system/centerVideo.sh', function() {
//                         });
//                     }
//                 });
//             }
//         });
//     }

// });

// read28.on('close', function (code) {
//     console.log('read28 - child process exited with code ' + code);
// });

// setTimeout(function() {
//   var read29 = spawn('/_MIRROR/gpio/readNode.sh', ['29']);
//   read29.stdout.on('data', function (data) {
//   var sData = data.toString();
//   var iData = parseInt(sData);
//   console.log('29 is now:' + iData);

//   if (iData === 0 ){
//     console.log("killall");
//     exec('/usr/bin/killall fbi', function(){
//       fs.readFile('/tmp/centerVideo-last', 'utf8', function(error, videoData){
//         if (videoData){
//           var iData = parseInt(videoData)
//           if (iData === 1){
//             isOmxPlayerRunning(function (isRunning){
//               if (!isRunning){
//                 console.log("AM REstarting...");
//                 exec('/_MIRROR/system/centerVideo.sh', function(){
//                 });
//               }
//             })
//           }
//         }
//       })
//     });
//   } else {
//     console.log('launching');
//     exec('/_MIRROR/system/statusImage.sh', function(){
//     });
//   }
// })
// read29.on('close', function (code) {
//     console.log('read29 - child process exited with code ' + code);
// });
// }, 2000);


/*
exec(cmd, function(error, stdout, stderr) {
  var data = stdout.toString();
 // data.trim();
  var idata = parseInt(data);
  console.log('28= ', idata)
});
*/

// var read28 = gpio.setup(28, gpio.DIR_IN, readInput);

// function readInput() {
//     gpio.read(28, function(err, value) {
//         console.log('28 is now:' + iData);
//     });

//     gpio.on('change', function(channel, value) {
//       console.log('Channel ' + channel + ' value is now ' + value);
// });
// gpio.setup(28, gpio.DIR_IN, gpio.EDGE_BOTH);
// }

