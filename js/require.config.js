require.config({
	baseUrl: 'js',
	paths: {
		'jquery': 'lib/jquery-3.1.1.min',
		'angular': 'lib/angular.min',
		'angular-ui-router': 'lib/angular-ui-router',
		'angular-translate': 'lib/angular-translate.min',
		'routeApp': 'routeApp',
		'i18n': 'i18n'
	},
	shim: {
		'angular': {
			exports: 'angular'
		},
		'angular-ui-router': {
			deps: ['angular']
		},
		'angular-translate': {
			deps: ['angular']
		}
	},
	urlArgs: 'debug=' + (+ new Date())
});

require(['main']);