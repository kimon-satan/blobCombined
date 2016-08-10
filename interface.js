var graphics, sound, env, startTime, ellapsedTime, accumulator, canvas, envsActive;

$('document').ready(function(){

  graphics = new Graphics();
  sound = new Sound();
  var mousePos = new THREE.Vector2(0,0);


  startTime = new Date().getTime();
  ellapsedTime = 0;
  accumulator = 0;

  env = [
    new Envelope2(0.01,0.2,60),
    new Envelope2(0.01,0.2,60),
    new Envelope2(0.01,0.2,60)
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
      }

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




/*----------------------------------------GUI----------------------------------------------*/

// var ControlPanel = function() {
//
//   for (var property in uniforms) {
//     if (uniforms.hasOwnProperty(property)) {
//         if(uniforms[property].gui){
//         	if( uniforms[property].value instanceof THREE.Vector2)
//         	{
// 				this[property + "_x"] = uniforms[property].value.x;
// 				this[property + "_y"] = uniforms[property].value.y;
// 			}
// 			else if(uniforms[property].type == "color")
// 	  		{
// 	  			this[property] = "#ffffff";
//         	}else{
//         		this[property] = uniforms[property].value;
//         	}
//
//         }
//     }
//   }
//
//
// };
//
// window.onload = function()
// {
//   var controlPanel = new ControlPanel();
//   var gui = new dat.GUI();
//   gui.remember(controlPanel);
//   var events = {};
//
//   for (var property in uniforms) {
//   	if (uniforms.hasOwnProperty(property)) {
//   		if(uniforms[property].gui){
//
//   			if( uniforms[property].value instanceof THREE.Vector2)
//         	{
//         		var coord = ["x", "y"];
//
//         		for(var i = 0; i < 2; i++)
//         		{
//
// 	        		events[property + "_" + coord[i]] = gui.add(controlPanel, property + "_" + coord[i], uniforms[property].min, uniforms[property].max);
//
// 		  			events[property + "_" + coord[i]].onChange(function(value) {
// 		  				var key = this.property.substring(0, this.property.length - 2);
// 					 	uniforms[key].value[this.property.substring(this.property.length - 1)] = value;
// 					});
//
// 	  			}
//
// 	  		}
// 	  		else if(uniforms[property].type == "color")
// 	  		{
// 	  			events[property] = gui.addColor(controlPanel, property);
//
// 	  			events[property].onChange(function(value) {
//
// 	  				var col = hexToFloat(value);
//
// 					uniforms[this.property].value.x = col[0];
// 					uniforms[this.property].value.y = col[1];
// 					uniforms[this.property].value.z = col[2];
//
// 	  			});
//         	}
//         	else
//         	{
// 	  			events[property] = gui.add(controlPanel, property, uniforms[property].min, uniforms[property].max);
//
// 	  			events[property].onChange(function(value) {
// 				  uniforms[this.property].value = value;
// 				});
//
//   			}
//   		}
//   	}
//   }
//
//
//
//
//
//
//
//
// };


/////////////////////////////////HELPERS/////////////////////////////////
