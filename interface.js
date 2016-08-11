var graphics, sound, env, startTime, ellapsedTime, accumulator, canvas;
var envsActive, touchStartPos, numTouches, isGesture;

$('document').ready(function(){

  graphics = new Graphics();
  sound = new Sound();
  var mousePos = new THREE.Vector2(0,0);

  touchStartPos = new THREE.Vector2();

  startTime = new Date().getTime();
  ellapsedTime = 0;
  accumulator = 0;
  isGesture = false;

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

      if(numTouches > 5){

        var n = new THREE.Vector2(
          e.touches[0].clientX /canvas.width,
          e.touches[0].clientY / canvas.height
        );

        var v1 = new THREE.Vector2().subVectors(n ,mousePos);
        mousePos.copy(n);

        var v2 = new THREE.Vector2().subVectors(mousePos, touchStartPos);

        if(
          Math.abs(v2.angle() - Math.PI/2) < 0.2
          && v1.length() > 0.002
        )
        {

          for(var i = 0; i < env.length; i++)
          {
            env[i].targetVal = 1.0;
          }

          isGesture = true;

        }
        else
        {
          for(var i = 0; i < env.length; i++)
          {
            env[i].targetVal = 0.0;
          }

          isGesture = false;
        }
      }


    }, false);

    canvas.addEventListener('touchend', function(e) {

      for(var i = 0; i < env.length; i++)
      {
        env[i].targetVal = 0.0;
      }

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



      for(var i = 0; i < env.length; i++)
      {
        env[i].targetVal = 1.0;
      }


    }, false);

    canvas.addEventListener('mouseup', function() {

      for(var i = 0; i < env.length; i++)
      {
        env[i].targetVal = 0.0;
      }

    }, false);

  canvas.addEventListener("mousemove", function (e) {

        mousePos.set(
          e.clientX/canvas.width,
          e.clientY/canvas.height
        );


   }, false);




  function render() {

    var n_et = (new Date().getTime() - startTime) * 0.001;
    accumulator += (n_et - ellapsedTime);
    ellapsedTime = n_et;

    //console.log(ellapsedTime)

    if(accumulator > 1.0/60)
    {

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
