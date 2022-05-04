export const FutureEnableLogging = Symbol("FutureEnableLogging");

export class Future {
  constructor() {
    this.value = undefined;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (value) => {
        if (this[FutureEnableLogging]) {
          console.log("+ resolving:", value);
        }
        this.value = value;
        resolve(value);
      };
      this.reject = (value) => {
        if (this[FutureEnableLogging]) {
          console.log("+ rejecting:", value);
        }
        this.value = value;
        reject(value);
      };
    });
  }
}
