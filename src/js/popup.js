// JS for popup.html

import {
    genQrCode,
    linkClick,
    saveOptions,
    updateManifest,
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

/**
 * Initialize Popup
 * @function initPopup
 */
async function initPopup() {
    console.debug('initPopup')
    // noinspection ES6MissingAwait
    updateManifest()
    // chrome.storage.sync.get(['options']).then((items) => {
    //     updateOptions(items.options)
    // })

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
    updateLink('source-url-link', sourceUrl)

    // Deep Link
    const deepLink = `obtainium://add/${sourceUrl}`
    console.debug('deepLink:', deepLink)
    updateLink('deep-url-link', deepLink)

    // Redirect Link
    const url = new URL('https://apps.obtainium.imranr.dev/redirect')
    url.searchParams.append('r', deepLink)
    const redirectUrl = url.toString()
    console.debug('redirectUrl:', redirectUrl)
    updateLink('redirect-url-link', redirectUrl)

    // Process Popup
    sourceUrlEl.textContent = sourceUrl
    const platform = await updatePlatform()

    if (platform.os !== 'android') {
        console.debug('%c BROWSER DETECTED', 'color: Gold')
        const qrCodeEl = document.getElementById('qr-code')
        await genQrCode(qrCodeEl, deepLink)
    } else {
        console.debug('%c ANDROID DETECTED', 'color: Lime')
        const { options } = await chrome.storage.sync.get(['options'])
        if (!options.showPopup) {
            console.debug('%c Popup Disabled: Redirecting', 'color: OrangeRed')
            // NOTE: deepLink works on this navigation but not href links
            await chrome.tabs.create({ active: true, url: deepLink })
            return window.close()
        }

        const imageLink = document.getElementById('image-link')
        // NOTE: deepLink does not work on href links so redirectUrl is used
        imageLink.href = redirectUrl
        imageLink.classList.remove('d-none')

        if (options.showCodeMobile) {
            const qrCodeEl = document.getElementById('qr-code')
            await genQrCode(qrCodeEl, deepLink)
        }
    }
}

/**
 * @function extractRepoUrl
 * @param {string} fullUrl
 * @return {string|null}
 */
function extractRepoUrl(fullUrl) {
    try {
        const url = new URL(fullUrl)
        const parts = url.pathname.replace('/', '').split('/')
        if (parts.length < 2 || !parts[1]) {
            return null
        }
        return `${url.origin}/${parts[0]}/${parts[1]}`
    } catch (e) {
        console.debug('error:', e)
        return null
    }
}

function updateLink(elementId, href) {
    const link = document.getElementById(elementId)
    link.href = href
    link.dataset.clipboardTarget = `#${elementId}`
    link.dataset.clipboardText = href
    // link.addEventListener('click', (e) => {
    //     console.debug('%c updateLink: e.preventDefault()', 'color: Yellow')
    //     e.preventDefault()
    // })
}
