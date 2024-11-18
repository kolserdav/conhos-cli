# Hosting Golang with Rabbitmq

To host `Golang` on Container Hosting and connect to the `Rabbitmq` database from it, you need to complete the following three steps.

## 1. Installing the project management utility

> If your project files are in a Git repository, then installing the utility is not necessary, since you can run the project from the browser.

If you have installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If you have not installed it, then use the [Instructions](./GettingStarted.md) to install it.

## 2. Creating a configuration file

> If your project files are in a Git repository, you can create a configuration file from your browser.

Configuration file for creating a `Golang` service in Container Hosting with a `Rabbitmq` database server running and connecting to it from an application, and an optional example of updating `Adminer` to administer the database. More details in the [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Rabbitmq` container in the [official Rabbitmq repository](https://hub.docker.com/_/rabbitmq/tags)

```yml
name: name-of-project
services:
  golang1:
    image: golang
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/golang-rabbitmq
    exclude:
      - vendor
    command: go build -o main && ./main
    ports:
      - port: 3000
        type: http
    depends_on: # Specify that the service should have internal links to
      - rabbitmq0 # rabbitmq0 service
    environment:
      - PORT=3000
      # Next we forward the connection variables
      - RABBITMQ_DEFAULT_PASS=value0
      - RABBITMQ_DEFAULT_USER=value1
  postgres0:
    type: rabbitmq
    size: mili
    active: true
    version: latest
    environment:
      # Variables for initializing the database
      - RABBITMQ_DEFAULT_PASS=value0
      - RABBITMQ_DEFAULT_USER=value1
```

> The database host will be accessible in the application container via the environment variable `[SERVICE_NAME]_HOST`, for example for the service `rabbitmq0` the name of the host variable inside the container that references this service via `depends_on` will be `RABBITMQ0_HOST`

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Continue studying

[Hosting Golang Mongo <<<](./HostingGolangMongo.md) | [>>> Hosting Golang Redis](./HostingGolangRedis.md)
