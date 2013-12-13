'use strict'
Q = require "q"
path = require "path"

isNode = typeof global != "undefined" and {}.toString.call(global) == '[object global]'

if(isNode)
  XMLHttpRequest = require("xhr2").XMLHttpRequest
  logger = require('minilog')('xhr-store')
  require('minilog').enable()
else
  XMLHttpRequest = window.XMLHttpRequest
  logger = Minilog('xhr-store')
  Minilog.enable();


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
    return deferred.promise
  
  ###*
  * read the file at the given uri, return its content
  * @param {String} uri absolute uri of the file whose content we want
  * @param {String} encoding the encoding used to read the file
  * @return {Object} a promise, that gets resolved with the content of file at the given uri
  ###
  read:( uri , encoding )=>
    encoding = encoding or 'utf8'
    mimeType = 'text/plain; charset=x-user-defined'
    logger.debug "reading from #{uri}"
    return @_request(uri,"GET",mimeType)
 
  ###*
  * get the size of the file at the given uri
  * @param {String} uri absolute uri of the file whose size we want
  * @return {Object} a promise, that gets resolved with the content of file at the given uri
  ###
  stats:( uri )=>
    logger.debug "getting file size from #{uri}"
    deferred = Q.defer()

    request = new XMLHttpRequest()
    request.open("HEAD", uri, true)#HEAD, not get

    #size is in bytes
    request.onreadystatechange = () ->
      if (request.readyState == request.DONE)
        deferred.resolve parseInt(request.getResponseHeader("Content-Length"))

    request.send()
    return deferred.promise


  ###-------------------Helpers----------------###

  #ajax request wrapper
  #type: GET, POST, etc
  _request:(uri, type, mimeType)=>
    type = type or "GET"
    mimeType = mimeType or null
    encoding = encoding or 'utf8'
    logger.debug("sending xhr2 request: #{type} #{mimeType} #{encoding}")

    deferred = Q.defer()

    request = new XMLHttpRequest()

    request.open( type, uri, true )
    if mimeType? and request.overrideMimeType?
      logger.debug("support for setting mimetype")
      request.overrideMimeType( mimeType ) 
    
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
      deferred.reject(event)
    
    request.addEventListener 'load', onLoad, false
    request.addEventListener 'loadend', onLoad, false
    request.addEventListener 'progress', onProgress, false
    request.addEventListener 'error', onError, false
    
    request.send()
    return deferred.promise
    
module.exports = XHRStore
