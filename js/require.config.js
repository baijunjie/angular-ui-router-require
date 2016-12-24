(function() {

function getSelfPath() {
	var js = document.scripts,
		curJs = js[js.length - 1],
		path = curJs.src.substring(0, curJs.src.lastIndexOf('/') + 1);
	return path;
}

require.config({
	baseUrl: getSelfPath(),
	paths: {
		'angular': 'lib/angular.min',
		'angular-ui-router': 'lib/angular-ui-router',
		'routeApp': 'routeApp'
	},
	shim: {
		'angular': {
			exports: 'angular'
		},
		'angular-ui-router': {
			deps: ['angular']
		}
	},
	urlArgs: 'debug=' + (+ new Date())
});

})();