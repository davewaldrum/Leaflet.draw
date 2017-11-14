L.Edit = L.Edit || {};
/**
 * @class L.Edit.Rectangle
 * @aka Edit.Rectangle
 * @inherits L.Edit.SimpleShape
 */
L.Edit.Rectangle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var bounds = this._shape.getBounds(),
			center = bounds.getCenter();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var corners = this._getCorners();

		this._resizeMarkers = [];

		for (var i = 0, l = corners.length; i < l; i++) {
			this._resizeMarkers.push(this._createMarker(corners[i], this.options.resizeIcon));
			// Monkey in the corner index as we will need to know this for dragging
			this._resizeMarkers[i]._cornerIndex = i;
		}
	},

	_onMarkerDragStart: function (e) {
		L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);

		// Save a reference to the opposite point
		var corners = this._getCorners(),
			marker = e.target,
			currentCornerIndex = marker._cornerIndex,
			bounds = this._shape.getBounds();

		var rectangleWidth = Math.abs(this._map.latLngToLayerPoint(bounds.getNorthEast()).x - this._map.latLngToLayerPoint(bounds.getSouthWest()).x);
  		var rectangleHeight = Math.abs(this._map.latLngToLayerPoint(bounds.getNorthEast()).y - this._map.latLngToLayerPoint(bounds.getSouthWest()).y);

		this._centerPoint = bounds.getCenter();
		this._aspectRatio = rectangleWidth / rectangleHeight;
		this._oppositeCorner = corners[(currentCornerIndex + 2) % 4];
		this._initialDist = this._centerPoint.distanceTo(marker._latlng);
		this._cornerIndex = currentCornerIndex;

		this._mouseStartPosition = null;

		this._toggleCornerMarkers(0, currentCornerIndex);
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target,
			bounds, center;

		// Reset move marker position to the center
		if (marker === this._moveMarker) {
			bounds = this._shape.getBounds();
			center = bounds.getCenter();

			marker.setLatLng(center);
		}

		this._toggleCornerMarkers(1);

		this._repositionCornerMarkers();

		L.Edit.SimpleShape.prototype._onMarkerDragEnd.call(this, e);
	},

	_move: function (newCenter) {
		var latlngs = this._shape._defaultShape ? this._shape._defaultShape() : this._shape.getLatLngs(),
			bounds = this._shape.getBounds(),
			center = bounds.getCenter(),
			offset, newLatLngs = [];

		// Offset the latlngs to the new center
		for (var i = 0, l = latlngs.length; i < l; i++) {
			offset = [latlngs[i].lat - center.lat, latlngs[i].lng - center.lng];
			newLatLngs.push([newCenter.lat + offset[0], newCenter.lng + offset[1]]);
		}

		this._shape.setLatLngs(newLatLngs);

		// Reposition the resize markers
		this._repositionCornerMarkers();

		this._map.fire(L.Draw.Event.EDITMOVE, { layer: this._shape });
	},

	_resize: function (latlng, e) {
		var ctrlKey = e.originalEvent.ctrlKey;
		var altKey = e.originalEvent.altKey;
		var shiftKey = e.originalEvent.shiftKey;

		var bounds;

		var currentMousePos = L.point(e.originalEvent.clientX, e.originalEvent.clientY);

		if (!this._mouseStartPosition) {
			this._mouseStartPosition = currentMousePos;
		}

		if (shiftKey) {
			// TODO: Constrain resizing to aspect ratio
		}

		if (altKey) {
			var latDifference = latlng.lat - this._centerPoint.lat;
			var lngDifference = latlng.lng - this._centerPoint.lng;

			var newCorner = L.latLng(this._centerPoint.lat - latDifference, this._centerPoint.lng - lngDifference);
			this._shape.setBounds(L.latLngBounds(latlng, newCorner));
		} else {
			// Update the shape based on the current position of this corner and the opposite point
			this._shape.setBounds(L.latLngBounds(latlng, this._oppositeCorner));			
		}

		// Reposition the move marker
		bounds = this._shape.getBounds();
		this._moveMarker.setLatLng(bounds.getCenter());

		this._map.fire(L.Draw.Event.EDITRESIZE, { layer: this._shape });
	},

	_getCorners: function () {
		var bounds = this._shape.getBounds(),
			nw = bounds.getNorthWest(),
			ne = bounds.getNorthEast(),
			se = bounds.getSouthEast(),
			sw = bounds.getSouthWest();

		return [nw, ne, se, sw];
	},

	_toggleCornerMarkers: function (opacity) {
		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
			this._resizeMarkers[i].setOpacity(opacity);
		}
	},

	_repositionCornerMarkers: function () {
		var corners = this._getCorners();

		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
			this._resizeMarkers[i].setLatLng(corners[i]);
		}
	}
});

L.Rectangle.addInitHook(function () {
	if (L.Edit.Rectangle) {
		this.editing = new L.Edit.Rectangle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}
});
