const handleFormInput = () => {
    const form = document.querySelector("form#parameter-form");
    const objects = buildObjects(form);

    buildCanvas(form, objects);
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
            object.mass = column.querySelector(`input[name=mass-${index}]`).value;
            object['position-x'] = column.querySelector(`input[name=position-x-${index}]`).value || 0;
            object['position-y'] = column.querySelector(`input[name=position-y-${index}]`).value || 0;
            object['velocity-x'] = column.querySelector(`input[name=velocity-x-${index}]`).value || 0;
            object['velocity-y'] = column.querySelector(`input[name=velocity-y-${index}]`).value || 0;
            object.color = column.querySelector(`select`).value || 'blue';
            return object;
        })
};

const buildCanvas = (form, objects) => {
    const canvas = document.getElementById('graphCanvas');
    clearCanvas(canvas);

    if (!validateInput(form)) {
        return;
    }

    const context = canvas.getContext('2d');

    const minX = form.querySelector('input[name=x-min]').value || 0;
    const maxX = form.querySelector('input[name=x-max]').value || 0;
    const minY = form.querySelector('input[name=y-min]').value || 0;
    const maxY = form.querySelector('input[name=y-max]').value || 0;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Set the graph parameters
    const xRange = maxX - minX || 10;
    const yRange = maxY - minY || 10;
    const scaleX = canvasWidth / xRange;
    const scaleY = canvasHeight / yRange;

    const offsetX = canvasWidth / 2;
    const offsetY = canvasHeight / 2;

    // Draw the x and y axes
    context.beginPath();
    context.moveTo(0, offsetY);
    context.lineTo(canvasWidth, offsetY);
    context.moveTo(offsetX, 0);
    context.lineTo(offsetX, canvasHeight);
    context.strokeStyle = 'black';
    context.stroke();

    drawObjects(context, objects, scaleX, scaleY, offsetX, offsetY);
};

const drawObjects = (context, objects, scaleX, scaleY, offsetX, offsetY) => {
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

const drawGraph_Bak = (data) => {
    const canvas = document.getElementById('graphCanvas');
    const context = canvas.getContext('2d');
    clearCanvas(canvas);

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const maxAmplitude = data.reduce((max, obj) => {
        return obj.y > max ? obj.y : max;
      }, data[0].y);

    const maxTime = Math.max(...data.map(entry => entry.t));

    // Set the graph parameters
    const scaleX = Math.ceil(canvasWidth / (maxTime));
    const scaleY = Math.ceil(canvasHeight / (2 * maxAmplitude * 1.1));
    const offsetX = 20;
    const offsetY = canvasHeight / 2;
    
    // Draw the x and y axes
    context.beginPath();
    context.moveTo(0, offsetY);
    context.lineTo(canvasWidth, offsetY);
    context.moveTo(offsetX, 0);
    context.lineTo(offsetX, canvasHeight);
    context.strokeStyle = 'black';
    context.stroke();
    
    context.fillStyle = 'black'; // Set the fill color for the labels

    // Draw labels for x-axis
    const xAxisStep = calculateAxisStep(maxTime);

    for (let t = 0; t <= canvasWidth; t += xAxisStep) {
        const labelX = t * scaleX + offsetX;
        const labelY = offsetY + 12; //TODO: invoke once
        context.fillText(t, labelX, labelY);
    }

    // Draw labels for y-axis
    const yAxisStep = calculateAxisStep(maxAmplitude);
    const maxYValue = canvasHeight / 2;

    for (let y = -maxYValue; y <= maxYValue; y += yAxisStep) {
        const labelX = offsetX - 20; //TODO: invoke once
        const labelY = -y * scaleY + offsetY + 5;
        context.fillText(Math.round(y * 10000) / 10000, labelX, labelY);
    }

    // Draw the function graph
    context.beginPath();
    context.strokeStyle = 'blue';

    for (const dataPoint of data) {
        const graphX = dataPoint.t * scaleX + offsetX;
        const graphY = -dataPoint.y * scaleY + offsetY;
        context.lineTo(graphX, graphY);
      }
    
    context.stroke();
}

const clearCanvas = (canvas) => {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}
