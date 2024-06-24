const G = 6.6743e-11;

let scaleX;
let scaleY;
let offsetX;
let offsetY;

let timer = 0;

const canvas = document.getElementById('graphCanvas');

const handleFormInput = () => {
    const form = document.querySelector("form#parameter-form");
    const objects = buildObjects(form);
    buildCanvas(form, objects);
    return objects;
}

const validateInput = (form) => {
    const errorBox = document.querySelector("p#error-message");
    let errorMessage = "";
    const emptyMassInputs = Array.from(form.querySelectorAll('input[name^="mass-"]'))
        .filter(input => input.value.trim() === '');

    if (emptyMassInputs.length) {
        errorMessage += "Provide mass values<br>"
    }

    errorBox.innerHTML = errorMessage;
    return errorMessage ? false : true;
}

const buildObjects = (form) => {
    return Array.from(form.querySelectorAll('div[id^="body-"]'))
        .map(column => {
            const object = {};
            const id = column.id;
            const index = id.slice(id.indexOf('-') + 1);
            object.index = index;
            object.mass = parseFloat(column.querySelector(`input[name=mass-${index}]`).value);
            object.x = parseFloat(column.querySelector(`input[name=position-x-${index}]`).value) || 0;
            object.y = parseFloat(column.querySelector(`input[name=position-y-${index}]`).value) || 0;
            object.vx = parseFloat(column.querySelector(`input[name=velocity-x-${index}]`).value) || 0;
            object.vy = parseFloat(column.querySelector(`input[name=velocity-y-${index}]`).value) || 0;
            object.color = column.querySelector(`select`).value || 'blue';
            return object;
        })
};

const buildCanvas = (form, objects) => {
    clearCanvas(canvas);

    if (!validateInput(form)) {
        return;
    }

    const context = canvas.getContext('2d');

    const minX = parseFloat(form.querySelector('input[name=x-min]').value) || 0;
    const maxX = parseFloat(form.querySelector('input[name=x-max]').value) || 0;
    const minY = parseFloat(form.querySelector('input[name=y-min]').value) || 0;
    const maxY = parseFloat(form.querySelector('input[name=y-max]').value) || 0;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Set the graph parameters
    const xRange = maxX - minX || 10;
    const yRange = maxY - minY || 10;
    scaleX = canvasWidth / xRange;
    scaleY = canvasHeight / yRange;
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
        const x = Number(offsetX) + Number(object.x * scaleX);
        const y = Number(offsetY) - Number(object.y * scaleY);
        context.beginPath();
        context.fillStyle = object.color;
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fill();
        context.stroke();
    });
};

const clearCanvas = (canvas) => {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

const startMotion = () => {
    const objects = handleFormInput();
    const interval = 1;
    setInterval(() => calculateStep(objects, interval / 100000), interval);
};

const calculateStep = (objects, interval) => {
    timer += 1 / 1000;

    const object1 = objects[0];
    const object2 = objects[1];

    if (object1['velocity-x-result']) {
        objects.forEach(object => {
            object.vx = object['velocity-x-result'];
            object.vy = object['velocity-y-result'];
            object.x = object['position-x-result'];
            object.y = object['position-y-result'];
        });
    }

    const [vx1, vy1] = calculateVelocity(object1, object2, interval)

    object1['velocity-x-result'] = vx1;
    object1['velocity-y-result'] = vy1;
    object1['position-x-result'] = calculatePosition(object1, object2, object1.x, object1.vx, interval, 'x');
    object1['position-y-result'] = calculatePosition(object1, object2, object1.y, object1.vy, interval, 'y');

    const [vx2, vy2] = calculateVelocity(object2, object1, interval);

    object2['velocity-x-result'] = vx2;
    object2['velocity-y-result'] = vy2;
    object2['position-x-result'] = calculatePosition(object2, object1, object2.x, object2.vx, interval, 'x');
    object2['position-y-result'] = calculatePosition(object2, object1, object2.y, object2.vy, interval, 'y');

    drawObjects(objects);
};



const calculateVelocity = (object, other, interval) => {
    const angle = Math.atan2(object.y - other.y, object.x - other.x);
    const vx = object.vx - Math.cos(angle) * interval * (G * other.mass)/((object.x - other.x) ** 2 + (object.y - other.y) ** 2);
    const vy = object.vy - Math.sin(angle) * interval * (G * other.mass)/((object.x - other.x) ** 2 + (object.y - other.y) ** 2);
    return [vx, vy];
};

const calculatePosition = (object, other, initialPosition, initialVelocity, interval, axis) => {
    const angle = Math.atan2(object.y - other.y, object.x - other.x);

    let factor;

    if (axis === 'x') {
        factor = Math.cos(angle);
    } else if (axis === 'y') {
        factor = Math.sin(angle);
    } else {
        throw new Error("Unknown axis!");
    }

    return initialPosition + initialVelocity * interval - factor * interval ** 2 * ((G * other.mass)/((object.x - other.x) ** 2 + (object.y - other.y) ** 2)) / 2;
};
