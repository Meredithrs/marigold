'use strict';

/*
	Known bugs:
		Offsets not calculated correctly at different sizes
*/

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

window.requestAnimationFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var Marigold = function Marigold(){

	/*
		Contains methods for manipulating the game
		* options: Contains options
			* aspect_ratio
			* width (in tiles)
			* height (in tiles)
			* tile_color
			* outline_color
		* hookCanvas(element): Tells the engine which element to render the game on
	*/
	function game(){
		var _canvas;
		var _radius, _offset;
		var sqrt3 = Math.sqrt(3); // Might as well cache this
		var _pressedKeys = [];

		var _click, _hover, _double_click;

		var _special_tiles = {
			selected: {
				'column': null,
				'row': null
			}
		};

		var options = {
			'aspect_ratio': 4/3,
			'width': 15,
			'height': 13,
			'tile_color': "#1F3543",
			'outline_color': "#62717b"
		};

		var _map = _Map(options);

		var map = {
			'clear': _map.clear,
			'getTile': _map.getTile,
			'getTileByMousePosition': _map.getTileByMousePosition,
			'getOffset': _map.getOffset,
			'getAreaWithin': _map.getAreaWithin,
			'getDistance': _map.getDistance
		};

		window.addEventListener("keydown", function(event){
			_pressedKeys[event.keyCode] = true;
		});

		window.addEventListener("keyup", function(event){
			_pressedKeys[event.keyCode] = false;
		});

		function _getPressedKeys(){
			var result = [];

			_pressedKeys.forEach(function(element, index, array){
				if(element){
					result.push(index);
				}
			});

			return result;
		}

		function selectTile(tile){
			if(!tile){
				_special_tiles.selected = {
					'column': null,
					'row': null
				};
			}else{
				_special_tiles.selected = {
					'column': tile.getPosition().toGrid().column,
					'row': tile.getPosition().toGrid().row
				};
			}
		}

		function click(callback){
			_canvas.removeEventListener("click", _click, false);

			_click = function(event){
				var coords = _canvas.relMouseCoords(event);
				var tile = _map.getTileByMousePosition(coords.x, coords.y, _radius);

				callback(tile, _getPressedKeys());
			};

			_canvas.addEventListener("click", _click, false);
		}

		function hover(callback){
			_canvas.removeEventListener("mousemove", _hover, false);

			_hover = function(event){
				var coords = _canvas.relMouseCoords(event);
				var tile = _map.getTileByMousePosition(coords.x, coords.y, _radius);

				callback(tile, _getPressedKeys());
			};

			_canvas.addEventListener("mousemove", _hover, false);
		}

		function double_click(callback){
			_canvas.removeEventListener("dblclick", _double_click, false);

			_double_click = function(event){
				var coords = _canvas.relMouseCoords(event);
				var tile = _map.getTileByMousePosition(coords.x, coords.y, _radius);

				callback(tile, _getPressedKeys());
			};

			_canvas.addEventListener("dblclick", _double_click, false);
		}


		function hookCanvas(element){
			_canvas = element;

			// Resize the canvas whenever the window resizes
			window.addEventListener('resize', _resizeCanvas, false);

			// Trigger the initial sizing of the canvas
			_resizeCanvas();
		}

		function _resizeCanvas(){
			// We need to know the aspect ratio of the window
			var aspect_ratio = window.innerWidth / window.innerHeight;

			// The size of the window might change during this process, so grab a static copy
			var window_width = window.innerWidth;
			var window_height = window.innerHeight;

			if(aspect_ratio > options.aspect_ratio){
				// Window is too wide
				var width = window_height * options.aspect_ratio;
				var height = window_height - 8;
				_canvas.style.marginTop = "2px";
			}else{
				// Window is too tall
				var height = window_width / options.aspect_ratio;
				var width = window_width;
				_canvas.style.marginTop = (window_height - height)/2 + "px";
			}

			// Apply the new dimensions
			_canvas.height = height;
			_canvas.width = width;

			// Calculate the new offsets (which center the tiles on the map)
			_radius = Math.max(height/options.height/2, width/options.width/2);

			_map.setOffset(
				(width - _radius * sqrt3 * (options.width + .5)),
				(height - _radius * 2 * options.height * .8)
			);

			_offset = _map.getOffset();

			_drawMap();
		}

		function _drawTile(position, radius, fill, stroke){
			var context = _canvas.getContext("2d");

			var xpos, ypos, angle;

			var coords = position.toAxial();
			var q = coords.q;
			var r = coords.r;

			// Calculate the center of the tile
			var center = {
				'x': radius * (sqrt3 * (q + r/2)) + _offset.x,
				'y': radius * (3/2 * r) + _offset.y
			};

			context.lineWidth = 2;
			context.lineJoin = "round";
			context.fillStyle = fill;
			context.strokeStyle = stroke;

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

		function _drawMap(){
			var stroke, fill;

			for(var column = 0; column < options.width; column++){
				for(var row = 0; row < options.height; row++){
					var current_point = _map.getTile(_coordinates(row, column));

					stroke = "#62717b";
					fill = current_point.getFill() || "#1F3543";

					_drawTile(current_point.getPosition(), _radius, fill, stroke);
				}
			}

			// Draw selected tile
			if(_special_tiles.selected.row !== null && _special_tiles.selected.column !== null){
				_drawTile(_coordinates(_special_tiles.selected.row, _special_tiles.selected.column), _radius, "#2f5166", "#b5ab5e");
			}

			window.requestAnimationFrame(_drawMap);
		}

		window.requestAnimationFrame(_drawMap);

		return {
			'options': options,
			'hookCanvas': hookCanvas,
			'map': map,
			'coordinates': _coordinates,
			'click': click,
			'hover': hover,
			'double_click': double_click,
			'selectTile': selectTile
		};
	}

	function _Map(options){
		var _offset = {};
		var _mapdata = [];
		var sqrt3 = Math.sqrt(3);

		for(var column = 0; column < options.width; column++){
			if(!_mapdata[column]){
				_mapdata[column] = [];
			}

			for(var row = 0; row < options.height; row++){
				_mapdata[column][row] = null;
			}
		}

		// Clears all tile data
		function clear(){
			for(var column = 0; column < options.width; column++){
				for(var row = 0; row < options.height; row++){
					_mapdata[column][row] = null;
				}
			}
		}

		function getPathBetween(a, b, isFlying){

		}

		function getAreaWithin(tile, range){
			var results = _path();
			var cube = tile.getPosition().toCube();

			for(var dx = -range; dx <= range; dx++){
				for(var dy = Math.max(-range, -dx - range); dy <= Math.min(range, -dx + range); dy++){
					var dz = -dx - dy;

					var h = _cubeToHex(dx + cube.x, dy + cube.y, dz + cube.z);
					var g = _hexToGrid(h.q, h.r);

					try{
						results.insert(getTile(_coordinates(g.row, g.column)));
					}catch(e){

					}
				}
			}

			return results;
		}

		function getDistance(a, b){

		}

		function getNeighbors(tile){
			return getAreaWithin(tile, 1);
		}

		function isInFieldOfView(a, b, isFlying, range){

		}

		function getTile(point){
			if(_mapdata[point.toGrid().column] === undefined){
				throw "Tile is out of bounds";
			}else if(_mapdata[point.toGrid().column][point.toGrid().row] === undefined){
				throw "Tile is out of bounds";
			}else if(_mapdata[point.toGrid().column][point.toGrid().row] === null){
				var tile = _tile(point, 1);
				_mapdata[point.toGrid().column][point.toGrid().row] = tile;
				return tile;
			}else{
				return _mapdata[point.toGrid().column][point.toGrid().row];
			}
		}

		function getTileByMousePosition(x, y, radius){
			x -= _offset.x;
			y -= _offset.y;

			var q = (x * sqrt3/3 - y/3)/radius;
			var r = y * 2/3 / radius;

			var h = _hexRound(q, r);
			var g =  _hexToGrid(h.q, h.r);

			return getTile(_coordinates(g.row, g.column));
		}

		function _hexRound(q, r){
			var c = _hexToCube(q, r);
			var rc = _cubeRound(c.x, c.y, c.z);
			return _cubeToHex(rc.x, rc.y, rc.z);
		}

		function _cubeRound(x, y, z){
			var rx = Math.round(x);
			var ry = Math.round(y);
			var rz = Math.round(z);

			var x_diff = Math.abs(rx - x);
			var y_diff = Math.abs(ry - y);
			var z_diff = Math.abs(rz - z);

			if(x_diff > y_diff && x_diff > z_diff){
				rx = -ry - rz;
			}else if(y_diff > z_diff){
				ry = -rx - rz;
			}else{
				rz = -rx - ry;
			}

			return {
				'x': rx,
				'y': ry,
				'z': rz
			};
		}

		function _hexToCube(q, r){
			return {
				'x': q,
				'y': -q - r,
				'z': r
			};
		}

		function _cubeToHex(x, y, z){
			return {
				'q': x,
				'r': z
			};
		}

		function _hexToGrid(q, r){
			var c = _hexToCube(q, r);

			return {
				'column': c.x + (c.z + (c.z & 1)) / 2,
				'row': c.z
			};
		}

		function setOffset(x, y){
			_offset.x = x;
			_offset.y = y;
		}

		function getOffset(){
			return {
				'x': _offset.x,
				'y': _offset.y
			};
		}

		return {
			'clear': clear,
			'getPathBetween': getPathBetween,
			'getAreaWithin': getAreaWithin,
			'getNeighbors': getNeighbors,
			'isInFieldOfView': isInFieldOfView,
			'getDistance': getDistance,
			'getTile': getTile,
			'getTileByMousePosition': getTileByMousePosition,
			'setOffset': setOffset,
			'getOffset': getOffset
		};
	}

	function _coordinates(row, column){
		var _row = row, _column = column;

		function toCube(){
			return {
				'x': _column - (_row + (_row & 1))/2,
				'z': _row,
				'y': -(_column - (_row + (_row & 1))/2) - _column
			}
		}

		function toGrid(){
			return {
				'column': _column,
				'row': _row
			}
		}

		function toAxial(){
			var cube = toCube();

			return {
				'q': cube.x,
				'r': cube.z
			};
		}

		function isEvenRow(){
			return !(_row % 2);
		}

		function isOddRow(){
			return !!(_row % 2);
		}

		return {
			'toCube': toCube,
			'toGrid': toGrid,
			'toAxial': toAxial,
			'isEvenRow': isEvenRow,
			'isOddRow': isOddRow
		};
	}

	function _path(){
		var _innerArray = [];

		function insert(tile){
			_innerArray.push(tile);
		}

		function get(){
			return _innerArray.slice(0);
		}

		function fill(color){
			_innerArray.forEach(function(element){
				element.setFill(color);
			})
		}

		function weight(w){
			_innerArray.forEach(function(element){
				element.setWeight(w);
			})
		}

		return {
			'insert': insert,
			'get': get,
			'fill': fill,
			'weight': weight
		};
	}

	/*
		Tiles are weighted based on their difficulty to traverse.
			* Weight = 1: Easy to traverse (paths, roads)
			* Weight = 2: Slightly less easy to traverse (grass, rocks)
			* Weight = 4: Slower to traverse (sand)
			* Weight = 8: Slow to traverse (mud, shallow water)
			* Weight = 900-949: Low walls that can be jumped over
			* Weight = 950-999: Higher walls and cliffs that can only be flown over
			* Weight = 1000: Anything that can't be flown over
	*/
	function _tile(position, weight){
		var _position, _weight, _hasCharacter, _hasObstacle, _hasItem, _attachedCharacter, _attachedItem, _attachedObstacle, _fill;

		_position = position;
		_weight = weight;

		function getPosition(){
			return _coordinates(_position.toGrid().row, _position.toGrid().column);
		}

		function walkable(){
			return _weight <= 900;
		}

		function jumpable(){
			return _weight <= 950;
		}

		function flyable(){
			return _weight < 1000;
		}

		function hasCharacter(){
			return _hasCharacter;
		}

		function getWeight(){
			return _weight;
		}

		function setWeight(weight){
			_weight = weight;
			return this;
		}

		function hasItem(){
			return _hasItem;
		}

		function hasObstacle(){
			return _hasObstacle;
		}

		function attachItem(item){
			if(!hasCharacter() && !hasItem() && !hasObstacle()){
				_attachedItem = item;
				_hasItem = true;
			}

			return this;
		}

		function attachCharacter(character){
			if(hasObstacle() || hasCharacter()){
				throw "Something is already here";
			}

			if(hasItem()){
				character.rewardItem(_attachedItem);
				removeItem();
				_attachedCharacter = character;
				_hasCharacter = true;
			}

			return this;
		}

		function attachObstacle(obstacle){
			if(!hasCharacter() && !hasItem() && !hasObstacle()){
				_attachedObstacle = obstacle;
				_hasObstacle = true;
			}

			return this;
		}

		function removeItem(){
			_hasItem = false;

			return this;
		}

		function removeCharacter(){
			_hasCharacter = false;
			
			return this;
		}

		function removeObstacle(){
			_hasObstacle = false;
			
			return this;
		}

		function getItem(){
			if(hasItem()){
				return _attachedItem;
			}else{
				throw "No items are attached to this tile";
			}
		}

		function getCharacter(){
			if(hasCharacter()){
				return _attachedCharacter;
			}else{
				throw "No characters are attached to this tile";
			}
		}

		function getObstacle(){
			if(hasObstacle()){
				return _attachedObstacle;
			}else{
				throw "No obstacles are attached to this tile";
			}

		}

		function getFill(){
			return _fill;
		}

		function setFill(fill){
			_fill = fill;

			return this;
		}

		return {
			'getPosition': getPosition,
			'walkable': walkable,
			'jumpable': jumpable,
			'flyable': flyable,
			'hasCharacter': hasCharacter,
			'getWeight': getWeight,
			'setWeight': setWeight,
			'hasItem': hasItem,
			'hasObstacle': hasObstacle,
			'attachItem': attachItem,
			'attachCharacter': attachCharacter,
			'attachObstacle': attachObstacle,
			'removeItem': removeItem,
			'removeCharacter': removeCharacter,
			'removeObstacle': removeObstacle,
			'getItem': getItem,
			'getCharacter': getCharacter,
			'getObstacle': getObstacle,
			'getFill': getFill,
			'setFill': setFill
		};
	}

	return game();
}