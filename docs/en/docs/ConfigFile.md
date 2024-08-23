# Project configuration file

The project configuration file is a mandatory file that is used to configure the services of the project, it must be located in the root of the project and its contents must comply with strict rules, which are described below.

> To automatically create a basic configuration file, you can refer to [Project Initialization](./GettingStarted.md#project_initialization)

## Example configuration file

```yml
name: name-of-project # Project name
services:
  node1:
  type: node # Node.js runtime
  size: mili # Service size (affects price)
  active: true # Service started
  version: latest # Container version
  pwd: examples/postgres # Path to the working folder (files and folders from this path will be uploaded to the cloud)
  exclude: # Exclude files and folders (path relative to root "pwd")
    - tmp
    - node_modules
  command: npm i && npm run start # Command to start the container
  ports: # List of external ports
    - port: 3000
      type: http
  environment: # Environment variables
    - PORT=3000
```

## Top level configuration file fields

### Project name:

Cloud Project ID

```yml
name: my-awesome-project
```

**You strictly need to ensure that this field is unique between different projects, otherwise one of your projects will overwrite another project in the cloud.**

### Services:

List of services that are necessary for the operation of the project application

```yml
services:
  # Unique service name
  node0:
    # ...Service configuration fields
```

For more information about services, see [Service configuration fields](./ConfigFile.md#service_configuration_fields)

## Service configuration fields

The top-level field **services** must have a root field with an arbitrary unique name and a nested list of required and optional fields.

### Service Type

The image of the operating system and the list of installed service dependencies depend on this

```yml
type: node
```

Supported service types: _'node' | 'rust' | 'golang' | 'python' | 'redis' | 'postgres' | 'mysql' | 'adminer'_

### Service size

The allocation of cloud server resources for the operation of a specific service depends on this

```yml
size: mili
```

Supported size types: _'pico' | 'nano' | 'micro' | 'mili' | 'santi' | 'deci' | 'deca' | 'hecto' | 'kilo' | 'mega'_

### Active service

For a service to be added or updated, you must specify **true**. If **false** is specified, the service will be removed from the cloud

```yml
active: true
```

### Service version

Service version taken from the official DockerHub repository. For example, for Node.js one of the currently supported tags https://hub.docker.com/_/node will be valid

```yml
version: latest
```

### Starting command

The command executed when the service starts. Should contain installation and build commands before running the program if necessary.

```yml
command: npm i && npm run start
```

### Ports

Ports that must be forwarded for public services to the outside; for each port, a separate network address will be used on ports 80 and 443.

> `ports` specifies that the port should be exposed to the Internet via the domain name, otherwise the service can only be accessed via [Internal Links](./ConfigFile.md#internal_links) for other services in the project.

```yml
ports:
  - port: 3000
    type: http
    # Optional
    location: /path-url # Default "/"
    # Optional
    proxy_path: / # Default ""
    # Optional
    timeout: 30s
    # Optional
    buffer_size: 64k
    # Optional
    static:
      - location: /static
        path: static
        # Optional
        index: index.html
```

Supported port types: _'http' | 'ws' | 'chunked' | 'php'_

### Environment Variables

An array of environment variables that will be available to processes within the service

> It is supported to use your device's environment variables anywhere in the file, for example: `$PORT` or `${PORT}`

```yml
environment:
  - PORT=3000
```

### Internal links

An array of service names to which this service will have access via internal links.

```yml
depends_on:
  - postgres0
```

> When one of the connected services, for example **postgres**, is specified as an internal link, then an environment variable with the address of this link will be automatically added to the service during the operation of the **deploy** command

### Downloading files from Git

This parameter downloads files from the Git repository and monitors changes in the specified branch, updating the service if necessary.

> **If a private repository is specified, you must configure access rights to private repositories for the Conhos application in your personal account**

> Pay attention to the `pwd` parameter if `git` is present, it will download from the repository only the folder specified in `pwd` and make it the root in the container

```yml
git:
  url: https://github.com/user/repository.git # Repository address
  branch: master # Name of the working branch
  # Optional
  untracked: merge # Merger Policy
```

#### Supported merge policies

In case of changes on disk, `git pull` works according to the following rules:

- `merge`: Default. The service tries to automatically merge with the files from the working branch and update the working branch with local changes. If the merge cannot be done automatically, then the changes on the server are pushed to the new branch, and the service continues working with the files from the working branch.
- `push`: changes on the server are immediately pushed to the new branch, and the service continues working with the files from the working branch.
- `checkout`: local changes on the server are discarded, and the service continues working with the files from the working branch.

### Work folder

This directory will be uploaded to the cloud and will become the working directory of the service

> If the `git` parameter is specified for the service, the given rule (`pwd`) will point to a directory within the Git project

```yml
pwd: ./ # Relative path only
```

### Excludes

List of child files or folders that should not be uploaded to the cloud

```yml
# Optional
exclude:
  - node_modules
  - dist
  - some/nested
```

### Configuration injection

For overwriting configuration files inside the container.

> `volumes` is used only for passing small files inside containers to configure container processes.

```yml
# Optional
volumes:
  # - [absolute or relative path to file]:[absolute path to file inside container]
  - examples/mysql/config/my.cf:/etc/mysql/conf.d/custom.cnf
```

## Using your own domain

After each launch, the program updates the configuration file by adding the `domains` field to each service:

```yml
domains:
  '3000': unsoldered.cloud.conhos.ru
```

_Where `3000` is an external port, and `unsoldered.cloud.conhos.ru` is a domain that is generated automatically._

### Set up your domain

To set up your domain, simply change this value to the one you need:

```yml
domains:
  '3000': example.ru
```

> In order for your own domain to work, be sure to make sure that an `A` record from the IP node on which your project is located is added to the hosting zone of this domain.
> To get the IP of the project node, enter the command:

```sh
conhos ip
```

For the changes to take effect, after changing the domain, enter the command:

```sh
conhos deploy
```
