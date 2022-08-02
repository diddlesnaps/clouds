#!/usr/bin/env node

import { exec } from 'child_process';
import fetch from 'node-fetch'

(async function() {
    try {
        let now = (new Date).getTime()
        let session_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (t) => {
            let i = (now + Math.random() * 16) % 16 | 0;
            return now = Math.floor(now / 16),
            (t == 'x' ? i : i & 3 | 8).toString(16)
        })

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

        let res = await fetch(`https://www.microsoft.com/en-us/software-download/${sku}`)
        let body = await res.text()

        body.match(/<div[^>]*id=(['"])SoftwareDownload_LanguageSelectionByProductEdition\1 [^>]*data-defaultPageId=(['"])([a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12})\2[^>]*>.*<div[^>]*id=(['"])SoftwareDownload_DownloadLinks\5 [^>]*data-defaultPageId=(['"])([a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12})\6/i)
        const step1_uuid = RegExp.$3
        const step2_uuid = RegExp.$7
        body.match(/<select[^>]*id=(['"])product-edition\1[^>]*><option value="" selected="selected">[^<]*<\/option>(?:(?:<!--)?<?optgroup[^>]*>?(?:-->)?)<option value=(['"])(\d+)\2[^>]*>/i)
        const product_id = RegExp.$3

        res = await fetch(`https://www.microsoft.com/en-us/api/controls/contentinclude/html?pageId=${step1_uuid}&host=www.microsoft.com&segments=software-download%2c${sku}&query=&action=getskuinformationbyproductedition&sessionId=${session_id}&productEditionId=${product_id}&sdVersion=2`)
        let step1_text = await res.text()

        let languages = [...step1_text.matchAll(/<option value=['"]([^"']+)['"]>([^<])+<\/option>/g)]
        languages = languages
            .map(language => language[1].replace(/&quot;/g, '"'))
            .map(JSON.parse)
        
        let language = await new Promise((resolve, reject) => {
            exec(`yad --entry --center --title='Choose language' --entry-label=Language ${languages.map(lang => `"${lang.language}"`).join(' ')}`, (error, stdout, stderr) => {
                if (error) {
                    reject('Cancelled the operation')
                } else {
                    resolve(stdout.trim())
                }
            })
        })
        language = languages.find(el => el.language === language)

        res = await fetch(`https://www.microsoft.com/en-us/api/controls/contentinclude/html?pageId=${step2_uuid}&host=www.microsoft.com&segments=software-download%2cwindows11&query=&action=GetProductDownloadLinksBySku&sessionId=${session_id}&skuId=${language.id}&language=${encodeURIComponent(language.language)}&sdVersion=2`)
        body = await res.text()

        let download = [...body.matchAll(/<input type="hidden" class="product-download-hidden" value="([^"]+)"/g)]
            .map(download => download[1].replace(/&quot;/g, `"`).replace(/(IsoX86|IsoX64)/g, `"$1"`))
            .map(JSON.parse)
            .find(download => download.DownloadType === 'IsoX64')

        console.log(download.Uri.replace(/&amp;/g, '&'))
        process.exitCode = 0
    } catch (e) {
        console.error(e)
        process.exitCode = 1
    }
}())
