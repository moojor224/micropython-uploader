/**
 * 
 * @param {String} query css selector to wait for
 * @param {Function} callback callback function to run when the element is found
 * @param {Boolean} stopAfterFound whether to stop looking after the element is found
 * @param {Element} [element=document] parent element to look within -  defaults to document
 */
function waitForKeyElements(query, callback, stopAfterFound, element) {
    currentlyWorking = true;
    var o, r;

    (o = void 0 === element ? $(query) : $(element).contents().find(query)) &&
        o.length > 0
        ? ((r = !0),
            o.each(function () {
                var e = $(this);
                e.data("alreadyFound") ||
                    false ||
                    (callback(e) ? (r = false) : e.data("alreadyFound", true));
            }))
        : (r = false);
    var l = waitForKeyElements.controlObj || {},
        i = query.replace(/[^\w]/g, "_"),
        c = l[i];
    r && stopAfterFound && c
        ? (clearInterval(c), delete l[i])
        : c ||
        ((c = setInterval(function () {
            waitForKeyElements(query, callback, stopAfterFound, element);
        }, 1000)),
            (l[i] = c));
    waitForKeyElements.controlObj = l;
} //wait for key elements



/**
 * takes in a string and object, and returns an HTMLElement with tag "tag" and properties defined by data\
 * OR\
 * takes in an object and merges the properties from data into it
 * @param {keyof HTMLElementTagNameMap} tag html tag name, or object to apply properties to
 * @param {object} data object with properties to be applied
 * @returns {HTMLElement}
 * @example
 * createElement("div", {
 *      innerHTML: "Text Here",
 *      style: {
 *          color: red,
 *          fontSize: "20px",
 *          padding: "3px"
 *      },
 *      dataset: {
 *          title: "title"
 *      }
 * });// <div style="color: red; font-size: 20px; padding: 3px;" data-title="title">Text Here</div>
 */

// an unintended benefit of this function is that it can also function similar to jQuery's extend function
// jQuery.extend(target, source1, source2)
// createElement(target, source1); createElement(target, source2);
// although this may work most of the time, it may not always work
function createElement(tag = "span", data = {}) {
    tag = typeof tag === "string" ? document.createElement(tag) : tag;
    Object.keys(data).forEach((e) => {
        if (typeof data[e] === "object") {
            createElement(tag[e] || (tag[e] = {}), data[e]);
        } else {
            if (tag.constructor?.name?.includes("Element")) {
                try {
                    // tag.setAttribute(e, data[e]);
                } catch (err) { }
            }
            tag[e] = data[e];
        }
    });
    return tag;
}

/*
 * @external Element
 */
/**
 * appends any number of objects to an HTMLElement
 * @param  {...Element} args an array of objects to be added to the parent element
 * @returns {this}
 * @memberof Element
 * @function external:Element#add
 * @example
 * createElement("table").add(
 *      createElement("tr").add(
 *          createElement("td", {innerHTML: "col 1"}),
 *          createElement("td", {innerHTML: "col 2"}),
 *          createElement("td", {innerHTML: "col 3"})
 *      )
 * );
 */
function add(...args) {
    args.forEach((elem) => {
        this.append(elem);
    });
    return this;
};

Object.getOwnPropertyNames(window).filter(e => e.startsWith("HTML") && e.endsWith("Element")).forEach(e => {
    if (window[e].prototype.add !== add) {
        window[e].prototype.add = add
    }
});

window.Element.prototype.add = add;
// window.HTMLSelectElement.prototype.add = add;

/**
 * Description of the function
 * @name Element.prototype.error
 * @kind function
 * @param {String} text error message
 */

/**
 * appends an &lt;error> element to {this}
 * @param {String} text error message
 */
window.Element.prototype.error = function (text = "!") {
    this.querySelector("error")?.remove();
    this.add(createElement("error", { innerHTML: text }));
}

/**
 * clears the error message from {this}
 */
window.Element.prototype.clearError = function () {
    this.querySelector("error")?.remove();
}

/**
 * appends a &lt;warning> element to {this}
 * @param {String} text warning message
 */
window.Element.prototype.warn = function (text = "!") {
    this.querySelector("warn")?.remove();
    this.add(createElement("warn", { innerHTML: text }));
}

/**
 * clears the warning message from {this}
 */
window.Element.prototype.clearWarn = function (text = "!") {
    this.querySelector("warn")?.remove();
}

window.Element.prototype.clear = function () {
    // while(this.firstChild){
    //     this.firstChild.remove();
    // }
    this.innerHTML = "";
}

/**
 * sets the tab's favicon to a square with the specified color
 * @param {string} color color of the square
 */
function tabColor(color) {
    function isValidCSSColor(color2) {
        if (["unset", "initial", "inherit"].includes(color2)) {
            return false;
        }
        const s = new Option().style;
        s.color = color2;
        return s.color !== "";
    }
    if (!isValidCSSColor(color)) {
        return;
    }
    var c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    var ctx = c.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 128);
    var link = document.querySelector("link[rel=icon]") || document.createElement("link");
    link.href = c.toDataURL();
    link.rel = "icon";
    document.head.append(link);
}

/**
 * parses cookies into a hashmap
 * @param {string} [cookies=document.cookie] cookies to parse
 * @returns {Map} hashmap of all cookies
 */
function parseCookies(cookies = document.cookie) {
    console.log(cookies);
    let reading = !1;
    let escaped = !1;
    let quoted = NaN;
    let key = "";
    let value = "";
    let map = new Map();
    cookies.trim().split("").forEach((e) => {
        if (escaped) {
            value += e;
            escaped = false;
        } else if (reading) {
            if (quoted == NaN) {
                quoted = e == '"';
                if (!quoted) {
                    value += e;
                }
            } else if ((e == '"' && quoted) || (e == ";" && !quoted)) {
                quoted = NaN;
                map.set(key.trim(), value);
                reading = false;
                value = "";
                key = "";
            } else {
                value += e;
            }
        } else if (e == "=") {
            reading = true;
        } else {
            key += e;
        }
    });
    if (key != "") {
        map.set(key.trim(), value);
    }
    return map;
}

/**
 * generates a array sort function that sorts an array of objects by a specified property name
 * @param {string} prop name of the property to sort by
 * @returns {function} the sort function
 * @example 
 * ```javascript
 * var People = [
 *     {Name: "Name", Surname: "Surname"},
 *     {Name:"AAA", Surname:"ZZZ"},
 *     {Name: "Name", Surname: "AAA"}
 * ];
 * People.sort(dynamicSort("Name"));
 * People.sort(dynamicSort("Surname"));
 * People.sort(dynamicSort("-Surname"));
 * ```
 */
function dynamicSort(prop) {
    var sortOrder = 1;
    if (typeof prop === "string" && prop[0] === "-") {
        sortOrder = -1;
        prop = prop.substring(1);
    }
    return function (a, b) {
        var result = a[prop] < b[prop] ? -1 : a[prop] > b[prop] ? 1 : 0;
        return result * sortOrder;
    };
}

/**
 * returns css rgb string based off of a percent value of a gradient
 * @param {number} p number in range from 0-100
 * @param {Array} colors array of rgb colors
 * @returns {string}
 */
function rgbGradient(
    p,
    colors = [
        { r: 255, g: 0, b: 0 }, // low (0%)
        { r: 255, g: 127, b: 0 },
        { r: 255, g: 255, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
        { r: 255, g: 0, b: 255 }, // high(100%);
    ]
) {
    p = typeof p === "string" ? parseInt(p) : p;
    var numChunks = colors.length - 1;
    var chunkSize = 100 / numChunks;
    for (var i = 1; i <= numChunks; i++) {
        if (p <= chunkSize * i) {
            var percent = ((p + (1 - i) * chunkSize) * numChunks) / 100;

            var c1 = colors[i],
                c2 = colors[i - 1];

            var a = [];
            Object.keys(colors[0]).forEach((e) => {
                a.push(Math.floor((c1[e] * percent + c2[e] * (1 - percent)) * 100) / 100);
            });
            return "rgb(" + a.join(",") + ")";
        }
    }
}

/**
 * proportionately maps a number from an input range to an output range
 * @param {Number} x value
 * @param {Number} inmin input range lower bound
 * @param {Number} inmax input range upper bound
 * @param {Number} outmin output range lower bound
 * @param {Number} outmax output range upper bound
 * @returns {Number}
 */
function map(x, inmin, inmax, outmin, outmax) {
    return (x - inmin) * (outmax - outmin) / (inmax - inmin) + outmin;
}

/**
 * generates a gradient of colors from the specified array
 * @param {Number} count number of colors to generate
 * @param {Object[]} colors array of colors in gradient
 * @returns {String[]} array of colors generated
 */
function gradient(count, colors = [
    { r: 255, g: 0, b: 0 }, // low (0%)
    { r: 255, g: 127, b: 0 },
    { r: 255, g: 255, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 0, b: 255 }, // high(100%);
]) {
    if (count == 1) {
        let { r, g, b } = colors[0];
        return [`rgb(${r},${g},${b})`];
    }
    let arr = new Array(count).fill("");
    arr = arr.map((e, n) => rgbGradient(map(n, 0, count - 1, 0, 100), colors));
    return arr;
    // let half = Math.floor(count / 2);
    // let first = arr.slice(0, half);
    // let second = arr.slice(half, count);
    // return interleaveArrays(false, first, second);
}

function interleaveArrays(fill, ...arrays) {
    let max = Math.max(...arrays.map(e => e.length));
    if (fill) arrays = arrays.map(arr => [...arr, ...new Array(max - arr.length).fill(null)]);
    let change = true;
    let result = [];
    let count = 0;
    while (change && count < 100) {
        count++;
        change = false;
        arrays.forEach(arr => {
            if (arr.length > 0) {
                change = true;
                result.push(arr.shift());
            }
        });
    }
    return result;
}

/**
 * sets `console.everything` to an array of the console's history\
 * run this before using any console logging functions in order to capture everything
 */
function captureConsole() {
    if (console.everything === undefined) {
        console.everything = [];

        console.defaultLog = console.log.bind(console);
        console.log = function (...args) {
            console.everything.push({
                type: "log",
                datetime: Date().toLocaleString(),
                value: Array.from(...args),
            });
            console.defaultLog.apply(console, args);
        };
        console.defaultError = console.error.bind(console);
        console.error = function (...args) {
            console.everything.push({
                type: "error",
                datetime: Date().toLocaleString(),
                value: Array.from(...args),
            });
            console.defaultError.apply(console, args);
        };
        console.defaultWarn = console.warn.bind(console);
        console.warn = function (...args) {
            console.everything.push({
                type: "warn",
                datetime: Date().toLocaleString(),
                value: Array.from(...args),
            });
            console.defaultWarn.apply(console, args);
        };
        console.defaultDebug = console.debug.bind(console);
        console.debug = function (...args) {
            console.everything.push({
                type: "debug",
                datetime: Date().toLocaleString(),
                value: Array.from(...args),
            });
            console.defaultDebug.apply(console, args);
        };
    }
}

/**
 * takes in an object and returns an array of all it's children, recursive
 * @param {object} arr object to flatten
 * @returns {object[]} array of all children
 */
function flattenChildren(arr) {
    return [arr, ...(arr.children?.flatMap((e) => flattenChildren(e)) || [])];
}

/**
 * takes in an HTMLElement and returns an array of all it's descendants
 * @param {HTMLElement} el element to flatten
 * @returns {HTMLElement[]} array of all children
 */
function flattenChildNodes(el) {
    return [el, ...([...el.childNodes].flatMap((e) => flattenChildNodes(e)) || [])];
}

/**
 * internally-used function to convert local times to UTC
 * @param {Date} b 
 * @returns {string}
 */
function convertTime(b) {
    b.setHours(b.getHours() + new Date().getTimezoneOffset() / 60);
    return b.toISOString();
}

/**
 * returns the value of the given css variable name
 * @param {string} varname css variable name
 * @returns {string} value of css variable
 */
function getColor(varname) {
    return getComputedStyle(document.querySelector(":root")).getPropertyValue(varname);
}

/**
 * 
 * @param {Function} val function to call
 * @param  {...any} args arguments to pass to function
 * @returns returns an object whose value will automatically follow the 
 */
function lockValue(val, ...args) {
    return class {
        constructor() { }
        static valueOf() {
            return val(...args);
        }
    }
}

/**
 * logs all colors on the page to console, grouped by text color and background color
 * 
 * show each individual element in each group
 */
function listAllColorsOnPage() {
    function hexToRgb(color) {
        if (color.match(/#?([a-zA-Z0-9]{8}|[a-zA-Z0-9]{6}|[a-zA-Z0-9]{3,4})/g)?.at(0) === color) {
            color = color.replace("#", "");
            let split, a;
            switch (color.length) {
                case 4:
                    a = true;
                case 3:
                    split = color.split("");
                    break;
                case 8:
                    a = true;
                case 6:
                    split = color.match(/.{1,2}/g);
                    break;
            }
            return `rgb${a ? "a" : ""}(${split.map((e, n) => parseInt(e.padStart(2, e), 16) / (n == 3 ? 255 : 1)).join(", ")})`;
        }
    }

    function rgbToHex(rgb) {
        return "#" + rgb.replaceAll(/[^0-9\.,]/g, "").split(",").map((e, n) => parseInt(e * (n == 3 ? 255 : 1)).toString(16).padStart(2, e)).join("");
    }
    rgbToHex("rgba(255, 255, 255, 0.5)");

    function flattenChildren(item) {
        return [item, ...([...item.children]?.flatMap((e) => flattenChildren(e)) || [])];
    }

    function getColor(rgb) {
        let [r, g, b] = rgb.replaceAll(/[^0-9 ]/g, "").split(" ");
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000000' : '#FFFFFF';
    }

    var colorProps = ["backgroundColor", "color"];

    function displayResults(array) {
        array.forEach(e => {
            console.groupCollapsed(`%c${rgbToHex(e.value)} (${(e.varName)})`, `
    color: ${getColor(e.value)};
    background-color: ${e.value};
    padding: 20px;
    line-height: 60px;
    font-size: 20px;
    `);
            colorProps.forEach(prop => {
                if (e[prop].length > 0) {
                    console.groupCollapsed("%c " + prop, "font-size: 20px;");
                    e[prop].forEach(v => {
                        console.log(v[0]);
                    });
                    console.groupEnd();
                }
            })
            console.groupEnd();
        });
    }

    var arr = [...new Array(106).fill(0).map((e, n) => "--color" + (n + 1)), ...new Array(10).fill(1).map((e, n) => "--transparent" + (n + 1))];
    var root = getComputedStyle(document.querySelector(":root"));
    var els = flattenChildren(document.body).map(e => [e, getComputedStyle(e)]);
    arr = arr.map(c => {
        let color = root.getPropertyValue(c);
        color = hexToRgb(color);
        let obj = {
            value: color,
            varName: c,
        };
        colorProps.forEach(e => {
            obj[e] = els.filter(r => r[1][e] === color);
        });
        //     console.log(obj);
        return obj;
    }).filter(e => colorProps.map(p => e[p].length > 0).includes(true));

    console.log(arr);
    displayResults(arr);
}

/**
 * clamps a number to a range\
 * \
 * if the number is outside the range, move it to the\
 * closest position inside the range, else do nothing
 * @param {Number} val value
 * @param {Number} min minimum of range
 * @param {Number} max maximum of range
 * @returns {Number} number clamped to range
 */
function clamp(val, min, max) {
    return (((min > max) ? ([min, max] = [max, min]) : 0), (val < min ? min : val > max ? max : val));
}

/**
 * @param {any | undefined} val 
 * @param {any} def 
 * @returns {any | undefined}
 */
function getValueOrDefault(val, def) {
    if (val === undefined || val === null) {
        return def;
    }
    return val;
}

const gvod = getValueOrDefault;

/**
 * puts the properties from source onto target
 * @param {Object} target 
 * @param {Object} source 
 */
function extend(target, source) {
    Object.keys(source).forEach(key => {
        target[key] = source[key];
    });
}

/**
 * converts a number stored in string format from into a different base
 * @param {String} str string containing to number to convert
 * @param {Number} fromBase base of the passed string
 * @param {Number} toBase base to convert to
 * @returns {String} string containing the converted number
 */
function convertBase(str, fromBase, toBase) {
    const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
    function add(x, y, base) {
        let z = [];
        const n = Math.max(x.length, y.length);
        let carry = 0;
        let i = 0;
        while (i < n || carry) {
            const xi = i < x.length ? x[i] : 0;
            const yi = i < y.length ? y[i] : 0;
            const zi = carry + xi + yi;
            z.push(zi % base);
            carry = Math.floor(zi / base);
            i++;
        }
        return z;
    }

    function multiplyByNumber(num, x, base) {
        if (num < 0) return null;
        if (num == 0) return [];

        let result = [];
        let power = x;
        while (true) {
            num & 1 && (result = add(result, power, base));
            num = num >> 1;
            if (num === 0) break;
            power = add(power, power, base);
        }

        return result;
    }

    function parseToDigitsArray(str, base) {
        const digits = str.split('');
        let arr = [];
        for (let i = digits.length - 1; i >= 0; i--) {
            const n = DIGITS.indexOf(digits[i])
            if (n == -1) return null;
            arr.push(n);
        }
        return arr;
    }

    const digits = parseToDigitsArray(str, fromBase);
    if (digits === null) return null;

    let outArray = [];
    let power = [1];
    for (let i = 0; i < digits.length; i++) {
        digits[i] && (outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase));
        power = multiplyByNumber(fromBase, power, toBase);
    }

    let out = '';
    for (let i = outArray.length - 1; i >= 0; i--)
        out += DIGITS[outArray[i]];

    return out;
}

class Settings {
    config = {
        name: "settings",
    };
    sections = [];

    constructor(config = {}, sections) {
        extend(this.config, config);
        if (!Array.isArray(sections)) {
            sections = [sections];
        }
        this.sections = sections.filter(e => e instanceof Section);
        sections.forEach(section => {
            section.settings_obj = this;
        });
    }

    render() {
        let div = createElement("div", {
            classList: "settings"
        }).add(
            createElement("h2", { innerHTML: this.config.name })
        );
        div.add(...this.sections.map(s => s.render()));
        return div;
    }

    getSection(name) {
        return this.sections.filter(e => e.config.name == name)[0];
    }

    export() {
        return JSON.stringify(this, function (key, value) {
            if (key.includes("_obj")) {
                return undefined;
            }
            return value;
        });
    }

    #listeners = [];
    dispatchEvent(type, config) {
        if (!config.target) {
            config.target = this;
        }
        this.#listeners.forEach(l => {
            if (l.type == type) {
                l.callback(config);
            }
        });
    }

    on(type, callback) {
        console.log("on", this.#listeners);
        this.#listeners.push({ type, callback });
    }

    off(type, callback) {
        console.log("off", this.#listeners);
        this.#listeners = this.#listeners.filter(l => l !== ({ type, callback }));
    }

    static loadJson(jsontext) {
        try {
            let json = JSON.parse(jsontext);
            let validate = Joi.object({
                config: Joi.object({
                    name: Joi.string().required()
                }).required(),
                sections: Joi.array().items(Joi.object({
                    config: Joi.object({
                        name: Joi.string().required()
                    }),
                    options: Joi.array().items(Joi.object({
                        config: Joi.object({
                            name: Joi.string().required(),
                            type: Joi.string().required(),
                            value: Joi.any(),
                            values: Joi.array()
                        }).required()
                    })).required()
                })).required()
            }).validate(json);
            if (validate.error) {
                console.error("invalid json data");
                console.error(validate.error);
            }
            return new Settings(json.config, json.sections.map(sec => {
                return new Section(sec.config, sec.options.map(opt => {
                    return new Option(opt.config);
                }));
            }));
        } catch (err) {
            console.error(err);
        }
    }
}

class Section {
    config = {
        name: "section",
    }
    options = [];

    constructor(config, options) {
        extend(this.config, config);
        if (!Array.isArray(options)) {
            options = [options];
        }
        this.options = options.filter(e => e instanceof Option);
        options.forEach(option => {
            option.section_obj = this;
        });
    }

    getOption(name) {
        return this.options.filter(e => e.config.name == name)[0];
    }

    render() {
        let section = createElement("section").add(
            createElement("h2", { innerHTML: this.config.name })
        );
        section.add(...this.options.map(o => o.render()));
        return section;
    }

    #listeners = [];
    dispatchEvent(type, config) {
        if (!config.target) {
            config.target = this;
        }
        this.#listeners.forEach(l => {
            console.log(l);
            if (l.type == type) {
                l.callback(config);
            }
        });
        this.settings_obj.dispatchEvent(type, config);
    }

    on(type, callback) {
        console.log("on", this.#listeners);
        this.#listeners.push({ type, callback });
    }

    off(type, callback) {
        console.log("off", this.#listeners);
        this.#listeners = this.#listeners.filter(l => l !== ({ type, callback }));
    }
}

class Option {
    config = {
        name: "option",
        type: "toggle",
        value: false,
    }

    constructor(config) {
        extend(this.config, config);
        if (config.value == undefined) {
            delete this.config.value;
        }
    }

    get value() {
        return this.config.value;
    }

    set value(val) {
        this.config.value = val;
    }

    render() {
        let label = createElement("label");
        let span = createElement("span", {
            innerHTML: this.config.name
        });
        let input = this.createInput();
        label.add(span, input);
        return label
    }

    createInput() {
        let input;
        let option = this;
        if (this.config.type == "toggle") {
            input = createElement("input", {
                type: "checkbox",
                classList: "slider"
            });
        } else if (this.config.type == "dropdown") {
            input = createElement("select");
            let values = [];
            if (this.config.values || (!["undefined", "null"].includes(typeof this.config.values))) { // if list of values is defined
                if (!Array.isArray(this.config.values)) { // if values is not an array, make it one
                    this.config.values = [this.config.values];
                }
                values.push(...this.config.values); // add defined values to list
            }
            values = Array.from(new Set(values)); // remove duplicates
            input.add(...values.map(v => createElement("option", {
                innerHTML: v
            })));
            if (!values.includes(this.config.value) && this.config.value != undefined) { // if specified value is not in values list, add to select element
                input.add(createElement("option", {
                    innerHTML: this.config.value
                }));
            }
            if (this.config.value != undefined) { // if specified value is not undefined, select it
                input.value = this.config.value
            }
        }
        input.addEventListener("input", function () {
            option.value = input.value;
            option.dispatchEvent("change", { target: this });
        });
        return input;
    }

    #listeners = [];
    dispatchEvent(type, config) {
        if (!config.target) {
            config.target = this;
        }
        this.#listeners.forEach(l => {
            if (l.type == type) {
                l.callback(config);
            }
        });
        this.section_obj.dispatchEvent(type, config);
    }

    on(type, callback) {
        console.log("on", this.#listeners);
        this.#listeners.push({ type, callback });
    }

    off(type, callback) {
        console.log("off", this.#listeners);
        this.#listeners = this.#listeners.filter(l => l !== ({ type, callback }));
    }
}

// export let settings = new Settings({
//     name: "Settings"
// }, [
//     new Section({
//         name: "Billing Report"
//     }, [
//         new Option({
//             name: "Composite Graphs",
//             type: "toggle",
//             value: false,
//         })
//     ]),
//     new Section({
//         name: "Online Game Report"
//     }, [
//         new Option({
//             name: "Graph type",
//             type: "dropdown",
//             values: ["bar", "line"]
//         })
//     ]),
//     new Section({
//         name: "Recent Player Count"
//     }, [
//         new Option({
//             name: "Graph type",
//             type: "dropdown",
//             values: ["bar", "line"],
//         })
//     ])
// ]);

/**
 * generates a string template function or smth idk
 * @param {String[]} strings plain-text strings
 * @param  {...String} keys keys to interpolate
 * @returns {String}
 * 
 * @example
 * const template = makeTemplate`I'm ${"name"}. I'm almost ${"age"} years old.`;
 * template({ name: "MDN", age: 30 }); // "I'm MDN. I'm almost 30 years old."
 */
function makeTemplate(strings, ...keys) {
    return function (...values) {
        const dict = values[values.length - 1] || {};
        const result = [strings[0]];
        keys.forEach((key, i) => {
            const value = Number.isInteger(key) ? values[key] : dict[key];
            result.push(value, strings[i + 1]);
        });
        return result.join("");
    };
}