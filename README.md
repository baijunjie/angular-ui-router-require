# Angular 1.X 路由按需加载的简单实现

基于 [require](https://github.com/requirejs/requirejs) 与 [angular-ui-router](http://angular-ui.github.com/) 实现 angular 按需加载。

使用组件化的思路来定义页面。每一个页面组件有独立的 controller，controller 可以跟随组件自身被异步加载进主页面，不需要初始化时预先载入全部 controller 代码。并且组件也有完整的生命周期，可以实现安装与卸载，降低内存泄漏的风险。

## 如果你满足以下条件，可以尝试使用

- 公司过于保守，不愿意尝试其他新兴框架。
- 项目中人员目前只熟悉 Angular 1.x。
- 项目中人员比较习惯使用 jQuery 来完成除数据绑定以外的其他功能需求。
- 项目中使用到大量需要操作 DOM 的插件，如：Bootstrap 等。
- 希望开发 SPA（单页面）应用，但又担心项目过于庞大，首次加载过慢。



## 定义组件

一个组件就是一个文件夹，文件夹内有与文件夹同名的 html 和 js 文件，css 文件可以直接在 html 中使用 \<link> 引入（如果使用相对路径，就必须是相对主页面的路径，而不是相对组件 html 的路径）。

```
component
|-- component.html
|-- component.js
|-- component.css
```

js 文件需要遵循 AMD 规范，使用 `define` 将文件定义为一个模块。`routeApp` 是基于 angular-ui-router 封装的核心模块。

```js
define(['routeApp'], function(routeApp) {

    routeApp.controller('componentCtrl', function($scope) {
        // controller 内部在页面每次载入时也会执行
        $scope.name = '我是一个组件';
    });
    
    var $component;
    function scrollHandle(e) {
        // 屏幕滚动时的处理
    }

    // 返回值可以包含安装和卸载方法
    return {
        // 安装
        install: function(data) { // 接收上一个页面的传值
            data && console.log(data.msg);
            // 所有 DOM 操作，以及添加事件监听的行为必须在安装方法中执行
            $component = document.getElementById('component');
            window.addEventListener('scroll', scrollHandle);
        },
        // 卸载
        uninstall: function() {
            // 移除事件监听，以及一些 DOM 的引用
            window.removeEventListener('scroll', scrollHandle);
            $component = null;
            return { // 卸载后可以向下一个页面传值
                msg: '传达我的问候'
            };
        }
    }
});
```

## 定义一个路由

一个路由也就是一个 angular-ui-router 的 state。

```js
var routes = [{
    name: 'page1',
    component: 'pages/page1'
}, ...]
```

路由属性的完整配置：

- `name` - 路由链接的 ui-sref，同时也是路由的 state 名称。

- `component` - 组件（文件夹）路径。

- `hasjs` - 可选。布尔值，明确指出组件是否包含 js，默认为 `true`。

- `text` - 可选。路由文本。路由生成后可以在路由的 state 对象上访问到。

- `path` - 可选。在浏览器地址栏显示的路径，同时也是生成链接的真实 href。默认情况下等于 name。

- `from` - 可选。字符串或者正则表达式，所有匹配的路径都会重定向到该页面。默认为空。   `'*'` 表示其余 url 都重定向到该页面。`'/path/*'` 表示与星号之前路径匹配的所有 url 都会重定向到该页面。

- `children` - 可选。子路由数组



## routeApp 模块

`routeApp` 模块是一个 angular-ui-router 路由实现的简单封装对象，使用非常简单。

```js
require(['routeApp'], function(routeApp) {
    var routes = [...];
    routeApp.module.controller('mainCtrl', function($scope) {
        // 可以直接使用路由配置数组去生成菜单
        $scope.menus = routes;
    });
    routeApp.install(routes); // 安装路由
    routeApp.start(); // 启动应用
});
```

你可以通过 `routeApp.module` 完成主页面的 controller 注册，它实际上就是 `angular.module()` 创建的一个 Angular 模块。

## routeApp 的属性与方法

#### 属性：

- `angular` - angular 对象的引用。
- `module` - routeApp 的 module 对象引用。
- `$state` - angular-ui-router 的 $state 服务引用。

#### 方法：

- `install` - 安装路由。
- `start` - 启动应用。
- `changeBefore` - 传入一个 `Function`，注册路的 `changeBefore` 回调，对应 angular-ui-router 的 `$stateChangeStart` 事件。回调参数分别为 `event`, `toState`, `toParams`, `fromState`, `fromParams`。
- `change` - 传入一个 `Function`，注册路由的 `change` 回调，对应 angular-ui-router 的 `$stateChangeSuccess` 事件。回调参数分别为 `event`, `toState`, `toParams`, `fromState`, `fromParams`。
- `changeAfter` - 传入一个 `Function`，注册路由的 `changeAfter` 回调，对应 angular-ui-router 的 `$viewContentLoaded` 事件。回调参数为 `event`。
- `controller` - 用于注册组件的 `controller` 控制器。实际上调用的是 `$controllerProvider.register`。



## 最后

需要注意的是，每个组件注册的 `controller` 与 `install` 一样都会在每次页面安装时执行。

执行顺序是：

- `changeBefore` 回调 =>
- 执行旧组件页面的 `uninstall`，并将需要传递给新组件页面的数据通过 `return` 返回 =>
- 新组件页面初始化(仅执行一次，之后再次安装页面不会执行) =>
- `change` 回调 =>
- 执行新组件页面的 `controller` =>
- 执行新组件页面的 `install`，并将旧组件页面传递的数据注入 =>
- `changeAfter` 回调 => End

