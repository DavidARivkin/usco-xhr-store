module.exports = (grunt) ->
  
  grunt.initConfig
    pkg: grunt.file.readJSON("package.json")
    currentBuild: null
    browserify:
      basic:
        src: ["./src/xhr-store.coffee"]
        dest: "lib/xhr-store.js"
        options:
          transform: ["coffeeify"]
          external: ["composite-detect","q","xhr2","minilog"]
          alias: ["./src/xhr-store.coffee:xhr-store"]
          

  grunt.loadNpmTasks "grunt-browserify"
  
  # Task(s).
  grunt.registerTask "build-browser-lib", ["browserify"]
