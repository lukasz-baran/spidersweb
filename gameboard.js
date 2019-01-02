
function Gameboard(iksy, igreki) {
	this.gameboard = new Array(iksy.length);
	this.width = iksy.length;
	this.height = igreki.length;
	
	// array that holds information about potential places where it is allowed to draw new dots
	this.candidates = [];
	
	// potential lines - filled only when game is in CHOOSE_LINE mode
	this.lineCandidates = [];
	
	this.initializeDots = function() {
		var initialState = [
			[3,0], [4,0], [5,0], [6,0],
			[3,1], [6,1],
			[3,2], [6,2],
			[0,3], [1,3], [2,3], [3,3], [6,3], [7,3], [8,3], [9,3],
			[0,4], [9,4],
			[0,5], [9,5],
			[0,6], [1,6], [2,6], [3,6], [6,6], [7,6], [8,6], [9,6],
			[3,7], [6,7],
			[3,8], [6,8],
			[3,9], [4,9], [5,9], [6,9]
		];
		var centerX = Math.floor(this.width / 2);
		var centerY = Math.floor(this.height / 2);
		var offsetX = centerX - 5;
		var offsetY = centerY - 5;
		for (var ii in initialState) {
			var point = initialState[ii];
			var xx = point[0] + offsetX;
			var yy = point[1] + offsetY;
			this.gameboard[xx][yy].filled = true;
		}
	}

	this.drawDots = function() {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				if (this.gameboard[x][y].filled) {
					var X = this.gameboard[x][y].position.x;
					var Y = this.gameboard[x][y].position.y;
				
					drawDot(ctx, X, Y, '#000000');
				}
			}
		}
	}
	
	this.getRealCoordinates = function(a, b) {
		if (a instanceof Dot) {
			return this.gameboard[a.x][a.y].position;
		} 
		return this.gameboard[a][b].position;
	}

	this.safeGetFilled = function(x, y) {
		if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
			return this.gameboard[x][y].filled;
		}
		return false;
	}
	
	this.hasAtLeastOneFilledNeighbor = function(x, y) {
		var deltas = [
			[-1, -1], [0, -1], [1, -1], 
			[-1, 0],           [1, 0], 
			[-1, 1],  [0, 1],  [1, 1]
		];
		for (var i in deltas) {
			if (this.safeGetFilled(x + deltas[i][0], y + deltas[i][1])) {
				return true;
			}
		}
		return false;
	}	
	
	this.checkRow = function(row) {
		var index = -1;
		for (var i in row) {
			if (!row[i].available) {
				if (index > -1) {
					return false;
				} else {
					index = i;
				}
			}
		}
		return index > -1; 
	}

	this.findCandidatesInRow = function(array) {
		var indices = [];
		for (var i = 0; i <= array.length - 5; i++) {
			var row = [ array[i], array[i+1], array[i+2], array[i+3], array[i+4] ];
			if (this.checkRow(row)) {
				indices.push(i);
			}
		}
		return indices;
	}	
	
	this.markCandidates = function(points, x, y) {
		var indices = this.findCandidatesInRow(points);
		if (indices.length > 0) {
			var newPoint = new Dot(x, y);
			if (this.candidates.indexOf(newPoint) < 0) {
				this.candidates.push(newPoint);
			}
		}
		return indices;
	}	

	this.collectCandidates = function(x, y, points) {
		var indices = this.markCandidates(points, x, y);
		var result = [];
		if (indices.length > 0) {
			this.setCandidate(x, y);
			
			$.each(indices, function(j, index) {
				var line = $.map([0,1,2,3,4], function(i) {
					return points[index + i].position
				});
				result.push(new Line(line));
			});
		}
		$.merge( this.lineCandidates, result );
	}
	
	/* Checks whether dot can be linked with other dots */
	this.isDotAvailable = function(dot, orientation) {
		if (!this.safeGetFilled(dot.x, dot.y)) {
			return false;
		}
		
		var available = true;
		$.each(lines, function(i, line) {
			if (line.orientation == orientation && line.containsDot(dot)) {
				available = dot.theSame(line.start()) || dot.theSame(line.end());
				return false;
			}
		});
		return available;
	}
	
	this.rebuildCandidates = function() {
		this.candidates = [];
		this.lineCandidates = [];
		for (var y = 0; y < this.height; y++) {

			for (var x = 0; x < this.width; x++) {
				// skip already filled dots:
				if (this.gameboard[x][y].filled) {
					continue;
				}
				
				// has filled neighbors:
				if (!this.hasAtLeastOneFilledNeighbor(x, y)) {
					continue;
				}
				
				var points = [];
				
				// rows: x - 4, x + 4, 
				for (var i = x - 4; i < x + 5; i++) {
					var dot = new Dot(i, y);
					points.push({
						position : dot,
						available : this.isDotAvailable(dot, LineOrientation.HORIZONTAL)
					});
				}
				this.collectCandidates(x, y, points);
				
				// columns: y - 4, y + 4
				points = [];
				for (var i = y - 4; i < y + 5; i++) {
					var dot = new Dot(x, i);
					points.push({
						position : dot,
						available : this.isDotAvailable(dot, LineOrientation.VERTICAL)
					});
				}
				this.collectCandidates(x, y, points);
				
				// diagonals: x - 4,y + 4, x + 4,y - 4
				points = [];
				for (var i = x - 4, j = y + 4; i < x + 5; i++, j--) {
					var dot = new Dot(i, j);
					points.push({
						position : dot,
						available : this.isDotAvailable(dot, LineOrientation.BOTTOM_LEFT_TO_TOP_RIGHT)
					});
				}
				this.collectCandidates(x, y, points);
				
				// diagonals: x - 4,y - 4, x + 4,y + 4
				points = [];
				for (var i = x - 4, j = y - 4; i < x + 5; i++, j++) {
					var dot = new Dot(i, j);
					points.push({
						position : dot,
						available : this.isDotAvailable(dot, LineOrientation.TOP_LEFT_TO_BOTTOM_RIGHT)
					});
				}
				this.collectCandidates(x, y, points);
			}
		}
	}
	
	this.setFilled = function(x, y) {
		this.gameboard[x][y].filled = true;
	}
	
	this.setCandidate = function(x, y) {
		this.gameboard[x][y].isCandidate = true;
	}	
	
	this.isMouseOverDot = function(position, mouseX, mouseY) {
		var realPosition = this.getRealCoordinates(position.x, position.y);
		var deltaX = Math.abs(realPosition.x - mouseX);
		var deltaY = Math.abs(realPosition.y - mouseY);
		if (deltaX < 6 && deltaY < 6) {
			return true;
		}
		return false;
	}
	
	this.isMouseOverPotentialDot = function(mouseX, mouseY) {
		for (var i in this.candidates) {
			if (this.isMouseOverDot(this.candidates[i], mouseX, mouseY))	{
				return this.candidates[i];
			}
		}
		return null;
	}

	///
	///	initialize game board
	/// 
	for (var xx in iksy) {
		var column = new Array(igreki.length);
		for (var yy in igreki) {
			column[yy] = {
				filled : false,
				isCandidate : false,
				position : {
					x : iksy[xx],
					y : igreki[yy]
				}
			};
		}
		this.gameboard[xx] = column;
	}
	this.initializeDots();
	this.drawDots();
}

