/**
 * @class L.Draw.Circle
 * @aka Draw.Circle
 * @inherits L.Draw.SimpleShape
 */
L.Draw.Circle = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'circle'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#3388ff',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		showRadius: true,
		metric: true, // Whether to use the metric measurement system or imperial
		feet: true, // When not metric, use feet instead of yards for display
		nautic: false, // When not metric, not feet use nautic mile for display
		minRadius: 0, // When set, minimum radius allowed
		maxRadius: 0, // When set, maximum radius allowed
		snapRadiusOnCtrl: false, // Whether to snap radius to increments when holding ctrl
		radiusIncrements: {
			18: 10,
			17: 10,
			16: 25,
			15: 25,
			14: 50,
			13: 100,
			12: 100,
			11: 100,
			10: 100,
			9: 100,
			8: 100,
			7: 100,
			6: 100,
			5: 100,
			4: 100,
			3: 100,
			2: 100,
		}
	},

	// @method initialize(): void
	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Circle.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.circle.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
		// Calculate the distance based on the version
		if(L.GeometryUtil.isVersion07x()){
			var distance = this._startLatLng.distanceTo(latlng);
		} else {
			var distance = this._map.distance(this._startLatLng, latlng);
		}

		if (!this._shape && distance > 0) {
			console.log("No shape, distance is", distance);
			this._shape = new L.Circle(this._startLatLng, distance, this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else if (this._shape) {
			this._shape.setRadius(distance);
		}
	},

	_fireCreatedEvent: function () {
		if (this._shape.getRadius() == 0) {
			console.log("Trying to create an empty circle");
			this._map.removeLayer(this._shape);
			delete this._shape;
			return;
		}

		var circle = new L.Circle(this._startLatLng, this._shape.getRadius(), this.options.shapeOptions);
		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, circle);
	},


	_getTooltipText: function () {
		if (this.options.snapRadiusOnCtrl) {
			return "Hold CTRL to snap. " + this._endLabelText;
		} else {
			return this._endLabelText;
		}
	},


	_onMouseMove: function (e) {
		var latlng = e.latlng,
			showRadius = this.options.showRadius,
			useMetric = this.options.metric,
			radius;

		var ctrlKey = e.originalEvent.ctrlKey;

		this._tooltip.updatePosition(latlng);
		if (this._isDrawing) {
			this._drawShape(latlng);

			if (!this._shape) return;

			// Get the new radius (rounded to 1 dp)
			radius = this._shape.getRadius().toFixed(1);

			if (this.options.snapRadiusOnCtrl && ctrlKey) {
				var oldradius = radius;
				var radius = this._snapRadius(radius);
				console.log(oldradius, ctrlKey, radius);

				this._shape.setRadius(radius);
			}

			var subtext = '';
			if (showRadius) {
				subtext = L.drawLocal.draw.handlers.circle.radius + ': ' +
						  L.GeometryUtil.readableDistance(radius, useMetric, this.options.feet, this.options.nautic);
			}
			this._tooltip.updateContent({
				text: this._getTooltipText(),
				subtext: subtext
			});
		}
	},

	_incrementForZoom: function (zoom) {
		if (this.options.radiusIncrements[zoom]) {
			return this.options.radiusIncrements[zoom];
		} else {
			return 10;
		}
	},

	_snapRadius: function (radius) {
		var increment = this._incrementForZoom(this._map._zoom);
		return Math.round(radius / increment) * increment;
	}
});
