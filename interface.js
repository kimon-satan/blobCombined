var graphics, sound, startTime, ellapsedTime, accumulator, canvas;
var envsActive, touchStartPos, numTouches, newTouch , isGesture, isMouseDown;
var env, stateEnvelope, stateIndex, changingState; //handling progression
var currentGesture;

$('document').ready(function(){

  graphics = new Graphics();
  sound = new Sound();
  var mousePos = new THREE.Vector2(0,0);

  touchStartPos = new THREE.Vector2();

  startTime = new Date().getTime();
  ellapsedTime = 0;
  accumulator = 0;
  isGesture = false;
  newTouch = false;
  isMouseDown = false;

  stateEnvelope = new Envelope(10, 60);
  changingState = false;
  stateIndex = 0;
  graphics.initState();
  changeState();

  env = [
    new Envelope2(0.1,0.01,60),
    new Envelope2(1.0,0.2,60),
    new Envelope2(2.0,0.2,60),
    new Envelope(2.0, 60) //latched by default
  ];


  canvas = graphics.canvas; //we need the canvas for the eventListeners

  canvas.addEventListener('touchstart', function(e) {

      mousePos.set(
        e.touches[0].clientX /canvas.width,
        e.touches[0].clientY / canvas.height
      );


      if(!sound.isUnlocked)
      {
        sound.unlock();
      }

      gestureStart();


    }, false);

    canvas.addEventListener('touchmove', function(e){


      var p = new THREE.Vector2(
        e.touches[0].clientX /canvas.width,
        e.touches[0].clientY / canvas.height
      );

      gestureMove(p);

    }, false);

    canvas.addEventListener('touchend', function(e) {

      gestureEnd();
    }, false);


    canvas.addEventListener('mousedown', function(e) {

      mousePos.set(
        e.clientX/canvas.width,
        e.clientY/canvas.height
      );

      if(!sound.isUnlocked){
        sound.isUnlocked = true;
      }

      gestureStart();

      isMouseDown = true;


    }, false);



  canvas.addEventListener("mousemove", function (e) {

        var pos = new THREE.Vector2(
          e.clientX/canvas.width,
          e.clientY/canvas.height
        );

        if(isMouseDown)
        {
          gestureMove(pos);
        }

   }, false);

   canvas.addEventListener('mouseup', function() {

     isMouseDown = false;
     gestureEnd();

   }, false);


////////////////////////////////////////////////////////

function gestureStart()
{
  isGesture = false;
  currentGesture = 0;

  touchStartPos.copy(mousePos);

  //hard restart
  //... might be good to have only some envelopes working this way
  for(var i = 0; i < env.length; i++)
  {
    env[i].targetVal = 0.0;
    env[i].z = 0.0;
  }

  numTouches = 0;
}

function gestureMove(pos)
{
  numTouches++;
  newTouch = true;

  if(numTouches > 5){

    var v1 = new THREE.Vector2().subVectors(pos ,mousePos);
    mousePos.copy(pos);

    var v2 = new THREE.Vector2().subVectors(mousePos, touchStartPos);

    if(v1.length() < 0.002)
    {
      isGesture = false;
      setEnvTargets(0);
      return;
    }

    var a = v2.angle();

    if(Math.abs(a - Math.PI/2) < 0.2 && v1.y > 0)
    {
        updateGesture(1);
    }
    else if (Math.abs(a - Math.PI * 1.5) < 0.2 && v1.y < 0)
    {
        updateGesture(2);
    }
    else if(Math.abs(a - Math.PI) < 0.2 && v1.x < 0)
    {
        updateGesture(3);
    }
    else if(Math.min(a, Math.abs(a - Math.PI * 2.)) < 0.2 && v1.x > 0)
    {
        updateGesture(4);
    }
    else
    {
      setEnvTargets(0.)
      isGesture = false;
    }

  }

}

function gestureEnd()
{
  setEnvTargets(0.)
  isGesture = false;

}

function updateGesture(ng)
{
  if(currentGesture == 0)
  {
    currentGesture = ng;
    sound.setReaction(currentGesture -1);
  }

  if(currentGesture == ng)
  {
    isGesture = true;
    setEnvTargets(1.);
  }
}





/////////////////////////////////////////////////////////


  function setEnvTargets(target)
  {
    for(var i = 0; i < env.length; i++)
    {
      env[i].targetVal = target;
    }
  }


  function render() {

    var n_et = (new Date().getTime() - startTime) * 0.001;
    accumulator += (n_et - ellapsedTime);
    ellapsedTime = n_et;

    //console.log(ellapsedTime)

    if(accumulator > 1.0/60)
    {


      if(newTouch)
      {
        newTouch = false;
      }
      else
      {
        numTouches = 0;
        setEnvTargets(0);
      }


      for(var i = 0; i < env.length; i++)
      {
        env[i].step();
      }

      envsActive = false;

      for(var i = 0; i < env.length; i++)
      {
        if(env[i].z > 0.005)
        {
          envsActive = true;
          break;
        }
      }

      if(!envsActive)
      {
        currentGesture = 0;
      }

      if(isGesture)
      {
        updateState();
      }

      graphics.draw(ellapsedTime, mousePos);
      sound.update(ellapsedTime, mousePos); // ultimately we don't need mousePos
    }

  	requestAnimationFrame( render );

  }

  render();

});

function updateState()
{
  //TODO make methods for shifting between vectors
  if(!changingState)return;

  stateEnvelope.step();

  if(stateEnvelope.z < 0.99)
  {
    //call the graphics update
    graphics.updateState();
  }
  else
  {
      changingState = false;
      changeState(); // keep moving through states
  }
}

function changeState()
{
  stateIndex += 1;

  stateEnvelope.z = 0.0;
  stateEnvelope.targetVal = 1.0;
  changingState = true;

  //call the graphics update
  graphics.changeState();
}
