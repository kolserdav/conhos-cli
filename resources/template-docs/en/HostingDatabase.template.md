# Hosting ${{NAME}} with database ${{DATABASE_NAME}}

If your application needs to run in conjunction with a database server, you can also start the database server and connect to it from your application. Also, if you need a DBMS web panel to manage your database, it can also be connected as a separate service.

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
    size: mili
    active: true
    version: 4.8.1-standalone
    depends_on:
      - ${{DATABASE}}0
```

> The database host will be accessible in the application container by the environment variable `[SERVICE_TYPE]_HOST`, for example for the `${{DATABASE}}` database the name of the host variable will be `${{DATABASE_UPPERCASE}}_HOST`
