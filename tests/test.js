const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const sourceDir = 'src'
const screenshotsDir = 'tests/screenshots'

let count = 1

/**
 * @function ssOpts
 * @param {String} name
 * @param {Object} [options]
 * @return {Object}
 */
function ssOpts(name, options = {}) {
    const n = count.toString().padStart(2, '0')
    count++
    const opts = { path: `${screenshotsDir}/${n}_${name}.png` }
    Object.assign(opts, options)
    console.log('ssOpts:', opts)
    return opts
}

/**
 * @function getPage
 * @param {puppeteer.Browser} browser
 * @param {String} name
 * @param {Boolean=} log
 * @param {String=} size
 * @return {Promise<puppeteer.Page>}
 */
async function getPage(browser, name, log, size) {
    console.debug(`getPage: ${name}`, log, size)
    const target = await browser.waitForTarget(
        (target) => target.type() === 'page' && target.url().endsWith(name)
    )
    const page = await target.asPage()
    await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'dark' },
    ])
    if (size) {
        const [width, height] = size.split('x').map((x) => parseInt(x))
        await page.setViewport({ width, height })
    }
    if (log) {
        console.debug(`Adding Logger: ${name}`)
        page.on('console', (msg) =>
            console.log(`console: ${name}:`, msg.text())
        )
    }
    return page
}

;(async () => {
    if (fs.existsSync(screenshotsDir)) {
        fs.rmdirSync(screenshotsDir, { recursive: true, force: true })
    }
    fs.mkdirSync(screenshotsDir)

    const pathToExtension = path.join(process.cwd(), sourceDir)
    console.log('pathToExtension:', pathToExtension)
    const browser = await puppeteer.launch({
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
            '--no-sandbox',
        ],
        dumpio: true,
        // headless: false,
        // slowMo: 50,
    })
    console.log('browser:', browser)

    // Get Service Worker
    const workerTarget = await browser.waitForTarget(
        (target) =>
            target.type() === 'service_worker' &&
            target.url().endsWith('service-worker.js')
    )
    const worker = await workerTarget.worker()
    console.log('worker:', worker)
    worker.on('console', (msg) => console.log(`worker:`, msg.text()))

    // Popup
    await new Promise((resolve) => setTimeout(resolve, 500))
    await worker.evaluate('chrome.action.openPopup();')
    let page = await getPage(browser, 'popup.html')
    console.log('page:', page)
    await page.waitForNetworkIdle()
    await page.screenshot(ssOpts('popup1'))
    await page.locator('[href="../html/options.html"]').click()

    // Options
    page = await getPage(browser, 'options.html')
    console.log('page:', page)
    await page.waitForNetworkIdle()
    await page.screenshot(ssOpts('options1'))

    // GitHub / Popup
    const manifest = await worker.evaluate('chrome.runtime.getManifest();')
    console.log('homepage_url:', manifest.homepage_url)
    const homepage = await browser.newPage()
    // await homepage.goto('https://github.com/ImranR98/Obtainium')
    await homepage.goto(manifest.homepage_url)
    await homepage.waitForNetworkIdle()

    await worker.evaluate('chrome.action.openPopup();')
    page = await getPage(browser, 'popup.html', true)
    console.log('page:', page)
    await page.waitForNetworkIdle()
    await page.screenshot(ssOpts('github1'))

    await page.close()
    await browser.close()
})()
