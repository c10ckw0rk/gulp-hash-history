/* eslint import/no-extraneous-dependencies: ["error", {"optionalDependencies": false}] */
/* global describe, it, before, after */
const version = require('../index');
const array = require('stream-array');
const File = require('gulp-util').File;
const gulp = require('gulp');
const assert = require('stream-assert');
const fs = require('fs');
const rimraf = require('rimraf');
const diff = require('diff');

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

describe('gulp-version.history', () => {
  
  before(done => {
    fs.mkdir('./output', done);
  });

  after(done => {
    rimraf('output', done);
  });

  it('should update an existing json file', done => {

    file('first')
      .pipe(version.hash())
      .pipe(gulp.dest('output'))
      .pipe(version.history({
        src: 'fixtures/history.json',
        key: 'legacy.js'
      }))
      .pipe(assert.first(d => {

        const strObj = {"legacy":{"js":{"latest":{"name":"first.e0996a37.js","date":"2016-09-16T02:46:44.591Z"},"dev":{"name":"first.js","date":"2016-09-16T02:46:44.591Z"},"history":[{"name":"first.e0996a37.js","date":{}}]},"css":{"latest":{},"dev":{},"history":[]}},"js":{"latest":{},"dev":{},"history":[]},"css":{"latest":{},"dev":{},"history":[]}};
        const output = JSON.parse(d.contents.toString());

        diff.diffJson(strObj, output)[0].count.should.eql(19);

      }))
      .pipe(assert.end(done));

  });

  it('should write a file resource file', done => {

    file('first')
      .pipe(version.hash())
      .pipe(gulp.dest('output'))
      .pipe(version.history({
        src: 'fixtures/history.json',
        key: 'legacy.js'
      }))
      .pipe(gulp.dest('output/'))
      .pipe(assert.first(() => {
        fs.existsSync('output/history.json').should.eql(true);
      }))
      .pipe(assert.end(done));

  });

  it('should create a json file', done => {

    file('first')
      .pipe(version.hash())
      .pipe(gulp.dest('output'))
      .pipe(version.history({
        key: 'legacy.js'
      }))
      .pipe(gulp.dest('output/history2.json'))
      .pipe(assert.first(() => {
        fs.existsSync('output/history2.json').should.eql(true);
      }))
      .pipe(assert.end(done));

  });

});
