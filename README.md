## gulp-yaml-lint

A simple [YAML](https://yaml.org/) linter plugin for [gulp](https://gulpjs.com/).

If [yamllint](https://github.com/adrienverge/yamllint) is installed, it will
be executed against every YAML file found.

If not, it will simply parse the file and report errors. This is, of course, not
really linting, and the error messages are generally reported for the line
_after_ the one that is actually a problem. It does, however, provide some feedback.
