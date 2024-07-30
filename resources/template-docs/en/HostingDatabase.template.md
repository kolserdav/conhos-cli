# Hosting ${{NAME}} with ${{DATABASE_NAME}}

To host `${{NAME}}` on Container Hosting and connect to the `${{DATABASE_NAME}}` database from it, you need to complete the following three steps.

## 1. Installing the project management utility

If you have installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If you have not installed it, then use the [Instructions](./GettingStarted.md) to install it.

## 2. Creating a configuration file

Configuration file for creating a `${{NAME}}` service in Container Hosting with a `${{DATABASE_NAME}}` database server running and connecting to it from an application, and an optional example of updating `Adminer` to administer the database. More details in the [Configuration File](./ConfigFile.md).

> Check the current version of the `${{DATABASE_NAME}}` container in the [official ${{DATABASE_NAME}} repository](${{HUB}}${{DATABASE}}/tags)

```yml
name: name-of-project
services:
  ${{TYPE}}1:
    type: ${{TYPE}}
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/${{TYPE}}-${{DATABASE}}
    exclude:
      - ${{EXCLUDE}}
    command: ${{COMMAND}}
    ports:
      - port: 3000
        type: http
    depends_on: # Specify that the service should have internal links to
      - ${{DATABASE}}0 # ${{DATABASE}}0 service
    environment:
      - PORT=3000
      # Next we forward the connection variables
      - ${{DATABASE_UPPERCASE}}0_USER=user
      - ${{DATABASE_UPPERCASE}}0_PASSWORD=password
      - ${{DATABASE_UPPERCASE}}0_DB=db_name
  postgres0:
    type: ${{DATABASE}}
    size: mili
    active: true
    version: latest
    environment:
      # Variables for initializing the database
      - ${{DATABASE_UPPERCASE}}_USER=user
      - ${{DATABASE_UPPERCASE}}_PASSWORD=password
      - ${{DATABASE_UPPERCASE}}_DB=db_name
  adminer0:
    type: adminer
    size: pico
    active: true
    version: latest
    depends_on:
      - ${{DATABASE}}0
```

> The database host will be accessible in the application container via the environment variable `[SERVICE_NAME]_HOST`, for example for the service `${{DATABASE}}0` the name of the host variable inside the container that references this service via `depends_on` will be `${{DATABASE_UPPERCASE}}0_HOST`

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```
