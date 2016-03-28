var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(function($routeProvider){
  $routeProvider.when('/',{
    controller: 'MirrorController',
    templateUrl: 'views/mirror.html'
  })
  .when('/how',{
    controller: 'MirrorController',
    templateUrl: 'views/howto.html'
  })
  .otherwise({
    redirectTo: '/'
  });
});
