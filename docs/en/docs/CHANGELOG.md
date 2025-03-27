# List of changes

**4.3.5-27.03.2025**

- Fixed a false warning in the extension that the value passed to `domains` supposedly has no effect
- Fixed the indication of field types when hovering in the extension. Previously, everything was indicated by [string]
- Added additional checks and hints to the extension when creating `domains`

**4.3.4-21.03.2025**

- Fixed a bug when creating `volumes` starting with 'https://'

**4.3.3-18.03.2025**

- Fixed a bug when creating a custom container, when it did not allow creating without `pwd`
- Fixed incorrect operation of extension hints when creating global `volumes`

**4.3.2-11.03.2025**

- Fixed error saving local volume in configuration file

**4.3.0-04.03.2025**

- Added local volumes [see](https://conhos.ru/docs/ConfigFile.md#volumes)
