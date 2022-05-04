# Understanding React’s `renderToPipeableStream()`

Link to [`renderToPipeableStream()` documentation](https://reactjs.org/docs/react-dom-server.html#rendertopipeablestream)

- No Suspending
    - ✅ Client-side JavaScript
        1. `onShellReady()` and start piping
        1. `onAllReady()`
        1. stream closed with no error
        1. writes 41 bytes
        ```html
        <!DOCTYPE html><html><head></head></html>
        ```
    - ❌ No client-side JavaScript
        1. `onShellReady()`
        1. `onAllReady()` and start piping
        1. stream closed with no error
        1. writes 41 bytes
        ```html
        <!DOCTYPE html><html><head></head></html>
        ```
- `<App>` throws errors
    - ✅ Client-side JavaScript
        1. `onError(error)`
        1. `onShellError(error)`
        1. stream closed with no error
        1. no bytes written
    - ❌ No client-side JavaScript
        1. `onError(error)`
        1. `onShellError(error)`
        1. `onAllReady()` and start piping
        1. stream closed with ⚠️ error
        1. no bytes written
- Suspends and resource succeeds
    - ✅ Client-side JavaScript
        1. `onShellReady()`
        1. `onAllReady()` and start piping
        1. stream closed with no error
        1. writes 605 bytes:
        ```html
        <!DOCTYPE html><html><head></head><!--$?--><template id="B:0"></template><p>Waiting</p><!--/$--></html><div hidden id="S:0"><p>Resource loaded</p></div><script>function $RC(a,b){a=document.getElementById(a);b=document.getElementById(b);b.parentNode.removeChild(b);if(a){a=a.previousSibling;var f=a.parentNode,c=a.nextSibling,e=0;do{if(c&&8===c.nodeType){var d=c.data;if("/$"===d)if(0===e)break;else e--;else"$"!==d&&"$?"!==d&&"$!"!==d||e++}d=c.nextSibling;f.removeChild(c);c=d}while(c);for(;b.firstChild;)f.insertBefore(b.firstChild,c);a.data="$";a._reactRetry&&a._reactRetry()}};$RC("B:0","S:0")</script>
        ```
    - ❌ No client-side JavaScript
- Suspends and `<Loader>` throws errors
    - ✅ Client-side JavaScript
    - ❌ No client-side JavaScript
- Suspends and resource rejects with error
    - ✅ Client-side JavaScript
    - ❌ No client-side JavaScript

```
----

# Shell () #
- CALLBACK: SHELL READY
    - PIPE STREAM in SHELL READY
- CALLBACK: ALL READY
- Writable FINAL
- Writable DESTROY undefined

Output 41 bytes
<!DOCTYPE html><html><head></head></html>

+ resolving: Resource loaded

----

# NoScript () #
- CALLBACK: SHELL READY
- CALLBACK: ALL READY
    - PIPE STREAM in ALL READY
- Writable FINAL
- Writable DESTROY undefined

Output 41 bytes
<!DOCTYPE html><html><head></head></html>

+ resolving: Resource loaded

----

# Shell (ErrorsInRootComponent) #
- CALLBACK: ERROR[ Failed In App ]
- CALLBACK: SHELL_ERROR[ Failed In App ]
- Writable FINAL
- CALLBACK: ALL READY
- Writable DESTROY undefined

Output 0 bytes


+ resolving: Resource loaded

----

# NoScript (ErrorsInRootComponent) #
- CALLBACK: ERROR[ Failed In App ]
- CALLBACK: SHELL_ERROR[ Failed In App ]
- Writable FINAL
- CALLBACK: ALL READY
    - PIPE STREAM in ALL READY
- Writable DESTROY Failed In App
- OUTPUT DID ERROR: Failed In App

Output 0 bytes


+ resolving: Resource loaded

----

# Shell (Suspends) #
- CALLBACK: SHELL READY
    - PIPE STREAM in SHELL READY
+ resolving: Resource loaded
- CALLBACK: ALL READY
- Writable FINAL
- Writable DESTROY undefined

Output 605 bytes
<!DOCTYPE html><html><head></head><!--$?--><template id="B:0"></template><p>Waiting</p><!--/$--></html><div hidden id="S:0"><p>Resource loaded</p></div><script>function $RC(a,b){a=document.getElementById(a);b=document.getElementById(b);b.parentNode.removeChild(b);if(a){a=a.previousSibling;var f=a.parentNode,c=a.nextSibling,e=0;do{if(c&&8===c.nodeType){var d=c.data;if("/$"===d)if(0===e)break;else e--;else"$"!==d&&"$?"!==d&&"$!"!==d||e++}d=c.nextSibling;f.removeChild(c);c=d}while(c);for(;b.firstChild;)f.insertBefore(b.firstChild,c);a.data="$";a._reactRetry&&a._reactRetry()}};$RC("B:0","S:0")</script>


----

# NoScript (Suspends) #
- CALLBACK: SHELL READY
+ resolving: Resource loaded
- CALLBACK: ALL READY
    - PIPE STREAM in ALL READY
- Writable FINAL
- Writable DESTROY undefined

Output 80 bytes
<!DOCTYPE html><html><head></head><!--$--><p>Resource loaded</p><!--/$--></html>


----

# Shell (Suspends | ErrorsInSuspendedComponent) #
- CALLBACK: ERROR[ Failed In Loader ]
- CALLBACK: SHELL READY
    - PIPE STREAM in SHELL READY
- CALLBACK: ALL READY
- Writable FINAL
- Writable DESTROY undefined

Output 73 bytes
<!DOCTYPE html><html><head></head><!--$!--><p>Waiting</p><!--/$--></html>

+ resolving: Resource loaded

----

# NoScript (Suspends | ErrorsInSuspendedComponent) #
- CALLBACK: ERROR[ Failed In Loader ]
- CALLBACK: SHELL READY
- CALLBACK: ALL READY
    - PIPE STREAM in ALL READY
- Writable FINAL
- Writable DESTROY undefined

Output 73 bytes
<!DOCTYPE html><html><head></head><!--$!--><p>Waiting</p><!--/$--></html>

+ resolving: Resource loaded

----

# Shell (Suspends | ResourceFails) #
- CALLBACK: SHELL READY
    - PIPE STREAM in SHELL READY
+ rejecting: Error: Resource failed to load
    at Timeout._onTimeout (file:///Users/pgwsmith/Royal%20Icing/renderToPipeableStreamPlayground/index.mjs:117:23)
    at listOnTimeout (node:internal/timers:559:17)
    at processTimers (node:internal/timers:502:7)
- CALLBACK: ERROR[ Resource failed to load ]
- CALLBACK: ALL READY
- Writable FINAL
- Writable DESTROY undefined

Output 242 bytes
<!DOCTYPE html><html><head></head><!--$?--><template id="B:0"></template><p>Waiting</p><!--/$--></html><script>function $RX(a){if(a=document.getElementById(a))a=a.previousSibling,a.data="$!",a._reactRetry&&a._reactRetry()};$RX("B:0")</script>


----

# NoScript (Suspends | ResourceFails) #
- CALLBACK: SHELL READY
+ rejecting: Error: Resource failed to load
    at Timeout._onTimeout (file:///Users/pgwsmith/Royal%20Icing/renderToPipeableStreamPlayground/index.mjs:117:23)
    at listOnTimeout (node:internal/timers:559:17)
    at processTimers (node:internal/timers:502:7)
- CALLBACK: ERROR[ Resource failed to load ]
- CALLBACK: ALL READY
    - PIPE STREAM in ALL READY
- Writable FINAL
- Writable DESTROY undefined
```