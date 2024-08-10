# Hosting Php with Redis

To host `Php` on Container Hosting and connect to the `Redis` database from it, you need to complete the following three steps.

## 1. Installing the project management utility

If you have installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If you have not installed it, then use the [Instructions](./GettingStarted.md) to install it.

## 2. Creating a configuration file

Configuration file for creating a `Php` service in Container Hosting with a `Redis` database server running and connecting to it from an application, and an optional example of updating `Adminer` to administer the database. More details in the [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Redis` container in the [official Redis repository](https://hub.docker.com/_/redis/tags)

```yml
name: name-of-project
services:
  php1:
    type: php
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/php-redis
    exclude:
      - vendor
    command: php-fpm
    ports:
      - port: 3000
        type: http
    depends_on: # Specify that the service should have internal links to
      - redis0 # redis0 service
    environment:
      - PORT=3000
      # Next we forward the connection variables
      - REDIS_PASSWORD=value0
  postgres0:
    type: redis
    size: mili
    active: true
    version: latest
    environment:
      # Variables for initializing the database
      - REDIS_PASSWORD=value0
```

> The database host will be accessible in the application container via the environment variable `[SERVICE_NAME]_HOST`, for example for the service `redis0` the name of the host variable inside the container that references this service via `depends_on` will be `REDIS0_HOST`

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```

---

Continue studying

[Hosting Php  <<<](./HostingPhp.md) | [>>> Hosting Php Postgres](./HostingPhpPostgres.md)
