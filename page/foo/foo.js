define(['routeApp'], function(routeApp) {
	console.log('foo 资源加载完成并初始化');

	routeApp.controller('fooCtrl', function($scope, $stateParams) {
		// controller 内部在页面每次载入时也会执行
		$scope.name = 'foo';
		console.log('fooCtrl 执行');
	});

	// 返回值可以包含安装和卸载方法
	return {
		install: function(data) { // 接收上一个页面的传值
			console.log('安装 foo');
			data && console.log(data.msg);
		},
		uninstall: function() {
			console.log('卸载 foo');
			return { // 卸载后可以向下一个页面传值
				msg: '我是来自 foo 的问候'
			};
		}
	}
});
