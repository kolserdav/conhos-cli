# Hosting Python with Mariadb

To host `Python` on Container Hosting and connect to the `Mariadb` database from it, you need to complete the following three steps.

## 1. Installing the project management utility

> If your project files are in a Git repository, then installing the utility is not necessary, since you can run the project from the browser.

If you have installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If you have not installed it, then use the [Instructions](./GettingStarted.md) to install it.

## 2. Creating a configuration file

> If your project files are in a Git repository, you can create a configuration file from your browser.

Configuration file for creating a `Python` service in Container Hosting with a `Mariadb` database server running and connecting to it from an application, and an optional example of updating `Adminer` to administer the database. More details in the [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Mariadb` container in the [official Mariadb repository](https://hub.docker.com/_/mariadb/tags)

```yml
name: my-python-mariadb-project
services:
  python1:
    image: python
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/python-mariadb
    exclude:
      - venv
    command: pip install -r requirements.txt && python main.py
    ports:
      - port: 3000
        type: proxy
    depends_on: # The service should only start after the following services
      - mariadb0 # mariadb0 service
    environment:
      - PORT=3000
      # Next we forward the connection variables
      - MARIADB_ROOT_PASSWORD=value0
      - MARIADB_USER=value1
      - MARIADB_PASSWORD=value2
      - MARIADB_DATABASE=value3
  postgres0:
    type: mariadb
    size: mili
    active: true
    version: latest
    environment:
      # Variables for initializing the database
      - MARIADB_ROOT_PASSWORD=value0
      - MARIADB_USER=value1
      - MARIADB_PASSWORD=value2
      - MARIADB_DATABASE=value3
```

> The database host will be accessible in the application container via the environment variable `[SERVICE_NAME]_HOST`, for example for the service `mariadb0` the name of the host variable inside the container that references this service via `depends_on` will be `MARIADB0_HOST`

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Continue studying

[Hosting Python Mysql <<<](./HostingPythonMysql.md) | [>>> Hosting Python Mongo](./HostingPythonMongo.md)
