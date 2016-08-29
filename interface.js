var iface;

$.getScript("utils.js", function(){});
$.getScript("graphics.js", function(){});
$.getScript("sound.js", function(){});

setup();

function setup()
{
  if(window.Graphics != undefined && window.Sound != undefined)
  {
    iface = new Interface();
    iface.init();
  }
  else
  {
    window.setTimeout(setup, 10);
  }
}

function Interface(){

  this.graphics
  this.sound
  this.startTime
  this.ellapsedTime
  this.accumulator
  this.canvas

  this.mousePos
  this.touchStartPos
  this.numTouches

  this.isNewTouch
  this.isGesture
  this.currentGesture
  this.isMouseDown


  this.envsActive
  this.reactEnvelopes
  this.currentReactionMap


  this.stateEnvelope
  this.stateIndex
  this.isChangingState

  this.reactionMaps =
  {
    0:[  { z: 0.,
        map: [
        undefined,
        undefined,
        undefined,
        undefined,
        undefined]
      }
    ],
    1:[
        { z: 1.,
          map: [
          undefined,
          {graphics: "shudderThetaUp", sound: "pigeonUp" },
          undefined,
          undefined,
          undefined]
        },
        { z: 1.5,
          map: [
          undefined,
          {graphics: "shudderThetaUp", sound: "pigeonUp" },
          {graphics: "shudderThetaDown", sound: "pigeonDown" },
          undefined,
          undefined]
        }
      ],
    2: [],
    3: [],
    4: []
  }

  this.init = function()
  {

    this.graphics = new Graphics();
    this.graphics.init();
    this.sound = new Sound();
    this.sound.init();

    this.mousePos = new THREE.Vector2();
    this.touchStartPos = new THREE.Vector2();

    this.startTime = new Date().getTime();
    this.ellapsedTime = 0;
    this.accumulator = 0;

    this.isGesture = false;
    this.isNewTouch = false;
    this.isMouseDown = false;

    this.stateEnvelope = new Envelope(10, 60);
    this.stateIndex = 0;
    this.isChangingState = false; //false will pause the process

    this.explodeEnvelope = new Envelope(1, 60);
    this.explodeEnvelope.targetVal = 1.0;
    this.isExplodeOn = true;


    this.reactEnvelopes = [
      new Envelope2(0.1,0.01,60),
      new Envelope2(1.0,0.2,60),
      new Envelope2(2.0,0.2,60),
      new Envelope(2.0, 60) //latched by default
    ];


    this.currentReactionMap = this.reactionMaps[0][0];

    this.graphics.initState();
    this.changeState();


    ///////////////////////SETUP EVENTS////////////////////////////////////////

    this.canvas = this.graphics.canvas; //we need the canvas for the eventListeners

    this.canvas.addEventListener('touchstart', function(e)
    {

      this.mousePos.set(
        e.touches[0].clientX /this.canvas.width,
        e.touches[0].clientY / this.canvas.height
      );

      if(!this.sound.isUnlocked)
      {
        this.sound.unlock();
      }
      this.gestureStart();

    }.bind(this)
    , false);

    this.canvas.addEventListener('touchmove', function(e)
    {
      var p = new THREE.Vector2(
        e.touches[0].clientX /this.canvas.width,
        e.touches[0].clientY / this.canvas.height
      );
      this.gestureMove(p);
    }.bind(this)
    , false);

    this.canvas.addEventListener('touchend', function(e)
    {
      this.gestureEnd();
    }.bind(this)
    , false);


    this.canvas.addEventListener('mousedown', function(e)
    {
      this.mousePos.set(
        e.clientX/this.canvas.width,
        e.clientY/this.canvas.height
      );

      if(!this.sound.isUnlocked)
      {
        this.sound.isUnlocked = true;
      }
      this.gestureStart();
      this.isMouseDown = true;
    }.bind(this)
    , false);

    this.canvas.addEventListener("mousemove", function (e)
    {
      var pos = new THREE.Vector2(
        e.clientX/this.canvas.width,
        e.clientY/this.canvas.height
      );

      if(this.isMouseDown)
      {
        this.gestureMove(pos);
      }
    }.bind(this)
    , false);

    this.canvas.addEventListener('mouseup', function()
    {
      this.isMouseDown = false;
      this.gestureEnd();
    }.bind(this)
    , false);

    //start rendering
    this.render();
  }

  this.gestureStart = function ()
  {
    this.isGesture = false;
    this.currentGesture = 0;

    this.touchStartPos.copy(this.mousePos);

    //hard restart
    //... might be good to have only some envelopes working this way
    for(var i = 0; i < this.reactEnvelopes.length; i++)
    {
      this.reactEnvelopes[i].targetVal = 0.0;
      this.reactEnvelopes[i].z = 0.0;
    }

    this.numTouches = 0;
  }

  this.gestureMove = function (pos)
  {
    this.numTouches++;
    this.isNewTouch = true;

    if(this.numTouches > 5){

      var v1 = new THREE.Vector2().subVectors(pos ,this.mousePos);
      this.mousePos.copy(pos);

      var v2 = new THREE.Vector2().subVectors(this.mousePos, this.touchStartPos);
      var a = v2.angle();

      if(v1.length() < 0.002)
      {
        this.gestureEnd();
      }
      else if(Math.abs(a - Math.PI/2) < 0.2 && v1.y > 0)
      {
        this.updateGesture(1);
      }
      else if (Math.abs(a - Math.PI * 1.5) < 0.2 && v1.y < 0)
      {
        this.updateGesture(2);
      }
      else if(Math.abs(a - Math.PI) < 0.2 && v1.x < 0)
      {
        this.updateGesture(3);
      }
      else if(Math.min(a, Math.abs(a - Math.PI * 2.)) < 0.2 && v1.x > 0)
      {
        this.updateGesture(4);
      }
      else
      {
        this.gestureEnd();
      }

    }

  }

  this.gestureEnd = function()
  {
    this.setEnvTargets(0.)
    this.isGesture = false;
  }

  this.updateGesture = function(ng)
  {
    this.isGesture = false;

    if(this.currentGesture == 0 )
    {
      this.isGesture = true;
      this.currentGesture = ng;

      //console.log(this.currentGesture, this.currentReactionMap.map[this.currentGesture]);

      if(this.currentReactionMap.map[this.currentGesture] != undefined)
      {

        this.sound.setReaction(this.currentReactionMap.map[this.currentGesture].sound);
        this.graphics.setReaction(this.currentReactionMap.map[this.currentGesture].graphics);
      }
      else
      {
        this.sound.setReaction();
        this.graphics.setReaction();
      }
    }

    if(this.currentGesture == ng)
    {
      this.isGesture = true;
      this.setEnvTargets(1.);
    }
    else
    {
      this.isGesture = false;
    }
  }

  this.setEnvTargets = function(target)
  {
    for(var i = 0; i < this.reactEnvelopes.length; i++)
    {
      this.reactEnvelopes[i].targetVal = target;
    }
  }


  this.render = function() {

    var n_et = (new Date().getTime() - this.startTime) * 0.001;
    this.accumulator += (n_et - this.ellapsedTime);
    this.ellapsedTime = n_et;

    //console.log(ellapsedTime)

    if(this.accumulator > 1.0/60)
    {

      if(this.isNewTouch)
      {
        this.isNewTouch = false;
      }
      else
      {
        this.numTouches = 0;
        this.setEnvTargets(0);
      }

      for(var i = 0; i < this.reactEnvelopes.length; i++)
      {
        this.reactEnvelopes[i].step();
      }

      //check if any of the envelopes are active
      this.envsActive = false;

      for(var i = 0; i < this.reactEnvelopes.length; i++)
      {
        if(this.reactEnvelopes[i].z > 0.005)
        {
          this.envsActive = true;
          break;
        }
      }

      if(!this.envsActive)
      {
        this.gestureEnd(); // just incase it was missed

        //check for latest reactionMap

        var cz = 0;

        if(this.reactionMaps[this.stateIndex] != undefined)
        {
          for(i in this.reactionMaps[this.stateIndex])
          {
            var rm = this.reactionMaps[this.stateIndex][i];
            var z = rm.z%1;
            if(z >= cz &&
               rm.z >= this.currentReactionMap.z
               && this.stateEnvelope.z >= z)
            {
              cz = z;
              this.currentReactionMap = rm;
            }
          }
        }


      }
      else if(this.isGesture)
      {
        this.updateState(); //only updateState if a gesture is happening
      }


      this.graphics.updateReactions(this.envsActive, this.reactEnvelopes);
      if(this.isExplodeOn)
      {
        this.graphics.updateExplosion(this.explodeEnvelope);

      }

      // ultimately we don't need mousePos
      this.graphics.draw(this.ellapsedTime, this.mousePos);
      this.sound.update(this.ellapsedTime, this.mousePos, this.envsActive, this.reactEnvelopes);
    }

    requestAnimationFrame( this.render );

  }.bind(this);

  this.updateState = function()
  {

    if(this.isExplodeOn)
    {
      this.explodeEnvelope.step();
      if(this.explodeEnvelope.z > 0.99)
      {
        console.log("bang");
        this.graphics.explode(this.ellapsedTime);
        this.explodeEnvelope.z = 0.0;
      }
    }

    if(this.changingState){

      this.stateEnvelope.step();

      if(this.stateEnvelope.z < 0.99)
      {
        this.graphics.updateState(this.stateEnvelope);
      }
      else
      {
        this.changingState = false;
        this.changeState(); // keep moving through states
      }

    }

  }

  this.changeState = function()
  {
    this.stateIndex += 1;

    //modify the reactionMap here ?

    this.stateEnvelope.z = 0.0;
    this.stateEnvelope.targetVal = 1.0;
    this.changingState = true;

    //call the graphics update
    this.graphics.changeState(this.stateIndex);
  }



}
