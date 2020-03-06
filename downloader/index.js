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
        .then(res => 
            fetch(`https://www.microsoft.com/en-us/api/controls/contentinclude/html?pageId=${step2_uuid}&host=www.microsoft.com&segments=software-download%2cwindows10ISO&query=&action=GetProductDownloadLinksBySku&sessionId=${session_id}&skuId=9030&language=English%20International&sdVersion=2`)
        )
})
.then(res => res.text())
.then(body => {
    body.match(/<a [^>]*href=(['"])(https:\/\/software-download.microsoft.com\/[^'"]*Win10_[0-9]{4,}_EnglishInternational_x64.iso[^'"]*)\1/)
    return RegExp.$2
})
.then(url => {
    console.log(url.replace(/&amp;/g, '&'))
    process.exitCode = 0
})
.catch(e => {
    console.error(e)
    process.exitCode = 1
})
