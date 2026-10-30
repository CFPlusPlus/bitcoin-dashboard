export class ComponentLoadError extends Error {
  constructor(cause: unknown) {
    super('Application component could not be loaded', { cause })
    this.name = 'ComponentLoadError'
  }
}
