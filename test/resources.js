/* eslint import/no-extraneous-dependencies: ["error", {"optionalDependencies": false}] */
/*global describe, it*/

const expect = require('chai').expect;
const fs = require('fs');

describe('The file', () => {
  it('should exist', done => {
    expect(fs.existsSync('output/first.12345678.js')).to.equal(true);
  });
  it('should exist', done => {
    expect(fs.existsSync('output/first.12345678.js')).to.equal(true);
  });
});
