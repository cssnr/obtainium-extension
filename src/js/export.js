// JS Exports

import QRCodeStyling from '../dist/qr-code-styling/qr-code-styling.js'

export const githubURL = 'https://github.com/cssnr/obtainium-extension'

/**
 * Save Options Callback
 * @function saveOptions
 * @param {UIEvent} event
 */
export async function saveOptions(event) {
    console.debug('saveOptions:', event)
    const { options } = await chrome.storage.sync.get(['options'])
    let key = event.target.id
    let value
    if (event.target.type === 'radio') {
        key = event.target.name
        const radios = document.getElementsByName(key)
        for (const input of radios) {
            if (input.checked) {
                value = input.id
                break
            }
        }
    } else if (event.target.type === 'checkbox') {
        value = event.target.checked
    } else if (event.target.type === 'number') {
        const number = parseFloat(event.target.value)
        let min = parseFloat(event.target.min)
        let max = parseFloat(event.target.max)
        if (!isNaN(number) && number >= min && number <= max) {
            event.target.value = number.toString()
            value = number
        } else {
            event.target.value = options[event.target.id]
            return
        }
    } else {
        value = event.target.value
    }
    if (value !== undefined) {
        options[key] = value
        console.log(`Set %c${key}:`, 'color: Khaki', value)
        await chrome.storage.sync.set({ options })
    } else {
        console.warn(`No Value for key: ${key}`)
    }
}

/**
 * Update Options
 * @function initOptions
 * @param {Object} options
 */
export async function updateOptions(options) {
    console.debug('updateOptions:', options)
    for (let [key, value] of Object.entries(options)) {
        if (typeof value === 'undefined') {
            console.warn('Value undefined for key:', key)
            continue
        }
        // Option Key should be `radioXXX` and values should be the option IDs
        if (key.startsWith('radio')) {
            key = value //NOSONAR
            value = true //NOSONAR
        }
        // console.debug(`${key}: ${value}`)
        const el = document.getElementById(key)
        if (!el) {
            continue
        }
        if (el.tagName !== 'INPUT') {
            el.textContent = value.toString()
        } else if (typeof value === 'boolean') {
            el.checked = value
        } else {
            el.value = value
        }
        if (el.dataset.related) {
            hideShowElement(`#${el.dataset.related}`, value)
        }
        if (typeof el.dataset.coloris !== 'undefined') {
            console.debug('dataset.coloris:', el.id)
            el.dispatchEvent(new Event('input', { bubbles: true }))
        }
    }
}

/**
 * Hide or Show Element with JQuery
 * @function hideShowElement
 * @param {String} selector
 * @param {Boolean} [show]
 * @param {String} [speed]
 */
function hideShowElement(selector, show, speed = 'fast') {
    const element = $(`${selector}`)
    // console.debug('hideShowElement:', show, element)
    if (show) {
        element.show(speed)
    } else {
        element.hide(speed)
    }
}

/**
 * Link Click Callback
 * Note: Firefox popup requires a call to window.close()
 * @function linkClick
 * @param {MouseEvent} event
 * @param {Boolean} [close]
 */
export async function linkClick(event, close = false) {
    console.debug('linkClick:', close, event)
    event.preventDefault()
    const href = event.currentTarget.getAttribute('href').replace(/^\.+/g, '')
    console.debug('href:', href)
    let url
    if (href.startsWith('#')) {
        console.debug('return on anchor link')
        return
    } else if (href.endsWith('html/options.html')) {
        await chrome.runtime.openOptionsPage()
        if (close) window.close()
        return
    } else if (href.startsWith('http')) {
        url = href
    } else {
        url = chrome.runtime.getURL(href)
    }
    console.debug('url:', url)
    await activateOrOpen(url)
    if (close) window.close()
}

/**
 * Activate or Open Tab from URL
 * @function activateOrOpen
 * @param {String} url
 * @param {Boolean} [open]
 * @return {Promise<chrome.tabs.Tab>}
 */
export async function activateOrOpen(url, open = true) {
    console.debug('activateOrOpen:', url, open)
    // Note: To Get Tab from Tabs (requires host permissions or tabs)
    const tabs = await chrome.tabs.query({ currentWindow: true })
    console.debug('tabs:', tabs)
    for (const tab of tabs) {
        if (tab.url === url) {
            console.debug('found tab in tabs:', tab)
            return await chrome.tabs.update(tab.id, { active: true })
        }
    }
    if (open) {
        console.debug('tab not found, opening url:', url)
        return await chrome.tabs.create({ active: true, url })
    }
    console.warn('tab not found and open not set!')
}

/**
 * Update DOM with Manifest Details
 * @function updateManifest
 * @function updateManifest
 */
export async function updateManifest() {
    const manifest = chrome.runtime.getManifest()
    console.debug('updateManifest:', manifest)
    document.querySelectorAll('.version').forEach((el) => {
        el.textContent = manifest.version
    })
    document.querySelectorAll('[href="homepage_url"]').forEach((el) => {
        el.href = manifest.homepage_url
    })
    document.querySelectorAll('[href="version_url"]').forEach((el) => {
        el.href = `${githubURL}/releases/tag/${manifest.version}`
    })
}

/**
 * @function updateBrowser
 * @return {Promise<void>}
 */
export async function updateBrowser() {
    let selector = '.chrome'
    // noinspection JSUnresolvedReference
    if (typeof browser !== 'undefined') {
        selector = '.firefox'
    }
    console.debug('updateBrowser:', selector)
    document
        .querySelectorAll(selector)
        .forEach((el) => el.classList.remove('d-none'))
}

/**
 * @function updatePlatform
 * @return {Promise<chrome.runtime.PlatformInfo>}
 */
export async function updatePlatform() {
    const platform = await chrome.runtime.getPlatformInfo()
    console.debug('updatePlatform:', platform)
    const splitCls = (cls) => cls.split(' ').filter(Boolean)
    if (platform.os === 'android') {
        // document.querySelectorAll('[class*="mobile-"]').forEach((el) => {
        document
            .querySelectorAll(
                '[data-mobile-add],[data-mobile-remove],[data-mobile-replace]'
            )
            .forEach((el) => {
                if (el.dataset.mobileAdd) {
                    for (const cls of splitCls(el.dataset.mobileAdd)) {
                        // console.debug('mobileAdd:', cls)
                        el.classList.add(cls)
                    }
                }
                if (el.dataset.mobileRemove) {
                    for (const cls of splitCls(el.dataset.mobileRemove)) {
                        // console.debug('mobileAdd:', cls)
                        el.classList.remove(cls)
                    }
                }
                if (el.dataset.mobileReplace) {
                    const split = splitCls(el.dataset.mobileReplace)
                    // console.debug('mobileReplace:', split)
                    for (let i = 0; i < split.length; i += 2) {
                        const one = split[i]
                        const two = split[i + 1]
                        // console.debug(`replace: ${one} >> ${two}`)
                        el.classList.replace(one, two)
                    }
                }
            })
    }
    return platform
}

/**
 * Open Popup Click Callback
 * @function openPopup
 * @param {Event} [event]
 */
export async function openPopup(event) {
    console.debug('openPopup:', event)
    event?.preventDefault()
    // Note: This fails if popup is already open (ex. double clicks)
    try {
        if (chrome.pageAction) {
            // noinspection JSUnresolvedReference
            chrome.pageAction.openPopup()
        } else {
            await chrome.action.openPopup()
        }
    } catch (e) {
        console.debug(e)
    }
}

/**
 * Show Bootstrap Toast
 * @function showToast
 * @param {String} message
 * @param {String} type
 */
export function showToast(message, type = 'primary') {
    console.debug(`showToast: ${type}: ${message}`)
    const clone = document.querySelector('#clone > .toast')
    const container = document.getElementById('toast-container')
    if (!clone || !container) {
        return console.warn('Missing clone or container:', clone, container)
    }
    const element = clone.cloneNode(true)
    element.querySelector('.toast-body').textContent = message
    element.classList.add(`text-bg-${type}`)
    container.appendChild(element)
    const toast = new bootstrap.Toast(element)
    element.addEventListener('mousemove', () => toast.hide())
    toast.show()
}

/**
 * DeBounce Function
 * @function debounce
 * @param {Function} fn
 * @param {Number} timeout
 */
export function debounce(fn, timeout = 250) {
    let timeoutID
    return (...args) => {
        clearTimeout(timeoutID)
        timeoutID = setTimeout(() => fn(...args), timeout)
    }
}

export function isDark(theme) {
    if (!theme) {
        theme = localStorage.getItem('theme')
    }
    if (theme !== 'dark' && theme !== 'light') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
    }
    return theme === 'dark'
}

/**
 * @function genQrCode
 * @param {HTMLElement} parent
 * @param {string} data
 * @param {object} [extraOptions]
 * @return {QRCodeStyling}
 */
export async function genQrCode(parent, data, extraOptions) {
    // console.debug('parent.clientWidth:', parent.clientWidth)
    console.debug('%c genQrCode - Generate New QR Code:', 'color: Lime', data)
    const { options } = await chrome.storage.sync.get(['options'])
    // console.debug('genQrCode:', options)
    const size = parent.clientWidth - 2
    const qrCodeOptions = {
        width: size,
        height: size,
        type: 'canvas',
        data: data,
        margin: 0,
        image: chrome.runtime.getURL('/images/logo128.png'),
        dotsOptions: { color: options.dotsColor, type: 'dots' },
        cornersDotOptions: { color: options.innerCorner, type: 'dot' },
        cornersSquareOptions: {
            color: options.outCorner,
            type: 'extra-rounded',
        },
        backgroundOptions: { color: isDark() ? '#212429' : '#fff' },
        imageOptions: { crossOrigin: 'anonymous', imageSize: 0.2, margin: 1 },
    }
    // qrCodeOptions.qrOptions = {
    //     typeNumber: 0,
    //     mode: 'Byte',
    //     errorCorrectionLevel: 'Q',
    // }
    Object.assign(qrCodeOptions, extraOptions)
    // console.debug('qrCodeOptions:', qrCodeOptions)
    const qrCode = new QRCodeStyling(qrCodeOptions)
    parent.innerHTML = ''
    qrCode.append(parent)
    parent.onclick = () => {
        qrCode.download({ name: 'qr-code', extension: 'png' })
    }
    return qrCode
}
