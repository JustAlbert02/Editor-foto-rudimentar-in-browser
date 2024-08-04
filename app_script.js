window.onload = function() {
    const imageLoader = document.getElementById('imageLoader');
    const saveButton = document.getElementById('saveButton');
    const cropButton = document.getElementById('cropButton');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    let img = new Image(); // Imaginea curenta de lucru
    let isSelecting = false;
    let startX, startY; // Coordonatele initiale ale selectiei
    let selectedArea = { x1: 0, y1: 0, x2: 0, y2: 0 }; // Zona selectata

    imageLoader.addEventListener('change', handleImage, false);
    saveButton.addEventListener('click', saveImage, false);
    cropButton.addEventListener('click', cropImage, false);


    function handleImage(e) {
        const reader = new FileReader();
        reader.onload = function(event) {
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                clearSelection();
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
    }

    function saveImage() {
        const imageData = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const link = document.createElement('a');
        link.download = 'imagine-editata.png';
        link.href = imageData;
        link.click();
    }

    //functie pentru selectarea unei zone din imagine
    canvas.addEventListener('mousedown', function(e) {
        if (isSelecting || isSelectionMade()) {
            clearSelection();
        }
        startX = e.offsetX;
        startY = e.offsetY;
        isSelecting = true;
    });

    //functie pentru desenarea conturului zonei selectate
    canvas.addEventListener('mousemove', function(e) {
        if (isSelecting) {
            drawSelection(startX, startY, e.offsetX, e.offsetY);
        }
    });

    //functie pentru finalizarea selectiei
    canvas.addEventListener('mouseup', function(e) {
        isSelecting = false;
        finalizeSelection(startX, startY, e.offsetX, e.offsetY);
    });

    //functie pentru desenarea conturului zonei selectate
    function drawSelection(x1, y1, x2, y2) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.rect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeStyle = 'red';
        ctx.stroke();
        ctx.closePath();
    }

    function finalizeSelection(x1, y1, x2, y2) {
        // calcularea coordonatelor corecte indiferent de directia de selectie
        selectedArea = {
            x1: Math.min(x1, x2),
            y1: Math.min(y1, y2),
            x2: Math.max(x1, x2),
            y2: Math.max(y1, y2)
        };
    }


    function cropImage() {
        if (selectedArea.x1 !== selectedArea.x2 && selectedArea.y1 !== selectedArea.y2) {
            const width = selectedArea.x2 - selectedArea.x1;
            const height = selectedArea.y2 - selectedArea.y1;

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, selectedArea.x1, selectedArea.y1, width, height, 0, 0, width, height);
            updateCurrentImage(); // Actualizeaza imaginea curenta cu rezultatul crop-ului
        }
    }

    function isSelectionMade() {
        return selectedArea.x1 !== selectedArea.x2 || selectedArea.y1 !== selectedArea.y2;
    }


    function clearSelection() {
        selectedArea = { x1: 0, y1: 0, x2: 0, y2: 0 };
        isSelecting = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height); // sterge conturul de selectie
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Redesenare imaginea curenta
    }


    //functie pentru aplicarea efectului selectat
    function applyEffect() {
        const effect = document.getElementById('effectOptions').value;
        if (isSelectionMade()) {
            switch (effect) {
                case 'grayscale':
                    applyGrayscale();
                    break;
                case 'sepia':
                    applySepia();
                    break;
            }
            updateCurrentImage();
        }
    }

    function applyGrayscale() {
        // redesenarea zonei selectate din imaginea originala
        ctx.drawImage(img, selectedArea.x1, selectedArea.y1,
            selectedArea.x2 - selectedArea.x1, selectedArea.y2 - selectedArea.y1, selectedArea.x1, selectedArea.y1,
            selectedArea.x2 - selectedArea.x1, selectedArea.y2 - selectedArea.y1);

        // aplicarea efectului grayscale
        const imageData = ctx.getImageData(selectedArea.x1, selectedArea.y1, selectedArea.x2 - selectedArea.x1, selectedArea.y2 - selectedArea.y1);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const grayscale = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
            data[i] = grayscale;
            data[i + 1] = grayscale;
            data[i + 2] = grayscale;
        }

        ctx.putImageData(imageData, selectedArea.x1, selectedArea.y1);
    }

    function applySepia() {
        // redesenarea zonei selectate din imaginea originala
        ctx.drawImage(img, selectedArea.x1, selectedArea.y1,
            selectedArea.x2 - selectedArea.x1, selectedArea.y2 - selectedArea.y1, selectedArea.x1, selectedArea.y1,
            selectedArea.x2 - selectedArea.x1, selectedArea.y2 - selectedArea.y1);

        // aplicarea efectului sepia
        const imageData = ctx.getImageData(selectedArea.x1, selectedArea.y1, selectedArea.x2 - selectedArea.x1, selectedArea.y2 - selectedArea.y1);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];

            data[i] = Math.min((red * .393) + (green *.769) + (blue * .189), 255);
            data[i + 1] = Math.min((red * .349) + (green *.686) + (blue * .168), 255);
            data[i + 2] = Math.min((red * .272) + (green *.534) + (blue * .131), 255);
        }

        ctx.putImageData(imageData, selectedArea.x1, selectedArea.y1);
    }

    function updateCurrentImage() {
        img.src = canvas.toDataURL();
    }

    //listener pentru evenimentul de schimbare a optiunii pentru efect
    document.getElementById('effectOptions').addEventListener('change', applyEffect);


    // functie pentru redimensionarea imaginii
    function scaleImage() {
        const newWidth = parseInt(document.getElementById('newWidth').value);
        const newHeight = parseInt(document.getElementById('newHeight').value);

        if (!isNaN(newWidth) && !isNaN(newHeight) && newWidth > 0 && newHeight > 0) {
            // calculam noile dimensiuni pastrand proportiile
            const scaleFactor = Math.min(newWidth / img.width, newHeight / img.height);
            const scaledWidth = img.width * scaleFactor;
            const scaledHeight = img.height * scaleFactor;

            // redimensionam canvas-ul
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;

            // desenam imaginea redimensionata
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

            // salvam imaginea noua in variabila
            img = new Image();
            img.src = canvas.toDataURL();
        }
    }

    // Adaugam un listener pentru butonul de redimensionare
    document.getElementById('scaleButton').addEventListener('click', scaleImage);


    //Adaugare text
    function addText() {
        const text = document.getElementById('textInput').value;
        const textSize = parseInt(document.getElementById('textSize').value);
        const textColor = document.getElementById('textColor').value;
        const textX = parseInt(document.getElementById('textX').value); // Coordonata x
        const textY = parseInt(document.getElementById('textY').value); // Coordonata y

        if (text && !isNaN(textSize) && textSize > 0 && !isNaN(textX) && !isNaN(textY)) {
            // setam fontul si culoarea textului
            ctx.font = `${textSize}px Arial`;
            ctx.fillStyle = textColor;

            // Desenam textul pe canvas
            ctx.fillText(text, textX, textY);

            // Salvam imaginea noua in variabila
            const modifiedImage = new Image();
            modifiedImage.src = canvas.toDataURL();

            // Actualizam imaginea curenta cu cea modificata
            img = modifiedImage;
        }
    }


// Adaugam un listener pentru butonul de adaugare text
    document.getElementById('addTextButton').addEventListener('click', addText);

    //Histograma
    function drawColorHistogram() {

        if (!isSelectionMade()) {
            // Dacă nu exista o selectie se afisaza un canvas gol
            const histogramCanvas = document.getElementById('colorHistogram');
            const histogramContext = histogramCanvas.getContext('2d');
            histogramContext.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);
            return;
        }

        // Se obtin datele pixelilor din zona selectata
        const imageData = ctx.getImageData(selectedArea.x1, selectedArea.y1, selectedArea.x2 - selectedArea.x1, selectedArea.y2 - selectedArea.y1);
        const data = imageData.data;

        // Contoare pentru fiecare canal de culoare
        const redChannel = new Array(256).fill(0);
        const greenChannel = new Array(256).fill(0);
        const blueChannel = new Array(256).fill(0);

        // Calculearea histogramei pentru fiecare canal
        for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];

            redChannel[red]++;
            greenChannel[green]++;
            blueChannel[blue]++;
        }

        // Se afișeaza histograma de culoare pe canvas
        const histogramCanvas = document.getElementById('colorHistogram');
        const histogramContext = histogramCanvas.getContext('2d');
        histogramContext.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);

        const barWidth = histogramCanvas.width / 256;
        const maxCount = Math.max(...redChannel, ...greenChannel, ...blueChannel);

        for (let i = 0; i < 256; i++) {
            const redHeight = (redChannel[i] / maxCount) * histogramCanvas.height;
            const greenHeight = (greenChannel[i] / maxCount) * histogramCanvas.height;
            const blueHeight = (blueChannel[i] / maxCount) * histogramCanvas.height;

            histogramContext.fillStyle = `rgb(${i}, 0, 0)`;
            histogramContext.fillRect(i * barWidth, histogramCanvas.height - redHeight, barWidth, redHeight);

            histogramContext.fillStyle = `rgb(0, ${i}, 0)`;
            histogramContext.fillRect(i * barWidth, histogramCanvas.height - greenHeight, barWidth, greenHeight);

            histogramContext.fillStyle = `rgb(0, 0, ${i})`;
            histogramContext.fillRect(i * barWidth, histogramCanvas.height - blueHeight, barWidth, blueHeight);
        }
    }



    // La finalizarea selectiei, se apeleaza functia pentru a afisa histograma de culoare
    canvas.addEventListener('mouseup', function(e) {
        isSelecting = false;
        finalizeSelection(startX, startY, e.offsetX, e.offsetY);
        drawColorHistogram(); // Afisati histograma de culoare dupa finalizarea selectiei
    });


    //Miscare imagine

   //TODO

    //Stergere selectie -> pixelii din selectie vor deveni albi

    function deleteSelection() {
        if (isSelectionMade()) {
            // Desenam zona selectata cu alb (zona trebuie sa fie usor mai mare pentru a evita conturul rosu de la selectie)
            ctx.fillStyle = 'white';
            ctx.fillRect(selectedArea.x1 - 1, selectedArea.y1 - 1, selectedArea.x2 - selectedArea.x1 + 2, selectedArea.y2 - selectedArea.y1 + 2);
            // Salvam imaginea curenta in variabila
            const modifiedImage = new Image();
            modifiedImage.src = canvas.toDataURL();

            // Actualizam imaginea curenta cu cea modificata
            img = modifiedImage;
        }
    }

    // Adaugam un listener pentru butonul de stergere a selectiei
    document.getElementById('deleteSelectionButton').addEventListener('click', deleteSelection);
}
