# gulp-hash-history

`npm install gulp-hash-history`

## Basic usage

```javascript
var hashHistory = require('gulp-hash-history');

gulp.src('./js/**/*.js')
  .pipe(hashHistory.hash()) // add hash
  .pipe(gulp.dest(dest)),
  .pipe(hashHistory.history({
    src: 'fixtures/history.json', // read and save file to this location
    key: 'legacy.js' // js object prefix
  }))
  .pipe(gulp.dest('./static'));

```