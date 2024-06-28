const G = 6.6743e-11;

let scaleX;
let scaleY;
let offsetX;
let offsetY;

const canvas = document.getElementById('graphCanvas');
const form = document.querySelector("form#parameter-form");

const handleFormInput = () => {
    const timerId = document.querySelector("div#timer-id").innerHTML;
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
                mass: parseFloat(column.querySelector(`input[name=mass-${index}]`).value) || 1,
                x: parseFloat(column.querySelector(`input[name=position-x-${index}]`).value) || 0,
                y: parseFloat(column.querySelector(`input[name=position-y-${index}]`).value) || 0,
                vx: parseFloat(column.querySelector(`input[name=velocity-x-${index}]`).value) || 0,
                vy: parseFloat(column.querySelector(`input[name=velocity-y-${index}]`).value) || 0,
                color: column.querySelector(`select`).value || 'blue',
            };
        })
};

const buildCanvas = (form, objects) => {
    clearCanvas(canvas);
    const context = canvas.getContext('2d');

    const minX = Math.min(objects[0].x, objects[1].x) || 0;
    const maxX = Math.max(objects[0].x, objects[1].x) || 0;
    const minY = Math.min(objects[0].y, objects[1].y) || 0;
    const maxY = Math.max(objects[0].y, objects[1].y) || 0;
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
    let stepsPerIteration = 1;

    if (interval < minInterval) {
        stepsPerIteration = minInterval / interval;
        interval = minInterval;
    }

    const loopUntil = interval / 1000;
    const stepIncrement = stepSize / speed;

    const timerId = setInterval(() => calculateStep(objects, stepSize, loopUntil, stepIncrement), interval); //fires every interval ms
    document.querySelector("div#timer-id").innerHTML = timerId;
};

const runSimulation = () => {
    const objects = handleFormInput();
    const time = parseFloat(document.querySelector("input#simulation-time").value) || 1;
    const stepSize = parseFloat(document.querySelector("input#simulation-step-size").value) || 1 / 1000000;
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
        objects[0] = move(object1, object2, stepSize);
        objects[1] = move(object2, object1, stepSize);
    }
    
    drawObjects(objects);
};

const move = (object, other, interval) => {
    const distanceSquared = (object.x - other.x) ** 2 + (object.y - other.y) ** 2;
    const acceleration = (G * other.mass) / distanceSquared;
    const angle = Math.atan2(object.y - other.y, object.x - other.x);
    const xProjection = Math.cos(angle);
    const yProjection = Math.sin(angle);

    const vx = object.vx - xProjection * interval * acceleration;
    const vy = object.vy - yProjection * interval * acceleration;
    const x = object.x + object.vx * interval - xProjection * acceleration * interval ** 2 / 2;
    const y = object.y + object.vy * interval - yProjection * acceleration * interval ** 2 / 2;
    return { vx, vy, x, y, mass: object.mass, color: object.color };
};

const fillTwinSystemPreset = () => {
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

    document.querySelector('input#animation-step-size').value = 0.0000005;
    document.querySelector('input#animation-speed').value = 1;
    
    handleFormInput();
};

const fillFlyingTwinsPreset = () => {
    form.querySelector("input[name=mass-1]").value = 100000000000;
    form.querySelector("input[name=position-x-1]").value = -1;
    form.querySelector("input[name=position-y-1]").value = 0;
    form.querySelector("input[name=velocity-x-1]").value = 0;
    form.querySelector("input[name=velocity-y-1]").value = -0.3;

    form.querySelector("input[name=mass-2]").value = 100000000000;
    form.querySelector("input[name=position-x-2]").value = 1;
    form.querySelector("input[name=position-y-2]").value = 0;
    form.querySelector("input[name=velocity-x-2]").value = 0;
    form.querySelector("input[name=velocity-y-2]").value = 0.4;

    document.querySelector('input#animation-step-size').value = 0.0000005;
    document.querySelector('input#animation-speed').value = 1;

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

    document.querySelector('input#animation-step-size').value = 0.0000005;
    document.querySelector('input#animation-speed').value = 1;
    
    handleFormInput();
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

    document.querySelector('input#animation-step-size').value = 0.0000005;
    document.querySelector('input#animation-speed').value = 1;
    
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

    document.querySelector('input#animation-step-size').value = 0.0000005;
    document.querySelector('input#animation-speed').value = 1;
    
    handleFormInput();
};

handleFormInput();
