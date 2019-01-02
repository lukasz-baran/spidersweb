///
///	Basic primitives in game
///

/* Describes a dot on a gameboard */
function Dot(x, y) {
	this.x = x;
	this.y = y;
	
	this.theSame = function(otherDot) {
		return this.x === otherDot.x && this.y === otherDot.y;
	}
}

var LineOrientation = {
	HORIZONTAL : 1,
	VERTICAL : 2,
	BOTTOM_LEFT_TO_TOP_RIGHT : 3,
	TOP_LEFT_TO_BOTTOM_RIGHT : 4
};

/* Lines are made from Dots */
function Line(a, b, c, d, e) {
	this.line = Array.isArray(a) ? a : [a, b, c, d, e];
	
	// diagonal type:
	this.orientation = null;
	
	if (this.line[0].x == this.line[1].x) {
		this.orientation = LineOrientation.VERTICAL;
	} else if (this.line[0].y == this.line[1].y) {
		this.orientation = LineOrientation.HORIZONTAL;
	} else if (this.line[0].y > this.line[1].y) {
		this.orientation = LineOrientation.BOTTOM_LEFT_TO_TOP_RIGHT;
	} else {
		this.orientation = LineOrientation.TOP_LEFT_TO_BOTTOM_RIGHT;
	}
	
	this.start = function() { return this.line[0];};
	this.end = function() { return this.line[4]; }
	
	this.containsDot = function(dot) {
		for (var i in this.line) {
			if (this.line[i].theSame(dot)) {
				return true;
			}
		}
		return false;
	}
}
