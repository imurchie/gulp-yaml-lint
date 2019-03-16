const File = require('vinyl');
const should = require('should');
const { Buffer } = require('buffer');
const yamlLint = require('../');


const invalid = `$
missing:
  something?
`;

function endWithoutError (done) {
  done(new Error('An error was not thrown before ending'));
}

describe('failOnError', function () {
  it('should fail immediately', function (done) {
    const lintStream = yamlLint({});

    lintStream
      .pipe(yamlLint.failOnError())
      .on('error', function (err) {
        this.removeListener('finish', endWithoutError);
        should.exists(err);
  			err.message.should.equal('Failed with 1 error');
  			err.fileName.should.equal('test/fixtures/invalid.yml');
  			err.plugin.should.equal('gulp-yaml-lint');
  			done();
      })
      .on('finish', endWithoutError);

      lintStream.write(new File({
  			path: 'test/fixtures/invalid.yml',
  			contents: Buffer.from(invalid),
  		}));
      // the second file should never get into the stream
      lintStream.write(new File({
  			path: 'test/fixtures/invalid2.yml',
  			contents: Buffer.from(invalid),
  		}));

		lintStream.end();
  });
});

describe('failAfterError', function () {
  it('should fail after all files', function (done) {
    const lintStream = yamlLint({});

    lintStream
      .pipe(yamlLint.failAfterError())
      .on('error', function (err) {
        this.removeListener('finish', endWithoutError);
        should.exists(err);
  			err.message.should.equal('Failed with 2 errors');
  			err.plugin.should.equal('gulp-yaml-lint');
  			done();
      })
      .on('finish', endWithoutError);

      lintStream.write(new File({
  			path: 'test/fixtures/invalid.yml',
  			contents: Buffer.from(invalid),
  		}));
      // the second file should never get into the stream
      lintStream.write(new File({
  			path: 'test/fixtures/invalid2.yml',
  			contents: Buffer.from(invalid),
  		}));

		lintStream.end();
  });
});
