(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    var val = aliases[name];
    return (val && name !== val) ? expandAlias(val) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (bundle && typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = typeof window === 'undefined' ? this : window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};

require.register("curvature/base/Bag.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Bag = void 0;

var _Bindable = require("./Bindable");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var toId = function toId(_int) {
  return Number(_int).toString(36);
};

var fromId = function fromId(id) {
  return parseInt(id, 36);
};

var Bag = /*#__PURE__*/function () {
  function Bag() {
    var changeCallback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

    _classCallCheck(this, Bag);

    this.meta = Symbol('meta');
    this.content = new Map();
    this.list = _Bindable.Bindable.makeBindable({});
    this.current = 0;
    this.type = undefined;
    this.changeCallback = changeCallback;
  }

  _createClass(Bag, [{
    key: "add",
    value: function add(item) {
      if (item === undefined || !(item instanceof Object)) {
        throw new Error('Only objects may be added to Bags.');
      }

      if (this.type && !(item instanceof this.type)) {
        console.error(this.type, item);
        throw new Error("Only objects of type ".concat(this.type, " may be added to this Bag."));
      }

      if (this.content.has(item)) {
        return;
      }

      var id = toId(this.current++);
      this.content.set(item, id);
      this.list[id] = item;

      if (this.changeCallback) {
        this.changeCallback(item, this.meta, Bag.ITEM_ADDED, id);
      }
    }
  }, {
    key: "remove",
    value: function remove(item) {
      if (item === undefined || !(item instanceof Object)) {
        throw new Error('Only objects may be removed from Bags.');
      }

      if (this.type && !(item instanceof this.type)) {
        console.error(this.type, item);
        throw new Error("Only objects of type ".concat(this.type, " may be removed from this Bag."));
      }

      if (!this.content.has(item)) {
        if (this.changeCallback) {
          this.changeCallback(item, this.meta, 0, undefined);
        }

        return false;
      }

      var id = this.content.get(item);
      delete this.list[id];
      this.content["delete"](item);

      if (this.changeCallback) {
        this.changeCallback(item, this.meta, Bag.ITEM_REMOVED, id);
      }

      return item;
    }
  }, {
    key: "items",
    value: function items() {
      return Array.from(this.content.entries()).map(function (entry) {
        return entry[0];
      });
    }
  }]);

  return Bag;
}();

exports.Bag = Bag;
Object.defineProperty(Bag, 'ITEM_ADDED', {
  configurable: false,
  enumerable: false,
  writable: true,
  value: 1
});
Object.defineProperty(Bag, 'ITEM_REMOVED', {
  configurable: false,
  enumerable: false,
  writable: true,
  value: -1
});
  })();
});

require.register("curvature/base/Bindable.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Bindable = void 0;

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Ref = Symbol('ref');
var Original = Symbol('original');
var Deck = Symbol('deck');
var Binding = Symbol('binding');
var SubBinding = Symbol('subBinding');
var BindingAll = Symbol('bindingAll');
var IsBindable = Symbol('isBindable');
var Wrapping = Symbol('wrapping');
var Executing = Symbol('executing');
var Stack = Symbol('stack');
var ObjSymbol = Symbol('object');
var Wrapped = Symbol('wrapped');
var Unwrapped = Symbol('unwrapped');
var GetProto = Symbol('getProto');
var OnGet = Symbol('onGet');
var OnAllGet = Symbol('onAllGet');
var TypedArray = Object.getPrototypeOf(Int8Array);
var win = window || {};
var excludedClasses = [win.Node, win.File, win.Map, win.Set, win.ResizeObserver, win.MutationObserver, win.PerformanceObserver, win.IntersectionObserver].filter(function (x) {
  return typeof x === 'function';
});

var Bindable = /*#__PURE__*/function () {
  function Bindable() {
    _classCallCheck(this, Bindable);
  }

  _createClass(Bindable, null, [{
    key: "isBindable",
    value: function isBindable(object) {
      if (!object || !object[IsBindable]) {
        return false;
      }

      return object[IsBindable] === Bindable;
    }
  }, {
    key: "onDeck",
    value: function onDeck(object, key) {
      return object[Deck][key] || false;
    }
  }, {
    key: "ref",
    value: function ref(object) {
      return object[Ref] || false;
    }
  }, {
    key: "makeBindable",
    value: function makeBindable(object) {
      return this.make(object);
    }
  }, {
    key: "make",
    value: function make(object) {
      var _this = this;

      if (!object || !['function', 'object'].includes(_typeof(object))) {
        return object;
      }

      if (excludedClasses.filter(function (x) {
        return object instanceof x;
      }).length || Object.isSealed(object) || !Object.isExtensible(object)) {
        return object;
      }

      if (object[Ref]) {
        return object;
      }

      if (object[Binding]) {
        return object;
      }

      Object.defineProperty(object, Ref, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: object
      });
      Object.defineProperty(object, Original, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: object
      });
      Object.defineProperty(object, Deck, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: {}
      });
      Object.defineProperty(object, Binding, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: {}
      });
      Object.defineProperty(object, SubBinding, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: new Map()
      });
      Object.defineProperty(object, BindingAll, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: []
      });
      Object.defineProperty(object, IsBindable, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: Bindable
      });
      Object.defineProperty(object, Executing, {
        enumerable: false,
        writable: true
      });
      Object.defineProperty(object, Wrapping, {
        enumerable: false,
        writable: true
      });
      Object.defineProperty(object, Stack, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: []
      });
      Object.defineProperty(object, '___before___', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: []
      });
      Object.defineProperty(object, '___after___', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: []
      });
      Object.defineProperty(object, Wrapped, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: {}
      });
      Object.defineProperty(object, Unwrapped, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: {}
      });

      var bindTo = function bindTo(property) {
        var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var bindToAll = false;

        if (Array.isArray(property)) {
          var debinders = property.map(function (p) {
            return bindTo(p, callback, options);
          });
          return function () {
            return debinders.map(function (d) {
              return d();
            });
          };
        }

        if (property instanceof Function) {
          options = callback || {};
          callback = property;
          bindToAll = true;
        }

        if (options.delay >= 0) {
          callback = _this.wrapDelayCallback(callback, options.delay);
        }

        if (options.throttle >= 0) {
          callback = _this.wrapThrottleCallback(callback, options.throttle);
        }

        if (options.wait >= 0) {
          callback = _this.wrapWaitCallback(callback, options.wait);
        }

        if (options.frame) {
          callback = _this.wrapFrameCallback(callback, options.frame);
        }

        if (options.idle) {
          callback = _this.wrapIdleCallback(callback);
        }

        if (bindToAll) {
          var _bindIndex = object[BindingAll].length;
          object[BindingAll].push(callback);

          if (!('now' in options) || options.now) {
            for (var i in object) {
              callback(object[i], i, object, false);
            }
          }

          return function () {
            delete object[BindingAll][_bindIndex];
          };
        }

        if (!object[Binding][property]) {
          object[Binding][property] = [];
        }

        var bindIndex = object[Binding][property].length;

        if (options.children) {
          var original = callback;

          callback = function callback() {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            var v = args[0];
            var subDebind = object[SubBinding].get(original);

            if (subDebind) {
              object[SubBinding]["delete"](original);
              subDebind();
            }

            if (_typeof(v) !== 'object') {
              original.apply(void 0, args);
              return;
            }

            var vv = Bindable.make(v);

            if (Bindable.isBindable(vv)) {
              object[SubBinding].set(original, vv.bindTo(function () {
                for (var _len2 = arguments.length, subArgs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                  subArgs[_key2] = arguments[_key2];
                }

                return original.apply(void 0, args.concat(subArgs));
              }, Object.assign({}, options, {
                children: false
              })));
            }

            original.apply(void 0, args);
          };
        }

        object[Binding][property].push(callback);

        if (!('now' in options) || options.now) {
          callback(object[property], property, object, false);
        }

        var cleaned = false;

        var debinder = function debinder() {
          var subDebind = object[SubBinding].get(callback);

          if (subDebind) {
            object[SubBinding]["delete"](callback);
            subDebind();
          }

          if (cleaned) {
            return;
          }

          cleaned = true;

          if (!object[Binding][property]) {
            return;
          }

          delete object[Binding][property][bindIndex];
        };

        if (options.removeWith && options.removeWith instanceof View) {
          options.removeWith.onRemove(function () {
            return debinder;
          });
        }

        return debinder;
      };

      Object.defineProperty(object, 'bindTo', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: bindTo
      });

      var ___before = function ___before(callback) {
        var beforeIndex = object.___before___.length;

        object.___before___.push(callback);

        var cleaned = false;
        return function () {
          if (cleaned) {
            return;
          }

          cleaned = true;
          delete object.___before___[beforeIndex];
        };
      };

      var ___after = function ___after(callback) {
        var afterIndex = object.___after___.length;

        object.___after___.push(callback);

        var cleaned = false;
        return function () {
          if (cleaned) {
            return;
          }

          cleaned = true;
          delete object.___after___[afterIndex];
        };
      };

      Object.defineProperty(object, 'bindChain', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function value(path, callback) {
          var parts = path.split('.');
          var node = parts.shift();
          var subParts = parts.slice(0);
          var debind = [];
          debind.push(object.bindTo(node, function (v, k, t, d) {
            var rest = subParts.join('.');

            if (subParts.length === 0) {
              callback(v, k, t, d);
              return;
            }

            if (v === undefined) {
              v = t[k] = _this.makeBindable({});
            }

            debind = debind.concat(v.bindChain(rest, callback));
          })); // console.log(debind);

          return function () {
            return debind.map(function (x) {
              return x();
            });
          };
        }
      });
      Object.defineProperty(object, '___before', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: ___before
      });
      Object.defineProperty(object, '___after', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: ___after
      });

      var isBound = function isBound() {
        for (var i in object[BindingAll]) {
          if (object[BindingAll][i]) {
            return true;
          }
        }

        for (var _i in object[Binding]) {
          for (var j in object[Binding][_i]) {
            if (object[Binding][_i][j]) {
              return true;
            }
          }
        }

        return false;
      };

      Object.defineProperty(object, 'isBound', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: isBound
      });

      var _loop = function _loop(i) {
        if (object[i] && object[i] instanceof Object && !object[i] instanceof Promise) {
          if (!excludedClasses.filter(function (excludeClass) {
            return object[i] instanceof excludeClass;
          }).length && Object.isExtensible(object[i]) && !Object.isSealed(object[i])) {
            object[i] = Bindable.make(object[i]);
          }
        }
      };

      for (var i in object) {
        _loop(i);
      }

      var set = function set(target, key, value) {
        if (key === Original) {
          return true;
        }

        if (object[Deck][key] !== undefined && object[Deck][key] === value) {
          return true;
        }

        if (typeof key === 'string' && key.substring(0, 3) === '___' && key.slice(-3) === '___') {
          return true;
        }

        if (target[key] === value) {
          return true;
        }

        if (value && value instanceof Object) {
          if (!excludedClasses.filter(function (x) {
            return object instanceof x;
          }).length && Object.isExtensible(object) && !Object.isSealed(object)) {
            value = Bindable.makeBindable(value);
          }
        }

        object[Deck][key] = value;

        for (var _i2 in object[BindingAll]) {
          if (!object[BindingAll][_i2]) {
            continue;
          }

          object[BindingAll][_i2](value, key, target, false);
        }

        var stop = false;

        if (key in object[Binding]) {
          for (var _i3 in object[Binding][key]) {
            if (!object[Binding][key]) {
              continue;
            }

            if (!object[Binding][key][_i3]) {
              continue;
            }

            if (object[Binding][key][_i3](value, key, target, false, target[key]) === false) {
              stop = true;
            }
          }
        }

        delete object[Deck][key];

        if (!stop) {
          var descriptor = Object.getOwnPropertyDescriptor(target, key);
          var excluded = target instanceof File && key == 'lastModifiedDate';

          if (!excluded && (!descriptor || descriptor.writable) && target[key] === value) {
            target[key] = value;
          }
        }

        return Reflect.set(target, key, value);
      };

      var deleteProperty = function deleteProperty(target, key) {
        if (!(key in target)) {
          return true;
        }

        for (var _i4 in object[BindingAll]) {
          object[BindingAll][_i4](undefined, key, target, true, target[key]);
        }

        if (key in object[Binding]) {
          for (var _i5 in object[Binding][key]) {
            if (!object[Binding][key][_i5]) {
              continue;
            }

            object[Binding][key][_i5](undefined, key, target, true, target[key]);
          }
        }

        delete target[key];
        return true;
      };

      var construct = function construct(target, args) {
        var key = 'constructor';

        for (var _i6 in target.___before___) {
          target.___before___[_i6](target, key, target[Stack], undefined, args);
        }

        var instance = Bindable.make(_construct(target[Original], _toConsumableArray(args)));

        for (var _i7 in target.___after___) {
          target.___after___[_i7](target, key, target[Stack], instance, args);
        }

        return instance;
      };

      var get = function get(target, key) {
        if (key === Ref || key === Original || key === 'apply' || key === 'isBound' || key === 'bindTo' || key === '__proto__') {
          return target[key];
        }

        var descriptor = Object.getOwnPropertyDescriptor(object, key);

        if (descriptor && !descriptor.configurable && !descriptor.writable) {
          return target[key];
        }

        if (object[OnAllGet]) {
          return object[OnAllGet](key);
        }

        if (object[OnGet] && !(key in object)) {
          return object[OnGet](key);
        }

        if (target[Wrapped][key]) {
          return target[Wrapped][key];
        }

        if (descriptor && !descriptor.configurable && !descriptor.writable) {
          target[Wrapped][key] = target[key];
          return target[Wrapped][key];
        }

        if (typeof target[key] === 'function') {
          Object.defineProperty(target[Unwrapped], key, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: target[key]
          });
          target[Wrapped][key] = Bindable.make(function () {
            var objRef = object instanceof Promise || object instanceof Map || object instanceof Set || typeof TypedArray === 'function' && object instanceof TypedArray || typeof EventTarget === 'function' && object instanceof EventTarget || typeof ResizeObserver === 'function' && object instanceof ResizeObserver || typeof MutationObserver === 'function' && object instanceof MutationObserver || typeof PerformanceObserver === 'function' && object instanceof PerformanceObserver || typeof IntersectionObserver === 'function' && object instanceof IntersectionObserver ? object : object[Ref];
            target[Executing] = key;
            target[Stack].unshift(key);

            for (var _len3 = arguments.length, providedArgs = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
              providedArgs[_key3] = arguments[_key3];
            }

            for (var _i8 in target.___before___) {
              target.___before___[_i8](target, key, target[Stack], object, providedArgs);
            }

            var ret;

            if (new.target) {
              ret = _construct(target[Unwrapped][key], providedArgs);
            } else {
              var prototype = Object.getPrototypeOf(target);
              var isMethod = prototype[key] === target[key];

              if (isMethod) {
                ret = target[key].apply(objRef || object, providedArgs);
              } else {
                ret = target[key].apply(target, providedArgs);
              }
            }

            for (var _i9 in target.___after___) {
              target.___after___[_i9](target, key, target[Stack], object, providedArgs);
            }

            target[Executing] = null;
            target[Stack].shift();
            return ret;
          });
          return target[Wrapped][key];
        }

        return target[key];
      };

      var getPrototypeOf = function getPrototypeOf(target) {
        if (GetProto in object) {
          return object[GetProto];
        }

        return Reflect.getPrototypeOf(target);
      };

      Object.defineProperty(object, Ref, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: new Proxy(object, {
          get: get,
          set: set,
          construct: construct,
          getPrototypeOf: getPrototypeOf,
          deleteProperty: deleteProperty
        })
      });
      return object[Ref];
    }
  }, {
    key: "clearBindings",
    value: function clearBindings(object) {
      var clearObj = function clearObj(o) {
        return Object.keys(o).map(function (k) {
          return delete o[k];
        });
      };

      var maps = function maps(func) {
        return function () {
          for (var _len4 = arguments.length, os = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            os[_key4] = arguments[_key4];
          }

          return os.map(func);
        };
      };

      var clearObjs = maps(clearObj);
      clearObjs(object[Wrapped], object[Binding], object[BindingAll], object.___after___, object.___before___);
    }
  }, {
    key: "resolve",
    value: function resolve(object, path) {
      var owner = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var node;
      var pathParts = path.split('.');
      var top = pathParts[0];

      while (pathParts.length) {
        if (owner && pathParts.length === 1) {
          var obj = this.makeBindable(object);
          return [obj, pathParts.shift(), top];
        }

        node = pathParts.shift();

        if (!node in object || !object[node] || !(object[node] instanceof Object)) {
          object[node] = {};
        }

        object = this.makeBindable(object[node]);
      }

      return [this.makeBindable(object), node, top];
    }
  }, {
    key: "wrapDelayCallback",
    value: function wrapDelayCallback(callback, delay) {
      return function () {
        for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
          args[_key5] = arguments[_key5];
        }

        return setTimeout(function () {
          return callback.apply(void 0, args);
        }, delay);
      };
    }
  }, {
    key: "wrapThrottleCallback",
    value: function wrapThrottleCallback(callback, throttle) {
      var _this2 = this;

      this.throttles.set(callback, false);
      return function (callback) {
        return function () {
          if (_this2.throttles.get(callback, true)) {
            return;
          }

          callback.apply(void 0, arguments);

          _this2.throttles.set(callback, true);

          setTimeout(function () {
            _this2.throttles.set(callback, false);
          }, throttle);
        };
      }(callback);
    }
  }, {
    key: "wrapWaitCallback",
    value: function wrapWaitCallback(callback, wait) {
      var waiter = false;
      return function () {
        for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
          args[_key6] = arguments[_key6];
        }

        if (waiter) {
          clearTimeout(waiter);
          waiter = false;
        }

        waiter = setTimeout(function () {
          return callback.apply(void 0, args);
        }, wait);
      };
    }
  }, {
    key: "wrapFrameCallback",
    value: function wrapFrameCallback(callback, frames) {
      return function () {
        for (var _len7 = arguments.length, args = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
          args[_key7] = arguments[_key7];
        }

        requestAnimationFrame(function () {
          return callback.apply(void 0, args);
        });
      };
    }
  }, {
    key: "wrapIdleCallback",
    value: function wrapIdleCallback(callback) {
      return function () {
        for (var _len8 = arguments.length, args = new Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
          args[_key8] = arguments[_key8];
        }

        // Compatibility for Safari 08/2020
        var req = window.requestIdleCallback || requestAnimationFrame;
        req(function () {
          return callback.apply(void 0, args);
        });
      };
    }
  }]);

  return Bindable;
}();

exports.Bindable = Bindable;

_defineProperty(Bindable, "throttles", new WeakMap());

Object.defineProperty(Bindable, 'OnGet', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: OnGet
});
Object.defineProperty(Bindable, 'GetProto', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: GetProto
});
Object.defineProperty(Bindable, 'OnAllGet', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: OnAllGet
});
  })();
});

require.register("curvature/base/Cache.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Cache = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Cache = /*#__PURE__*/function () {
  function Cache() {
    _classCallCheck(this, Cache);
  }

  _createClass(Cache, null, [{
    key: "store",
    value: function store(key, value, expiry) {
      var bucket = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'standard';
      var expiration = 0;

      if (expiry) {
        expiration = expiry * 1000 + new Date().getTime();
      } // console.log(
      // 	`Caching ${key} until ${expiration} in ${bucket}.`
      // 	, value
      // 	, this.bucket
      // );


      if (!this.bucket) {
        this.bucket = {};
      }

      if (!this.bucket[bucket]) {
        this.bucket[bucket] = {};
      }

      this.bucket[bucket][key] = {
        expiration: expiration,
        value: value
      };
    }
  }, {
    key: "load",
    value: function load(key) {
      var defaultvalue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var bucket = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'standard';

      // console.log(
      // 	`Checking cache for ${key} in ${bucket}.`
      // 	, this.bucket
      // );
      if (this.bucket && this.bucket[bucket] && this.bucket[bucket][key]) {
        // console.log(this.bucket[bucket][key].expiration, (new Date).getTime());
        if (this.bucket[bucket][key].expiration == 0 || this.bucket[bucket][key].expiration > new Date().getTime()) {
          return this.bucket[bucket][key].value;
        }
      }

      return defaultvalue;
    }
  }]);

  return Cache;
}();

exports.Cache = Cache;
  })();
});

require.register("curvature/base/Config.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Config = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var AppConfig = {};

try {
  AppConfig = require('/Config').Config || {};
} catch (error) {
  window.devMode === true && console.error(error);
}

var Config = /*#__PURE__*/function () {
  function Config() {
    _classCallCheck(this, Config);
  }

  _createClass(Config, null, [{
    key: "get",
    value: function get(name) {
      return this.configs[name];
    }
  }, {
    key: "set",
    value: function set(name, value) {
      this.configs[name] = value;
      return this;
    }
  }, {
    key: "dump",
    value: function dump() {
      return this.configs;
    }
  }, {
    key: "init",
    value: function init() {
      for (var _len = arguments.length, configs = new Array(_len), _key = 0; _key < _len; _key++) {
        configs[_key] = arguments[_key];
      }

      for (var i in configs) {
        var config = configs[i];

        if (typeof config === 'string') {
          config = JSON.parse(config);
        }

        for (var name in config) {
          var value = config[name];
          return this.configs[name] = value;
        }
      }

      return this;
    }
  }]);

  return Config;
}();

exports.Config = Config;
Object.defineProperty(Config, 'configs', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: AppConfig
});
  })();
});

require.register("curvature/base/Dom.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Dom = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var traversals = 0;

var Dom = /*#__PURE__*/function () {
  function Dom() {
    _classCallCheck(this, Dom);
  }

  _createClass(Dom, null, [{
    key: "mapTags",
    value: function mapTags(doc, selector, callback, startNode, endNode) {
      var result = [];
      var started = true;

      if (startNode) {
        started = false;
      }

      var ended = false;
      var treeWalker = document.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode: function acceptNode(node, walker) {
          if (!started) {
            if (node === startNode) {
              started = true;
            } else {
              return NodeFilter.FILTER_SKIP;
            }
          }

          if (endNode && node === endNode) {
            ended = true;
          }

          if (ended) {
            return NodeFilter.FILTER_SKIP;
          }

          if (selector) {
            if (node instanceof Element) {
              if (node.matches(selector)) {
                return NodeFilter.FILTER_ACCEPT;
              }
            }

            return NodeFilter.FILTER_SKIP;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }, false);
      var traversal = traversals++;

      while (treeWalker.nextNode()) {
        result.push(callback(treeWalker.currentNode, treeWalker));
      }

      return result;
    }
  }, {
    key: "dispatchEvent",
    value: function dispatchEvent(doc, event) {
      doc.dispatchEvent(event);
      Dom.mapTags(doc, false, function (node) {
        node.dispatchEvent(event);
      });
    }
  }]);

  return Dom;
}();

exports.Dom = Dom;
  })();
});

require.register("curvature/base/Mixin.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Mixin = void 0;

var _Bindable = require("./Bindable");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Constructor = Symbol('constructor');
var MixinList = Symbol('mixinList');

var Mixin = /*#__PURE__*/function () {
  function Mixin() {
    _classCallCheck(this, Mixin);
  }

  _createClass(Mixin, null, [{
    key: "from",
    value: function from(baseClass) {
      for (var _len = arguments.length, mixins = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        mixins[_key - 1] = arguments[_key];
      }

      var constructors = [];

      var newClass = /*#__PURE__*/function (_baseClass) {
        _inherits(newClass, _baseClass);

        var _super = _createSuper(newClass);

        function newClass() {
          var _this;

          _classCallCheck(this, newClass);

          for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          _this = _super.call.apply(_super, [this].concat(args));

          var _iterator = _createForOfIteratorHelper(mixins),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var mixin = _step.value;

              if (mixin[Mixin.Constructor]) {
                mixin[Mixin.Constructor].apply(_assertThisInitialized(_this));
              }

              switch (_typeof(mixin)) {
                // case 'function':
                // 	this.mixClass(mixin, newClass);
                // 	break;
                case 'object':
                  Mixin.mixObject(mixin, _assertThisInitialized(_this));
                  break;
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }

          return _this;
        }

        return newClass;
      }(baseClass);

      return newClass;
    }
  }, {
    key: "with",
    value: function _with() {
      for (var _len3 = arguments.length, mixins = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        mixins[_key3] = arguments[_key3];
      }

      return this.from.apply(this, [Object].concat(mixins));
    }
  }, {
    key: "mixObject",
    value: function mixObject(mixin, instance) {
      var _iterator2 = _createForOfIteratorHelper(Object.getOwnPropertyNames(mixin)),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var func = _step2.value;

          if (typeof mixin[func] === 'function') {
            instance[func] = mixin[func].bind(instance);
            continue;
          }

          instance[func] = mixin[func];
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      var _iterator3 = _createForOfIteratorHelper(Object.getOwnPropertySymbols(mixin)),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var _func = _step3.value;

          if (typeof mixin[_func] === 'function') {
            instance[_func] = mixin[_func].bind(instance);
            continue;
          }

          instance[_func] = mixin[_func];
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
  }, {
    key: "mixClass",
    value: function mixClass(cls, newClass) {
      var _iterator4 = _createForOfIteratorHelper(Object.getOwnPropertyNames(cls.prototype)),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var func = _step4.value;
          newClass.prototype[func] = cls.prototype[func].bind(newClass.prototype);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }

      var _iterator5 = _createForOfIteratorHelper(Object.getOwnPropertySymbols(cls.prototype)),
          _step5;

      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var _func2 = _step5.value;
          newClass.prototype[_func2] = cls.prototype[_func2].bind(newClass.prototype);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }

      var _iterator6 = _createForOfIteratorHelper(Object.getOwnPropertyNames(cls)),
          _step6;

      try {
        var _loop = function _loop() {
          var func = _step6.value;

          if (typeof cls[func] !== 'function') {
            return "continue";
          }

          var prev = newClass[func] || false;
          var meth = cls[func].bind(newClass);

          newClass[func] = function () {
            prev && prev.apply(void 0, arguments);
            return meth.apply(void 0, arguments);
          };
        };

        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var _ret = _loop();

          if (_ret === "continue") continue;
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }

      var _iterator7 = _createForOfIteratorHelper(Object.getOwnPropertySymbols(cls)),
          _step7;

      try {
        var _loop2 = function _loop2() {
          var func = _step7.value;

          if (typeof cls[func] !== 'function') {
            return "continue";
          }

          var prev = newClass[func] || false;
          var meth = cls[func].bind(newClass);

          newClass[func] = function () {
            prev && prev.apply(void 0, arguments);
            return meth.apply(void 0, arguments);
          };
        };

        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var _ret2 = _loop2();

          if (_ret2 === "continue") continue;
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
    }
  }, {
    key: "mix",
    value: function mix(mixinTo) {
      var constructors = [];
      var allStatic = {};
      var allInstance = {};

      var mixable = _Bindable.Bindable.makeBindable(mixinTo);

      var _loop3 = function _loop3(base) {
        var instanceNames = Object.getOwnPropertyNames(base.prototype);
        var staticNames = Object.getOwnPropertyNames(base);
        var prefix = /^(before|after)__(.+)/;

        var _iterator8 = _createForOfIteratorHelper(staticNames),
            _step8;

        try {
          var _loop5 = function _loop5() {
            var methodName = _step8.value;
            var match = methodName.match(prefix);

            if (match) {
              switch (match[1]) {
                case 'before':
                  mixable.___before(function (t, e, s, o, a) {
                    if (e !== match[2]) {
                      return;
                    }

                    var method = base[methodName].bind(o);
                    return method.apply(void 0, _toConsumableArray(a));
                  });

                  break;

                case 'after':
                  mixable.___after(function (t, e, s, o, a) {
                    if (e !== match[2]) {
                      return;
                    }

                    var method = base[methodName].bind(o);
                    return method.apply(void 0, _toConsumableArray(a));
                  });

                  break;
              }

              return "continue";
            }

            if (allStatic[methodName]) {
              return "continue";
            }

            if (typeof base[methodName] !== 'function') {
              return "continue";
            }

            allStatic[methodName] = base[methodName];
          };

          for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
            var _ret3 = _loop5();

            if (_ret3 === "continue") continue;
          }
        } catch (err) {
          _iterator8.e(err);
        } finally {
          _iterator8.f();
        }

        var _iterator9 = _createForOfIteratorHelper(instanceNames),
            _step9;

        try {
          var _loop6 = function _loop6() {
            var methodName = _step9.value;
            var match = methodName.match(prefix);

            if (match) {
              switch (match[1]) {
                case 'before':
                  mixable.___before(function (t, e, s, o, a) {
                    if (e !== match[2]) {
                      return;
                    }

                    var method = base.prototype[methodName].bind(o);
                    return method.apply(void 0, _toConsumableArray(a));
                  });

                  break;

                case 'after':
                  mixable.___after(function (t, e, s, o, a) {
                    if (e !== match[2]) {
                      return;
                    }

                    var method = base.prototype[methodName].bind(o);
                    return method.apply(void 0, _toConsumableArray(a));
                  });

                  break;
              }

              return "continue";
            }

            if (allInstance[methodName]) {
              return "continue";
            }

            if (typeof base.prototype[methodName] !== 'function') {
              return "continue";
            }

            allInstance[methodName] = base.prototype[methodName];
          };

          for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
            var _ret4 = _loop6();

            if (_ret4 === "continue") continue;
          }
        } catch (err) {
          _iterator9.e(err);
        } finally {
          _iterator9.f();
        }
      };

      for (var base = this; base && base.prototype; base = Object.getPrototypeOf(base)) {
        _loop3(base);
      }

      for (var methodName in allStatic) {
        mixinTo[methodName] = allStatic[methodName].bind(mixinTo);
      }

      var _loop4 = function _loop4(_methodName) {
        mixinTo.prototype[_methodName] = function () {
          for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            args[_key4] = arguments[_key4];
          }

          return allInstance[_methodName].apply(this, args);
        };
      };

      for (var _methodName in allInstance) {
        _loop4(_methodName);
      }

      return mixable;
    }
  }]);

  return Mixin;
}();

exports.Mixin = Mixin;
Mixin.Constructor = Constructor;
  })();
});

require.register("curvature/base/Router.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Router = void 0;

var _View = require("./View");

var _Cache = require("./Cache");

var _Config = require("./Config");

var _Routes = require("./Routes");

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var NotFoundError = Symbol('NotFound');
var InternalError = Symbol('Internal');

var Router = /*#__PURE__*/function () {
  function Router() {
    _classCallCheck(this, Router);
  }

  _createClass(Router, null, [{
    key: "wait",
    value: function wait(view) {
      var _this = this;

      var event = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'DOMContentLoaded';
      var node = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document;
      node.addEventListener(event, function () {
        _this.listen(view);
      });
    }
  }, {
    key: "listen",
    value: function listen(listener) {
      var _this2 = this;

      var routes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      this.routes = routes;
      Object.assign(this.query, this.queryOver({}));

      var listen = function listen(event) {
        event.preventDefault();

        if (event.state && 'routedId' in event.state) {
          if (event.state.routedId <= _this2.routeCount) {
            _this2.history.splice(event.state.routedId);

            _this2.routeCount = event.state.routedId;
          } else if (event.state.routedId > _this2.routeCount) {
            _this2.history.push(event.state.prev);

            _this2.routeCount = event.state.routedId;
          }
        } else {
          if (_this2.prevPath !== null && _this2.prevPath !== location.pathname) {
            _this2.history.push(_this2.prevPath);
          }
        }

        if (location.origin !== 'null') {
          _this2.match(location.pathname, listener);
        } else {
          _this2.match(_this2.nextPath, listener);
        }

        for (var i in _this2.query) {
          delete _this2.query[i];
        }

        Object.assign(_this2.query, _this2.queryOver({}));
      };

      window.addEventListener('popstate', listen);
      window.addEventListener('cvUrlChanged', listen);
      var route = location.origin !== 'null' ? location.pathname + location.search : false;

      if (location.origin && location.hash) {
        route += location.hash;
      }

      this.go(route !== false ? route : '/');
    }
  }, {
    key: "go",
    value: function go(path, silent) {
      var configTitle = _Config.Config.get('title');

      if (configTitle) {
        document.title = configTitle;
      }

      if (location.origin === 'null') {
        this.nextPath = path;
      } else if (silent === 2 && location.pathname !== path) {
        history.replaceState({
          routedId: this.routeCount,
          prev: this.prevPath,
          url: location.pathname
        }, null, path);
      } else if (location.pathname !== path) {
        history.pushState({
          routedId: ++this.routeCount,
          prev: this.prevPath,
          url: location.pathname
        }, null, path);
      }

      if (!silent) {
        if (silent === false) {
          this.path = null;
        }

        if (path.substring(0, 1) === '#') {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        } else {
          window.dispatchEvent(new CustomEvent('cvUrlChanged'));
        }
      }

      for (var i in this.query) {
        delete this.query[i];
      }

      Object.assign(this.query, this.queryOver({}));
      this.prevPath = path;
    }
  }, {
    key: "match",
    value: function match(path, listener) {
      var _this3 = this;

      var forceRefresh = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      if (this.path === path && !forceRefresh) {
        return;
      }

      this.queryString = location.search;
      this.path = path;
      var prev = this.prevPath;
      var current = listener.args.content;

      var routes = this.routes || listener.routes || _Routes.Routes.dump();

      var query = new URLSearchParams(location.search);

      for (var i in this.query) {
        delete this.query[i];
      }

      Object.assign(this.query, this.queryOver({}));
      var args = {},
          selected = false,
          result = '';
      path = path.substr(1).split('/');

      for (var _i in this.query) {
        args[_i] = this.query[_i];
      }

      L1: for (var _i2 in routes) {
        var route = _i2.split('/');

        if (route.length < path.length && route[route.length - 1] !== '*') {
          continue;
        }

        L2: for (var j in route) {
          if (route[j].substr(0, 1) == '%') {
            var argName = null;
            var groups = /^%(\w+)\??/.exec(route[j]);

            if (groups && groups[1]) {
              argName = groups[1];
            }

            if (!argName) {
              throw new Error("".concat(route[j], " is not a valid argument segment in route \"").concat(_i2, "\""));
            }

            if (!path[j]) {
              if (route[j].substr(route[j].length - 1, 1) == '?') {
                args[argName] = '';
              } else {
                continue L1;
              }
            } else {
              args[argName] = path[j];
            }
          } else if (route[j] !== '*' && path[j] !== route[j]) {
            continue L1;
          }
        }

        selected = _i2;
        result = routes[_i2];

        if (route[route.length - 1] === '*') {
          args.pathparts = path.slice(route.length - 1);
        }

        break;
      }

      var eventStart = new CustomEvent('cvRouteStart', {
        cancelable: true,
        detail: {
          path: path,
          prev: prev,
          root: listener,
          selected: selected,
          routes: routes
        }
      });

      if (!document.dispatchEvent(eventStart)) {
        return;
      }

      if (!forceRefresh && listener && current && result instanceof Object && current instanceof result && !(result instanceof Promise) && current.update(args)) {
        listener.args.content = current;
        return true;
      }

      try {
        if (!(selected in routes)) {
          routes[selected] = routes[NotFoundError];
        }

        var processRoute = function processRoute(selected) {
          var result = false;

          if (typeof routes[selected] === 'function') {
            if (routes[selected].prototype instanceof _View.View) {
              result = new routes[selected](args);
            } else {
              result = routes[selected](args);
            }
          } else {
            result = routes[selected];
          }

          return result;
        };

        result = processRoute(selected);

        if (result === false) {
          result = processRoute(NotFoundError);
        }

        if (result instanceof Promise) {
          return result.then(function (realResult) {
            _this3.update(listener, path, realResult, routes, selected, args, forceRefresh);
          })["catch"](function (error) {
            document.dispatchEvent(new CustomEvent('cvRouteError', {
              detail: {
                error: error,
                path: path,
                prev: prev,
                view: listener,
                routes: routes,
                selected: selected
              }
            }));

            _this3.update(listener, path, window['devMode'] ? String(error) : 'Error: 500', routes, selected, args, forceRefresh);

            throw error;
          });
        } else {
          return this.update(listener, path, result, routes, selected, args, forceRefresh);
        }
      } catch (error) {
        document.dispatchEvent(new CustomEvent('cvRouteError', {
          detail: {
            error: error,
            path: path,
            prev: prev,
            view: listener,
            routes: routes,
            selected: selected
          }
        }));
        this.update(listener, path, window['devMode'] ? String(error) : 'Error: 500', routes, selected, args, forceRefresh);
        throw error;
      }
    }
  }, {
    key: "update",
    value: function update(listener, path, result, routes, selected, args, forceRefresh) {
      if (!listener) {
        return;
      }

      var prev = this.prevPath;
      var event = new CustomEvent('cvRoute', {
        cancelable: true,
        detail: {
          result: result,
          path: path,
          prev: prev,
          view: listener,
          routes: routes,
          selected: selected
        }
      });

      if (result !== false) {
        if (listener.args.content instanceof _View.View) {
          listener.args.content.pause(true);
          listener.args.content.remove();
        }

        if (document.dispatchEvent(event)) {
          listener.args.content = result;
        }

        if (result instanceof _View.View) {
          result.pause(false);
          result.update(args, forceRefresh);
        }
      }

      var eventEnd = new CustomEvent('cvRouteEnd', {
        cancelable: true,
        detail: {
          result: result,
          path: path,
          prev: prev,
          view: listener,
          routes: routes,
          selected: selected
        }
      });
      document.dispatchEvent(eventEnd);
    }
  }, {
    key: "queryOver",
    value: function queryOver() {
      var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var params = new URLSearchParams(location.search);
      var finalArgs = {};
      var query = {};

      var _iterator = _createForOfIteratorHelper(params),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var pair = _step.value;
          query[pair[0]] = pair[1];
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      finalArgs = Object.assign(finalArgs, query, args);
      delete finalArgs['api'];
      return finalArgs; // for(let i in query)
      // {
      // 	finalArgs[i] = query[i];
      // }
      // for(let i in args)
      // {
      // 	finalArgs[i] = args[i];
      // }
    }
  }, {
    key: "queryToString",
    value: function queryToString() {
      var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var fresh = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var parts = [],
          finalArgs = args;

      if (!fresh) {
        finalArgs = this.queryOver(args);
      }

      for (var i in finalArgs) {
        if (finalArgs[i] === '') {
          continue;
        }

        parts.push(i + '=' + encodeURIComponent(finalArgs[i]));
      }

      return parts.join('&');
    }
  }, {
    key: "setQuery",
    value: function setQuery(name, value, silent) {
      var args = this.queryOver();
      args[name] = value;

      if (value === undefined) {
        delete args[name];
      }

      var queryString = this.queryToString(args, true);
      this.go(location.pathname + (queryString ? '?' + queryString : ''), silent);
    }
  }]);

  return Router;
}();

exports.Router = Router;
Object.defineProperty(Router, 'query', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: {}
});
Object.defineProperty(Router, 'history', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: []
});
Object.defineProperty(Router, 'routeCount', {
  configurable: false,
  enumerable: false,
  writable: true,
  value: 0
});
Object.defineProperty(Router, 'prevPath', {
  configurable: false,
  enumerable: false,
  writable: true,
  value: null
});
Object.defineProperty(Router, 'queryString', {
  configurable: false,
  enumerable: false,
  writable: true,
  value: null
});
Object.defineProperty(Router, 'InternalError', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: InternalError
});
Object.defineProperty(Router, 'NotFoundError', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: NotFoundError
});
  })();
});

require.register("curvature/base/Routes.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Routes = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var AppRoutes = {};

try {
  Object.assign(AppRoutes, require('Routes').Routes || {});
} catch (error) {
  window.devMode === true && console.warn(error);
}

var Routes = /*#__PURE__*/function () {
  function Routes() {
    _classCallCheck(this, Routes);
  }

  _createClass(Routes, null, [{
    key: "get",
    value: function get(name) {
      return this.routes[name];
    }
  }, {
    key: "dump",
    value: function dump() {
      return this.routes;
    }
  }]);

  return Routes;
}();

exports.Routes = Routes;
Object.defineProperty(Routes, 'routes', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: AppRoutes
});
  })();
});

require.register("curvature/base/RuleSet.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RuleSet = void 0;

var _Dom = require("./Dom");

var _Tag = require("./Tag");

var _View = require("./View");

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var RuleSet = /*#__PURE__*/function () {
  function RuleSet() {
    _classCallCheck(this, RuleSet);
  }

  _createClass(RuleSet, [{
    key: "add",
    value: function add(selector, callback) {
      this.rules = this.rules || {};
      this.rules[selector] = this.rules[selector] || [];
      this.rules[selector].push(callback);
      return this;
    }
  }, {
    key: "apply",
    value: function apply() {
      var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;
      var view = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      RuleSet.apply(doc, view);

      for (var selector in this.rules) {
        for (var i in this.rules[selector]) {
          var callback = this.rules[selector][i];
          var wrapped = RuleSet.wrap(doc, callback, view);
          var nodes = doc.querySelectorAll(selector);

          var _iterator = _createForOfIteratorHelper(nodes),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var node = _step.value;
              wrapped(node);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }
      }
    }
  }], [{
    key: "add",
    value: function add(selector, callback) {
      this.globalRules = this.globalRules || {};
      this.globalRules[selector] = this.globalRules[selector] || [];
      this.globalRules[selector].push(callback);
      return this;
    }
  }, {
    key: "apply",
    value: function apply() {
      var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;
      var view = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      for (var selector in this.globalRules) {
        for (var i in this.globalRules[selector]) {
          var callback = this.globalRules[selector][i];
          var wrapped = this.wrap(doc, callback, view);
          var nodes = doc.querySelectorAll(selector);

          var _iterator2 = _createForOfIteratorHelper(nodes),
              _step2;

          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var node = _step2.value;
              wrapped(node);
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      }
    }
  }, {
    key: "wait",
    value: function wait() {
      var _this = this;

      var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'DOMContentLoaded';
      var node = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var listener = function (event, node) {
        return function () {
          node.removeEventListener(event, listener);
          return _this.apply();
        };
      }(event, node);

      node.addEventListener(event, listener);
    }
  }, {
    key: "wrap",
    value: function wrap(doc, callback) {
      var view = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      if (callback instanceof _View.View || callback && callback.prototype && callback.prototype instanceof _View.View) {
        callback = function (callback) {
          return function () {
            return callback;
          };
        }(callback);
      }

      return function (element) {
        if (typeof element.___cvApplied___ === 'undefined') {
          Object.defineProperty(element, '___cvApplied___', {
            enumerable: false,
            writable: false,
            value: []
          });
        }

        for (var i in element.___cvApplied___) {
          if (callback == element.___cvApplied___[i]) {
            return;
          }
        }

        var direct, parentView;

        if (view) {
          direct = parentView = view;

          if (view.viewList) {
            parentView = view.viewList.parent;
          }
        }

        if (parentView) {
          parentView.onRemove(function () {
            return element.___cvApplied___.splice(0);
          });
        }

        var tag = new _Tag.Tag(element, parentView, null, undefined, direct);
        var parent = tag.element.parentNode;
        var sibling = tag.element.nextSibling;
        var result = callback(tag);

        if (result !== false) {
          element.___cvApplied___.push(callback);
        }

        if (result instanceof HTMLElement) {
          result = new _Tag.Tag(result);
        }

        if (result instanceof _Tag.Tag) {
          if (!result.element.contains(tag.element)) {
            while (tag.element.firstChild) {
              result.element.appendChild(tag.element.firstChild);
            }

            tag.remove();
          }

          if (sibling) {
            parent.insertBefore(result.element, sibling);
          } else {
            parent.appendChild(result.element);
          }
        }

        if (result && result.prototype && result.prototype instanceof _View.View) {
          result = new result({}, view);
        }

        if (result instanceof _View.View) {
          if (view) {
            view.cleanup.push(function (r) {
              return function () {
                r.remove();
              };
            }(result));
            view.cleanup.push(view.args.bindTo(function (v, k, t) {
              t[k] = v;
              result.args[k] = v;
            }));
            view.cleanup.push(result.args.bindTo(function (v, k, t, d) {
              t[k] = v;
              view.args[k] = v;
            }));
          }

          tag.clear();
          result.render(tag.element);
        }
      };
    }
  }]);

  return RuleSet;
}();

exports.RuleSet = RuleSet;
  })();
});

require.register("curvature/base/Tag.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tag = void 0;

var _Bindable = require("./Bindable");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Tag = /*#__PURE__*/function () {
  function Tag(element, parent, ref, index, direct) {
    var _this2 = this;

    _classCallCheck(this, Tag);

    if (typeof element === 'string') {
      var subdoc = document.createRange().createContextualFragment(element);
      element = subdoc.firstChild;
    }

    this.element = _Bindable.Bindable.makeBindable(element);
    this.node = this.element;
    this.parent = parent;
    this.direct = direct;
    this.ref = ref;
    this.index = index;
    this.cleanup = [];

    this[_Bindable.Bindable.OnAllGet] = function (name) {
      if (typeof _this2[name] === 'function') {
        return _this2[name];
      }

      if (_this2.node && typeof _this2.node[name] === 'function') {
        return function () {
          var _this2$node;

          return (_this2$node = _this2.node)[name].apply(_this2$node, arguments);
        };
      }

      if (_this2.node && name in _this2.node) {
        return _this2.node[name];
      }

      return _this2[name];
    };

    this.style = function (_this) {
      return _Bindable.Bindable.make(function (styles) {
        if (!_this.node) {
          return;
        }

        var styleEvent = new CustomEvent('cvStyle', {
          detail: {
            styles: styles
          }
        });

        if (!_this.node.dispatchEvent(styleEvent)) {
          return;
        }

        for (var property in styles) {
          if (property[0] === '-') {
            _this.node.style.setProperty(property, styles[property]);
          }

          _this.node.style[property] = styles[property];
        }
      });
    }(this);

    this.proxy = _Bindable.Bindable.make(this);
    this.proxy.style.bindTo(function (v, k) {
      _this2.element.style[k] = v;
    });
    this.proxy.bindTo(function (v, k) {
      if (k in element) {
        element[k] = v;
      }

      return false;
    });
    return this.proxy;
  }

  _createClass(Tag, [{
    key: "attr",
    value: function attr(attributes) {
      for (var attribute in attributes) {
        if (attributes[attribute] === undefined) {
          this.node.removeAttribute(attribute);
        } else if (attributes[attribute] === null) {
          this.node.setAttribute(attribute, '');
        } else {
          this.node.setAttribute(attribute, attributes[attribute]);
        }
      }
    }
  }, {
    key: "remove",
    value: function remove() {
      if (this.node) {
        this.node.remove();
      }

      _Bindable.Bindable.clearBindings(this);

      var cleanup;

      while (cleanup = this.cleanup.shift()) {
        cleanup();
      }

      this.clear();

      if (!this.node) {
        return;
      }

      var detachEvent = new Event('cvDomDetached');
      this.node.dispatchEvent(detachEvent);
      this.node = this.element = this.ref = this.parent = undefined;
    }
  }, {
    key: "clear",
    value: function clear() {
      if (!this.node) {
        return;
      }

      var detachEvent = new Event('cvDomDetached');

      while (this.node.firstChild) {
        this.node.firstChild.dispatchEvent(detachEvent);
        this.node.removeChild(this.node.firstChild);
      }
    }
  }, {
    key: "pause",
    value: function pause() {
      var paused = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    }
  }, {
    key: "listen",
    value: function listen(eventName, callback, options) {
      var node = this.node;
      node.addEventListener(eventName, callback, options);

      var remove = function remove() {
        node.removeEventListener(eventName, callback, options);
      };

      var remover = function remover() {
        remove();

        remove = function remove() {
          return console.warn('Already removed!');
        };
      };

      this.parent.onRemove(function () {
        return remover();
      });
      return remover;
    }
  }]);

  return Tag;
}();

exports.Tag = Tag;
  })();
});

require.register("curvature/base/View.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.View = void 0;

var _Bindable = require("./Bindable");

var _ViewList = require("./ViewList");

var _Router = require("./Router");

var _Dom = require("./Dom");

var _Tag = require("./Tag");

var _Bag = require("./Bag");

var _RuleSet = require("./RuleSet");

var _Mixin = require("./Mixin");

var _PromiseMixin = require("../mixin/PromiseMixin");

var _EventTargetMixin = require("../mixin/EventTargetMixin");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var dontParse = Symbol('dontParse');
var expandBind = Symbol('expandBind');
var uuid = Symbol('uuid');
var moveIndex = 0;

var View = /*#__PURE__*/function (_Mixin$with) {
  _inherits(View, _Mixin$with);

  var _super = _createSuper(View);

  _createClass(View, [{
    key: "_id",
    get: function get() {
      return this[uuid];
    }
  }], [{
    key: "from",
    value: function from(template) {
      var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var view = new this(args, parent);
      view.template = template;
      return view;
    }
  }]);

  function View() {
    var _this;

    var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var mainView = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, View);

    _this = _super.call(this);
    Object.defineProperty(_assertThisInitialized(_this), 'args', {
      value: _Bindable.Bindable.make(args)
    });
    Object.defineProperty(_assertThisInitialized(_this), uuid, {
      value: _this.uuid()
    });
    Object.defineProperty(_assertThisInitialized(_this), 'attach', {
      value: new _Bag.Bag(function (i, s, a) {})
    });
    Object.defineProperty(_assertThisInitialized(_this), 'detach', {
      value: new _Bag.Bag(function (i, s, a) {})
    });
    Object.defineProperty(_assertThisInitialized(_this), '_onRemove', {
      value: new _Bag.Bag(function (i, s, a) {})
    });
    Object.defineProperty(_assertThisInitialized(_this), 'cleanup', {
      value: []
    });
    Object.defineProperty(_assertThisInitialized(_this), 'parent', {
      value: mainView
    });
    Object.defineProperty(_assertThisInitialized(_this), 'views', {
      value: new Map()
    });
    Object.defineProperty(_assertThisInitialized(_this), 'viewLists', {
      value: new Map()
    });
    Object.defineProperty(_assertThisInitialized(_this), 'withViews', {
      value: new Map()
    });
    Object.defineProperty(_assertThisInitialized(_this), 'tags', {
      value: _Bindable.Bindable.make({})
    });
    Object.defineProperty(_assertThisInitialized(_this), 'nodes', {
      value: _Bindable.Bindable.make([])
    });
    Object.defineProperty(_assertThisInitialized(_this), 'intervals', {
      value: []
    });
    Object.defineProperty(_assertThisInitialized(_this), 'timeouts', {
      value: []
    });
    Object.defineProperty(_assertThisInitialized(_this), 'frames', {
      value: []
    });
    Object.defineProperty(_assertThisInitialized(_this), 'ruleSet', {
      value: new _RuleSet.RuleSet()
    });
    Object.defineProperty(_assertThisInitialized(_this), 'preRuleSet', {
      value: new _RuleSet.RuleSet()
    });
    Object.defineProperty(_assertThisInitialized(_this), 'subBindings', {
      value: {}
    });
    Object.defineProperty(_assertThisInitialized(_this), 'templates', {
      value: {}
    });
    Object.defineProperty(_assertThisInitialized(_this), 'eventCleanup', {
      value: []
    });
    Object.defineProperty(_assertThisInitialized(_this), 'interpolateRegex', {
      value: /(\[\[((?:\$+)?[\w\.\|-]+)\]\])/g
    });
    Object.defineProperty(_assertThisInitialized(_this), 'rendered', {
      value: new Promise(function (accept, reject) {
        return Object.defineProperty(_assertThisInitialized(_this), 'renderComplete', {
          value: accept
        });
      })
    });
    _this.template = "";
    _this.firstNode = null;
    _this.lastNode = null;
    _this.viewList = null;
    _this.mainView = null;
    _this.preserve = false;
    _this.removed = false;
    return _possibleConstructorReturn(_this, _Bindable.Bindable.make(_assertThisInitialized(_this)));
  }

  _createClass(View, [{
    key: "onFrame",
    value: function onFrame(callback) {
      var _this2 = this;

      var stopped = false;

      var cancel = function cancel() {
        stopped = true;
      };

      var c = function c(timestamp) {
        if (_this2.removed || stopped) {
          return;
        }

        if (!_this2.paused) {
          callback(Date.now());
        }

        requestAnimationFrame(c);
      };

      requestAnimationFrame(function () {
        return c(Date.now());
      });
      this.frames.push(cancel);
      return cancel;
    }
  }, {
    key: "onNextFrame",
    value: function onNextFrame(callback) {
      return requestAnimationFrame(function () {
        return callback(Date.now());
      });
    }
  }, {
    key: "onIdle",
    value: function onIdle(callback) {
      return requestIdleCallback(function () {
        return callback(Date.now());
      });
    }
  }, {
    key: "onTimeout",
    value: function onTimeout(time, callback) {
      var _this3 = this;

      var wrappedCallback = function wrappedCallback() {
        _this3.timeouts[index].fired = true;
        _this3.timeouts[index].callback = null;
        callback();
      };

      var timeout = setTimeout(wrappedCallback, time);
      var index = this.timeouts.length;
      this.timeouts.push({
        timeout: timeout,
        callback: wrappedCallback,
        time: time,
        fired: false,
        created: new Date().getTime(),
        paused: false
      });
      return timeout;
    }
  }, {
    key: "clearTimeout",
    value: function (_clearTimeout) {
      function clearTimeout(_x) {
        return _clearTimeout.apply(this, arguments);
      }

      clearTimeout.toString = function () {
        return _clearTimeout.toString();
      };

      return clearTimeout;
    }(function (timeout) {
      for (var i in this.timeouts) {
        if (timeout === this.timeouts[i].timeout) {
          clearTimeout(this.timeouts[i].timeout);
          delete this.timeouts[i];
        }
      }
    })
  }, {
    key: "onInterval",
    value: function onInterval(time, callback) {
      var timeout = setInterval(callback, time);
      this.intervals.push({
        timeout: timeout,
        callback: callback,
        time: time,
        paused: false
      });
      return timeout;
    }
  }, {
    key: "clearInterval",
    value: function (_clearInterval) {
      function clearInterval(_x2) {
        return _clearInterval.apply(this, arguments);
      }

      clearInterval.toString = function () {
        return _clearInterval.toString();
      };

      return clearInterval;
    }(function (timeout) {
      for (var i in this.intervals) {
        if (timeout === this.intervals[i].timeout) {
          clearInterval(this.intervals[i].timeout);
          delete this.intervals[i];
        }
      }
    })
  }, {
    key: "pause",
    value: function pause() {
      var paused = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      if (paused === undefined) {
        this.paused = !this.paused;
      }

      this.paused = paused;

      if (this.paused) {
        for (var i in this.timeouts) {
          if (this.timeouts[i].fired) {
            delete this.timeouts[i];
            continue;
          }

          clearTimeout(this.timeouts[i].timeout);
        }

        for (var _i in this.intervals) {
          clearInterval(this.intervals[_i].timeout);
        }
      } else {
        for (var _i2 in this.timeouts) {
          if (!this.timeouts[_i2].timeout.paused) {
            continue;
          }

          if (this.timeouts[_i2].fired) {
            delete this.timeouts[_i2];
            continue;
          }

          this.timeouts[_i2].timeout = setTimeout(this.timeouts[_i2].callback, this.timeouts[_i2].time);
        }

        for (var _i3 in this.intervals) {
          if (!this.intervals[_i3].timeout.paused) {
            continue;
          }

          this.intervals[_i3].timeout.paused = false;
          this.intervals[_i3].timeout = setInterval(this.intervals[_i3].callback, this.intervals[_i3].time);
        }
      }

      var _iterator = _createForOfIteratorHelper(this.viewLists),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _step$value = _slicedToArray(_step.value, 2),
              tag = _step$value[0],
              viewList = _step$value[1];

          viewList.pause(!!paused);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      for (var _i4 in this.tags) {
        if (Array.isArray(this.tags[_i4])) {
          for (var j in this.tags[_i4]) {
            this.tags[_i4][j].pause(!!paused);
          }

          continue;
        }

        this.tags[_i4].pause(!!paused);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this$nodes,
          _this4 = this;

      var parentNode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var insertPoint = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      if (parentNode instanceof View) {
        parentNode = parentNode.firstNode.parentNode;
      }

      if (insertPoint instanceof View) {
        insertPoint = insertPoint.firstNode;
      }

      if (this.firstNode) {
        return this.reRender(parentNode, insertPoint);
      }

      this.dispatchEvent(new CustomEvent('render'));
      var templateParsed = this.template instanceof DocumentFragment ? this.template.cloneNode(true) : View.templates.has(this.template);
      var subDoc = templateParsed ? this.template instanceof DocumentFragment ? templateParsed : View.templates.get(this.template).cloneNode(true) : document.createRange().createContextualFragment(this.template);

      if (!templateParsed && !(this.template instanceof DocumentFragment)) {
        View.templates.set(this.template, subDoc.cloneNode(true));
      }

      this.mainView || this.preRuleSet.apply(subDoc, this);
      this.mapTags(subDoc);
      this.mainView || this.ruleSet.apply(subDoc, this);

      if (window.devMode === true) {
        this.firstNode = document.createComment("Template ".concat(this._id, " Start"));
        this.lastNode = document.createComment("Template ".concat(this._id, " End"));
      } else {
        this.firstNode = document.createTextNode('');
        this.lastNode = document.createTextNode('');
      }

      (_this$nodes = this.nodes).push.apply(_this$nodes, [this.firstNode].concat(_toConsumableArray(Array.from(subDoc.childNodes)), [this.lastNode]));

      this.postRender(parentNode);
      this.dispatchEvent(new CustomEvent('rendered'));

      if (!this.dispatchAttach()) {
        return;
      }

      if (parentNode) {
        var rootNode = parentNode.getRootNode();
        var moveType = 'internal';
        var toRoot = false;

        if (rootNode.isConnected) {
          toRoot = true;
          moveType = 'external';
        }

        if (insertPoint) {
          parentNode.insertBefore(this.firstNode, insertPoint);
          parentNode.insertBefore(this.lastNode, insertPoint);
        } else {
          parentNode.appendChild(this.firstNode);
          parentNode.appendChild(this.lastNode);
        }

        parentNode.insertBefore(subDoc, this.lastNode);
        moveIndex++;

        if (toRoot) {
          this.attached(rootNode, parentNode);
          this.dispatchAttached(rootNode, parentNode);
        } else {
          parentNode.addEventListener('cvDomAttached', function () {
            _this4.attached(rootNode, parentNode);

            _this4.dispatchAttached(rootNode, parentNode);
          }, {
            once: true
          });
        }
      }

      this.renderComplete(this.nodes);
      return this.nodes;
    }
  }, {
    key: "dispatchAttach",
    value: function dispatchAttach() {
      return this.dispatchEvent(new CustomEvent('attach', {
        cancelable: true,
        target: this
      }));
    }
  }, {
    key: "dispatchAttached",
    value: function dispatchAttached(rootNode, parentNode) {
      this.dispatchEvent(new CustomEvent('attached', {
        target: this
      }));
      var attach = this.attach.items();

      for (var i in attach) {
        attach[i](rootNode, parentNode);
      }

      this.nodes.filter(function (n) {
        return n.nodeType !== Node.COMMENT_NODE;
      }).map(function (child) {
        if (!child.matches) {
          return;
        }

        _Dom.Dom.mapTags(child, false, function (tag, walker) {
          if (!tag.matches) {
            return;
          }

          tag.dispatchEvent(new Event('cvDomAttached', {
            target: tag
          }));
        });

        child.dispatchEvent(new Event('cvDomAttached', {
          target: child
        }));
      });
    }
  }, {
    key: "reRender",
    value: function reRender(parentNode, insertPoint) {
      var willReRender = this.dispatchEvent(new CustomEvent('reRender'), {
        cancelable: true,
        target: this
      });

      if (!willReRender) {
        return;
      }

      var subDoc = new DocumentFragment();

      if (this.firstNode.isConnected) {
        var detach = this.detach.items();

        for (var i in detach) {
          detach[i]();
        }
      }

      subDoc.append.apply(subDoc, _toConsumableArray(this.nodes));

      if (parentNode) {
        if (insertPoint) {
          parentNode.insertBefore(this.firstNode, insertPoint);
          parentNode.insertBefore(this.lastNode, insertPoint);
        } else {
          parentNode.appendChild(this.firstNode);
          parentNode.appendChild(this.lastNode);
        }

        parentNode.insertBefore(subDoc, this.lastNode);
        this.dispatchEvent(new CustomEvent('reRendered'), {
          cancelable: true,
          target: this
        });
        var rootNode = parentNode.getRootNode();

        if (rootNode.isConnected) {
          this.attached(rootNode, parentNode);
          this.dispatchAttached(rootNode, parentNode);
        }
      }

      return this.nodes;
    }
  }, {
    key: "mapTags",
    value: function mapTags(subDoc) {
      var _this5 = this;

      _Dom.Dom.mapTags(subDoc, false, function (tag, walker) {
        if (tag[dontParse]) {
          return;
        }

        if (tag.matches) {
          tag = _this5.mapInterpolatableTag(tag);
          tag = tag.matches('[cv-template]') && _this5.mapTemplateTag(tag) || tag;
          tag = tag.matches('[cv-slot]') && _this5.mapSlotTag(tag) || tag;
          tag = tag.matches('[cv-prerender]') && _this5.mapPrendererTag(tag) || tag;
          tag = tag.matches('[cv-link]') && _this5.mapLinkTag(tag) || tag;
          tag = tag.matches('[cv-attr]') && _this5.mapAttrTag(tag) || tag;
          tag = tag.matches('[cv-expand]') && _this5.mapExpandableTag(tag) || tag;
          tag = tag.matches('[cv-ref]') && _this5.mapRefTag(tag) || tag;
          tag = tag.matches('[cv-on]') && _this5.mapOnTag(tag) || tag;
          tag = tag.matches('[cv-each]') && _this5.mapEachTag(tag) || tag;
          tag = tag.matches('[cv-bind]') && _this5.mapBindTag(tag) || tag;
          tag = tag.matches('[cv-with]') && _this5.mapWithTag(tag) || tag;
          tag = tag.matches('[cv-if]') && _this5.mapIfTag(tag) || tag;
          tag = tag.matches('[cv-view]') && _this5.mapViewTag(tag) || tag;
        } else {
          tag = _this5.mapInterpolatableTag(tag);
        }

        if (tag !== walker.currentNode) {
          walker.currentNode = tag;
        }
      });
    }
  }, {
    key: "mapExpandableTag",
    value: function mapExpandableTag(tag) {
      /*/
      const tagCompiler = this.compileExpandableTag(tag);
      	const newTag = tagCompiler(this);
      	tag.replaceWith(newTag);
      	return newTag;
      /*/
      var existing = tag[expandBind];

      if (existing) {
        existing();
        tag[expandBind] = false;
      }

      var _Bindable$resolve = _Bindable.Bindable.resolve(this.args, tag.getAttribute('cv-expand'), true),
          _Bindable$resolve2 = _slicedToArray(_Bindable$resolve, 2),
          proxy = _Bindable$resolve2[0],
          expandProperty = _Bindable$resolve2[1];

      tag.removeAttribute('cv-expand');

      if (!proxy[expandProperty]) {
        proxy[expandProperty] = {};
      }

      this.onRemove(tag[expandBind] = proxy[expandProperty].bindTo(function (v, k, t, d, p) {
        if (d || v === undefined) {
          tag.removeAttribute(k, v);
          return;
        }

        if (v === null) {
          tag.setAttribute(k, '');
          return;
        }

        tag.setAttribute(k, v);
      })); // let expandProperty = tag.getAttribute('cv-expand');
      // let expandArg = Bindable.makeBindable(
      // 	this.args[expandProperty] || {}
      // );
      // tag.removeAttribute('cv-expand');
      // for(let i in expandArg)
      // {
      // 	if(i === 'name' || i === 'type')
      // 	{
      // 		continue;
      // 	}
      // 	let debind = expandArg.bindTo(i, ((tag,i)=>(v)=>{
      // 		tag.setAttribute(i, v);
      // 	})(tag,i));
      // 	this.onRemove(()=>{
      // 		debind();
      // 		if(expandArg.isBound())
      // 		{
      // 			Bindable.clearBindings(expandArg);
      // 		}
      // 	});
      // }

      return tag; //*/
    }
  }, {
    key: "compileExpandableTag",
    value: function compileExpandableTag(sourceTag) {
      return function (bindingView) {
        var tag = sourceTag.cloneNode(true);
        var expandProperty = tag.getAttribute('cv-expand');

        var expandArg = _Bindable.Bindable.make(bindingView.args[expandProperty] || {});

        tag.removeAttribute('cv-expand');

        var _loop = function _loop(i) {
          if (i === 'name' || i === 'type') {
            return "continue";
          }

          var debind = expandArg.bindTo(i, function (tag, i) {
            return function (v) {
              tag.setAttribute(i, v);
            };
          }(tag, i));
          bindingView.onRemove(function () {
            debind();

            if (expandArg.isBound()) {
              _Bindable.Bindable.clearBindings(expandArg);
            }
          });
        };

        for (var i in expandArg) {
          var _ret = _loop(i);

          if (_ret === "continue") continue;
        }

        return tag;
      };
    }
  }, {
    key: "mapAttrTag",
    value: function mapAttrTag(tag) {
      //*/
      var tagCompiler = this.compileAttrTag(tag);
      var newTag = tagCompiler(this);
      tag.replaceWith(newTag);
      return newTag;
      /*/
      	let attrProperty = tag.getAttribute('cv-attr');
      	tag.removeAttribute('cv-attr');
      	let pairs = attrProperty.split(',');
      let attrs = pairs.map((p) => p.split(':'));
      	for (let i in attrs)
      {
      	let proxy        = this.args;
      	let bindProperty = attrs[i][1];
      	let property     = bindProperty;
      		if(bindProperty.match(/\./))
      	{
      		[proxy, property] = Bindable.resolve(
      			this.args
      			, bindProperty
      			, true
      		);
      	}
      		let attrib = attrs[i][0];
      		this.onRemove(proxy.bindTo(
      		property
      		, (v)=>{
      			if(v == null)
      			{
      				tag.setAttribute(attrib, '');
      				return;
      			}
      			tag.setAttribute(attrib, v);
      		}
      	));
      }
      	return tag;
      	//*/
    }
  }, {
    key: "compileAttrTag",
    value: function compileAttrTag(sourceTag) {
      var attrProperty = sourceTag.getAttribute('cv-attr');
      var pairs = attrProperty.split(',');
      var attrs = pairs.map(function (p) {
        return p.split(':');
      });
      sourceTag.removeAttribute('cv-attr');
      return function (bindingView) {
        var tag = sourceTag.cloneNode(true);

        var _loop2 = function _loop2(i) {
          var bindProperty = attrs[i][1] || attrs[i][0];

          var _Bindable$resolve3 = _Bindable.Bindable.resolve(bindingView.args, bindProperty, true),
              _Bindable$resolve4 = _slicedToArray(_Bindable$resolve3, 2),
              proxy = _Bindable$resolve4[0],
              property = _Bindable$resolve4[1];

          var attrib = attrs[i][0];
          bindingView.onRemove(proxy.bindTo(property, function (v, k, t, d) {
            if (d || v === undefined) {
              tag.removeAttribute(attrib, v);
              return;
            }

            if (v === null) {
              tag.setAttribute(attrib, '');
              return;
            }

            tag.setAttribute(attrib, v);
          }));
        };

        for (var i in attrs) {
          _loop2(i);
        }

        return tag;
      };
    }
  }, {
    key: "mapInterpolatableTag",
    value: function mapInterpolatableTag(tag) {
      var _this6 = this;

      var regex = this.interpolateRegex;

      if (tag.nodeType === Node.TEXT_NODE) {
        var original = tag.nodeValue;

        if (!this.interpolatable(original)) {
          return tag;
        }

        var header = 0;
        var match;

        var _loop3 = function _loop3() {
          var bindProperty = match[2];
          var unsafeHtml = false;
          var unsafeView = false;
          var propertySplit = bindProperty.split('|');
          var transformer = false;

          if (propertySplit.length > 1) {
            transformer = _this6.stringTransformer(propertySplit.slice(1));
            bindProperty = propertySplit[0];
          }

          if (bindProperty.substr(0, 2) === '$$') {
            unsafeHtml = true;
            unsafeView = true;
            bindProperty = bindProperty.substr(2);
          }

          if (bindProperty.substr(0, 1) === '$') {
            unsafeHtml = true;
            bindProperty = bindProperty.substr(1);
          }

          if (bindProperty.substr(0, 3) === '000') {
            expand = true;
            bindProperty = bindProperty.substr(3);
            return "continue";
          }

          var staticPrefix = original.substring(header, match.index);
          header = match.index + match[1].length;
          var staticNode = document.createTextNode(staticPrefix);
          staticNode[dontParse] = true;
          tag.parentNode.insertBefore(staticNode, tag);
          var dynamicNode = void 0;

          if (unsafeHtml) {
            dynamicNode = document.createElement('div');
          } else {
            dynamicNode = document.createTextNode('');
          }

          dynamicNode[dontParse] = true;
          var proxy = _this6.args;
          var property = bindProperty;

          if (bindProperty.match(/\./)) {
            var _Bindable$resolve5 = _Bindable.Bindable.resolve(_this6.args, bindProperty, true);

            var _Bindable$resolve6 = _slicedToArray(_Bindable$resolve5, 2);

            proxy = _Bindable$resolve6[0];
            property = _Bindable$resolve6[1];
          }

          tag.parentNode.insertBefore(dynamicNode, tag);
          var debind = proxy.bindTo(property, function (v, k, t) {
            if (t[k] !== v && (t[k] instanceof View || t[k] instanceof Node || t[k] instanceof _Tag.Tag)) {
              if (!t[k].preserve) {
                t[k].remove();
              }
            }

            dynamicNode.nodeValue = '';

            if (unsafeView && !(v instanceof View)) {
              var unsafeTemplate = v;
              v = new View(_this6.args, _this6);
              v.template = unsafeTemplate;
            }

            if (transformer) {
              v = transformer(v);
            }

            if (v instanceof View) {
              var onAttach = function onAttach(parentNode) {
                if (v.dispatchAttach()) {
                  v.attached(parentNode);
                  v.dispatchAttached();
                }
              };

              _this6.attach.add(onAttach);

              v.render(tag.parentNode, dynamicNode);

              var cleanup = function cleanup() {
                if (!v.preserve) {
                  v.remove();
                }
              };

              _this6.onRemove(cleanup);

              v.onRemove(function () {
                _this6.attach.remove(onAttach);

                _this6._onRemove.remove(cleanup);
              });
            } else if (v instanceof Node) {
              tag.parentNode.insertBefore(v, dynamicNode);

              _this6.onRemove(function () {
                return v.remove();
              });
            } else if (v instanceof _Tag.Tag) {
              tag.parentNode.insertBefore(v.node, dynamicNode);

              _this6.onRemove(function () {
                return v.remove();
              });
            } else {
              if (v instanceof Object && v.__toString instanceof Function) {
                v = v.__toString();
              }

              if (unsafeHtml) {
                dynamicNode.innerHTML = v;
              } else {
                dynamicNode.nodeValue = v;
              }
            }

            dynamicNode[dontParse] = true;
          });

          _this6.onRemove(debind);
        };

        while (match = regex.exec(original)) {
          var _ret2 = _loop3();

          if (_ret2 === "continue") continue;
        }

        var staticSuffix = original.substring(header);
        var staticNode = document.createTextNode(staticSuffix);
        staticNode[dontParse] = true;
        tag.parentNode.insertBefore(staticNode, tag);
        tag.nodeValue = '';
      }

      if (tag.nodeType === Node.ELEMENT_NODE) {
        var _loop4 = function _loop4(i) {
          if (!_this6.interpolatable(tag.attributes[i].value)) {
            return "continue";
          }

          var header = 0;
          var match = void 0;
          var original = tag.attributes[i].value;
          var attribute = tag.attributes[i];
          var bindProperties = {};
          var segments = [];

          while (match = regex.exec(original)) {
            segments.push(original.substring(header, match.index));

            if (!bindProperties[match[2]]) {
              bindProperties[match[2]] = [];
            }

            bindProperties[match[2]].push(segments.length);
            segments.push(match[1]);
            header = match.index + match[1].length;
          }

          segments.push(original.substring(header));

          var _loop5 = function _loop5(j) {
            var proxy = _this6.args;
            var property = j;
            var propertySplit = j.split('|');
            var transformer = false;
            var longProperty = j;

            if (propertySplit.length > 1) {
              transformer = _this6.stringTransformer(propertySplit.slice(1));
              property = propertySplit[0];
            }

            if (property.match(/\./)) {
              var _Bindable$resolve7 = _Bindable.Bindable.resolve(_this6.args, property, true);

              var _Bindable$resolve8 = _slicedToArray(_Bindable$resolve7, 2);

              proxy = _Bindable$resolve8[0];
              property = _Bindable$resolve8[1];
            } // if(property.match(/\./))
            // {
            // 	[proxy, property] = Bindable.resolve(
            // 		this.args
            // 		, property
            // 		, true
            // 	);
            // }
            // console.log(this.args, property);


            var matching = [];
            var bindProperty = j;
            var matchingSegments = bindProperties[longProperty];

            _this6.onRemove(proxy.bindTo(property, function (v, k, t, d) {
              if (transformer) {
                v = transformer(v);
              }

              for (var _i5 in bindProperties) {
                for (var _j in bindProperties[longProperty]) {
                  segments[bindProperties[longProperty][_j]] = t[_i5];

                  if (k === property) {
                    segments[bindProperties[longProperty][_j]] = v;
                  }
                }
              }

              tag.setAttribute(attribute.name, segments.join(''));
            }));

            _this6.onRemove(function () {
              if (!proxy.isBound()) {
                _Bindable.Bindable.clearBindings(proxy);
              }
            });
          };

          for (var j in bindProperties) {
            _loop5(j);
          }
        };

        for (var i = 0; i < tag.attributes.length; i++) {
          var _ret3 = _loop4(i);

          if (_ret3 === "continue") continue;
        }
      }

      return tag;
    }
  }, {
    key: "mapRefTag",
    value: function mapRefTag(tag) {
      var refAttr = tag.getAttribute('cv-ref');

      var _refAttr$split = refAttr.split(':'),
          _refAttr$split2 = _slicedToArray(_refAttr$split, 3),
          refProp = _refAttr$split2[0],
          _refAttr$split2$ = _refAttr$split2[1],
          refClassname = _refAttr$split2$ === void 0 ? null : _refAttr$split2$,
          _refAttr$split2$2 = _refAttr$split2[2],
          refKey = _refAttr$split2$2 === void 0 ? null : _refAttr$split2$2;

      var refClass = _Tag.Tag;

      if (refClassname) {
        refClass = this.stringToClass(refClassname);
      }

      tag.removeAttribute('cv-ref');
      Object.defineProperty(tag, '___tag___', {
        enumerable: false,
        writable: true
      });
      this.onRemove(function () {
        tag.___tag___ = null;
        tag.remove();
      });
      var parent = this;
      var direct = this;

      if (this.viewList) {
        parent = this.viewList.parent; // if(!this.viewList.parent.tags[refProp])
        // {
        // 	this.viewList.parent.tags[refProp] = [];
        // }
        // let refKeyVal = this.args[refKey];
        // this.viewList.parent.tags[refProp][refKeyVal] = new refClass(
        // 	tag, this, refProp, refKeyVal
        // );
      } else {// this.tags[refProp] = new refClass(
          // 	tag, this, refProp
          // );
        }

      var tagObject = new refClass(tag, this, refProp, undefined, direct);
      tag.___tag___ = tagObject;
      this.tags[refProp] = tagObject;

      while (parent) {
        if (!parent.parent) {}

        var refKeyVal = this.args[refKey];

        if (refKeyVal !== undefined) {
          if (!parent.tags[refProp]) {
            parent.tags[refProp] = [];
          }

          parent.tags[refProp][refKeyVal] = tagObject;
        } else {
          parent.tags[refProp] = tagObject;
        }

        parent = parent.parent;
      }

      return tag;
    }
  }, {
    key: "mapBindTag",
    value: function mapBindTag(tag) {
      var _this7 = this;

      var bindArg = tag.getAttribute('cv-bind');
      var proxy = this.args;
      var property = bindArg;
      var top = null;

      if (bindArg.match(/\./)) {
        var _Bindable$resolve9 = _Bindable.Bindable.resolve(this.args, bindArg, true);

        var _Bindable$resolve10 = _slicedToArray(_Bindable$resolve9, 3);

        proxy = _Bindable$resolve10[0];
        property = _Bindable$resolve10[1];
        top = _Bindable$resolve10[2];
      }

      if (proxy !== this.args) {
        this.subBindings[bindArg] = this.subBindings[bindArg] || [];
        this.onRemove(this.args.bindTo(top, function () {
          while (_this7.subBindings.length) {
            _this7.subBindings.shift()();
          }
        }));
      }

      var unsafeHtml = false;

      if (property.substr(0, 1) === '$') {
        property = property.substr(1);
        unsafeHtml = true;
      }

      var debind = proxy.bindTo(property, function (v, k, t, d, p) {
        if ((p instanceof View || p instanceof Node || p instanceof _Tag.Tag) && p !== v) {
          p.remove();
        }

        var autoChangedEvent = new CustomEvent('cvAutoChanged', {
          bubbles: true
        });

        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag.tagName)) {
          var _type = tag.getAttribute('type');

          if (_type && _type.toLowerCase() === 'checkbox') {
            tag.checked = !!v;
            tag.dispatchEvent(autoChangedEvent);
          } else if (_type && _type.toLowerCase() === 'radio') {
            tag.checked = v == tag.value;
            tag.dispatchEvent(autoChangedEvent);
          } else if (_type !== 'file') {
            if (tag.tagName === 'SELECT') {
              var selectOption = function selectOption() {
                for (var i = 0; i < tag.options.length; i++) {
                  var option = tag.options[i];

                  if (option.value == v) {
                    tag.selectedIndex = i;
                  }
                }
              };

              selectOption();

              _this7.attach.add(selectOption);
            } else {
              tag.value = v == null ? '' : v;
            }

            tag.dispatchEvent(autoChangedEvent);
          }
        } else {
          if (v instanceof View) {
            var _iterator2 = _createForOfIteratorHelper(tag.childNodes),
                _step2;

            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var node = _step2.value;
                node.remove();
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }

            var onAttach = function onAttach(parentNode) {
              if (v.dispatchAttach()) {
                v.attached(parentNode);
                v.dispatchAttached();
              }
            };

            _this7.attach.add(onAttach);

            v.render(tag);
            v.onRemove(function () {
              return _this7.attach.remove(onAttach);
            });
          } else if (v instanceof Node) {
            tag.insert(v);
          } else if (v instanceof _Tag.Tag) {
            tag.append(v.node);
          } else if (unsafeHtml) {
            if (tag.innerHTML !== v) {
              v = String(v);

              if (tag.innerHTML === v.substring(0, tag.innerHTML.length)) {
                tag.innerHTML += v.substring(tag.innerHTML.length);
              } else {
                var _iterator3 = _createForOfIteratorHelper(tag.childNodes),
                    _step3;

                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    var _node = _step3.value;

                    _node.remove();
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }

                tag.innerHTML = v;
              }

              _Dom.Dom.mapTags(tag, false, function (t) {
                return t[dontParse] = true;
              });
            }
          } else {
            if (tag.textContent !== v) {
              var _iterator4 = _createForOfIteratorHelper(tag.childNodes),
                  _step4;

              try {
                for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                  var _node2 = _step4.value;

                  _node2.remove();
                }
              } catch (err) {
                _iterator4.e(err);
              } finally {
                _iterator4.f();
              }

              tag.textContent = v;
            }
          }
        }
      });

      if (proxy !== this.args) {
        this.subBindings[bindArg].push(debind);
      }

      this.onRemove(debind);
      var type = tag.getAttribute('type');
      var multi = tag.getAttribute('multiple');

      var inputListener = function inputListener(event) {
        if (event.target !== tag) {
          return;
        }

        if (type && type.toLowerCase() === 'checkbox') {
          if (tag.checked) {
            proxy[property] = event.target.getAttribute('value');
          } else {
            proxy[property] = false;
          }
        } else if (event.target.matches('[contenteditable=true]')) {
          proxy[property] = event.target.innerHTML;
        } else if (type === 'file' && multi) {
          var files = Array.from(event.target.files);

          var current = proxy[property] || _Bindable.Bindable.onDeck(proxy, property);

          if (!current || !files.length) {
            proxy[property] = files;
          } else {
            var _loop6 = function _loop6(i) {
              if (files[i] !== current[i]) {
                files[i].toJSON = function () {
                  return {
                    name: file[i].name,
                    size: file[i].size,
                    type: file[i].type,
                    date: file[i].lastModified
                  };
                };

                current[i] = files[i];
                return "break";
              }
            };

            for (var i in files) {
              var _ret4 = _loop6(i);

              if (_ret4 === "break") break;
            }
          }
        } else if (type === 'file' && !multi) {
          var _file = event.target.files.item(0);

          _file.toJSON = function () {
            return {
              name: _file.name,
              size: _file.size,
              type: _file.type,
              date: _file.lastModified
            };
          };

          proxy[property] = _file;
        } else {
          proxy[property] = event.target.value;
        }
      };

      if (type === 'file' || type === 'radio') {
        tag.addEventListener('change', inputListener);
      } else {
        tag.addEventListener('input', inputListener);
        tag.addEventListener('change', inputListener);
        tag.addEventListener('value-changed', inputListener);
      }

      this.onRemove(function () {
        if (type === 'file' || type === 'radio') {
          tag.removeEventListener('change', inputListener);
        } else {
          tag.removeEventListener('input', inputListener);
          tag.removeEventListener('change', inputListener);
          tag.removeEventListener('value-changed', inputListener);
        }
      });
      tag.removeAttribute('cv-bind');
      return tag;
    }
  }, {
    key: "mapOnTag",
    value: function mapOnTag(tag) {
      var _this8 = this;

      var referents = String(tag.getAttribute('cv-on'));
      referents.split(';').map(function (a) {
        return a.split(':');
      }).map(function (a) {
        a = a.map(function (a) {
          return a.trim();
        });
        var argLen = a.length;
        var eventName = String(a.shift()).trim();
        var callbackName = String(a.shift() || eventName).trim();
        var eventFlags = String(a.shift() || '').trim();
        var argList = [];
        var groups = /(\w+)(?:\(([$\w\s-'",]+)\))?/.exec(callbackName);

        if (groups) {
          callbackName = groups[1].replace(/(^[\s\n]+|[\s\n]+$)/, '');

          if (groups[2]) {
            argList = groups[2].split(',').map(function (s) {
              return s.trim();
            });
          }

          if (groups.length) {}
        } else {
          argList.push('$event');
        }

        if (!eventName || argLen === 1) {
          eventName = callbackName;
        }

        var eventMethod;
        var parent = _this8;

        while (parent) {
          if (typeof parent[callbackName] === 'function') {
            var _ret5 = function () {
              var _parent = parent;
              var _callBackName = callbackName;

              eventMethod = function eventMethod() {
                _parent[_callBackName].apply(_parent, arguments);
              };

              return "break";
            }();

            if (_ret5 === "break") break;
          }

          if (parent.parent) {
            parent = parent.parent;
          } else {
            break;
          }
        }

        var eventListener = function eventListener(event) {
          var argRefs = argList.map(function (arg) {
            var match;

            if (parseInt(arg) == arg) {
              return arg;
            } else if (arg === 'event' || arg === '$event') {
              return event;
            } else if (arg === '$view') {
              return parent;
            } else if (arg === '$tag') {
              return tag;
            } else if (arg === '$parent') {
              return _this8.parent;
            } else if (arg === '$subview') {
              return _this8;
            } else if (arg in _this8.args) {
              return _this8.args[arg];
            } else if (match = /^['"]([\w-]+?)["']$/.exec(arg)) {
              return match[1];
            }
          });

          if (!(typeof eventMethod === 'function')) {
            throw new Error("".concat(callbackName, " is not defined on View object.") + "\n" + "Tag:" + "\n" + "".concat(tag.outerHTML));
          }

          eventMethod.apply(void 0, _toConsumableArray(argRefs));
        };

        var eventOptions = {};

        if (eventFlags.includes('p')) {
          eventOptions.passive = true;
        } else if (eventFlags.includes('P')) {
          eventOptions.passive = false;
        }

        if (eventFlags.includes('c')) {
          eventOptions.capture = true;
        } else if (eventFlags.includes('C')) {
          eventOptions.capture = false;
        }

        if (eventFlags.includes('o')) {
          eventOptions.once = true;
        } else if (eventFlags.includes('O')) {
          eventOptions.once = false;
        }

        switch (eventName) {
          case '_init':
            eventListener();
            break;

          case '_attach':
            _this8.attach.add(eventListener);

            break;

          case '_detach':
            _this8.detach.add(eventListener);

            break;

          default:
            tag.addEventListener(eventName, eventListener, eventOptions);

            _this8.onRemove(function () {
              tag.removeEventListener(eventName, eventListener, eventOptions);
            });

            break;
        }

        return [eventName, callbackName, argList];
      });
      tag.removeAttribute('cv-on');
      return tag;
    }
  }, {
    key: "mapLinkTag",
    value: function mapLinkTag(tag) {
      /*/
      const tagCompiler = this.compileLinkTag(tag);
      	const newTag = tagCompiler(this);
      	tag.replaceWith(newTag);
      	return newTag;
      /*/
      var linkAttr = tag.getAttribute('cv-link');
      tag.setAttribute('href', linkAttr);

      var linkClick = function linkClick(event) {
        event.preventDefault();

        if (linkAttr.substring(0, 4) === 'http' || linkAttr.substring(0, 2) === '//') {
          window.open(tag.getAttribute('href', linkAttr));
          return;
        }

        _Router.Router.go(tag.getAttribute('href'));
      };

      tag.addEventListener('click', linkClick);
      this.onRemove(function (tag, eventListener) {
        return function () {
          tag.removeEventListener('click', eventListener);
          tag = undefined;
          eventListener = undefined;
        };
      }(tag, linkClick));
      tag.removeAttribute('cv-link');
      return tag; //*/
    }
  }, {
    key: "compileLinkTag",
    value: function compileLinkTag(sourceTag) {
      var linkAttr = sourceTag.getAttribute('cv-link');
      sourceTag.removeAttribute('cv-link');
      return function (bindingView) {
        var tag = sourceTag.cloneNode(true);
        tag.setAttribute('href', linkAttr);
        return tag;
      };
    }
  }, {
    key: "mapPrendererTag",
    value: function mapPrendererTag(tag) {
      var prerenderAttr = tag.getAttribute('cv-prerender');
      var prerendering = window.prerenderer || navigator.userAgent.match(/prerender/i);

      if (prerendering) {
        window.prerenderer = window.prerenderer || true;
      }

      if (prerenderAttr === 'never' && prerendering || prerenderAttr === 'only' && !prerendering) {
        tag.parentNode.removeChild(tag);
      }

      return tag;
    }
  }, {
    key: "mapWithTag",
    value: function mapWithTag(tag) {
      var _this9 = this;

      var withAttr = tag.getAttribute('cv-with');
      var carryAttr = tag.getAttribute('cv-carry');
      var viewAttr = tag.getAttribute('cv-view');
      tag.removeAttribute('cv-with');
      tag.removeAttribute('cv-carry');
      tag.removeAttribute('cv-view');
      var viewClass = viewAttr ? this.stringToClass(viewAttr) : View;
      var subTemplate = new DocumentFragment();

      _toConsumableArray(tag.childNodes).map(function (n) {
        return subTemplate.appendChild(n);
      });

      var carryProps = [];

      if (carryAttr) {
        carryProps = carryAttr.split(',').map(function (s) {
          return s.trim();
        });
      }

      var debind = this.args.bindTo(withAttr, function (v, k, t, d) {
        if (_this9.withViews.has(tag)) {
          _this9.withViews["delete"](tag);
        }

        while (tag.firstChild) {
          tag.removeChild(tag.firstChild);
        }

        var view = new viewClass({}, _this9);

        _this9.onRemove(function (view) {
          return function () {
            view.remove();
          };
        }(view));

        view.template = subTemplate;

        var _loop7 = function _loop7(i) {
          var debind = _this9.args.bindTo(carryProps[i], function (v, k) {
            view.args[k] = v;
          });

          view.onRemove(debind);

          _this9.onRemove(function () {
            debind();
            view.remove();
          });
        };

        for (var i in carryProps) {
          _loop7(i);
        }

        var _loop8 = function _loop8(_i6) {
          var debind = v.bindTo(_i6, function (vv, kk) {
            view.args[kk] = vv;
          });
          var debindUp = view.args.bindTo(_i6, function (vv, kk) {
            v[kk] = vv;
          });

          _this9.onRemove(function () {
            debind();

            if (!v.isBound()) {
              _Bindable.Bindable.clearBindings(v);
            }

            view.remove();
          });

          view.onRemove(function () {
            debind();

            if (!v.isBound()) {
              _Bindable.Bindable.clearBindings(v);
            }
          });
        };

        for (var _i6 in v) {
          _loop8(_i6);
        }

        view.render(tag);

        _this9.withViews.set(tag, view);
      });
      this.onRemove(function () {
        _this9.withViews["delete"](tag);

        debind();
      });
      return tag;
    }
  }, {
    key: "mapViewTag",
    value: function mapViewTag(tag) {
      var _this10 = this;

      var viewAttr = tag.getAttribute('cv-view');
      tag.removeAttribute('cv-view');
      var subTemplate = new DocumentFragment();

      _toConsumableArray(tag.childNodes).map(function (n) {
        return subTemplate.appendChild(n);
      });

      var parts = viewAttr.split(':');
      var viewClass = parts.pop() ? this.stringToClass(viewAttr) : View;
      var viewName = parts.shift();
      var view = new viewClass(this.args, this);
      this.views.set(tag, view);

      if (viewName) {
        this.views.set(viewName, view);
      }

      this.onRemove(function (view) {
        return function () {
          view.remove();

          _this10.views["delete"](tag);

          _this10.views["delete"](viewName);
        };
      }(view));
      view.template = subTemplate;
      view.render(tag);
      return tag;
    }
  }, {
    key: "mapEachTag",
    value: function mapEachTag(tag) {
      var _this11 = this;

      var eachAttr = tag.getAttribute('cv-each');
      var viewAttr = tag.getAttribute('cv-view');
      tag.removeAttribute('cv-each');
      tag.removeAttribute('cv-view');
      var viewClass = viewAttr ? this.stringToClass(viewAttr) : View;
      var subTemplate = new DocumentFragment();
      Array.from(tag.childNodes).map(function (n) {
        return subTemplate.appendChild(n);
      });

      var _eachAttr$split = eachAttr.split(':'),
          _eachAttr$split2 = _slicedToArray(_eachAttr$split, 3),
          eachProp = _eachAttr$split2[0],
          asProp = _eachAttr$split2[1],
          keyProp = _eachAttr$split2[2];

      var debind = this.args.bindTo(eachProp, function (v, k, t, d, p) {
        if (_this11.viewLists.has(tag)) {
          _this11.viewLists.get(tag).remove();
        }

        var viewList = new _ViewList.ViewList(subTemplate, asProp, v, _this11, keyProp, viewClass);

        var viewListRemover = function viewListRemover() {
          return viewList.remove();
        };

        _this11.onRemove(viewListRemover);

        viewList.onRemove(function () {
          return _this11._onRemove.remove(viewListRemover);
        });

        var debindA = _this11.args.bindTo(function (v, k, t, d) {
          if (k === '_id') {
            return;
          }

          if (d) {
            delete viewList.subArgs[k];
          }

          viewList.subArgs[k] = v;
        });

        var debindB = viewList.args.bindTo(function (v, k, t, d, p) {
          if (k === '_id' || k === 'value' || k.substring(0, 3) === '___') {
            return;
          }

          if (d) {
            delete _this11.args[k];
          }

          if (k in _this11.args) {
            _this11.args[k] = v;
          }
        });
        viewList.onRemove(debindA);
        viewList.onRemove(debindB);

        _this11.onRemove(debindA);

        _this11.onRemove(debindB);

        while (tag.firstChild) {
          tag.removeChild(tag.firstChild);
        }

        _this11.viewLists.set(tag, viewList);

        viewList.render(tag);
      });
      this.onRemove(debind);
      return tag;
    }
  }, {
    key: "mapIfTag",
    value: function mapIfTag(tag) {
      var _this12 = this;

      var sourceTag = tag;
      var viewProperty = tag.getAttribute('cv-view');
      var ifProperty = sourceTag.getAttribute('cv-if');
      var inverted = false;
      var defined = false;
      sourceTag.removeAttribute('cv-view');
      sourceTag.removeAttribute('cv-if');
      var viewClass = viewProperty ? this.stringToClass(viewProperty) : View;

      if (ifProperty.substr(0, 1) === '!') {
        ifProperty = ifProperty.substr(1);
        inverted = true;
      }

      if (ifProperty.substr(0, 1) === '?') {
        ifProperty = ifProperty.substr(1);
        defined = true;
      }

      var subTemplate = new DocumentFragment();
      Array.from(sourceTag.childNodes).map(function (n) {
        return subTemplate.appendChild(n);
      } // n => subTemplate.appendChild(n.cloneNode(true))
      );
      var bindingView = this;
      var ifDoc = new DocumentFragment();
      var view = new viewClass(this.args, bindingView);
      this.onRemove(view.tags.bindTo(function (v, k) {
        console.log(k);
        _this12.tags[k] = v;
      }));
      view.template = subTemplate;
      var proxy = bindingView.args;
      var property = ifProperty; // if(ifProperty.match(/\./))
      // {
      // 	[proxy, property] = Bindable.resolve(
      // 		bindingView.args
      // 		, ifProperty
      // 		, true
      // 	);
      // }

      view.render(ifDoc);
      var propertyDebind = proxy.bindTo(property, function (v, k) {
        var o = v;

        if (defined) {
          v = v !== null && v !== undefined;
        }

        if (Array.isArray(v)) {
          v = !!v.length;
        }

        if (inverted) {
          v = !v;
        }

        if (v) {
          tag.appendChild(ifDoc);
        } else {
          view.nodes.map(function (n) {
            return ifDoc.appendChild(n);
          });
        }
      }, {
        wait: 0,
        children: Array.isArray(proxy[property])
      }); // const propertyDebind = this.args.bindChain(property, onUpdate);

      bindingView.onRemove(propertyDebind);

      var bindableDebind = function bindableDebind() {
        if (!proxy.isBound()) {
          _Bindable.Bindable.clearBindings(proxy);
        }
      };

      var viewDebind = function viewDebind() {
        propertyDebind();
        bindableDebind();

        bindingView._onRemove.remove(propertyDebind);

        bindingView._onRemove.remove(bindableDebind);
      };

      bindingView.onRemove(viewDebind);
      this.onRemove(function () {
        view.remove();

        if (bindingView !== _this12) {
          bindingView.remove();
        }
      });
      return tag; //*/
    }
  }, {
    key: "compileIfTag",
    value: function compileIfTag(sourceTag) {
      var ifProperty = sourceTag.getAttribute('cv-if');
      var inverted = false;
      sourceTag.removeAttribute('cv-if');

      if (ifProperty.substr(0, 1) === '!') {
        ifProperty = ifProperty.substr(1);
        inverted = true;
      }

      var subTemplate = new DocumentFragment();
      Array.from(sourceTag.childNodes).map(function (n) {
        return subTemplate.appendChild(n.cloneNode(true));
      });
      return function (bindingView) {
        var tag = sourceTag.cloneNode();
        var ifDoc = new DocumentFragment();
        var view = new View({}, bindingView);
        view.template = subTemplate; // view.parent   = bindingView;

        bindingView.syncBind(view);
        var proxy = bindingView.args;
        var property = ifProperty;

        if (ifProperty.match(/\./)) {
          var _Bindable$resolve11 = _Bindable.Bindable.resolve(bindingView.args, ifProperty, true);

          var _Bindable$resolve12 = _slicedToArray(_Bindable$resolve11, 2);

          proxy = _Bindable$resolve12[0];
          property = _Bindable$resolve12[1];
        }

        var hasRendered = false;
        var propertyDebind = proxy.bindTo(property, function (v, k) {
          if (!hasRendered) {
            var renderDoc = bindingView.args[property] || inverted ? tag : ifDoc;
            view.render(renderDoc);
            hasRendered = true;
            return;
          }

          if (Array.isArray(v)) {
            v = !!v.length;
          }

          if (inverted) {
            v = !v;
          }

          if (v) {
            tag.appendChild(ifDoc);
          } else {
            view.nodes.map(function (n) {
              return ifDoc.appendChild(n);
            });
          }
        }); // let cleaner = bindingView;
        // while(cleaner.parent)
        // {
        // 	cleaner = cleaner.parent;
        // }

        bindingView.onRemove(propertyDebind);

        var bindableDebind = function bindableDebind() {
          if (!proxy.isBound()) {
            _Bindable.Bindable.clearBindings(proxy);
          }
        };

        var viewDebind = function viewDebind() {
          propertyDebind();
          bindableDebind();

          bindingView._onRemove.remove(propertyDebind);

          bindingView._onRemove.remove(bindableDebind);
        };

        view.onRemove(viewDebind);
        return tag;
      };
    }
  }, {
    key: "mapTemplateTag",
    value: function mapTemplateTag(tag) {
      var templateName = tag.getAttribute('cv-template');
      tag.removeAttribute('cv-template');

      this.templates[templateName] = function () {
        return tag.tagName === 'TEMPLATE' ? tag.content.cloneNode(true) : new DocumentFragment(tag.innerHTML);
      };

      this.rendered.then(function () {
        return tag.remove();
      });
      return tag;
    }
  }, {
    key: "mapSlotTag",
    value: function mapSlotTag(tag) {
      var templateName = tag.getAttribute('cv-slot');
      var getTemplate = this.templates[templateName];

      if (!getTemplate) {
        var parent = this;

        while (parent) {
          getTemplate = parent.templates[templateName];

          if (getTemplate) {
            break;
          }

          parent = this.parent;
        }

        if (!getTemplate) {
          console.error("Template ".concat(templateName, " not found."));
          return;
        }
      }

      var template = getTemplate();
      tag.removeAttribute('cv-slot');

      while (tag.firstChild) {
        tag.firstChild.remove();
      }

      tag.appendChild(template);
      return tag;
    }
  }, {
    key: "syncBind",
    value: function syncBind(subView) {
      var _this13 = this;

      var debindA = this.args.bindTo(function (v, k, t, d) {
        if (k === '_id') {
          return;
        }

        if (subView.args[k] !== v) {
          subView.args[k] = v;
        }
      }); // for(let i in this.args)
      // {
      // 	if(i == '_id')
      // 	{
      // 		continue;
      // 	}
      // 	subView.args[i] = this.args[i];
      // }

      var debindB = subView.args.bindTo(function (v, k, t, d, p) {
        if (k === '_id') {
          return;
        }

        var newRef = v;
        var oldRef = p;

        if (newRef instanceof View) {
          newRef = newRef.___ref___;
        }

        if (oldRef instanceof View) {
          oldRef = oldRef.___ref___;
        }

        if (newRef !== oldRef && oldRef instanceof View) {
          p.remove();
        }

        if (k in _this13.args) {
          _this13.args[k] = v;
        }
      });
      this.onRemove(debindA);
      this.onRemove(debindB);
      subView.onRemove(function () {
        _this13._onRemove.remove(debindA);

        _this13._onRemove.remove(debindB);
      });
    }
  }, {
    key: "postRender",
    value: function postRender(parentNode) {}
  }, {
    key: "attached",
    value: function attached(parentNode) {}
  }, {
    key: "interpolatable",
    value: function interpolatable(str) {
      return !!String(str).match(this.interpolateRegex);
    }
  }, {
    key: "uuid",
    value: function uuid() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
        return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
      });
    }
  }, {
    key: "remove",
    value: function remove() {
      var _this14 = this;

      var now = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var remover = function remover() {
        for (var _i7 in _this14.tags) {
          if (Array.isArray(_this14.tags[_i7])) {
            _this14.tags[_i7] && _this14.tags[_i7].map(function (t) {
              return t.remove();
            });

            _this14.tags[_i7].splice(0);
          } else {
            _this14.tags[_i7] && _this14.tags[_i7].remove();
            _this14.tags[_i7] = undefined;
          }
        }

        for (var _i8 in _this14.nodes) {
          _this14.nodes[_i8] && _this14.nodes[_i8].dispatchEvent(new Event('cvDomDetached'));
          _this14.nodes[_i8] && _this14.nodes[_i8].remove();
          _this14.nodes[_i8] = undefined;
        }

        _this14.nodes.splice(0);

        _this14.firstNode = _this14.lastNode = undefined;
      };

      if (now) {
        remover();
      } else {
        requestAnimationFrame(remover);
      }

      var callbacks = this._onRemove.items();

      var _iterator5 = _createForOfIteratorHelper(callbacks),
          _step5;

      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var callback = _step5.value;

          this._onRemove.remove(callback);

          callback();
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }

      var cleanup;

      while (cleanup = this.cleanup.shift()) {
        cleanup && cleanup();
      }

      var _iterator6 = _createForOfIteratorHelper(this.viewLists),
          _step6;

      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var _step6$value = _slicedToArray(_step6.value, 2),
              tag = _step6$value[0],
              viewList = _step6$value[1];

          viewList.remove();
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }

      this.viewLists.clear();

      for (var _i9 in this.timeouts) {
        clearTimeout(this.timeouts[_i9].timeout);
        delete this.timeouts[_i9];
      }

      for (var i in this.intervals) {
        clearInterval(this.intervals[i].timeout);
        delete this.intervals[i];
      }

      for (var i in this.frames) {
        this.frames[i]();
        delete this.frames[i];
      }

      this.removed = true;
    }
  }, {
    key: "findTag",
    value: function findTag(selector) {
      for (var i in this.nodes) {
        var result = void 0;

        if (!this.nodes[i].querySelector) {
          continue;
        }

        if (this.nodes[i].matches(selector)) {
          return new _Tag.Tag(this.nodes[i], this, undefined, undefined, this);
        }

        if (result = this.nodes[i].querySelector(selector)) {
          return new _Tag.Tag(result, this, undefined, undefined, this);
        }
      }
    }
  }, {
    key: "findTags",
    value: function findTags(selector) {
      var _this15 = this;

      return this.nodes.filter(function (n) {
        return n.querySelectorAll;
      }).map(function (n) {
        return _toConsumableArray(n.querySelectorAll(selector));
      }).flat().map(function (n) {
        return new _Tag.Tag(n, _this15, undefined, undefined, _this15);
      });
    }
  }, {
    key: "onRemove",
    value: function onRemove(callback) {
      this._onRemove.add(callback);
    }
  }, {
    key: "update",
    value: function update() {}
  }, {
    key: "beforeUpdate",
    value: function beforeUpdate(args) {}
  }, {
    key: "afterUpdate",
    value: function afterUpdate(args) {}
  }, {
    key: "stringTransformer",
    value: function stringTransformer(methods) {
      var _this16 = this;

      return function (x) {
        for (var m in methods) {
          var parent = _this16;
          var method = methods[m];

          while (parent && !parent[method]) {
            parent = parent.parent;
          }

          if (!parent) {
            return;
          }

          x = parent[methods[m]](x);
        }

        return x;
      };
    }
  }, {
    key: "stringToClass",
    value: function stringToClass(refClassname) {
      if (View.refClasses.has(refClassname)) {
        return View.refClasses.get(refClassname);
      }

      var refClassSplit = refClassname.split('/');
      var refShortClass = refClassSplit[refClassSplit.length - 1];

      var refClass = require(refClassname);

      View.refClasses.set(refClassname, refClass[refShortClass]);
      return refClass[refShortClass];
    }
  }, {
    key: "preventParsing",
    value: function preventParsing(node) {
      node[dontParse] = true;
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.nodes.map(function (n) {
        return n.outerHTML;
      }).join(' ');
    }
  }, {
    key: "listen",
    value: function listen(node, eventName, callback, options) {
      var _this17 = this;

      if (typeof node === 'string') {
        options = callback;
        callback = eventName;
        eventName = node;
        node = this;
      }

      if (node instanceof View) {
        return this.listen(node.nodes, eventName, callback, options);
      }

      if (Array.isArray(node)) {
        var removers = node.map(function (n) {
          return _this17.listen(n, eventName, callback, options);
        });
        return function () {
          return removers.map(function (r) {
            return r();
          });
        };
      }

      if (node instanceof _Tag.Tag) {
        return this.listen(node.element, eventName, callback, options);
      }

      node.addEventListener(eventName, callback, options);

      var remove = function remove() {
        node.removeEventListener(eventName, callback, options);
      };

      var remover = function remover() {
        remove();

        remove = function remove() {};
      };

      this.onRemove(function () {
        return remover();
      });
      return remover;
    }
  }], [{
    key: "isView",
    value: function isView() {
      return View;
    }
  }]);

  return View;
}(_Mixin.Mixin["with"](_EventTargetMixin.EventTargetMixin));

exports.View = View;
Object.defineProperty(View, 'templates', {
  value: new Map()
});
Object.defineProperty(View, 'refClasses', {
  value: new Map()
});
  })();
});

require.register("curvature/base/ViewList.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ViewList = void 0;

var _Bindable = require("./Bindable");

var _View = require("./View");

var _Bag = require("./Bag");

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ViewList = /*#__PURE__*/function () {
  function ViewList(template, subProperty, list, parent) {
    var _this = this;

    var keyProperty = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
    var viewClass = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;

    _classCallCheck(this, ViewList);

    this.removed = false;
    this.args = _Bindable.Bindable.makeBindable({});
    this.args.value = _Bindable.Bindable.makeBindable(list || {});
    this.subArgs = _Bindable.Bindable.makeBindable({});
    this.views = [];
    this.cleanup = [];
    this.viewClass = viewClass || _View.View;
    this._onRemove = new _Bag.Bag();
    this.template = template;
    this.subProperty = subProperty;
    this.keyProperty = keyProperty;
    this.tag = null;
    this.paused = false;
    this.parent = parent;
    this.rendered = new Promise(function (accept, reject) {
      Object.defineProperty(_this, 'renderComplete', {
        configurable: false,
        writable: true,
        value: accept
      });
    });
    this.willReRender = false;

    this.args.___before(function (t, e, s, o, a) {
      if (e == 'bindTo') {
        return;
      }

      _this.paused = true;
    });

    this.args.___after(function (t, e, s, o, a) {
      if (e == 'bindTo') {
        return;
      }

      _this.paused = s.length > 1;

      _this.reRender();
    });

    var debind = this.args.value.bindTo(function (v, k, t, d) {
      if (_this.paused) {
        return;
      }

      var kk = k;

      if (_typeof(k) === 'symbol') {
        return;
      }

      if (isNaN(k)) {
        kk = '_' + k;
      }

      if (d) {
        if (_this.views[kk]) {
          _this.views[kk].remove();
        }

        delete _this.views[kk];

        for (var i in _this.views) {
          if (typeof i === 'string') {
            _this.views[i].args[_this.keyProperty] = i.substr(1);
            continue;
          }

          _this.views[i].args[_this.keyProperty] = i;
        }
      } else if (!_this.views[kk] && !_this.willReRender) {
        cancelAnimationFrame(_this.willReRender);
        _this.willReRender = requestAnimationFrame(function () {
          _this.reRender();
        });
      } else if (_this.views[kk] && _this.views[kk].args) {
        _this.views[kk].args[_this.keyProperty] = k;
        _this.views[kk].args[_this.subProperty] = v;
      }
    });

    this._onRemove.add(debind);
  }

  _createClass(ViewList, [{
    key: "render",
    value: function render(tag) {
      var _this2 = this;

      var renders = [];

      var _iterator = _createForOfIteratorHelper(this.views),
          _step;

      try {
        var _loop = function _loop() {
          var view = _step.value;
          view.render(tag);
          renders.push(view.rendered.then(function () {
            return view;
          }));
        };

        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          _loop();
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      this.tag = tag;
      Promise.all(renders).then(function (views) {
        return _this2.renderComplete(views);
      });
    }
  }, {
    key: "reRender",
    value: function reRender() {
      var _this3 = this;

      if (this.paused || !this.tag) {
        return;
      }

      var views = [];

      for (var i in this.views) {
        views[i] = this.views[i];
      }

      var finalViews = [];
      this.upDebind && this.upDebind.map(function (d) {
        return d && d();
      });
      this.downDebind && this.downDebind.map(function (d) {
        return d && d();
      });
      this.upDebind = [];
      this.downDebind = [];
      var minKey = Infinity;
      var anteMinKey = Infinity;

      var _loop2 = function _loop2(_i) {
        var found = false;
        var k = _i;

        if (isNaN(k)) {
          k = '_' + _i;
        } else if (String(k).length) {
          k = Number(k);
        }

        for (var _j = views.length - 1; _j >= 0; _j--) {
          if (views[_j] && _this3.args.value[_i] !== undefined && _this3.args.value[_i] === views[_j].args[_this3.subProperty]) {
            found = true;
            finalViews[k] = views[_j];

            if (!isNaN(k)) {
              minKey = Math.min(minKey, k);
              k > 0 && (anteMinKey = Math.min(anteMinKey, k));
            }

            finalViews[k].args[_this3.keyProperty] = _i;
            delete views[_j];
            break;
          }
        }

        if (!found) {
          var viewArgs = {};
          var view = finalViews[k] = new _this3.viewClass(viewArgs, _this3.parent);

          if (!isNaN(k)) {
            minKey = Math.min(minKey, k);
            k > 0 && (anteMinKey = Math.min(anteMinKey, k));
          }

          finalViews[k].template = _this3.template instanceof Object ? _this3.template : _this3.template;
          finalViews[k].viewList = _this3;
          finalViews[k].args[_this3.keyProperty] = _i;
          finalViews[k].args[_this3.subProperty] = _this3.args.value[_i];
          _this3.upDebind[k] = viewArgs.bindTo(_this3.subProperty, function (v, k, t, d) {
            var index = viewArgs[_this3.keyProperty];

            if (d) {
              delete _this3.args.value[index];
              return;
            }

            _this3.args.value[index] = v;
          });
          _this3.downDebind[k] = _this3.subArgs.bindTo(function (v, k, t, d) {
            if (d) {
              delete viewArgs[k];
              return;
            }

            viewArgs[k] = v;
          });
          view.onRemove(function () {
            _this3.upDebind[k] && _this3.upDebind[k]();
            _this3.downDebind[k] && _this3.downDebind[k]();
            delete _this3.downDebind[k];
            delete _this3.upDebind[k];
          });

          _this3._onRemove.add(function () {
            _this3.upDebind.filter(function (x) {
              return x;
            }).map(function (d) {
              return d();
            });

            _this3.upDebind.splice(0);
          });

          _this3._onRemove.add(function () {
            _this3.downDebind.filter(function (x) {
              return x;
            }).map(function (d) {
              return d();
            });

            _this3.downDebind.splice(0);
          });

          viewArgs[_this3.subProperty] = _this3.args.value[_i];
        }
      };

      for (var _i in this.args.value) {
        _loop2(_i);
      }

      for (var _i2 in views) {
        var found = false;

        for (var j in finalViews) {
          if (views[_i2] === finalViews[j]) {
            found = true;
            break;
          }
        }

        if (!found) {
          views[_i2].remove();
        }
      }

      if (Array.isArray(this.args.value)) {
        var localMin = minKey === 0 && finalViews[1] !== undefined && finalViews.length > 1 || anteMinKey === Infinity ? minKey : anteMinKey;

        var renderRecurse = function renderRecurse() {
          var i = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var ii = finalViews.length - i - 1;

          while (ii > localMin && finalViews[ii] === undefined) {
            ii--;
          }

          if (ii < localMin) {
            return Promise.resolve();
          }

          if (finalViews[ii] === _this3.views[ii]) {
            if (!finalViews[ii].firstNode) {
              finalViews[ii].render(_this3.tag, finalViews[ii + 1]);
              return finalViews[ii].rendered.then(function () {
                return renderRecurse(Number(i) + 1);
              });
            }

            return renderRecurse(Number(i) + 1);
          }

          finalViews[ii].render(_this3.tag, finalViews[ii + 1]);

          _this3.views.splice(ii, 0, finalViews[ii]);

          return finalViews[ii].rendered.then(function () {
            return renderRecurse(Number(i) + 1);
          });
        };

        this.rendered = renderRecurse();
      } else {
        var renders = [];
        var leftovers = Object.assign({}, finalViews);

        var _loop3 = function _loop3(_i3) {
          delete leftovers[_i3];

          if (finalViews[_i3].firstNode && finalViews[_i3] === _this3.views[_i3]) {
            return "continue";
          }

          finalViews[_i3].render(_this3.tag);

          renders.push(finalViews[_i3].rendered.then(function () {
            return finalViews[_i3];
          }));
        };

        for (var _i3 in finalViews) {
          var _ret = _loop3(_i3);

          if (_ret === "continue") continue;
        }

        for (var _i4 in leftovers) {
          delete this.args.views[_i4];
          leftovers.remove();
        }

        this.rendered = Promise.all(renders);
      }

      this.views = finalViews;

      for (var _i5 in finalViews) {
        if (isNaN(_i5)) {
          finalViews[_i5].args[this.keyProperty] = _i5.substr(1);
          continue;
        }

        finalViews[_i5].args[this.keyProperty] = _i5;
      }

      this.willReRender = false;
    }
  }, {
    key: "pause",
    value: function pause() {
      var _pause = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      for (var i in this.views) {
        this.views[i].pause(_pause);
      }
    }
  }, {
    key: "onRemove",
    value: function onRemove(callback) {
      this._onRemove.add(callback);
    }
  }, {
    key: "remove",
    value: function remove() {
      for (var i in this.views) {
        this.views[i].remove();
      }

      var onRemove = this._onRemove.items();

      for (var _i6 in onRemove) {
        this._onRemove.remove(onRemove[_i6]);

        onRemove[_i6]();
      }

      var cleanup;

      while (this.cleanup.length) {
        cleanup = this.cleanup.pop();
        cleanup();
      }

      this.views = [];

      while (this.tag && this.tag.firstChild) {
        this.tag.removeChild(this.tag.firstChild);
      }

      if (this.subArgs) {
        _Bindable.Bindable.clearBindings(this.subArgs);
      }

      _Bindable.Bindable.clearBindings(this.args);

      if (this.args.value && !this.args.value.isBound()) {
        _Bindable.Bindable.clearBindings(this.args.value);
      }

      this.removed = true;
    }
  }]);

  return ViewList;
}();

exports.ViewList = ViewList;
  })();
});

require.register("curvature/mixin/EventTargetMixin.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EventTargetMixin = void 0;

var _Mixin = require("../base/Mixin");

var _EventTargetMixin;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _EventTarget = Symbol('Target');

var EventTargetMixin = (_EventTargetMixin = {}, _defineProperty(_EventTargetMixin, _Mixin.Mixin.Constructor, function () {
  try {
    this[_EventTarget] = new EventTarget();
  } catch (error) {
    this[_EventTarget] = document.createDocumentFragment();
  }
}), _defineProperty(_EventTargetMixin, "dispatchEvent", function dispatchEvent() {
  var _this$_EventTarget;

  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var event = args[0];

  (_this$_EventTarget = this[_EventTarget]).dispatchEvent.apply(_this$_EventTarget, args);

  var defaultHandler = "on".concat(event.type[0].toUpperCase() + event.type.slice(1));

  if (typeof this[defaultHandler] === 'function') {
    this[defaultHandler](event);
  }

  return event.returnValue;
}), _defineProperty(_EventTargetMixin, "addEventListener", function addEventListener() {
  var _this$_EventTarget2;

  (_this$_EventTarget2 = this[_EventTarget]).addEventListener.apply(_this$_EventTarget2, arguments);
}), _defineProperty(_EventTargetMixin, "removeEventListener", function removeEventListener() {
  var _this$_EventTarget3;

  (_this$_EventTarget3 = this[_EventTarget]).removeEventListener.apply(_this$_EventTarget3, arguments);
}), _EventTargetMixin);
exports.EventTargetMixin = EventTargetMixin;
  })();
});

require.register("curvature/mixin/PromiseMixin.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "curvature");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PromiseMixin = void 0;

var _Mixin = require("../base/Mixin");

var _PromiseMixin;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _Promise = Symbol('Promise');

var Accept = Symbol('Accept');
var Reject = Symbol('Reject');
var PromiseMixin = (_PromiseMixin = {}, _defineProperty(_PromiseMixin, _Mixin.Mixin.Constructor, function () {
  var _this = this;

  this[_Promise] = new Promise(function (accept, reject) {
    _this[Accept] = accept;
    _this[Reject] = reject;
  });
}), _defineProperty(_PromiseMixin, "then", function then() {
  var _this$_Promise;

  return (_this$_Promise = this[_Promise]).then.apply(_this$_Promise, arguments);
}), _defineProperty(_PromiseMixin, "catch", function _catch() {
  var _this$_Promise2;

  return (_this$_Promise2 = this[_Promise])["catch"].apply(_this$_Promise2, arguments);
}), _defineProperty(_PromiseMixin, "finally", function _finally() {
  var _this$_Promise3;

  return (_this$_Promise3 = this[_Promise])["finally"].apply(_this$_Promise3, arguments);
}), _PromiseMixin);
exports.PromiseMixin = PromiseMixin;
Object.defineProperty(PromiseMixin, 'Reject', {
  value: Reject
});
Object.defineProperty(PromiseMixin, 'Accept', {
  value: Accept
});
  })();
});

require.register("pokemon-parser/BitArray.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "pokemon-parser");
  (function() {
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BitArray = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var BitArray = /*#__PURE__*/function () {
  function BitArray() {
    var buffer = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

    _classCallCheck(this, BitArray);

    if (buffer === undefined) {
      buffer = [];
    }

    if (typeof buffer === 'number') {
      buffer = Array.from(Array(buffer));
    }

    if (Array.isArray(buffer)) {
      buffer = new Uint8Array(buffer);
    }

    if (buffer instanceof BitArray) {
      buffer = buffer.buffer;
    }

    this.buffer = buffer;
    this.done = false;
    this.i = this.j = 0;
  }

  _createClass(BitArray, [{
    key: "clone",
    value: function clone() {
      return new this.constructor(this);
    }
  }, {
    key: "get",
    value: function get(address) {
      var byteAddress = Math.floor(address / 8);
      var bitOffset = address % 8;
      var getMask = 0x1 << bitOffset; // console.log(getMask.toString(2), this.buffer[ byteAddress ].toString(2));

      return (getMask & this.buffer[byteAddress]) >> bitOffset;
    }
  }, {
    key: "set",
    value: function set(address, value) {
      var byteAddress = Math.floor(address / 8);
      var bitOffset = address % 8;
      var setMask = value ? 0x1 << bitOffset : ~(0x1 << bitOffset);

      if (value) {
        this.buffer[byteAddress] |= setMask;
      } else {
        this.buffer[byteAddress] &= setMask;
      }
    }
  }, {
    key: "next",
    value: function next() {
      var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var result = 0;
      var count = x;
      var _byte = this.buffer[this.i];

      while (x-- > 0) {
        var bit = _byte >> 7 - this.j & 0x1; // console.log('Got, %d from %s.%d', bit, byte.toString(2).padStart(8,'0'), this.j);

        this.j++;

        if (this.j > 7) {
          this.j = 0;
          _byte = this.buffer[++this.i];
        }

        if (this.i >= this.buffer.length) {
          this.done = true;
        }

        result <<= 1;
        result |= bit;
      }

      return result;
    }
  }, {
    key: "length",
    get: function get() {
      return this.buffer.length * 8;
    }
  }]);

  return BitArray;
}();

exports.BitArray = BitArray;
  })();
});
require.register("Processor.js", function(exports, require, module) {
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Processor = void 0;

var _View2 = require("curvature/base/View");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var Processor = /*#__PURE__*/function (_View) {
  _inherits(Processor, _View);

  var _super = _createSuper(Processor);

  function Processor(args, parent) {
    var _this;

    _classCallCheck(this, Processor);

    _this = _super.call(this, args, parent);

    _this.args.bindTo('input', function (v) {
      if (!v) {
        return;
      }

      _this.args.inputName = v.args.input ? v.args.input.name : v.args.title;
      _this.args.offset = Number(v.args.firstByte);
      _this.args.length = Number(v.args.buffer.length) - _this.args.offset;
    });

    return _this;
  }

  return Processor;
}(_View2.View);

exports.Processor = Processor;
});

;require.register("canvas/Canvas.js", function(exports, require, module) {
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Canvas = void 0;

var _View2 = require("curvature/base/View");

var _Menu = require("../menu/Menu");

var _Panel = require("../panel/Panel");

var _Invert = require("../processor/Invert");

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Canvas = /*#__PURE__*/function (_View) {
  _inherits(Canvas, _View);

  var _super = _createSuper(Canvas);

  function Canvas(args, parent) {
    var _this;

    _classCallCheck(this, Canvas);

    _this = _super.call(this, args, parent);

    _defineProperty(_assertThisInitialized(_this), "template", require('./canvas.html'));

    _this.args.height = _this.args.height || 128;
    _this.args.width = _this.args.width || 128;
    _this.args.scale = _this.args.scale || 2;
    _this.args.offset = 0;
    _this.scrollDelta = 1;
    _this.args.decoder = args.decoder || 'gameboy';
    _this.args.showSettings = false;
    _this.args.buffer = _this.args.buffer || false;
    _this.args.firstByte = '0000';
    return _this;
  }

  _createClass(Canvas, [{
    key: "onRendered",
    value: function onRendered() {
      var _this2 = this;

      var canvasStyle = {
        '--scale': this.args.scale,
        '--width': this.args.width,
        '--height': this.args.height
      };
      this.args.bindTo('offset', function (v, k) {
        if (!_this2.args.buffer || !_this2.tags.canvas) {
          return;
        }

        _this2.drawDots(_this2.args.buffer);
      }, {
        wait: 0
      });
      this.args.bindTo('scale', function (v, k) {
        if (_this2.tags.canvas) {
          canvasStyle['--scale'] = v;

          _this2.tags.canvas.style(canvasStyle);
        }

        if (_this2.args.buffer) {
          _this2.drawDots(_this2.args.buffer);
        }
      }, {
        wait: 0
      });
      this.args.bindTo('width', function (v, k) {
        v = Number(v);

        if (_this2.tags.canvas) {
          canvasStyle['--width'] = v;
          _this2.tags.canvas.width = v;

          _this2.tags.canvas.style(canvasStyle);
        }

        if (_this2.args.buffer) {
          _this2.drawDots(_this2.args.buffer);
        }
      }, {
        wait: 0
      });
      this.args.bindTo('height', function (v, k) {
        v = Number(v);

        if (_this2.tags.canvas) {
          canvasStyle['--height'] = v;
          _this2.tags.canvas.height = v;

          _this2.tags.canvas.style(canvasStyle);
        }

        if (_this2.args.buffer) {
          _this2.drawDots(_this2.args.buffer);
        }
      }, {
        wait: 0
      });
      this.args.bindTo('input', function (v) {
        if (!v) {
          return;
        }

        _this2.args.filename = v.name;
        var reader = new FileReader();
        reader.readAsArrayBuffer(v);

        reader.onload = function () {
          _this2.args.buffer = new Uint8Array(reader.result);

          _this2.onTimeout(0, function () {
            _this2.drawDots(_this2.args.buffer);
          });
        };
      });
      this.args.bindTo('decoder', function (v) {
        if (!_this2.args.buffer) {
          return;
        }

        _this2.drawDots(_this2.args.buffer);
      }, {
        frame: true
      });
    }
  }, {
    key: "wheel",
    value: function wheel(event) {
      event.preventDefault();

      if (event.deltaY < 1 && this.args.offset > 0) {
        this.args.offset = Number(this.args.offset) - this.scrollDelta;
      } else if (event.deltaY > 1) {
        this.args.offset = Number(this.args.offset) + this.scrollDelta;
      }

      if (0 > this.args.offset) {
        this.args.offset = 0;
      }
    }
  }, {
    key: "drawDots",
    value: function drawDots() {
      var bytes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      if (bytes === undefined) {
        bytes = this.args.buffer;
      }

      var canvas = this.tags.canvas;
      var context = canvas.getContext('2d');
      requestAnimationFrame(function () {
        return context.clearRect(0, 0, canvas.width, canvas.height);
      });

      switch (this.args.decoder) {
        case 'bytes':
          this.bytePerPixel(bytes);
          break;

        case 'gameboy':
          this.nin2bit(bytes);
          break;

        case 'gameboy-1bit':
          this.nin1bit(bytes);
          break;

        case 'bits':
          this.bitPerPixel(bytes);
          break;
      }
    }
  }, {
    key: "nin1bitCols",
    value: function nin1bitCols(bytes) {
      this.scrollDelta = 1;
      var tilesize = 8;
      var canvas = this.tags.canvas;
      var context = canvas.getContext('2d');
      var width = this.args.width;
      var height = Math.floor(this.args.height / width);
      var o = 0;
      var pixelsList = [];

      for (var i = 0; i < bytes.length; i += 1) {
        var _byte = bytes[i];
        var bits = [(_byte & 128) >> 7, (_byte & 64) >> 6, (_byte & 32) >> 5, (_byte & 16) >> 4, (_byte & 8) >> 3, (_byte & 4) >> 2, (_byte & 2) >> 1, (_byte & 1) >> 0];

        if (!pixelsList[currentTileY]) {
          pixelsList[currentTileY] = context.createImageData(maxTilesX * 8, 8);
        }

        for (var j in bits) {// const
        }
      }

      var _loop = function _loop(p) {
        requestAnimationFrame(function () {
          return context.putImageData(pixelsList[p], 0, p * 8);
        });
      };

      for (var p in pixelsList) {
        _loop(p);
      }
    }
  }, {
    key: "nin1bit",
    value: function nin1bit(bytes) {
      this.scrollDelta = 1;
      var tilesize = 2;
      var canvas = this.tags.canvas;
      var context = canvas.getContext('2d');
      var maxTilesX = Math.floor(this.args.width / tilesize);
      var offset = this.args.offset;
      var width = this.args.width;
      var pixelsList = [];
      this.args.firstByte = offset * width;
      var o = 0;

      for (var i = 0; i < bytes.length; i += 1) {
        var _byte2 = bytes[i];
        var bits = [(_byte2 & 1) >> 0, (_byte2 & 2) >> 1, (_byte2 & 4) >> 2, (_byte2 & 8) >> 3, (_byte2 & 16) >> 4, (_byte2 & 32) >> 5, (_byte2 & 64) >> 6, (_byte2 & 128) >> 7];

        for (var j in bits) {
          var bit = bits[j];
          var currentTile = Math.floor(o / Math.pow(tilesize, 2));
          var currentTileX = currentTile % maxTilesX;

          var _currentTileY = Math.floor(currentTile / maxTilesX);

          var tileOffset = o % Math.pow(tilesize, 2);
          var tileOffsetX = Math.floor(tileOffset / tilesize);
          var tileOffsetY = tileOffset % tilesize;

          if (!pixelsList[_currentTileY]) {
            pixelsList[_currentTileY] = context.createImageData(width, tilesize);
          }

          var pixels = pixelsList[_currentTileY];
          var fromOriginX = currentTileX * tilesize + tileOffsetX;
          var fromOriginY = tileOffsetY;
          var address = 4 * (width * fromOriginY + fromOriginX);
          pixels.data[address + 0] = bits[j] ? 255 : 0;
          pixels.data[address + 1] = bits[j] ? 255 : 0;
          pixels.data[address + 2] = bits[j] ? 255 : 0;
          pixels.data[address + 3] = bits[j] ? 255 : 255;
          o++;
        }
      }

      var _loop2 = function _loop2(p) {
        requestAnimationFrame(function () {
          return context.putImageData(pixelsList[p], 0, p * tilesize);
        });
      };

      for (var p in pixelsList) {
        _loop2(p);
      }
    }
  }, {
    key: "nin2bit",
    value: function nin2bit(bytes) {
      this.scrollDelta = 1;
      var pallet = [[0xFF, 0xFF, 0xFF], [0x44, 0x44, 0x44], [0xCC, 0xCC, 0xCC], [0x00, 0x00, 0x00]];
      var canvas = this.tags.canvas;
      var context = canvas.getContext('2d');
      var o = 0;
      var maxTilesX = Math.floor(this.args.width / 8);
      var height = Math.ceil(this.args.height / 8) * 8;
      var offset = this.args.offset;
      var width = this.args.width;
      var pixelsList = [];
      this.args.firstByte = offset * maxTilesX * 16;

      for (var i = 0; i < bytes.length; i += 2) {
        var byteA = bytes[i];
        var byteB = bytes[i + 1];

        if (o < offset * maxTilesX * 8) {
          o++;
          continue;
        }

        if (o > height * width + offset * (maxTilesX * 8)) {
          break;
        }

        var bitPairs = [((byteA & 128) << 1 | byteB & 128) >> 7, ((byteA & 64) << 1 | byteB & 64) >> 6, ((byteA & 32) << 1 | byteB & 32) >> 5, ((byteA & 16) << 1 | byteB & 16) >> 4, ((byteA & 8) << 1 | byteB & 8) >> 3, ((byteA & 4) << 1 | byteB & 4) >> 2, ((byteA & 2) << 1 | byteB & 2) >> 1, ((byteA & 1) << 1 | byteB & 1) >> 0];

        for (var j in bitPairs) {
          var ii = o - offset * maxTilesX * 8;
          var currentTile = Math.floor(ii / 64);
          var currentTileX = currentTile % maxTilesX;

          var _currentTileY2 = Math.floor(currentTile / maxTilesX);

          var fromTile = ii % 64;
          var fromTileY = Math.floor(fromTile / 8);
          var fromTileX = fromTile % 8;
          var fromOriginX = currentTileX * 8 + fromTileX;
          var fromOriginY = fromTileY;

          if (!pixelsList[_currentTileY2]) {
            pixelsList[_currentTileY2] = context.createImageData(maxTilesX * 8, 8);
          }

          var pixels = pixelsList[_currentTileY2];
          var address = 4 * (maxTilesX * 8 * fromOriginY + fromOriginX);
          pixels.data[address + 0] = pallet[bitPairs[j]][0];
          pixels.data[address + 1] = pallet[bitPairs[j]][1];
          pixels.data[address + 2] = pallet[bitPairs[j]][2];
          pixels.data[address + 3] = 255;
          o++;
        }
      }

      var _loop3 = function _loop3(p) {
        requestAnimationFrame(function () {
          return context.putImageData(pixelsList[p], 0, p * 8);
        });
      };

      for (var p in pixelsList) {
        _loop3(p);
      }
    }
  }, {
    key: "bytePerPixel",
    value: function bytePerPixel(bytes) {
      this.scrollDelta = 8;
      var canvas = this.tags.canvas;
      var context = canvas.getContext('2d');
      var i = 0;
      this.args.firstByte = this.args.offset * this.args.width;
      var pixelsList = [];
      var pixelCounts = [];

      var _iterator = _createForOfIteratorHelper(bytes.slice(this.args.firstByte)),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _byte3 = _step.value;
          var renderRow = Math.floor(i / this.args.width);
          var renderBand = Math.floor(renderRow / 8);
          var rowOffset = Math.floor(this.args.offset / this.args.width);
          i++;

          if (i > this.args.height * this.args.width + rowOffset) {
            break;
          }

          if (!pixelsList[renderBand]) {
            pixelsList[renderBand] = context.createImageData(context.canvas.width, 8);
            pixelCounts[renderBand] = 0;
          }

          var pixels = pixelsList[renderBand];
          pixels.data[pixelCounts[renderBand]++] = _byte3;
          pixels.data[pixelCounts[renderBand]++] = _byte3;
          pixels.data[pixelCounts[renderBand]++] = _byte3;
          pixels.data[pixelCounts[renderBand]++] = 255;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      var _loop4 = function _loop4(p) {
        requestAnimationFrame(function () {
          return context.putImageData(pixelsList[p], 0, p * 8);
        });
      };

      for (var p in pixelsList) {
        _loop4(p);
      } // context.putImageData(pixels, 0, 0);

    }
  }, {
    key: "bitPerPixel",
    value: function bitPerPixel(bytes) {
      this.scrollDelta = 8;
      var canvas = this.tags.canvas;
      var context = canvas.getContext('2d');
      var i = 0;
      var o = 0;
      this.args.firstByte = 8 * this.args.offset * this.args.width;
      var pixelCounts = [];
      var pixelsList = [];

      var _iterator2 = _createForOfIteratorHelper(bytes),
          _step2;

      try {
        bytes: for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _byte4 = _step2.value;
          var bits = [(_byte4 & 128) >> 7, (_byte4 & 64) >> 6, (_byte4 & 32) >> 5, (_byte4 & 16) >> 4, (_byte4 & 8) >> 3, (_byte4 & 4) >> 2, (_byte4 & 2) >> 1, (_byte4 & 1) >> 0];

          bits: for (var _i = 0, _bits = bits; _i < _bits.length; _i++) {
            var bit = _bits[_i];
            var renderRow = Math.floor(o / this.args.width);
            var renderBand = Math.floor(renderRow / 8);
            var rowOffset = Math.floor(this.args.offset / this.args.width);

            if (!pixelsList[renderBand]) {
              pixelsList[renderBand] = context.createImageData(context.canvas.width, 8);
              pixelCounts[renderBand] = 0;
            }

            if (i < this.args.offset * this.args.width) {
              i++;
              continue;
            }

            i++;

            if (o > this.args.height * this.args.width) {
              break bytes;
            }

            o++;
            var pixels = pixelsList[renderBand];
            pixels.data[pixelCounts[renderBand]++] = bit * 255;
            pixels.data[pixelCounts[renderBand]++] = bit * 255;
            pixels.data[pixelCounts[renderBand]++] = bit * 255;
            pixels.data[pixelCounts[renderBand]++] = 255;
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      var _loop5 = function _loop5(p) {
        requestAnimationFrame(function () {
          return context.putImageData(pixelsList[p], 0, p * 8);
        });
      };

      for (var p in pixelsList) {
        _loop5(p);
      }
    }
  }, {
    key: "toggleSettings",
    value: function toggleSettings() {
      this.args.showSettings = !this.args.showSettings;
    }
  }, {
    key: "zoomIn",
    value: function zoomIn() {
      this.args.scale++;
    }
  }, {
    key: "zoomOut",
    value: function zoomOut() {
      this.args.scale--;
    }
  }, {
    key: "run",
    value: function run(event) {
      var rootPanel = this.args.panel;
      var input = this;
      var menuPanel = new _Panel.Panel({
        title: 'Select a Processor',
        widget: new _Menu.Menu({
          input: input,
          panel: rootPanel
        }),
        left: event.clientX + 'px',
        top: event.clientY + 'px'
      });
      rootPanel.args.panels.push(menuPanel);
    }
  }, {
    key: "hex",
    value: function hex(x) {
      return Number(x).toString(16).padStart(4, '0');
    }
  }]);

  return Canvas;
}(_View2.View);

exports.Canvas = Canvas;
});

;require.register("canvas/canvas.html", function(exports, require, module) {
module.exports = "<div data-module = \"canvas [[module]]\">\n\n\t<label cv-if = \"buffer\">\n\t\t<div>\n\t\t\t<div class = \"icon inline-icon gear-icon\" cv-on = \"click:toggleSettings(event)\"></div>\n\t\t\t<div class = \"icon inline-icon save-icon\"cv-on = \"click:save(event)\"></div>\n\t\t\t<div class = \"icon inline-icon run-icon\" cv-on = \"click:run(event)\"></div>\n\t\t\t<!-- <div class = \"icon inline-icon folder-icon\"></div> -->\n\t\t</div>\n\t</label>\n\n\t<span cv-if = \"showSettings\">\n\n\t\t<label cv-if = \"buffer\">\n\t\t\t<p>width</p>\n\t\t\t<input cv-bind = \"width\" type = \"number\" min = \"0\">\n\t\t</label>\n\n\t\t<label cv-if = \"buffer\">\n\t\t\t<p>height</p>\n\t\t\t<input cv-bind = \"height\" type = \"number\" min = \"0\">\n\t\t</label>\n\n\t\t<label cv-if = \"buffer\">\n\t\t\t<p>scale</p>\n\t\t\t<input cv-bind = \"scale\" type = \"number\" min = \"1\">\n\t\t</label>\n\n\t\t<label cv-if = \"buffer\">\n\t\t\t<p>row</p>\n\t\t\t<input cv-bind = \"offset\" type = \"number\" min = \"0\">\n\t\t</label>\n\t</span>\n\n\t<label cv-if = \"!buffer\">\n\t\t<input type = \"file\" cv-bind = \"input\">\n\t</label>\n\n\t<label cv-if = \"buffer\">\n\t\t<p>encoding</p>\n\t\t<select cv-bind = \"decoder\">\n\t\t\t<optgroup label = \"streams\">\n\t\t\t\t<!-- <option value = \"\">32 bit color (R,G,B,A...)*</option> -->\n\t\t\t\t<!-- <option value = \"\">24 bit color (R,G,B...)*</option> -->\n\t\t\t\t<!-- <option value = \"\">16 bit greyscale*</option> -->\n\t\t\t\t<option value = \"bytes\">8 bit greyscale</option>\n\t\t\t\t<!-- <option value = \"\">4 bit greyscale*</option> -->\n\t\t\t\t<!-- <option value = \"\">2 bit greyscale*</option> -->\n\t\t\t\t<option value = \"bits\">1 bit black & white</option>\n\t\t\t</optgroup>\n\t\t\t<optgroup label = \"tiles\">\n\t\t\t\t<option value = \"gameboy\">2 bit gameboy (2bpp)</option>\n\t\t\t\t<option value = \"gameboy-1bit\">1 bit gameboy (1bpp)</option>\n\t\t\t</optgroup>\n\t\t</select>\n\t</label>\n\n\t<label cv-if = \"buffer\">\n\t\t<p>buffer</p>\n\t\t<div class = \"canvas-window\">\n\t\t\t<canvas cv-ref = \"canvas\" cv-on = \"wheel(event)\"></canvas>\n\t\t\t<div class = \"row\">\n\t\t\t\t<div><code>0x[[firstByte|hex]]</code></div>\n\t\t\t\t<div class = \"right\">\n\t\t\t\t\t<div class = \"icon inline-icon zoom-out-icon\" cv-on = \"click:zoomOut(event)\"></div>\n\t\t\t\t\t<div class = \"icon inline-icon zoom-in-icon\" cv-on = \"click:zoomIn(event)\"></div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</label>\n</div>\n"
});

;require.register("file/Drop.js", function(exports, require, module) {
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Drop = void 0;

var _View2 = require("curvature/base/View");

var _Panel = require("../panel/Panel");

var _Canvas = require("../canvas/Canvas");

var _Icon = require("./Icon");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Drop = /*#__PURE__*/function (_View) {
  _inherits(Drop, _View);

  var _super = _createSuper(Drop);

  function Drop(args, parent) {
    var _this;

    _classCallCheck(this, Drop);

    _this = _super.call(this, args, parent);

    _defineProperty(_assertThisInitialized(_this), "template", require('./drop.html'));

    _this.args.files = [];
    return _this;
  }

  _createClass(Drop, [{
    key: "drop",
    value: function drop(event) {
      event.preventDefault();
      var rootPanel = this.args.panel;
      var file = event.dataTransfer.files[0];
      var title = file.name;
      var widget = new _Canvas.Canvas({
        input: file,
        panel: rootPanel
      });
      rootPanel.args.panels.push(new _Panel.Panel({
        title: title,
        widget: widget
      }));
      this.args.files.push({
        name: file.name,
        file: file
      });
    }
  }, {
    key: "dragover",
    value: function dragover(event) {
      event.preventDefault();
    }
  }]);

  return Drop;
}(_View2.View);

exports.Drop = Drop;
});

;require.register("file/Icon.js", function(exports, require, module) {
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Icon = void 0;

var _View2 = require("curvature/base/View");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Icon = /*#__PURE__*/function (_View) {
  _inherits(Icon, _View);

  var _super = _createSuper(Icon);

  function Icon(args, parent) {
    var _this;

    _classCallCheck(this, Icon);

    _this = _super.call(this, args, parent);

    _defineProperty(_assertThisInitialized(_this), "template", require('./icon.html'));

    return _this;
  }

  return Icon;
}(_View2.View);

exports.Icon = Icon;
});

;require.register("file/drop.html", function(exports, require, module) {
module.exports = "<div data-module = \"file-drop\" cv-on = \"drop(event);dragover(event)\">\n\tdrop files here.\n</div>\n\n<div data-module = \"file-list\" cv-each = \"files:file\" cv-view = \"/file/Icon\">\n\t<div tabindex = \"0\" class = \"file\">\n\t\t<img src = \"/gameboy.ico\">\n\t\t<span>[[file.name]]</span>\n\t</div>\n</div>\n"
});

;require.register("file/icon.html", function(exports, require, module) {
module.exports = "<div class = \"file\" tabindex = \"0\">\n\t<img src = \"/gameboy.ico\">\n\t<span>[[file.name]]</span>\n</div>\n"
});

;require.register("initialize.js", function(exports, require, module) {
"use strict";

var _View = require("curvature/base/View");

var _Tag = require("curvature/base/Tag");

var _Panel = require("./panel/Panel");

var _Drop = require("./file/Drop");

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var drawDots = function drawDots(file, context) {
  var reader = new FileReader();
  reader.readAsArrayBuffer(file);

  reader.onload = function () {
    var bytes = new Uint8Array(reader.result);
    var height = Math.ceil(bytes.length / context.canvas.width);
    context.canvas.height = height;
    var pixels = context.createImageData(context.canvas.width, context.canvas.height);
    var i = 0;

    var _iterator = _createForOfIteratorHelper(bytes),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _byte = _step.value;
        pixels.data[i++] = _byte;
        pixels.data[i++] = _byte;
        pixels.data[i++] = _byte;
        pixels.data[i++] = 255;
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    context.putImageData(pixels, 0, 0);
  };
};

document.addEventListener('DOMContentLoaded', function () {
  var drop = new _Drop.Drop();
  var panel = new _Panel.Panel({
    type: 'root',
    widget: drop
  });
  drop.args.panel = panel;
  panel.render(document.body);
});
});

require.register("menu/Menu.js", function(exports, require, module) {
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Menu = void 0;

var _View2 = require("curvature/base/View");

var _Panel = require("../panel/Panel");

var _Invert = require("../processor/Invert");

var _Deinterlace = require("../processor/Deinterlace");

var _RLE = require("../processor/RLE");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Menu = /*#__PURE__*/function (_View) {
  _inherits(Menu, _View);

  var _super = _createSuper(Menu);

  function Menu(args, parent) {
    var _this;

    _classCallCheck(this, Menu);

    _this = _super.call(this, args, parent);

    _defineProperty(_assertThisInitialized(_this), "template", require('./menu.html'));

    _this.args.links = {
      Invert: _Invert.Invert,
      RLE: _RLE.RLE,
      Deinterlace: _Deinterlace.Deinterlace
    };
    return _this;
  }

  _createClass(Menu, [{
    key: "click",
    value: function click(event, processor, title) {
      var rootPanel = this.args.panel;
      var input = this.args.input;
      var widget = new processor({
        input: input,
        panel: rootPanel
      });
      var panel = new _Panel.Panel({
        title: title,
        widget: widget
      });
      rootPanel.args.panels.push(panel);
    }
  }]);

  return Menu;
}(_View2.View);

exports.Menu = Menu;
});

;require.register("menu/menu.html", function(exports, require, module) {
module.exports = "<div data-module = \"menu\" cv-each = \"links:processor:title\">\n\t<div><a cv-link = \"/process/[[title]]\" cv-on = \"click(event, processor, title)\">[[title]]</a>\n</div>\n"
});

;require.register("panel/Panel.js", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Panel = void 0;

var _View2 = require("curvature/base/View");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Panel = /*#__PURE__*/function (_View) {
  _inherits(Panel, _View);

  var _super = _createSuper(Panel);

  function Panel(args, panel) {
    var _this;

    _classCallCheck(this, Panel);

    _this = _super.call(this, args, panel);

    _defineProperty(_assertThisInitialized(_this), "template", require('./panel.html'));

    _this.args.title = _this.args.title || null;
    _this.args.widget = _this.args.widget || null;
    _this.args.panels = [];
    _this.args.left = 0;
    _this.args.top = 0;
    _this.style = {
      '--left': 0,
      '--top': 0
    };
    return _this;
  }

  _createClass(Panel, [{
    key: "onAttached",
    value: function onAttached(event) {
      var _this2 = this;

      this.args.bindTo(['left', 'top'], function (v, k) {
        var panel = _this2.tags.panel;
        var body = document.body;
        var maxX = body.clientWidth - panel.clientWidth;
        var maxY = body.clientHeight - panel.clientHeight;

        if (k === 'left' && v > maxX) {
          v = maxX;
        }

        if (k === 'top' && v > maxY) {
          v = maxY;
        }

        if (v < 0) {
          v = 0;
        }

        _this2.tags.panel.style(_defineProperty({}, "--".concat(k), "".concat(v, "px")));
      });
    }
  }, {
    key: "startFollow",
    value: function startFollow() {
      var _this3 = this;

      this.stopMoving = this.listen(document, 'mousemove', function (event) {
        _this3.args.left += event.movementX;
        _this3.args.top += event.movementY;
      });
      this.listen(document, 'mouseup', function (event) {
        _this3.stopMoving();

        _this3.stopMoving = false;
      }, {
        once: true
      });
    }
  }, {
    key: "close",
    value: function close() {
      if (_typeof(this.args.widget) == 'object' && typeof this.args.widget.remove == 'function') {
        this.args.widget.remove();
      }

      this.remove();
    }
  }]);

  return Panel;
}(_View2.View);

exports.Panel = Panel;
});

;require.register("panel/panel.html", function(exports, require, module) {
module.exports = "<div data-module = \"panel\" data-panel-type = \"[[type]]\" cv-ref = \"panel\">\n\t<div class = \"titlebar\" cv-on = \"mousedown:startFollow(event)\" cv-if = \"title\">\n\t\t<span class = \"icon inline-icon\"></span>\n\t\t<span>[[title]]</span>\n\t\t<div class = \"right\">\n\t\t\t<div class = \"icon inline-icon x-icon\" cv-on = \"click:close(event)\"></div>\n\t\t</div>\n\t</div>\n\t<div class = \"widget\">[[widget]]</div>\n\t<div class = \"panels\" cv-each = \"panels:panel\">[[panel]]</div>\n</div>\n"
});

;require.register("processor/Deinterlace.js", function(exports, require, module) {
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Deinterlace = void 0;

var _View = require("curvature/base/View");

var _Panel = require("../panel/Panel");

var _Canvas = require("../canvas/Canvas");

var _BitArray = require("pokemon-parser/BitArray");

var _Processor2 = require("../Processor");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Deinterlace = /*#__PURE__*/function (_Processor) {
  _inherits(Deinterlace, _Processor);

  var _super = _createSuper(Deinterlace);

  function Deinterlace(args, parent) {
    var _this;

    _classCallCheck(this, Deinterlace);

    _this = _super.call(this, args, parent);

    _defineProperty(_assertThisInitialized(_this), "template", require('./deinterlace.html'));

    return _this;
  }

  _createClass(Deinterlace, [{
    key: "run",
    value: function run() {
      var rootPanel = this.args.panel;
      var offset = Number(this.args.offset);
      var length = Math.pow(56, 2);
      var input = new _BitArray.BitArray(this.args.input.args.buffer);
      var output = new Uint8Array(length);

      for (var i = 0; i < input.length / 2; i++) {
        var b1 = input.get(this.pixelToRowPixel(i));
        var b2 = input.get(this.pixelToRowPixel(i) + Math.pow(56, 2));
        var b = b1 << 1 | b2;
        var pallet = [255, 64, 128, 0];
        output[i] = pallet[b];
      }

      var title = 'Deinterlaced ' + this.args.inputName;
      var widget = new _Canvas.Canvas({
        buffer: output,
        panel: rootPanel,
        title: title,
        width: 56,
        height: 56,
        scale: 4,
        decoder: 'bytes'
      });
      widget.panel = rootPanel;
      rootPanel.args.panels.push(new _Panel.Panel({
        title: title,
        widget: widget
      }));
    }
  }, {
    key: "pixelToRowPixel",
    value: function pixelToRowPixel(pixel) {
      var width = 56;
      var pEven = pixel % 2 === 0;
      var xOff = Math.floor(pixel / width);
      var xEven = xOff % 2 == 0;
      var yOff = pixel % width;
      var result = xOff * 2 + yOff * width + (pEven ? 0 : -55); // console.log(pixel, xOff, yOff, result);

      return result;
    }
  }]);

  return Deinterlace;
}(_Processor2.Processor);

exports.Deinterlace = Deinterlace;
});

;require.register("processor/Invert.js", function(exports, require, module) {
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Invert = void 0;

var _View = require("curvature/base/View");

var _Panel = require("../panel/Panel");

var _Canvas = require("../canvas/Canvas");

var _Processor2 = require("../Processor");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Invert = /*#__PURE__*/function (_Processor) {
  _inherits(Invert, _Processor);

  var _super = _createSuper(Invert);

  function Invert(args, parent) {
    var _this;

    _classCallCheck(this, Invert);

    _this = _super.call(this, args, parent);

    _defineProperty(_assertThisInitialized(_this), "template", require('./invert.html'));

    return _this;
  }

  _createClass(Invert, [{
    key: "run",
    value: function run() {
      var rootPanel = this.args.panel;
      var offset = Number(this.args.offset);
      var length = Number(this.args.length);
      var input = this.args.input.args.buffer;
      var output = new Uint8Array(length);

      for (var i = 0; i < length; i++) {
        output[i] = input[i + offset] ^ 255;
      }

      var title = 'Inverted ' + this.args.inputName;
      var widget = new _Canvas.Canvas({
        buffer: output,
        panel: rootPanel,
        title: title
      });
      widget.panel = rootPanel;
      rootPanel.args.panels.push(new _Panel.Panel({
        title: title,
        widget: widget
      }));
    }
  }]);

  return Invert;
}(_Processor2.Processor);

exports.Invert = Invert;
});

;require.register("processor/RLE.js", function(exports, require, module) {
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RLE = void 0;

var _View = require("curvature/base/View");

var _Panel = require("../panel/Panel");

var _Canvas = require("../canvas/Canvas");

var _Processor2 = require("../Processor");

var _BitArray = require("pokemon-parser/BitArray");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// 1176 byte buffer
// 3 392 byte sub-buffers
var RLE = /*#__PURE__*/function (_Processor) {
  _inherits(RLE, _Processor);

  var _super = _createSuper(RLE);

  function RLE(args, parent) {
    var _this;

    _classCallCheck(this, RLE);

    _this = _super.call(this, args, parent);

    _defineProperty(_assertThisInitialized(_this), "template", require('./rle.html'));

    _defineProperty(_assertThisInitialized(_this), "table1", _toConsumableArray(Array(16)).map(function (_, i) {
      return (2 << i) - 1;
    }));

    var buffer = new Uint8Array(1176);
    _this.bufferA = new Uint8Array(buffer.buffer, 392 * 0, 392);
    _this.bufferB = new Uint8Array(buffer.buffer, 392 * 1, 392);
    _this.bufferC = new Uint8Array(buffer.buffer, 392 * 2, 392);
    _this.args.offset = 221830;
    _this.buffer = buffer;
    return _this;
  }

  _createClass(RLE, [{
    key: "run",
    value: function run() {
      var _this2 = this;

      var rootPanel = this.args.panel;
      var title = 'RLE+Delta Decoded ' + this.args.inputName;
      var widget = new _Canvas.Canvas({
        buffer: this.buffer,
        panel: rootPanel,
        title: title,
        width: 56,
        height: 168,
        scale: 4,
        decoder: 'gameboy-1bit',
        module: 'rle'
      });
      widget.panel = rootPanel;
      rootPanel.args.panels.push(new _Panel.Panel({
        title: title,
        widget: widget
      }));
      this.outputWidget = widget;
      var buffer = this.args.input.args.buffer.slice(this.args.offset);
      var bits = new _BitArray.BitArray(buffer);
      var xSize = bits.next(4) * 8;
      var ySize = bits.next(4);
      var size = xSize * ySize;
      var buffers = [new _BitArray.BitArray(this.bufferB), new _BitArray.BitArray(this.bufferC)];
      var order = bits.next();
      var bufB = buffers[order];
      var bufC = buffers[order ^ 1];
      widget.addEventListener('attached', function () {
        _this2.fillBuffer(bufB, bits, size).then(function () {
          _this2.outputWidget.drawDots();

          var mode = bits.next();

          if (mode === 1) {
            mode = 1 + bits.next();
          }

          console.log('MODE ' + mode);

          _this2.fillBuffer(bufC, bits, size).then(function () {
            if (mode === 0) {
              _this2.deltaFill(bufB).then(function () {
                return _this2.deltaFill(bufB);
              }).then(function () {
                _this2.copy(new _BitArray.BitArray(_this2.bufferB), new _BitArray.BitArray(_this2.bufferA));

                _this2.copy(new _BitArray.BitArray(_this2.bufferC), new _BitArray.BitArray(_this2.bufferB));

                _this2.empty(new _BitArray.BitArray(_this2.bufferC));

                _this2.outputWidget.drawDots();
              });
            } else if (mode === 1) {
              _this2.deltaFill(bufB).then(function () {
                _this2.xorFill(bufB, bufC);

                _this2.copy(new _BitArray.BitArray(_this2.bufferB), new _BitArray.BitArray(_this2.bufferA));

                _this2.copy(new _BitArray.BitArray(_this2.bufferC), new _BitArray.BitArray(_this2.bufferB));

                _this2.empty(new _BitArray.BitArray(_this2.bufferC));

                _this2.outputWidget.drawDots();
              });
            } else if (mode == 2) {
              _this2.deltaFill(bufB).then(function () {
                return _this2.deltaFill(bufC);
              }).then(function () {
                _this2.xorFill(bufB, bufC);

                _this2.outputWidget.drawDots();

                _this2.copy(new _BitArray.BitArray(_this2.bufferB), new _BitArray.BitArray(_this2.bufferA));

                _this2.copy(new _BitArray.BitArray(_this2.bufferC), new _BitArray.BitArray(_this2.bufferB));

                _this2.empty(new _BitArray.BitArray(_this2.bufferC));

                _this2.outputWidget.drawDots();
              });
            }
          });
        });
      }, {
        once: true
      });
    }
  }, {
    key: "fillBuffer",
    value: function fillBuffer(buffer, bits, size) {
      var _this3 = this;

      return new Promise(function (accept) {
        var bitSize = size * 8;
        var i = 0; // console.log('GET MODE');

        var mode = bits.next();

        var fill = function fill() {
          if (mode === 0) {
            i = _this3.rleFill(buffer, bits, i);
            mode = 1;
          } else if (mode === 1) {
            i = _this3.dataFill(buffer, bits, i);
            mode = 0;
          }

          if (i < bitSize) {
            if (i % (56 * 1) === 0) {
              setTimeout(function () {
                return fill();
              }, 100);

              _this3.outputWidget.drawDots();
            } else {
              fill();
            }
          } else {
            return accept();
          }
        };

        fill();
      });
    }
  }, {
    key: "rleFill",
    value: function rleFill(buffer, bits, i) {
      var ii = 0;
      var bit = '';
      var read = '';

      while (bit = bits.next()) {
        read += bit;
        ii++;
      }

      read += bit;
      var n = this.table1[ii];
      var a = bits.next(ii + 1);
      var m = n + a;

      for (var j = 0; j < m; j++) {
        buffer.set(i++, 0);
        buffer.set(i++, 0);
      } // console.log(
      // 	'repeat 00 %d times, %s, %s, %s, %s'
      // 	, m
      // 	, ii
      // 	, read
      // 	, n.toString(2).padStart(ii+1, '0')
      // 	, a.toString(2).padStart(ii+1, '0')
      // );


      return i;
    }
  }, {
    key: "dataFill",
    value: function dataFill(buffer, bits, i) {
      var fill = [];

      while (true) {
        var b1 = bits.next();
        var b2 = bits.next();

        if (b1 === 0 && b2 === 0) {
          break;
        }

        fill.push(b1, b2);
        buffer.set(i++, b1);
        buffer.set(i++, b2);
      } // console.log(fill.length, fill.join(','))


      return i;
    }
  }, {
    key: "deltaFill",
    value: function deltaFill(bits) {
      var _this4 = this;

      var i = 0,
          lastBit = 0;
      var max = bits.length;
      return new Promise(function (accept) {
        var fill = function fill() {
          if (i % 56 === 0) {
            lastBit = 0;
          }

          var pixel = _this4.pixelToRowPixel(i);

          var bit = bits.get(pixel);

          if (bit) {
            lastBit = 1 ^ lastBit;
          }

          bits.set(pixel, lastBit);
          i++;

          if (i < max) {
            if (i % (56 * 2) === 0) {
              setTimeout(function () {
                return fill();
              }, 50);

              _this4.outputWidget.drawDots();
            } else {
              fill();
            }
          } else {
            return accept();
          }
        };

        fill();
      });
    }
  }, {
    key: "tilePixelToPixel",
    value: function tilePixelToPixel(tilePixel) {
      var width = 56;
      var oddColumn = tilePixel % (width * 2) >= width;
      var column = Math.floor(tilePixel / (width * 2));
      var columnOffset = column * (width * 2);
      var inColumn = tilePixel - columnOffset;
      var pixel = columnOffset + (oddColumn ? (inColumn - width) * 2 + 1 : inColumn * 2);
      return pixel;
    }
  }, {
    key: "pixelToRowPixel",
    value: function pixelToRowPixel(pixel) {
      var width = 56;
      var pEven = pixel % 2 === 0;
      var xOff = Math.floor(pixel / width);
      var xEven = xOff % 2 == 0;
      var yOff = pixel % width;
      var result = xOff * 2 + yOff * width + (pEven ? 0 : -55); // console.log(pixel, xOff, yOff, result);

      return result;
    }
  }, {
    key: "copy",
    value: function copy(bitsA, bitsB) {
      for (var i = 0; i < bitsA.length; i++) {
        var bitA = bitsA.get(i);
        bitsB.set(i, bitA);
      }
    }
  }, {
    key: "untile",
    value: function untile() {}
  }, {
    key: "empty",
    value: function empty(bits) {
      for (var i = 0; i < bits.length; i++) {
        bits.set(i, 0);
      }
    }
  }, {
    key: "xorFill",
    value: function xorFill(bitsA, bitsB) {
      for (var i = 0; i < bitsA.length; i++) {
        var bitA = bitsA.get(i);
        var bitB = bitsB.get(i);
        bitsB.set(i, bitA ^ bitB);
      }
    }
  }]);

  return RLE;
}(_Processor2.Processor);

exports.RLE = RLE;
});

;require.register("processor/deinterlace.html", function(exports, require, module) {
module.exports = "<div data-module = \"canvas invert\">\n\t<div class = \"column\">\n\t\t<label><p>input buffer: [[inputName]]</p></label>\n\t\t<div class = \"row right\">\n\t\t\t<button cv-on = \"click:run(event)\">deinterlace</button>\n\t\t</div>\n\t</div>\n</div>\n"
});

;require.register("processor/invert.html", function(exports, require, module) {
module.exports = "<div data-module = \"canvas invert\">\n\t<div class = \"column\">\n\t\t<label><p>input buffer: [[inputName]]</p></label>\n\t\t<label class = \"column\">\n\t\t\t<p>offset</p>\n\t\t\t<input type = \"number\" cv-bind = \"offset\">\n\t\t</label>\n\t\t<label class = \"column\">\n\t\t\t<p>length</p>\n\t\t\t<input type = \"number\" cv-bind = \"length\">\n\t\t</label>\n\t\t<div class = \"row right\">\n\t\t\t<button cv-on = \"click:run(event)\">invert</button>\n\t\t</div>\n\t</div>\n</div>\n"
});

;require.register("processor/rle.html", function(exports, require, module) {
module.exports = "<div data-module = \"canvas invert\">\n\t<div class = \"column\">\n\n\t\t<label><p>input buffer: [[inputName]]</p></label>\n\n\t\t<label class = \"column\">\n\t\t\t<p>offset</p>\n\t\t\t<input cv-bind = \"offset\">\n\t\t</label>\n\n\t\t<div class = \"row right\">\n\t\t\t<button cv-on = \"click:run(event)\">decompress</button>\n\t\t</div>\n\n\t</div>\n</div>\n"
});

;require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');

"use strict";

/* jshint ignore:start */
(function () {
  var WebSocket = window.WebSocket || window.MozWebSocket;
  var br = window.brunch = window.brunch || {};
  var ar = br['auto-reload'] = br['auto-reload'] || {};
  if (!WebSocket || ar.disabled) return;
  if (window._ar) return;
  window._ar = true;

  var cacheBuster = function cacheBuster(url) {
    var date = Math.round(Date.now() / 1000).toString();
    url = url.replace(/(\&|\\?)cacheBuster=\d*/, '');
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'cacheBuster=' + date;
  };

  var browser = navigator.userAgent.toLowerCase();
  var forceRepaint = ar.forceRepaint || browser.indexOf('chrome') > -1;
  var reloaders = {
    page: function page() {
      window.location.reload(true);
    },
    stylesheet: function stylesheet() {
      [].slice.call(document.querySelectorAll('link[rel=stylesheet]')).filter(function (link) {
        var val = link.getAttribute('data-autoreload');
        return link.href && val != 'false';
      }).forEach(function (link) {
        link.href = cacheBuster(link.href);
      }); // Hack to force page repaint after 25ms.

      if (forceRepaint) setTimeout(function () {
        document.body.offsetHeight;
      }, 25);
    },
    javascript: function javascript() {
      var scripts = [].slice.call(document.querySelectorAll('script'));
      var textScripts = scripts.map(function (script) {
        return script.text;
      }).filter(function (text) {
        return text.length > 0;
      });
      var srcScripts = scripts.filter(function (script) {
        return script.src;
      });
      var loaded = 0;
      var all = srcScripts.length;

      var onLoad = function onLoad() {
        loaded = loaded + 1;

        if (loaded === all) {
          textScripts.forEach(function (script) {
            eval(script);
          });
        }
      };

      srcScripts.forEach(function (script) {
        var src = script.src;
        script.remove();
        var newScript = document.createElement('script');
        newScript.src = cacheBuster(src);
        newScript.async = true;
        newScript.onload = onLoad;
        document.head.appendChild(newScript);
      });
    }
  };
  var port = ar.port || 9485;
  var host = br.server || window.location.hostname || 'localhost';

  var connect = function connect() {
    var connection = new WebSocket('ws://' + host + ':' + port);

    connection.onmessage = function (event) {
      if (ar.disabled) return;
      var message = event.data;
      var reloader = reloaders[message] || reloaders.page;
      reloader();
    };

    connection.onerror = function () {
      if (connection.readyState) connection.close();
    };

    connection.onclose = function () {
      window.setTimeout(connect, 1000);
    };
  };

  connect();
})();
/* jshint ignore:end */
;
//# sourceMappingURL=app.js.map