/**
 * Angular 1.X 国际化 v0.2.0
 * @author BaiJunjie
 *
 * i18n  是模块返回的对象，包含若干属性与方法。
 *       setLangType 以及所有的服务引用必须在应用启动后才能使用。
 *
 * 属性：
 * - angular             angular 对象的引用。
 * - module              i18n 的 module 对象引用。
 * - $translate          angular-translate 的 $translate 服务引用。
 * - $translateProvider  angular-translate 的 $translateProvider 服务引用。
 *
 * 方法：
 * - getLang             获取当前语言。
 * - setLang             设置当前语言。
 * - getAllLang          获取全部语言对象。
 * - setAllLang          设置全部语言对象。
 * - getLangType         获取当前语言类型。
 * - setLangType         设置当前语言类型。（必须应用启动后才可以使用）
 * - config              设置配置对象。（只能在应用启动前设置）
 * - on                  注册事件监听。
 * - off                 移除事件监听。
 *
 * 事件：
 * - requireLangDone  新语言包加载完成时触发该事件，并将该语言类型作为参数传入。
 * - requireLangFail  新语言包加载失败时触发该事件，并将该语言类型作为参数传入。
 * - change           语言变更后触发该事件，并将当前语言类型作为参数传入。
 */
(function(root, factory) {
	'use strict';

	if (typeof define === 'function' && define.amd) {
		define(['angular', 'angular-translate'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('angular'), require('angular-translate'));
	} else {
		root.i18n = factory(root.angular);
	}

}(this, function(angular) {
	'use strict';

	var callbackSet = {
			'requireLangDone': [],
			'requireLangFail': [],
			'change': []
		},

		cfg = {
			// paths 语言包路径配置对象
			// {
			//     'zh-CN': 'language/zh-CN.json'
			// }
			paths: {},

			// 设置 $http 请求的默认配置选项。
			http: {},

			// 默认语言类型。如果 paths 中配置了该语言类型，会在应用启动后立即设置
			defLangType: '',

			// 语言类型是否大小写敏感
			caseSensitive: false
		},

		langSet = {},
		curLangType = '',
		q = null,
		ajax = null,
		i18n = {
			angular: angular,
			module: angular.module('i18n', ['pascalprecht.translate']),
			getLang: getLang,
			setLang: setLang,
			getAllLang: getAllLang,
			setAllLang: setAllLang,
			getLangType: getLangType,
			setLangType: setLangType,
			config: config,
			on: on,
			off: off
		};

	i18n.config({
		http: {
			method: 'GET'
		},
		defLangType: 'zh-CN'
	});

	i18n.module.config(['$translateProvider', function($translateProvider) {
		$translateProvider.preferredLanguage(cfg.defLangType);
		$translateProvider.useSanitizeValueStrategy(null); // 消除插件自带的警告，插件要求必须明确设置。
		i18n.$translateProvider = $translateProvider;

		for (var langType in langSet) {
			$translateProvider.translations(langType, langSet[langType]);
		}
	}]);

	i18n.module.run(['$translate', '$http', '$q', function($translate, $http, $q) {
		q = $q;
		ajax = $http;
		i18n.$translate = $translate;
		if (langSet[cfg.defLangType] || cfg.paths[cfg.defLangType]) {
			i18n.setLangType(cfg.defLangType);
		}
	}]);

	function extend() {
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[0] || {},
			targetType = typeof target,
			toString = Object.prototype.toString,
			i = 1,
			length = arguments.length,
			deep = false;

		// 处理深拷贝
		if (targetType === 'boolean') {
			deep = target;

			// Skip the boolean and the target
			target = arguments[i] || {};
			targetType = typeof target;
			i++;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if (targetType !== 'object' && targetType !== 'function') {
			target = {};
		}

		// 如果没有合并的对象，则表示 target 为合并对象，将 target 合并给当前函数的持有者
		if (i === length) {
			target = this;
			i--;
		}

		for (; i < length; i++) {

			// Only deal with non-null/undefined values
			if ((options = arguments[i]) != null) {

				// Extend the base object
				for (name in options) {
					src = target[name];
					copy = options[name];

					// 防止死循环
					if (target === copy) {
						continue;
					}

					// 深拷贝对象或者数组
					if (deep && copy &&
						(copyIsArray = toString.call(copy) === '[object Array]') ||
						(toString.call(copy) === '[object Object]')) {

						if (copyIsArray) {
							copyIsArray = false;
							src = src && (toString.call(src) === '[object Array]') ? src : [];

						} else {
							src = src && (toString.call(src) === '[object Object]') ? src : {};
						}

						target[name] = extend(deep, src, copy);


					} else if (copy !== undefined) { // 仅忽略未定义的值
						target[name] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	}

	/**
	 * 获取当前语言
	 * @param  {String}        key  可选。传入语言 key
	 * @return {String|Object}      返回当前语言类型下 key 的对应值。如果没有传参，则返回当前语言字典对象。
	 */
	function getLang(key) {
		return key === undefined ? angular.copy(langSet[curLangType]) : (langSet[curLangType] && langSet[curLangType][key]);
	}

	/**
	 * 设置当前语言
	 * @param {String|Object} key    传入语言 key。如果传入的是对象，则会将该对象与当前语言字典对象合并。
	 * @param {String}        value  传入 key 对应的 value。
	 */
	function setLang(key, value) {
		if (!curLangType) return;

		var langDict;
		if (typeof key === 'object') {
			langDict = key;
		} else {
			langDict = {};
			langDict[key] = value;
		}

		langSet[curLangType] = extend({}, langSet[curLangType], langDict);

		if (i18n.$translateProvider) {
			i18n.$translateProvider.translations(curLangType, langSet[curLangType]);
			i18n.$translate.use(curLangType);
		}

		return i18n;
	}

	/**
	 * 获取全部语言对象
	 * @param  {String} langType  可选。传入语言类型
	 * @return {Object}           返回当前语言类型对应的语言对象。如果没有传参，则返回包含所有语言对象的集合。
	 */
	function getAllLang(langType) {
		return langType === undefined ?
			angular.copy(langSet) :
			angular.copy(langSet[cfg.caseSensitive ? langType : langType.toUpperCase()]);
	}

	/**
	 * 设置全部语言对象
	 * @param {String|Object} langType  传入语言类型。如果传入的是对象，则会将该对象与包含所有语言字典对象的集合合并。
	 * @param {Object}        langDict  传入语言字典对象。
	 */
	function setAllLang(langType, langDict) {
		var newLangSet,
			caseLangType;

		if (typeof langType === 'object') {
			newLangSet = langType;
		} else if (typeof langType === 'string') {
			caseLangType = cfg.caseSensitive ? langType : langType.toUpperCase();
			newLangSet = {};
			newLangSet[caseLangType] = langDict;
		} else {
			return i18n;
		}

		for (langType in newLangSet) {
			caseLangType = cfg.caseSensitive ? langType : langType.toUpperCase();
			langSet[caseLangType] = extend({}, langSet[caseLangType], newLangSet[langType]);
		}

		if (i18n.$translateProvider) {
			for (langType in langSet) {
				i18n.$translateProvider.translations(langType, langSet[langType]);
			}
			// 语言包更新完后，需要重新使用才能更新到视图
			i18n.$translate.use(curLangType);
		}

		return i18n;
	}

	/**
	 * 获取当前语言类型
	 * @return {String} 返回当前语言类型
	 */
	function getLangType() {
		return curLangType;
	}

	/**
	 * 设置当前语言类型（必须应用启动后才可以使用）
	 * @param  {String}        langType 需要设置的当前语言类型
	 * @return {Promise}                返回一个 Promise 对象。Promise 对象 resolve 时，表示语言设置成功，并会将当前语言类型作为参数传入。
	 */
	function setLangType(langType) {
		if (!cfg.caseSensitive) {
			langType = langType.toUpperCase();
		}

		var defer = q.defer();

		defer.promise.then(function() {
			angular.forEach(callbackSet['change'], function(cb) {
				cb.call(i18n, langType);
			});
		});

		if (langType === curLangType) {
			defer.resolve();
			return defer.promise;
		}

		if (langSet[langType]) {
			curLangType = langType;
			i18n.$translate.use(curLangType).then(function() {
				// 待语言渲染完成后触发
				setTimeout(function() {
					defer.resolve();
				});
			});
		} else if (cfg.paths[langType]) {
			var options = extend(true, {}, cfg.http, { url: cfg.paths[langType] });

			ajax(options)
				.then(function(response) {
					if (response.status === 200) {
						langSet[langType] = response.data;
						i18n.$translateProvider.translations(langType, response.data);
						curLangType = langType;
						angular.forEach(callbackSet['requireLangDone'], function(cb) {
							cb.call(i18n, langType);
						});
						i18n.$translate.use(curLangType).then(function() {
							// 待语言渲染完成后触发
							setTimeout(function() {
								defer.resolve();
							});
						});
					} else {
						angular.forEach(callbackSet['requireLangFail'], function(cb) {
							cb.call(i18n, langType);
						});
						defer.reject();
					}
				}, function() {
					angular.forEach(callbackSet['requireLangFail'], function(cb) {
						cb.call(i18n, langType);
					});
					defer.reject();
				});
		} else {
			defer.reject();
		}

		return defer.promise;
	}

	/**
	 * 设置配置对象
	 * @param {Object} config 配置对象
	 */
	function config(config) {
		if (!config) return i18n;

		extend(true, cfg, config);

		var langType,
			caseLangType,
			paths = cfg.paths,
			defLangType = cfg.defLangType,
			caseSensitive = cfg.caseSensitive;

		if (paths) {
			for (langType in paths) {
				caseLangType = caseSensitive ? langType : langType.toUpperCase();
				if (caseLangType !== langType) {
					paths[caseLangType] = paths[langType];
					delete paths[langType];
				}
			}
		}

		if (!caseSensitive) {
			config.defLangType = defLangType.toUpperCase();
		}

		return i18n;
	}

	/**
	 * 注册事件监听
	 * @param  {String}             type      事件类型。
	 * @param  {Function}           callback  事件监听函数。
 	 * @return {Function|Undefined}           如果注册成功，则返回一个反注册函数，调用它可以取消监听。
	 */
	function on(type, callback) {
		var cbArr;

		if (callbackSet[type]) {
			cbArr = callbackSet[type];
		} else {
			return;
		}

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
			return i18n;

		} else if (typeStr === 'function') {
			callback = type;
			cbSet = callbackSet;

		} else if (typeStr === 'string') {
			if (callbackSet[type]) {
				cbSet = {};
				cbSet[type] = callbackSet[type];
			} else {
				return i18n;
			}

			if (callback === undefined) {
				cbSet[type].length = 0;
			}
		} else {
			return i18n;
		}

		var cbArr, index;
		for (i in cbSet) {
			cbArr = cbSet[i];
			index = cbArr.indexOf(callback);
			if (index >= 0) {
				cbArr.splice(index, 1);
				continue;
			}
		}

		return i18n;
	}

	return i18n;
}));
