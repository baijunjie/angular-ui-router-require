require(['routeApp'], function(routeApp) {

	// 模拟异步获取路由配置
	setTimeout(function() {

		var routes = [{
			text: 'Home',
			component: 'page/home',
			hasjs: false,
			from: '*'
		}, {
			text: 'Go to Foo',
			name: 'foo',
			component: 'page/foo',

			children: [{
				text: 'Go to Bar',
				name: 'bar',
				path: 'foo/bar',
				component: 'page/bar',
				from: '/bar/*'
			}]
		}];

		routeApp.module.controller('mainCtrl', function($scope) {
			$scope.nav = routes;
		});

		routeApp.change(function(e, toState, toParams, fromState, fromParams) {
			console.log('从 ' + fromState.name + ' 跳转到 ' + toState.name)
		});

		routeApp.install(routes);
		routeApp.start();

	}, 1000);

});