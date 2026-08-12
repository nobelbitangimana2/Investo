# Messages

Copy `en.json` and `fr.json` from `../frontend/messages/` into this folder.

```
copy ..\frontend\messages\en.json en.json
copy ..\frontend\messages\fr.json fr.json
```

These files are shared between the web frontend and mobile app.
The mobile i18n system (lib/i18n.ts) loads them with `require()`.
