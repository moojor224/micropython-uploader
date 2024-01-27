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
    let data = await new Promise(function (resolve, reject) {
        console.log("running ls -r");
        exec(`ampy -p ${port} ls / -r`, async function (error, stdout, stderr) {
            if (error) resolve("");
            if (stderr) resolve("");
            let paths = stdout.split(new RegExp("\r?\n", "g")).map(e => e.trim()).filter(e => e);
            for (let i = 0; i < paths.length; i++) {
                paths[i] = {
                    path: paths[i],
                    file: await new Promise(function (res) {
                        exec(`ampy -p ${port} get ${paths[i]}`, async function (error, stdout, stderr) {
                            console.log("ran:", `ampy -p ${port} get ${paths[i]}`);
                            res(stdout.replaceAll("\r\n", "\n"));
                        });
                    })
                };
            }
            resolve(paths);
        });
    });
    event.reply("toApp", {
        message: "ampy-ls-response",
        data
    });
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "uploader/preload.js"),
            // webSecurity: false
        }
    });
    ipcMain.on("toBackground", function (event, packet) {
        let { message, data } = packet;
        console.log("got message from app", packet);
        if (message === "ampy-help") {
            console.log("ampy: showing ampy help");
            exec("ampy", function (error, stdout, stderr) {
                if (error) console.error("error:", error.message);
                if (stderr) console.warn("stderr:", stderr);
                event.reply("toApp", {
                    message: "ampy-help-response",
                    data: stdout
                });
            });
        } else if (message === "ampy-ls") {
            console.log("ampy ls: listing board files");
            let port = sanitizeSerial(data);
            if (!port) {
                event.reply("toApp", {
                    message: "piss off, hacker man",
                    data: null
                });
                return;
            }
            getAllMPFiles(data, event);
        } else if (message == "ports-ls") {
            SerialPort.list().then(p => {
                event.reply("toApp", {
                    message: "ports-list",
                    data: p
                });
            });
        }
    });

    mainWindow.loadFile("uploader/index.html");

    mainWindow.webContents.openDevTools();
}

app.whenReady().then(function () {
    createWindow()

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
})

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
