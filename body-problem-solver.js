const G = 6.6743e-11;
const TWO_PI = 2 * Math.PI;
const MIN_INTERVAL = 10; //ms

let scaleX;
let scaleY;
let offsetX;
let offsetY;

let timerId;

const canvas = document.getElementById('graphCanvas');
const context = canvas.getContext('2d');
const form = document.querySelector("form#parameter-form");

const handleFormInput = () => {
    clearTimeout(timerId);
    const objects = buildObjects(form);
    buildCanvas(form, objects);
    return objects;
}

const buildObjects = (form) => {
    const stepSize = parseFloat(document.querySelector("input#animation-step-size").value) || 1;

    return Array.from(form.querySelectorAll('div[id^="body-"]'))
        .map(column => {
            const index = column.id.slice(column.id.indexOf('-') + 1);
            const mass = parseFloat(column.querySelector(`input[name=mass-${index}]`).value) || 0;

            return {
                mass,
                gravitationalParameterS: mass * G * stepSize,
                x: parseFloat(column.querySelector(`input[name=position-x-${index}]`).value) || 0,
                y: parseFloat(column.querySelector(`input[name=position-y-${index}]`).value) || 0,
                vx: parseFloat(column.querySelector(`input[name=velocity-x-${index}]`).value) || 0,
                vy: parseFloat(column.querySelector(`input[name=velocity-y-${index}]`).value) || 0,
                color: column.querySelector(`select`).value || 'blue',
            };
        })
        .filter(object => object.gravitationalParameterS > 0);
};

const buildCanvas = (form, objects) => {
    clearCanvas(canvas);

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
    objects.forEach(object => {
        context.beginPath();
        const x = offsetX + object.x * scaleX;
        const y = offsetY - object.y * scaleY;
        context.fillStyle = object.color;
        context.arc(x, y, 4, 0, TWO_PI);
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
    let interval = stepSize * speed * 1000;

    if (interval < MIN_INTERVAL) {
        interval = MIN_INTERVAL;
    }

    const loopUntil = interval / 1000;
    const stepIncrement = stepSize / speed;
    const halfInterval = stepSize / 2;
    const calculateStepFn = determineCalculateStepFunction(objects);

    timerId = setInterval(() => calculateStepFn(objects, stepSize, loopUntil, stepIncrement, halfInterval), interval); //fires every <interval> ms
};

const determineCalculateStepFunction = (objects) => {
    switch(objects.length) {
        case 2:
            return calculateStep2Bodies;
            break;
        case 3:
            return calculateStep3Bodies;
            break;
        default:
            return calculateStepNBodies;
    } 
};

const runSimulation = () => {
    const objects = handleFormInput();
    const time = parseFloat(document.querySelector("input#simulation-time").value) || 15;
    const stepSize = parseFloat(document.querySelector("input#simulation-step-size").value) || 5e-7;
    const stepIncrement = 1;
    const timesPointPlotted = 10000;
    const loopUntil = time / (stepSize * timesPointPlotted);
    const halfInterval = stepSize / 2;
    const calculateStepFn = determineCalculateStepFunction(objects);

    for (let i = 0; i < timesPointPlotted; i++) {
        calculateStepFn(objects, stepSize, loopUntil, stepIncrement, halfInterval);
    }
};

const calculateStep2Bodies = (objects, interval, loopUntil, stepIncrement, halfInterval) => {
    for (let i = 0; i < loopUntil; i += stepIncrement) {
        const object1 = objects[0];
        const object2 = objects[1];

        const distanceX = object1.x - object2.x;
        const distanceY = object1.y - object2.y;
        const distanceSquared = distanceX ** 2 + distanceY ** 2;
        const angle = Math.atan2(distanceY, distanceX);
        const velocityChange1 = object2.gravitationalParameterS / distanceSquared;
        const velocityChange2 = object1.gravitationalParameterS / distanceSquared;

        const xProjection = Math.cos(angle);
        const yProjection = Math.sin(angle);
        
        const velocityChangeX1 = xProjection * velocityChange1;
        const velocityChangeY1 = yProjection * velocityChange1;
        const velocityChangeX2 = -xProjection * velocityChange2;
        const velocityChangeY2 = -yProjection * velocityChange2;

        const vx1 = object1.vx - velocityChangeX1;
        const vy1 = object1.vy - velocityChangeY1;
        const vx2 = object2.vx - velocityChangeX2;
        const vy2 = object2.vy - velocityChangeY2;
        const x1 = object1.x + object1.vx * interval - velocityChangeX1 * halfInterval;
        const y1 = object1.y + object1.vy * interval - velocityChangeY1 * halfInterval;
        const x2 = object2.x + object2.vx * interval - velocityChangeX2 * halfInterval;
        const y2 = object2.y + object2.vy * interval - velocityChangeY2 * halfInterval;

        objects[0] = { 
            gravitationalParameterS: object1.gravitationalParameterS, 
            color: object1.color, 
            x: x1, 
            y: y1, 
            vx: vx1, 
            vy: vy1 
        };
        objects[1] = { 
            gravitationalParameterS: object2.gravitationalParameterS, 
            color: object2.color, 
            x: x2, 
            y: y2, 
            vx: vx2, 
            vy: vy2 
        };
    }
    
    drawObjects(objects);
};

const calculateStep3Bodies = (objects, interval, loopUntil, stepIncrement, halfInterval) => {
    for (let i = 0; i < loopUntil; i += stepIncrement) {
        const object1 = objects[0];
        const object2 = objects[1];
        const object3 = objects[2];

        const distanceX12 = object1.x - object2.x;
        const distanceY12 = object1.y - object2.y;
        const distanceX13 = object1.x - object3.x;
        const distanceY13 = object1.y - object3.y;
        const distanceX23 = object2.x - object3.x;
        const distanceY23 = object2.y - object3.y;

        const distanceSquared12 = distanceX12 ** 2 + distanceY12 ** 2;
        const distanceSquared13 = distanceX13 ** 2 + distanceY13 ** 2;
        const distanceSquared23 = distanceX23 ** 2 + distanceY23 ** 2;
        const angle12 = Math.atan2(distanceY12, distanceX12);
        const angle13 = Math.atan2(distanceY13, distanceX13);
        const angle23 = Math.atan2(distanceY23, distanceX23);

        const xProjection12 = Math.cos(angle12);
        const xProjection13 = Math.cos(angle13);
        const xProjection23 = Math.cos(angle23);
        const yProjection12 = Math.sin(angle12);
        const yProjection13 = Math.sin(angle13);
        const yProjection23 = Math.sin(angle23);

        const velocityChangeX1 = xProjection12 * object2.gravitationalParameterS / distanceSquared12 + xProjection13 * object3.gravitationalParameterS / distanceSquared13;
        const velocityChangeY1 = yProjection12 * object2.gravitationalParameterS / distanceSquared12 + yProjection13 * object3.gravitationalParameterS / distanceSquared13;
        const velocityChangeX2 = - xProjection12 * object1.gravitationalParameterS / distanceSquared12 + xProjection23 * object3.gravitationalParameterS / distanceSquared23;
        const velocityChangeY2 = - yProjection12 * object1.gravitationalParameterS / distanceSquared12 + yProjection23 * object3.gravitationalParameterS / distanceSquared23;
        const velocityChangeX3 = - xProjection13 * object1.gravitationalParameterS / distanceSquared13 - xProjection23 * object2.gravitationalParameterS / distanceSquared23;
        const velocityChangeY3 = - yProjection13 * object1.gravitationalParameterS / distanceSquared13 - yProjection23 * object2.gravitationalParameterS / distanceSquared23;

        const vx1 = object1.vx - velocityChangeX1;
        const vy1 = object1.vy - velocityChangeY1;
        const vx2 = object2.vx - velocityChangeX2;
        const vy2 = object2.vy - velocityChangeY2;
        const vx3 = object3.vx - velocityChangeX3;
        const vy3 = object3.vy - velocityChangeY3;
        const x1 = object1.x + object1.vx * interval - velocityChangeX1 * halfInterval;
        const y1 = object1.y + object1.vy * interval - velocityChangeY1 * halfInterval;
        const x2 = object2.x + object2.vx * interval - velocityChangeX2 * halfInterval;
        const y2 = object2.y + object2.vy * interval - velocityChangeY2 * halfInterval;
        const x3 = object3.x + object3.vx * interval - velocityChangeX3 * halfInterval;
        const y3 = object3.y + object3.vy * interval - velocityChangeY3 * halfInterval;

        objects[0] = { 
            gravitationalParameterS: object1.gravitationalParameterS, 
            color: object1.color, 
            x: x1, 
            y: y1, 
            vx: vx1, 
            vy: vy1 
        };
        objects[1] = { 
            gravitationalParameterS: object2.gravitationalParameterS, 
            color: object2.color, 
            x: x2, 
            y: y2, 
            vx: vx2, 
            vy: vy2 
        };
        objects[2] = { 
            gravitationalParameterS: object3.gravitationalParameterS, 
            color: object3.color, 
            x: x3, 
            y: y3, 
            vx: vx3, 
            vy: vy3 
        };
    }
    
    drawObjects(objects);
};

const calculateStepNBodies = (objects, interval, loopUntil, stepIncrement, halfInterval) => {
    for (let i = 0; i < loopUntil; i += stepIncrement) {
        const result = new Array(objects.length);

        for (let i = 0; i < objects.length; i++) {
            const currentObject = objects[i];
            let velocityChangeX = 0;
            let velocityChangeY = 0;
            
            for (let j = 0; j < objects.length; j++) {
                if (i === j) continue;
                const object = objects[j];

                const distanceX = currentObject.x - object.x;
                const distanceY = currentObject.y - object.y;
                const distanceSquared = distanceX ** 2 + distanceY ** 2;
                const angle = Math.atan2(distanceY, distanceX);
                const velocity = object.gravitationalParameterS / distanceSquared;
                velocityChangeX += Math.cos(angle) * velocity;
                velocityChangeY += Math.sin(angle) * velocity;
            }

            const vx = currentObject.vx - velocityChangeX;
            const vy = currentObject.vy - velocityChangeY;
            const x = currentObject.x + currentObject.vx * interval - velocityChangeX * halfInterval;
            const y = currentObject.y + currentObject.vy * interval - velocityChangeY * halfInterval;

            result[i] = { gravitationalParameterS: currentObject.gravitationalParameterS, color: currentObject.color, x, y, vx, vy };
        }

        for (let i = 0; i < objects.length; i++) {
            objects[i] = result[i];
        }
    }

    drawObjects(objects);
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

    document.querySelector('input#animation-step-size').value = 1e-6;
    document.querySelector('input#animation-speed').value = 1;

    document.querySelector('input#simulation-step-size').value = 1e-6;
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

    document.querySelector('input#animation-step-size').value = 1e-6;
    document.querySelector('input#animation-speed').value = 1;

    document.querySelector('input#simulation-step-size').value = 1e-6;
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

    document.querySelector('input#animation-step-size').value = 1e-6;
    document.querySelector('input#animation-speed').value = 1;

    document.querySelector('input#simulation-step-size').value = 1e-6;
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

    document.querySelector('input#animation-step-size').value = 1e-6;
    document.querySelector('input#animation-speed').value = 1;

    document.querySelector('input#simulation-step-size').value = 1e-6;
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

    document.querySelector('input#animation-step-size').value = 1e-6;
    document.querySelector('input#animation-speed').value = 1;

    document.querySelector('input#simulation-step-size').value = 1e-6;
    document.querySelector('input#simulation-time').value = 15;

    handleFormInput();
};

handleFormInput();
