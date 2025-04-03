# List of changes

**4.3.7-IN-PROGRESS**

- `[Core]` Fixed a bug when using `restart: no` (services.service.deploy.labels.restart must be a string, number or null)
- `[Core,Server]` Fixed erroneous stopping of service when it failed to start several times before the service with `restart: no` it depends on finished its work
- `[Website,API-Websocket]` Added the ability to include time when receiving service logs
- `[Server]` Fixed a bug with incorrect cost calculation, eliminated the possibility of calculating cost for duplicate containers that completed work with an error

**4.3.6-02.04.2025**

- `[Extension]` Fixed documentation link for `service.volumes` field
- `[Documentation]` Fixed description of volume connection [see](./ConfigFile.md#service-volumes)
- `[Server]` Fixed a bug where the service would not restart when pushing to git if `pwd` referenced './'
- `[Extension,Core,Server]` The `no_restart` property has been removed and the `restart` property has been added instead [see](./ConfigFile.md#service-restart)
- `[Extension]` Fixed errors of impossibility to use `-` in the project name and impossibility to create a custom service without external ports
- `[Documentation]` Rewritten usage of `no_restart` to `restart` [see](./ConfigFile.md#service-restart)
- `[Website,Documentation]` Added an example for running `Next.js` application with assembly in a separate temporary service
- `[Website]` Fixed scrolling when clicking on a link on [Documentation](./ConfigFile.md) pages, when it scrolled and selected either the link itself or other such links, but not the target anchor

**4.3.5-27.03.2025**

- `[Extension]` Fixed a false warning that the value passed to `domains` supposedly has no effect
- `[Extension]` Fixed the indication of field types on hover. Previously, everything was indicated by [string]
- `[Extension,Core]` Added additional checks and hints when creating `domains`
- `[Core]` Balanced CPU limit for medium containers
- `[Core]` Fixed redirect to domain with `www.` prefix
- `[Core]` Prevented service restart if files were not changed during `deploy` command
- `[Server]` Fixed false positive of service crash during restart, which led to unreasonable or premature stop of attempts to start the service
- `[Website]` Fixed CPU usage graph on the service page
- `[Documentation]` Added warning about additional DNS A record when using a custom domain [see](./ConfigFile.md##custom-domain)

**4.3.4-21.03.2025**

- `[Extension,Core]` Fixed error when creating `volumes` starting with 'https://'
- `[API]` Fixed error when changing environment variable
- `[Server]` Fixed execution of console commands in administration services when at startup console shell tried to go to a non-existent folder `/home/app`
- `[Server]` Added error output when executing console commands
- `[Website]` Changed the color of the active theme in light mode
- `[Website]` Fixed incorrect formation of the link to change the language in the documentation

**4.3.3-03/18/2025**

- `[Extension,Core]` Fixed an error when creating a custom container, when it did not allow creating without `pwd`
- `[Extension]` Fixed incorrect operation of hints when creating global `volumes`
- `[Extension,Core]` The `pwd` field is made optional for a service with a `custom` image
- `[Website]` Fixed pressing Enter in a mobile browser when working in the console
- `[API,Website]` Added registration and login methods via Yandex and Google

**4.3.2-03/11/2025**

- `[Extension]` Fixed error saving local volume in configuration file
- `[Core,Server]` Prevented deleting service from database if it could not be deleted from server

**4.3.0-04.03.2025**

- `[Extension,Core]` Added local volumes [see](./ConfigFile.md#volumes)
- `[Documentation]` Added a list of changes by versions
