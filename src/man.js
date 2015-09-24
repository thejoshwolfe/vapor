(function() {
  var b2Vec2 = Box2D.Common.Math.b2Vec2;
  var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
  var b2MassData = Box2D.Collision.Shapes.b2MassData;
  window.Man = Man;
  function Man() {
    this.standing_sprite = new Chem.Sprite(Chem.resources.animations.man_stand, {
      z_order: 1
    });
    this.crouching_sprite = new Chem.Sprite(Chem.resources.animations.man_crouch, {
      z_order: 1
    });
    this.body = null;
    this.mass = null;
    this.ground_sensors = {};
    this.torso_fixture = null;
    this.is_grounded = null;
    this.is_crouching = null;
    this.is_jumping = false;
    this.gravity_direction = 1;
    this.facing_direction = 1;
    return this;
  }
  Man.prototype.half_width = 0.8 / 2;
  Man.prototype.sensor_half_width = 0.8 / 2 * 0.95;
  Man.prototype.standing_half_height = 2.6 / 2;
  Man.prototype.crouching_half_height = 2.0 / 2;
  Man.prototype.ground_sensor_height = 0.05;
  Man.prototype.jump_impulse = new b2Vec2(0, -39);
  Man.prototype.jump_stop = -5;
  Man.prototype.max_speed = 10;
  Man.prototype.get_half_height = function() {
    if (this.is_crouching) {
      return this.crouching_half_height;
    } else {
      return this.standing_half_height;
    }
  };
  Man.prototype.get_torso_shape = function() {
    return b2PolygonShape.AsBox(this.half_width, this.get_half_height());
  };
  Man.prototype.get_ground_sensor_shape = function(gravity_direction) {
    var center = new b2Vec2(0, gravity_direction * this.get_half_height());
    return b2PolygonShape.AsOrientedBox(this.sensor_half_width, this.ground_sensor_height, center);
  };
  Man.prototype.get_ground_sensor = function() {
    return this.ground_sensors[this.gravity_direction];
  };
  Man.prototype.reset_mass = function() {
    this.body.SetAwake(true);
    this.body.ResetMassData();
    var mass_data = new b2MassData();
    this.body.GetMassData(mass_data);
    mass_data.mass = this.mass;
    return this.body.SetMassData(mass_data);
  };
})();
