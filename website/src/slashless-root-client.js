// The root of this site is served without a trailing slash (see
// plugins/slashless-root.js). Links inside the app still lead to the slashed
// address, so once the app has moved there the address bar is set to the
// slashless one, without loading the page again.
import siteConfig from '@generated/docusaurus.config'

export function onRouteDidUpdate ({ location }) {
  const root = siteConfig.baseUrl
  if (location.pathname !== root) return
  window.history.replaceState(window.history.state, '', root.slice(0, -1) + location.search + location.hash)
}
