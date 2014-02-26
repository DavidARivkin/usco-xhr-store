require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],"LD/yJy":[function(require,module,exports){
(function (process){
var Minilog, Q, XHRStore, XMLHttpRequest, detectEnv, logger,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

detectEnv = require("composite-detect");

Q = require("q");

if (detectEnv.isModule) {
  Minilog = require("minilog");
  Minilog.pipe(Minilog.suggest).pipe(Minilog.backends.console.formatClean).pipe(Minilog.backends.console);
  logger = Minilog('xhr-store');
}

if (detectEnv.isNode) {
  XMLHttpRequest = require("xhr2").XMLHttpRequest;
  Minilog.pipe(Minilog.suggest).pipe(Minilog.backends.console.formatColor).pipe(Minilog.backends.console);
}

if (detectEnv.isBrowser) {
  XMLHttpRequest = window.XMLHttpRequest;
  Minilog.pipe(Minilog.suggest).pipe(Minilog.backends.console.formatClean).pipe(Minilog.backends.console);
  logger = Minilog('xhr-store');
}

XHRStore = (function() {
  function XHRStore(options) {
    this._request = __bind(this._request, this);
    this.stats = __bind(this.stats, this);
    this.read = __bind(this.read, this);
    this.list = __bind(this.list, this);
    this.logout = __bind(this.logout, this);
    this.login = __bind(this.login, this);
    var defaults;
    options = options || {};
    defaults = {
      enabled: (typeof process !== "undefined" && process !== null ? true : false),
      name: "XHR",
      type: "",
      description: "",
      rootUri: typeof process !== "undefined" && process !== null ? process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE : null,
      isDataDumpAllowed: false,
      showPaths: true
    };
    this.timeout = 3000;
  }

  XHRStore.prototype.login = function() {};

  XHRStore.prototype.logout = function() {};


  /*-------------------file/folder manipulation methods---------------- */


  /**
  * list all elements inside the given uri (non recursive)
  * @param {String} uri the folder whose content we want to list
  * @return {Object} a promise, that gets resolved with the content of the uri
   */

  XHRStore.prototype.list = function(uri) {
    var deferred;
    deferred = Q.defer();
    return deferred;
  };


  /**
  * read the file at the given uri, return its content
  * @param {String} uri absolute uri of the file whose content we want
  * @param {String} encoding the encoding used to read the file
  * @return {Object} a promise, that gets resolved with the content of file at the given uri
   */

  XHRStore.prototype.read = function(uri, encoding, responseType) {
    var mimeType;
    encoding = encoding || 'utf8';
    mimeType = 'text/plain; charset=x-user-defined';
    logger.debug("reading from " + uri);
    return this._request(uri, "GET", mimeType, responseType);
  };


  /**
  * get the size of the file at the given uri
  * @param {String} uri absolute uri of the file whose size we want
  * @return {Object} a promise, that gets resolved with the content of file at the given uri
  é
   */

  XHRStore.prototype.stats = function(uri) {
    var deferred, error, request;
    logger.debug("getting file size from " + uri);
    deferred = Q.defer();
    try {
      request = new XMLHttpRequest();
      Q["catch"](deferred.promise, function() {
        return request.abort();
      });
      request.open("HEAD", uri, true);
      request.onreadystatechange = function() {
        if (request.readyState === request.DONE) {
          return deferred.resolve(parseInt(request.getResponseHeader("Content-Length")));
        }
      };
      request.send();
    } catch (_error) {
      error = _error;
      deferred.reject(error);
    }
    return deferred;
  };


  /*-------------------Helpers---------------- */

  XHRStore.prototype._request = function(uri, type, mimeType, responseType) {
    var deferred, encoding, error, onError, onLoad, onProgress, onTimeOut, request;
    type = type || "GET";
    mimeType = mimeType || null;
    encoding = encoding || 'utf8';
    responseType = responseType || null;
    logger.debug("sending xhr2 request: " + type + " " + mimeType + " " + encoding + " " + responseType);
    deferred = Q.defer();
    try {
      request = new XMLHttpRequest();
    } catch (_error) {
      error = _error;
      deferred.reject("Failed to create xmlhttp request");
    }
    Q["catch"](deferred.promise, function() {
      return request.abort();
    });
    onLoad = (function(_this) {
      return function(event) {
        var result;
        if (event != null) {
          result = event.target.response || event.target.responseText;
          return deferred.resolve(result);
        } else {
          throw new Error("no event data");
        }
      };
    })(this);
    onProgress = (function(_this) {
      return function(event) {
        var percentComplete;
        if (event.lengthComputable) {
          percentComplete = (event.loaded / event.total) * 100;
          logger.debug("percent", percentComplete);
          return deferred.notify({
            "download": percentComplete,
            "total": event.total
          });
        }
      };
    })(this);
    onError = (function(_this) {
      return function(event) {
        logger.error("error", event);
        error = "";
        switch (request.status) {
          case 404:
            error = "Uri not found";
            break;
          default:
            error = "Unknown error";
        }
        return deferred.reject(error);
      };
    })(this);
    onTimeOut = (function(_this) {
      return function(event) {
        logger.error("timeout", event);
        return deferred.reject("Timed out while fetching data from uri");
      };
    })(this);
    try {
      request.open(type, uri, true);
      if ((mimeType != null) && (request.overrideMimeType != null)) {
        logger.debug("support for setting mimetype");
        request.overrideMimeType(mimeType);
      }
      request.timeout = this.timeout;
      request.responseType = responseType;
      request.addEventListener('load', onLoad, false);
      request.addEventListener('loadend', onLoad, false);
      request.addEventListener('progress', onProgress, false);
      request.addEventListener('error', onError, false);
      request.addEventListener('timeout', onTimeOut, false);
      request.send();
    } catch (_error) {
      error = _error;
      deferred.reject(error);
    }
    return deferred;
  };

  return XHRStore;

})();

if (detectEnv.isModule) {
  module.exports = XHRStore;
}


}).call(this,require("/home/mmoissette/dev/projects/coffeescad/stores/usco-xhr-store/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/home/mmoissette/dev/projects/coffeescad/stores/usco-xhr-store/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":1,"composite-detect":false,"minilog":false,"q":false,"xhr2":false}],"xhr-store":[function(require,module,exports){
module.exports=require('LD/yJy');
},{}]},{},["LD/yJy"])