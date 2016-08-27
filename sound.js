

//NB this will need to be split in AC and synth classes if there are multiple sound streams

var files = [
'138344_reverse_crow.wav',
'169830_dino009.wav',
'19997_blackbird.wav',
'19997_blackbird_flap.wav',
'20472_woodpigeonnr_01.wav', //4
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

var SoundStates =
[
  {
    file: {value: "20472_woodpigeonnr_02.wav"},
    amp: {value: 0.0, min: 0.0, max: 1.0, map: 1},
    speed: {value: 0.0 },
    pitch: {value: 1.0, min: 300.0, max: 800, map: "rand" },
    pitchRandomization: {value: 0.0 },
    timeRandomization:{value: 0.0 },
    grainDuration:{value: 0.04 },
    grainSpacing:{value: 0.05 , min:0.04, max:0.16, map: "none"  },
    regionStart: {value: 0.0 , min:1.0, max: 0.0 , map: 3 },
    regionLength: {value: 0.0 }
  },
  {
    file: {value: "20472_woodpigeonnr_01b.wav"},
    amp: {value: 0.0, min: 0.0, max: 1.0, map: 1},
    speed: {value: 0.0 },
    pitch: {value: 1.0, min: 300.0, max: 800, map: "rand" },
    pitchRandomization: {value: 0.0 },
    timeRandomization:{value: 0.0 },
    grainDuration:{value: 0.04 },
    grainSpacing:{value: 0.05 , min:0.04, max:0.16, map:3  },
    regionStart: {value: 0.0 , min:0.9, max: 0.0 , map: 3 },
    regionLength: {value: 0.0 }
  },
  {
    file: {value: "66637_crying-baby-2b.wav"},
    amp: {value: 0.0, min: 0.0, max: 1.0, map: 1},
    speed: {value: 0.0 },
    pitch: {value: 1.0, min: 300.0, max: 800, map: "rand" },
    pitchRandomization: {value: 0.0 },
    timeRandomization:{value: 0.0 },
    grainDuration:{value: 0.1 },
    grainSpacing:{value: 0.05 , min:0.04, max:0.15, map:3  },
    regionStart: {value: 0.0 , min:0.0, max: 1.0 , map: 3 },
    regionLength: {value: 0.0 }
  },
  {
    file: {value: "66637_crying-baby-2b.wav"},
    amp: {value: 0.0, min: 0.0, max: 1.0, map: 1},
    speed: {value: 0.0 },
    pitch: {value: 1.0, min: 300.0, max: 800, map: "rand" },
    pitchRandomization: {value: 0.0 },
    timeRandomization:{value: 0.0 },
    grainDuration:{value: 0.1, min: 0.01, max: 0.1, map: 3 },
    grainSpacing:{value: 0.05 , min:0.08, max:0.01, map:3  },
    regionStart: {value: 0.0 , min:1.0, max: 0.0 , map: 3 },
    regionLength: {value: 0.0 }
  }


]

var Sound = function(){

//GLOBALS

  this.audioContext;
  this.compressor;
  this.buffer = 0;
  this.bufferDuration = 0.0;

  this.buffers = {};

  this.realTime = 0.0;
  this.grainTime = 0.0;

  this.isSourceLoaded = false;
  this.applyGrainWindow = false;
  this.grainWindow;

  //IOS hack
  this.isUnlocked = false;

  this.state = 0;
  this.seed = Math.random();


  this.parameters =
  {
    file: {value: files[0]},
    amp: {value: 0.0, min: 0.0, max: 1.0},
    speed: {value: 0.0, min: -4.0, max: 4.0  },
    pitch: {value: 1.0, min: 1.0, max: 3600  },
    pitchRandomization: {value: 0.0, min: 0.0, max: 1200.0  },
    timeRandomization:{value: 0.01 , min:0.0, max:1.0 },
    grainSize:{value: 0.09 , min:0.010, max:0.5 },
    grainDuration:{value: 0.09 , min:0.010, max:0.5 },
    grainSpacing:{value: 0.045 , min:0.010, max:0.5 },
    regionStart: {value: 0.01 , min:0.0, max:1.0 },
    regionLength: {value: 0.01 , min:0.0, max:10.0  }
  }


///////////////////////////////////SOUND SETUP////////////////////////////

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

    //for each state load the sound file
    var count = 0;
    for(var s in SoundStates)
    {
      this.loadSample("samples/" + SoundStates[s].file.value, count == 0);
      count ++;
    }


  }

  this.update = function(ellapsedTime, mousePos)
  {
      if(!this.audioContext)return; //not initialised yet

      var currentTime = this.audioContext.currentTime;

      //mapping to envelopes this will need sorting



      if(envsActive)
      {

        for (var property in this.parameters)
        {

          if(typeof(this.parameters[property].map) == "number")
          {
              this.parameters[property].value = linlin
              (
                env[this.parameters[property].map].z,
                0.0, 1.0,
                this.parameters[property].min, this.parameters[property].max
              );
          }
        }

       while (this.realTime < currentTime + 0.100 )
        {

          if(!this.nextGrain()){
            break;
          };

        }



      }
  }

  this.loadSample = function(url, setState) {

    //TODO fix audio loading bug

    var fileId = this.getFileId(url);

    if(this.buffers[fileId] != undefined)
    {
      return;
    }

    this.buffers[fileId] = {duration: 0, isSourceLoaded: false, buffer: 0 };

    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var ptr = this;

    request.onload = function() {
      ptr.audioContext.decodeAudioData(
        request.response,
        function(b) {

          ptr.buffers[fileId].buffer = b;
          ptr.buffers[fileId].duration = b.duration - 0.050;
          ptr.buffers[fileId].isSourceLoaded = true;

          if(setState)
          {
            ptr.setState(0); // bit hacky but safe
          }

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
      return false;
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



    return true;

  }

  this.setState  = function(stateId)
  {
    if(SoundStates[stateId] == undefined)
    {
      console.log("state: " + stateId + " not found")
      return;
    }

    for(property in SoundStates[stateId])
    {
        for(p in SoundStates[stateId][property])
        {
          this.parameters[property][p] = SoundStates[stateId][property][p];
        }

        if(this.parameters[property].map == "rand")
        {
          this.parameters[property].value = linlin(
            this.seed, 0, 1,
            this.parameters[property].min,
            this.parameters[property].max
          );
        }
    }

    var bobj = this.buffers[this.getFileId(this.parameters.file.value)];
    this.buffer =  bobj.buffer;
    this.bufferDuration = bobj.duration;
    this.isSourceLoaded = bobj.isSourceLoaded;


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

    var host = this;
    // by checking the play state after some time, we know if we're really unlocked
    setTimeout(function() {
      if((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE))
      {
        host.isUnlocked = true;
        console.log("unlocked")
      }
    }, 10);

  }

  this.getFileId = function(url)
  {
    var fileId = url.substring(url.lastIndexOf('/') + 1);
    fileId = fileId.substring(0, fileId.lastIndexOf('.'));

    return fileId
  }


  this.init();


}
