'use strict';

const canvas = document.getElementById('graph-canvas');
const ctx = canvas.getContext('2d');
const form = document.getElementById('coordinate-form');
const yInput = document.getElementById('y-input');
const yError = document.getElementById('y-error');
const rError = document.getElementById('r-error');
const resultsBody = document.getElementById('result-body');

const SCALE = 50;                      
const CENTER_X = canvas.width / 2;
const CENTER_Y = canvas.height / 2;
const R_COLORS = {
    1:   'rgba(0, 150, 255, 0.61)',    
    1.5: 'rgba(7, 255, 119, 0.61)',    
    2:   'rgba(255, 35, 35, 0.61)',    
    2.5: 'rgba(161, 39, 255, 0.61)',   
    3:   'rgba(255, 208, 0, 0.61)'     
};

form.addEventListener('submit', function(event) {
    event.preventDefault();

    const x = parseFloat(document.getElementById('x-select').value);

    const yStr = yInput.value.replace(',', '.');
    const y = parseFloat(yStr);

    const rCheckboxes = document.querySelectorAll('input[name="r"]:checked');

    const rValues = Array.from(rCheckboxes).map((checkbox) => parseFloat(checkbox.value));

    rValues.sort((a, b) => b - a);

    const time = Date.now();

    let isValid = true;

    if (Number.isNaN(y) || y < -3 || y > 3){
        yError.style.display = 'block';
        isValid = false;
    } else {
        yError.style.display = 'none';
    }

    if (rValues.length === 0) {
        rError.style.display = 'block';
        isValid = false;
    } else {
        rError.style.display = 'none';
    }

    if (!isValid){
        return;
    }

    drawGraph(x, y, rValues);

    rValues.forEach((r) => {
        const isHit = checkHit(x, y, r);
        addResultToTable(x, y, r, isHit, time);
        saveResult(x, y, r, isHit, time);
    });

});

function loadResultsFromStorage() {
    const results = JSON.parse(localStorage.getItem('labResults') || '[]');

    results.forEach(function(result) {
        addResultToTable(result.x, result.y, result.r, result.hit, result.time);
    });
}

function drawPoint(x, y, isHit){
    const px = CENTER_X + x * SCALE;
    const py = CENTER_Y - y * SCALE;

    ctx.beginPath();
    ctx.arc(px, py, 5, 0, 2 * Math.PI);
    ctx.fillStyle = isHit ? 'green' : 'red';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#000000';
}

function drawGraph(x, y, rValues){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();

    rValues.forEach(function(r) {
        const color = R_COLORS[r];
        drawArea(r, color);
    });

    let anyHit = false;
    rValues.forEach(function(r) {
        if (checkHit(x, y, r)) {
            anyHit = true;
        }
    });

    drawPoint(x, y, anyHit);
}

function addResultToTable(x, y, r, isHit, time){
    const row = document.createElement('tr');

    const hitText = isHit ? 'Попадание' : 'Промах';
    const hitColor = isHit ? 'green' : 'red';

    const dateStr = new Date(time).toLocaleString('ru-RU');

    row.innerHTML = `
        <td>${x}</td>
        <td>${y}</td>
        <td>${r}</td>
        <td style="color: ${hitColor}; font-weight: bold;">${hitText}</td>
        <td>${dateStr}</td>
    `;

    resultsBody.prepend(row);
}

function drawAxes(){
    ctx.beginPath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    ctx.moveTo(0, CENTER_Y);
    ctx.lineTo(canvas.width, CENTER_Y);

    ctx.moveTo(CENTER_X, 0);
    ctx.lineTo(CENTER_X, canvas.height);

    ctx.stroke();

    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(canvas.width - 10, CENTER_Y - 5);
    ctx.lineTo(canvas.width, CENTER_Y);
    ctx.lineTo(canvas.width - 10, CENTER_Y + 5);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(CENTER_X - 5, 10);
    ctx.lineTo(CENTER_X, 0);
    ctx.lineTo(CENTER_X + 5, 10);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '14px Arial';
    ctx.fillText('X', canvas.width - 20, CENTER_Y - 10);
    ctx.fillText('Y', CENTER_X + 10, 15);
}

function drawArea(r, color){
    const rPixel = r * SCALE;
    const halfR = rPixel / 2;

    const toPxX = (x) => CENTER_X + x * SCALE;
    const toPxY = (y) => CENTER_Y - y * SCALE;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(toPxX(0), toPxY(0));
    ctx.lineTo(toPxX(-r), toPxY(0));
    ctx.lineTo(toPxX(-r), toPxY(r));
    ctx.lineTo(toPxX(0), toPxY(r));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toPxX(0), toPxY(0));
    ctx.arc(toPxX(0), toPxY(0), halfR, Math.PI / 2, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toPxX(0), toPxY(0));
    ctx.lineTo(toPxX(0), toPxY(-r/2));
    ctx.lineTo(toPxX(r), toPxY(0));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function checkHit(x, y, r){

    const isInSquare = (x >= -r && x <= 0 && y >= 0 && y <= r);

    const isInTriangle = (x >= 0 && x <= r && y <= 0 && y >= -r/2 && (x - 2*y) <= r);

    const isInCircle = (x >= -r/2 && x <= 0 && y >= -r/2 && y <= 0 && (x*x + y*y) <= (r/2)*(r/2));

    return isInSquare || isInTriangle || isInCircle;
}

function saveResult(x, y, r, isHit, time){
    const results = JSON.parse(localStorage.getItem('labResults') || '[]');

    results.push({
        x: x,
        y: y,
        r: r,
        hit: isHit,
        time: time
    });

    localStorage.setItem('labResults', JSON.stringify(results));
}

loadResultsFromStorage();
drawAxes();