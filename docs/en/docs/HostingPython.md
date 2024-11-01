# Hosting Python

## Links

- [Python with database Redis](./HostingPythonRedis.md)  
- [Python with database Postgres](./HostingPythonPostgres.md)  
- [Python with database Mysql](./HostingPythonMysql.md)  
- [Python with database Mariadb](./HostingPythonMariadb.md)  
- [Python with database Mongo](./HostingPythonMongo.md)  
- [Python with database Rabbitmq](./HostingPythonRabbitmq.md)  


To host an application on Container Hosting `Python`, you must complete the following three steps.

## 1. Installing the project management utility

If you installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If not installed, then use [Instructions](./GettingStarted.md#introduction) to install.

## 2. Create a configuration file

Configuration file for creating the `Python` service in Container Hosting. More details in [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Python` container in the [official Python repository](https://hub.docker.com/_/python/tags)

```yml
name: my-awesome-project
services:
  python0:
    image: python
    size: mili
    active: true
    pwd: examples/python
    exclude:
      - venv
    version: latest
    command: pip install -r requirements.txt && python main.py
    ports:
      - port: 3000
        type: http
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

[Hosting Python Mongo <<<](./HostingPythonMongo.md) | [>>> Hosting Python Redis](./HostingPythonRedis.md)
