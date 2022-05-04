import { strict as assert } from "node:assert";
import { Writable } from "node:stream";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { Future } from "./future.mjs";
import { Resource, useResource } from "./resource.mjs";

// const { Writable } = require("stream");
// const React = require("react");
// const ReactDOMServer = require("react-dom/server");

const h = React.createElement;

class WritableBuffer extends Writable {
  constructor(options) {
    // Calls the stream.Writable() constructor.
    super(options);
    this.chunks = [];
    this.doneFuture = new Future();
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(chunk);
    callback();
  }

  _final(callback) {
    console.log("- Writable FINAL")
    callback();
    this.doneFuture.resolve();
  }

  _destroy(error, callback) {
    console.log("- Writable DESTROY", error?.message);
    callback(error);
    this.doneFuture.resolve();
  }

  toString() {
    return Buffer.concat(this.chunks).toString("utf8");
  }

  get done() {
    return this.doneFuture.promise;
  }
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class Flags {
  static Suspends = Symbol("Suspends");
  static ErrorsInRootComponent = Symbol("ErrorsInRootComponent");
  static ErrorsInSuspendedComponent = Symbol("ErrorsInSuspendedComponent");
  static ResourceFails = Symbol("ResourceFails");

  constructor(enabled = []) {
    this.set = new Set(enabled);
    Object.freeze(this);
  }

  get suspends() {
    return this.set.has(Flags.Suspends);
  }
  get errorsInRootComponent() {
    return this.set.has(Flags.ErrorsInRootComponent);
  }
  get errorsInSuspendedComponent() {
    return this.set.has(Flags.ErrorsInSuspendedComponent);
  }
  get resourceFails() {
    return this.set.has(Flags.ResourceFails);
  }

  toString() {
    return `(${Array.from(this.set, symbol => symbol.description).join(" | ")})`;
  }
}

function App({ flags, resource }) {
  if (flags.errorsInRootComponent) {
    throw Error("Failed In App");
  }

  return h(
    "html",
    null,
    h("head", null),
    flags.suspends
      ? h(
          React.Suspense,
          { fallback: h("p", null, "Waiting") },
          h(Loader, { resource, flags })
        )
      : null
  );
}

function Loader({ resource, flags }) {
  if (flags.errorsInSuspendedComponent) {
    throw Error("Failed In Loader");
  }

  const value = useResource(resource);
  return h("p", null, value);
}

function makeRoot(flags, resource) {
  const element = h(App, { flags, resource });

  // Some time in the future the resource is ready…
  setTimeout(() => {
    if (flags.resourceFails) {
      resource.reject(Error("Resource failed to load"));
    } else {
      resource.resolve("Resource loaded");
    }
  }, 5);

  return element;
}

class ClientMode {
  static Shell = Symbol("Shell");
  static NoScript = Symbol("NoScript");
}

async function render(flags, clientMode) {
  console.log();
  console.log("----");
  console.log();
  console.log("#", clientMode.description, `${flags}`, "#");

  const destination = new WritableBuffer();

  destination.once('error', (error) => {
    console.log("- OUTPUT DID ERROR:", error.message);
  });

  const resource = new Resource();
  const stream = ReactDOMServer.renderToPipeableStream(makeRoot(flags, resource), {
    onShellReady() {
      console.log("- CALLBACK: SHELL READY");
      if (clientMode === ClientMode.Shell) {
        console.log("    - PIPE STREAM in SHELL READY");
        stream.pipe(destination);
      }
    },
    onShellError(error) {
      console.error("- CALLBACK: SHELL_ERROR[", error.message, "]");
      destination.end();
    },
    onError(error) {
      console.error("- CALLBACK: ERROR[", error.message, "]");
    },
    onAllReady() {
      console.log("- CALLBACK: ALL READY");
      if (clientMode === ClientMode.NoScript) {
        console.log("    - PIPE STREAM in ALL READY");
        stream.pipe(destination);
      }
    },
  });

  await destination.done;

  const output = destination.toString();
  console.log()
  console.log(`Output ${output.length} bytes`);
  console.log(output);
  console.log();

  await resource.promise.catch(() => null);
}

async function main() {
  const interval = setInterval(() => {}, 1000 * 60 * 60);

  await render(new Flags([]), ClientMode.Shell);
  await render(new Flags([]), ClientMode.NoScript);
  await render(new Flags([Flags.ErrorsInRootComponent]), ClientMode.Shell);
  await render(new Flags([Flags.ErrorsInRootComponent]), ClientMode.NoScript);
  await render(new Flags([Flags.Suspends]), ClientMode.Shell);
  await render(new Flags([Flags.Suspends]), ClientMode.NoScript);
  await render(new Flags([Flags.Suspends, Flags.ErrorsInSuspendedComponent]), ClientMode.Shell);
  await render(new Flags([Flags.Suspends, Flags.ErrorsInSuspendedComponent]), ClientMode.NoScript);
  await render(new Flags([Flags.Suspends, Flags.ResourceFails]), ClientMode.Shell);
  await render(new Flags([Flags.Suspends, Flags.ResourceFails]), ClientMode.NoScript);

  clearInterval(interval);
}

main();
