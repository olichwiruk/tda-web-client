// Mocks all files ending in `.vue` showing them as plain Vue instances
declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module '*.png' {
   const value: string
   export = value
}

declare const config: {
  env: {
    VUE_APP_OCA_REPO_URL: string
  }
}
