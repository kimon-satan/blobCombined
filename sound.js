

//NB this will need to be split in AC and synth classes if there are multiple sound streams

var files = [
'138344_reverse_crow.wav',
'169830_dino009.wav',
'19997_blackbird.wav',
'19997_blackbird_flap.wav',
'20472_woodpigeonnr_01.wav',
'20472_woodpigeonnr_02.wav',
'20472_woodpigeonnr_03.wav',
'235443_sandhill-crane.wav',
'240476_wings_.wav',
'262307__steffcaffrey__cat-happy-purr-twitter2.wav',
'262308__steffcaffrey__cat-happy-purr-twit3.wav',
'262310__steffcaffrey__cat-purr-twit5.wav',
'262311__steffcaffrey__cat-purr-twit6.wav',
'278903__syntheway__guardians-of-limbo-syntheway-magnus-choir-vsti.wav',
'319512_pigeon_low.wav',
'319512_pigeon_select.wav',
'57271_cat-bird.wav',
'66637_crying-baby-2.wav',
'66637_crying-baby-2b.wav',
'66637_crying-baby-3.wav',
'66637_crying-baby-4.wav',
'66637_crying-baby-select.wav',
];

var Sound = function(){

//GLOBALS

  this.audioContext;
  this.compressor;
  this.buffer = 0;
  this.bufferDuration = 0.0;

  this.realTime = 0.0;
  this.grainTime = 0.0;

  this.isSourceLoaded = false;
  this.applyGrainWindow = false;
  this.grainWindow;

  //IOS hack
  this.isUnlocked = false;


  this.file = files[0];

  this.parameters =
  {
    amp: {value: 0.0, min: 0.0, max: 1.0, gui: true , step: 0.01, map: 0},
    speed: {value: 0.0, min: -4.0, max: 4.0, gui: true , step: 0.01},
    pitch: {value: 1.0, min: 1.0, max: 3600, gui: true, step: 10},
    pitchRandomization: {value: 0.0, min: 0.0, max: 1200.0, gui: true, step: 10},
    timeRandomization:{value: 0.01 , min:0.0, max:1.0, gui:true , step : 0.01},
    grainSize:{value: 0.09 , min:0.010, max:0.5, gui:true , custom: true, step: 0.01},
    grainDuration:{value: 0.09 , min:0.010, max:0.5, gui:true , step: 0.001},
    grainSpacing:{value: 0.045 , min:0.010, max:0.5, gui:true , step: 0.001},
    regionStart: {value: 0.01 , min:0.0, max:1.0, gui:true , step : 0.001},
    regionLength: {value: 0.01 , min:0.0, max:10.0, gui:true , step : 0.01}
  }


///////////////////////////////////INTERACTION SETUP////////////////////////////

  this.init = function(){


    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();

    this.realTime = Math.max(0, this.audioContext.currentTime);

    if (this.audioContext.decodeAudioData)
    {
      this.applyGrainWindow = true;

      var grainWindowLength = 16384;
      grainWindow = new Float32Array(grainWindowLength);
      for (var i = 0; i < grainWindowLength; ++i)
      {
        grainWindow[i] = Math.sin(Math.PI * i / grainWindowLength);
      }
    }
    else
    {
      //grain window not supported
      this.applyGrainWindow = false;
    }

    if (this.audioContext.createDynamicsCompressor)
    {
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.connect(this.audioContext.destination);
    }
    else
    {
      //Compressor not available
      this.compressor = this.audioContext.destination;
    }


    this.loadSample("samples/" + this.file);


  }

  this.update = function(ellapsedTime, mousePos)
  {
      if(!this.audioContext)return; //not initialised yet

      var currentTime = this.audioContext.currentTime;

      //mapping to envelopes this will need sorting

      for (var property in this.parameters)
      {

        if(this.parameters[property].map > -1 )
        {
            this.parameters[property].value = linlin
            (
              env[this.parameters[property].map].z,
              0.0, 1.0,
              this.parameters[property].min, this.parameters[property].max
            );
        }
      }

      if(envsActive)
      {

       while (this.realTime < currentTime + 0.100)
        {
          this.nextGrain();
        }

      }
  }

  this.loadSample = function(url) {

    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var ptr = this;

    request.onload = function() {
      ptr.audioContext.decodeAudioData(
        request.response,
        function(b) {

          ptr.buffer = b;
          ptr.bufferDuration = ptr.buffer.duration - 0.050;
          ptr.isSourceLoaded = true;

        },

        function(b) {
          console.log("Error loading " + url);
        }
      );
    };

    request.onerror = function() {
      alert("error loading");
    };

    request.send();
  }

  this.nextGrain = function()
  {
    //plays an individual grain

    if (!this.buffer)
    {
      return;
    }

    var source = this.audioContext.createBufferSource();
    source.buffer = this.buffer;

    var r1 = Math.random();
    var r2 = Math.random();

    r1 = (r1 - 0.5) * 2.0;
    r2 = (r2 - 0.5) * 2.0;

    var gainNode = this.audioContext.createGain();
    gainNode.gain.value =  this.parameters.amp.value;

    var grainWindowNode;

    if (this.applyGrainWindow)
    {
      //shape the grain window
      grainWindowNode = this.audioContext.createGain();
      source.connect(grainWindowNode);
      grainWindowNode.connect(gainNode);
    }
    else
    {
      source.connect(gainNode);
    }

    // Pitch
    var totalPitch = this.parameters.pitch.value + r1 * this.parameters.pitchRandomization.value;
    var pitchRate = Math.pow(2.0, totalPitch / 1200.0);
    source.playbackRate.value = pitchRate;

    gainNode.connect(this.compressor);

    // Time randomization
    var randomGrainOffset = r2 * this.parameters.timeRandomization.value;

    // Schedule sound grain
    var offset = Math.max(0,this.grainTime + randomGrainOffset);
    source.start(this.realTime,offset , this.parameters.grainDuration.value);

    // Schedule the grain window.

    if (this.applyGrainWindow)
    {
      var windowDuration = this.parameters.grainDuration.value / pitchRate;
      grainWindowNode.gain.value = 0.0; // make default value 0
      grainWindowNode.gain.setValueCurveAtTime(grainWindow, this.realTime, windowDuration);
    }


    // Update time params
    this.realTime += this.parameters.grainSpacing.value;

    if(Math.abs(this.parameters.speed) > 0)
    {

      this.grainTime += this.parameters.speed.value * this.parameters.grainDuration.value;

      //grain time wrapping
      var regionStart = this.parameters.regionStart.value * this.bufferDuration;
      var regionEnd = Math.min(this.bufferDuration, regionStart  + this.parameters.regionLength.value);

      if (this.grainTime > regionEnd)
      {
        this.grainTime = regionStart;
      }
      else if (this.grainTime < regionStart)
      {
        this.grainTime += Math.min( this.bufferDuration - regionStart, this.parameters.regionLength.value);
      }

    }else{
      this.grainTime = this.parameters.regionStart.value * this.bufferDuration;
    }

  }

  //IOS workaround

  this.unlock = function()
  {

    console.log("unlocking")

    // create empty buffer and play it
    var buffer = this.audioContext.createBuffer(1, 1, 22050);
    var source = this.audioContext.createBufferSource();

    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.noteOn(0);

    // by checking the play state after some time, we know if we're really unlocked
    setTimeout(function() {
      if((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
        this.isUnlocked = true;
      }
    }, 10);

  }


  this.init();


}













/////////////////////////////////////////////// GUI stuff ////////////////////////////////////////

// function EnvPanel() {
//
//   for(var i =0; i < env.length; i++)
//   {
//     this[ i + "_attack" ] = env[i].attTime;
//     this[ i + "_decay" ] = env[i].decTime;
//   }
//
// }
//
//
// function ControlPanel()
// {
//
//   for (var property in parameters)
//   {
//     if (parameters.hasOwnProperty(property))
//     {
//       this[property] = parameters[property].value;
//       this[ "map_" + property] = -1;
//       this[ "min_" + property] = parameters[property].min;
//       this[ "max_" + property] = parameters[property].max;
//
//     }
//   }
//
//
//   this.sample = files[0];
//
// }
//
//
// function init()
// {
//
//   envPanel = new EnvPanel();
//   envGui = new dat.GUI({ autoPlace: false });
//   envGui.remember(envPanel);
//
//   $('#envGui').append(envGui.domElement);
//
//   for(var i = 0; i < env.length; i++)
//   {
//     var ae = envGui.add(envPanel, i + "_attack", 0.0, 5.0).step(0.01);
//     var de = envGui.add(envPanel, i + "_decay", 0.0, 5.0).step(0.01);
//
//     ae.onChange(function(value){
//         var i = parseInt(this.property.substring(0,1));
//         env[i].attTime = value;
//         env[i].reset();
//     })
//
//     de.onChange(function(value){
//       var i = parseInt(this.property.substring(0,1));
//       env[i].decTime = value;
//       env[i].reset();
//     })
//   }
//
//   controlPanel = new ControlPanel();
//   gui = new dat.GUI();
//   folders = {};
//   gui.remember(controlPanel); //causes problems
//
//
//   var fileEvent = gui.add(controlPanel, 'sample', files );
//
//   fileEvent.onChange(function(value){
//
//     loadSample("samples/" + value);
//
//   });
//
//   var directEvents = {};
//
//
//   for (var property in parameters)
//   {
//     if (parameters.hasOwnProperty(property)) {
//       if(parameters[property].gui){
//
//         folders[property] = gui.addFolder(property);
//         directEvents[property] = folders[property].add(controlPanel, property, parameters[property].min, parameters[property].max);
//
//         folders[property].add(controlPanel, "map_" + property, [-1, 0, 1, 2] );
//         folders[property].add(controlPanel, "min_" + property, parameters[property].min, parameters[property].max ).step(0.01);
//         folders[property].add(controlPanel, "max_" + property, parameters[property].min, parameters[property].max ).step(0.01);
//
//         if(parameters[property].step !== "undefined")
//         {
//           directEvents[property].step(parameters[property].step);
//         }
//
//         if(!parameters[property].custom){
//
//           directEvents[property].onChange(function(value) {
//             parameters[this.property].value = value;
//             controlPanel[this.property] = value;
//           });
//
//         }
//
//       }
//     }
//   }
//
//
//
//   //CUSTOM HANDLERS
//
//
//   directEvents.grainSize.onChange (function(val){
//     parameters.grainDuration.value = val;
//     parameters.grainSpacing.value = 0.5 * parameters.grainDuration.value;
//     parameters.grainSize.value = val;
//     controlPanel.grainDuration = parameters.grainDuration.value;
//     controlPanel.grainSpacing = parameters.grainSpacing.value;
//   });
//
//
// }

/////////////////////////////////////////FILE LOADING///////////////////////////////////////









//////////////////////
