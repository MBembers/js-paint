let canvas;
let context;
let restore_array = [];
let start_index = -1;
let strokeColor = "black";
let fillColor = "black";
let strokeWidth = 2;
let is_drawing = false;
let mode = "brush";
let prevX;
let prevY;
let preserveProportions = false;
let fill = false;
let colorBtnIds = ["red", "green", "blue", "yellow", "black"];
function main() {
    document.getElementById("pickerBox").style.display = "none";
    canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.8;
    context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    listeners();
}
function changeColor(event) {
    for (let id of colorBtnIds) {
        document.getElementById(id).classList.remove("btn-selected");
    }
    let target = event.target;
    target.classList.add("btn-selected");
    strokeColor = target.id;
    fillColor = target.id;
}
function pickColor() {
    let pickerbox = document.getElementById("pickerBox");
    pickerbox.style.display = "block";
}
function pickColorOk() {
    let pickerbox = document.getElementById("pickerBox");
    pickerbox.style.display = "none";
    let color = document.getElementById("colorpicker")
        .value;
    // console.log(color);
    strokeColor = color;
    fillColor = color;
    document.getElementById("custom").style.backgroundColor = color;
}
function start(event) {
    is_drawing = true;
    context.beginPath();
    context.moveTo(getX(event), getY(event));
    if (mode != "brush") {
        prevX = getX(event);
        prevY = getY(event);
        // saveStep();
    }
    event.preventDefault();
}
function draw(event) {
    if (is_drawing) {
        context.fillStyle = fillColor;
        context.strokeStyle = strokeColor;
        context.lineWidth = strokeWidth;
        let drawWidth = getX(event) - prevX;
        let drawHeight = getY(event) - prevY;
        if (mode != "brush")
            context.beginPath();
        context.lineCap = "round";
        context.lineJoin = "round";
        switch (mode) {
            case "brush":
                context.lineTo(getX(event), getY(event));
                break;
            case "rect":
                clear();
                if (restore_array.length > 0)
                    context.putImageData(restore_array[restore_array.length - 1], 0, 0);
                context.lineCap = "butt";
                context.lineJoin = "miter";
                if (preserveProportions) {
                    let minSize = Math.min(Math.abs(drawWidth), Math.abs(drawHeight));
                    context.strokeRect(prevX, prevY, drawWidth >= 0 ? minSize : minSize * -1, drawHeight >= 0 ? minSize : minSize * -1);
                    if (fill)
                        context.fillRect(prevX, prevY, drawWidth >= 0 ? minSize : minSize * -1, drawHeight >= 0 ? minSize : minSize * -1);
                }
                else {
                    context.strokeRect(prevX, prevY, drawWidth, drawHeight);
                    if (fill)
                        context.fillRect(prevX, prevY, drawWidth, drawHeight);
                }
                break;
            case "elipse":
                clear();
                if (restore_array.length > 0)
                    context.putImageData(restore_array[restore_array.length - 1], 0, 0);
                let startX = prevX + drawWidth / 2;
                let startY = prevY + drawHeight / 2;
                if (preserveProportions) {
                    let minSize = Math.min(Math.abs(drawWidth), Math.abs(drawHeight));
                    startX = prevX + (drawWidth < 0 ? minSize / -2 : minSize / 2);
                    startY = prevY + (drawHeight < 0 ? minSize / -2 : minSize / 2);
                    context.ellipse(startX, startY, minSize / 2, minSize / 2, 0, 0, Math.PI * 2, false);
                }
                else {
                    context.ellipse(startX, startY, Math.abs(drawWidth) / 2, Math.abs(drawHeight) / 2, 0, 0, Math.PI * 2, false);
                }
                break;
            case "line":
                clear();
                if (restore_array.length > 0)
                    context.putImageData(restore_array[restore_array.length - 1], 0, 0);
                context.moveTo(prevX, prevY);
                if (preserveProportions) {
                    if (Math.abs(drawWidth) > Math.abs(drawHeight))
                        context.lineTo(prevX + drawWidth, prevY);
                    else
                        context.lineTo(prevX, prevY + drawHeight);
                }
                else {
                    context.lineTo(getX(event), getY(event));
                }
                break;
        }
        context.stroke();
        if (fill)
            context.fill();
    }
    event.preventDefault();
}
function stopDraw(event) {
    if (is_drawing) {
        context.stroke();
        context.closePath();
        is_drawing = false;
        saveStep();
    }
    event.preventDefault();
}
function getX(event) {
    return (canvas.width / canvas.getBoundingClientRect().width) * event.pageX;
}
function getY(event) {
    return ((canvas.height / canvas.getBoundingClientRect().height) *
        (event.pageY - canvas.offsetTop));
}
function undo() {
    if (start_index <= 0) {
        reset();
    }
    else {
        start_index -= 1;
        restore_array.pop();
        context.putImageData(restore_array[start_index], 0, 0);
    }
}
function save() {
    canvas.toBlob((blob) => {
        let url = URL.createObjectURL(blob);
        let aElement = document.createElement("a");
        aElement.setAttribute("download", "canvas" + Date.now() + ".jpg");
        aElement.setAttribute("href", url);
        aElement.click();
    });
}
function Download(url) {
    document.getElementById("my_iframe").src = url;
}
function changeSize(event) {
    let input = event.target;
    strokeWidth = parseFloat(input.value);
}
function switchProportions(event) {
    let input = event.target;
    preserveProportions = Boolean(input.checked);
}
function switchFill(event) {
    let input = event.target;
    fill = Boolean(input.checked);
}
function clear(save = false) {
    context.fillStyle = "white";
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = fillColor;
    if (save)
        saveStep();
}
function reset() {
    // clear();
    start_index = -1;
    restore_array = [];
}
function saveStep() {
    restore_array.push(context.getImageData(0, 0, canvas.width, canvas.height));
    if (restore_array.length > 100)
        restore_array.shift();
    else
        start_index += 1;
}
function listeners() {
    canvas.addEventListener("mousedown", start, false);
    canvas.addEventListener("mousemove", draw, false);
    canvas.addEventListener("mouseup", stopDraw, false);
    canvas.addEventListener("mouseout", stopDraw, false);
    document.getElementById("clear").addEventListener("click", () => clear(true));
    document.getElementById("undo").addEventListener("click", undo);
    document.getElementById("save").addEventListener("click", save);
    document.getElementById("size-range").addEventListener("change", changeSize);
    document.getElementById("fill").addEventListener("change", switchFill);
    document
        .getElementById("brush")
        .addEventListener("click", () => (mode = "brush"));
    document
        .getElementById("rect")
        .addEventListener("click", () => (mode = "rect"));
    document
        .getElementById("elipse")
        .addEventListener("click", () => (mode = "elipse"));
    document
        .getElementById("line")
        .addEventListener("click", () => (mode = "line"));
    document
        .getElementById("proportions")
        .addEventListener("change", switchProportions);
    for (let id of colorBtnIds) {
        document.getElementById(id).addEventListener("click", changeColor);
    }
    document.getElementById("custom").addEventListener("click", pickColor);
    document.getElementById("picker").addEventListener("click", pickColorOk);
}
window.onload = main;
