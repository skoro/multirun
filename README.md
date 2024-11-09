## Simple task/process runner

[multirun](https://github.com/skoro/multirun) is a simple and configurable task and process runner. It allows you
to define multiple tasks in a configuration file (in [YAML](https://yaml.org/) format) and
execute them concurrently, making it useful for automating workflows.

### Features
- processes can be restarted
- a timeout for a process can be set, allows running the process for a limited amount of time
- collects process output (stdout and stderr) to console or a file

### Configuration

The [example configuration](https://github.com/skoro/multirun/blob/master/multirun-config.example.yml)
has descriptions of all the available parameters that can be used.
