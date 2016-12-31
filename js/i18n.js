/**
 * Angular 1.X 国际化
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
 * - setDefLangType      设置默认语言类型。（只能在应用启动前设置）
 * - setHttpOptions      设置 $http 请求的默认配置选项。
 * - requireLangDone     注册请求语言成功的回调。
 * - requireLangFail     注册请求语言失败的回调。
 *
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

	var requireLangDoneCallback, requireLangFailCallback,
		langSet = {},
		defLangType = 'zh-CN',
		curLangType = '',
		q = null,
		ajax = null,
		httpOptions = {
			method: 'GET'
		},
		i18n = {
			angular: angular,
			module: angular.module('i18n', ['pascalprecht.translate']),
			getLang: getLang,
			setLang: setLang,
			getAllLang: getAllLang,
			setAllLang: setAllLang,
			getLangType: getLangType,
			setLangType: setLangType,
			setDefLangType: setDefLangType,
			setHttpOptions: setHttpOptions,
			requireLangDone: requireLangDone,
			requireLangFail: requireLangFail
		};

	i18n.module.run(['$translate', '$http', '$q', function($translate, $http, $q) {
		q = $q;
		ajax = $http;
		i18n.$translate = $translate;
		(langSet[defLangType] || httpOptions.url) && i18n.setLangType(defLangType);
	}]);

	i18n.module.config(['$translateProvider', function($translateProvider) {
		$translateProvider.preferredLanguage(defLangType);
		$translateProvider.useSanitizeValueStrategy(null); // 消除插件自带的警告，插件要求必须明确设置。
		i18n.$translateProvider = $translateProvider;

		for (var langType in langSet) {
			$translateProvider.translations(langType, langSet[langType]);
		}
	}]);

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

		langSet[curLangType] = angular.extend({}, langSet[curLangType], langDict);

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
		return langType === undefined ? angular.copy(langSet) : angular.copy(langSet[langType.toUpperCase()]);
	}

	/**
	 * 设置全部语言对象
	 * @param {String|Object} langType  传入语言类型。如果传入的是对象，则会将该对象与包含所有语言字典对象的集合合并。
	 * @param {Object}        langDict  传入语言字典对象。
	 */
	function setAllLang(langType, langDict) {

		var newLangSet,
			upperCaseLangType;
		if (typeof langType === 'object') {
			newLangSet = langType;
		} else if (typeof langType === 'string') {
			upperCaseLangType = langType.toUpperCase();
			newLangSet = {};
			newLangSet[upperCaseLangType] = langDict;
		} else {
			return i18n;
		}

		for (langType in newLangSet) {
			upperCaseLangType = langType.toUpperCase();
			langSet[upperCaseLangType] = angular.extend({}, langSet[upperCaseLangType], newLangSet[langType]);
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
	 * @param  {String|Object} options  可选。新语言的 http 请求配置，包含 url 与 data 等。如果传入字符串，则表示 url。
	 * @return {Promise}                返回一个 Promise 对象。Promise 对象 resolve 时，表示语言设置成功，并会将当前语言类型作为参数传入。
	 */
	function setLangType(langType, options) {
		langType = langType.toUpperCase();

		var defer = q.defer();

		if (langType === curLangType) {
			defer.resolve();
			return defer.promise;
		}

		if (langSet[langType]) {
			curLangType = langType;
			i18n.$translate.use(curLangType).then(defer.resolve);
		} else {
			var type = typeof options;

			if (type === 'string') {
				options = { url: options }
			} else if (type === 'object') {
				options = angular.extend({}, httpOptions, options);
			} else {
				options = httpOptions;
			}

			ajax(options)
				.then(function(response) {
					if (response.status === 200) {
						langSet[langType] = response.data;
						i18n.$translateProvider.translations(langType, response.data);
						curLangType = langType;
						requireLangDoneCallback && requireLangDoneCallback.apply(i18n, arguments);
						i18n.$translate.use(curLangType).then(defer.resolve);
					} else {
						requireLangFailCallback && requireLangFailCallback.apply(i18n, arguments);
						defer.reject();
					}
				}, function() {
					requireLangFailCallback && requireLangFailCallback.apply(i18n, arguments);
					defer.reject();
				});
		}

		return defer.promise;
	}

	/**
	 * 设置默认语言类型。只能在应用启动前设置，如果应用启动前未设置，则默认语言将被设置为 'zh-CN'
	 * @param {String} langType 语言类型，如：'zh-CN'、'en-US'
	 */
	function setDefLangType(langType) {
		defLangType = langType.toUpperCase();
		return i18n;
	}

	/**
	 * 设置 $http 请求的默认配置选项
	 * @param {Object} options $http 的配置对象
	 */
	function setHttpOptions(options) {
		angular.extend(httpOptions, options);
		return i18n;
	}

	/**
	 * 注册请求语言成功的回调
	 * @param  {Function} callback 请求语言成功的回调
	 */
	function requireLangDone(callback) {
		requireLangDoneCallback = callback;
		return i18n;
	}

	/**
	 * 注册请求语言失败的回调
	 * @param  {Function} callback 请求语言失的回调
	 */
	function requireLangFail(callback) {
		requireLangFailCallback = callback;
		return i18n;
	}

	return i18n;
}));
