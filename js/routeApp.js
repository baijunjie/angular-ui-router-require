/**
 * Angular 1.X 组件化路由按需加载实现 v0.2.0
 * @author BaiJunjie
 *
 * https://github.com/baijunjie/angular-ui-router-require
 *
 * routeApp  是模块返回的对象，包含若干属性与方法。
 *           其中 $state 与 controller 必须在应用启动后才能使用。
 *
 * 属性：
 * - angular   angular 对象的引用。
 * - module    routeApp 的 module 对象引用。
 * - curRoute  路由的当前路线 js 模块的返回值。
 * - $state    angular-ui-router 的 $state 服务引用。
 *
 * 方法：
 * - install     安装路由
 *               install([{
 *                   name: 'foo', // 路由链接的 ui-sref，同时也是路由的 state 名称。
 *                   component: 'page/foo', // 组件（文件夹）路径。
 *                   hasjs: false, // 可选。布尔值，明确指出组件是否包含 js，默认为 true。
 *                   text: 'Go to Foo', // 可选。路由文本。路由生成后可以在路由的 state 对象上访问到。
 *                   path: '/foo', // 可选。在浏览器地址栏显示的路径，同时也是生成链接的真实 href。默认情况下等于 name。
 *                   from: '/^\/foo\//i', // 可选。字符串或者正则表达式，所有匹配的路径都会重定向到该页面。默认为空。
 *                                        // '*' 表示其余 url 都重定向到该页面。
 *                                        // '/path/*' 表示与星号之前路径匹配的所有 url 都会重定向到该页面。
 *                   params: '', // 可选。字符串或者对象，定义路由中携带的参数。
 *                               // 如果是字符串，形式为 ':id'，并且参数会在 url 中体现。
 *                               // 如果是对象，形式为 { id: '' }，并且参数不会在 url 中体现。
 *                   children: [ ... ], // 可选。子路由数组。
 *               }, ... ])
 *
 * - start       启动应用。可以传入一个 DOM 元素，表示应用的挂在对象。默认为 document。
 *
 * - on          注册事件监听。
 *
 * - off         移除事件监听。
 *
 * - controller  用于注册组件的 controller 控制器。实际上调用的是 $controllerProvider.register。
 *
 * 事件：
 * - changeBefore   注册路由的 changeBefore 监听，对应 angular-ui-router 的 $stateChangeStart 事件。
 *                  回调参数分别为 event, toState, toParams, fromState, fromParams。
 * - change         注册路由的 change 监听，对应 angular-ui-router 的 $stateChangeSuccess 事件。
 *                  回调参数分别为 event, toState, toParams, fromState, fromParams。
 * - changeAfter    注册路由的 changeAfter 监听，对应 angular-ui-router 的 $viewContentLoaded 事件。
 *                  回调参数为 event。
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

	if (typeof module === 'object' && typeof exports === 'object') {
		module.exports = factory(require('angular'), require('angular-ui-router'));
	} else if (typeof define === 'function' && define.amd) {
		define(['angular', 'angular-ui-router'], factory);
	} else {
		root.routeApp = factory(root.angular);
	}

}(this, function(angular) {
	'use strict';

	var returnValue,
		callbackSet = {
			'changeBefore': [],
			'change': [],
			'changeAfter': []
		},
		routeApp = {
			angular: angular,
			module: angular.module('routeApp', ['ui.router']),
			curRoute: null,
			install: install,
			start: start,
			on: on,
			off: off
		};

	routeApp.module.config(['$controllerProvider', function($controllerProvider) {
		routeApp.controller = function() {
			$controllerProvider.register.apply(this, arguments);
			return this;
		};
	}]);

	routeApp.module.run(['$rootScope', '$state', function($rootScope, $state) {
		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			var arg = arguments,
				curRoute = routeApp.curRoute;
			angular.forEach(callbackSet['changeBefore'], function(cb) {
				cb.apply(routeApp, arg);
			});
			returnValue = curRoute && curRoute.uninstall && curRoute.uninstall();
		});
		$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
			var arg = arguments;
			angular.forEach(callbackSet['change'], function(cb) {
				cb.apply(routeApp, arg);
			});
		});
		$rootScope.$on('$viewContentLoaded', function(event) {
			var args = arguments;
			// 有时 angular 的第三方插件渲染会在这之后完成
			// 因此，这里采用异步，确保这些 angular 插件渲染完成后再执行安装
			setTimeout(function() {
				var curRoute = routeApp.curRoute;
				curRoute && curRoute.install && curRoute.install(returnValue);
				angular.forEach(callbackSet['changeAfter'], function(cb) {
					cb.apply(routeApp, arg);
				});
			});
		});

		routeApp.$state = $state;
	}]);

	function install(routes) {
		routeApp.module.config(['$stateProvider', '$urlRouterProvider',
			function($stateProvider, $urlRouterProvider) {
			setRoutes($stateProvider, $urlRouterProvider, routes);
		}]);
		return routeApp;
	}

	function changeBefore(callback) {
		if (typeof callback === 'function' && routeChangeBefore.indexOf(callback) < 0) {
			routeChangeBefore.push(callback);
		}
		return function() {
			var index = routeChangeBefore.indexOf(callback);
			if (index >= 0) {
				routeChangeBefore.splice(index, 1);
			}
		};
	}

	/**
	 * 注册事件监听
	 * @param  {String}             type      事件类型。
	 * @param  {Function}           callback  事件监听函数。
 	 * @return {Function|Undefined}           如果注册成功，则返回一个反注册函数，调用它可以取消监听。
	 */
	function on(type, callback) {
		if (!callbackSet[type]) return;

		var cbArr = callbackSet[type];

		if (typeof callback === 'function' && cbArr.indexOf(callback) < 0) {
			cbArr.push(callback);
		}

		return function() {
			var index = cbArr.indexOf(callback);
			if (index >= 0) {
				cbArr.splice(index, 1);
			}
		};
	}

	/**
	 * 移除事件监听
	 * @param  {String}   type     可选。事件类型。
	 *                             如果传入一个 Function，则会被当做事件监听函数来处理。
	 * @param  {Function} callback 可选。事件监听函数。
	 */
	function off(type, callback) {
		var i,
			cbSet,
			typeStr = typeof type;

		if (typeStr === 'undefined') {
			for (i in callbackSet) {
				callbackSet[i].length = 0;
			}
			return routeApp;

		} else if (typeStr === 'function') {
			callback = type;
			cbSet = callbackSet;

		} else if (typeStr === 'string') {
			if (callbackSet[type]) {
				cbSet = {};
				cbSet[type] = callbackSet[type];
			} else {
				return routeApp;
			}

			if (callback === undefined) {
				cbSet[type].length = 0;
			}
		} else {
			return routeApp;
		}

		var cbArr, index;
		for (i in cbSet) {
			cbArr = cbSet[i];
			index = cbArr.indexOf(callback);
			if (index >= 0) {
				cbArr.splice(index, 1);
			}
		}

		return routeApp;
	}

	function start(DOM) {
		DOM = DOM || document;
		angular.bootstrap(DOM, ['routeApp']);
		return routeApp;
	}

	var fileNameReg = new RegExp('[^/]*$'),
		slashStartReg = new RegExp('^/+'),
		slashEndReg = new RegExp('/+$'),
		starReg = new RegExp('\\*$');

	function setRoutes($stateProvider, $urlRouterProvider, routes, parentRoute) {
		angular.forEach(routes, function(route) {
			var state = parentRoute;

			if (route.component) {

				var url,
					fileName = fileNameReg.exec(route.component),
					from = typeof route.from === 'string' && '/' + route.from.replace(slashStartReg, '') || route.from;

				if (route.path) {
					url = '/' + route.path.replace(slashStartReg, '');
				} else {
					url = '/' + route.name.replace(slashStartReg, '');
					if (parentRoute) {
						url = parentRoute.url.replace(slashEndReg, '') + url;
					}
				}

				state = {
					url: url,
					templateUrl: route.component + '/' + fileName + '.html',
					parents: parentRoute || null,
					origin: route
				};

				if (route.hasjs !== false) {
					state.resolve = ['$q', function($q) {
						var defer = $q.defer();
						require([route.component + '/' + fileName + '.js'], function(routeModule) {
							routeApp.curRoute = routeModule;
							defer.resolve();
						}, function(err) {
							defer.resolve();
						});
						return defer.promise;
					}];
				}

				if (route.params) {
					var typeStr = typeof route.params;
					if (typeStr === 'string') {
						state.url = state.url.replace(slashEndReg, '') + '/' + route.params.replace(slashStartReg, '');
					} else if (typeStr === 'object') {
						state.params = route.params;
					}
				}

				$stateProvider.state(route.name, state);

				if (from) {
					if (from === '/*') {
						// from === '/*' 时，表示匹配其余所有 url
						$urlRouterProvider.otherwise(url);
					} else if (starReg.exec(from)) {
						// from === '/foo/*' 时，星号表示匹配所有开头为 /foo/ 的路径
						$urlRouterProvider.when(new RegExp('^' + from.replace(starReg, '')), url);
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
