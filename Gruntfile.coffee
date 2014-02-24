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
          
    bump:
      options:
        files: ['package.json','bower.json']
        updateConfigs: ['package.json','bower.json']
        commit: true
        commitMessage: 'Release of v%VERSION%'
        commitFiles: ['package.json','bower.json'] # '-a' for all files
        createTag: true
        tagName: '%VERSION%'
        tagMessage: 'Version %VERSION%'
        push: false
        pushTo: 'upstream'
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' #options to use with '$ git describe'

  grunt.loadNpmTasks "grunt-browserify"
  grunt.loadNpmTasks "grunt-bump"
  
  # Task(s).
  grunt.registerTask "build-browser-lib", ["browserify"]
