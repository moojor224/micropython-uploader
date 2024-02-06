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
    while (!window.monaco) {
        await sleep(1000);
    }
}

async function init() {
    document.getElementById("connect-button").addEventListener("click", function () {
        connectToBoard();
    });
    modal("getting serial ports");
    await getSerialPorts();
    document.getElementById("ampy-more-help-button").addEventListener("click", getSerialPorts);
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
    form.querySelectorAll(":not(button)").forEach(e => e.remove());
    form.insertAdjacentElement(
        "afterbegin",
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
        if (!await sendMessage("check-micropython", getSerialPort())) return;
        modal("getting extended ampy help docs");
        await getMoreHelp();
        clearModal();
    }
}

async function ampyLS() {
    let files = await sendMessage("ampy-ls", getSerialPort());
    return files;
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

class FileTree {
    constructor(config) {
        extend(this, config);
    }
    /**
     * @type {TreeItem[]}
     */
    children = [];
    label = "";
    type = "";
    content = "";
    path = [];
    /**
     * 
     * @param {String[]} path file path
     * @param {String} content file contents
     * @param {String[]} fullPath full path to the file
     */
    addFile(path, content, fullPath = null) {
        // debugger
        if (!Array.isArray(path)) path = path.split("/");
        fullPath = fullPath || JSON.parse(JSON.stringify(path));
        if (path.length > 1) {
            let target = path.shift();
            let file = this.find(target)
            if (file) {
                file.addFile(path, content);
            } else {
                let newFolder = new FileTree({
                    type: "folder",
                    label: target
                });
                newFolder.addFile(path, content, fullPath);
                this.children.push(newFolder);
            }
        } else {
            if (content === false) {
                let newFolder = new FileTree({
                    type: "folder",
                    label: path[0]
                });
                this.children.push(newFolder);
            } else {
                this.children.push(new FileTree({
                    type: "file",
                    label: path[0],
                    content,
                    fullPath
                }));
            }

        }
        this.children.sort(dynamicSort("label")).sort(dynamicSort("-type"));
    }

    json() {
        return ({
            label: this.label,
            children: this.children.map(e => e.json()),
        });
    }

    find(file) {
        for (let f of this.children) {
            if (f.label == file && f.type == "folder") {
                return f;
            }
        }
    }

    isOpen = false;
    /**
     * @type {Tab}
     */
    tab = null;
    open() {
        // console.log("open", this.content);
        this.isOpen = true;
        this.tab = new Tab({
            name: this.label,
            code: this.content.replaceAll("\r", "")
        });
        console.log("opened", this.tab);
        this.tab.makeMonaco();
    }

    render() {
        let el = createElement("div");
        if (this.type == "folder") {
            let details = createElement("details").add(
                createElement("summary", {
                    innerHTML: this.label
                }),
                createElement("ul").add(
                    ...this.children.map(e => createElement("li").add(
                        e.render()
                    ))
                )
            );
            details.setAttribute("open", "");
            el.add(details);
        } else {
            let node = this;
            el.add(createElement("button", {
                innerHTML: this.label,
                onclick: function () {
                    if (node.isOpen) return node.tab.focus();
                    node.open();
                }
            }));
        }
        return el;
    }
}

async function connectToBoard() {
    modal("connecting to board");
    let files = await ampyLS();
    clearModal();
    console.log("files:", files);
    files = files.map(f => {
        let path = f.path.split("/");
        path.shift();
        return { path, content: f.content };
    });
    let tree = new FileTree({
        label: "root",
        type: "folder"
    });
    files.forEach(f => {
        tree.addFile(f.path, f.content);
    });
    console.log(tree.json());
    document.querySelector(".file-tree").add(tree.render());
}