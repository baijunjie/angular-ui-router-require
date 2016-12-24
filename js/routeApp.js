/**
 * Angular 1.X 组件化路由按需加载实现 v0.1.2
 * @author BaiJunjie
 *
 * https://github.com/baijunjie/angular-ui-router-require
 *
 * routeApp  是模块返回的对象，包含若干属性与方法。
 *           其中 $state 与 controller 必须在应用启动后才能使用。
 *
 * 属性：
 * - angular  angular 对象的引用。
 * - module   routeApp 的 module 对象引用。
 * - $state   angular-ui-router 的 $state 服务引用。
 *
 * 方法：
 * - install       安装路由
 *                 install([{
 *                     name: 'foo', // 路由链接的 ui-sref，同时也是路由的 state 名称。
 *                     component: 'page/foo', // 组件（文件夹）路径。
 *                     hasjs: false, // 可选。布尔值，明确指出组件是否包含 js，默认为 true。
 *                     text: 'Go to Foo', // 可选。路由文本。路由生成后可以在路由的 state 对象上访问到。
 *                     path: '/foo', // 可选。在浏览器地址栏显示的路径，同时也是生成链接的真实 href。默认情况下等于 name。
 *                     from: '/^\/foo\//i', // 可选。字符串或者正则表达式，所有匹配的路径都会重定向到该页面。默认为空。
 *                                          // '*' 表示其余 url 都重定向到该页面。
 *                                          // '/path/*' 表示与星号之前路径匹配的所有 url 都会重定向到该页面。
 *                     children: [ ... ], // 可选。子路由数组
 *                 }, ... ])
 *
 * - start         启动应用。
 *
 * - changeBefore  传入一个 Function，注册路的 changeBefore 回调，对应 angular-ui-router 的 $stateChangeStart 事件。
 *                 回调参数分别为 event, toState, toParams, fromState, fromParams。
 * - change        传入一个 Function，注册路由的 change 回调，对应 angular-ui-router 的 $stateChangeSuccess 事件。
 *                 回调参数分别为 event, toState, toParams, fromState, fromParams。
 * - changeAfter   传入一个 Function，注册路由的 changeAfter 回调，对应 angular-ui-router 的 $viewContentLoaded 事件。
 *                 回调参数为 event。
 *
 * - controller    用于注册组件的 controller 控制器。实际上调用的是 $controllerProvider.register。
 *
 * 所有的路由组件都是一个文件夹，文件夹中包含与组件同名的 html 和 js。
 * 每个 js 以 AMD 的规范定义成模块，并输出一个包含 install 与 uninstall 的对象，用于安装和卸载。
 * 组件的控制器使用 routeApp.controller() 进行定义。
 *
 * 注意，每个组件注册的 controller 与 install 一样都会在每次页面安装时执行。
 * 执行顺序是：
 *     changeBefore 回调 =>
 *     执行旧组件页面的 uninstall，并将需要传递给新组件页面的数据通过 return 返回 =>
 *     新组件页面初始化(仅执行一次，之后再次安装页面不会执行) =>
 *     change 回调 =>
 *     执行新组件页面的 controller =>
 *     执行新组件页面的 install，并将旧组件页面传递的数据注入 =>
 *     changeAfter 回调 => End
 */
(function(root, factory) {
	'use strict';

	if (typeof define === 'function' && define.amd) {
		define(['angular', 'angular-ui-router'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('angular'), require('angular-ui-router'));
	} else {
		root.routeApp = factory(root.angular);
	}

}(this, function(angular) {
	'use strict';

	var curPage, returnValue,
		routeChange, routeChangeBefore, routeChangeAfter,
		routeApp = angular.extend({}, {
			angular: angular,
			module: angular.module('routeApp', ['ui.router']),
			install: install,
			start: start,
			change: change,
			changeBefore: changeBefore,
			changeAfter: changeAfter
		});

	routeApp.module.run(['$rootScope', '$state', function($rootScope, $state) {
		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			routeChangeBefore && routeChangeBefore(event, toState, toParams, fromState, fromParams);
			returnValue = curPage && curPage.uninstall && curPage.uninstall();
		});
		$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
			routeChange && routeChange(event, toState, toParams, fromState, fromParams);
		});
		$rootScope.$on('$viewContentLoaded', function(event) {
			curPage && curPage.install && curPage.install(returnValue);
			routeChangeAfter && routeChangeAfter(event);
		});

		routeApp.$state = $state;
	}]);

	routeApp.module.config(['$controllerProvider', function($controllerProvider) {
		routeApp.controller = function() {
			$controllerProvider.register.apply(this, arguments);
			return this;
		};
	}]);

	function install(routes) {
		routeApp.module.config(['$stateProvider', '$urlRouterProvider',
			function($stateProvider, $urlRouterProvider) {
			setRoutes($stateProvider, $urlRouterProvider, routes);
		}]);
	}

	function changeBefore(callback) {
		routeChangeBefore = callback;
	}

	function change(callback) {
		routeChange = callback;
	}

	function changeAfter(callback) {
		routeChangeAfter = callback;
	}

	function start() {
		angular.bootstrap(document, ['routeApp']);
	}

	var fileNameReg = new RegExp('[^/]*$'),
		urlReg = new RegExp('^/*'),
		fromReg = new RegExp('\\*$');

	function setRoutes($stateProvider, $urlRouterProvider, routes, parentRoute) {
		angular.forEach(routes, function(route) {
			var state = parentRoute;

			if (route.component) {

				var fileName = fileNameReg.exec(route.component),
					stateName = route.name,
					url = '/' + (route.path || route.name).replace(urlReg, ''),
					from = typeof route.from === 'string' && '/' + route.from.replace(urlReg, '') || route.from;

				state = {
					text: route.text,
					url: url,
					templateUrl: route.component + '/' + fileName + '.html',
					parents: parentRoute || null
				};

				if (route.hasjs !== false) {
					state.resolve = ['$q', function($q) {
						var defer = $q.defer();
						require([route.component + '/' + fileName + '.js'], function(page) {
							curPage = page;
							defer.resolve();
						}, function(err) {
							defer.resolve();
						});
						return defer.promise;
					}];
				}

				$stateProvider.state(stateName, state);

				if (from) {
					if (from === '/*') {
						// from === '/*' 时，表示匹配其余所有 url
						$urlRouterProvider.otherwise(url);
					} else if (fromReg.exec(from)) {
						// from === '/foo/*' 时，星号表示匹配所有开头为 /foo/ 的路径
						$urlRouterProvider.when(new RegExp('^' + from.replace(fromReg, '')), url);
					} else {
						// from === '/foo' 时，在路径中 /#!/foo 与 /#!foo 都能识别
						$urlRouterProvider.when(from, url);

						// from === '/' 时，在路径中只能识别 /#!/，而不能识别 /#!
						if (from === '/') {
							// from === '' 时，才能识别 /#!
							$urlRouterProvider.when('', url);
						}
					}
				}
			}

			if (route.children && route.children.length) {
				setRoutes($stateProvider, $urlRouterProvider, route.children, state);
			}
		});
	}

	return routeApp;
}));
