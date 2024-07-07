const G = 6.6743e-11;
const TWO_PI = 2 * Math.PI;
const MIN_INTERVAL = 10; //ms
const COLORS = ['blue', 'green', 'red', 'yellow', 'black', 'orange']
let colorIndex = 0;

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
    const stepSize = parseFloat(document.querySelector("input#animation-step-size").value) || 1; //TODO: animation stepSize is applied, fix for simulation

    return Array.from(form.querySelectorAll('div.body'))
        .map(body => {
            const mass = parseFloat(body.querySelector(`input[name=mass]`).value) || 0;

            return {
                mass,
                gravitationalParameterS: mass * G * stepSize,
                x: parseFloat(body.querySelector(`input[name=position-x]`).value) || 0,
                y: parseFloat(body.querySelector(`input[name=position-y]`).value) || 0,
                vx: parseFloat(body.querySelector(`input[name=velocity-x]`).value) || 0,
                vy: parseFloat(body.querySelector(`input[name=velocity-y]`).value) || 0,
                color: body.querySelector(`select`).value || 'blue',
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

const fillPreset = (objects, starter) => {
    colorIndex = 0;
    const bodyForms = form.querySelectorAll('.body');

    for (const form of bodyForms) {
        form.remove();
    }

    for (const object of objects) {
        populateForm(object, buildObjectForm());
    }

    document.querySelector('input#animation-step-size').value = starter.animationStepSize;
    document.querySelector('input#animation-speed').value = starter.animationSpeed;

    document.querySelector('input#simulation-step-size').value = starter.simulationStepSize;
    document.querySelector('input#simulation-time').value = starter.simulationTime;

    handleFormInput();
};

const populateForm = (object, form) => {
    form.querySelector("input[name=mass]").value = object.mass;
    form.querySelector("input[name=position-x]").value = object.x;
    form.querySelector("input[name=position-y]").value = object.y;
    form.querySelector("input[name=velocity-x]").value = object.vx;
    form.querySelector("input[name=velocity-y]").value = object.vy;
};

const fillCircularPreset = () => {
    fillPreset([
        { mass: 100000000000, x: 0, y: 0, vx: 0, vy: 0 },
        { mass: 1, x: 1, y: 0, vx: 0, vy: 2.58 },
        { mass: 1, x: 0, y: 2, vx: 1.83, vy: 0 },
    ],
    { animationStepSize: 1e-6, animationSpeed: 1, simulationStepSize: 1e-6, simulationTime: 15});
};

const fillEllipticPreset = () => {
    fillPreset([
        { mass: 10000000000, x: -1, y: 0, vx: 0, vy: 0 },
        { mass: 1, x: 1, y: 0, vx: 0, vy: 0.2 },
        { mass: 1, x: -3, y: 2, vx: 0, vy: -0.2 },
        { mass: 1, x: 1, y: 2, vx: -0.4, vy: 0 },
    ],
    { animationStepSize: 1e-6, animationSpeed: 1, simulationStepSize: 1e-6, simulationTime: 15});
};

const fillParabolaPreset = () => {
    fillPreset([
        { mass: 100000000000, x: 0, y: 0, vx: 0, vy: 0 },
        { mass: 1, x: 1, y: 0, vx: 0, vy: 3.65 },
        { mass: 1, x: -1, y: 0, vx: 0, vy: -3.65 },
    ],
    { animationStepSize: 1e-6, animationSpeed: 1, simulationStepSize: 1e-6, simulationTime: 15});
};

const fillTripleSystemPreset = () => {
    fillPreset([
        { mass: 10000000000, x: -1, y: 0, vx: 0, vy: -0.3 },
        { mass: 10000000000, x: 1, y: 0, vx: 0, vy: 0.3 },
        { mass: 1000, x: 4, y: 0, vx: 0, vy: 0.58 },
    ],
    { animationStepSize: 1e-6, animationSpeed: 1, simulationStepSize: 1e-6, simulationTime: 15});
};

const fillChaosPreset = () => {
    fillPreset([
        { mass: 100000000000, x: -3, y: -1, vx: 0, vy: 0.3 },
        { mass: 100000000000, x: 1, y: 0, vx: -0.2, vy: 0.1 },
        { mass: 100000000000, x: 4, y: 2, vx: -0.1, vy: -0.4 },
        { mass: 100000000000, x: -4, y: 3, vx: 0.1, vy: -0.1 },
    ],
    { animationStepSize: 1e-6, animationSpeed: 1, simulationStepSize: 1e-6, simulationTime: 15});
};

const deleteBody = (button) => {
    button.closest('div.body').remove();
    handleFormInput();
};

const buildObjectForm = () => {
    const template = document.querySelector('div.body-template div');
    const plusFormCol = document.querySelector('div.plus-form-col');
    const clonedTemplate = template.cloneNode(true);
    const clonedPlusFormCol = plusFormCol.cloneNode(true);
    const objectRow = form.querySelector('div.object-row');
    plusFormCol.remove();
    objectRow.appendChild(clonedTemplate);
    objectRow.appendChild(clonedPlusFormCol);
    clonedTemplate.querySelector('select.color').value = getNextColor();
    return clonedTemplate;
};


function getNextColor() {
    const color = COLORS[colorIndex];
    colorIndex = (colorIndex + 1) % COLORS.length;  // Increment index and wrap around if necessary
    return color;
}

Array.from({length: 3}, () => buildObjectForm());

handleFormInput();
