define(['routeApp'], function(routeApp) {
	console.log('bar 资源加载完成并初始化');

	routeApp.controller('barCtrl', function($scope, $stateParams) {
		// controller 内部在页面每次载入时也会执行
		$scope.name = '我是 bar';
		console.log('barCtrl 执行');
	});

	// 返回值可以包含安装和卸载方法
	return {
		install: function(data) { // 接收上一个页面的传值
			console.log('安装 bar');
			data && console.log(data.msg);
		},
		uninstall: function() {
			console.log('卸载 bar');
			return { // 卸载后可以向下一个页面传值
				msg: '我是来自 bar 的问候'
			};
		}
	}
});
