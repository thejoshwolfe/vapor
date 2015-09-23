(function() {
  var from_base64 = atob;
  var flip_horizontal_flag = 0x80000000;
  var flip_vertical_flag = 0x40000000;
  var flip_diagonal_flag = 0x20000000;
  var imageid_mask = 0x1fffffff;
  window.Map = Map;
  function Map() {
    this.tilesets = [];
    this.layers = [];
    this.objects = [];
  }
  Map.prototype.tile = function(layer, x, y) {
    var row = this.layers[layer][y];
    if (row == null) return 0;
    var value =  row[x];
    if (value == null) return 0;
    return value;
  };
  Map.prototype.draw_tiles = function(context, view_aabb) {
    var minX = Math.floor(view_aabb.lowerBound.x);
    var minY = Math.floor(view_aabb.lowerBound.y);
    var maxX = Math.ceil(view_aabb.upperBound.x);
    var maxY = Math.ceil(view_aabb.upperBound.y);
    for (var layer_index = 0; layer_index < this.layers.length; layer_index++) {
      for (var y = minY; y <= maxY; y++) {
        for (var x = minX; x <= maxX; x++) {
          this.draw_tile(context, layer_index, x, y);
        }
      }
    }
  };
  // TODO: silly
  var non_wall_image_ids = [0, 17, 18];
  window._all_image_ids = [];
  Map.prototype.draw_tile = function(context, layer_index, x, y) {
    var tile = this.tile(layer_index, x, y);
    if (tile === 0) return;
    var width  = 32;
    var height = 32;
    var half_width  = 16;
    var half_height = 16;
    var imageid = tile & imageid_mask;
    if (_all_image_ids.indexOf(imageid) === -1) {
      _all_image_ids.push(imageid);
      _all_image_ids.sort();
    }

    if (non_wall_image_ids.indexOf(imageid) === -1) {
      // special wall drawing logic
      var edge_width = 6;
      var neighbors = [
        [
          non_wall_image_ids.indexOf(this.tile(layer_index, x - 1, y - 1)) === -1,
          non_wall_image_ids.indexOf(this.tile(layer_index, x + 0, y - 1)) === -1,
          non_wall_image_ids.indexOf(this.tile(layer_index, x + 1, y - 1)) === -1,
        ], [
          non_wall_image_ids.indexOf(this.tile(layer_index, x - 1, y + 0)) === -1,
          true,
          non_wall_image_ids.indexOf(this.tile(layer_index, x + 1, y + 0)) === -1,
        ], [
          non_wall_image_ids.indexOf(this.tile(layer_index, x - 1, y + 1)) === -1,
          non_wall_image_ids.indexOf(this.tile(layer_index, x + 0, y + 1)) === -1,
          non_wall_image_ids.indexOf(this.tile(layer_index, x + 1, y + 1)) === -1,
        ]
      ];
      context.save();
      context.translate(x * this.scale + half_width, y * this.scale + half_height);
      context.fillStyle = "#000080";
      context.fillRect(-half_width, -half_height, width, height);
      context.fillStyle = "#0000ff";
      if (!neighbors[0][0] || !neighbors[1][0] || !neighbors[0][1]) {
        context.fillRect(-half_width, -half_height, edge_width, edge_width);
      }
      if (!neighbors[2][0] || !neighbors[1][0] || !neighbors[2][1]) {
        context.fillRect(-half_width, half_height - edge_width, edge_width, edge_width);
      }
      if (!neighbors[0][2] || !neighbors[1][2] || !neighbors[0][1]) {
        context.fillRect(half_width - edge_width, -half_height, edge_width, edge_width);
      }
      if (!neighbors[2][2] || !neighbors[1][2] || !neighbors[2][1]) {
        context.fillRect(half_width - edge_width, half_height - edge_width, edge_width, edge_width);
      }
      if (!neighbors[0][1]) {
        context.fillRect(-(half_width - edge_width), -half_width, 2 * (half_width - edge_width), edge_width);
      }
      if (!neighbors[2][1]) {
        context.fillRect(-(half_width - edge_width), half_width - edge_width, 2 * (half_width - edge_width), edge_width);
      }
      if (!neighbors[1][0]) {
        context.fillRect(-half_width, -(half_width - edge_width), edge_width, 2 * (half_width - edge_width));
      }
      if (!neighbors[1][2]) {
        context.fillRect(half_width - edge_width, -(half_width - edge_width), edge_width, 2 * (half_width - edge_width));
      }
      context.restore();
    } else {
      var flip_horizontal = !!(tile & flip_horizontal_flag);
      var flip_vertical = !!(tile & flip_vertical_flag);
      var flip_diagonal = !!(tile & flip_diagonal_flag);
      var rotation = 0;
      if (flip_diagonal) {
        rotation += Math.PI / 2;
        flip_horizontal = !flip_horizontal;
      }
      var tileset;
      var image_bounds;
      for (var i = 0; i < this.tilesets.length; i++) {
        tileset = this.tilesets[i];
        image_bounds = tileset.image_bounds(imageid);
        if (image_bounds != null) {
          break;
        }
      }

      context.save();
      context.translate(x * this.scale + half_width, y * this.scale + half_height);
      context.scale(flip_horizontal ? -1 : 1, flip_vertical ? -1 : 1);
      context.rotate(rotation);
      context.drawImage(tileset.image,
        image_bounds.x, image_bounds.y, image_bounds.width, image_bounds.height,
        -half_width,    -half_height,   image_bounds.width, image_bounds.height);
      context.restore();
    }
  };

  function Tileset() {
    // TODO: assign my properties in here so i know what they are by looking at this function
  }
  Tileset.prototype.image_bounds = function(imageid) {
    var local_id = imageid - this.first_gid;
    if (local_id < 0) {
      return null;
    }
    var column_count = this.width / this.tilewidth;
    var row = Math.floor(local_id / column_count);
    var row_count = this.height / this.tileheight;
    if (row >= row_count) {
      return null;
    }
    var column = local_id % column_count;
    return {
      x: column * this.tilewidth,
      y: row * this.tileheight,
      width: this.tilewidth,
      height: this.tileheight
    };
  };

  Map.parse = function(text, create_wait_condition) {
    var map = new Map();
    var xml = new DOMParser().parseFromString(text, "text/xml");
    var root = xml.getElementsByTagName("map")[0];
    map.scale = parseInt(root.getAttribute("tilewidth"));

    var tileset_elements = root.getElementsByTagName("tileset");
    for (var i = 0; i < tileset_elements.length; i++) {
      var tileset_element = tileset_elements[i];
      var tileset = new Tileset();
      tileset.first_gid = parseInt(tileset_element.getAttribute("firstgid"));
      tileset.tilewidth = parseInt(tileset_element.getAttribute("tilewidth"));
      tileset.tileheight = parseInt(tileset_element.getAttribute("tileheight"));
      var image_element = tileset_element.getElementsByTagName("image")[0];
      tileset.image = new Image();
      tileset.image.src = image_element.getAttribute("source");
      tileset.image.onload = create_wait_condition("tileset");
      tileset.width = parseInt(image_element.getAttribute("width"));
      tileset.height = parseInt(image_element.getAttribute("height"));
      map.tilesets.push(tileset);
    }

    var layer_elements = root.getElementsByTagName("layer");
    for (var i = 0; i < layer_elements.length; i++) {
      var layer_element = layer_elements[i];
      var name = layer_element.getAttribute("name");
      var width = parseInt(layer_element.getAttribute("width"));
      var height = parseInt(layer_element.getAttribute("height"));
      var data_element = layer_element.getElementsByTagName("data")[0];
      if (data_element.getAttribute("compression")) {
        alert("can't decompress map. store maps with base64 uncompressed data. sorry.");
        return;
      }
      var data_string = from_base64(data_element.textContent.trim());
      var index = 0;
      var layer = [];
      for (var y = 0; y < height; y++) {
        var row = [];
        for (var x = 0; x < width; x++) {
          var tile_value = data_string.charCodeAt(index++);
          tile_value |= data_string.charCodeAt(index++) << 8;
          tile_value |= data_string.charCodeAt(index++) << 16;
          tile_value |= data_string.charCodeAt(index++) << 24;
          row.push(tile_value);
        }
        layer.push(row);
      }
      map.layers.push(layer);
      if (name === "physics") {
        map.physics_layer = layer;
      }
    }

    var objectgroup_elements = root.getElementsByTagName("objectgroup");
    for (var i = 0; i < objectgroup_elements.length; i++) {
      var objectgroup_element = objectgroup_elements[i];
      var object_elements = objectgroup_element.getElementsByTagName("object");
      for (var j = 0; j < object_elements.length; j++) {
        var object_element = object_elements[j];
        var properties = {};
        var properties_elements = object_element.getElementsByTagName("properties");
        for (var k = 0; k < properties_elements.length; k++) {
          var properties_element = properties_elements[k];
          var property_elements = properties_element.getElementsByTagName("property");
          for (var l = 0; l < property_elements.length; l++) {
            var property_element = property_elements[l];
            properties[property_element.getAttribute("name")] = property_element.getAttribute("value");
          }
        }
        map.objects.push({
          x: parseInt(object_element.getAttribute("x")),
          y: parseInt(object_element.getAttribute("y")),
          width: parseInt(object_element.getAttribute("width")),
          height: parseInt(object_element.getAttribute("height")),
          properties: properties
        });
      }
    }

    return map;
  };
})();
