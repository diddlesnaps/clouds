let {exec}  = require('child_process')
let fetch = require('node-fetch')

let now = (new Date).getTime()
let session_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (t) {
    let i = (now + Math.random() * 16) % 16 | 0;
    return now = Math.floor(now / 16),
    (t == 'x' ? i : i & 3 | 8).toString(16)
})

fetch(`https://www.microsoft.com/en-us/software-download/windows10ISO`)
.then(res => res.text())
.then(body => {
    body.match(/<div[^>]*id=(['"])SoftwareDownload_LanguageSelectionByProductEdition\1 [^>]*data-defaultPageId=(['"])([a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12})\2[^>]*>.*<div[^>]*id=(['"])SoftwareDownload_DownloadLinks\5 [^>]*data-defaultPageId=(['"])([a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12})\6/)
    const step1_uuid = RegExp.$3
    const step2_uuid = RegExp.$7
    return fetch(`https://www.microsoft.com/en-us/api/controls/contentinclude/html?pageId=${step1_uuid}&host=www.microsoft.com&segments=software-download%2cwindows10ISO&query=&action=getskuinformationbyproductedition&sessionId=${session_id}&productEditionId=1429&sdVersion=2`)
        .then(res => res.text())
        .then(step1_text => [...step1_text.matchAll(/<option value=['"]([^"']+)['"]>([^<])+<\/option>/g)])
        .then(languages => (
            languages
                .map(language => language[1].replace(/&quot;/g, '"'))
                .map(JSON.parse)
        ))
        .then(languages => {
            return new Promise((resolve, reject) => {
                let prompt = exec(`yad --entry --center --title='Choose language' --entry-label=Language ${languages.map(lang => `"${lang.language}"`).join(' ')}`, (error, stdout, stderr) => {
                    if (error) {
                        reject('Cancelled the operation')
                    }
                    resolve(stdout.trim())
                })
            })
            .then(language => languages.find(el => el.language === language))
        })
        .then(language =>
            fetch(`https://www.microsoft.com/en-us/api/controls/contentinclude/html?pageId=${step2_uuid}&host=www.microsoft.com&segments=software-download%2cwindows10ISO&query=&action=GetProductDownloadLinksBySku&sessionId=${session_id}&skuId=${language.id}&language=${encodeURIComponent(language.language)}&sdVersion=2`)
            .then(res => res.text())
            .then(body => [
                ...body.matchAll(/<input type="hidden" class="product-download-hidden" value="([^"]+)"/g)]
                .map(download => download[1].replace(/&quot;/g, `"`).replace(/(IsoX86|IsoX64)/g, `"$1"`))
                .map(JSON.parse)
                .find(download => download.DownloadType === 'IsoX64')
            )
        )
})
.then(download => {
    console.log(download.Uri.replace(/&amp;/g, '&'))
    process.exitCode = 0
})
.catch(e => {
    console.error(e)
    process.exitCode = 1
})
