// JS for sidepanel.html

import {
    checkPerms,
    genQrCode,
    grantPerms,
    linkClick,
    onAdded,
    onRemoved,
    openPopup,
    updateManifest,
} from './export.js'

chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)
chrome.runtime.onMessage.addListener(onMessage)
chrome.tabs.onActivated.addListener(onActivated)

document.addEventListener('DOMContentLoaded', domContentLoaded)
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', (e) => grantPerms(e)))
document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', linkClick))
document
    .querySelectorAll('.open-popup')
    .forEach((el) => el.addEventListener('click', openPopup))
document
    .querySelectorAll('.close-panel')
    .forEach((el) => el.addEventListener('click', closePanel))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

const qrCodeEl = document.getElementById('qr-code')
const hostnameInput = document.getElementById('hostname')

let currentUrl

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    // noinspection ES6MissingAwait
    checkPerms()
    // noinspection ES6MissingAwait
    updateManifest()
    // noinspection ES6MissingAwait
    tabChange()
}

/**
 * Close Side Panel Click Callback
 * @function closePanel
 * @param {Event} [event]
 */
async function closePanel(event) {
    console.debug('closePanel:', event)
    event?.preventDefault()
    // noinspection JSUnresolvedReference
    if (typeof browser !== 'undefined') {
        // noinspection JSUnresolvedReference
        await browser.sidebarAction.close()
    } else {
        window.close()
    }
}

/**
 * On Message Callback
 * @function onMessage
 * @param {Object} message
 */
function onMessage(message) {
    console.debug('sidepanel: onMessage:', message)
    if (message.type === 'onUpdated') {
        console.debug('%c onMessage - tabChange()', 'color: Yellow')
        console.debug('message.changeInfo:', message.changeInfo)
        console.debug('message.tab:', message.tab)
        // noinspection JSIgnoredPromiseFromCall
        tabChange(message.tab)
    }
}

/**
 * Tab Change Callback
 * @function onActivated
 * @param {chrome.tabs.TabActiveInfo} activeInfo
 */
async function onActivated(activeInfo) {
    console.debug('onActivated:', activeInfo)
    const window = await chrome.windows.getCurrent()
    // console.debug('window:', window)
    if (window.id !== activeInfo.windowId) {
        return console.debug('Tab Change - Different Window.')
    }
    console.debug('%c onActivated - tabChange()', 'color: Lime')
    // noinspection ES6MissingAwait
    tabChange()
}

/**
 * Process Tab Changes
 * @function tabChange
 * @param {chrome.tabs.Tab} [sourceTab]
 */
async function tabChange(sourceTab) {
    const [tab] = await chrome.tabs.query({
        currentWindow: true,
        active: true,
    })
    // console.debug('tab:', tab)

    // TODO: Cleanup Side Panel Update Logic...
    if (sourceTab && tab.windowId !== sourceTab.windowId) {
        console.debug(`${tab.windowId} != ${sourceTab.windowId}`)
        console.debug('%c tabChange Rejected - DIFFERENT WINDOW', 'color: Red')
        return
    }
    if (!tab.url) {
        hostnameInput.textContent = 'No URL for Tab'
        qrCodeEl.innerHTML = ''
        console.debug('%c tabChange Rejected - NO URL', 'color: Red')
        return
    }
    if (tab.url === currentUrl) {
        console.debug('%c tabChange Rejected - URL NOT CHANGE', 'color: Red')
        return
    }
    currentUrl = tab.url
    hostnameInput.textContent = tab.url
    genQrCode(qrCodeEl, tab.url)
}
