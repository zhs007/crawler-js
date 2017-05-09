const {ChromeLauncher} = require('lighthouse/lighthouse-cli/chrome-launcher');
const chrome = require('chrome-remote-interface');

function onPageLoad(Runtime) {
    const js = "document.querySelector('title').textContent";

    // Evaluate the JS expression in the page.
    return Runtime.evaluate({expression: js}).then(result => {
        console.log('Title of page: ' + result.result.value);
    });
}

function launchChrome(port) {
    const launcher = new ChromeLauncher({
        port: port,
        autoSelectChrome: true, // False to manually select which Chrome install.
        additionalFlags: [
            '--window-size=1280,720',
            '--disable-gpu',
            '--headless'
        ]
    });

    return launcher.run().then(() => launcher)
        .catch(err => {
            return launcher.kill().then(() => { // Kill Chrome if there's an error.
                throw err;
            }, console.error);
        });
}

launchChrome(9222).then(launcher => {

    chrome(protocol => {
        // Extract the parts of the DevTools protocol we need for the task.
        // See API docs: https://chromedevtools.github.io/devtools-protocol/
        const {Page, Runtime, DOM} = protocol;

        // First, need to enable the domains we're going to use.
        Promise.all([
            Page.enable(),
            Runtime.enable(),
            DOM.enable()
        ]).then(() => {
            Page.navigate({url: 'http://fund.jrj.com.cn/archives,530012,jjjz.shtml'});

            // Wait for window.onload before doing stuff.
            Page.loadEventFired(() => {
                onPageLoad(Runtime).then(() => {
                    protocol.close();
                    launcher.kill(); // Kill Chrome.
                });
            });

        });

    }).on('error', err => {
        throw Error('Cannot connect to Chrome:' + err);
    });

});

exports.launchChrome = launchChrome;