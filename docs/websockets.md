Websocket Support
---

http://caniuse.com/#feat=websockets

Desktop | Works? | Notes
--------|--------|------
Firefox (Current       | Full        | Seems to work fine.
Chrome  (Current)      | Full        | Seems to work fine.
Internet Explorer (11) | Mostly      | Doesn't appear to always run ws.onopen until after it has been closed, so using that may be unreliable for connection checking
Internet Explorer (10) | Unknown     | Can I Use says it supports websockets, but haven't confirmed
Internet Explorer (9)  | Unsupported | Can I use says it doesn't support websockets.

Mobile | Works? | Notes
-------|--------|------
Chrome (Current)     | Unknown | Should be supported, but untested.
Firefox (Current)    | Unknown | Should be supported, but untested
iOS Safari (Current) | Unknown | Should be supported, but untested (And I don't have an iOS device)