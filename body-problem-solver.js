const G = 6.6743e-11;

let scaleX;
let scaleY;
let offsetX;
let offsetY;

let timerId;

const canvas = document.getElementById('graphCanvas');
const form = document.querySelector("form#parameter-form");

const handleFormInput = () => {
    clearTimeout(timerId);
    const objects = buildObjects(form);
    buildCanvas(form, objects);
    return objects;
}

const buildObjects = (form) => {
    return Array.from(form.querySelectorAll('div[id^="body-"]'))
        .map(column => {
            const object = {};
            const index = column.id.slice(column.id.indexOf('-') + 1);
            return {
                index,
                mass: parseFloat(column.querySelector(`input[name=mass-${index}]`).value) || 0,
                x: parseFloat(column.querySelector(`input[name=position-x-${index}]`).value) || 0,
                y: parseFloat(column.querySelector(`input[name=position-y-${index}]`).value) || 0,
                vx: parseFloat(column.querySelector(`input[name=velocity-x-${index}]`).value) || 0,
                vy: parseFloat(column.querySelector(`input[name=velocity-y-${index}]`).value) || 0,
                color: column.querySelector(`select`).value || 'blue',
            };
        })
        .filter(object => object.mass > 0);
};

const buildCanvas = (form, objects) => {
    clearCanvas(canvas);
    const context = canvas.getContext('2d');

    const minX = Math.min(...objects.map(object => object.x)) || 0;
    const maxX = Math.max(...objects.map(object => object.x)) || 0;
    const minY = Math.min(...objects.map(object => object.y)) || 0;
    const maxY = Math.max(...objects.map(object => object.y)) || 0;
    const maxDimension = Math.max(maxX - minX, maxY - minY) * 3.5 || 10;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Set the graph parameters
    scaleX = canvasWidth / maxDimension;
    scaleY = canvasHeight / maxDimension;
    offsetX = canvasWidth / 2;
    offsetY = canvasHeight / 2;

    // Draw the x and y axes
    context.beginPath();
    context.moveTo(0, offsetY);
    context.lineTo(canvasWidth, offsetY);
    context.moveTo(offsetX, 0);
    context.lineTo(offsetX, canvasHeight);
    context.strokeStyle = 'black';
    context.stroke();

    drawObjects(objects);
};

const drawObjects = (objects) => {
    const context = canvas.getContext('2d');

    objects.forEach(object => {
        const x = offsetX + object.x * scaleX;
        const y = offsetY - object.y * scaleY;
        context.beginPath();
        context.fillStyle = object.color;
        context.arc(x, y, 4, 0, Math.PI * 2);
        context.fill();
        context.stroke();
    });
};

const clearCanvas = (canvas) => {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

const startAnimation = () => {
    const objects = handleFormInput();
    const stepSize = parseFloat(document.querySelector("input#animation-step-size").value) || 1;
    const speed = parseFloat(document.querySelector("input#animation-speed").value) || 1;
    const minInterval = 10; //ms
    let interval = stepSize * speed * 1000;

    if (interval < minInterval) {
        interval = minInterval;
    }

    const loopUntil = interval / 1000;
    const stepIncrement = stepSize / speed;

    timerId = setInterval(() => calculateStep(objects, stepSize, loopUntil, stepIncrement), interval); //fires every <interval> ms
};

const runSimulation = () => {
    const objects = handleFormInput();
    const time = parseFloat(document.querySelector("input#simulation-time").value) || 15;
    const stepSize = parseFloat(document.querySelector("input#simulation-step-size").value) || 5e-7;
    const stepIncrement = 1;
    const timesPointPlotted = 10000;
    const loopUntil = time / (stepSize * timesPointPlotted);

    for (let i = 0; i < timesPointPlotted; i++) {
        calculateStep(objects, stepSize, loopUntil, stepIncrement);
    }
};

const calculateStep = (objects, stepSize, loopUntil, stepIncrement) => {
    for (let i = 0; i < loopUntil; i += stepIncrement) {
        const object1 = objects[0];
        const object2 = objects[1];
        const object3 = objects[2];
        objects[0] = move(object1, object2, object3, stepSize);
        objects[1] = move(object2, object1, object3, stepSize);
        objects[2] = move(object3, object1, object2, stepSize);
    }

    drawObjects(objects);
};

const move = (object, other1, other2, interval) => {
    const distanceSquared1 = (object.x - other1.x) ** 2 + (object.y - other1.y) ** 2;
    const angle1 = Math.atan2(object.y - other1.y, object.x - other1.x);
    const acceleration1x = Math.cos(angle1) * (G * other1.mass) / distanceSquared1;
    const acceleration1y = Math.sin(angle1) * (G * other1.mass) / distanceSquared1;

    const distanceSquared2 = (object.x - other2.x) ** 2 + (object.y - other2.y) ** 2;
    const angle2 = Math.atan2(object.y - other2.y, object.x - other2.x);
    const acceleration2x = Math.cos(angle2) * (G * other2.mass) / distanceSquared2;
    const acceleration2y = Math.sin(angle2) * (G * other2.mass) / distanceSquared2;

    const vx = object.vx - (acceleration1x + acceleration2x) * interval;
    const vy = object.vy - (acceleration1y + acceleration2y) * interval;
    const x = object.x + object.vx * interval - (acceleration1x + acceleration2x) * interval ** 2 / 2;
    const y = object.y + object.vy * interval - (acceleration1y + acceleration2y)* interval ** 2 / 2 ;
    return { index: object.index, vx, vy, x, y, mass: object.mass, color: object.color };
};

const calculateAccelerations = (objects) => {
    for (const object of objects) {

    }
};

const fillCircularPreset = () => {
    form.querySelector("input[name=mass-1]").value = 100000000000;
    form.querySelector("input[name=position-x-1]").value = 0;
    form.querySelector("input[name=position-y-1]").value = 0;
    form.querySelector("input[name=velocity-x-1]").value = 0;
    form.querySelector("input[name=velocity-y-1]").value = 0;

    form.querySelector("input[name=mass-2]").value = 1;
    form.querySelector("input[name=position-x-2]").value = 1;
    form.querySelector("input[name=position-y-2]").value = 0;
    form.querySelector("input[name=velocity-x-2]").value = 0;
    form.querySelector("input[name=velocity-y-2]").value = 2.58;

    form.querySelector("input[name=mass-3]").value = 1;
    form.querySelector("input[name=position-x-3]").value = 2;
    form.querySelector("input[name=position-y-3]").value = 0;
    form.querySelector("input[name=velocity-x-3]").value = 0;
    form.querySelector("input[name=velocity-y-3]").value = 1.83;

    document.querySelector('input#animation-step-size').value = 5e-7;
    document.querySelector('input#animation-speed').value = 1;

    document.querySelector('input#simulation-step-size').value = 5e-7;
    document.querySelector('input#simulation-time').value = 15;
    
    handleFormInput();
};

const fillEllipticPreset = () => {
    form.querySelector("input[name=mass-1]").value = 10000000000;
    form.querySelector("input[name=position-x-1]").value = -1;
    form.querySelector("input[name=position-y-1]").value = 0;
    form.querySelector("input[name=velocity-x-1]").value = 0;
    form.querySelector("input[name=velocity-y-1]").value = 0;

    form.querySelector("input[name=mass-2]").value = 1;
    form.querySelector("input[name=position-x-2]").value = 1;
    form.querySelector("input[name=position-y-2]").value = 0;
    form.querySelector("input[name=velocity-x-2]").value = 0;
    form.querySelector("input[name=velocity-y-2]").value = 0.2;

    form.querySelector("input[name=mass-3]").value = 1;
    form.querySelector("input[name=position-x-3]").value = -3;
    form.querySelector("input[name=position-y-3]").value = 2;
    form.querySelector("input[name=velocity-x-3]").value = 0;
    form.querySelector("input[name=velocity-y-3]").value = -0.2;

    document.querySelector('input#animation-step-size').value = 5e-7;
    document.querySelector('input#animation-speed').value = 1;

    document.querySelector('input#simulation-step-size').value = 5e-7;
    document.querySelector('input#simulation-time').value = 15;
    
    handleFormInput();
};

const fillParabolaPreset = () => {
    form.querySelector("input[name=mass-1]").value = 100000000000;
    form.querySelector("input[name=position-x-1]").value = 0;
    form.querySelector("input[name=position-y-1]").value = 0;
    form.querySelector("input[name=velocity-x-1]").value = 0;
    form.querySelector("input[name=velocity-y-1]").value = 0;

    form.querySelector("input[name=mass-2]").value = 1;
    form.querySelector("input[name=position-x-2]").value = 1;
    form.querySelector("input[name=position-y-2]").value = 0;
    form.querySelector("input[name=velocity-x-2]").value = 0;
    form.querySelector("input[name=velocity-y-2]").value = 3.65;

    form.querySelector("input[name=mass-3]").value = 1;
    form.querySelector("input[name=position-x-3]").value = -1;
    form.querySelector("input[name=position-y-3]").value = 0;
    form.querySelector("input[name=velocity-x-3]").value = 0;
    form.querySelector("input[name=velocity-y-3]").value = -3.65;

    document.querySelector('input#animation-step-size').value = 5e-7;
    document.querySelector('input#animation-speed').value = 1;

    document.querySelector('input#simulation-step-size').value = 5e-7;
    document.querySelector('input#simulation-time').value = 15;
    
    handleFormInput();
};

const fillTripleSystemPreset = () => {
    form.querySelector("input[name=mass-1]").value = 10000000000;
    form.querySelector("input[name=position-x-1]").value = -1;
    form.querySelector("input[name=position-y-1]").value;
    form.querySelector("input[name=velocity-x-1]").value;
    form.querySelector("input[name=velocity-y-1]").value = -0.3;

    form.querySelector("input[name=mass-2]").value = 10000000000;
    form.querySelector("input[name=position-x-2]").value = 1;
    form.querySelector("input[name=position-y-2]").value;
    form.querySelector("input[name=velocity-x-2]").value;
    form.querySelector("input[name=velocity-y-2]").value = 0.3;

    form.querySelector("input[name=mass-3]").value = 1000;
    form.querySelector("input[name=position-x-3]").value = 4;
    form.querySelector("input[name=position-y-3]").value;
    form.querySelector("input[name=velocity-x-3]").value;
    form.querySelector("input[name=velocity-y-3]").value = 0.58;

    document.querySelector('input#animation-step-size').value = 5e-7;
    document.querySelector('input#animation-speed').value = 1;

    document.querySelector('input#simulation-step-size').value = 5e-7;
    document.querySelector('input#simulation-time').value = 15;
    
    handleFormInput();
};

const fillChaosPreset = () => {
    form.querySelector("input[name=mass-1]").value = 100000000000;
    form.querySelector("input[name=position-x-1]").value = -3;
    form.querySelector("input[name=position-y-1]").value = -1;
    form.querySelector("input[name=velocity-x-1]").value = 0;
    form.querySelector("input[name=velocity-y-1]").value = 0.3;

    form.querySelector("input[name=mass-2]").value = 100000000000;
    form.querySelector("input[name=position-x-2]").value = 1;
    form.querySelector("input[name=position-y-2]").value = 0;
    form.querySelector("input[name=velocity-x-2]").value = -0.2;
    form.querySelector("input[name=velocity-y-2]").value = 0.1;

    form.querySelector("input[name=mass-3]").value = 100000000000;
    form.querySelector("input[name=position-x-3]").value = 4;
    form.querySelector("input[name=position-y-3]").value = 2;
    form.querySelector("input[name=velocity-x-3]").value = -0.1;
    form.querySelector("input[name=velocity-y-3]").value = -0.4;

    document.querySelector('input#animation-step-size').value = 5e-7;
    document.querySelector('input#animation-speed').value = 1;

    document.querySelector('input#simulation-step-size').value = 5e-7;
    document.querySelector('input#simulation-time').value = 15;

    handleFormInput();
};

handleFormInput();
