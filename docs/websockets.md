Websocket Support
---

http://caniuse.com/#feat=websockets

Browser | Works? | Notes
---------------
Firefox (Desktop, Current)      | Full        | Seems to work fine.
Chrome  (Desktop, Current)      | Full        | Seems to work fine.
Internet Explorer (Desktop, 11) | Mostly      | Doesn't appear to always run ws.onopen until after it has been closed, so using that may be unreliable for connection checking
Internet Explorer (Desktop, 10) | Unknown     | Can I Use says it supports websockets, but haven't confirmed
Internet Explorer (Desktop, 9)  | Unsupported | Can I use says it doesn't support websockets.

Chrome (Mobile, Current)     | Unknown | Should be supported, but untested.
Firefox (Mobile, Current)    | Unknown | Should be supported, but untested
iOS Safari (Mobile, Current) | Unknown | Should be supported, but untested (And I don't have an iOS device)