require.config({
	baseUrl: 'js',
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