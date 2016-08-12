var graphics, sound, env, startTime, ellapsedTime, accumulator, canvas;
var envsActive, touchStartPos, numTouches, newTouch , isGesture;

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

      isGesture = false;

      touchStartPos.copy(mousePos);

      if(!sound.isUnlocked)
      {
        sound.unlock();
      }

      //hard restart
      //... might be good to have only some envelopes working this way
      for(var i = 0; i < env.length; i++)
      {
        env[i].targetVal = 0.0;
        env[i].z = 0.0;
      }

      numTouches = 0;


    }, false);

    canvas.addEventListener('touchmove', function(e){

      //TODO detect when touches are not moving at all in update

      numTouches++;
      newTouch = true;

      if(numTouches > 5){

        var n = new THREE.Vector2(
          e.touches[0].clientX /canvas.width,
          e.touches[0].clientY / canvas.height
        );

        var v1 = new THREE.Vector2().subVectors(n ,mousePos);
        mousePos.copy(n);

        var v2 = new THREE.Vector2().subVectors(mousePos, touchStartPos);

        if(v1.length() < 0.002)
        {
          isGesture = false;
          setEnvTargets(0);
          return;
        }

        if(Math.abs(v2.angle() - Math.PI/2) < 0.2)
        {
          setEnvTargets(1.) //gesture 1
          isGesture = true;
        }
        else if (Math.abs(v2.angle() - Math.PI * 1.5) < 0.2)
        {
          console.log("gesture 2") //gesture 2
        }
        else
        {
          setEnvTargets(0.)
          isGesture = false;
        }

      }


    }, false);

    canvas.addEventListener('touchend', function(e) {

      setEnvTargets(0.)

      isGesture = false;

    }, false);


    canvas.addEventListener('mousedown', function(e) {

      mousePos.set(
        e.clientX/canvas.width,
        e.clientY/canvas.height
      );

      if(!sound.isUnlocked){
        sound.isUnlocked = true;
      }

      setEnvTargets(1.)




    }, false);

    canvas.addEventListener('mouseup', function() {

      setEnvTargets(0.)

    }, false);

  canvas.addEventListener("mousemove", function (e) {

        mousePos.set(
          e.clientX/canvas.width,
          e.clientY/canvas.height
        );


   }, false);

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

      graphics.draw(ellapsedTime, mousePos);
      sound.update(ellapsedTime, mousePos); // ultimately we don't need mousePos
    }

  	requestAnimationFrame( render );

  }

  render();

});
