// JS for help.html

import {
    checkPerms,
    grantPerms,
    linkClick,
    onAdded,
    onRemoved,
    openPopup,
    revokePerms,
    updateBrowser,
    updateManifest,
    updatePlatform,
} from './export.js'

chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

document.addEventListener('DOMContentLoaded', domContentLoaded)
document
    .querySelectorAll('.revoke-permissions')
    .forEach((el) => el.addEventListener('click', revokePerms))
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', grantPerms))
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
    checkPerms()
    // noinspection ES6MissingAwait
    updateBrowser()

    chrome.storage.sync.get(['options']).then((items) => {
        console.debug('options:', items.options)
    })

    const platform = await updatePlatform()
    console.debug('platform.os:', platform.os)
    if (platform.os === 'android') {
        console.debug('%c ANDROID DETECTED', 'color: Lime')
        bootstrap.Tab.getInstance(document.getElementById('mobile-tab')).show()
    }
}
