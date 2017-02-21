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
const chalk = require('chalk');

module.exports = {

    history: opts => {

        opts = assign({}, {
            destHistory: null,
            destLatest: null,
            dest: null,
            key: null,
            removeOld: true
        }, opts);

        const hasher = crypto.createHash('sha1');
        const error = (msg) => {

            throw new Error(msg);

        };

        if (!opts.destHistory) error('no history provided');
        if (!opts.destLatest) error('no latest provided');

        return through.obj(function (vinylStream, enc, cb) {

            if (vinylStream.isNull()) {
                return cb('Nothing passed in stream');
            }

            hasher.update(vinylStream.contents);
            const hash = hasher.digest('hex').slice(0, 8);
            const ext = path.extname(vinylStream.relative);
            const name = path.basename(vinylStream.path, ext);
            vinylStream.path = `${path.dirname(vinylStream.path)}/${name}.${hash}${ext}`;

            const makeFile = (template, file, name) => {

                const templateMaker = new Dop();

                templateMaker.set(opts.key, template);

                const completeTemplate = templateMaker.data();

                file = merge(file, completeTemplate);

                const theFile = new Vinyl();

                if (name) {
                    theFile.path = process.cwd() + '/' + path.dirname(name) + '/' + path.basename(name);
                } else {
                    theFile.path = './';
                }

                theFile.contents = new Buffer(JSON.stringify(file, null, 4));

                return theFile;

            };

            const getOldFile = (dest) => {

                let json;

                //get the file
                const file = JSON.parse(vinylFile.readSync(dest).contents.toString());

                try {
                    const keys = opts.key.split('.');
                    json = keys.reduce((o, i) => o[i], file);
                } catch (e) {
                    console.log(e);
                    json = {
                        history: [{
                            name: null
                        }]
                    };
                }

                return {
                    file: file,
                    json: json
                };

            };

            const createLatest = (dest, newRecord, newDev) => {

                const template = vinylStream.props || {};
                const jsonMaker = new Dop();
                let file;

                //create empty object or get old object if exists.
                if (fs.existsSync(dest)) {

                    const exisiting = getOldFile(dest);

                    file = exisiting.file;

                    if (!exisiting) {

                        jsonMaker.set(opts.key);
                        const baseStructure = jsonMaker.data();
                        file = merge(file, baseStructure);

                        template.latest = newRecord;
                        template.dev = newDev;

                        //remove old files if present
                    }

                } else {

                    file = {};
                }

                template.latest = newRecord;
                template.dev = newDev;

                return makeFile(template, file, dest);

            };

            const createHistory = (dest, newRecord) => {

                const template = {};
                const jsonMaker = new Dop();

                let file = {};
                let exisiting;

                //create empty object or get old object if exists.
                if (fs.existsSync(dest)) {

                    //get the file
                    exisiting = getOldFile(dest);
                    file = exisiting.file;

                }

                //if no existing
                if (!exisiting) {

                    //make a new json structure using key
                    jsonMaker.set(opts.key);
                    file = merge(file, jsonMaker.data());

                    template.history = [newRecord];


                } else if (!exisiting.json) {

                    template.history = [newRecord];

                    //remove old files if present
                } else if (exisiting.json.history[0].name !== path.basename(vinylStream.path)) {

                    if (opts.removeOld) {

                        exisiting.json.history.forEach(fileObj => {

                            if (!opts.dest) console.log(chalk.red('To remove old files you need to add the dest'));

                            const fullPath = `${opts.dest}/${fileObj.name}`;
                            const map = fullPath + '.map';

                            if (fs.existsSync(fullPath)) {
                                fs.unlinkSync(fullPath);

                                console.log(chalk.green(`Deleted ${fullPath}`));
                            }

                            if (fs.existsSync(map)) {
                                fs.unlinkSync(`${fullPath}.map`);
                            }

                        });

                    }

                    exisiting.json.history.unshift(newRecord);
                    template.history = exisiting.json.history;

                }

                return makeFile(template, file, dest);

            };

            const newRecord = assign({}, vinylStream.props, {
                name: path.basename(vinylStream.path)
            });

            const devName = path.basename(vinylStream.originalName, vinylStream.originalExt) + path.extname(vinylStream.path);

            const newDev = {
                name: path.basename(devName)
            };

            this.push(vinylStream);
            vwrite(createHistory(opts.destHistory, newRecord));
            vwrite(createLatest(opts.destLatest, newRecord, newDev));

            return cb(null);

        });

    },

    getProps: () => {

        return through.obj(function (vinylStream, enc, cb) {

            const regex = /\/\*.*?@FileProperties([^]*?)\*\//;
            const matches = vinylStream.contents.toString().match(regex);

            if (matches === null) {
                // console.warn('no file properties provided in ' + vinylStream.path);
            } else {

                const mergedProps = matches[0].replace(/\/\*.*?@FileProperties/ig, '')
                                    .replace(/\*\//, '')
                                    .replace(/\*/ig, '')
                                    .trim()
                                    .split('\n');

                const props = {};

                mergedProps.forEach(item => {
                    item = item.split(':');

                    props[item[0].trim()] = item[1].trim();
                });

                if (props.dependencies) {
                    props.dependencies = eval(props.dependencies);
                }

                console.log(chalk.blue('file props are... '));

                for (const key in props) {
                    console.log(chalk.blue(`${key} : ${props[key]}`));
                }

                vinylStream.props = props;
                vinylStream.originalName = vinylStream.path;
                vinylStream.originalExt = path.extname(vinylStream.path);

            }

            if (vinylStream.isNull()) {
                return cb(null);
            }

            this.push(vinylStream);

            return cb(null);

        });

    }

};
