function _(e, all=false) {
        let divs = document.querySelectorAll(e);
        if (all || (divs.length > 1)) { return divs; }
        return divs[0];
    }

    const base = _('.base');
    const baseCTX = base.getContext("2d");

    const draw = _('.draw');
    const ctx = draw.getContext("2d");

    var cwidth = 1024;
    var cheight = 1024;
    base.width = cwidth;
    base.height = cheight;
    draw.width = cwidth;
    draw.height = cheight;

    let parts = 12;
    let lineWidth = 2;
    let rect = false;
    let mirror = true;

    let lastX = 0;
    let lastY = 0;
    let lastAngle = 0;
    let lastDistance = 0;

    draw.lineWidth = lineWidth;
    draw.lineCap = "round";

    ctx.strokeStyle = "#f00";
    ctx.fillStyle = "#f00";

    baseCTX.lineWidth = 2;
    baseCTX.strokeStyle = "rgba(0, 0, 0, 0.1)";

    // Function to get X, Y coordinates from mouse or touch event
    function getXY(e) {
        rect = draw.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        lastX = (clientX - rect.x) / rect.width * 1024;
        lastY = (clientY - rect.y) / rect.width * 1024;
        lastAngle = (((Math.atan2(lastY - 512, lastX - 512) * 180 / Math.PI) + 450) % 360) / 90;
        lastDistance = Math.sqrt(Math.pow(lastY - 512, 2) + Math.pow(lastX - 512, 2));
    }

    // Event listeners for mouse and touch interaction
    document.addEventListener('mousedown', getXY);
    document.addEventListener('touchstart', getXY);

    document.addEventListener('mouseup', function() { rect = false; });
    document.addEventListener('touchend', function() { rect = false; });

    draw.addEventListener('mousemove', drawCanvas);
    draw.addEventListener('touchmove', drawCanvas);

    // Input event listener for parts slider
    _('[name="parts"]').addEventListener('input', function(e) {
        const value = parseInt(e.target.value, 10);
        if (value < 2 || value > 24 || (value % 2 !== 0)) return; // Input validation
        parts = value;
        _('#partsValue').innerText = parts; // Update displayed value
        drawParts(); // Redraw parts guide
    });

    // Input event listener for line width slider
    _('[name="width"]').addEventListener('input', function(e) {
        const value = parseInt(e.target.value, 10);
        if (value < 1 || value > 10) return; // Input validation
        lineWidth = value;
        _('#lineWidthValue').innerText = lineWidth; // Update displayed value
        ctx.lineWidth = lineWidth; // Set canvas line width
    });

    // Change event listener for color picker
    _('[name="color"]').addEventListener('change', function(e) {
        ctx.strokeStyle = e.target.value; // Set drawing color
        ctx.fillStyle = e.target.value; // Set fill color for circles
    });

    // Initialization: clear canvas and draw initial parts
    clearCanvas();
    drawParts();

    // Function to clear the drawing canvas
    function clearCanvas() {
        ctx.fillStyle = "#ffffff"; // Set fill color to white
        ctx.fillRect(0, 0, cwidth, cheight); // Fill canvas with white
    }

    // Function to draw the base mandala parts guide
    function drawParts() {
        baseCTX.clearRect(0, 0, cwidth, cheight); // Clear base canvas

        // Draw concentric circles
        [128, 256, 384].forEach(radius => {
            baseCTX.beginPath();
            baseCTX.arc(512, 512, radius, 0, 2 * Math.PI);
            baseCTX.stroke();
        });

        // Draw lines for parts division
        for (let i = 0; i < parts; i++) {
            let angle = (4 / parts * i);
            let x = 512 + (512 * Math.sin(angle * (Math.PI / 2)));
            let y = 512 + (512 * Math.sin((angle - 1) * (Math.PI / 2)));

            baseCTX.beginPath();
            baseCTX.moveTo(512, 512);
            baseCTX.lineTo(x, y);
            baseCTX.stroke();
        }
    }

    // Function to draw on the canvas based on mouse/touch move
    function drawCanvas(e) {
        if (!rect) return; // Exit if not drawing (mouse/touch not down)

        let thisX, thisY;

        // Get current mouse/touch coordinates
        if (e.touches && e.touches.length > 0) {
            let touch = e.touches[0];
            rect = draw.getBoundingClientRect();
            thisX = (touch.clientX - rect.x) / rect.width * 1024;
            thisY = (touch.clientY - rect.y) / rect.width * 1024;
        } else if (e instanceof MouseEvent) {
            rect = draw.getBoundingClientRect();
            thisX = (e.clientX - rect.x) / rect.width * 1024;
            thisY = (e.clientY - rect.y) / rect.width * 1024;
        } else {
            return; // Exit if event type is not recognized
        }

        let thisAngle = (((Math.atan2(thisY - 512, thisX - 512) * 180 / Math.PI) + 450) % 360) / 90;
        let thisDistance = Math.sqrt(Math.pow(thisY - 512, 2) + Math.pow(thisX - 512, 2));

        // Draw mirrored parts
        for (let i = 0; i < parts; i++) {
            let newAngle1, newAngle2;

            if (mirror && ((i % 2) !== 0)) { // Use modulo operator for even/odd check
                newAngle1 = ((4 - thisAngle) - ((4 / parts) * (i - 1)));
                newAngle2 = ((4 - lastAngle) - ((4 / parts) * (i - 1)));
            } else {
                newAngle1 = (thisAngle + ((4 / parts) * i));
                newAngle2 = (lastAngle + ((4 / parts) * i));
            }

            let cX = 512 + (thisDistance * Math.sin(newAngle1 * (Math.PI / 2)));
            let cY = 512 + (thisDistance * Math.sin((newAngle1 - 1) * (Math.PI / 2)));

            let dX = 512 + (lastDistance * Math.sin(newAngle2 * (Math.PI / 2)));
            let dY = 512 + (lastDistance * Math.sin((newAngle2 - 1) * (Math.PI / 2)));

            // Draw circle for smoother lines
            ctx.beginPath();
            ctx.arc(cX, cY, (lineWidth - 1) / 2, 0, 2 * Math.PI);
            ctx.fill();

            // Draw line segment
            ctx.beginPath();
            ctx.moveTo(cX, cY);
            ctx.lineTo(dX, dY);
            ctx.stroke();
        }

        lastAngle = thisAngle; // Update last angle for line drawing
        lastDistance = thisDistance; // Update last distance for line drawing
    }

    // Function to toggle grid visibility
    function setGrid(e) {
        _('.base').classList.toggle('show', e.checked); // Use toggle with condition for cleaner code
    }

    // Function to toggle mirrored drawing
    function setMirrored(e) {
        mirror = e.checked;
    }

    // Function to download the mandala as JPEG
    function download() {
        let link = document.createElement('a');
        link.setAttribute('download', 'mandala.jpeg');
        link.setAttribute('href', draw.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream"));
        link.click();
    }

    // Function to toggle the settings panel
    function toggleSettings() {
      const settingsPanel = document.getElementById('settingsPanel');
      settingsPanel.classList.toggle('open');
    }
