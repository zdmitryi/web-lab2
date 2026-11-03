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

drawAxes();

form.addEventListener('submit', function(event) {
    event.preventDefault();

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const yStr = yInput.value.replace(',', '.');
    const y = parseFloat(yStr);
    const rCheckboxes = document.querySelectorAll('input[name="r"]:checked');
    const rValues = Array.from(rCheckboxes).map((checkbox) => parseFloat(checkbox.value));

    let isValid = true;

    if (Number.isNaN(y) || y < -3 || y > 3) {
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

    if (!isValid) {
        return;
    }

    const x = parseFloat(document.getElementById('x-select').value);

    const requests = rValues.map(r => {
        const url = `check?x=${x}&y=${y}&r=${r}`;
        return fetch(url).then(response => response.json());
    });

    Promise.all(requests)
        .then(results => {
            let lastValidData = null;
            for (let i = results.length - 1; i >= 0; i--) {
                if (!results[i].error) {
                    lastValidData = results[i];
                    break;
                }
            }

            if (lastValidData) {
                updateTable(lastValidData.history);
                const isHit = lastValidData.history[0].isHit;
                drawGraph(x, y, rValues, isHit);
            } else {
                alert("Ошибка при обработке запросов");
            }
        })
        .catch(error => {
            console.error('AJAX Error:', error);
        });
});

function updateTable(history) {
    resultsBody.innerHTML = '';
    history.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.x}</td>
            <td>${item.y}</td>
            <td>${item.r}</td>
            <td style="color: ${item.isHit ? 'green' : 'red'}; font-weight: bold;">
                ${item.isHit ? 'Попадание' : 'Промах'}
            </td>
            <td>${item.time}</td>
            <td>${item.executionTime || '-'}</td>
        `;
        resultsBody.appendChild(row);
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

function drawGraph(x, y, rValues, isHit){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();

    const sortedR = [...rValues].sort((a, b) => b - a);

    sortedR.forEach(r => {
        const color = R_COLORS[r] || R_COLORS[1];
        drawArea(r, color);
    });

    drawPoint(x, y, isHit);
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