/** An error that carries an HTTP status, caught by the central error handler. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
