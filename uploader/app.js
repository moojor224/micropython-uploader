function makeMonaco(element = createElement("span"), language, value = "") {
    console.log("making monaco", {
        element, language: language, value: value
    })
    let editor = monaco.editor.create(element, {
        value,
        language
    });
    return element;
}

// document.querySelector("#ampy-help").parentElement.add(createElement("button", {
//     innerHTML: "ampy help",
//     type: "button",
//     onclick: function () {
//         ampyHelp();
//     }
// }));

function parseFilesList(arr) {
    console.log("parsing files list");
    let ol = document.querySelector(".vtv");
    ol.innerHTML = "";
    arr.forEach(f => {
        let el = createElement("div", { style: "width:800px;height:600px;border:1px solid grey" });
        let { path, file } = f;
        ol.add(el);
        ol.add(makeMonaco(el, "python", file.replaceAll(/\r/g, "")));
    });
    // VanillaTreeViewer.renderAll();
}

function modal(text, icon = "fa-duotone fa-spinner-third fa-spin") {
    let modal = document.getElementById("modal");
    modal.innerHTML = "";
    modal.add(
        createElement("i", { classList: icon, style: "--fa-animation-duration: 1.5s;" }),
        createElement("span", { classList: "text-border white", innerHTML: text })
    );
    modal.classList.remove("hidden");
}

function clearModal(event, packet) {
    let modal = document.getElementById("modal");
    modal.innerHTML = "";
    modal.classList.add("hidden");
}

async function sleep(duration) {
    await new Promise(r => setTimeout(r, duration));
}

async function awaitMonaco() {
    while (!monaco) {
        await sleep(1000);
    }
}

async function init() {
    modal("getting serial ports");
    await getSerialPorts();
    setInterval(getSerialPorts, 3000);
    modal("waiting for monaco to initialize");
    await awaitMonaco();
    modal("getting ampy help docs");
    await ampyHelp();
    if (getSerialPort(true)) {
        modal("getting extended ampy help docs");
        await getMoreHelp();
    }
    clearModal();
}
init();

async function sendMessage(channel, data = "") {
    let response = await new Promise(function (resolve, reject) {
        let responseFunc = function (event, packet) {
            ipcRenderer.removeAllListeners(channel + "-response");
            // console.log(`got response on: "${channel}-response":`, packet);
            if (packet.error) {
                console.error("error:", packet);
                reject(packet);
            }
            resolve(packet);
        };
        ipcRenderer.on(channel + "-response", responseFunc);
        // console.log(`sending data on: "${channel}"`, data);
        ipcRenderer.postMessage(channel, data);
    });
    return response;
}

function getSerialPort(getDefault = false) {
    let el = document.getElementById("ports-form");
    let def = el.querySelector("input")?.value;
    let port = new FormData(el).get("selected-port");
    // console.log("selected port:", (port ? port : (getDefault ? def : port)));
    return (port ? port : (getDefault ? def : port));
}

async function updatePortsList(ports) {
    let form = document.getElementById("ports-form");
    let formData = new FormData(form);
    let port = formData.get("selected-port");
    form.innerHTML = "";
    form.add(
        createElement("table").add(
            createElement("label").add(
                createElement("span"),
                createElement("span", { innerHTML: "path" }),
                createElement("span", { innerHTML: "friendly name" }),
                createElement("span", { innerHTML: "serial number" }),
            ),
            ...ports.filter(e => e.manufacturer).map(p => {
                let el = createElement("label").add(
                    createElement("span").add(createElement("input", {
                        type: "radio",
                        name: "selected-port",
                        value: p.path
                    })),
                    createElement("span", { innerHTML: p.path }),
                    createElement("span", { innerHTML: p.friendlyName }),
                    createElement("span", { innerHTML: p.serialNumber }),
                );
                if (port == p.path) {
                    el.querySelector("input").checked = true;
                }
                return el;
            })
        )
    );
    if (!gotMoreHelp) {
        console.log("checking more help");
        let ismpy = await sendMessage("check-micropython", getSerialPort());
        console.log("ismpy", ismpy);
        if (!ismpy) return;
        modal("getting extended ampy help docs");
        await getMoreHelp();
        clearModal();
    }
}

async function ampyLS() {
    let files = await sendMessage("ampy-ls", getSerialPort());
    console.log("files:", files);
    parseFilesList(files);
}

let helpText;
async function ampyHelp() {
    helpText = await sendMessage("ampy-help");
    // console.log("ampy help:", helpText.replaceAll("\r", ""));
    document.getElementById("ampy-help").innerHTML = helpText;
}

let gotMoreHelp = false;
async function getMoreHelp() {
    if (!helpText) {
        return;
    }
    let help = helpText.replaceAll("\r", "").split("Commands:").pop().split("\n").map(e => e.trim()).filter(e => e);
    help = help.map(com => {
        com = com.split(" ").map(e => e.trim()).filter(e => e);
        let command = com.shift();
        let text = com.join(" ");
        return { command, text };
    });

    let port = getSerialPort();
    if (!port) {
        document.getElementById("ampy-more-help").innerHTML = "";
        document.getElementById("ampy-more-help").add(createElement("div", {
            innerHTML: "please select a micropython device to get extended help information for individual commands",
            style: {
                padding: "5px",
                backgroundColor: "#ff03",
            }
        }));
        return;
    }
    gotMoreHelp = true;
    for (let c in help) {
        help[c].helpText = await sendMessage("ampy-more-help", {
            command: help[c].command,
            port
        });
    }
    console.log(help);
    let moreHelpEl = document.getElementById("ampy-more-help");
    moreHelpEl.innerHTML = "";
    moreHelpEl.add(createElement("table").add(
        ...help.map(e => createElement("tr").add(
            createElement("td").add(
                createElement("pre", { innerHTML: e.command })
            ),
            createElement("td").add(
                createElement("pre", { innerHTML: e.text })
            ),
            createElement("td").add(
                createElement("pre", { innerHTML: e.helpText.replaceAll("\r", "") })
            ),
        ))
    ));
}

async function getSerialPorts() {
    let ports = await sendMessage("get-ports");
    // console.log("ports:", ports);
    updatePortsList(ports);
}