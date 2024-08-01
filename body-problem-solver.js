const G = 6.6743e-11;
const MIN_INTERVAL = 10; //ms
const COLORS = ['blue', 'green', 'red', 'yellow', 'orange']
let colorIndex = 0;

let timerId;

const form = document.querySelector("form#parameter-form");
const container = document.getElementById('container');

let scene, camera, renderer;

const geometry = new THREE.SphereGeometry(0.04, 32, 32);
const materials = COLORS.map(color => new THREE.MeshBasicMaterial({ color }));

const createCanvas = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);;
    container.innerHTML = ''
    container.appendChild(renderer.domElement);

    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.material.color.set(0x000000); // Set axes color to black
    scene.add(axesHelper);
    renderer.setClearColor(0xffffff); // Set background color to white

    camera.position.x = 1;
    camera.position.y = 1;
    camera.position.z = 4;
};

createCanvas();

const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

animate();

const drawObjects = (scene, objects) => {
    while (scene.children.length > 1) {
        scene.remove(scene.children[scene.children.length - 1]);
    }

    objects.forEach(object => {
        const material = materials[COLORS.indexOf(object.color)];
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(object.x, object.y, object.z);
        object.mesh = sphere;
        scene.add(sphere);
    });
};

const updateObjects = (objects) => {
    objects.forEach(object => {
        if (object.mesh) {
            object.mesh.position.set(object.x, object.y, object.z);
        }
    });
};

const handleFormInput = () => {
    clearTimeout(timerId);
    const objects = buildObjects(form);
    createCanvas();
    drawObjects(scene, objects);
    return objects;
}

const buildObjects = (form) => {
    const stepSize = parseFloat(document.querySelector("input#step-size").value) || 1;

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

const startAnimation = () => {
    const objects = handleFormInput();
    const stepSize = parseFloat(document.querySelector("input#step-size").value) || 1;
    const speed = parseFloat(document.querySelector("input#animation-speed").value) || 1;
    let interval = stepSize * 1000;

    if (interval < MIN_INTERVAL) {
        interval = MIN_INTERVAL;
    }

    const loopUntil = interval * speed / 1000;
    const halfStepSize = stepSize / 2;
    const calculateStepFn = determineCalculateStepFunction(objects);

    timerId = setInterval(() => {
        calculateStepFn(objects, stepSize, loopUntil, stepSize, halfStepSize);
        updateObjects(objects);
    }, interval); //fires every <interval> ms
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
    const stepSize = parseFloat(document.querySelector("input#step-size").value) || 5e-7;
    const stepIncrement = 1;
    const timesPointPlotted = 10000;
    const loopUntil = time / (stepSize * timesPointPlotted);
    const halfStepSize = stepSize / 2;
    const calculateStepFn = determineCalculateStepFunction(objects);

    for (let i = 0; i < timesPointPlotted; i++) {
        calculateStepFn(objects, stepSize, loopUntil, stepIncrement, halfStepSize);
    }
};

const calculateStep2Bodies = (objects, stepSize, loopUntil, loopIncrement, halfStepSize) => {
    for (let i = 0; i < loopUntil; i += loopIncrement) {
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
        const x1 = object1.x + object1.vx * stepSize - velocityChangeX1 * halfStepSize;
        const y1 = object1.y + object1.vy * stepSize - velocityChangeY1 * halfStepSize;
        const x2 = object2.x + object2.vx * stepSize - velocityChangeX2 * halfStepSize;
        const y2 = object2.y + object2.vy * stepSize - velocityChangeY2 * halfStepSize;

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
    
    drawObjects(scene, objects);
};

const calculateStep3Bodies = (objects, stepSize, loopUntil, loopIncrement, halfStepSize) => {
    for (let i = 0; i < loopUntil; i += loopIncrement) {
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
        const x1 = object1.x + object1.vx * stepSize - velocityChangeX1 * halfStepSize;
        const y1 = object1.y + object1.vy * stepSize - velocityChangeY1 * halfStepSize;
        const x2 = object2.x + object2.vx * stepSize - velocityChangeX2 * halfStepSize;
        const y2 = object2.y + object2.vy * stepSize - velocityChangeY2 * halfStepSize;
        const x3 = object3.x + object3.vx * stepSize - velocityChangeX3 * halfStepSize;
        const y3 = object3.y + object3.vy * stepSize - velocityChangeY3 * halfStepSize;

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
    
    drawObjects(scene, objects);
};

const calculateStepNBodies = (objects, stepSize, loopUntil, loopIncrement, halfStepSize) => {
    for (let i = 0; i < loopUntil; i += loopIncrement) {
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
            const x = currentObject.x + currentObject.vx * stepSize - velocityChangeX * halfStepSize;
            const y = currentObject.y + currentObject.vy * stepSize - velocityChangeY * halfStepSize;

            result[i] = { gravitationalParameterS: currentObject.gravitationalParameterS, color: currentObject.color, x, y, vx, vy };
        }

        for (let i = 0; i < objects.length; i++) {
            objects[i] = result[i];
        }
    }

    drawObjects(scene, objects);
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

    document.querySelector('input#step-size').value = starter.animationStepSize;
    document.querySelector('input#animation-speed').value = starter.animationSpeed;

    document.querySelector('input#step-size').value = starter.simulationStepSize;
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

const fillLagrangePreset = () => {
    fillPreset([
        { mass: 100000000000, x: 0, y: 0, vx: 0, vy: 0 },
        { mass: 1, x: 1, y: 1.732, vx: -1.582, vy: 0.913 },
        { mass: 10000000, x: 2, y: 0, vx: 0, vy: 1.83 },
        { mass: 1, x: 1, y: -1.732, vx: 1.582, vy: 0.913 },
        { mass: 10000000, x: -2, y: 0, vx: 0, vy: -1.83 },
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
