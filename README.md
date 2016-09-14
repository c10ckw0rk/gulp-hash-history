# gulp-version [![NPM version][npm-image]][npm-url]
Accepts a file and adds it to manifest, works as an accompanyment to `gulp-hash`

`npm install --save-dev gulp-version`

## Basic usage

```javascript
var version = require('gulp-version');

gulp.src('./js/**/*.js')
  .pipe(hash())
  .pipe(gulp.dest(dest)),
  .pipe(version({
    name: 'js.js',
    dest: './static',
    oldVersion: './static/js.js',
    prefix: 'window.mlui = window.mlui || {}; mlui.js ='
  }))
  .pipe(gulp.dest('./static'));

```