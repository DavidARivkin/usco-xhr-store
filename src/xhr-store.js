import Q from 'q'
import logger from 'log-minim'

let log = logger("xhr-store");
log.setLevel("warn");


class XHRStore{
  constructor(options) {
    var defaults;
    options = options || {};
    defaults = {
      enabled: (typeof process !== "undefined" && process !== null ? true : false),
      name: "XHR",
      description: "",
      rootUri: typeof process !== "undefined" && process !== null ? process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE : null,
      isDataDumpAllowed: false,
      showPaths: true
    };
    this.timeout = 30000;
  }

  login() {}

  logout() {}

  /*-------------------file/folder manipulation methods---------------- */

  /**
  * list all elements inside the given uri (non recursive)
  * @param {String} uri the folder whose content we want to list
  * @return {Object} a promise, that gets resolved with the content of the uri
   */
  list(uri) {
    var deferred;
    deferred = Q.defer();
    return deferred;
  }

  /**
  * read the file at the given uri, return its content
  * @param {String} uri absolute uri of the file whose content we want
  * @param {String} encoding the encoding used to read the file
  * @return {Object} a promise, that gets resolved with the content of file at the given uri
   */
  read(uri, encoding, responseType) {
    console.log("reading data from xhr")
    let encoding = encoding || 'utf8';
    let mimeType = 'text/plain; charset=x-user-defined';
    log.debug("reading from " + uri);
    return this._request(uri, "GET", mimeType, responseType);
  }

  exists( uri, options){

    let deferred = self._request(uri, "GET", null, null, null);
    return deferred.promise.then(function(){
      return true
    },
    function(){
      return
    });
  }

  write( uri, data, options={} ){
    //first do a read, to check if we need a POST or a PATCH
    let readDef = this.read(uri);
    let mimeType = undefined;//"application/json;charset=UTF-8";
    let self = this;
    let data = data;

    if(options.formatter)
    {
      data = options.formatter(data);
    }

    function onSucess(){
      //console.log("onSucess")
      return self._request(uri, "PATCH", mimeType, null, data);
    }

    function onFail(){
      //console.log("onFail");
      //POST at one level above, like standard REST call
      let upUri = uri.split("/");
      upUri.pop()
      upUri = upUri.join("/");

      let postDeferred = self._request(upUri, "POST", mimeType, null, data);

      /*postDeferred.then(
        function(){console.log("yeah uploaded")},
        function(error){console(error)},
        function(progress){console.log("yeah progress",progress)}
      );*/
      return postDeferred;
    }

    //console.log("readDef",readDef)

    return readDef.promise.then(
      onSucess,
      onFail
    );
  }


  /**
  * get the size of the file at the given uri
  * @param {String} uri absolute uri of the file whose size we want
  * @return {Object} a promise, that gets resolved with the content of file at the given uri
   */
  stats(uri) {
    var deferred, error, request;
    log.debug("getting file size from " + uri);
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
  }


  /*-------------------Helpers---------------- */

  _request(uri, type, mimeType, responseType=null, data=null) {
    let type = type || "GET";
    let mimeType = mimeType || null;
    let encoding = encoding || 'utf8';

    log.debug("sending xhr2 request: " + type + " " + mimeType + " " + encoding + " " + responseType);
    
    let deferred = Q.defer();
    let request;

    try {
      request = new XMLHttpRequest();
    } catch ( error ) {
      deferred.reject("Failed to create xmlhttp request");
    }

    Q["catch"](deferred.promise, function() {
      return request.abort();
    });

    function onLoad(event) {
      if (event != null) {
        let result = event.target.response || event.target.responseText;
        return deferred.resolve(result);
      }
      else {
        throw new Error("no event data");
      }
    };

    function onProgress(event) {
      var percentComplete;
      if(request.status === 404)
      { 
        return onError(event);
      }
      if (event.lengthComputable) {
        percentComplete = (event.loaded / event.total) * 100;
        log.debug("fetching percent", percentComplete);
        return deferred.notify({
          "fetching": percentComplete,
          "total": event.total
        });
      }
    };

    function onError(event) {
      log.error("error", event);
      let error = "";
      switch (request.status) {
        case 404:
          error = "Uri not found";
          break;
        default:
          error = "Unknown error";
        break
      }
      return deferred.reject(error);
    };

    function onTimeOut(event) {
      log.error("timeout", event);
      return deferred.reject("Timed out while fetching data from uri");
    };


    try {
      request.open(type, uri, true);
      if ((mimeType != null) && (request.overrideMimeType != null)) {
        log.debug("support for setting mimetype");
        request.overrideMimeType(mimeType);
      }
      request.timeout = this.timeout;
      request.responseType = responseType;
      request.addEventListener('load', onLoad, false);
      request.addEventListener('loadend', onLoad, false);
      request.addEventListener('progress', onProgress, false);
      request.addEventListener('error', onError, false);
      request.addEventListener('timeout', onTimeOut, false);
      request.send(data);
    } catch ( error ) {
      deferred.reject(error);
    }
    return deferred;
  }
}

export default XHRStore
