/*** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

Object.defineProperty(Array.prototype, "chunk", {value: function (size) {return [].concat.apply([], this.map((_, b) => b % size ? [] : [this.slice(b, b + size)]));}});

const network = new brain.recurrent.RNN();

let last = null;
let lines = [];
let mouse_down = false;

function draw(a, b, c) {
    if (!c) lines.push([a, b]);
    ctx.beginPath();
    ctx.moveTo((a.x - 50) / 8, (a.y - 50) / 8);
    ctx.lineTo((b.x - 50) / 8, (b.y - 50) / 8);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
}

addEventListener("mousedown", ev => {
    if (ev.target.id !== "canvas") return last = null;
    mouse_down = true;
    last = {x: ev.clientX, y: ev.clientY};
});

addEventListener("mouseup", () => mouse_down = false);

addEventListener("mousemove", ev => {
    if (ev.target.id !== "canvas") return last = null;
    if (!last || !mouse_down) return;
    let to = {x: ev.clientX, y: ev.clientY};
    draw(last, to);
    last = to;
});

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(i => draw(...i, false));
}

let __uuid = 0;
/*** @type {Object<number, {input: (0 | 1)[], output: string, data: ImageData}>} */
let queue = {};

function hideMain(hidden = true) {
    document.getElementById("main").hidden = hidden ? "true" : undefined;
    document.getElementById("o").hidden = hidden ? undefined : "true";
}

function trainCheck(o = true) {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let input = Array.from(data.data).map(i => i === 0 ? 0 : 1);
    input = input.chunk(input.length / canvas.width).map(i => i.reduce((a, b) => a + b) / i.length);
    const val = document.getElementById("value");
    const output = val.value;
    if (o && !output) {
        val.select();
        alert("Please enter a name to your image.");
        return {input: null};
    }
    return {input, output, data};
}

function queueTrain() {
    const {input, output, data} = trainCheck();
    if (!input) return;
    const uuid = __uuid++;
    queue[uuid] = {input, output, data};
    alert("Added to queue.");
    const q = document.getElementById("queue");
    q.innerHTML = q.innerHTML + `
<div class="queue-part" id="queue-part-${uuid}">
    <canvas width="32" height="32" style="width: 128px;height: 128px;" id="queue-${uuid}"></canvas>
    <div class="contents">
        ID: ${uuid}<br>Name: ${output}<br>
        <button style="margin-left: 10px" class="contents" onclick="document.getElementById('queue-part-${uuid}').remove(); delete queue[${uuid}]; alert('Image #${uuid} has been removed from queue.')">Remove from queue</button>
    </div>
</div>`;
    Object.keys(queue).forEach(i => {
        /*** @type {HTMLCanvasElement} */
        const qc = document.getElementById(`queue-${i}`);
        const qcc = qc.getContext("2d");
        qcc.putImageData(queue[i].data, 0, 0);
    });
}

function endQueue() {
    hideMain(true);
    setTimeout(() => {
        network.train(Object.values(queue), {
            iterations: 1000,
            log: true
        });
        hideMain(false);
        queue = {};
        document.getElementById("queue").innerHTML = "";
    }, 100);
}

function train() {
    const {input, output} = trainCheck();
    if (!input) return;
    hideMain(true);
    setTimeout(() => {
        network.train([{
            input, output
        }], {
            iterations: 1000,
            log: true
        });
        hideMain(false);
    }, 100);
}

function runNetwork() {
    const {input} = trainCheck(false);
    console.log(JSON.stringify(network.run(
        input
    )));
}
