# Hosting Rust with Redis

To host `Rust` on Container Hosting and connect to the `Redis` database from it, you need to complete the following three steps.

## 1. Installing the project management utility

> If your project files are in a Git repository, then installing the utility is not necessary, since you can run the project from the browser.

If you have installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If you have not installed it, then use the [Instructions](./GettingStarted.md) to install it.

## 2. Creating a configuration file

> If your project files are in a Git repository, you can create a configuration file from your browser.

Configuration file for creating a `Rust` service in Container Hosting with a `Redis` database server running and connecting to it from an application, and an optional example of updating `Adminer` to administer the database. More details in the [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Redis` container in the [official Redis repository](https://hub.docker.com/_/redis/tags)

```yml
name: my-rust-redis-project
services:
  rust1:
    image: rust
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/rust-redis
    exclude:
      - target
    command: cargo build --release && ./target/release/main
    ports:
      - port: 3000
        type: proxy
    depends_on: # The service should only start after the following services
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

<div style="margin-top: 4rem;"></div>

Continue studying

[Hosting Node  <<<](./HostingNode.md) | [>>> Hosting Rust Postgres](./HostingRustPostgres.md)
