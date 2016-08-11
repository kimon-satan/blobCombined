var graphics, sound, env, startTime, ellapsedTime, accumulator, canvas, envsActive;

$('document').ready(function(){

  graphics = new Graphics();
  sound = new Sound();
  var mousePos = new THREE.Vector2(0,0);


  startTime = new Date().getTime();
  ellapsedTime = 0;
  accumulator = 0;

  env = [
    new Envelope2(0.01,0.05,60),
    new Envelope2(1.0,0.2,60),
    new Envelope2(2.0,4.0,60)
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

      for(var i = 0; i < env.length; i++)
      {
        env[i].targetVal = 1.0;
        env[i].z = 0.0;
      }

      graphics.triggerReaction();
      //graphics.changeState();

    }, false);

    canvas.addEventListener('touchend', function(e) {

      for(var i = 0; i < env.length; i++)
      {
        env[i].targetVal = 0.0;
      }

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
