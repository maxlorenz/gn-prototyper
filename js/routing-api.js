/*

  API draft to simplify drafting routing algorithms
  Uses OSM data

 */



/*
  Cache for the OSM data
  Implements a adjacency list like structure

  E.g.:

  node1_id
  |-----> [node2_id, node3_id]
  node2_id
  |-----> [node1_id, node4_id, node7_id]
  node3_id
  [...]
  node7_id

 */
var cache = {};

function cacheNode(node) {
    cache[node.id] = {
        "lat": node.lat,
        "lon": node.lon,
        "next": {}
    };
}

function cacheWay(way) {
    for (var i = 1; i < way.nodes.length; i++) {
        var lastNode = way.nodes[i - 1];
        var currentNode = way.nodes[i];

        if (lastNode in cache && currentNode in cache) {
            var dist = distanceInM(cache[lastNode], cache[currentNode]);

            cache[lastNode].next[currentNode] = dist;
        }
    }
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

function cacheOSMData(lat, lon, range) {
    var urlNodes = "http://overpass-api.de/api/interpreter?data=[out:json];" +
        "node(" + (lat - range) + "," + (lon - range) + "," +
        (lat + range) + "," + (lon + range) + ");out;";

    var urlWays = "http://overpass-api.de/api/interpreter?data=[out:json];" +
    "way(" + (lat - range) + "," + (lon - range) + "," +
        (lat + range) + "," + (lon + range) + ");out;";

    var requestNodes = new XMLHttpRequest();
    var requestWays = new XMLHttpRequest();

    requestNodes.open('GET', urlNodes, true);
    requestWays.open('GET', urlWays, true);

    requestNodes.onreadystatechange = function() {
        if (requestNodes.readyState == 4) {
            var response = JSON.parse(requestNodes.responseText);
            response.elements.forEach(cacheNode);

            console.log('done parsing the nodes. parsing the ways...');
            requestWays.send();
        }
    }

    requestWays.onreadystatechange = function() {
        if (requestNodes.readyState == 4) {
            var response = JSON.parse(requestWays.responseText);
            response.elements.forEach(cacheWay)

            console.log('done');
        }
    }

    requestNodes.send();
}
