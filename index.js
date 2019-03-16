const { Transform } = require('stream');
const log = require('fancy-log');
const yaml = require('js-yaml');
const { EOL } = require('os');
const PluginError = require('plugin-error');
const red = require('ansi-red');


function lint (file, cb) {
	jsYaml(file);
	cb();
}

function jsYaml (file) {
	try {
		(options.safe ? yaml.safeLoad : yaml.load)(file.contents.toString(enc));
	} catch (err) {
		file.error = err;
	}
}

function gulpYamlLint (options = {}) {
  return new Transform({
    objectMode: true,
    transform (file, enc, cb) {
      file.error = null;
      lint(file, function () {
				cb(null, file);
			});
    },
  });
}

function handleError (files) {
  if (files.length === 0) {
    return;
  }

	for (const file of files) {
		log.error(`Invalid YAML file: '${file.path}'`);
		for (const line of file.error.message.split(EOL)) {
			log.error(`> ${line}`);
		}
	}

  log.error(`YAML ${files.length === 1 ? 'error' : 'errors'} found. Due to the limitations of YAML linting, the error `);
  log.error(`is most likely in the line immediately ${red('before')} the line reported.`);
}

gulpYamlLint.failOnError = function () {
  return new Transform({
    objectMode: true,
    transform (file, enc, cb) {
			if (file.error) {
				handleError([file]);
				return cb(new PluginError('gulp-yaml-lint', {
			    name: 'YAMLError',
			    message: `Failed with 1 error`,
					fileName: file.path,
			  }));
			}
      cb();
    },
  });
};

gulpYamlLint.failAfterError = function () {
	const errFiles = [];
  return new Transform({
    objectMode: true,
    transform (file, enc, cb) {
      if (file.error) {
        errFiles.push(file);
      }
      cb();
    },
    flush (cb) {
			if (errFiles.length !== 0) {
	      handleError(errFiles);
				return cb(new PluginError('gulp-yaml-lint', {
					name: 'YAMLError',
					message: `Failed with ${errFiles.length} ${errFiles.length === 1 ? 'error' : 'errors'}`,
				}));
			}
			cb();
    },
  });
};

module.exports = gulpYamlLint;
