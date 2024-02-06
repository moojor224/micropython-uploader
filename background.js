const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const { exec } = require("child_process");
const { SerialPort } = require("serialport");
const fs = require("node:fs");


/**
 * checks if string is a valid serial port
 * @param {String} port serial port
 */
function sanitizeSerial(port = "") {
    port = (typeof port == "string") ? port : "";
    let regex = /(COM\d+|\/dev\/tty(S\d+|\/\d+|ACM\d+))/g;
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
                        content: (error ? false : (stderr ? false : stdout))
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

let globals = { __dirname };
ipcMain.on("get", function (event, packet) {
    event.reply("get-response", globals[packet]);
});

let connectedBoard = "";
ipcMain.on("connect", function (event, packet) {
    let port = sanitizeSerial(packet);
    if (!port) {
        event.reply("connect-response", "piss off, hacker man");
        return;
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
});

ipcMain.on("ampy-more-help", function (event, packet) {
    console.log(`ampy: showing more ampy help for ${packet.command}`);
    exec(`ampy -p ${packet.port} ${packet.command.replaceAll(/[^a-z]/g, "")} --help`, function (error, stdout, stderr) {
        if (error) {
            console.error("error:", error);
            event.reply("ampy-more-help-response", { error: error });
        }
        if (stderr) console.warn("stderr:", stderr);
        event.reply("ampy-more-help-response", stdout);
    });
})

ipcMain.on("check-micropython", function (event, packet) {
    console.log("checking if device is a micropython device");
    let port = sanitizeSerial(packet);
    if (!port) return event.reply("check-micropython-response", ["piss off, hacker man", packet]);
    exec(`ampy -p ${port} ls --help`, function (error, stdout, stderr) {
        if (error) event.reply("check-micropython-response", false) // not a mpy device
        if (stderr) event.reply("check-micropython-response", false); // not a mpy device
        event.reply("check-micropython-response", true); // mpy device
    });
});

async function updateFileContents(path, contents) {

}