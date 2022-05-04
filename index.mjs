import { strict as assert } from 'node:assert';
import { Writable } from "node:stream";
import React from "react";
import ReactDOMServer from "react-dom/server";

// const { Writable } = require("stream");
// const React = require("react");
// const ReactDOMServer = require("react-dom/server");

const h = React.createElement;

class WritableBuffer extends Writable {
  constructor(options) {
    // Calls the stream.Writable() constructor.
    super(options);
    this.chunks = [];
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(chunk);
    callback();
  }

  _final(callback) {
    callback();
  }

  toString() {
    return Buffer.concat(this.chunks).toString("utf8");
  }
}

const interval = setInterval(() => {}, 1000 * 60 * 60);

// function streamToString(stream) {
//     const chunks = [];
//     return new Promise((resolve, reject) => {
//         stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
//         stream.on('error', (err) => reject(err));
//         stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
//     })
// }

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class Resource {
  constructor() {
    this.value = undefined;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (value) => {
        console.log("resolving", value);
        this.value = value;
        resolve(value);
      };
      this.reject = (value) => {
        console.log("rejecting", value);
        this.value = value;
        reject(value);
      };
    });
  }
}

function useResource(resource) {
  if (resource.value !== undefined) {
    if (resource.value instanceof Error) {
      throw resource.value;
    } else {
      return resource.value;
    }
  }
  throw resource.promise;
}

function Loader({ resource }) {
  const value = useResource(resource);
  return h("p", null, value);
}

const Flags = {
    Suspends: Symbol(),
    ErrorsInRootComponent: Symbol(),
    ErrorsInSuspendedComponent: Symbol(),
    ErrorsInResource: Symbol(),
};

function makeRoot(flags) {
  const resource = new Resource();

  const suspends = flags.has(Flags.Suspends);
  const errorsInRootComponent = flags.has(Flags.ErrorsInRootComponent);
  const errorsInSuspendedComponent = flags.has(Flags.ErrorsInSuspendedComponent);
  const errorsInResource = flags.has(Flags.ErrorsInResource);

  const element = h(
    "html",
    null,
    h("head", null),
    suspends ? h(
      React.Suspense,
      { fallback: h("p", null, "Waiting") },
      h(Loader, { resource })
    ) : null
  );

  setTimeout(() => {
    // resource.resolve("Loaded!");
    resource.reject(Error("Oh no!"));
  }, 5);

  return element;
}

const stream = ReactDOMServer.renderToPipeableStream(makeRoot(new Set()), {
  onAllReady() {
    stream.pipe(process.stdout).once("close", () => {
      clearInterval(interval);
    });

    // const destination = new WritableBuffer();

    // const p = new Promise((resolve) => {
    //     destination.on("close", () => {
    //         console.log(destination.toString());
    //         resolve();
    //     });

    //     stream.pipe(destination);
    // });

    // p.then(() => {
    //     clearInterval(interval);
    // });
  },
  onShellError(error) {
    console.error("SHELLERROR!", error);
  },
  onError(error) {
    console.error("ERROR[", error, "]");
  },
});

// streamToString(stream)
//     .then(result => {
//         console.log(result);
//     });
