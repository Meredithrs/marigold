'use strict';

(function AddRelMouseCoords(){
	function relMouseCoords(event){
	    var totalOffsetX = 0;
	    var totalOffsetY = 0;
	    var canvasX = 0;
	    var canvasY = 0;
	    var currentElement = this;

	    do{
	        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
	        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
	    }
	    while(currentElement = currentElement.offsetParent)

	    canvasX = event.pageX - totalOffsetX;
	    canvasY = event.pageY - totalOffsetY;

	    return {x:canvasX, y:canvasY};
	}

	HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;
})();

function hexagonGame(options){
	var _element;
	var _window = windowHandler();
	var _engine = hexagonGameEngine();
	var _options = {};

	_options.aspect_ratio = options.aspect_ratio || 4/3;

	// Hooks into a canvas element
	function _hookElement(element){
		_element = element;

		// Resize the canvas whenever the window is resized
		window.addEventListener('resize', function(){
			_resizeCanvas(element);
		}, false);

		_resizeCanvas(element);
	}

	// Resizes the canvas, keeping the specified aspect ratio
	function _resizeCanvas(element){
		var window_aspect_ratio = _window.getAspectRatio();
		var window_dimensions = _window.getDimensions();

		if(window_aspect_ratio > _options.aspect_ratio){
			// Window is too wide
			var width = window_dimensions.height * _options.aspect_ratio;
			var height = window_dimensions.height - 8;
			_element.style.marginTop = "2px";
		}else{
			var height = window_dimensions.width / _options.aspect_ratio;
			var width = window_dimensions.width - 8;
			_element.style.marginTop = (window_dimensions.height - height) / 2 + "px";
		}

		_element.height = height;
		_element.width = width;

		var radius = Math.max(height/13/2, width/15/2);

		_engine.drawMap(15, 13, radius, {'x': (_element.width - radius * Math.sqrt(3) * 15.5)/2, 'y': (_element.height - radius * 2 * 13 * .8)/2}, _element);
	}

	return {
		'hookElement': _hookElement
	};
}

function hexagonGameEngine(){
	var sqrt3 = Math.sqrt(3);

	function _drawTile(coords, radius, offset, element){
		var context = element.getContext("2d");
		var xpos, ypos, angle;

		var coords = _even_r_to_hex(coords);
		var q = coords.q;
		var r = coords.r;

		var center = {
			'x': radius * (sqrt3 * (q + r/2)) + offset.x,
			'y': radius * (3/2 * r) + offset.y
		};

		context.lineWidth = 2;
		context.lineJoin = "round";
		context.fillStyle = "#1F3543";
		context.strokeStyle = "#62717b";

		context.beginPath();

		for(var i = 0; i < 6; i++){
			angle = 2 * Math.PI/6 * (i + .5);
			xpos = center.x + radius * Math.cos(angle);
			ypos = center.y + radius * Math.sin(angle);

			if(i === 0){
				context.moveTo(xpos, ypos);
			}else{
				context.lineTo(xpos, ypos);
			}
		}

		context.closePath();
		context.fill();
		context.stroke();
	}

	function _drawMap(height, width, radius, offset, element){
		for(var i = 1; i <= height; i++){
			for(var j = 1; j <= width; j++){
				_drawTile({
					'row': j,
					'col': i
				}, radius, offset, element);
			}
		}
	}

	function _hex_to_cube(hex){
		return {
			'x': hex.q,
			'z': hex.r,
			'y': -hex.q - hex.r
		};
	}

	function _cube_to_hex(cube){
		return {
			'q': cube.x,
			'r': cube.z
		};
	}

	function _cube_to_even_r(cube){
		return {
			'col': cube.x + (cube.z + (cube.z & 1))/2,
			'row': cube.z
		};
	}

	function _even_r_to_cube(even_r){
		return {
			'x': even_r.col - (even_r.row + (even_r.row & 1))/2,
			'z': even_r.row,
			'y': -(even_r.col - (even_r.row + (even_r.row & 1))/2) - even_r.x
		}
	}

	function _hex_to_even_r(hex){
		return _cube_to_even_r(_hex_to_cube(hex));
	}

	function _even_r_to_hex(even_r){
		return _cube_to_hex(_even_r_to_cube(even_r));
	}

	return {
		'drawMap': _drawMap
	};
}

function windowHandler(){
	function _getAspectRatio(){
		return window.innerWidth/window.innerHeight;
	}

	function _getDimensions(){
		return {
			'width': window.innerWidth,
			'height': window.innerHeight
		};
	}

	return {
		'getAspectRatio': _getAspectRatio,
		'getDimensions': _getDimensions
	};
}