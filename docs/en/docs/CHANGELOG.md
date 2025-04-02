# List of changes

**4.3.6-IN PROGRESS**

- `[Extension]` Fixed documentation link for `service.volumes` field
- `[Documentation]` Fixed description of volume connection [see](./ConfigFile.md#service-volumes)
- `[Server]` Fixed a bug where the service would not restart when pushing to git if `pwd` referenced './'
- `[Extension,Core,Server]` The `no_restart` property has been removed and the `restart` property has been added instead [see](./ConfigFile.md#service-restart)

**4.3.5-27.03.2025**

- `[Extension]` Fixed a false warning that the value passed to `domains` supposedly has no effect
- `[Extension]` Fixed the indication of field types on hover. Previously, everything was indicated by [string]
- `[Extension,Core]` Added additional checks and hints when creating `domains`
- `[Core]` Balanced CPU limit for medium containers
- `[Core]` Fixed redirect to domain with `www.` prefix
- `[Core]` Prevented service restart if files were not changed during `deploy` command
- `[Server]` Fixed false positive of service crash during restart, which led to unreasonable or premature stop of attempts to start the service
- `[Site]` Fixed CPU usage graph on the service page
- `[Documentation]` Added warning about additional DNS A record when using a custom domain [see](./ConfigFile.md##custom-domain)

**4.3.4-21.03.2025**

- `[Extension,Core]` Fixed error when creating `volumes` starting with 'https://'
- `[API]` Fixed error when changing environment variable
- `[Server]` Fixed execution of console commands in administration services when at startup console shell tried to go to a non-existent folder `/home/app`
- `[Server]` Added error output when executing console commands
- `[Site]` Changed the color of the active theme in light mode
- `[Site]` Fixed incorrect formation of the link to change the language in the documentation

**4.3.3-03/18/2025**

- `[Extension,Core]` Fixed an error when creating a custom container, when it did not allow creating without `pwd`
- `[Extension]` Fixed incorrect operation of hints when creating global `volumes`
- `[Extension,Core]` The `pwd` field is made optional for a service with a `custom` image
- `[Site]` Fixed pressing Enter in a mobile browser when working in the console
- `[API,Site]` Added registration and login methods via Yandex and Google

**4.3.2-03/11/2025**

- `[Extension]` Fixed error saving local volume in configuration file
- `[Core,Server]` Prevented deleting service from database if it could not be deleted from server

**4.3.0-04.03.2025**

- `[Extension,Core]` Added local volumes [see](./ConfigFile.md#volumes)
- `[Documentation]` Added a list of changes by versions
