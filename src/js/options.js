// JS for options.html

import {
    checkPerms,
    grantPerms,
    isDark,
    linkClick,
    onAdded,
    onRemoved,
    revokePerms,
    saveOptions,
    showToast,
    updateManifest,
    updateBrowser,
    updateOptions,
    updatePlatform,
} from './export.js'

chrome.storage.onChanged.addListener(onChanged)
chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

document.addEventListener('DOMContentLoaded', initOptions)
document.getElementById('copy-support').addEventListener('click', copySupport)
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
    .querySelectorAll('.options input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .querySelectorAll('form.options')
    .forEach((el) => el.addEventListener('submit', (e) => e.preventDefault()))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))
document
    .querySelectorAll('.form-control')
    .forEach((el) =>
        el.addEventListener('input', () => el.classList.remove('is-invalid'))
    )

document.getElementById('chrome-shortcuts').addEventListener('click', () => {
    // noinspection JSIgnoredPromiseFromCall
    chrome.tabs.update({ url: 'chrome://extensions/shortcuts' })
})

window.addEventListener('storage', (event) => {
    if (event.key === 'theme') {
        console.log('theme:', event.newValue)
        Coloris({
            themeMode: isDark(event.newValue) ? 'dark' : 'light',
        })
    }
})

/**
 * Initialize Options
 * @function initOptions
 */
async function initOptions() {
    console.debug('initOptions')
    // noinspection ES6MissingAwait
    updateManifest()
    // noinspection ES6MissingAwait
    updateBrowser()
    // noinspection ES6MissingAwait
    updatePlatform()
    // noinspection ES6MissingAwait
    checkPerms()
    // noinspection ES6MissingAwait
    setShortcuts()
    chrome.storage.sync.get(['options']).then((items) => {
        updateOptions(items.options).then(() => {
            Coloris({
                themeMode: isDark() ? 'dark' : 'light',
                alpha: false,
            })
        })
    })
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    console.debug('onChanged:', changes, namespace)
    for (const [key, { newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options') {
            // noinspection JSIgnoredPromiseFromCall
            updateOptions(newValue)
        }
    }
}

/**
 * Set Keyboard Shortcuts
 * @function setShortcuts
 * @param {String} [selector]
 */
async function setShortcuts(selector = '#keyboard-shortcuts') {
    if (!chrome.commands) {
        return console.debug('Skipping: chrome.commands')
    }
    const table = document.querySelector(selector)
    table.classList.remove('d-none')
    const tbody = table.querySelector('tbody')
    const source = table.querySelector('tfoot > tr').cloneNode(true)
    const commands = await chrome.commands.getAll()
    for (const command of commands) {
        // console.debug('command:', command)
        const row = source.cloneNode(true)
        let description = command.description
        // Note: Chrome does not parse the description for _execute_action in manifest.json
        if (!description && command.name === '_execute_action') {
            description = 'Activate Extension' // NOTE: Also defined in: manifest.json
        }
        row.querySelector('.description').textContent = description
        row.querySelector('kbd').textContent = command.shortcut || 'Not Set'
        tbody.appendChild(row)
    }
}

/**
 * Copy Support Click Callback
 * @function copySupport
 * @param {MouseEvent} event
 */
async function copySupport(event) {
    console.debug('copySupport:', event)
    event.preventDefault()
    const manifest = chrome.runtime.getManifest()
    // const permissions = await chrome.permissions.getAll()
    const { options } = await chrome.storage.sync.get(['options'])
    const result = [
        `${manifest.name} - ${manifest.version}`,
        navigator.userAgent,
        `options: ${JSON.stringify(options)}`,
        // `permissions.origins: ${JSON.stringify(permissions.origins)}`,
    ]
    const commands = await chrome.commands?.getAll()
    if (commands) {
        result.push(`commands: ${JSON.stringify(commands)}`)
    }
    await navigator.clipboard.writeText(result.join('\n'))
    showToast('Support Information Copied.')
}
