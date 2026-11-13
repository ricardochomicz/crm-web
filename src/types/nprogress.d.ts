declare module 'nprogress' {
  interface NProgressOptions {
    showSpinner?: boolean
    minimum?: number
    trickleSpeed?: number
  }
  interface NProgressApi {
    configure(options: NProgressOptions): NProgressApi
    start(): NProgressApi
    done(force?: boolean): NProgressApi
  }
  const NProgress: NProgressApi
  export default NProgress
}
