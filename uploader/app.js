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

document.body.add(createElement("button", {
    innerHTML: "ampy help",
    onclick: function () {
        ampyHelp();
    }
}));

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
        createElement("span", { innerHTML: text })
    );
    modal.classList.remove("hidden");
}

function clearModal(event, packet) {
    let modal = document.getElementById("modal");
    modal.innerHTML = "";
    modal.classList.add("hidden");
}

async function init(){
    modal("getting serial ports");
    await getPorts();
    clearModal();
}
init();

async function sendMessage(channel, data = "") {
    let response = await new Promise(function (resolve, reject) {
        let responseFunc = function (event, packet) {
            ipcRenderer.removeAllListeners(channel + "-response");
            console.log(`got response on: "${channel}-response":`, packet);
            if(packet.error){
                console.error("error:", packet);
                reject(packet);
            }
            resolve(packet);
        };
        ipcRenderer.on(channel + "-response", responseFunc);
        console.log(`sending data on: "${channel}"`, data);
        ipcRenderer.postMessage(channel, data);
    });
    return response;
}

function getSerialPort() {
    let port = new FormData(document.getElementById("ports-form")).get("selected-port");
    console.log("selected port:", port);
    return port;
}

function updatePortsList(ports) {
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
            ...ports.map(p => {
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
}

async function ampyLS() {
    let files = await sendMessage("ampy-ls", getSerialPort());
    console.log("files:", files);
    parseFilesList(files);
}

async function ampyHelp() {
    let help = await sendMessage("ampy-help");
    console.log("ampy help:", help.replaceAll("\r", ""));
    document.getElementById("ampy-help").innerHTML = help;
}

async function getPorts() {
    let ports = await sendMessage("get-ports");
    console.log("ports:", ports);
    updatePortsList(ports);
}