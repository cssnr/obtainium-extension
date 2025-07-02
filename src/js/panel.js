// JS for panel.html

import { debounce, genQrCode } from './export.js'

chrome.runtime.onMessage.addListener(onMessage)

document.addEventListener('DOMContentLoaded', domContentLoaded)
document
    .querySelectorAll('.close-panel')
    .forEach((el) => el.addEventListener('click', closePanel))

const qrCodeEl = document.getElementById('qr-code')
const hostnameInput = document.getElementById('hostname')

hostnameInput.addEventListener('input', debounce(inputChange, 500))

let currentUrl

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    // Note: This can not be reliably set in: export.js > openExtPanel
    chrome.windows.getCurrent().then((window) => {
        chrome.storage.local.set({ lastPanelID: window.id }).then(() => {
            console.debug(`%c Set lastPanelID: ${window.id}`, 'color: Aqua')
        })
    })
    chrome.storage.sync.get(['options']).then((items) => {
        console.debug('options:', items.options)
    })
    chrome.runtime.sendMessage({ getData: true }).then((response) => {
        updateData(response)
    })
    requestAnimationFrame(() => {
        hostnameInput.focus()
        hostnameInput.setSelectionRange(0, hostnameInput.value.length)
    })
}

/**
 * @function inputChange
 * @param {InputEvent} event
 * @return {Promise<void>}
 */
async function inputChange(event) {
    console.debug('inputChange:', event)
    updateData(hostnameInput.value)
}

/**
 * On Message Callback
 * @function onMessage
 * @param {Object} message
 */
function onMessage(message) {
    console.debug('panel: onMessage:', message)
    if (message.type === 'panelData' && message.data) {
        console.debug('%c onMessage - genQrCode()', 'color: Yellow')
        updateData(message.data)
    }
}

/**
 * Close Panel Click Callback
 * @function closePanel
 * @param {Event} [event]
 */
function closePanel(event) {
    console.debug('closePanel:', event)
    event?.preventDefault()
    window.close()
}

/**
 * Update QR Code Data
 * @function updateData
 * @param {string} data
 */
function updateData(data) {
    console.debug('updateData:', data)
    hostnameInput.value = data
    if (data && currentUrl !== data) {
        currentUrl = data
        genQrCode(qrCodeEl, data)
    }
}
