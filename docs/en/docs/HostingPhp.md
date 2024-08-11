# Hosting Php

## Links

- [Php with database Redis](./HostingPhpRedis.md)  
- [Php with database Postgres](./HostingPhpPostgres.md)  
- [Php with database Mysql](./HostingPhpMysql.md)  
- [Php with database Mariadb](./HostingPhpMariadb.md)  
- [Php with database Mongo](./HostingPhpMongo.md)  
- [Php with database Rabbitmq](./HostingPhpRabbitmq.md)  


To host an application on Container Hosting `Php`, you must complete the following three steps.

## 1. Installing the project management utility

If you installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If not installed, then use [Instructions](./GettingStarted.md) to install.

## 2. Create a configuration file

Configuration file for creating the `Php` service in Container Hosting. More details in [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Php` container in the [official Php repository](https://hub.docker.com/_/php/tags)

```yml
name: my-awesome-project
services:
  php0:
    type: php
    size: mili
    active: true
    pwd: examples/php
    exclude:
      - vendor
    version: latest
    command: php-fpm
    ports:
      - port: 3000
        type: http
    environment:
      - PORT=3000
```

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Continue studying

<div style="display: flex; flex-direction: row; justify-content: space-around;"><span>[Hosting Php Mongo <<<](./HostingPhpMongo.md)</span> <span>|</span> <span>[>>> Hosting Php Redis](./HostingPhpRedis.md)</span></div>
