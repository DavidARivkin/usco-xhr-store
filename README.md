xhr "store" for usco project

General information
-------------------
This repository contains both the:
- node.js version:
xhr-store.coffee in the src folder
- polymer.js/browser version which is a combo of
lib/xhr-store.js (browserified version of the above)
xhr-store.html


How to generate browser/polymer.js version (with require support):
------------------------------------------------------------------
Type: 

    browserify -x path -x q -x composite-detect -x minilog  -r ./src/xhr-store.coffee:xhr-store -t coffeeify --extension '.coffee' > lib/xhr-store.js


then replace (manually for now) all entries like this one in the generated file:

  "composite-detect":"awZPbp", etc 

with the correct module names, ie:

   "composite-detect":"composite-detect"

TODO: 
 - handle dependencies correctly : asset-manager should be kernel, and with a correct version number
