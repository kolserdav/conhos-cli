# Hosting Python with database Mariadb

If your application needs to run in conjunction with a database server, you can also start the database server and connect to it from your application. Also, if you need a DBMS web panel to manage your database, it can also be connected as a separate service.

> Check the current version of the `Mariadb` container in the [official Mariadb repository](https://hub.docker.com/_/mariadb/tags)

```yml
name: name-of-project
services:
  python1:
    type: python
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/python-mariadb
    exclude:
      - venv
    command: pip install -r requirements.txt && python main.py
    ports:
      - port: 3000
        type: http
    depends_on: # Specify that the service should have internal links to
      - mariadb0 # mariadb0 service
    environment:
      - PORT=3000
      # Next we forward the connection variables
      - MARIADB0_USER=user
      - MARIADB0_PASSWORD=password
      - MARIADB0_DB=db_name
  postgres0:
    type: mariadb
    size: mili
    active: true
    version: latest
    environment:
      # Variables for initializing the database
      - MARIADB_USER=user
      - MARIADB_PASSWORD=password
      - MARIADB_DB=db_name
  adminer0:
    type: adminer
    size: mili
    active: true
    version: 4.8.1-standalone
    depends_on:
      - mariadb0
```

> The database host will be accessible in the application container by the environment variable `[SERVICE_TYPE]_HOST`, for example for the `mariadb` database the name of the host variable will be `MARIADB_HOST`
