#!/usr/bin/env node

let fs = require('fs');
let path = require('path');
let css = require('css');

function parseStyles(htmlFilename, cssFilename) {
    let html = fs.readFileSync(path.join(process.cwd(), htmlFilename), 'utf8');
    let stylesheet = fs.readFileSync(path.join(process.cwd(), cssFilename), 'utf8');
    let parsed;
    try {
        parsed = css.parse(stylesheet);
    } catch (err) {
        throw new Error(`${err.reason} in ${path.basename(cssFilename)} ${err.line}:${err.column}
`)
    }
    if (parsed.stylesheet.parsingErrors.length != 0) {
        parsed.stylesheet.parsingErrors.forEach(err => console.log(err))
        throw (Error("Error parsing stylesheet - exiting"))
    }

    let filterRule = filterRuleFactory(html);

    console.log(`Filtering ${parsed.stylesheet.rules.length} Rules`)
    parsed.stylesheet.rules = parsed.stylesheet.rules.filter(filterRule)

    return css.stringify(parsed);
}

function filterRuleFactory(html) {
    let filterRule = function(rule) {
        if (rule.rules) {
            rule.rules = rule.rules.filter(filterRule)
            if (rule.rules.length) return true;
        }
        if (rule.selectors) {
            let parsedSel = rule.selectors.map((rs) => {
                if (rs.indexOf('menu') >= 0) console.log(rs);
                    return rs.replace(/\[.*\]/g, " ").replace(/(\.|#|>)+/g, " ").split(/\s+/g).map(s => {
                        return s.replace(/:.+/, '')
                    }).filter(s => s && s.length)
            })

            return parsedSel.some(sel => {
                return sel.every(s => {
                   if (s == 'menu-wrap') console.log(s)
                   else if (s.indexOf('menu-wrap') >= 0) console.log("part menu: " + s)
                   return (!s || html.indexOf(s) >= 0)
                })
            })
        } else {
            return false;
        }
        
    }
    return filterRule;
}

function main() {
    if (process.argv[2] && process.argv[3]) {
        let onlyUsed = parseStyles(process.argv[2], process.argv[3]);
        let styleDirName = path.dirname(path.join(process.cwd(), process.argv[3]))
        let outName = path.join(styleDirName, 'onlyused.css')
        console.log(`Writing to ${outName}...`)
        fs.writeFileSync(outName, onlyUsed)
        console.log("Finished!")
    }
}

main();


