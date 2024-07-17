# Configuration file

The project configuration file is a mandatory file that is used to configure the services of the project, it must be located in the root of the project and its contents must comply with strict rules, which are described below.

> To automatically create a basic configuration file, you can refer to [Project Initialization](./GettingStarted.md#project_initialization)

## Example configuration file

```yml
project: my-awesome-project
services:
  node0:
    type: node
    size: mili
    active: true
    pwd: ./
    exclude:
      - node_modules
      - dist
    public: true
    version: 21-alpine3.18
    command: npm i && npm run start
    ports:
      - port: 3000
        type: http
    environment:
      - PORT=3000
```

## Top level configuration file fields

### Project name:

Cloud Project ID

```yml
project: my-awesome-project
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

### Public service

Indicates whether the service should be open to the Internet by domain name or whether it will be accessible only through [Internal links](./ConfigFile.md#internal_links) for other project services

```yml
public: true
```

### Service version

Service version taken from the official DockerHub repository. For example, for Node.js one of the currently supported tags https://hub.docker.com/_/node will be valid

```yml
version: 21-alpine3.18
```

### Starting command

The command executed when the service starts. Should contain installation and build commands before running the program if necessary.

```yml
command: npm i && npm run start
```

### Ports

Ports that must be forwarded for public services to the outside; for each port, a separate network address will be used on ports 80 and 443.

```yml
ports:
  - port: 3000
    type: http
    # Optional
    location: /path-url
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

Supported port types: _'http' | 'ws' | 'chunked'_

### Environment Variables

An array of environment variables that will be available to processes within the service

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

### Work folder

This directory will be uploaded to the cloud and will become the working directory of the service

```yml
pwd: ./
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
