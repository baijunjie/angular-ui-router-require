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
		language = {},
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
			getAllLang: getAllLang,
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
		(language[defLangType] || httpOptions.url) && i18n.setLangType(defLangType);
	}]);

	i18n.module.config(['$translateProvider', function($translateProvider) {
		$translateProvider.preferredLanguage(defLangType);
		$translateProvider.useSanitizeValueStrategy(null); // 消除插件自带的警告，插件要求必须明确设置。
		i18n.$translateProvider = $translateProvider;

		for (var langType in language) {
			$translateProvider.translations(langType, language[langType]);
		}
	}]);

	/**
	 * 获取当前语言
	 * @param  {String}            key 可选。传入语言 key
	 * @return {String|Object}         返回当前语言类型下 key 的对应值。如果没有传参，则返回当前语言对象。
	 */
	function getLang(key) {
		return key === undefined ? language[curLangType] : language[curLangType][key];
	}

	/**
	 * 获取全部语言对象
	 * @return {Object} language 对象
	 */
	function getAllLang() {
		return angular.extend({}, language);
	}

	/**
	 * 设置全部语言对象
	 * @param {Object} lang  语言对象，key 对应语言类型，value 表示语言类型对应的语言字典对象。
	 */
	function setAllLang(lang) {
		angular.extend(language, lang);
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
		var defer = q.defer();

		if (langType === curLangType) {
			defer.resolve();
			return defer.promise;
		}

		if (language[langType]) {
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
						language[langType] = response.data;
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
	 * @param {String} langType 语言 key，如：'zh-CN'、'en-US'
	 */
	function setDefLangType(langType) {
		defLangType = langType;
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
