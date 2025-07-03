// JS Background Service Worker

import { activateOrOpen, openPopup, githubURL } from './export.js'

chrome.runtime.onInstalled.addListener(onInstalled)
chrome.runtime.onStartup.addListener(onStartup)
chrome.contextMenus?.onClicked.addListener(onClicked)
chrome.commands?.onCommand.addListener(onCommand)
chrome.storage.onChanged.addListener(onChanged)

/**
 * On Installed Callback
 * @function onInstalled
 * @param {chrome.runtime.InstalledDetails} details
 */
async function onInstalled(details) {
    console.log('onInstalled:', details)
    const options = await setDefaultOptions({
        showPopup: true,
        showCodeMobile: false,
        contextMenu: true,
        showUpdate: false,
        dotsColor: '#c987ff',
        outCorner: '#7442c0',
        innerCorner: '#c987ff',
    })
    console.debug('options:', options)
    if (options.contextMenu) {
        createContextMenus()
    }
    const manifest = chrome.runtime.getManifest()
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // noinspection ES6MissingAwait
        chrome.runtime.openOptionsPage()
        const url = chrome.runtime.getURL('../html/help.html')
        await chrome.tabs.create({ active: true, url })
        // await chrome.tabs.create({ active: false, url: installURL })
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        if (options.showUpdate) {
            if (manifest.version !== details.previousVersion) {
                const url = `${githubURL}/releases/tag/${manifest.version}`
                await chrome.tabs.create({ active: false, url })
            }
        }
    }
    setUninstallURL()

    // Set a UUID unique to each install
    chrome.storage.local.get(['uuid']).then((items) => {
        console.debug('uuid:', items.uuid)
        if (!items.uuid) {
            const uuid = crypto.randomUUID()
            console.log('Generating New UUID:', uuid)
            chrome.storage.local.set({ uuid })
        }
    })

    const platform = await chrome.runtime.getPlatformInfo()
    console.debug('platform:', platform)

    // if (chrome.declarativeContent) {
    //     addPageRules()
    // }
}

/**
 * On Startup Callback
 * @function onStartup
 */
async function onStartup() {
    console.log('onStartup')
    // noinspection JSUnresolvedReference
    if (typeof browser !== 'undefined') {
        console.log('Firefox Startup Workarounds')
        const { options } = await chrome.storage.sync.get(['options'])
        console.debug('options:', options)
        if (options.contextMenu) {
            createContextMenus()
        }
        setUninstallURL()
    }
}

function setUninstallURL() {
    // const manifest = chrome.runtime.getManifest()
    // const url = new URL('https://obtainium-extension.cssnr.com/uninstall/')
    // url.searchParams.append('version', manifest.version)
    // chrome.runtime.setUninstallURL(url.href)
    // console.debug(`setUninstallURL: ${url.href}`)
    // Note: If only setting to a static url, this function is not required.
    chrome.runtime.setUninstallURL(`${githubURL}/issues`)
    console.debug(`setUninstallURL: ${githubURL}/issues`)
}

/**
 * On Clicked Callback
 * @function onClicked
 * @param {OnClickData} ctx
 * @param {chrome.tabs.Tab} tab
 */
async function onClicked(ctx, tab) {
    console.debug('onClicked:', ctx, tab)
    if (ctx.menuItemId === 'openOptions') {
        // noinspection ES6MissingAwait
        chrome.runtime.openOptionsPage()
    } else if (ctx.menuItemId === 'openHelp') {
        await activateOrOpen(chrome.runtime.getURL('/html/help.html'))
    } else if (ctx.menuItemId === 'openPopup') {
        await openPopup()
    } else {
        console.error(`Unknown ctx.menuItemId: ${ctx.menuItemId}`)
    }
}

/**
 * On Command Callback
 * @function onCommand
 * @param {String} command
 * @param {chrome.tabs.Tab} tab
 */
async function onCommand(command, tab) {
    console.debug('onCommand:', command, tab)
    if (command === 'openOptions') {
        // noinspection ES6MissingAwait
        chrome.runtime.openOptionsPage()
    } else {
        console.error(`Unknown Command: ${command}`)
    }
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    // console.debug('onChanged:', changes, namespace)
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options' && oldValue && newValue) {
            if (oldValue.contextMenu !== newValue.contextMenu) {
                if (newValue?.contextMenu) {
                    console.log('%c Enabled contextMenu...', 'color: Lime')
                    createContextMenus()
                } else {
                    console.log('%c Disabled contextMenu...', 'color: Orange')
                    // noinspection JSIgnoredPromiseFromCall
                    chrome.contextMenus?.removeAll()
                }
            }
        }
    }
}

/**
 * Create Context Menus
 * @function createContextMenus
 */
function createContextMenus() {
    if (!chrome.contextMenus) {
        return console.debug('Skipping: chrome.contextMenus')
    }
    console.debug('createContextMenus')
    /** @type {Array[chrome.contextMenus.ContextType[], String, String]} */
    const contexts = [
        [['all'], 'openPopup', 'Activate Extension'],
        [['all'], 'openHelp', 'How to Use'],
        [['all'], 'openOptions', 'Open Options'],
    ]
    chrome.contextMenus.removeAll().then(() => contexts.forEach(addContext))
}

/**
 * Add Context from Array
 * @function addContext
 * @param {[chrome.contextMenus.ContextType[],String,String,chrome.contextMenus.ContextItemType?]} context
 */
function addContext(context) {
    // console.debug('addContext:', context)
    const documentUrlPatterns = [
        '*://github.com/*/*',
        '*://gitlab.com/*/*',
        '*://forgejo.org/*/*',
        '*://codeberg.org/*/*',
    ]
    try {
        if (context[1] === 'separator') {
            const id = Math.random().toString().substring(2, 7)
            context[1] = `${id}`
            context.push('separator', 'separator')
        }
        // console.debug('menus.create:', context)
        chrome.contextMenus.create({
            documentUrlPatterns,
            contexts: context[0],
            id: context[1],
            title: context[2],
            type: context[3] || 'normal',
        })
    } catch (e) {
        console.log('%c Error Adding Context:', 'color: Yellow', e)
    }
}

/**
 * Set Default Options
 * @function setDefaultOptions
 * @param {Object} defaultOptions
 * @return {Promise<Object>}
 */
async function setDefaultOptions(defaultOptions) {
    console.log('setDefaultOptions', defaultOptions)
    let { options } = await chrome.storage.sync.get(['options'])
    options = options || {}
    let changed = false
    for (const [key, value] of Object.entries(defaultOptions)) {
        // console.log(`${key}: default: ${value} current: ${options[key]}`)
        if (options[key] === undefined) {
            changed = true
            options[key] = value
            console.log(`Set %c${key}:`, 'color: Khaki', value)
        }
    }
    if (changed) {
        await chrome.storage.sync.set({ options })
        console.log('changed options:', options)
    }
    return options
}

// function addPageRules() {
//     const pageUrlFilters = [
//         {
//             // urlMatches: 'https:\\/\\/github\\.com\\/.*\\/.+',
//             hostEquals: 'github.com',
//             pathContains: '/',
//         },
//         {
//             hostEquals: 'gitlab.com',
//             pathContains: '/',
//         },
//         {
//             hostEquals: 'forgejo.org',
//             pathContains: '/',
//         },
//         {
//             hostEquals: 'codeberg.org',
//             pathContains: '/',
//         },
//     ]
//     // noinspection JSIgnoredPromiseFromCall
//     chrome.action.disable()
//     chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
//         const rules = []
//         pageUrlFilters.forEach((opts) => {
//             rules.push({
//                 conditions: [
//                     new chrome.declarativeContent.PageStateMatcher({
//                         pageUrl: opts,
//                     }),
//                 ],
//                 actions: [new chrome.declarativeContent.ShowAction()],
//             })
//         })
//         console.debug('addPageRules:', rules)
//         chrome.declarativeContent.onPageChanged.addRules(rules)
//     })
// }
