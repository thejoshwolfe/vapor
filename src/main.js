(function(){
  var b2Vec2, b2BodyDef, b2Body, b2FixtureDef, b2RevoluteJointDef, b2World, b2DebugDraw, b2AABB, b2PolygonShape, b2CircleShape, query_aabb, sign, aabb_contains_point, make_aabb, map, init;
  require("./map");
  require("./man");
  window.Chem = require("chem");
  Chem.Vec2d = Chem.vec2d;
  Chem.Button = Chem.button;
  b2Vec2 = Box2D.Common.Math.b2Vec2;
  b2BodyDef = Box2D.Dynamics.b2BodyDef;
  b2Body = Box2D.Dynamics.b2Body;
  b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
  b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;
  b2World = Box2D.Dynamics.b2World;
  b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
  b2AABB = Box2D.Collision.b2AABB;
  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
  query_aabb = function(world, aabb, callback){
    var actual_callback;
    actual_callback = function(fixture){
      return !callback(fixture);
    };
    return world.QueryAABB(callback, aabb);
  };
  sign = function(n){
    if (n < 0) {
      return -1;
    } else if (n > 0) {
      return 1;
    } else {
      return 0;
    }
  };
  aabb_contains_point = function(aabb, point){
    return aabb.lowerBound.x <= point.x && point.x < aabb.upperBound.x && aabb.lowerBound.y <= point.y && point.y < aabb.upperBound.y;
  };
  make_aabb = function(x1, y1, x2, y2){
    var result;
    result = new b2AABB();
    result.lowerBound.x = x1;
    result.lowerBound.y = y1;
    result.upperBound.x = x2;
    result.upperBound.y = y2;
    return result;
  };
  map = null;
  (function(){
    var waiting_events, create_wait_condition, map_is_ready, request;
    waiting_events = [];
    create_wait_condition = function(name){
      var index;
      index = waiting_events.length;
      waiting_events.push(name);
      return function(){
        var done, list, i$, ref$, len$, event_name, item;
        waiting_events[index] = null;
        done = true;
        list = document.getElementById("loading-list");
        list.innerHTML = "";
        for (i$ = 0, len$ = (ref$ = waiting_events).length; i$ < len$; ++i$) {
          event_name = ref$[i$];
          if (event_name == null) {
            continue;
          }
          item = document.createElement("li");
          item.innerHTML = event_name;
          list.appendChild(item);
          done = false;
        }
        if (done) {
          document.getElementById("loading").setAttribute("style", "display:none;");
          init();
        }
      };
    };
    Chem.resources.on("ready", create_wait_condition("sprites"));
    map_is_ready = create_wait_condition("map");
    request = new XMLHttpRequest();
    request.onreadystatechange = function(){
      if (!(request.readyState === 4 && request.status === 200)) {
        return;
      }
      map = Map.parse(request.responseText, create_wait_condition);
      map_is_ready();
    };
    request.open("GET", "map.tmx", true);
    request.send();
  }.call(this));
  init = function(){
    var canvas, canvas_center, engine, standard_gravity, sounds, buttons, view_scale, world, gravity_zones, debug_drawer, debug_drawing, man, world_to_canvas, get_view_aabb;
    canvas = document.getElementById("game");
    canvas_center = new Chem.Vec2d(canvas.getAttribute("width") / 2, canvas.getAttribute("height") / 2);
    engine = new Chem.Engine(canvas);
    standard_gravity = new b2Vec2(0, 30);

    engine.buttonCaptureExceptions[Chem.button.KeyCtrl] = true;
    engine.buttonCaptureExceptions[Chem.button.KeyAlt] = true;
    for (var i = 1; i <= 12; i++) {
      engine.buttonCaptureExceptions[Chem.button["KeyF" + i]] = true;
    }

    sounds = {
      bchs: new Chem.Sound("sfx/bchs.ogg")
    };
    buttons = {
      left: Chem.Button.KeyA,
      right: Chem.Button.KeyD,
      crouch: Chem.Button.KeyS,
      jump: Chem.Button.KeyK,
      pew: Chem.Button.KeyJ,
      debug: Chem.Button.KeyGrave
    };
    view_scale = map.scale;
    world = null;
    gravity_zones = [];
    debug_drawer = null;
    debug_drawing = false;
    man = new Man;
    window._debug_man = man;
    (function(){
      var fixture_def, stretch_floor_start, stretch_floor_end, flush_strech_floor, y, ref$, len$, row, x, len1$, value, i$, ref1$, len2$, object, gravity_scale, priority, body_def, torso_def, ground_sensor_def;
      world = new b2World(new b2Vec2(), true);
      debug_drawer = new b2DebugDraw();
      debug_drawer.SetSprite(canvas.getContext("2d"));
      debug_drawer.SetDrawScale(view_scale);
      debug_drawer.SetFillAlpha(0.5);
      debug_drawer.SetLineThickness(1);
      debug_drawer.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
      world.SetDebugDraw(debug_drawer);
      fixture_def = new b2FixtureDef();
      fixture_def.density = 1.0;
      fixture_def.friction = 0.5;
      fixture_def.restitution = 0;
      fixture_def.shape = new b2PolygonShape();
      stretch_floor_start = null;
      stretch_floor_end = null;
      flush_strech_floor = function(){
        var body_def;
        if (stretch_floor_start == null) {
          return;
        }
        body_def = new b2BodyDef();
        body_def.type = b2Body.b2_staticBody;
        body_def.position.x = (stretch_floor_start.x + stretch_floor_end.x) / 2;
        body_def.position.y = (stretch_floor_start.y + stretch_floor_end.y) / 2;
        fixture_def.shape.SetAsBox((stretch_floor_end.x - stretch_floor_start.x) / 2, (stretch_floor_end.y - stretch_floor_start.y) / 2);
        world.CreateBody(body_def).CreateFixture(fixture_def);
        return stretch_floor_start = null;
      };
      for (y = 0, len$ = (ref$ = map.physics_layer).length; y < len$; ++y) {
        row = ref$[y];
        for (x = 0, len1$ = row.length; x < len1$; ++x) {
          value = row[x];
          if (value !== 0) {
            if (stretch_floor_start == null) {
              stretch_floor_start = new b2Vec2(x, y);
            }
            stretch_floor_end = new b2Vec2(x + 1, y + 1);
          } else {
            flush_strech_floor();
          }
        }
        flush_strech_floor();
      }
      for (i$ = 0, len2$ = (ref1$ = map.objects).length; i$ < len2$; ++i$) {
        object = ref1$[i$];
        gravity_scale = parseFloat(object.properties.gravity_scale);
        priority = parseFloat(object.properties.priority);
        if (!isNaN(gravity_scale) && !isNaN(priority)) {
          gravity_zones.push({
            scale: gravity_scale,
            priority: priority,
            aabb: make_aabb(object.x / map.scale, object.y / map.scale, (object.x + object.width) / map.scale, (object.y + object.height) / map.scale)
          });
        }
      }
      gravity_zones.sort(function(a, b){
        if (a.priority < b.priority) {
          return -1;
        } else if (a.priority > b.priority) {
          return 1;
        } else {
          return 0;
        }
      });
      body_def = new b2BodyDef();
      body_def.type = b2Body.b2_dynamicBody;
      body_def.position.x = 40;
      body_def.position.y = 43;
      body_def.fixedRotation = true;
      man.body = world.CreateBody(body_def);
      man.body.SetUserData(man.standing_sprite);
      torso_def = new b2FixtureDef();
      torso_def.density = 1.0;
      torso_def.friction = 0;
      torso_def.shape = man.get_torso_shape();
      man.torso_fixture = man.body.CreateFixture(torso_def);
      ground_sensor_def = new b2FixtureDef();
      ground_sensor_def.density = 0;
      ground_sensor_def.isSensor = true;
      ground_sensor_def.shape = man.get_ground_sensor_shape(1);
      man.ground_sensors[1] = man.body.CreateFixture(ground_sensor_def);
      ground_sensor_def.shape = man.get_ground_sensor_shape(-1);
      man.ground_sensors[-1] = man.body.CreateFixture(ground_sensor_def);
      man.mass = man.body.GetMass();
    }.call(this));
    engine.on('update', function(dt, dx){
      var position, man_velocity, horizontal_intention, magic_max_velocity, get_horizontal_direction, direction, new_direction, gravity, i$, ref$, ref1$, scale, aabb, gravity_direction, jump_impulse, jump_stop, sprite;
      if (engine.buttonJustPressed(buttons.debug)) {
        debug_drawing = !debug_drawing;
      }
      man.is_grounded = function(){
        var ground_sensor, contact_edge, contact;
        ground_sensor = man.get_ground_sensor();
        contact_edge = man.body.GetContactList();
        while (contact_edge) {
          contact = contact_edge.contact;
          if (contact.IsTouching()) {
            if (contact.GetFixtureA() === ground_sensor || contact.GetFixtureB() === ground_sensor) {
              return true;
            }
          }
          contact_edge = contact_edge.next;
        }
        return false;
      }();
      man.is_crouching = engine.buttonState(buttons.crouch);
      if (man.was_crouching !== man.is_crouching) {
        man.torso_fixture.m_shape = man.get_torso_shape();
        man.ground_sensors[1].m_shape = man.get_ground_sensor_shape(1);
        man.ground_sensors[-1].m_shape = man.get_ground_sensor_shape(-1);
        man.reset_mass();
        if (man.is_crouching && man.is_grounded) {
          position = man.body.GetPosition().Copy();
          position.y += man.gravity_direction * (man.standing_half_height - man.crouching_half_height);
          man.body.SetPosition(position);
        }
      }
      man_velocity = man.body.GetLinearVelocity();
      horizontal_intention = 0;
      if (engine.buttonState(buttons.left)) {
        horizontal_intention--;
      }
      if (engine.buttonState(buttons.right)) {
        horizontal_intention++;
      }
      magic_max_velocity = horizontal_intention * man.max_speed;
      if (horizontal_intention * man_velocity.x < horizontal_intention * magic_max_velocity) {
        man.body.ApplyImpulse(new b2Vec2(2.0 * horizontal_intention, 0), man.body.GetPosition());
      }
      if (man.is_grounded && horizontal_intention === 0) {
        if (!man.was_grounded) {
          man.body.SetLinearVelocity({
            x: 0,
            y: 0
          });
        } else {
          get_horizontal_direction = function(){
            return sign(man_velocity.x);
          };
          direction = get_horizontal_direction();
          if (direction !== 0) {
            man.body.ApplyImpulse(new b2Vec2(-2.0 * direction, 0), man.body.GetPosition());
            new_direction = get_horizontal_direction();
            if (new_direction !== 0 && new_direction !== direction) {
              man.body.SetLinearVelocity({
                x: 0,
                y: 0
              });
            }
          }
        }
      }
      gravity = standard_gravity.Copy();
      for (i$ = (ref$ = gravity_zones).length - 1; i$ >= 0; --i$) {
        ref1$ = ref$[i$], scale = ref1$.scale, aabb = ref1$.aabb;
        if (aabb_contains_point(aabb, man.body.GetPosition())) {
          gravity.Multiply(scale);
          break;
        }
      }
      gravity.Multiply(man.body.GetMass());
      man.body.ApplyForce(gravity, man.body.GetPosition());
      gravity_direction = sign(gravity.y);
      if (man.gravity_direction !== gravity_direction) {
        man.is_jumping = false;
      }
      if (gravity_direction === 0) {
        gravity_direction = man.gravity_direction;
      }
      man.gravity_direction = gravity_direction;
      if (man.is_grounded && engine.buttonJustPressed(buttons.jump)) {
        jump_impulse = man.jump_impulse.Copy();
        jump_impulse.y *= gravity_direction;
        man.body.ApplyImpulse(jump_impulse, man.body.GetPosition());
        man.is_jumping = true;
      }
      if (man.is_jumping) {
        jump_stop = gravity_direction * man.jump_stop;
        if (gravity_direction * man_velocity.y < gravity_direction * jump_stop) {
          if (!engine.buttonState(buttons.jump)) {
            man_velocity.y = jump_stop;
            man.is_jumping = false;
          }
        } else {
          man.is_jumping = false;
        }
      }
      if (engine.buttonJustPressed(buttons.pew)) {
        sounds.bchs.play();
      }
      if (horizontal_intention !== 0) {
        man.facing_direction = horizontal_intention;
      }
      sprite = man.is_crouching
        ? man.crouching_sprite
        : man.standing_sprite;
      sprite.scale.x = man.facing_direction;
      sprite.scale.y = man.gravity_direction;
      man.body.SetUserData(sprite);
      world.Step(dt, 10, 10);
      world.ClearForces();
      man.was_grounded = man.is_grounded;
      return man.was_crouching = man.is_crouching;
    });
    world_to_canvas = function(it){
      var in_pixels;
      in_pixels = new Chem.Vec2d(it).scale(view_scale);
      in_pixels.floor();
      return in_pixels;
    };
    get_view_aabb = function(){
      var position;
      position = man.body.GetPosition();
      return make_aabb(position.x - canvas_center.x / view_scale, position.y - canvas_center.y / view_scale, position.x + canvas_center.x / view_scale, position.y + canvas_center.y / view_scale);
    };
    var fpsLabel = engine.createFpsLabel();
    engine.on('draw', function(context){
      var view_aabb, sprite_batch;
      context.fillStyle = '#000000';
      context.fillRect(0, 0, engine.size.x, engine.size.y);
      context.save();
      (function(center){
        context.translate(-center.x, -center.y);
      }.call(this, world_to_canvas(new Chem.Vec2d(man.body.GetPosition())).sub(canvas_center)));
      if (debug_drawing) {
        world.DrawDebugData();
      } else {
        view_aabb = get_view_aabb();
        map.draw_tiles(context, view_aabb);
        sprite_batch = new Chem.Batch();
        query_aabb(world, view_aabb, function(fixture){
          var body, sprite;
          body = fixture.GetBody();
          sprite = body.GetUserData();
          if (sprite instanceof Chem.Sprite) {
            sprite.pos = world_to_canvas(body.GetPosition());
            sprite_batch.add(sprite);
          }
          return body = body.m_next;
        });
        sprite_batch.draw(context);
      }
      context.restore();
      context.fillStyle = '#ffffff';
      fpsLabel.draw(context);
      context.fillText("grounded = " + man.is_grounded, 100, canvas_center.y * 2);
      return context.fillText("jumping = " + man.is_jumping, 200, canvas_center.y * 2);
    });
    engine.start();
    return canvas.focus();
  };
}).call(this);
