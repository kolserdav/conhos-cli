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

> If your project files are in a Git repository, then installing the utility is not necessary, since you can run the project from the browser.

If you installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If not installed, then use [Instructions](./GettingStarted.md#introduction) to install.

## 2. Create a configuration file

> If your project files are in a Git repository, you can create a configuration file from your browser.

Configuration file for creating the `Php` service in Container Hosting. More details in [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Php` container in the [official Php repository](https://hub.docker.com/_/php/tags)

```yml
name: my-awesome-project
services:
  php0:
    image: php
    size: mili
    active: true
    pwd: examples/php
    exclude:
      - vendor
    version: latest
    command: php-fpm
    ports:
      - port: 3000
        type: proxy
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

[Hosting Php Mongo <<<](./HostingPhpMongo.md) | [>>> Hosting Php Redis](./HostingPhpRedis.md)
