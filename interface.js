var graphics, sound, env, startTime, ellapsedTime, accumulator, canvas;
var envsActive, touchStartPos, numTouches, newTouch , isGesture, isMouseDown;
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



    if(Math.abs(v2.angle() - Math.PI/2) < 0.2 && v1.y > 0)
    {

      if(currentGesture == 0) //only set the getsure if one hasn't already been assigned
      {
        currentGesture = 1;
      }

      if(currentGesture == 1)
      {
        console.log("g1");
        isGesture = true;
        setEnvTargets(1.);
      }
    }
    else if (Math.abs(v2.angle() - Math.PI * 1.5) < 0.2 && v1.y < 0)
    {



      if(currentGesture == 0)
      {
        currentGesture = 2;
      }

      if(currentGesture == 2) // NB. should be optimised
      {
        console.log("g2");

        isGesture = true;
        setEnvTargets(1.);
      }

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

      graphics.draw(ellapsedTime, mousePos);
      sound.update(ellapsedTime, mousePos); // ultimately we don't need mousePos
    }

  	requestAnimationFrame( render );

  }

  render();

});
