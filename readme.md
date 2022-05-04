# Understanding React’s `renderToPipeableStream()`

Link to [`renderToPipeableStream()` documentation](https://reactjs.org/docs/react-dom-server.html#rendertopipeablestream)

---

```js
function App({ resource, suspends }) {
  return (
    <html>
      <head />
      {suspends ? (
        <Suspense fallback={<p>Waiting</p>}>
          <Loader />
        </Suspense>
      ) : null}
    </html>
  );
}

function Loader({ resource }) {
  const value = useResource(resource);
  return <p>{value}</p>;
}

const resource = …
ReactDOMServer.renderToPipeableStream(<App resource={resource} suspends={…} />);
```

---

- No Suspending
  - ✅ Client-side JavaScript
    1. `onShellReady()` and start piping
    1. `onAllReady()`
    1. stream closed with no error
    1. writes static html:
    ```html
    <!DOCTYPE html>
    <html>
      <head></head>
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
    </html>
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
    1. `onShellReady()` and start piping
    1. `onAllReady()`
    1. stream closed with no error
    1. writes html with `<script>`
    ```html
    <!DOCTYPE html>
    <html>
      <head></head
      ><!--$?--><template id="B:0"></template>
      <p>Waiting</p>
      <!--/$-->
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
      <head></head
      ><!--$-->
      <p>Resource loaded</p>
      <!--/$-->
    </html>
    ```
- Suspends and `<Loader>` throws error
  - ✅ Client-side JavaScript
    1. `onError(error)`
    1. `onShellReady()` and start piping
    1. `onAllReady()`
    1. stream closed with no error
    1. writes static html:
    ```html
    <!DOCTYPE html>
    <html>
      <head></head
      ><!--$!-->
      <p>Waiting</p>
      <!--/$-->
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
      <head></head
      ><!--$!-->
      <p>Waiting</p>
      <!--/$-->
    </html>
    ```
- Suspends and resource rejects with error
  - ✅ Client-side JavaScript
    1. `onShellReady()` and start piping
    1. `onError(error)`
    1. `onAllReady()`
    1. stream closed with no error
    1. writes html with `<script>`:
    ```html
    <!DOCTYPE html>
    <html>
      <head></head
      ><!--$?--><template id="B:0"></template>
      <p>Waiting</p>
      <!--/$-->
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
      <head></head
      ><!--$!-->
      <p>Waiting</p>
      <!--/$-->
    </html>
    ```

```

## TODO

- Add Error Boundary and see how that changes behavior
```
