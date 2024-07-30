# Hosting Python with Postgres

To host `Python` on Container Hosting and connect to the `Postgres` database from it, you need to complete the following three steps.

## 1. Installing the project management utility

If you have installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If you have not installed it, then use the [Instructions](./GettingStarted.md) to install it.

## 2. Creating a configuration file

Configuration file for creating a `Python` service in Container Hosting with a `Postgres` database server running and connecting to it from an application, and an optional example of updating `Adminer` to administer the database. More details in the [Configuration File](./ConfigFile.md).

> Check the current version of the `Postgres` container in the [official Postgres repository](https://hub.docker.com/_/postgres/tags)

```yml
name: name-of-project
services:
  python1:
    type: python
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/python-postgres
    exclude:
      - venv
    command: pip install -r requirements.txt && python main.py
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
    size: pico
    active: true
    version: latest
    depends_on:
      - postgres0
```

> The database host will be accessible in the application container via the environment variable `[SERVICE_NAME]_HOST`, for example for the service `postgres0` the name of the host variable inside the container that references this service via `depends_on` will be `POSTGRES0_HOST`

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```
