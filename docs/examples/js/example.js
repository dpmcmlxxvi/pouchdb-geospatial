const pouchdb = new PouchDB('geostore');
const geodb = pouchdb.geospatial();

let predicate = 'contains';
const map = L.map('map').setView([39, -96], 4);
const layers = {
  capitals: null,
  interstates: null,
  selected: null,
  states: null,
};
const styles = {
  capitals: {
    highlight: {
      color: '#FF0000',
      fillOpacity: 1.0,
      weight: 0,
    },
    normal: {
      color: '#FF9999',
      fillOpacity: 1.0,
      weight: 0,
    },
  },
  interstates: {
    highlight: {
      color: '#0000FF',
      dashArary: '3',
      fillOpacity: 1,
      opacity: 1,
      weight: 3,
    },
    normal: {
      color: '#ADD8E6',
      dashArary: '3',
      fillOpacity: 0.5,
      opacity: 1,
      weight: 3,
    },
  },
  states: {
    current: {
    },
    highlight: {
      color: '#00FF00',
      dashArary: '3',
      fillOpacity: 0.5,
      opacity: 1,
      weight: 5,
    },
    mouseover: {
      color: '#FFFF00',
      fillOpacity: 0.5,
      opacity: 1,
      weight: 5,
    },
    normal: {
      color: '#90EE90',
      dashArary: '3',
      fillOpacity: 0,
      opacity: 1,
      weight: 2,
    },
  },
};

const addLayer = (collection, prefix, options, events) => {
  // Add unique ID to each feature
  let id = 0;
  options = $.extend({}, options, {
    onEachFeature: (feature, layer) => {
      feature._id = prefix + (++id);
      layer._leaflet_id = feature._id;
      if (events) {
        layer.on(events);
      }
    },
  });
  return L.geoJson(collection, options).addTo(map);
};

// Define control to display state information.
const info = L.control();
info.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};
info.update = function(properties) {
  let message = 'Hover over a state';
  if (properties) {
    message = `<b>${properties.NAME}</b><br />`;
  }
  this._div.innerHTML = '<h5>State selected</h5>' + message;
};
info.addTo(map);

// Initilize example on page load.
$(document).ready(() => {
  // Load map tiles.
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">' +
      'OpenStreetMap</a>',
  }).addTo(map);

  // Load GeoJSON from server.
  $.when(
      $.getJSON('data/us_states.json'),
      $.getJSON('data/us_interstates.json'),
      $.getJSON('data/us_capitals.json'),
  ).then((states, interstates, capitals) => {
    // Add GeoJSON to map
    capitals = capitals[0];
    interstates = interstates[0];
    states = states[0];

    layers.capitals = addLayer(capitals, 'capitals-', {
      pointToLayer: (_, latlng) => {
        return L.circleMarker(latlng, styles.capitals.normal);
      },
    });

    layers.interstates = addLayer(interstates, 'interstates-', {
      style: () => styles.interstates.normal,
    });

    layers.states = addLayer(states, 'states-', {
      style: () => styles.states.normal,
    }, {
      click: (e) => {
        const layer = e.target;
        const id = layers.states.getLayerId(layer);

        // Track clicked state
        layers.selected = layer;

        // Reset all styles to normal
        layers.states.setStyle(styles.states.normal);
        layers.interstates.setStyle(styles.interstates.normal);
        layers.capitals.setStyle(styles.capitals.normal);
        styles.states.current = {};

        // Process predicate request.
        pouchdb.get(id, {include_docs: true}).then((doc) => {
          // Get clicked state and process through predicate.
          return geodb[predicate](doc);
        }).then((ids) => {
          // Get all features satisfying predicate from database.
          return pouchdb.allDocs({
            include_docs: true,
            keys: ids,
          });
        }).then((response) => {
          // Update results display.
          const update = (prefix, property) => {
            // Find feature IDs that match desired type and get their name.
            const results = response.rows.filter((result) => {
              return result.id.startsWith(prefix);
            }).map((result) => {
              const layer = layers[prefix].getLayer(result.id);

              // Set style of found feature to highlight
              const style = styles[prefix].highlight;
              styles.states.current[layers.states.getLayerId(layer)] = style;
              layer.setStyle(style);

              return result.doc.properties[property];
            });

            // Prepend result count and populate table cells
            results.unshift('(' + results.length + ')');
            $('#' + prefix).html(results.join('<br/>'));
          };
          update('states', 'NAME');
          update('interstates', 'ROUTE_NUM');
          update('capitals', 'name');
        }).catch((err) => {
          console.error(err);
        });
      },
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle(styles.states.mouseover);
        info.update(layer.feature.properties);
      },
      mouseout: (e) => {
        const layer = e.target;
        const id = layers.states.getLayerId(layer);

        // Set layer to current style
        let current = styles.states.normal;
        if (id in styles.states.current) {
          current = styles.states.current[id];
        }
        layer.setStyle(current);

        // Set info control
        const feature = (layers.selected ? layers.selected.feature : null);
        const properties = (feature ? feature.properties : null);
        info.update(properties);
      },
    });
    return {capitals, interstates, states};
  }).then((data) => {
    // Add features to database
    const capitals = data.capitals.features;
    const interstates = data.interstates.features;
    const states = data.states.features;
    const features = [].concat.apply([], [capitals, interstates, states]);

    return geodb.load(features);
  }).fail((error) => {
    alert(error);
  });

  // Update menu on predicate selection.
  $('.dropdown-menu button').click(function() {
    predicate = $(this).text();
    $('.btn:first-child').text(predicate);
    $('.btn:first-child').val(predicate);
  });
});

$(window).on('beforeunload', () => {
  pouchdb.destroy();
});
