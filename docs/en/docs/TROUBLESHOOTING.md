# Known issues

### Running 'deploy' command fails with an error in console or browser

---

```sh
rpc error: code = Unknown desc = update out of sequence
```

The order of versions is broken when updating the service, occurs when the previous update was interrupted.
To fix it, it is usually enough to **run the `deploy` command again**

---
