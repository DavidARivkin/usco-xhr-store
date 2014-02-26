'use strict'

path = require "path"
fs   = require "fs"
nock = require "nock"

xhrStore = require "../src/xhr-store"

Minilog=require("minilog")
Minilog
  .suggest
    .clear()
    .deny('xhr-store', 'debug')

mockData = path.resolve("./specs/data/femur.stl")


describe "xhr store tests", ->
  store = null
  
  beforeEach ->
    store = new xhrStore()
    nock.disableNetConnect()
    nock("http://raw.github.com")
    .log(console.log)
    .get('/kaosat-dev/repBug/master/cad/stl/femur.stl')
    .reply(200,fs.readFileSync(mockData))
    
  afterEach ->
    nock.restore()
    nock.cleanAll()
  
  it 'can read data from "files" ',(done)->
    uri = "http://raw.github.com/kaosat-dev/repBug/master/cad/stl/femur.stl"
    store.read( uri ).promise
    .then ( data ) =>
      expect(data).not.toEqual(null)
      done()
    .fail ( error ) =>
      console.log "error", error
      done()
  , 2000

  it 'can read data in different formats ',(done)->
    uri = "http://raw.github.com/kaosat-dev/repBug/master/cad/stl/femur.stl"
    store.read( uri, null, "arrayBuffer" ).promise
    .then ( data ) =>
      expect(data).not.toEqual(null)
      done()
    .fail ( error ) =>
      console.log "error", error
  , 2000

  it 'can get file size',(done)->
    nock.cleanAll()
    nock("http://raw.github.com")
    .log(console.log)
    .get('/kaosat-dev/repBug/master/cad/stl/femur.stl')
    .reply(200,fs.readFileSync(mockData),{'Content-Length': 238281})
  
    uri = "http://raw.github.com/kaosat-dev/repBug/master/cad/stl/femur.stl"
    store.stats( uri ).promise
    .then ( data ) =>
      console.log( "data", data)
      expect(data).toEqual(238281)
      done()
    .fail ( error ) =>
      console.log "error", error
  , 2000

  it 'should fail to fetch data gracefully',(done)->
    uri = "https://foo.bar.ohmy.com/kaosat-dev/repBug/master/foo/bar.stl"
    store.read( uri ).promise
    .fail ( error ) =>
      expect(error).toBe("Unknown error")
      done()
  , 2000

  it 'allows setting timeout',(done)->
    nock("http://raw.github.com")
    .log(console.log)
    .get('/kaosat-dev/repBug/master/cad/stl/femur.stl')
    .delay(10)
    .reply(200,fs.readFileSync(mockData))
  
    uri = "https://foo.bar.ohmy.com/kaosat-dev/repBug/master/foo/bar.stl"
    store.timeout = 2
    store.read( uri ).promise
    .fail ( error ) =>
      expect(error).toBe("Timed out while fetching data from uri")
      done()
  , 2000
  
  it 'allows cancelling reads ',(done)->
    nock.cleanAll()
    nock("http://raw.github.com")
    .log(console.log)
    .get('/kaosat-dev/repBug/master/cad/stl/femur.stl')
    .delay(1000)
    .reply(200,fs.readFileSync(mockData))
  
    uri = "http://raw.github.com/kaosat-dev/repBug/master/cad/stl/femur.stl"
    deferred = store.read( uri )
    deferred.reject( new Error("cancelled") )
    deferred.promise
    .then ( data ) =>
      done()
    .fail ( error ) =>
      expect( error.message ).toEqual( "cancelled" )
      done()
  , 2000
