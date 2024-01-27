const { contextBridge, ipcRenderer, app } = require('electron');


// window.addEventListener('DOMContentLoaded', function () {
//     const replaceText = function (selector, text) {
//         const element = document.getElementById(selector);
//         if (element) {
//             element.innerText = text;
//         }
//     }

//     for (const type of ['chrome', 'node', 'electron']) {
//         replaceText(`${type}-version`, process.versions[type])
//     }
// });

contextBridge.exposeInMainWorld("ipcRenderer", {
    postMessage: function (channel, message) {
        ipcRenderer.send(channel, message);
    },
    on: function (channel, callback) {
        ipcRenderer.on(channel, callback);
    },
    off: function (channel, callback) {
        ipcRenderer.off(channel, callback);
    },
    removeAllListeners: function (channel) {
        ipcRenderer.removeAllListeners(channel);
    }
});

// ipcRenderer.on("toApp", function (event, message) {
//     window.postMessage(message);
// });