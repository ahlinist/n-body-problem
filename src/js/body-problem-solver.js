const G = 6.6743 * 10e-11;

let scaleX;
let scaleY;
let offsetX;
let offsetY;

const canvas = document.getElementById('graphCanvas');

const handleFormInput = () => {
    const form = document.querySelector("form#parameter-form");

    form.addEventListener('submit', function(event) {
        event.preventDefault();
    });

    const objects = buildObjects(form);
    buildCanvas(form, objects);

    return objects;
}

const validateInput = (form) => {
    const errorBox = document.querySelector("p#error-message");
    errorBox.innerHTML = "";

    let errorMessage = "";

    const massInputs = form.querySelectorAll('input[name^="mass-"]');
    const emptyMassInputs = Array.from(massInputs).filter(input => input.value.trim() === '');

    if (emptyMassInputs.length) {
        errorMessage += "Provide mass values<br>"
    }

    if (errorMessage) {
        errorBox.innerHTML = errorMessage;
        return false;
    } else {
        return true;
    }
}

const buildObjects = (form) => {
    return Array.from(form.querySelectorAll('div[id^="body-"]'))
        .map(column => {
            const object = {};
            const id = column.id;
            const index = id.slice(id.indexOf('-') + 1);
            object.index = index;
            object.mass = parseFloat(column.querySelector(`input[name=mass-${index}]`).value);
            object['position-x'] = parseFloat(column.querySelector(`input[name=position-x-${index}]`).value) || 0;
            object['position-y'] = parseFloat(column.querySelector(`input[name=position-y-${index}]`).value) || 0;
            object['velocity-x'] = parseFloat(column.querySelector(`input[name=velocity-x-${index}]`).value) || 0;
            object['velocity-y'] = parseFloat(column.querySelector(`input[name=velocity-y-${index}]`).value) || 0;
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
        const x = Number(offsetX) + Number(object['position-x'] * scaleX);
        const y = Number(offsetY) - Number(object['position-y'] * scaleY);
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

    setInterval(() => calculateStep(objects, interval), interval * 10);
    //calculateStep(objects, interval);
};

const calculateStep = (objects, interval) => {
    if (objects[0]['velocity-x-result']) {
        objects.forEach(object => {
            object['velocity-x'] = object['velocity-x-result'];
            object['velocity-y'] = object['velocity-y-result'];
            object['position-x'] = object['position-x-result'];
            object['position-y'] = object['position-y-result'];
        });
    }

    objects.forEach(object => {
        const vx = Number(object['velocity-x']);
        const vy = Number(object['velocity-y']);
        const x = Number(object['position-x']);
        const y = Number(object['position-y']);

        object['velocity-x-result'] = objects.reduce((accumulator, other) => {
            return calculateVelocity(object, accumulator, other, x, y, vx, interval, 'x');
        }, 0);

        object['velocity-y-result'] = objects.reduce((accumulator, other) => {
            return calculateVelocity(object, accumulator, other, x, y, vy, interval, 'y');
        }, 0);

        object['position-x-result'] = objects.reduce((accumulator, other) => {
            return calculatePosition(object, accumulator, other, x, y, x, vx, interval, 'x');
        }, 0);

        object['position-y-result'] = objects.reduce((accumulator, other) => {
            return calculatePosition(object, accumulator, other, x, y, y, vy, interval, 'y');
        }, 0);

        console.log(object['position-y'])
    });

    drawObjects(objects);
};

const calculateVelocity = (object, accumulator, other, x, y, initialVelocity, interval, axis) => {
    if (object.index === other.index) {
        return accumulator;
    }

    const [oMass, oX, oY, factor] = calculateIntermediateValues(other, x, y, axis);

    return accumulator + initialVelocity + factor * interval * (G * oMass)/((x - oX) ** 2 + (y - oY) ** 2);
};

const calculatePosition = (object, accumulator, other, x, y, initialPosition, initialVelocity, interval, axis) => {
    if (object.index === other.index) {
        return accumulator;
    }

    const [oMass, oX, oY, factor] = calculateIntermediateValues(other, x, y, axis);

    return accumulator + initialPosition + initialVelocity * interval + factor * interval ** 2 * ((G * oMass)/((x - oX) ** 2 + (y - oY) ** 2)) / 2;
};

const calculateIntermediateValues = (other, x, y, axis) => {
    const oMass = Number(other.mass);
    const oX = Number(other['position-x']);
    const oY = Number(other['position-y']);

    const angle = Math.atan2(y - oY, x - oX);

    let factor;

    if (axis === 'x') {
        factor = Math.cos(angle);
    } else if (axis === 'y') {
        factor = Math.sin(angle);
    } else {
        throw new Error("Unknown axis!");
    }

    return [oMass, oX, oY, factor];
};
