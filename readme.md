# Understanding React’s `renderToPipeableStream()`

Read the [`renderToPipeableStream()` documentation](https://reactjs.org/docs/react-dom-server.html#rendertopipeablestream)

I made this so I could understand how it works enough to improve the documentation [(see PR)](https://github.com/reactjs/reactjs.org/pull/4623)

---

```js
function App({ resource, suspends }) {
  return (
    <html>
      <head />
      <body>
        {suspends ? (
          <Suspense fallback={<p>Loading</p>}>
            <Loader />
          </Suspense>
        ) : (
          <p>Static content</p>
        )}
      </body>
    </html>
  );
}

function Loader({ resource }) {
  const value = useResource(resource);
  return <p>{value}</p>;
}

const resource = createResource();
ReactDOMServer.renderToPipeableStream(
  <App resource={resource} suspends={suspends} />
);
```

---

What happens when? —

- When we have just static content (no Suspense)
  - ✅ Client-side JavaScript
    1. `onShellReady()` and start piping
    1. `onAllReady()`
    1. stream closed with no error
    1. writes static html:
    ```html
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <p>Static content</p>
      </body>
    </html>
    ```
  - ❌ No client-side JavaScript
    1. `onShellReady()`
    1. `onAllReady()` and start piping
    1. stream closed with no error
    1. writes static html:
    ```html
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <p>Static content</p>
      </body>
    </html>
    ```
- When `<App>` throws an error
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
- When content suspends on a resource that succeeds
  - ✅ Client-side JavaScript
    1. `onShellReady()` and start piping
    1. `onAllReady()`
    1. stream closed with no error
    1. writes html with `<script>`
    ```html
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <!--$?--><template id="B:0"></template>
        <p>Loading</p>
        <!--/$-->
      </body>
    </html>
    <div hidden id="S:0"><p>Resource loaded</p></div>
    <script>
      function $RC(a, b) {
        a = document.getElementById(a);
        b = document.getElementById(b);
        b.parentNode.removeChild(b);
        if (a) {
          a = a.previousSibling;
          var f = a.parentNode,
            c = a.nextSibling,
            e = 0;
          do {
            if (c && 8 === c.nodeType) {
              var d = c.data;
              if ("/$" === d)
                if (0 === e) break;
                else e--;
              else ("$" !== d && "$?" !== d && "$!" !== d) || e++;
            }
            d = c.nextSibling;
            f.removeChild(c);
            c = d;
          } while (c);
          for (; b.firstChild; ) f.insertBefore(b.firstChild, c);
          a.data = "$";
          a._reactRetry && a._reactRetry();
        }
      }
      $RC("B:0", "S:0");
    </script>
    ```
  - ❌ No client-side JavaScript
    1. `onShellReady()`
    1. `onAllReady()` and start piping
    1. stream closed with no error
    1. writes static html:
    ```html
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <!--$-->
        <p>Resource loaded</p>
        <!--/$-->
      </body>
    </html>
    ```
- When content suspends and `<Loader>` throws error
  - ✅ Client-side JavaScript
    1. `onError(error)`
    1. `onShellReady()` and start piping
    1. `onAllReady()`
    1. stream closed with no error
    1. writes static html:
    ```html
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <!--$!-->
        <p>Loading</p>
        <!--/$-->
      </body>
    </html>
    ```
  - ❌ No client-side JavaScript
    1. `onError(error)`
    1. `onShellReady()`
    1. `onAllReady()` and start piping
    1. stream closed with no error
    1. writes static html:
    ```html
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <!--$!-->
        <p>Loading</p>
        <!--/$-->
      </body>
    </html>
    ```
- When content suspends on a resource that errors
  - ✅ Client-side JavaScript
    1. `onShellReady()` and start piping
    1. `onError(error)`
    1. `onAllReady()`
    1. stream closed with no error
    1. writes html with `<script>`:
    ```html
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <!--$?--><template id="B:0"></template>
        <p>Loading</p>
        <!--/$-->
      </body>
    </html>
    <script>
      function $RX(a) {
        if ((a = document.getElementById(a)))
          (a = a.previousSibling),
            (a.data = "$!"),
            a._reactRetry && a._reactRetry();
      }
      $RX("B:0");
    </script>
    ```
  - ❌ No client-side JavaScript
    1. `onShellReady()`
    1. `onError(error)`
    1. `onAllReady()` and start piping
    1. stream closed with no error
    1. writes static html:
    ```html
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <!--$!-->
        <p>Loading</p>
        <!--/$-->
      </body>
    </html>
    ```

```

## TODO

- Add Error Boundary and see how that changes behavior
```
