(function() {
  var b2Vec2 = Box2D.Common.Math.b2Vec2;
  var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
  var b2MassData = Box2D.Collision.Shapes.b2MassData;
  window.Man = Man;
  function Man() {
    this.standing_sprite = new Chem.Sprite(Chem.resources.animations.man_stand, {z_order:1});
    this.crouching_sprite = new Chem.Sprite(Chem.resources.animations.man_crouch, {z_order:1});
    this.crawling_sprite = new Chem.Sprite(Chem.resources.animations.man_crawl, {z_order:1});
    this.body = null;
    this.mass = null;
    this.ground_sensor = null;
    this.torso_fixture = null;
    this.is_grounded = null;
    this.posture = Man.POSTURE_STANDING;
    this.is_jumping = false;
    this.gravity_direction = 1;
    this.facing_direction = 1;
    return this;
  }
  Man.POSTURE_STANDING = 2;
  Man.POSTURE_CROUCHING = 1;
  Man.POSTURE_CRAWLING = 0;
  Man.prototype.half_width = 0.8 / 2;
  Man.prototype.sensor_half_width = 0.8 / 2 * 0.95;
  Man.prototype.standing_half_height = 2.6 / 2;
  Man.prototype.crouching_half_height = 2.0 / 2;
  Man.prototype.crawling_half_height = 27/32 / 2;
  Man.prototype.ground_sensor_height = 0.05;
  Man.prototype.jump_impulse = new b2Vec2(0, -39);
  Man.prototype.jump_stop = -5;
  Man.prototype.get_half_height = function() {
    if (this.posture === Man.POSTURE_STANDING)  return this.standing_half_height;
    if (this.posture === Man.POSTURE_CROUCHING) return this.crouching_half_height;
    if (this.posture === Man.POSTURE_CRAWLING)  return this.crawling_half_height;
    throw asdf;
  };
  Man.prototype.get_sprite = function() {
    if (this.posture === Man.POSTURE_STANDING)  return this.standing_sprite;
    if (this.posture === Man.POSTURE_CROUCHING) return this.crouching_sprite;
    if (this.posture === Man.POSTURE_CRAWLING)  return this.crawling_sprite;
    throw asdf;
  };
  Man.prototype.get_torso_shape = function() {
    return b2PolygonShape.AsBox(this.half_width, this.get_half_height());
  };
  Man.prototype.get_ground_sensor_shape = function(gravity_direction) {
    var center = new b2Vec2(0, gravity_direction * this.get_half_height());
    return b2PolygonShape.AsOrientedBox(this.sensor_half_width, this.ground_sensor_height, center);
  };
  Man.prototype.reset_mass = function() {
    this.body.SetAwake(true);
    this.body.ResetMassData();
    var mass_data = new b2MassData();
    this.body.GetMassData(mass_data);
    mass_data.mass = this.mass;
    return this.body.SetMassData(mass_data);
  };
  Man.prototype.update_ground_sensor_shape = function() {
    this.ground_sensor.m_shape = this.get_ground_sensor_shape(this.gravity_direction);
    this.reset_mass();
  };
})();
