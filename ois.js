function getSafeColor(imgData, data, x, y) {
    const intX = Math.floor(x);
    const intY = Math.floor(y);

    if (intX < 0) {
        return [0, 0, 0];
    }
    if (intY < 0) {
        return [0, 0, 0];
    }
    if (intX >= imgData.width) {
        return [0, 0, 0];
    }
    if (intY >= imgData.height) {
        return [0, 0, 0];
    }
    const pixel = (intY * imgData.width + intX) * 4;
    return [
        data[pixel + 0],
        data[pixel + 1],
        data[pixel + 2],
    ]
}

function shootRays(imgData, vStart, vEnd, minX, maxX, isHorizontal, step) {
    let intensity = 0;
    let startX, startY, endX, endY;

    const data = imgData.data;
    const angleStep = (Math.PI / 180);

    for (var angle = vStart; angle < vEnd; angle += angleStep) {
        // invert because Y axis goes down here instead of up
        const vRayVX = Math.cos(angle);
        const vRayVY = -Math.sin(angle);

        const vRayLeftX = Math.cos(angle - Math.PI / 2) * step;
        const vRayLeftY = -Math.sin(angle - Math.PI / 2) * step; 

        for (var c = minX; c < maxX; c += step) {
            var vRayX = isHorizontal ? c : 0;
            var vRayY = isHorizontal ? 0 : c;
            var vLength = 0;
            var vRayDiffSum = 0;

            while (vRayX >= 0 && vRayY >= 0 && vRayX < imgData.width && vRayY < imgData.height) {
                vLength += step;
                const left = getSafeColor(imgData, data, vRayX - vRayLeftX, vRayY - vRayLeftY);
                const right = getSafeColor(imgData, data, vRayX + vRayLeftX, vRayY + vRayLeftY);
                const diff = (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2 + (left[2] - right[2]) ** 2;
                vRayDiffSum += diff;
                vRayX += vRayVX;
                vRayY += vRayVY;

            }
            if (vLength < 100) {
                continue;
            }
            const currentIntensity = vRayDiffSum;

            if (currentIntensity > intensity) {
                intensity = currentIntensity;
                startX = isHorizontal ? c : 0;
                startY = isHorizontal ? 0 : c;
                endX = vRayX;
                endY = vRayY;
            }        
        }
    }

    return [startX, startY, endX, endY];
}

function getIntersection(firstLine, secondLine) {
    var line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY;
    [line1StartX, line1StartY, line1EndX, line1EndY] = firstLine;
    [line2StartX, line2StartY, line2EndX, line2EndY] = secondLine;

    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
    if (denominator == 0) {
        return result;
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));
/*
        // it is worth noting that this should be the same as:
        x = line2StartX + (b * (line2EndX - line2StartX));
        y = line2StartX + (b * (line2EndY - line2StartY));
        */
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return [result.x, result.y];
};

function bound(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

function getDocumentBoundaries(imgData) {
    let topLeftX, topLeftY, topRightX, topRightY, bottomLeftX, bottomLeftY, bottomRightX, bottomRightY;

    const maxWidth = Math.max(imgData.width, imgData.height);
    const step = maxWidth / 100;
    const startAngleDown = 254.7 * Math.PI / 180;
    const endAngleDown = 285.3 * Math.PI / 180;
    const startAngleLeft = -15.3 * Math.PI / 180;
    const endAngleLeft = 15.3 * Math.PI / 180;

    const leftLine = shootRays(imgData, startAngleDown, endAngleDown, 0, imgData.width / 2, true, step);
    const rightLine = shootRays(imgData, startAngleDown, endAngleDown, imgData.width / 2, imgData.width, true, step);
    const topLine = shootRays(imgData, startAngleLeft, endAngleLeft, 0, imgData.height / 2, false, step);
    const bottomLine = shootRays(imgData, startAngleLeft, endAngleLeft, imgData.height / 2, imgData.height, false, step);
    
    console.log(leftLine, rightLine, topLine, bottomLine);
    [topLeftX, topLeftY] = getIntersection(leftLine, topLine);
    [topRightX, topRightY] = getIntersection(rightLine, topLine);
    [bottomLeftX, bottomLeftY] = getIntersection(leftLine, bottomLine);
    [bottomRightX, bottomRightY] = getIntersection(rightLine, bottomLine);

    return [
        bound(topLeftX, 0, imgData.width), 
        bound(topLeftY, 0, imgData.height), 
        bound(topRightX, 0, imgData.width), 
        bound(topRightY, 0, imgData.height), 
        bound(bottomLeftX, 0, imgData.width), 
        bound(bottomLeftY, 0, imgData.height), 
        bound(bottomRightX, 0, imgData.width), 
        bound(bottomRightY, 0, imgData.height), 
    ]

}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const x = evt instanceof TouchEvent ? evt.touches[0].clientX : evt.clientX;
    const y = evt instanceof TouchEvent ? evt.touches[0].clientY : evt.clientY;

    return {
        x: (x - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (y - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}
function download(content, fileName, fileType) {  

    var len = content.length,
    ab = new ArrayBuffer(len),
    u8 = new Uint8Array(ab);

    while(len--) u8[len] = content.charCodeAt(len);

    var file = new Blob([ab], { type: fileType });

    if(navigator.userAgent.match('CriOS')) {
        var reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                window.location.href = reader.result;
                // var newWindow = null;
                // newWindow = window.open(reader.result, '_blank');
                // setTimeout(function() {
                //     newWindow.document.title = fileName;
                // }, 10);

            }
        }
        reader.readAsDataURL(file);    
    } else {
        saveAs(file, fileName);
    }
    
    // var reader = new FileReader(); 
    // reader.onload = function() { 
    //     var link = document.createElement('a');
    //     console.log(reader.result);
    //     link.href = reader.result;
    //     link.download = fileName;
    //     link.target = "_blank";
    //     document.body.appendChild(link); 
    //     link.click();
    //     document.body.removeChild(link);
    // }
    // reader.readAsDataURL(file); 
}

new Vue({
    el: "#app",
    data: {
        loading: false,
        isLoadingAdjustment: false,
        pages: [],

        topLeftX: 0,
        topLeftY: 0,
        topRightX: 0,
        topRightY: 0,
        bottomLeftX: 0,
        bottomLeftY: 0,
        bottomRightX: 0,
        bottomRightY: 0,
        rotation: 0,
        fileName: null,
        whiteThreshold: 100,

        offsetPercent: 0.1,
        dragging: null,
        worker: null,
        sen: 60,
        s: 15,
        margin: 5,
        handleSizeInverse: 30,

        currentPage: null,
    },
    mounted() {
        this.worker = new Worker("./imageWorker.js");
        this.worker.onmessage = this.finishRender;
        window.addEventListener("mouseup", this.up);
        window.addEventListener("touchend", this.up);
        window.addEventListener("touchcancel", this.up);

    },
    methods: {
        deletePage() {
            this.pages.splice(this.currentPage, 1);
            if (this.currentPage > this.pages.length - 1) {
                this.currentPage -= 1;
            };
            this.initializePage(this.currentPage);


        },
        checkMove(evt) {
            console.log(evt.draggedContext.element.index);
            return true;
        },
        render() {
            this.isLoadingAdjustment = true;
            var src = this.$refs.sourcecanvas;
            var dst = this.$refs.destcanvas;

            var finalWidth = Math.floor(((this.topRightX + this.bottomRightX) / 2) - ((this.topLeftX + this.bottomLeftX) / 2));
            var finalHeight = Math.floor(((this.bottomLeftY + this.bottomRightY) / 2) - ((this.topLeftY + this.topRightY) / 2));

            dst.width = finalWidth;
            dst.height = finalHeight;

            this.pages[this.currentPage].outputWidth = finalWidth;
            this.pages[this.currentPage].outputHeight = finalHeight;

            const srcd = src.getContext("2d").getImageData(0, 0, src.width, src.height);
            const dstd = dst.getContext("2d").getImageData(0, 0, dst.width, dst.height);

            this.worker.postMessage({
                srcd: srcd,
                dstd: dstd,
                sw: src.width,
                dw: dst.width,
                dh: dst.height,
                whiteThreshold: this.whiteThreshold,
                topLeftX: this.topLeftX,
                topLeftY: this.topLeftY,
                bottomLeftX: this.bottomLeftX,
                bottomLeftY: this.bottomLeftY,
                topRightX: this.topRightX,
                topRightY: this.topRightY,
                bottomRightX: this.bottomRightX,
                bottomRightY: this.bottomRightY
            });
        },
        finishRender(e) {
            this.isLoadingAdjustment = false;
            const dst = this.$refs.destcanvas;
            var ctx = dst.getContext("2d");

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = dst.width;
            tempCanvas.height = dst.height;            
            var tempCtx = tempCanvas.getContext("2d");
            tempCtx.putImageData(e.data.dstd, 0, 0);

            if (this.rotation === 90 || this.rotation === 270) {
                dst.width = tempCanvas.height;
                dst.height = tempCanvas.width;            
            }

            switch(this.rotation) {
                case 0:
                    ctx.transform(1, 0, 0, 1, 0, 0);
                    break;
                case 90:
                    ctx.transform(0, 1, -1, 0, tempCanvas.height, 0);
                    break;
                case 180:
                    ctx.transform(-1, 0, 0, -1, tempCanvas.width, tempCanvas.height);
                    break;
                case 270:
                    ctx.transform(0, -1, 1, 0, 0, tempCanvas.width);
                    break;
            }

            ctx.drawImage(tempCanvas, 0, 0);
            
            this.pages[this.currentPage].outputImage = dst.toDataURL("image/jpeg", 1.0);
            this.prepareDownloadImage();
        },        
        updatePoints() {
            var overlay = this.$refs.overlay;
            var ctx = overlay.getContext("2d");

            overlay.width = overlay.width;
            ctx.clearRect(0, 0, ctx.width, ctx.height);
            ctx.beginPath();
            ctx.lineWidth = this.sen / 6;
            ctx.moveTo(this.topLeftX, this.topLeftY);
            ctx.lineTo(this.topRightX, this.topRightY);
            ctx.lineTo(this.bottomRightX, this.bottomRightY);
            ctx.lineTo(this.bottomLeftX, this.bottomLeftY);
            ctx.lineTo(this.topLeftX, this.topLeftY);
            ctx.strokeStyle = '#333';            
            ctx.stroke();
            ctx.closePath();

            const points = [
                [this.topLeftX, this.topLeftY],
                [this.bottomLeftX, this.bottomLeftY],
                [this.topRightX, this.topRightY],
                [this.bottomRightX, this.bottomRightY],
            ];

            for (const point of points) {
                ctx.beginPath();
                ctx.strokeStyle="#fff";
                ctx.fillStyle = "#333";
                ctx.arc(point[0], point[1], this.sen, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.stroke();
                ctx.closePath();
            }

        },
        rotateLeft() {
            this.rotation = (this.rotation + 270) % 360;
        },
        rotateRight() {
            this.rotation = (this.rotation + 90) % 360;
        },
        hover(e) {
            // file drag hover
            e.stopPropagation();
            e.preventDefault();
        },
        drop(e) {
            if (!e.dataTransfer.files.length) {
                return;
            }
            e.stopPropagation();
            e.preventDefault();
            this.processFiles(e.dataTransfer.files);
        },
        prepareDownloadImage() {
            if (this.fileName) {
                this.$refs.downloadImage.href = this.$refs.destcanvas.toDataURL("image/jpeg");
                this.$refs.downloadImage.download = fileName + ".jpg";
            }
        },
        processFiles(files) {
            const src = this.$refs.sourcecanvas;
            const dst = this.$refs.destcanvas;
            const overlay = this.$refs.overlay;

            var totalFilesToProcess = 0;
            var filesProcessed = 0;

            this.loading = true;

            for (var i = 0; i < files.length; i++) {
                var file = files[i];


                if (file.type.indexOf("image") !== 0) {
                    continue;
                }

                totalFilesToProcess += 1;

                fileName = file.name.substring(0, file.name.lastIndexOf('.'));

                var reader = new FileReader();
                reader.onload = (e) => {
                    var img = new Image();
                    img.onload = (e) => {
                        const tempCanvas = document.createElement("canvas");
                        tempCanvas.width = img.width;
                        tempCanvas.height = img.height;
                        const tempCtx = tempCanvas.getContext('2d');

                        tempCtx.drawImage(img, 0, 0);

                        var imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

                        [this.topLeftX, this.topLeftY, this.topRightX, this.topRightY, this.bottomLeftX, this.bottomLeftY, this.bottomRightX, this.bottomRightY] = getDocumentBoundaries(imgData);
                        const offset = this.offsetPercent * img.width;
                        const newPage = {
                            topLeftX: this.topLeftX,
                            topLeftY: this.topLeftY,
                            topRightX: this.topRightX,
                            topRightY: this.topRightY,
                            bottomLeftX: this.bottomLeftX,
                            bottomLeftY: this.bottomLeftY,
                            bottomRightX: this.bottomRightX,
                            bottomRightY: this.bottomRightY,
                            inputWidth: tempCanvas.width,
                            inputHeight: tempCanvas.height,
                            rotation: 0,
                            fileName: fileName,
                            whiteThreshold: 100,
                            image: tempCanvas.toDataURL('image/jpeg', 1.0)
                        }

                        this.pages.push(newPage);
                        this.currentPage = this.pages.length - 1;

                        filesProcessed += 1;
                        if (filesProcessed === totalFilesToProcess) {
                            this.loading = false;
                        }

                    };
                    img.src = e.target.result;

                };
                reader.readAsDataURL(file);

            }

            if (totalFilesToProcess === 0) {
                this.loading = false;
                this.$buefy.dialog.alert({
                    title: 'Error',
                    message: "Please upload image files only.",
                    type: 'is-danger',
                    hasIcon: true,
                    icon: 'times-circle',
                    iconPack: 'fa',
                    ariaRole: 'alertdialog',
                    ariaModal: true
                })
            }

        },
        downloadPDF(e) {            
            var pdf = new jsPDF();
            var margin = this.margin;

            for (var i = 0; i < this.pages.length; i++) {
                var imgData = this.pages[i].outputImage;

                var width = pdf.internal.pageSize.width - margin * 2;
                var height = pdf.internal.pageSize.height - margin * 2;

                var pdfRatio = height / width;
                var currentRatio = null;

                if (this.pages[i].rotation === 90 || this.pages[i].rotation === 270) {
                    currentRatio = this.pages[i].outputWidth / this.pages[i].outputHeight;
                } else {
                    currentRatio = this.pages[i].outputHeight / this.pages[i].outputWidth;
                }

                if (pdfRatio > currentRatio) {
                    pdf.addImage(imgData, 'JPEG', margin, margin, width, width * currentRatio);
                } else {
                    pdf.addImage(imgData, 'JPEG', margin + (width - height / currentRatio) / 2, margin, height / currentRatio, height);
                }

                if (i !== this.pages.length - 1) {
                    pdf.addPage();
                }

            }
                    
            if(navigator.userAgent.match('CriOS')) {
                download(pdf.output(), "Scandoc.pdf", "application/pdf");
            } else {
                pdf.save("Scandoc.pdf");
            }
        },
        uploadFile(e) {
            this.processFiles(e.target.files);
        },
        down(e) {
            const pos = getMousePos(this.$refs.sourcecanvas, e);

            if (
                (pos.x > this.topLeftX - this.sen) && 
                (pos.y > this.topLeftY - this.sen) && 
                (pos.x < this.topLeftX + this.sen) && 
                (pos.y < this.topLeftY + this.sen)) {
                this.dragging = "topleft";
                e.preventDefault();

            }
            if (
                (pos.x > this.topRightX - this.sen) && 
                (pos.y > this.topRightY - this.sen) && 
                (pos.x < this.topRightX + this.sen) && 
                (pos.y < this.topRightY + this.sen)) {
                this.dragging = "topright";
                e.preventDefault();

            }
            if (
                (pos.x > this.bottomLeftX - this.sen) && 
                (pos.y > this.bottomLeftY - this.sen) && 
                (pos.x < this.bottomLeftX + this.sen) && 
                (pos.y < this.bottomLeftY + this.sen)) {
                this.dragging = "bottomleft";
                e.preventDefault();

            }
            if (
                (pos.x > this.bottomRightX - this.sen) && 
                (pos.y > this.bottomRightY - this.sen) && 
                (pos.x < this.bottomRightX + this.sen) && 
                (pos.y < this.bottomRightY + this.sen)) {
                this.dragging = "bottomright";
                e.preventDefault();

            }
            this.updatePoints();

            return true;
        },
        move(e) {
            const overlay = this.$refs.overlay;

            const pos = getMousePos(this.$refs.sourcecanvas, e);

            if (
                (pos.x > this.topLeftX - this.sen) && 
                (pos.y > this.topLeftY - this.sen) && 
                (pos.x < this.topLeftX + this.sen) && 
                (pos.y < this.topLeftY + this.sen)) {
                overlay.style.cursor = "pointer";
                e.preventDefault();

            } else if (
                (pos.x > this.topRightX - this.sen) && 
                (pos.y > this.topRightY - this.sen) && 
                (pos.x < this.topRightX + this.sen) && 
                (pos.y < this.topRightY + this.sen)) {
                overlay.style.cursor = "pointer";
                e.preventDefault();

            } else if (
                (pos.x > this.bottomLeftX - this.sen) && 
                (pos.y > this.bottomLeftY - this.sen) && 
                (pos.x < this.bottomLeftX + this.sen) && 
                (pos.y < this.bottomLeftY + this.sen)) {
                overlay.style.cursor = "pointer";
                e.preventDefault();

            } else if (
                (pos.x > this.bottomRightX - this.sen) && 
                (pos.y > this.bottomRightY - this.sen) && 
                (pos.x < this.bottomRightX + this.sen) && 
                (pos.y < this.bottomRightY + this.sen)) {
                overlay.style.cursor = "pointer";
                e.preventDefault();

            } else {
                overlay.style.cursor = "inherit";
            }

            if (this.dragging) {
                if (this.dragging === "topleft") {
                    this.topLeftX = pos.x;
                    this.topLeftY = pos.y;
                    this.pages[this.currentPage].topLeftX = pos.x;
                    this.pages[this.currentPage].topLeftY = pos.y;
                    e.preventDefault();

                }
                if (this.dragging === "topright") {
                    this.topRightX = pos.x;
                    this.topRightY = pos.y;
                    this.pages[this.currentPage].topRightX = pos.x;
                    this.pages[this.currentPage].topRightY = pos.y;
                    e.preventDefault();

                }
                if (this.dragging === "bottomleft") {
                    this.bottomLeftX = pos.x;
                    this.bottomLeftY = pos.y;
                    this.pages[this.currentPage].bottomLeftX = pos.x;
                    this.pages[this.currentPage].bottomLeftY = pos.y;
                    e.preventDefault();

                }
                if (this.dragging === "bottomright") {
                    this.bottomRightX = pos.x;
                    this.bottomRightY = pos.y;
                    this.pages[this.currentPage].bottomRightX = pos.x;
                    this.pages[this.currentPage].bottomRightY = pos.y;
                    e.preventDefault();

                }
                this.updatePoints();
            }
        },
        up(e) {
            if (!this.dragging) {
                return
            }
            e.preventDefault();

            this.dragging = null;
            this.updatePoints();
            this.render();
        },
        selectPage(index) {
            this.currentPage = index;
        },
        initializePage(newPage) {
            const pageData = this.pages[newPage];

            this.topLeftX = pageData.topLeftX;
            this.topLeftY = pageData.topLeftY;
            this.topRightX = pageData.topRightX;
            this.topRightY = pageData.topRightY;
            this.bottomLeftX = pageData.bottomLeftX;
            this.bottomLeftY = pageData.bottomLeftY;
            this.bottomRightX = pageData.bottomRightX;
            this.bottomRightY = pageData.bottomRightY;
            this.rotation = pageData.rotation;
            this.fileName = pageData.fileName;
            this.whiteThreshold = pageData.whiteThreshold;
            
            const src = this.$refs.sourcecanvas;
            const dst = this.$refs.destcanvas;
            const overlay = this.$refs.overlay;

            const ctx = src.getContext('2d');
            const img = new Image();
            img.onload = () => {
                src.width = img.width;
                src.height = img.height;
                this.sen = src.width / this.handleSizeInverse;

                // copy dst attributes
                dst.width = src.width;
                dst.height = src.height;
                overlay.width = src.width;
                overlay.height = src.height;


                ctx.drawImage(img, 0, 0);

                this.render();
                this.updatePoints();
            };
            img.src = pageData.image;
        }        
    },
    watch: {
        whiteThreshold(val) {
            const pageData = this.pages[this.currentPage];
            pageData.whiteThreshold = val;
            this.render();
        },
        rotation(val) {
            const pageData = this.pages[this.currentPage];
            pageData.rotation = val;
            this.render();
        },
        currentPage(newPage) {
            this.initializePage(newPage);
        },

    }

})
