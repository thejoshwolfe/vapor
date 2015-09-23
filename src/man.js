(function(){
  var b2Vec2, b2PolygonShape, b2MassData, Man;
  b2Vec2 = Box2D.Common.Math.b2Vec2;
  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
  b2MassData = Box2D.Collision.Shapes.b2MassData;
  window.Man = Man = (function(){
    Man.displayName = 'Man';
    var prototype = Man.prototype, constructor = Man;
    prototype.half_width = 0.8 / 2;
    prototype.sensor_half_width = 0.8 / 2 * 0.95;
    prototype.standing_half_height = 2.6 / 2;
    prototype.crouching_half_height = 2.0 / 2;
    prototype.ground_sensor_height = 0.05;
    prototype.jump_impulse = new b2Vec2(0, -39);
    prototype.jump_stop = -5;
    prototype.max_speed = 10;
    function Man(){
      var this$ = this instanceof ctor$ ? this : new ctor$;
      this$.standing_sprite = new Chem.Sprite(Chem.resources.animations.man_stand, {
        z_order: 1
      });
      this$.crouching_sprite = new Chem.Sprite(Chem.resources.animations.man_crouch, {
        z_order: 1
      });
      this$.body = null;
      this$.mass = null;
      this$.ground_sensors = {};
      this$.torso_fixture = null;
      this$.is_grounded = null;
      this$.was_grounded = false;
      this$.is_crouching = null;
      this$.was_crouching = false;
      this$.is_jumping = false;
      this$.gravity_direction = 1;
      this$.facing_direction = 1;
      return this$;
    } function ctor$(){} ctor$.prototype = prototype;
    prototype.get_half_height = function(){
      if (this.is_crouching) {
        return this.crouching_half_height;
      } else {
        return this.standing_half_height;
      }
    };
    prototype.get_torso_shape = function(){
      return b2PolygonShape.AsBox(this.half_width, this.get_half_height());
    };
    prototype.get_ground_sensor_shape = function(gravity_direction){
      return b2PolygonShape.AsOrientedBox(this.sensor_half_width, this.ground_sensor_height, new b2Vec2(0, gravity_direction * this.get_half_height()));
    };
    prototype.get_ground_sensor = function(){
      return this.ground_sensors[this.gravity_direction];
    };
    prototype.reset_mass = function(){
      var mass_data;
      this.body.SetAwake(true);
      this.body.ResetMassData();
      this.body.GetMassData(mass_data = new b2MassData);
      mass_data.mass = this.mass;
      return this.body.SetMassData(mass_data);
    };
    return Man;
  }());
}).call(this);
