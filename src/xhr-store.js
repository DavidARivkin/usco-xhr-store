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
    encoding = encoding || 'utf8';
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
    //TODO: add cancellation based on deferred.reject
    let deferred = Q.defer()
    //first do a read, to check if we need a POST or a PATCH
    let readDef = this.read(uri)
    let mimeType = undefined//"application/json;charset=UTF-8";
    let self = this
    let srcData = data

    let forceWrite = options.forceWrite || false

    if(options.formatter)
    {
      data = options.formatter(data);
    }

    function onSucceed(value){
      //console.log("ONvalue",value)
      deferred.resolve(value)
    }

    function onError(error){
      //console.log("ONerror",error)
      deferred.reject(error)
    }
    function onProgress(progress){
      deferred.notify(progress)
    }

    function update(){
      //console.log("onSucess for ", uri)
      let postDeferred = self._request(uri, "PATCH", mimeType, null, data)
      postDeferred.promise.then(
        onSucceed,
        onError,
        onProgress
      )
    }

    function create(){
      //console.log("onFail for", uri);
      //POST at one level above, like standard REST call
      if(!forceWrite){
        let upUri = uri.split("/")
        upUri.pop()
        uri = upUri.join("/")
      }

      //console.log("sending data",srcData)
     
      let postDeferred = self._request(uri, "POST", mimeType, null, data)

      postDeferred.promise.then(
        onSucceed,
        onError,
        onProgress
      )
      //return postDeferred;

    }

    //console.log("readDef",readDef)
    if(forceWrite){
      readDef.promise.then(
        create,
        create
      )
    }else{
      readDef.promise.then(
        update,
        create
      )
    }
   
    return deferred
  }


  remove(uri, options={} ){
    //TODO: add cancellation based on deferred.reject
    let deferred = Q.defer()
    //first do a read, to check if we need a POST or a PATCH
    let readDef = this.read(uri)
    let self = this

    function onSucceed(value){
      console.log("onSucceed",value)
      deferred.resolve(value)
    }

    function onError(error){
      console.log("ONerror",error)
      deferred.reject(error)
    }
    function onProgress(progress){
      deferred.notify(progress)
    }

    function remove(){
      let postDeferred = self._request(uri, "DELETE", undefined, null, null)
      return postDeferred.promise.then(
        onSucceed,
        onError,
        onProgress
      )

    }

    readDef.promise.then(
      remove,
      remove
    )

    return deferred
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
    //log.setLevel("warn");

    type = type || "GET"
    mimeType = mimeType || null
    let encoding = encoding || 'utf8'

    log.debug("sending xhr2 request: "+uri +" " + type + " " + mimeType + " " + encoding + " " + responseType)
    
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
        let strErrorCode = ""+request.status
        if(strErrorCode.length ===3 && ( strErrorCode.charAt(0) === "4" || strErrorCode.charAt(0) === "5") )
        {
          onError(event)
          
        }else{
          let result = event.target.response || event.target.responseText;
          return deferred.resolve(result);
        }
       
      }
      else {
        return deferred.reject("no event data");
      }
    };

    function onProgress(event) {
      var percentComplete;
      /*if(request.status === 404)
      { 
        return onError(event);
      }*/
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
      log.info("error", event);
      let error = "error in request";
      return deferred.reject(error);
    };

    function onTimeOut(event) {
      log.error("timeout", event);
      return deferred.reject("Timed out while fetching data from uri");
    };

    function onLoadEnd(event){
      //console.log("onLoadEnd",event, request.status, uri)
      /*let strErrorCode = ""+request.status
      if(strErrorCode.length ===3)
      {
        if( strErrorCode.charAt(0) === "4" || strErrorCode.charAt(0) === "5"){
        onError(event)
        }
      }*/

      if (event != null) {
        let strErrorCode = ""+request.status
        if(strErrorCode.length ===3 && ( strErrorCode.charAt(0) === "4" || strErrorCode.charAt(0) === "5") )
        {
          onError(event)
          
        }else{
          let result = event.target.response || event.target.responseText;
          return deferred.resolve(result);
        }
       
      }
      else {
        return deferred.reject("no event data");
      }

    }

    try {
      request.open(type, uri, true);
      if ((mimeType != null) && (request.overrideMimeType != null)) {
        log.debug("setting mimetype supported")
        request.overrideMimeType(mimeType);
      }
      request.timeout = this.timeout;
      request.responseType = responseType;
      //request.addEventListener('load', onLoad, false)
      request.addEventListener('progress', onProgress, false)

      request.addEventListener('loadend', onLoadEnd, false)
      
      //request.addEventListener('abort', onAbort, false)
      //request.addEventListener('error', onError, false)
      request.addEventListener('timeout', onTimeOut, false)

      request.send(data);
    } catch ( error ) {
      deferred.reject(error);
    }
    return deferred;
  }
}

export default XHRStore
