
var topLeftX = 0;
var topLeftY = 0;
var topRightX = 0;
var topRightY = 0;
var bottomLeftX = 0;
var bottomLeftY = 0;
var bottomRightX = 0;
var bottomRightY = 0;
var offset = 200;
var dragging = null;
var fileName = null;
var whiteThreshold = 100;
var worker = null;

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const x = evt instanceof TouchEvent ? evt.touches[0].clientX : evt.clientX;
    const y = evt instanceof TouchEvent ? evt.touches[0].clientY : evt.clientY;

    return {
        x: (x - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (y - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}



function render() {
	var src = document.getElementById("sourcecanvas");
	var dst = document.getElementById("destcanvas");
	whiteThreshold = document.getElementById("whitethreshold").value;

	var finalWidth = Math.floor(((topRightX + bottomRightX) / 2) - ((topLeftX + bottomLeftX) / 2));
	var finalHeight = Math.floor(((bottomLeftY + bottomRightY) / 2) - ((topLeftY + topRightY) / 2));

	dst.width = finalWidth;
	dst.height = finalHeight;

	var srcd = src.getContext("2d").getImageData(0, 0, src.width, src.height);
	var dstd = dst.getContext("2d").getImageData(0, 0, dst.width, dst.height);

	var sw = src.width;
	var dw = dst.width;
	var dh = dst.height;

	//processImage(srcd, dstd, sw, dw, dh, topLeftX, topLeftY, bottomLeftX, bottomLeftY, topRightX, topRightY, bottomRightX, bottomRightY);
	worker.postMessage({
		srcd: srcd,
		dstd: dstd,
		sw: sw,
		dw: dw,
		dh: dh,
		whiteThreshold: whiteThreshold,
		topLeftX: topLeftX,
		topLeftY: topLeftY,
		bottomLeftX: bottomLeftX,
		bottomLeftY: bottomLeftY,
		topRightX: topRightX,
		topRightY: topRightY,
		bottomRightX: bottomRightX,
		bottomRightY: bottomRightY
	});


	//var ctx = dst.getContext("2d");
	//ctx.putImageData(dstd, 0, 0);

}

function finishRender(e) {
	var dst = document.getElementById("destcanvas");

	var ctx = dst.getContext("2d");
	ctx.putImageData(e.data.dstd, 0, 0);
	prepareDownloadImage();

}

function processImage(srcd, dstd, sw, dw, dh, whiteThreshold, topLeftX, topLeftY, bottomLeftX, bottomLeftY, topRightX, topRightY, bottomRightX, bottomRightY) {

	for (var y = 0; y < dh; y++) {

		var dy = y / dh;

		var startX = topLeftX + dy*(bottomLeftX-topLeftX);
		var startY = topLeftY + dy*(bottomLeftY-topLeftY);

		var endX = topRightX + dy*(bottomRightX-topRightX);
		var endY = topRightY + dy*(bottomRightY-topRightY);

		for (var x = 0; x < dw; x++) {
			var dx = x / dw;

			var pointX = Math.floor(startX + dx*(endX-startX));
			var pointY = Math.floor(startY + dx*(endY-startY));

			var dstxy = (y*dw+x)*4;
			var srcxy = (pointY*sw+pointX)*4;

			if (((srcd.data[srcxy+0] + srcd.data[srcxy+1] + srcd.data[srcxy+2]) / 3) > whiteThreshold) {
				dstd.data[dstxy+0] = 255;
				dstd.data[dstxy+1] = 255;
				dstd.data[dstxy+2] = 255;
				dstd.data[dstxy+3] = 255;
			} else {
				dstd.data[dstxy+0] = srcd.data[srcxy+0];
				dstd.data[dstxy+1] = srcd.data[srcxy+1];
				dstd.data[dstxy+2] = srcd.data[srcxy+2];
				dstd.data[dstxy+3] = srcd.data[srcxy+3];

			}
		}
	}

}


function updatePoints() {

	var overlay = document.getElementById("overlay");
	var ctx = overlay.getContext("2d");
	var s = 15;


	overlay.width = overlay.width;
	ctx.clearRect(0, 0, ctx.width, ctx.height);
	ctx.beginPath();
	ctx.lineWidth=s;
	ctx.moveTo(topLeftX, topLeftY);
	ctx.lineTo(topRightX,topRightY);
	ctx.lineTo(bottomRightX,bottomRightY);
	ctx.lineTo(bottomLeftX,bottomLeftY);
	ctx.lineTo(topLeftX, topLeftY);
	ctx.stroke();
	ctx.closePath();
	ctx.fillStyle="#fff";
	ctx.fillRect(topLeftX-s*3, topLeftY-s*3, s*6, s*6);
	ctx.fillRect(bottomLeftX-s*3, bottomLeftY-s*3, s*6, s*6);
	ctx.fillRect(topRightX-s*3, topRightY-s*3, s*6, s*6);
	ctx.fillRect(bottomRightX-s*3, bottomRightY-s*3, s*6, s*6);

};

function getOrientation(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {

    var view = new DataView(e.target.result);
    if (view.getUint16(0, false) != 0xFFD8) return callback(-2);
    var length = view.byteLength, offset = 2;
    while (offset < length) {
      var marker = view.getUint16(offset, false);
      offset += 2;
      if (marker == 0xFFE1) {
        if (view.getUint32(offset += 2, false) != 0x45786966) return callback(-1);
        var little = view.getUint16(offset += 6, false) == 0x4949;
        offset += view.getUint32(offset + 4, little);
        var tags = view.getUint16(offset, little);
        offset += 2;
        for (var i = 0; i < tags; i++)
          if (view.getUint16(offset + (i * 12), little) == 0x0112)
            return callback(view.getUint16(offset + (i * 12) + 8, little));
      }
      else if ((marker & 0xFF00) != 0xFF00) break;
      else offset += view.getUint16(offset, false);
    }
    return callback(-1);
  };
  reader.readAsArrayBuffer(file);
}

function hover(e) {
	// file drag hover
	e.stopPropagation();
	e.preventDefault();
	e.target.className = (e.type == "dragover" ? "hover" : "");
}

function prepareDownloadImage() {
	var dst = document.getElementById("destcanvas");
	var downloadImage = document.getElementById("download-image");

	if (fileName) {
		downloadImage.href = dst.toDataURL("image/jpeg");
		downloadImage.download = fileName + ".jpg";
	}
}


document.addEventListener("DOMContentLoaded", function() {
	var src = document.getElementById("sourcecanvas");
	var dst = document.getElementById("destcanvas");
	var overlay = document.getElementById("overlay");
	var cc = document.getElementById("canvascontainer");

	worker = new Worker("./imageWorker.js");
    worker.onmessage = finishRender;




	document.getElementById("download-pdf").addEventListener("click", function(e) {
		var imgData = dst.toDataURL("image/jpeg", 1.0);
		var pdf = new jsPDF();
		var margin = 0;

		var width = pdf.internal.pageSize.width - margin*2;
		var height = pdf.internal.pageSize.height - margin*2;

		var pdfRatio = height / width;
		var currentRatio = dst.height / dst.width;

		console.log("page width: " + width);
		console.log("page height: " + height);
		console.log("image width: " + dst.width);
		console.log("image height: " + dst.height);
		console.log("page ratio: " + pdfRatio);
		console.log("image ratio: " + currentRatio);

		if (pdfRatio > currentRatio) {
			pdf.addImage(imgData, 'JPEG', margin, margin, width, width * currentRatio);
		} else {
			pdf.addImage(imgData, 'JPEG', margin + (width - height / currentRatio) / 2, margin, height / currentRatio, height);
		}

		pdf.save(fileName + ".pdf");
	});

	function processFiles(files) {

		if (files.length != 1) {
			alert("Please drag and drop one file");
			return;
		}

		var file = files[0];
		if (file.type.indexOf("image") != 0) {
			alert("Please drop an image");
			return;
		}

		fileName = file.name.substring(0, file.name.lastIndexOf('.'));

		var reader = new FileReader();
		reader.onload = function(e) {
			var img = new Image();
			img.onload = function(e) {
				getOrientation(file, function(orientation) {
					src.width = img.width;
					src.height = img.height;
					var ctx = src.getContext("2d");

					var width = img.width;
					var height = img.height;

					// set proper canvas dimensions before transform & export
					if ([5,6,7,8].indexOf(orientation) > -1) {
					  src.width = height;
					  src.height = width;
					} else {
					  src.width = width;
					  src.height = height;
					}

					// copy dst attributes
					dst.width = src.width;
					dst.height = src.height;
					overlay.width = src.width;
					overlay.height = src.height;

					switch (orientation) {
					  case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
					  case 3: ctx.transform(-1, 0, 0, -1, width, height ); break;
					  case 4: ctx.transform(1, 0, 0, -1, 0, height ); break;
					  case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
					  case 6: ctx.transform(0, 1, -1, 0, height , 0); break;
					  case 7: ctx.transform(0, -1, -1, 0, height , width); break;
					  case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
					  default: ctx.transform(1, 0, 0, 1, 0, 0);
					}
					ctx.drawImage(img, 0, 0);
					ctx.setTransform(1, 0, 0, 1, 0, 0);

					topLeftX = offset;
					topLeftY = offset;
					topRightX = dst.width - offset;
					topRightY = offset;
					bottomLeftX = offset;
					bottomLeftY = dst.height - offset;
					bottomRightX = dst.width - offset;
					bottomRightY = dst.height - offset;

					updatePoints();
					render();

				});
			};
			img.src = e.target.result;

		};
		reader.readAsDataURL(file);

	}

	document.getElementById("upload-file").addEventListener("change", function(e) {
		var files = e.target.files;
		processFiles(files);
	});

	overlay.addEventListener("dragover", hover, false);
	overlay.addEventListener("dragleave", hover, false);

	overlay.addEventListener("drop", function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.target.classList.remove("hover");

		processFiles(e.dataTransfer.files);
	});

	overlay.addEventListener("mousedown", down);
	overlay.addEventListener("touchstart", down);
	overlay.addEventListener("mousemove", move);
	overlay.addEventListener("touchmove", move);
	window.addEventListener("mouseup", up);
	window.addEventListener("touchend", up);
	window.addEventListener("touchcancel", up);

	function down(e) {
		e.preventDefault();
		var pos = getMousePos(src, e);
		var sen = 30;
		if ((pos.x > topLeftX - sen) && (pos.y > topLeftY - sen) && (pos.x < topLeftX + sen) && (pos.y < topLeftY + sen)) {
			dragging = "topleft";
		}
		if ((pos.x > topRightX - sen) && (pos.y > topRightY - sen) && (pos.x < topRightX + sen) && (pos.y < topRightY + sen)) {
			dragging = "topright";
		}
		if ((pos.x > bottomLeftX - sen) && (pos.y > bottomLeftY - sen) && (pos.x < bottomLeftX + sen) && (pos.y < bottomLeftY + sen)) {
			dragging = "bottomleft";
		}
		if ((pos.x > bottomRightX - sen) && (pos.y > bottomRightY - sen) && (pos.x < bottomRightX + sen) && (pos.y < bottomRightY + sen)) {
			dragging = "bottomright";
		}
		updatePoints();
	}

	function move(e) {
		e.preventDefault();

		var pos = getMousePos(src, e);
		var sen = 20;
		if ((pos.x > topLeftX - sen) && (pos.y > topLeftY - sen) && (pos.x < topLeftX + sen) && (pos.y < topLeftY + sen)) {
			overlay.style.cursor = "pointer";
		}
		else if ((pos.x > topRightX - sen) && (pos.y > topRightY - sen) && (pos.x < topRightX + sen) && (pos.y < topRightY + sen)) {
			overlay.style.cursor = "pointer";
		}
		else if ((pos.x > bottomLeftX - sen) && (pos.y > bottomLeftY - sen) && (pos.x < bottomLeftX + sen) && (pos.y < bottomLeftY + sen)) {
			overlay.style.cursor = "pointer";
		}
		else if ((pos.x > bottomRightX - sen) && (pos.y > bottomRightY - sen) && (pos.x < bottomRightX + sen) && (pos.y < bottomRightY + sen)) {
			overlay.style.cursor = "pointer";
		} else {
			overlay.style.cursor = "inherit";
		}



		if (dragging) {
			var pos = getMousePos(src, e);
			if (dragging === "topleft") {
				topLeftX = pos.x;
				topLeftY = pos.y;
			}
			if (dragging === "topright") {
				topRightX = pos.x;
				topRightY = pos.y;
			}
			if (dragging === "bottomleft") {
				bottomLeftX = pos.x;
				bottomLeftY = pos.y;
			}
			if (dragging === "bottomright") {
				bottomRightX = pos.x;
				bottomRightY = pos.y;
			}
			updatePoints();
		}
	}

	function up(e) {
		if (!dragging) {
			return
		}
		e.preventDefault();

		dragging = null;
		updatePoints();
		render();
	}


});