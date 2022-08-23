#!/usr/bin/env node

import { exec } from 'child_process';
import fetch from 'node-fetch'

function extractBuildNumber(version) {
    const matches = version.name.match(/(?:\(build |\[)([0-9.]+)(?:\)|\])$/)
    return matches[1]
}

async function fetchApiResultAndRequestDecision(prompt, url, nameKey, resultKey, sortFn, filterFn) {
    const res = await fetch(url)
    const body = await res.json()
    let entries = Object.values(body).pop()
    if (sortFn) {
        entries.sort(sortFn)
    }
    if (filterFn) {
        entries = entries.filter(filterFn)
    }

    const choice = await new Promise((resolve, reject) => {
        const cmdline = `yad --entry --center --title='Choose Windows ${prompt}' --entry-label="${prompt}" ${entries.map(e => `"${e[nameKey]}"`).join(' ')}`
        exec(cmdline, (error, stdout, stderr) => {
            if (error) {
                reject('Cancelled the operation')
            } else {
                resolve(stdout.trim())
            }
        })
    })

    return entries.find(e => e[nameKey] === choice)[resultKey]
}

async function fetchDownloadUrl(arch) {
    let res = await fetch(`https://tb.rg-adguard.net/dl.php?fileName=${arch}&lang=en`)
    const body = await res.text()
    const redirectUrl = body.match(/https:\/\/tb\.rg-adguard\.net\/dl\.php\?go=[0-9a-z]+/)[0]
    res = await fetch(redirectUrl, {method: 'HEAD', redirect: 'manual'})
    return res.headers.get('location')
}

(async function() {
    try {
        const version  = await fetchApiResultAndRequestDecision('Version', `https://tb.rg-adguard.net/php/get_version.php?type_id=1`, 'name', 'version_id', (a, b) => extractBuildNumber(b) - extractBuildNumber(a), (e) => !e.name.startsWith('Windows 8'))
        const edition  = await fetchApiResultAndRequestDecision('Edition', `https://tb.rg-adguard.net/php/get_edition.php?version_id=${version}&lang=name_en`, 'name_en', 'edition_id', null, null)
        const language = await fetchApiResultAndRequestDecision('Language', `https://tb.rg-adguard.net/php/get_language.php?edition_id=${edition}&lang=name_en`, 'name_en', 'language_id', null, null)
        const arch     = await fetchApiResultAndRequestDecision('ISO File Name (Architecture)', `https://tb.rg-adguard.net/php/get_arch.php?language_id=${language}`, 'name', 'arch_id', null, null)
        const url      = await fetchDownloadUrl(arch)
        if (!url.startsWith('https://software.download.prss.microsoft.com/')) {
            throw new Error('API returned a non-Microsoft download URL. Refusing to continue.')
        }
        console.log(url)
    } catch (e) {
        console.error(e)
        process.exitCode = 1
    }
}())
