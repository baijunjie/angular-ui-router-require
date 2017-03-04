require(['jquery', 'routeApp', 'i18n'], function($, routeApp, i18n) {
	routeApp.version = '1.0.0';

	routeApp.module.requires.push('i18n');

	i18n.config({
		paths: {
			'zh-CN': 'data/i18n/zh-CN.json',
			'en-US': 'data/i18n/en-US.json'
		},
		defLangType: 'zh-CN'
	});

	$.getJSON('data/menus.json', function(menus) {

		routeApp.module.controller('mainCtrl', ['$scope', function($scope) {
			// 生成菜单
			$scope.menus = menus;

			// 国际化
			$scope.changeLang = function(langType) {
				if (langType === i18n.getLangType()) return;

				i18n.setLangType(langType).then(function() {
					$scope.crumbs = changeCrumbs(routeApp.$state.current);
				});
			};

			i18n.on('requireLangDone', function(langType) {
				console.log(langType, '加载完成');
			});

			i18n.on('requireLangFail', function(langType) {
				console.log(langType, '加载失败');
			});

			i18n.on('change', function(langType) {
				console.log('语言已变更为', langType);
				changeMenuText(routes);
			});

			// 面包屑
			routeApp.on('change', function(e, toState, toParams, fromState, fromParams) {
				console.log('从 ' + fromState.name + ' 跳转到 ' + toState.name);
				$scope.crumbs = changeCrumbs(toState);
			});
		}]);

		var routes = [{
			i18n: 'COMMON.HOME',
			name: 'home',
			path: '/',
			from: '*',
			component: 'page/home',
			hasjs: false,

			children: menus
		}];

		routeApp.install(routes);
		routeApp.start();
	});

	function changeMenuText(routes) {
		var item,
			i = routes.length;
		while (i--) {
			item = routes[i];
			item.text = i18n.getLang(item.i18n);
			if (routeApp.angular.isArray(item.children)) {
				changeMenuText(item.children);
			}
		}
	}

	function changeCrumbs(curState) {
		var state = curState,
			crumbs = [{
				state: state,
				active: true
			}];

		while (state.parents) {
			state = state.parents;
			crumbs.unshift({
				state: state
			});
		}
		return crumbs;
	}
});