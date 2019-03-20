const { Transform } = require('stream');
const log = require('fancy-log');
const yaml = require('js-yaml');
const { EOL } = require('os');
const PluginError = require('plugin-error');
const red = require('ansi-red');
const { exec } = require('child_process');
const which = require('which');


function lint (file, opts, cb) {
	// if the `yamllint` program is available, use it
	// otherwise just try parsing the YAML
	which('yamllint', function (err, resolvedPath) {
		if (err) {
			jsYaml(file, opts, cb);
		} else {
			yamllint(file, opts, cb);
		}
	});
}

function jsYaml (file, opts, cb) {
	try {
		(opts.safe ? yaml.safeLoad : yaml.load)(file.contents.toString(file.enc));
	} catch (err) {
		file.error = err;
	}
	cb();
}

function yamllint (file, opts, cb) {
	exec(`yamllint ${file.path}`, function (err, stdout, stderr) {
		if (err) {
			err.stdout = stdout;
			err.stderr = stderr;
			file.error = err;
		}
		cb();
	});
}

function gulpYamlLint (options = {}) {
  return new Transform({
    objectMode: true,
    transform (file, enc, cb) {
			file.enc = enc;
      file.error = null;
      lint(file, options, function () {
				cb(null, file);
			});
    },
  });
}

function handleError (files) {
  if (files.length === 0) {
    return;
  }

	let fullLint = false;
	for (const file of files) {
		if (file.error.stdout) {
			fullLint = true;
		}
		log.error(`Invalid YAML file: '${file.path}'`);
		for (const line of file.error.message.split(EOL)) {
			log.error(`> ${line}`);
		}
		for (const line of (file.error.stdout || '').split(EOL)) {
			log.error(`> ${line}`);
		}
		for (const line of (file.error.stderr || '').split(EOL)) {
			log.error(`> ${line}`);
		}
	}

  log.error(`YAML ${files.length === 1 ? 'error' : 'errors'} found.`);
	if (!fullLint) {
		log.error(`Due to the limitations of YAML linting, the error `);
  	log.error(`is most likely in the line immediately ${red('before')} the line reported.`);
	}
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
