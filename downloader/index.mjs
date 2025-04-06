#!/usr/bin/env node

import { exec } from 'child_process';
import fetch from 'node-fetch'
import { randomUUID } from 'crypto';

(async function() {
    try {
        let session_id = randomUUID()

        let edition = await new Promise((resolve, reject) => {
            exec(`yad --entry --center --title='Choose Windows edition' --entry-label="Edition" "Windows 10" "Windows 11"`, (error, stdout, stderr) => {
                if (error) {
                    reject('Cancelled the operation')
                } else {
                    resolve(stdout.trim())
                }
            })
        })

        let sku = 'windows11'
        if (edition === "Windows 10") {
            sku = 'windows10ISO'
        }

        const url = `https://www.microsoft.com/en-us/software-download/${sku}`

        let res = await fetch(url)
        let body = await res.text()

        body.match(/<option value="([0-9]+)">Windows/i)
        const product_id = RegExp.$1

        await fetch(`https://vlscppe.microsoft.com/tags?org_id=y6jn8c31&session_id=${session_id}`)

        const profile = '606624d44113'

        const locale = Intl.DateTimeFormat().resolvedOptions().locale
        res = await fetch(`https://www.microsoft.com/software-download-connector/api/getskuinformationbyproductedition?profile=${profile}&ProductEditionId=${product_id}&SKU=undefined&friendlyFileName=undefined&Locale=${locale}&sessionID=${session_id}`)
        const step1_json = JSON.parse(await res.text())
        const languages = step1_json.Skus
        
        const chosenLang = await new Promise((resolve, reject) => {
            exec(`yad --entry --center --title='Choose language' --entry-label=Language ${languages.map(l => `"${l.LocalizedLanguage}"`).join(' ')}`, (error, stdout, stderr) => {
                if (error) {
                    reject('Cancelled the operation')
                } else {
                    resolve(stdout.trim())
                }
            })
        })
        const chosenLangObj = languages.find(l => l.LocalizedLanguage === chosenLang)

        // 6e2a1789-ef16-4f27-a296-74ef7ef5d96b
        res = await fetch(`https://www.microsoft.com/software-download-connector/api/GetProductDownloadLinksBySku?profile=${profile}&productEditionId=undefined&SKU=${chosenLangObj.Id}&friendlyFileName=undefined&Locale=${locale}&sessionID=${session_id}`,
            {
                referrer: url
            }
        )
        body = JSON.parse(await res.text())
        console.dir(body)

        const [download] = body.ProductDownloadOptions
        console.log(download.Uri)
        process.exitCode = 0
    } catch (e) {
        console.error(e)
        process.exitCode = 1
    }
}())
