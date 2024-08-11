# Hosting Python with Mongo

To host `Python` on Container Hosting and connect to the `Mongo` database from it, you need to complete the following three steps.

## 1. Installing the project management utility

If you have installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If you have not installed it, then use the [Instructions](./GettingStarted.md) to install it.

## 2. Creating a configuration file

Configuration file for creating a `Python` service in Container Hosting with a `Mongo` database server running and connecting to it from an application, and an optional example of updating `Adminer` to administer the database. More details in the [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Mongo` container in the [official Mongo repository](https://hub.docker.com/_/mongo/tags)

```yml
name: name-of-project
services:
  python1:
    type: python
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/python-mongo
    exclude:
      - venv
    command: pip install -r requirements.txt && python main.py
    ports:
      - port: 3000
        type: http
    depends_on: # Specify that the service should have internal links to
      - mongo0 # mongo0 service
    environment:
      - PORT=3000
      # Next we forward the connection variables
      - MONGO_INITDB_ROOT_USERNAME=value0
      - MONGO_INITDB_ROOT_PASSWORD=value1
  postgres0:
    type: mongo
    size: mili
    active: true
    version: latest
    environment:
      # Variables for initializing the database
      - MONGO_INITDB_ROOT_USERNAME=value0
      - MONGO_INITDB_ROOT_PASSWORD=value1
```

> The database host will be accessible in the application container via the environment variable `[SERVICE_NAME]_HOST`, for example for the service `mongo0` the name of the host variable inside the container that references this service via `depends_on` will be `MONGO0_HOST`

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Continue studying

<div style="display: flex; flex-direction: row; justify-content: space-around;"><span>[Hosting Python Mariadb <<<](./HostingPythonMariadb.md)</span> <span>|</span> <span>[>>> Hosting Python Rabbitmq](./HostingPythonRabbitmq.md)</span></div>
