# Project configuration file

The project configuration file is a mandatory file that is used to configure the services of the project, it must be located in the root of the project and its contents must comply with strict rules, which are described below.

> If your project is in a Git repository, you can customize the configuration file directly from the browser.

> To automatically create a basic configuration file, you can refer to [Project Initialization](./GettingStarted.md#init)

## Example configuration file [![anchor](https://conhos.ru/images/icons/link.svg)](#config-file-ex)

```yml
name: name-of-project # Project name
services:
  node1:
  image: node # Node.js runtime
  size: mili # Service size (affects price)
  active: true # Service started
  version: latest # Container version
  pwd: examples/postgres # Path to the working folder (files and folders from this path will be uploaded to the cloud)
  volumes: # [OPTIONAL] Upload additional files to the container
    - https://raw.githubusercontent.com/kolserdav/conhos-cli/master/examples/php/install-extensions.sh:install-extensions.sh
    # Mount local volume
    - local:/path
  entrypoint: ['install-extensions.sh'] # [OPTIONAL] Scripts to run when creating the container
  exclude: # [OPTIONAL] Exclude files and folders (path relative to root "pwd")
    - tmp
    - node_modules
  command: npm i && npm run start # Command to start the container
  ports: # [OPTIONAL] List of external ports
    - port: 3000
      type: proxy
  deploy: # [OPTIONAL] Deployment options
    replicas: 2 # [OPTIONAL] Number of replicas (each replica is billed as a separate unit)
    update_config: # [OPTIONAL] Update options
      parallelism: 1 # [OPTIONAL] Number of simultaneously updated replicas
      delay: 3s # [OPTIONAL] Delay after updating a replica before updating the next one
  environment: # [OPTIONAL] Environment variables
    - PORT=3000
# Local volumes
volumes:
  localVolume:
    name: local
```

## Top level configuration file fields [![anchor](https://conhos.ru/images/icons/link.svg)](#top-level-props)

### Project name [![anchor](https://conhos.ru/images/icons/link.svg)](#project-name)

Cloud Project ID

```yml
name: my-awesome-project
```

### Local volumes [![anchor](https://conhos.ru/images/icons/link.svg)](#volumes)

Local volumes are used to save files between service restarts, as well as to access service files from another service.

```yml
volumes:
  key:
    name: 'name'
```

After creating a local volume in `volumes`, you must also add this volume to `service.volumes`, for example:

```yml
services:
  node:
    volumes:
      # Specify the volume name and path
      - name:/path
```

**You strictly need to ensure that this field is unique between different projects, otherwise one of your projects will overwrite another project in the cloud.**

### Services [![anchor](https://conhos.ru/images/icons/link.svg)](#services)

List of services that are necessary for the operation of the project application

```yml
services:
  # Unique service name
  node0:
    # ...Service configuration fields
```

For more information about services, see [Service configuration fields](./ConfigFile.md#service-level-props)

## Service configuration fields [![anchor](https://conhos.ru/images/icons/link.svg)](#service-level-props)

The top-level field **services** must have a root field with an arbitrary unique name and a nested list of required and optional fields.

### Service Image [![anchor](https://conhos.ru/images/icons/link.svg)](#service-image)

The image of the operating system and the list of installed service dependencies depend on this

```yml
image: node
```

Supported service types: _'node' | 'rust' | 'golang' | 'php' | 'ruby' | 'python' | 'redis' | 'postgres' | 'mysql' | 'mariadb' | 'mongo' | 'rabbitmq' | 'mongo_express' | 'adminer' | 'phpmyadmin' | 'custom'_

#### Custom container [![anchor](https://conhos.ru/images/icons/link.svg)](#custom-container)

To run a service based on any of the images on Docker Hub, you need to specify `custom` and in `version` specify _'author/name:version'_ of the image.

```yml
image: custom
version: dart # Will be installed from the official Dart repository latest (default) version
```

#### Build container from Dockerfile [![anchor](https://conhos.ru/images/icons/link.svg)](#custom-container-build)

Build a custom image for the service from `Dockerfile`. Only works with the `conhos deploy` command.

> After changing the Dockerfile in the repository, if you want the container to rebuild, you need to run the `deploy` command manually.

```yml
image: custom # This value is required to use build
build:
  dockerfile: Dockerfile # Relative path to Dockerfile in the context of "project-path/pwd"
```

### Service size [![anchor](https://conhos.ru/images/icons/link.svg)](#service-size)

The allocation of cloud server resources for the operation of a specific service depends on this

> This parameter affects the price. See the price table on the [home page](/#price)

```yml
size: mili
```

Supported size types: _'pico' | 'nano' | 'micro' | 'mili' | 'santi' | 'deci' | 'deca' | 'hecto' | 'kilo'_

### Active service [![anchor](https://conhos.ru/images/icons/link.svg)](#service-active)

For a service to be added or updated, you must specify **true**. If **false** is specified, the service will be removed from the cloud

```yml
active: true
```

### Service version [![anchor](https://conhos.ru/images/icons/link.svg)](#service-version)

Service version taken from the official DockerHub repository. For example, for Node.js one of the currently supported tags https://hub.docker.com/_/node will be valid

```yml
version: latest
```

### Restart service [![anchor](https://conhos.ru/images/icons/link.svg)](#service-restart)

Sets the automatic service restart policy.

#### Possible values:

- `always` [Default] - Restarts on crash and on `deploy` command if there were changes in `pwd` files
- `on-failure` - Restarts only on crash
  > This value is preferable for services that do not need to be restarted when files change, such as those running on `php-fpm`.
- `no` - never restarts (temporary service)
  > This value is preferable for temporary services. Which can be used, for example, together with [depends_on](#depends-on), to build a project in a more powerful service.

```yml
# Optional
restart: always
```

### Starting command [![anchor](https://conhos.ru/images/icons/link.svg)](#service-command)

The command executed when the service starts. Should contain installation and build commands before running the program if necessary.

```yml
command: npm i && npm run start
```

### Ports [![anchor](https://conhos.ru/images/icons/link.svg)](#service-ports)

Ports that must be forwarded for public services to the outside; for each port, a separate network address will be used on ports 80 and 443.

> `ports` specifies that the port should be exposed to the Internet via the domain name, otherwise the service can only be accessed via [Internal Links](./ConfigFile.md#internal-links) for other services in the project.

[**More about ports**](./Ports.md)

### Deployment [![anchor](https://conhos.ru/images/icons/link.svg)](#service-deploy)

Configuring horizontal scaling of the service

```yml
deploy:
  replicas: 2
  update_config:
    parallelism: 1
    delay: 3s
```

### Replicas [![anchor](https://conhos.ru/images/icons/link.svg)](#service-deploy-replicas)

The number of service instances (containers) that will respond via the load balancer.

> This parameter is valid only for executable services

```yml
deploy:
  replicas: 2
```

#### Update configuration [![anchor](https://conhos.ru/images/icons/link.svg)](#service-deploy-update-config)

Service update policy settings.

##### Parallelism [![anchor](https://conhos.ru/images/icons/link.svg)](#service-deploy-update-config-parallelism)

Sets the number of simultaneously restarted service replicas during update and restart.

```yml
deploy:
  update_config:
    parallelism: 1
```

##### Delay [![anchor](https://conhos.ru/images/icons/link.svg)](#service-deploy-update-config-delay)

Delay time after restarting a replica before starting the next one.

```yml
deploy:
  update_config:
    delay: 3s
```

### Environment Variables [![anchor](https://conhos.ru/images/icons/link.svg)](#service-environment)

An array of environment variables that will be available to processes within the service

> It is supported to use your device's environment variables anywhere in the file, for example: `${PORT}`

```yml
environment:
  - PORT=3000
```

### Startup order [![anchor](https://conhos.ru/images/icons/link.svg)](#depends-on)

Array of service names that must be started before this service.

> When a service depends on another service that has [restart](#service-restart) set to `no` (temporary service), then after the temporary service finishes working, this service will be restarted.

```yml
depends_on:
  - postgres0
```

### Downloading files from Git [![anchor](https://conhos.ru/images/icons/link.svg)](#git)

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

#### Supported merge policies [![anchor](https://conhos.ru/images/icons/link.svg)](#git-untracked)

In case of changes on disk, `git pull` works according to the following rules:

- `merge`: Default. The service tries to automatically merge with the files from the working branch and update the working branch with local changes. If the merge cannot be done automatically, then the changes on the server are pushed to the new branch, and the service continues working with the files from the working branch.
- `push`: changes on the server are immediately pushed to the new branch, and the service continues working with the files from the working branch.
- `checkout`: local changes on the server are discarded, and the service continues working with the files from the working branch.

### Work folder [![anchor](https://conhos.ru/images/icons/link.svg)](#pwd)

This directory will be uploaded to the cloud and will become the working directory of the service

> If the `git` parameter is specified for the service, the given rule (`pwd`) will point to a directory within the Git project

```yml
pwd: ./ # Relative path only
```

### Excludes [![anchor](https://conhos.ru/images/icons/link.svg)](#exclude)

List of child files or folders that should not be uploaded to the cloud

```yml
# Optional
exclude:
  - node_modules
  - dist
  - some/nested
```

### Connecting a volume [![anchor](https://conhos.ru/images/icons/link.svg)](#service-volumes)

To overwrite configuration files inside the container:

> This method is only suitable for embedding small files, and is used to overwrite the default configuration files inside the container. To load application files, you need to use [pwd](#pwd)

```yml
# Optional
volumes:
  # - [absolute or relative path to the file or download link]:[absolute path to the file inside the container]
  - examples/mysql/config/my.cf:/etc/mysql/conf.d/custom.cnf
```

> To connect a volume to the host system, use the [local volumes](#volumes) mechanism to save files between changes in the container

### Running a script when starting a container [![anchor](https://conhos.ru/images/icons/link.svg)](#entrypoint)

> Except for the `postgres` service, where you don't need to pass `entrypoint` to run scripts when creating, instead we pass the `/docker-entrypoint-initdb.d/init.sql` file inside the container via `volumes` with approximate contents:

```sh
#!/bin/sh
config_path=/var/lib/postgresql/data/postgresql.conf
echo "Add include dir to config $config_path"
echo "include_dir='/etc/postgresql'" >> $config_path

```

```yml
# Optional
entrypoint: ['install-extensions.sh']
```

## Using your own domain [![anchor](https://conhos.ru/images/icons/link.svg)](#custom-domain)

To set up your domain, simply add the following field to the service configuration:

```yml
domains:
  '3000': example.ru
```

> In order for your own domain to work, be sure to make sure that in the hosting zone of this domain **two `A` records** are added from the IP node where your project is located, which refer to the domain itself **as well as to the domain with the `www` prefix**, for example `www.example.ru`.

To get the IP of the project node, enter the command:

```sh
conhos ip
```

For the changes to take effect, after changing the domain, enter the command:

```sh
conhos deploy
```
