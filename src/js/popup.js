// JS for popup.html

import {
    genQrCode,
    linkClick,
    saveOptions,
    updateManifest,
    updateOptions,
    updatePlatform,
} from './export.js'

document.addEventListener('DOMContentLoaded', initPopup)
// noinspection JSCheckFunctionSignatures
document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', (e) => linkClick(e, true)))
document
    .querySelectorAll('.options input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .querySelectorAll('form.options')
    .forEach((el) => el.addEventListener('submit', (e) => e.preventDefault()))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

const sourceUrlEl = document.getElementById('source-url')
// const deepLinkInput = document.getElementById('deep-link')
const qrCodeEl = document.getElementById('qr-code')

/**
 * Initialize Popup
 * @function initPopup
 */
async function initPopup() {
    console.debug('initPopup')
    // noinspection ES6MissingAwait
    updateManifest()
    chrome.storage.sync.get(['options']).then((items) => {
        updateOptions(items.options)
    })

    // Get Tab
    const [tab] = await chrome.tabs.query({
        currentWindow: true,
        active: true,
    })
    console.debug('url:', tab.url)
    if (!tab.url) {
        return console.debug('%c No tab.url', 'color: Red')
    }

    // Source URL
    const sourceUrl = extractRepoUrl(tab.url)
    console.debug('sourceUrl:', sourceUrl)
    if (!sourceUrl) {
        return console.debug('%c No Source URL Match', 'color: Yellow')
    }

    // Deep Link
    const deepLink = `obtainium://add/${sourceUrl}`
    console.debug('deepLink:', deepLink)

    // Redirect Link
    const url = new URL('https://apps.obtainium.imranr.dev/redirect')
    url.searchParams.append('r', deepLink)
    const redirectUrl = url.toString()
    console.debug('redirectUrl:', redirectUrl)

    // Platform Here Cuz Yeah
    const platform = await updatePlatform()

    if (platform.os === 'android') {
        console.debug('%c ANDROID DETECTED', 'color: Lime')
        // TODO: Test This and/or Update Popup w/ Backup Links
        await chrome.tabs.create({ active: true, url: deepLink })
        window.close()
    } else {
        console.debug('%c NOT Android', 'color: Gold')
        sourceUrlEl.textContent = sourceUrl
        await genQrCode(qrCodeEl, deepLink)
    }
}

function extractRepoUrl(fullUrl) {
    const regex = /^(https?:\/\/[^/]+\/[^/]+\/[^/]+)(?:\/|$)/i
    const match = fullUrl.match(regex)
    if (match) {
        return match[1]
    }
    return null
}
