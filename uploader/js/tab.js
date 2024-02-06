"use strict";

function template(strings, ...keys) {
    return (...values) => {
        const dict = values[values.length - 1] || {};
        const result = [strings[0]];
        keys.forEach((key, i) => {
            const value = Number.isInteger(key) ? values[key] : dict[key];
            result.push(value, strings[i + 1]);
        });
        return result.join("");
    };
}





let tabIndex = 0;
let tabCSS = template`div.tabbed-view:has(div.tabs>tab.tab${"index"} input:checked)>div.content>div.tab${"index"}`;
let tabStyle = createElement("style");
document.head.add(tabStyle);

function generateCSS() {
    let tabCSSArray = [];
    for (let i = 0; i < tabIndex; i++) {
        tabCSSArray.push(tabCSS({ index: i }));
    }
    tabStyle.innerHTML = `${tabCSSArray.join(",\n")}{\n\tdisplay: block;\n}`
}

class Tab {
    #tab = this;
    config = {
        name: "new tab",
        tab_container: "#inner_tabs",
        content_container: "#inner_content",
        language: "python",
        name_prefix: "inner-",
        code: `def main():\n    print("this is tab ${this.index}")`,
        autoSaveInterval: 1500,
    }

    constructor(config = {}) {
        this.index = tabIndex++;
        extend(this.config, config);

        this.tab = createElement("tab", {
            classList: "tab" + this.index
        }).add(
            createElement("label").add(
                createElement("span", {
                    innerHTML: "tab " + this.index
                }),
                createElement("input", {
                    type: "radio",
                    name: "tabs",
                    checked: true
                }),
            ),
        );
        this.content = createElement("div", {
            classList: "tab" + this.index
        });
        if (typeof this.config.content_container == "string") this.config.content_container = document.querySelector(this.config.content_container);
        if (typeof this.config.tab_container == "string") this.config.tab_container = document.querySelector(this.config.tab_container);
        this.config.content_container.add(this.content);
        this.config.tab_container.add(this.tab);
    }

    close() {
        this.monaco.dispose();
        this.content.remove();
        this.tab.remove();
    }

    timeout = null;
    makeMonaco() {
        // console.trace(this.content);
        this.editor = monaco.editor.create(this.content, {
            value: this.config.code,
            language: this.config.language,
            automaticLayout: true
        });
        let tab = this;
        this.editor.getModel().onDidChangeContent(function () {
            clearTimeout(this.timeout);
            tab.timeout = setTimeout(function () {
                this.saveFile();
            }, this.config.autoSaveInterval);
        });
    }

    focus() {
        this.tab.querySelector("input").click();
    }

}