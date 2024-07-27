# Hosting Rust with database Postgres

If your application needs to run in conjunction with a database server, you can also start the database server and connect to it from your application. Also, if you need a DBMS web panel to manage your database, it can also be connected as a separate service.

> Check the current version of the `Postgres` container in the [official Postgres repository](https://hub.docker.com/_/postgres/tags)

```yml
name: name-of-project
services:
  rust1:
    type: rust
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/rust-postgres
    exclude:
      - target
    command: cargo build --release && ./target/release/main
    ports:
      - port: 3000
        type: http
    depends_on: # Specify that the service should have internal links to
      - postgres0 # postgres0 service
    environment:
      - PORT=3000
      # Next we forward the connection variables
      - POSTGRES0_USER=user
      - POSTGRES0_PASSWORD=password
      - POSTGRES0_DB=db_name
  postgres0:
    type: postgres
    size: mili
    active: true
    version: latest
    environment:
      # Variables for initializing the database
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=db_name
  adminer0:
    type: adminer
    size: mili
    active: true
    version: 4.8.1-standalone
    depends_on:
      - postgres0
```

> The database host will be accessible in the application container by the environment variable `[SERVICE_TYPE]_HOST`, for example for the `postgres` database the name of the host variable will be `POSTGRES_HOST`
