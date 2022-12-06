const sin = (deg) => Math.sin((deg * Math.PI) / 180);
const cos = (deg) => Math.cos((deg * Math.PI) / 180);

// function to create an SVG path element in the shape of a hexagon
function hex(sideLength, x0, y0, borderRadius) {

	sideLength = sideLength || 80;
	borderRadius = borderRadius || sideLength / 10;
	x0 = x0 || 0;
	y0 = y0 || 0;

	const x1 = x0 + sideLength * cos(30);
	const y1 = y0 + sideLength * sin(30);

	const xc1 = x1 - borderRadius * cos(30);
	const yc0 = y0 + borderRadius * sin(30);
	const xc2 = x1 + borderRadius * cos(30);

	const x2 = (2 * x1 - x0);
	const y2 = y1 + sideLength;

	const xc3 = x2 - borderRadius * cos(30);
	const yc1 = y1 - borderRadius * sin(30);
	const yc2 = y1 + borderRadius;

	const y3 = y2 + y1 - y0;

	const yc3 = y2 - borderRadius;
	const yc4 = y2 + borderRadius * sin(30);

	const yc5 = y3 - borderRadius * sin(30);
	const xc0 = x0 + borderRadius * cos(30);

	return `
				M ${xc1},${yc0}
				Q ${x1},${y0} ${xc2},${yc0}

				L ${xc3},${yc1}
				Q ${x2},${y1} ${x2},${yc2}

				L ${x2},${yc3}
				Q ${x2},${y2} ${xc3},${yc4}

				L ${xc2},${yc5}
				Q ${x1},${y3} ${xc1},${yc5}
				
				L ${xc0},${yc4}
				Q ${x0},${y2} ${x0},${yc3}
				
				L ${x0},${yc2}
				Q ${x0},${y1} ${xc0},${yc1}
				Z
			`;
};

var prevDataset = [];
var state = {
	paused: false,
	animationIndex: 0,
	isFirst: true,
	prevGx: 0,
	prevGy: 0
}

var imgs = [{
		id: 'lightbulb',
		filter: (r, g, b, a) => r < 200 || g < 200 || b < 200,
	},
	{
		id: 'laptop',
		filter: (r, g, b, a) => r < 200 || g < 200 || b < 200
	}, {
		id: 'network',
		filter: (r, g, b, a) => a > 0,
		randomAlpha: true
	},
	{
		id: 'investigate',
		filter: (r, g, b, a) => !(r === 0 && g === 0 && b === 0),
		randomAlpha: true
	},
	{
		id: 'database',
		filter: (r, g, b, a) => !(r === 0 && g === 0 && b === 0),
		randomAlpha: true
	}, {
		id: 'table',
		filter: (r, g, b, a) => !(r === 0 && g === 0 && b === 0),
		randomAlpha: true
	}, {
		id: 'query_stats',
		filter: (r, g, b, a) => !(r === 0 && g === 0 && b === 0),
		randomAlpha: true
	}, {
		id: 'monitoring',
		filter: (r, g, b, a) => !(r === 0 && g === 0 && b === 0),
		randomAlpha: true
	}, {
		id: 'bars',
		filter: (r, g, b, a) => !(r === 0 && g === 0 && b === 0),
		randomAlpha: true
	}, {
		id: 'donut',
		filter: (r, g, b, a) => !(r === 0 && g === 0 && b === 0),
		randomAlpha: true
	}
]

function randomFloat(min, max) {
	return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
	return (Math.floor(Math.random() * (max - min) + min));
}

function animate() {

	// pop image and initialize dimensions
	var imgInfo = imgs[state.animationIndex];
	var img = document.getElementById(imgInfo.id),
		condition = imgInfo.filter;

	var imgWidth = img.width,
		imgHeight = img.height;

	var svg = d3.select('svg#pixelated'),
		width = 1000,
		height = 600,
		size = 5,
		hexWidth = 2 * size * cos(30),
		hexHeight = 2 * sin(30) * (size + 1),
		margin = 1,
		numHexsRow = imgWidth,
		numHexsCol = imgHeight;

	var numCols = numHexsCol;
	var numRows = numHexsRow;

	var canvas = document.createElement("canvas");

	canvas.width = numHexsRow;
	canvas.height = numHexsCol;

	var ctx0 = canvas.getContext("2d", {
		willReadFrequently: true
	});
	ctx0.drawImage(img, 0, 0, imgWidth, imgHeight);

	var data = ctx0.getImageData(0, 0, imgWidth, imgHeight).data;

	var dataset = [];

	var scale = d3.scaleLinear().domain([0, 255 * 3]).range([0, 1]);

	// create "dataset" - similar to a very crude edge detection
	for (var i = 0; i < data.length; i += 4) {
		var r = data[i],
			g = data[i + 1],
			b = data[i + 2],
			a = data[i + 3];

		var rowIndex = Math.floor(i / 4 / numRows),
			colIndex = i / 4 % numRows;

		var getX = (col) => col * hexWidth + margin * col,
			getY = (row) => row * hexHeight + margin * row + size * row * cos(30) / 2;

		// Keep pixels that meet a predetermined criteria 
		if (condition(r, g, b, a)) {

			a = scale(r + g + b);

			// add random highlighted pixels -> looks 'fancier'
			if (imgInfo.randomAlpha) {
				if (randomInt(0, 2) === 1)
					a = Math.max(0.2, a + randomFloat(-0.1, 0.5));
			}

			var datapoint = {
				row: colIndex,
				col: rowIndex,
				x: getX(colIndex),
				y: getY(rowIndex),
				color: `rgba(${r}, ${g}, ${b}, ${a})`,
				a: a
			};
			// ensures honeycomb effect
			if (rowIndex % 2 > 0)
				datapoint.x += (hexWidth + margin) / 2;

			dataset.push(datapoint)

		}
	}
	var g = svg.select('g');
	if (g.size() === 0)
		g = svg.append('g');

	var series = g.selectAll('.pixel').data(dataset);

	var randoms = d3.range(0, dataset.length).map(i => randomInt(0, 300))

	// make sure imgs are centered
	var maxX = d3.max(dataset, d => d.x),
		minX = d3.min(dataset, d => d.x),
		maxY = d3.max(dataset, d => d.y),
		minY = d3.min(dataset, d => d.y),
		horizSize = maxX - minX,
		vertSize = maxY - minY,
		gx = (width - horizSize) / 2 - minX,
		gy = (height - vertSize) / 2 - minY;

	// if the next animation has less pixels, we need to kill some
	// move pixels to a position that already exists and fade out
	series
		.exit()
		.transition('PixelExit')
		.duration(1000)
		.delay(function(d, i) {
			this.__rand = randomInt(0, dataset.length);
			return d.y * d.x / 500 + randoms[this.__rand];
		})
		.attr('opacity', 0)
		.attr('d', function(d, i) {
			var nextPoint = dataset[this.__rand];
			d3.select(this).attr('fill', `rgba(255, 110, 199, ${nextPoint.a})`)
			return hex(size, nextPoint.x, nextPoint.y)
		})
		.remove()

	var seriesEntered = series
		.enter()
		.append('path')
		.attr('class', 'pixel')

	// initial starting point for first animation - pixels start randomly at the bottom and fly upwards
	if (state.isFirst)
		seriesEntered
		.attr('d', (d, i) => hex(2, getX(randomInt(numCols / 2 - numCols / 8, numCols / 2 + numCols / 8)), getY(numRows)));

	// if next animation has more pixels we need to add some
	// move pixels to a position that already exists and fade in
	else
		seriesEntered
		.attr('transform', `translate(${state.prevGx}, ${state.prevGy})`)
		.attr('d', function(d, i) {
			var prevPoint = prevDataset[randomInt(0, prevDataset.length)];
			d3.select(this).attr('fill', `rgba(255, 110, 199, ${prevPoint.a})`)
			return hex(size, prevPoint.x, prevPoint.y)
		})

	// for pause / resume functionality
	prevDataset = dataset;
	state.isFirst = false;
	state.animationIndex++;
	state.prevGx = gx;
	state.prevGy = gy;

	if (state.animationIndex === imgs.length)
		state.animationIndex = 0;

	// main transition to fill animation
	return seriesEntered.merge(series)
		.transition('PixelMorph')
		.duration(1000)
		.attr('opacity', 1)
		.delay((d, i) => d.y * d.x / 500 + randoms[i])
		.attr('d', (d, i) => hex(size, d.x, d.y))
		.attr('fill', (d, i) => `rgba(255, 110, 199, ${d.a})`)
		.attr('transform', `translate(${gx}, ${gy})`)
		.on('end', function(d, i, elems) {
			if (i === elems.length - 1) {
				if (!state.paused)
					state.nextCall = d3.timeout(animate, 2000);
			}
		})
}

function pause() {

	state.paused = true;

	// kill transitions
	d3.select('svg#pixelated')
		.selectAll('path.pixel')
		.interrupt('PixelExit')
		.interrupt('PixelMorph')

	if (state.nextCall)
		state.nextCall.stop();
}

function resume() {

	// simply start at next animation in queue
	var alreadyPlaying = !state.paused;
	if (!alreadyPlaying || state.isFirst) {
		state.paused = false;
		animate();
	}
}
// only present if not responsive i.e. stand alone
document.addEventListener("DOMContentLoaded", resume)