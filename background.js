const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const { exec } = require("child_process");
const { SerialPort } = require("serialport");

/**
 * checks if string is a valid serial port
 * @param {String} port serial port
 */
function sanitizeSerial(port) {
    let regex = /(COM\d+|\/dev\/tty(S\d+|\/\d+))/g;
    let matches = port.match(regex);
    if (!matches) {
        return false;
    }
    return matches[0];
}

async function getAllMPFiles(port, event) {
    console.log("getting all files");
    console.log("running:", `ampy -p ${port} ls / -r`);
    exec(`ampy -p ${port} ls / -r`, async function (error, stdout, stderr) {
        if (error) event.reply("ampy-ls-response", { error });
        if (stderr) event.reply("ampy-ls-response", { error: stderr });

        let paths = stdout.split(new RegExp("\r?\n", "g")).map((e) => e.trim()).filter((e) => e);

        for (let i = 0; i < paths.length; i++) {
            paths[i] = await new Promise(function (resolve, reject) {
                exec(`ampy -p ${port} get ${paths[i]}`, function (error, stdout, stderr) {
                    resolve({
                        path: paths[i],
                        file: stdout
                    });
                });
            })
        }
        event.reply("ampy-ls-response", paths);
    });

}
/**
 * @type {BrowserWindow}
 */
let mainWindow;
function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "uploader/preload.js"),
        },
    });
    mainWindow.maximize();
    mainWindow.loadFile("uploader/index.html");
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(function () {
    createWindow();
    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

ipcMain.on("ampy-ls", function (event, packet) {
    console.log("ampy ls: listing board files");
    let port = sanitizeSerial(packet);
    if (!port) {
        event.reply("ampy-ls-response", "piss off, hacker man");
        return;
    }
    getAllMPFiles(port, event);
});

ipcMain.on("get-ports", function (event, packet) {
    SerialPort.list().then((ports) => {
        event.reply("get-ports-response", ports);
    });
});

ipcMain.on("ampy-help", function (event, packet) {
    console.log("ampy: showing ampy help");
    exec("ampy", function (error, stdout, stderr) {
        if (error) {
            console.error("error:", error);
            event.reply("ampy-help-response", { error: error });
        }
        if (stderr) console.warn("stderr:", stderr);
        event.reply("ampy-help-response", stdout);
    });
})



// ipcMain.on("run", function(event, packet){
//     exec(packet, function (error, stdout, stderr) {
//         if (error) console.error("error:", error.message);
//         if (stderr) console.warn("stderr:", stderr);
//         event.reply("run-response", stdout);
//     });
// });
// ipcMain.on("toBackground", function (event, packet) {
//     let { message, data } = packet;
//     console.log("got message from app", packet);
//     if (message === "run") {

//     }
//     if (message === "ampy-help") {
//
//     } else if (message === "ampy-ls") {
//         console.log("ampy ls: listing board files");
//         let port = sanitizeSerial(data);
//         if (!port) {
//             event.reply("toApp", {
//                 message: "piss off, hacker man",
//                 data: null
//             });
//             return;
//         }
//         getAllMPFiles(data, event);
//     } else if (message == "ports-ls") {
//
//     }
// });
