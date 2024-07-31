# Hosting Rust with Rabbitmq

To host `Rust` on Container Hosting and connect to the `Rabbitmq` database from it, you need to complete the following three steps.

## 1. Installing the project management utility

If you have installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If you have not installed it, then use the [Instructions](./GettingStarted.md) to install it.

## 2. Creating a configuration file

Configuration file for creating a `Rust` service in Container Hosting with a `Rabbitmq` database server running and connecting to it from an application, and an optional example of updating `Adminer` to administer the database. More details in the [Configuration File](./ConfigFile.md).

> Check the current version of the `Rabbitmq` container in the [official Rabbitmq repository](https://hub.docker.com/_/rabbitmq/tags)

```yml
name: name-of-project
services:
  rust1:
    type: rust
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/rust-rabbitmq
    exclude:
      - target
    command: cargo build --release && ./target/release/main
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
  adminer0:
    type: adminer
    size: pico
    active: true
    version: latest
    depends_on:
      - rabbitmq0
```

> The database host will be accessible in the application container via the environment variable `[SERVICE_NAME]_HOST`, for example for the service `rabbitmq0` the name of the host variable inside the container that references this service via `depends_on` will be `RABBITMQ0_HOST`

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```
