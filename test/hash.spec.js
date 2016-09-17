/* eslint import/no-extraneous-dependencies: ["error", {"optionalDependencies": false}] */
/* global describe, it, before, after */
const array = require('stream-array');
const File = require('gulp-util').File;
const gulp = require('gulp');
const assert = require('stream-assert');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
require('should');
require('mocha');

const file = (...files) => {

  files = files.map(stream => {

    return new File({
      cwd: process.cwd(),
      base: process.cwd(),
      path: process.cwd() + '/' + (stream).toString() + '.js',
      contents: new Buffer(stream)
    });

  });

  return array(files);

};

describe('gulp-version.hash', () => {

  //We'll delete it when we're done.
  before(done => {
    fs.mkdir('./output', done);
  });

  //We'll delete it when we're done.
  after(done => {
    rimraf('output', done);
  });

  it('it should read from stream and add a hash', done => {

    file('first')
        .pipe(version.hash())
        .pipe(assert.first((d) => {
          path.basename(d.path.toString()).should.eql('first.e0996a37.js');
        }))
        .pipe(assert.end(done));

  });

  it('it should read multiple from stream and add a hash', done => {

    file('first', 'second')
        .pipe(version.hash())
        .pipe(assert.first((d) => {
          path.basename(d.path.toString()).should.eql('first.e0996a37.js');
        }))
        .pipe(assert.second((d) => {
          path.basename(d.path.toString()).should.eql('second.352f7829.js');
        }))
        .pipe(assert.end(done));

  });

  it('should read from filesystem, add hash and save to correct destination', done => {

    gulp.src('./fixtures/first.js')
        .pipe(version.hash())
        .pipe(gulp.dest('./output/'))
        .pipe(assert.first((d) => {
          d.path.toString().should.eql(`${__dirname}/output/first.7fff6f72.js`);
        }))
        .pipe(assert.end(done));

  });

  it('should read multiple from filesystem, add hash and save to correct destination', done => {

    gulp.src(['./fixtures/first.js', './fixtures/second.js'])
        .pipe(version.hash())
        .pipe(gulp.dest('./output/'))
        .pipe(assert.first((d) => {
          d.path.toString().should.eql(`${__dirname}/output/first.7fff6f72.js`);
        }))
        .pipe(assert.second((d) => {
          d.path.toString().should.eql(`${__dirname}/output/second.343854a0.js`);
        }))
        .pipe(assert.end(done));

  });

});
