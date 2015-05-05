'use strict';

var canvas = document.getElementsByTagName("canvas")[0];

var marigold = Marigold();
marigold.hookCanvas(canvas);


for(var row = 0; row < marigold.options.height; row++){
	for(var column = 0; column < marigold.options.width; column++){
		marigold.map.getTile(marigold.coordinates(row, column)).setWeight(5);
	}
}


var range = {}, hoverRange = {};

marigold.click(function(tile, keys){
	if(range.fill){
		range.fill();
		range = {};
	}

	if(keys.indexOf(17) > -1){
		range = marigold.map.getAreaWithin(tile, 2);

		range.fill("#2a1316");
	}
	marigold.selectTile(tile);
});

marigold.hover(function(tile, keys){
	if(hoverRange.fill){
		hoverRange.fill();
	}

	hoverRange = marigold.map.getAreaWithin(tile, 0);
	hoverRange.fill("#3c1b1f");

	if(range.fill){
		range.fill("#2a1316");
	}
});