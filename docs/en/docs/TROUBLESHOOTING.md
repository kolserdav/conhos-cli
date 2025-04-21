# Known issues

### Command execution fails with an error in the console or browser

---

```sh
rpc error: code = Unknown desc = update out of sequence
```

#### What happened:

The order of versions is broken when updating the service, occurs when the previous update was interrupted.

#### How to fix:

Usually it is enough to **run the `deploy` command again**

> If this event occurs on an event from Git in the case when one repository is specified for two different services of one project. For example, one is a worker, and the other is a service for assembly. Then this can be ignored, because it means another service, dependent on this repository, is already building the Docker stack.

---

```sh
Error response from daemon: service '[id]' not found
```

#### What happened:

When updating the service, the script cannot find the service by ID. This means that during the update the service was blocked due to exceeding the disk storage limit or for another reason, [see notifications](/notifications).

#### How to fix:

Increase the limit and **run the `deploy` command again**.

---

```sh
error: [cloud] One user can run only one instance of the program at the same time End another instance and try again
```

#### What happened:

Attempt to run a second instance of the program in another window

#### How to fix:

In another browser or console window, close the instance of the program executing the commands: `deploy`, `logs` or `exec`.

> If something happens that you are absolutely sure you don't have any windows open, but it still happens. Then the process on the server probably froze. If this is still observed an hour after the incident [write to us](/contacts).

---
