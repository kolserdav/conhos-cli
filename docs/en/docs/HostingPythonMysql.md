# Hosting Python with Mysql

To host `Python` on Container Hosting and connect to the `Mysql` database from it, you need to complete the following three steps.

## 1. Installing the project management utility

> If your project files are in a Git repository, then installing the utility is not necessary, since you can run the project from the browser.

If you have installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If you have not installed it, then use the [Instructions](./GettingStarted.md) to install it.

## 2. Creating a configuration file

> If your project files are in a Git repository, you can create a configuration file from your browser.

Configuration file for creating a `Python` service in Container Hosting with a `Mysql` database server running and connecting to it from an application, and an optional example of updating `Adminer` to administer the database. More details in the [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Mysql` container in the [official Mysql repository](https://hub.docker.com/_/mysql/tags)

```yml
name: my-python-mysql-project
services:
  python1:
    image: python
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/python-mysql
    exclude:
      - venv
    command: pip install -r requirements.txt && python main.py
    ports:
      - port: 3000
        type: proxy
    depends_on: # The service should only start after the following services
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
```

> The database host will be accessible in the application container via the environment variable `[SERVICE_NAME]_HOST`, for example for the service `mysql0` the name of the host variable inside the container that references this service via `depends_on` will be `MYSQL0_HOST`

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Continue studying

[Hosting Python Postgres <<<](./HostingPythonPostgres.md) | [>>> Hosting Python Mariadb](./HostingPythonMariadb.md)
