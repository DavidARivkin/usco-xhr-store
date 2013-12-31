'use strict'
xhrStore = require "../src/xhrStore"
Minilog=require("minilog")
Minilog
  .suggest
    .clear()
    .deny('xhr-store', 'debug')
          
describe "xhr store tests", ->
  store = null
  
  beforeEach ->
    store = new xhrStore()
  
  it 'can read data from "files" ',(done)->
    uri = "http://raw.github.com/kaosat-dev/repBug/master/cad/stl/femur.stl"
    store.read( uri )
    .then ( data ) =>
      expect(data).not.toEqual(null)
      done()
    .fail ( error ) =>
      console.log "error", error
  , 2000


  it 'can read data in different formats ',(done)->
    uri = "http://raw.github.com/kaosat-dev/repBug/master/cad/stl/femur.stl"
    store.read( uri, null, "arrayBuffer" )
    .then ( data ) =>
      console.log "bla", typeof data
      expect(data).not.toEqual(null)
      done()
    .fail ( error ) =>
      console.log "error", error
  , 2000

  it 'can get file size',(done)->
    uri = "http://raw.github.com/kaosat-dev/repBug/master/cad/stl/femur.stl"
    store.stats( uri )
    .then ( data ) =>
      expect(data).toEqual(238281)
      done()
    .fail ( error ) =>
      console.log "error", error
  , 2000

  it 'should fail to fetch data gracefully',(done)->
    uri = "https://foo.bar.ohmy.com/kaosat-dev/repBug/master/foo/bar.stl"
    store.read( uri )
    .fail ( error ) =>
      expect(error).toBe("Unknown error")
      done()
  , 2000

  it 'allows setting timeout',(done)->
    uri = "https://foo.bar.ohmy.com/kaosat-dev/repBug/master/foo/bar.stl"
    store.timeout = 2
    store.read( uri )
    .fail ( error ) =>
      expect(error).toBe("Timed out while fetching data from uri")
      done()
  , 2000
