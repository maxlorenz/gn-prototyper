/*

  API draft to simplify drafting routing algorithms
  Uses OSM data

  Overpass API:
  http://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide

 */

/// CACHING ///
var nodeCache = {};
var wayCache = {};

var AJAX_SUCCESS = 4;

function cacheNodeOrWay(element) {
    if (element.type == "node") cacheNode(element);
    if (element.type == "way") cacheWay(element);
}

function cacheNode(node) {
    nodeCache[node.id] = {
        "lat": node.lat,
        "lon": node.lon,
        "id": node.id
    };
}

function cacheWay(way) {

    for (var i = 1; i < way.nodes.length; i++) {
        var lastNode = way.nodes[i - 1];
        var currentNode = way.nodes[i];

        if (!(lastNode in wayCache)) {
            wayCache[lastNode] = {};
        }

        wayCache[lastNode][currentNode] = true;
    }
}

function cacheOSMData(lat, lon, range, callback) {

    var request = new XMLHttpRequest();
    var urlNodesAndWays = "http://overpass-api.de/api/interpreter?data=[out:json];" +
        "(node(" +
        (lat - range) + "," +
        (lon - range) + "," +
        (lat + range) + "," +
        (lon + range) + ");" +
        "way(bn););out meta;";

    request.open('GET', urlNodesAndWays, true);
    request.onreadystatechange = function() {

        if (request.readyState == AJAX_SUCCESS) {
            JSON.parse(request.responseText)
                .elements
                .forEach(cacheNodeOrWay);

            callback();
        }
    }

    request.send();
}

/// ROUTING ///
function getNextNodes(node) {

    var nextNodes = [];

    for (var id in wayCache[node.id]) {
        nextNodes.push(nodeCache[id]);
    }

    return nextNodes;
}

function distanceInM(node1, node2) {

    var radlat1 = Math.PI * node1.lat/180;
	  var radlat2 = Math.PI * node2.lat/180;
	  var radlon1 = Math.PI * node1.lon/180;
	  var radlon2 = Math.PI * node2.lon/180;

	  var theta = node1.lon - node2.lon;
	  var radtheta = Math.PI * theta/180;

	  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

	  dist = Math.acos(dist);
	  dist = dist * 180/Math.PI;
	  dist = dist * 60 * 1.1515;
	  dist = dist * 1.609344 * 1000;

	  return dist;
}

function createSorter(startNode) {

    return function(nodeA, nodeB) {
        var fromStart = distanceInM.bind(null, startNode);

        return fromStart(nodeB) - fromStart(nodeA);
    };
}
