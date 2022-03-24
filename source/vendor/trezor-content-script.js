const { browser } = require('webextension-polyfill-ts');

/*
Passing messages from background script to popup
*/

let port = browser.runtime.connect({ name: 'trezor-connect' });

port.onMessage.addListener((message) => {
  window.postMessage(message, window.location.origin);
});

port.onDisconnect.addListener(() => {
  port = null;
});

/*
Passing messages from popup to background script
*/

window.addEventListener('message', (event) => {
  if (port && event.source === window && event.data) {
    port.postMessage({ data: event.data });
  }
});
