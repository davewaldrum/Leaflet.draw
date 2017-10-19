L.Edit = L.Edit || {};
/**
 * @class L.Edit.Circle
 * @aka Edit.Circle
 * @inherits L.Edit.CircleMarker
 */
L.Edit.Circle = L.Edit.CircleMarker.extend({
	options: {
		moveIcon: new L.DivIcon({
			iconSize: new L.Point(16, 16),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move leaflet-circle-center'
		}),
	},

	_createResizeMarker: function () {
		var center = this._shape.getLatLng(),
			resizemarkerPoint = this._getResizeMarkerPoint(center);

		this._resizeMarkers = [];
		this._resizeMarkers.push(this._createMarker(resizemarkerPoint, this.options.resizeIcon));
	},

	_getResizeMarkerPoint: function (latlng) {
		// From L.shape.getBounds()
		var delta = this._shape._radius * Math.cos(Math.PI / 4),
			point = this._map.project(latlng);
		return this._map.unproject([point.x + delta, point.y - delta]);
	},

	_getTooltipText: function () {
		if (this._drawOptions.snapRadiusOnCtrl) {
			return "Hold CTRL to snap. " + L.drawLocal.edit.handlers.edit.tooltip.text;
		} else {
			return L.drawLocal.edit.handlers.edit.tooltip.text;
		}
	},

	_resize: function (latlng, e) {
		var moveLatLng = this._moveMarker.getLatLng();

		// Calculate the radius based on the version
		if(L.GeometryUtil.isVersion07x()){
			radius = moveLatLng.distanceTo(latlng);
		} else {
			radius = this._map.distance(moveLatLng, latlng);
		}

		var ctrlKey = e.originalEvent.ctrlKey;

		if (this._drawOptions && this._drawOptions.snapRadiusOnCtrl && ctrlKey) {
			var oldradius = radius;
			var radius = this._snapRadius(radius);
		}

		radius = this._enforceSize(radius);

		this._shape.setRadius(radius);

		this._positionResizeMarker(moveLatLng);

		console.log('resize');
		
		this._tooltip.updateContent({
			text: this._getTooltipText(),
			subtext: L.drawLocal.draw.handlers.circle.radius + ': ' +
				L.GeometryUtil.readableDistance(radius, true, this.options.feet, this.options.nautic)
		});

		this._map.fire(L.Draw.Event.EDITRESIZE, { layer: this._shape });
	},

	_enforceSize: function(radius) {
		if (this._drawOptions.minRadius != 0 && radius < this._drawOptions.minRadius) {
			radius = this._drawOptions.minRadius;
		}

		if (this._drawOptions.maxRadius != 0 && radius > this._drawOptions.maxRadius) {
			radius = this._drawOptions.maxRadius;
		}

		return radius;
	},

	_incrementForZoom: function (zoom) {
		if (this._drawOptions.radiusIncrements[zoom]) {
			return this._drawOptions.radiusIncrements[zoom];
		} else {
			return 10;
		}
	},

	_snapRadius: function (radius) {
		var increment = this._incrementForZoom(this._map._zoom);
		return Math.round(radius / increment) * increment;
	}
});

L.Circle.addInitHook(function () {
	if (L.Edit.Circle) {
		this.editing = new L.Edit.Circle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
});
