self.addEventListener('message', function(e) {
	
	processImage(
		e.data.srcd, 
		e.data.dstd, 
		e.data.sw, 
		e.data.dw, 
		e.data.dh, 
		e.data.whiteThreshold,
		e.data.topLeftX, 
		e.data.topLeftY, 
		e.data.bottomLeftX, 
		e.data.bottomLeftY, 
		e.data.topRightX, 
		e.data.topRightY, 
		e.data.bottomRightX, 
		e.data.bottomRightY
		);
	self.postMessage({ dstd: e.data.dstd});
});

function processImage(srcd, dstd, sw, dw, dh, whiteThreshold, topLeftX, topLeftY, bottomLeftX, bottomLeftY, topRightX, topRightY, bottomRightX, bottomRightY) {
	var bottomLength = Math.sqrt(Math.pow(bottomLeftX - bottomRightX, 2) + Math.pow(bottomLeftY - bottomRightY, 2));
	var topLength = Math.sqrt(Math.pow(topLeftX - topRightX, 2) + Math.pow(topLeftY - topRightY, 2));

	// create a number between -1 and 1 that tells how skewed the picture is
	var skewRatio = Math.pow(Math.cos(Math.atan(bottomLength / topLength)), 2) - 0.5;

	for (var y = 0; y < dh; y++) {
		var z = dh + (y - dh) * skewRatio;

		var dy = y/z;

		var startX = topLeftX + dy*(bottomLeftX-topLeftX);
		var startY = topLeftY + dy*(bottomLeftY-topLeftY);

		var endX = topRightX + dy*(bottomRightX-topRightX);
		var endY = topRightY + dy*(bottomRightY-topRightY);

		for (var x = 0; x < dw; x++) {
			var dx = x / dw;

			var pointX = startX + dx*(endX-startX);
			var pointY = startY + dx*(endY-startY);

			var offsetX = pointX % 1;
			var offsetY = pointY % 1;

			var baseX = Math.floor(pointX);
			var baseY = Math.floor(pointY);

			var dstxy = (y*dw+x)*4;
			var srctl = (baseY*sw+baseX)*4;
			var srctr = (baseY*sw+(baseX+1))*4;
			var srcbl = ((baseY+1)*sw+baseX)*4;
			var srcbr = ((baseY+1)*sw+(baseX+1))*4;

			var sum = (srcd.data[srctl+0] + srcd.data[srctl+1] + srcd.data[srctl+2]) +
					(srcd.data[srctr+0] + srcd.data[srctr+1] + srcd.data[srctr+2]) +
					(srcd.data[srcbr+0] + srcd.data[srcbl+1] + srcd.data[srcbl+2]) +
					(srcd.data[srcbr+0] + srcd.data[srcbr+1] + srcd.data[srcbr+2]);

			if ((sum / 12) > whiteThreshold) {
				dstd.data[dstxy+0] = 255;
				dstd.data[dstxy+1] = 255;
				dstd.data[dstxy+2] = 255;
				dstd.data[dstxy+3] = 255;
			} else {
				for (var i = 0; i < 4; i++) {
					if (baseX+baseY < 1) {
						dstd.data[dstxy+i] = ((srcd.data[srctl+i] * (1-offsetX) + srcd.data[srctr+i] * offsetX) +
							(srcd.data[srctl+i] * (1-offsetY) + srcd.data[srcbl+i] * offsetY)) / 2;

					} else {
						dstd.data[dstxy+i] = ((srcd.data[srcbl+i] * (1-offsetX) + srcd.data[srcbr+i] * offsetX) +
							(srcd.data[srctr+i] * (1-offsetY) + srcd.data[srcbr+i] * offsetY)) / 2;

					}

				}

			}
		}
	}


}

