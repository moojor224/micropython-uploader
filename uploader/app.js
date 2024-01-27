var electron = window.electron;

document.body.add(createElement("button", {
    innerHTML: "ampy help",
    onclick: function () {
        electron.postMessage("toBackground", {
            message: "ampy-help",
            data: {}
        });
    }
}));

function parseFilesList(arr) {
    console.log("parsing files list");
    let ol = document.querySelector("ol.vtv");
    ol.innerHTML = "";
    arr.forEach(f => {
        let { path, file } = f;
        ol.add(createElement("li", {
            dataset: {
                path: path.substring(1),
                language: "python"
            },
            innerHTML: file//.replaceAll(/\r?\n/g, "<br>")
        }));
    });
    VanillaTreeViewer.renderAll();
}

electron.on("toApp", function (event, packet) {
    console.log("got message from background.js:", packet);
    let { message, data } = packet;
    if (message === "ampy-help-response") {
        document.getElementById("ampy-help").innerHTML = data;
    } else if (message === "ampy-ls-response") {
        parseFilesList(data);
    }
});

