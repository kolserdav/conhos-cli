# Hosting Php with Mysql

To host `Php` on Container Hosting and connect to the `Mysql` database from it, you need to complete the following three steps.

## 1. Installing the project management utility

If you have installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If you have not installed it, then use the [Instructions](./GettingStarted.md) to install it.

## 2. Creating a configuration file

Configuration file for creating a `Php` service in Container Hosting with a `Mysql` database server running and connecting to it from an application, and an optional example of updating `Adminer` to administer the database. More details in the [Configuration File](./ConfigFile.md).

> Check the current version of the `Mysql` container in the [official Mysql repository](https://hub.docker.com/_/mysql/tags)

```yml
name: name-of-project
services:
  php1:
    type: php
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/php-mysql
    exclude:
      - vendor
    command: php-fpm
    ports:
      - port: 3000
        type: http
    depends_on: # Specify that the service should have internal links to
      - mysql0 # mysql0 service
    environment:
      - PORT=3000
      # Next we forward the connection variables
			- MYSQL_ROOT_PASSWORD=value0
			- MYSQL_USER=value1
			- MYSQL_PASSWORD=value2
			- MYSQL_DATABASE=value3
  postgres0:
    type: mysql
    size: mili
    active: true
    version: latest
    environment:
      # Variables for initializing the database
			- MYSQL_ROOT_PASSWORD=value0
			- MYSQL_USER=value1
			- MYSQL_PASSWORD=value2
			- MYSQL_DATABASE=value3
  adminer0:
    type: adminer
    size: pico
    active: true
    version: latest
    depends_on:
      - mysql0
```

> The database host will be accessible in the application container via the environment variable `[SERVICE_NAME]_HOST`, for example for the service `mysql0` the name of the host variable inside the container that references this service via `depends_on` will be `MYSQL0_HOST`

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```
