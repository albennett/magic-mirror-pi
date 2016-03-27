'use strict'
var myApp = angular.module("myApp");

myApp.controller('MirrorController', ['$scope', '$http','$routeParams', '$q', function($scope, $http, $routeParams, $q){
  console.log('Mirror Controller Initialized...');

  var now = moment(new Date());

  $scope.date = moment().format('MMMM Do')

  function flashTime() {
    var time = moment().format('LT')
    $('#my_box1').html(time);
  }
  setInterval(flashTime, 1000*2);

  function quoteApi () {
    $http.get('api/quote').success(function (response){
      $scope.quote = response.contents.quotes[0].quote;
      $scope.author = response.contents.quotes[0].author;
      console.log("quote updated");
    });
  }
  quoteApi()
  setInterval(quoteApi, 10800000); //three hours

 function calendarApi (){
  $http.get('api/calendar').success(function (response){
    console.log("response", response.items[0].start.dateTime);
      $scope.calSummary1 = response.items[0].summary;
      $scope.calSummary2 = response.items[1].summary;
      $scope.calSummary3 = response.items[2].summary;
      $scope.calSummary4 = response.items[3].summary;
      $scope.itemTime1 = response.items[0].start.dateTime.slice(5,10);
      $scope.itemTime2 = response.items[1].start.dateTime.slice(5,10);
      $scope.itemTime3 = response.items[2].start.dateTime.slice(5,10);
      $scope.itemTime4 = response.items[3].start.dateTime.slice(5,10);
  });
  }
  calendarApi()
  setInterval(calendarApi, 1000000)

  function mapApi () {
  $http.get('api/map').success(function (response){
    $scope.mapUrl = response.mapUrl;
    console.log("url", $scope.mapUrl);
  });
  }
  mapApi()
  setInterval(mapApi, 600000); //10 mins

  function newsApi () {
    $http.get('api/news').success(function (response) {
      $scope.news = response.results;
      console.log("news updated");
    });
  }
  newsApi()
  setInterval(quoteApi, 10800000); //three hours

  function weatherApi () {
    $http.get('api/weather').success(function (response){
      $scope.fiveDay = response.daily.data;
      $scope.weather = response.currently;
      $scope.temperature = parseInt(response.currently.temperature)
      $scope.color = 'white';
    });
  }
  weatherApi()
  setInterval(weatherApi, 60000*2); //2 minutes

  var d = new Date();
  var weekday = new Array(7);
  weekday[0]=  "Sunday";
  weekday[1] = "Monday";
  weekday[2] = "Tuesday";
  weekday[3] = "Wednesday";
  weekday[4] = "Thursday";
  weekday[5] = "Friday";
  weekday[6] = "Saturday";

  $scope.new = weekday[d.getDay()];

}]);
