# Hosting ${{NAME}}

## Links

${{LINKS}}

To host an application on Container Hosting `${{NAME}}`, you must complete the following three steps.

## 1. Installing the project management utility

> If your project files are in a Git repository, then installing the utility is not necessary, since you can run the project from the browser.

If you installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If not installed, then use [Instructions](./GettingStarted.md#introduction) to install.

## 2. Create a configuration file

> If your project files are in a Git repository, you can create a configuration file from your browser.

Configuration file for creating the `${{NAME}}` service in Container Hosting. More details in [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `${{NAME}}` container in the [official ${{NAME}} repository](${{HUB}}${{TYPE}}/tags)

```yml
name: my-awesome-project
services:
  ${{TYPE}}0:
    image: ${{TYPE}}
    size: mili
    active: true
    pwd: examples/${{TYPE}}
    exclude:
      - ${{EXCLUDE}}
    version: latest
    command: ${{COMMAND}}
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

[${{BACK_LINK_NAME}} <<<](${{BACK_LINK}}) | [>>> ${{FORWARD_LINK_NAME}}](${{FORWARD_LINK}})
