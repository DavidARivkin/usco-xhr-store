'use strict'
xhrStore = require "../src/xhrStore"
          
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
  , 400

  it 'can get file size',(done)->
    uri = "http://raw.github.com/kaosat-dev/repBug/master/cad/stl/femur.stl"
    store.stats( uri )
    .then ( data ) =>
      expect(data).toEqual(238281)
      done()
    .fail ( error ) =>
      console.log "error", error
  , 400
