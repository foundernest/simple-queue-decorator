export default class Logs {
  private active: boolean
  constructor(active: boolean = true) {
    this.active = active
  }

  public log(...args: any[]): void {
    if (this.active) {
      console.log(...args)
    }
  }

  public warn(...args: any[]): void {
    if (this.active) {
      console.warn(...args)
    }
  }

  public error(...args: any[]): void {
    if (this.active) {
      console.error(...args)
    }
  }
}
