detectEnv = require "composite-detect"
Q = require "q"


if detectEnv.isModule
  Minilog=require("minilog")
  Minilog.pipe(Minilog.suggest).pipe(Minilog.backends.console.formatClean).pipe(Minilog.backends.console)
  logger = Minilog('xhr-store')

if detectEnv.isNode
  XMLHttpRequest = require("xhr2").XMLHttpRequest
  Minilog.pipe(Minilog.suggest).pipe(Minilog.backends.console.formatColor).pipe(Minilog.backends.console)

if detectEnv.isBrowser
  XMLHttpRequest = window.XMLHttpRequest
  Minilog.pipe(Minilog.suggest).pipe(Minilog.backends.console.formatClean).pipe(Minilog.backends.console)
  logger = Minilog('xhr-store')


class XHRStore
  constructor:(options)->
    options = options or {}
    defaults =
      enabled: (if process? then true else false)
      name:"XHR"
      type:"",
      description: ""
      rootUri:if process? then process.env.HOME or process.env.HOMEPATH or process.env.USERPROFILE else null
      isDataDumpAllowed: false
      showPaths:true
    @timeout = 3000
    #options = merge defaults, options
    #super options
  
  login:=>
  logout:=>

  ###-------------------file/folder manipulation methods----------------###
  
  ###*
  * list all elements inside the given uri (non recursive)
  * @param {String} uri the folder whose content we want to list
  * @return {Object} a promise, that gets resolved with the content of the uri
  ###
  list:( uri )=>
    deferred = Q.defer()
    return deferred
  
  ###*
  * read the file at the given uri, return its content
  * @param {String} uri absolute uri of the file whose content we want
  * @param {String} encoding the encoding used to read the file
  * @return {Object} a promise, that gets resolved with the content of file at the given uri
  ###
  read:( uri, encoding, responseType)=>
    encoding = encoding or 'utf8'
    mimeType = 'text/plain; charset=x-user-defined'
    logger.debug "reading from #{uri}"
    return @_request(uri,"GET",mimeType, responseType)
 
  ###*
  * get the size of the file at the given uri
  * @param {String} uri absolute uri of the file whose size we want
  * @return {Object} a promise, that gets resolved with the content of file at the given uri
  é###
  stats:( uri )=>
    logger.debug "getting file size from #{uri}"
    deferred = Q.defer()

    try
      request = new XMLHttpRequest()
      #handle cancellation  
      Q.catch deferred.promise, ()->
        request.abort()
      
      request.open("HEAD", uri, true)#HEAD, not get

      #size is in bytes
      request.onreadystatechange = () ->
        if (request.readyState == request.DONE)
          deferred.resolve parseInt(request.getResponseHeader("Content-Length"))
      request.send()
    catch error
      deferred.reject error
      
    return deferred


  ###-------------------Helpers----------------###

  #ajax request wrapper
  #type: GET, POST, etc
  _request:(uri, type, mimeType, responseType)=>
    type = type or "GET"
    mimeType = mimeType or null
    encoding = encoding or 'utf8'
    responseType = responseType or null
    logger.debug("sending xhr2 request: #{type} #{mimeType} #{encoding} #{responseType}")

    deferred = Q.defer()
    try
      request = new XMLHttpRequest() 
    catch error
      deferred.reject("Failed to create xmlhttp request")
    
    #handle cancellation  
    Q.catch deferred.promise, ()->
      request.abort()
   
    onLoad= ( event )=>
      if event?
        result = event.target.response or event.target.responseText
        #serializer = new XMLSerializer() #FIXME: needed ???
        #result = serializer.serializeToString(result)
        deferred.resolve( result )
      else 
        throw new Error("no event data")
    
    onProgress= ( event )=>
      if (event.lengthComputable)
        percentComplete = (event.loaded/event.total)*100
        logger.debug "percent", percentComplete
        deferred.notify( {"download":percentComplete,"total":event.total} )
    
    onError= ( event )=>
      logger.error "error",event
      error = ""
      switch( request.status )
        when 404 then error = "Uri not found"
        else error = "Unknown error"

      deferred.reject(error)

    onTimeOut= ( event )=>
      logger.error "timeout",event
      deferred.reject("Timed out while fetching data from uri")

    try
      request.open( type, uri, true )
      if mimeType? and request.overrideMimeType?
        logger.debug("support for setting mimetype")
        request.overrideMimeType( mimeType ) 
      request.timeout = @timeout
      request.responseType = responseType
      request.addEventListener 'load', onLoad, false
      request.addEventListener 'loadend', onLoad, false
      request.addEventListener 'progress', onProgress, false
      request.addEventListener 'error', onError, false
      request.addEventListener 'timeout', onTimeOut, false
      request.send()
    catch error
      deferred.reject(error)
      
    return deferred

if detectEnv.isModule
  module.exports = XHRStore
