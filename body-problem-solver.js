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
            const mass = parseFloat(column.querySelector(`input[name=mass-${index}]`).value) || 0;
            return {
                index,
                gravitationalParameter: mass * G,
                x: parseFloat(column.querySelector(`input[name=position-x-${index}]`).value) || 0,
                y: parseFloat(column.querySelector(`input[name=position-y-${index}]`).value) || 0,
                vx: parseFloat(column.querySelector(`input[name=velocity-x-${index}]`).value) || 0,
                vy: parseFloat(column.querySelector(`input[name=velocity-y-${index}]`).value) || 0,
                color: column.querySelector(`select`).value || 'blue',
            };
        })
        .filter(object => object.gravitationalParameter > 0);
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
        move(objects, stepSize);
    }

    drawObjects(objects);
};

const move = (objects, interval) => {
    const result = [];

    for (const currentObject of objects) {
        const index = currentObject.index;
        let velocityChangeX = 0;
        let velocityChangeY = 0;
        const halfInterval = interval / 2;
        
        for (const object of objects) {
            if (object.index === index) {
                continue;
            }

            const distanceX = currentObject.x - object.x;
            const distanceY = currentObject.y - object.y;
            const distanceSquared = distanceX ** 2 + distanceY ** 2;
            const angle = Math.atan2(distanceY, distanceX);
            const velocity = interval * object.gravitationalParameter / distanceSquared;
            velocityChangeX += Math.cos(angle) * velocity;
            velocityChangeY += Math.sin(angle) * velocity;
        }

        const vx = currentObject.vx - velocityChangeX;
        const vy = currentObject.vy - velocityChangeY;
        const x = currentObject.x + currentObject.vx * interval - velocityChangeX * halfInterval;
        const y = currentObject.y + currentObject.vy * interval - velocityChangeY * halfInterval;

        result.push({
            index,
            gravitationalParameter: currentObject.gravitationalParameter,
            color: currentObject.color,
            x,
            y,
            vx,
            vy,
        });
    }

    for (let i = 0; i < objects.length; i++) {
        objects[i] = result.find(body => body.index === objects[i].index);
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
