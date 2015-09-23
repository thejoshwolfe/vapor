(function(){
  var from_base64, flip_horizontal_flag, flip_vertical_flag, flip_diagonal_flag, imageid_mask, Map, Tileset;
  from_base64 = atob || alert("this browser can't decode base64 data");
  flip_horizontal_flag = 0x80000000;
  flip_vertical_flag = 0x40000000;
  flip_diagonal_flag = 0x20000000;
  imageid_mask = 0x1fffffff;
  window.Map = Map = (function(){
    Map.displayName = 'Map';
    var prototype = Map.prototype, constructor = Map;
    function Map(){
      var this$ = this instanceof ctor$ ? this : new ctor$;
      this$.tilesets = [];
      this$.layers = [];
      this$.objects = [];
      return this$;
    } function ctor$(){} ctor$.prototype = prototype;
    prototype.tile = function(layer, x, y){
      var ref$;
      return (ref$ = (ref$ = this.layers[layer][y]) != null ? ref$[x] : void 8) != null ? ref$ : 0;
    };
    prototype.draw_tiles = function(context, view_aabb){
      var layer_index, to$, y, to1$, x, to2$, results$ = [];
      for (layer_index = 0, to$ = this.layers.length; layer_index < to$; ++layer_index) {
        for (y = Math.floor(view_aabb.lowerBound.y), to1$ = Math.ceil(view_aabb.upperBound.y); y <= to1$; ++y) {
          for (x = Math.floor(view_aabb.lowerBound.x), to2$ = Math.ceil(view_aabb.upperBound.x); x <= to2$; ++x) {
            results$.push(this.draw_tile(context, layer_index, x, y));
          }
        }
      }
      return results$;
    };
    prototype.draw_tile = function(context, layer_index, x, y){
      var tile, flip_horizontal, flip_vertical, flip_diagonal, rotation, imageid, i$, ref$, len$, tileset, image_bounds, half_width, half_height;
      tile = this.tile(layer_index, x, y);
      if (tile === 0) {
        return;
      }
      flip_horizontal = !!(tile & flip_horizontal_flag);
      flip_vertical = !!(tile & flip_vertical_flag);
      flip_diagonal = !!(tile & flip_diagonal_flag);
      rotation = 0;
      if (flip_diagonal) {
        rotation += Math.PI / 2;
        flip_horizontal = !flip_horizontal;
      }
      imageid = tile & imageid_mask;
      for (i$ = 0, len$ = (ref$ = this.tilesets).length; i$ < len$; ++i$) {
        tileset = ref$[i$];
        image_bounds = tileset.image_bounds(imageid);
        if (image_bounds != null) {
          break;
        }
      }
      context.save();
      half_width = image_bounds.width / 2;
      half_height = image_bounds.height / 2;
      context.translate(x * this.scale + half_width, y * this.scale + half_height);
      context.scale(flip_horizontal ? -1 : 1, flip_vertical ? -1 : 1);
      context.rotate(rotation);
      context.drawImage(tileset.image, image_bounds.x, image_bounds.y, image_bounds.width, image_bounds.height, -half_width, -half_height, image_bounds.width, image_bounds.height);
      return context.restore();
    };
    return Map;
  }());
  Map.Tileset = Tileset = (function(){
    Tileset.displayName = 'Tileset';
    var prototype = Tileset.prototype, constructor = Tileset;
    prototype.image_bounds = function(imageid){
      var local_id, column_count, row, row_count, column;
      local_id = imageid - this.first_gid;
      if (local_id < 0) {
        return null;
      }
      column_count = this.width / this.tilewidth;
      row = Math.floor(local_id / column_count);
      row_count = this.height / this.tileheight;
      if (row >= row_count) {
        return null;
      }
      column = local_id % column_count;
      return {
        x: column * this.tilewidth,
        y: row * this.tileheight,
        width: this.tilewidth,
        height: this.tileheight
      };
    };
    function Tileset(){}
    return Tileset;
  }());
  Map.parse = function(text, create_wait_condition){
    var map, xml, root, i$, ref$, len$, tileset_element, tileset, image_element, layer_element, name, width, height, data_element, data_string, i, layer, y, row, x, tile_value, objectgroup_element, j$, ref1$, len1$, object_element, properties, k$, ref2$, len2$, properties_element, l$, ref3$, len3$, property_element;
    map = new Map();
    xml = new DOMParser().parseFromString(text, "text/xml");
    root = xml.getElementsByTagName("map")[0];
    map.scale = parseInt(root.getAttribute("tilewidth"));
    for (i$ = 0, len$ = (ref$ = root.getElementsByTagName("tileset")).length; i$ < len$; ++i$) {
      tileset_element = ref$[i$];
      tileset = new Tileset();
      tileset.first_gid = parseInt(tileset_element.getAttribute("firstgid"));
      tileset.tilewidth = parseInt(tileset_element.getAttribute("tilewidth"));
      tileset.tileheight = parseInt(tileset_element.getAttribute("tileheight"));
      image_element = tileset_element.getElementsByTagName("image")[0];
      tileset.image = new Image();
      tileset.image.src = image_element.getAttribute("source");
      tileset.image.onload = create_wait_condition("tileset");
      tileset.width = parseInt(image_element.getAttribute("width"));
      tileset.height = parseInt(image_element.getAttribute("height"));
      map.tilesets.push(tileset);
    }
    for (i$ = 0, len$ = (ref$ = root.getElementsByTagName("layer")).length; i$ < len$; ++i$) {
      layer_element = ref$[i$];
      name = layer_element.getAttribute("name");
      width = parseInt(layer_element.getAttribute("width"));
      height = parseInt(layer_element.getAttribute("height"));
      data_element = layer_element.getElementsByTagName("data")[0];
      if (data_element.getAttribute("compression")) {
        alert("can't decompress map. store maps with base64 uncompressed data.");
        return;
      }
      data_string = from_base64(data_element.textContent.trim());
      i = 0;
      map.layers.push(layer = []);
      for (y = 0; y < height; ++y) {
        layer.push(row = []);
        for (x = 0; x < width; ++x) {
          tile_value = data_string.charCodeAt(i++);
          tile_value |= data_string.charCodeAt(i++) << 8;
          tile_value |= data_string.charCodeAt(i++) << 16;
          tile_value |= data_string.charCodeAt(i++) << 24;
          row.push(tile_value);
        }
      }
      if (name === "physics") {
        map.physics_layer = layer;
      }
    }
    for (i$ = 0, len$ = (ref$ = root.getElementsByTagName("objectgroup")).length; i$ < len$; ++i$) {
      objectgroup_element = ref$[i$];
      for (j$ = 0, len1$ = (ref1$ = objectgroup_element.getElementsByTagName("object")).length; j$ < len1$; ++j$) {
        object_element = ref1$[j$];
        properties = {};
        for (k$ = 0, len2$ = (ref2$ = object_element.getElementsByTagName("properties")).length; k$ < len2$; ++k$) {
          properties_element = ref2$[k$];
          for (l$ = 0, len3$ = (ref3$ = properties_element.getElementsByTagName("property")).length; l$ < len3$; ++l$) {
            property_element = ref3$[l$];
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
}).call(this);
