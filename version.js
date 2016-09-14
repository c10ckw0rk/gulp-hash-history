/* eslint import/no-extraneous-dependencies: ["error", {"optionalDependencies": false}] */

const fs = require('fs');
const path = require('path');
const through = require('through2');
const vinylFile = require('vinyl-file');
const Vinyl = require('vinyl');

module.exports = (opts) => {

  return through.obj((vinylStream, enc, cb) => {

    const baseName = path.basename(vinylStream.path);
    let version;
    const files = {
      latest: null,
      versions: []
    };

    const convert = (str) => {
      str = str.replace(opts.prefix, '');
      str = JSON.parse(str).versions;
      return str;
    };

    if (vinylStream.isNull() || vinylStream.path.indexOf('map') !== -1) {
      return cb(null);
    }

    const fileMeta = {
      name: baseName,
      created: new Date()
    };

    if (fs.existsSync(opts.oldVersion)) {
      version = vinylFile.readSync(opts.oldVersion);
      files.versions = convert(version.contents.toString());
    } else {
      version = new Vinyl();
    }

    const exists = files.versions.filter(file => {

      if (file.name !== baseName) {

        const fullPath = `${vinylStream.base}/${file.name}`;

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(`${fullPath}`);
          fs.unlinkSync(`${fullPath}.map`);
        }

      }

      return file.name === baseName;

    });

    if (exists.length === 0) files.versions.unshift(fileMeta);
    files.latest = fileMeta;

    version.contents = new Buffer(`${opts.prefix} ${JSON.stringify(files)}`);
    version.path = opts.name;

    return cb(null, version);

  });

};
