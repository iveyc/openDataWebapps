// Enable the visual refresh
google.maps.visualRefresh = true;

var map;
var mapCenter = new google.maps.LatLng(39.951328, -75.168053);
var kmlLoc = "http://stormy-falls-9246.herokuapp.com/kml/";

var routes = {};
routes["North"] = ["2", "4", "6", "7", "8", "15", "16", "18", "23", "26", "33", "39", "47", "48", "53", "54", "57", "60", "75"];

// center city
routes["CCNS"] = ["1", "2", "3", "4", "17", "23", "47M"];
routes["CCNE"] = ["3", "78"];
routes["CCW"] = ["1", "10", "27", "32", "34", "36", "61"];
routes["CCFitler"] = ["7"];
// northern liberties and fishtown
routes["NLIB"] = ["5", "25", "57"]
// old city / society hill
routes["OCNS"] = ["5", "25", "33", "17", "47", "48", "57"];
routes["OCW"] = ["9", "12", "21", "42", "38", "44"];
// south philly - East of Broad
routes['SE'] = ["4", "25", "29", "47", "47M", "57", "64", "68", "79"];
// south philly - West of Broad
routes['SW'] = ["2", "4", "7", "17", "29", "37", "64", "68", "79"];
// west philly
routes['West'] = ["11", "13", "21", "30", "31", "35", "36", "38", "40", "42", "43", "46", "52", "64"];
// ne philadelphia - Frankford to NE ...
routes['NE'] = ["3", "18", "19", "20", "24", "25", "28", "50", "56", "58", "59", "66", "67", "70", "73", "78", "84", "88", "89"]// northeast
// north west philly: fairmount park and manayunk
routes['NW'] = ["9", "27", "35", "44", "61", "62", "65"];
// south west - need to rename this
routes['Drex'] = ["36", "37", "68"];
// northwest: king of prussia, plymouth meeting, norristown
routes['King'] = ["27", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99"];

// testing routes
routes['103-120'] = ["103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "117", "118", "119", "120"];
routes['123-150'] = ["123", "124", "125", "126", "127", "128", "129", "130", "131", "132", "133", "139", "150"];
routes['201-310'] = ["201", "204", "205", "206", "310"];
routes['Letters'] = ['G', 'J', 'K', 'L', 'LUCY', 'R', 'H', 'XH'];
var busNumbers = new Array;

var busesJson = new Array();
var MY_MAPTYPE_ID = 'philly_style';
var busMarkers = [];
var featureOpts = [{
		stylers : [{
			hue : "#00dde6"
		}, {
			saturation : -50
		}]
	}, {
		featureType : "road",
		elementType : "geometry",
		stylers : [{
			lightness : 100
		}, {
			visibility : "simplified"
		}]
	}, {
		featureType : "road",
		elementType : "labels",
		stylers : [{
			visibility : "on"
		}]
	}];
var mapOptions = {
		zoom : 15,
		center : mapCenter,
		mapTypeControlOptions : {
			mapTypeIds : [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, MY_MAPTYPE_ID]
		},
		mapTypeId : MY_MAPTYPE_ID
	};
var styledMapOptions = {
		name : 'Explorer Style'
	};
var explorerMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);

function initialize() {
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	map.mapTypes.set(MY_MAPTYPE_ID, explorerMapType);
	// add routes to map
	for (var i = 0; i < busNumbers.length; i++) {
		kmlUrl = "" + kmlLoc + busNumbers[i] + ".kml";
		console.debug(kmlUrl);
		new google.maps.KmlLayer({
			url : kmlUrl
		}).setMap(map);
	}
}

$(document).ready(function() {

	// add zone change event to dropdown
	$("select").change(function() {
		window.location.replace("/philly_bus_explorer.html?zone=" + $(this).val());
	});
	
	// get zone from querystring
	var zone = getURLParameter("zone");
	if (zone == null) {
		zone = 'OCW'
	}
	$('select').val(zone);
	
	// get zones from vars (will be looking this up remotely)
	busNumbers = routes[zone];
	initialize();
	updateAllBusMarkers()
	setInterval(function() {
		updateAllBusMarkers()
	}, 20000);
});

function getURLParameter(name) {
	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20')) || null;
}

function updateAllBusMarkers() {
	var getArray = [];
	for (var i = 0; i < busNumbers.length; i++) {
		getArray.push(getBus(busNumbers[i]));
	}

	$.when.apply($, getArray).done(function() {
		for (var i = 0; i < busNumbers.length; i++) {
			setMarkers(busNumbers[i]);
		}
	});
}

function formatBuses() {
	var message = "Route\tBuses\n";
	for (var i = 0; i < busNumbers.length; i++) {
		var busNumber = busNumbers[i];
		var totalBuses = busesJson[busNumber].bus.length;
		message = message + busNumber + ":\t\t" + totalBuses + "\n";
	}
	return message;
}

function getBus(busNumber) {
	return $.getJSON('/septa/bus/' + busNumber, function(data) {
		busesJson[busNumber] = data;
	});
}

function setMarkers(busNumber) {
	for (var i = 0; i < busesJson[busNumber].bus.length; i++) {
		var bus = busesJson[busNumber].bus[i];
		var latLng = new google.maps.LatLng(bus.lat, bus.lng);
		addMarker(latLng, bus, busNumber);
	}
}

function addMarker(latLng, bus, busNumber) {
	var vehicleId = bus.VehicleID;
	if ( vehicleId in busMarkers) {
		busMarker = busMarkers[vehicleId];
		if (latLng.toString() != busMarker.getPosition().toString()) {
			console.debug(vehicleId + " moved, was " + busMarker.getPosition().toString() + " now " + latLng.toString());
			busMarker.animateTo(latLng);
		}

	} else {
		busMarkers[vehicleId] = new MarkerWithLabel({
			position : latLng,
			map : map,
			icon : "images/arrow" + bus.Direction + "16.png",
			title : busNumber + " " + bus.Direction + " to " + bus.destination + " vehicleId " + bus.VehicleID,
			clickable : true,
			draggable : true,
			labelText : busNumber,
			labelClass : "labels", // the CSS class for the label
			labelStyle : {
				marginTop : "2px",
				marginLeft : "-8px",
				opacity : 0.75
			},
			labelVisible : true
		});
		busMarkers[vehicleId].note = busNumber + " " + bus.Direction + "<br/>To " + bus.destination + "<br/>Vehicle: " + bus.VehicleID + "<br/>Last update " + bus.Offset + " min(s) ago<br/>Lat: " + bus.lat + " Lng: " + bus.lng;
		var info_window = new google.maps.InfoWindow({
			content : ''
		});
		google.maps.event.addListener(busMarkers[vehicleId], 'click', function() {
			info_window.content = this.note;
			info_window.open(this.getMap(), this);
		});
	}

}
