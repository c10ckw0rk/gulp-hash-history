/* eslint import/no-extraneous-dependencies: ["error", {"optionalDependencies": false}] */

const fs = require('fs');
const path = require('path');
const through = require('through2');
const vinylFile = require('vinyl-file');
const Vinyl = require('vinyl');
const crypto = require('crypto');
const assign = require('lodash').assign;
const Dop = require('dataobject-parser');
const merge = require('deepmerge');
const vwrite = require('vinyl-write');

module.exports = {

    history: opts => {

        opts = assign({}, {
            src: null,
            key: null,
            removeOld: true
        }, opts);

        return through.obj((vinylStream, enc, cb) => {

            if (!vinylStream.hash) {
                return cb(null, vinylStream);
            }

            if (vinylStream.isNull()) {
                return cb('Nothing passed in stream');
            }

            const newRecord = {
                name: path.basename(vinylStream.path),
                date: new Date().toJSON()
            };

            const newDev = {
                name: path.basename(vinylStream.originalName),
                date: new Date().toJSON()
            };

            const template = vinylStream.props || {};
            const jsonMaker = new Dop();
            const templateMaker = new Dop();

            let file;
            let existingJson;

            //create empty object or get old object if exists.
            if (!fs.existsSync(opts.src)) {

                file = {};

            } else {

                //get the file
                file = JSON.parse(vinylFile.readSync(opts.src).contents.toString());

                try {
                    const keys = opts.key.split('.');
                    existingJson = keys.reduce((o, i) => o[i], file);
                } catch (e) {
                    existingJson = null;
                }

                if (!existingJson) {

                    jsonMaker.set(opts.key);
                    const baseStructure = jsonMaker.data();
                    file = merge(file, baseStructure);

                    template.history = [newRecord];
                    template.latest = newRecord;
                    template.dev = newDev;

                //remove old files if present
                } else if (existingJson.latest.name !== path.basename(vinylStream.path)) {

                    if (opts.removeOld) {

                        existingJson.history.forEach(fileObj => {

                            const fullPath = `${vinylStream.base}/${fileObj.name}`;
                            const map = fullPath + '.map';

                            if (fs.existsSync(fullPath)) {
                                fs.unlinkSync(`${fullPath}`);
                            }

                            if (fs.existsSync(map)) {
                                fs.unlinkSync(`${fullPath}.map`);
                            }

                        });

                    }


                    existingJson.history.unshift(newRecord);
                    template.history = existingJson.history;

                    //set new record as latest;
                    template.latest = newRecord;

                    //set the new dev path
                    template.dev = newDev;

                }

            }

            templateMaker.set(opts.key, template);

            const completeTemplate = templateMaker.data();

            file = merge(file, completeTemplate);

            const theFile = new Vinyl();

            if (opts.src) {
                theFile.path = process.cwd() + '/' + path.dirname(opts.src) + '/' + path.basename(opts.src);
            } else {
                theFile.path = './';
            }

            theFile.contents = new Buffer(JSON.stringify(file));

            vwrite(theFile);
            return cb(null);

        });

    },

    hash: () => {

        return through.obj((vinylStream, enc, cb) => {

            const hasher = crypto.createHash('sha1');
            const dir = path.dirname(vinylStream.path);
            const fileExt = path.extname(vinylStream.relative);
            const fileName = path.basename(vinylStream.path, fileExt);
            const regex = /\/\*.*?@FileProperties([^]*?)\*\//;
            const matches = vinylStream.contents.toString().match(regex);
            const mergedProps = matches[1].replace(/\*/ig, '').trim().split('\n');
            const props = {};

            mergedProps.forEach(item => {
                item = item.split(':');
                props[item[0].trim()] = item[1].trim();
            });

            if (props.dependencies) {
                props.dependencies = eval(props.dependencies);
            } 
            
            if (vinylStream.isNull()) {
                return cb(null);
            }

            hasher.update(vinylStream.contents);
            const hash = hasher.digest('hex').slice(0, 8);

            vinylStream.hash = hash;
            vinylStream.props = props;

            vinylStream.originalName = vinylStream.path;
            vinylStream.path = `${dir}/${fileName}.${hash}${fileExt}`;

            return cb(null, vinylStream);

        });

    }

};
