// JS for help.html

import {
    linkClick,
    openPopup,
    updateBrowser,
    updateManifest,
    updatePlatform,
} from './export.js'

document.addEventListener('DOMContentLoaded', domContentLoaded)
document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', linkClick))
document
    .querySelectorAll('.open-popup')
    .forEach((el) => el.addEventListener('click', openPopup))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    // noinspection ES6MissingAwait
    updateManifest()
    // noinspection ES6MissingAwait
    updateBrowser()

    const platform = await updatePlatform()
    console.debug('platform.os:', platform.os)
    if (platform.os === 'android') {
        console.debug('%c ANDROID DETECTED', 'color: Lime')
        const el = document.getElementById('mobile-tab')
        const tab = bootstrap.Tab.getOrCreateInstance(el)
        tab?.show()
    }
}
