
var black = new THREE.Vector3(0,0,0);

var colseed = Math.random();
var colseed2 = (colseed + (0.3 + Math.random() * 0.3))%1.;
var col1 = lightColorPalette(colseed);
var col2 = lightColorPalette(colseed2);

function darkColorPalette(seed)
{

	var h = (.25 + seed * .85)%1.0;
	var s = .9;
	var l = .15 + .1 * Math.pow(seed, 2.0) ;

	var rgb = hslToRgb(h,s,l);
	var c = new THREE.Vector3(rgb[0], rgb[1], rgb[2]);

	return c;
}

function lightColorPalette(seed)
{

	var bump = Math.sin(Math.PI * seed);
	var h = seed;
	var s = .5 + bump * .5;
	var l = 0.6;

	var rgb = hslToRgb(h,s,l);
	var c = new THREE.Vector3(rgb[0], rgb[1], rgb[2]);

	return c;
}



var Graphics = function(){

	this.scene;
	this.camera;
	this.renderer;
	this.canvas;

	this.stateIndex = 0;
	this.prevState;
	this.currState;
	this.stateDeltas;
	this.stateEnvelope = new Envelope(0.5, 60);

	this.uniforms = {
		time:       { value: 1.0 },
		resolution: { value: new THREE.Vector2() },
		mouse:  	{value: new THREE.Vector2(0,0) },
		scale:      {value: 1.0, gui: true, min: 1.0, max: 10.0},
		seed:      {value: 0.01, gui: true, min: 0., max: 1., step: 0.01},
		slices:      {value: 8.0, gui: true, min: 1.0, max: 20.0},
		segments:      {value: 1.0, gui: true, min: 1.0, max: 10.0},
		c_size:      {value: 0.5, gui: true, min: 0.1, max: 0.8},
		c_scale:      {value: 1.0, gui: true, min: 0.1, max: 1.0},
		c_fade:      {value: 0.0, gui: true, min: 0.0, max: 1.0},
		cell_detail:   {value: 0.0, gui: true, min: 0.0, max: 4.0},
		o_amp:      {value: 0.1, gui: true, min: 0.0, max: 0.8}, //needs changing
		o_step:      {value: 20.0, gui: true, min: 0.0, max: 30.0},
		c_amp:      {value: 0.1, gui: true, min: 0.0, max: 1.0},
		theta_warp:      {value: 1.5, gui: true, min: 0.0, max: 4.0},
		move_mul:      {value: 0., gui: true, min: 0.0, max: 1.0},
		move_add:      {value: 0., gui: true, min: 0.0, max: 1.0},
		move_freq:      {value: 2., gui: true, min: 0.01, max: 10.0},
		move_distort: 	{value: new THREE.Vector2(.4,2.), gui: true, min: 0.0, max: 4.0},
		bg_color:        {value: new THREE.Vector3(0.13, 0.13, 0.13), gui: true, type: "color"},
		fg_color:        {value: new THREE.Vector3(0.98,0.43,0.43), gui: true, type: "color"},
		hl_color:        {value: new THREE.Vector3(0.51,0.,0.), gui: true, type: "color"},
		fg_pow:      {value: 1., gui: true, min: 0.01, max: 3.0},
		hl_pow:      {value: 1., gui: true, min: 0.01, max: 3.0},
		hl_mul:      {value: 4., gui: true, min: 2., max: 15.},
		cell_detune:      {value: .25, gui: true, min: 0., max: 1., step: 0.01}

	};


	this.init = function()
	{


	  //the graphics renderer
	  this.renderer = new THREE.WebGLRenderer();
	  this.renderer.setSize( window.innerWidth, window.innerHeight );


	  $('#cv').append( this.renderer.domElement );
	  this.canvas = this.renderer.domElement;

		this.uniforms.resolution.value.x = this.renderer.domElement.width;
		this.uniforms.resolution.value.y = this.renderer.domElement.height;

	  this.camera = new THREE.Camera();
	  this.camera.position.z = 1;

	  this.scene = new THREE.Scene();

		var geometry = new THREE.PlaneBufferGeometry( 2, 2 );

	  var material = new THREE.ShaderMaterial( {
			uniforms: this.uniforms,
			vertexShader: blobVertexShader,
			fragmentShader: blobFragmentShader
	  } );

	  var mesh = new THREE.Mesh( geometry, material );

	  this.scene.add( mesh );

		this.resetState();

	}

	this.draw = function(ellapsedTime , mousePos){

	  this.uniforms.time.value = ellapsedTime;
		this.uniforms.mouse.value = mousePos;

		if(this.changingState)this.updateState();

		this.renderer.render( this.scene, this.camera );

		this.uniforms.c_size.value += (-.05 + Math.random() * 0.1) * env[0].z;
	}



////////////////////////////////////////////////////GROWTH STATES///////////////////////////////

	this.resetState = function()
	{
		this.stateIndex = 0;

		this.currState = {};

		for(property in this.uniforms)
		{
			if(typeof(this.uniforms[property].value) == "number")
			{
				if(States[0][property] !== undefined)
				{
					this.uniforms[property].value = States[0][property];
				}

				this.currState[property] = this.uniforms[property].value;

			}
			else if(this.uniforms[property].value instanceof THREE.Vector3)
			{
				if(States[0][property] !== undefined)
				{
					this.uniforms[property].value.copy(States[0][property]);
				}

				this.currState[property]  = new THREE.Vector3().copy(this.uniforms[property].value);
			}
			else if(this.uniforms[property].value instanceof THREE.Vector2)
			{
				if(States[0][property] !== undefined)
				{

					this.uniforms[property].value.copy(States[0][property]);
				}

				this.currState[property] = new THREE.Vector2().copy(this.uniforms[property].value);
			}
		}

	}

	this.changeState = function()
	{

		this.stateIndex += 1;
		this.prevState = {};
		this.stateDeltas = {};
		this.stateEnvelope.z = 0.0;
		this.stateEnvelope.targetVal = 1.0;
		this.changingState = true;

		for(property in States[this.stateIndex])
		{


			if(typeof(this.uniforms[property].value) == "number")
			{
				this.prevState[property] = this.uniforms[property].value;
				this.stateDeltas[property] = States[this.stateIndex][property] - this.uniforms[property].value;

			}
			else if(this.uniforms[property].value instanceof THREE.Vector3)
			{
				this.prevState[property] = new THREE.Vector3().copy(this.uniforms[property].value);
				this.stateDeltas[property] = new THREE.Vector3();
				this.stateDeltas[property].x = States[this.stateIndex][property].x - this.uniforms[property].value.x;
				this.stateDeltas[property].y = States[this.stateIndex][property].y - this.uniforms[property].value.y;
				this.stateDeltas[property].z = States[this.stateIndex][property].z - this.uniforms[property].value.z;
			}
			else if(this.uniforms[property].value instanceof THREE.Vector2)
			{
				this.prevState[property] = new THREE.Vector2().copy(this.uniforms[property].value);
				this.stateDeltas[property] = new THREE.Vector2();
				this.stateDeltas[property].x = States[this.stateIndex][property].x - this.uniforms[property].value.x;
				this.stateDeltas[property].y = States[this.stateIndex][property].y - this.uniforms[property].value.y;
			}
		}

	}

	this.updateState = function()
	{

		//TODO make methods for shifting between vectors

		this.stateEnvelope.step();

		if(this.stateEnvelope.z < 0.99)
		{
			for(property in this.prevState)
			{

				if(typeof(this.uniforms[property].value) == "number")
				{
					this.uniforms[property].value = this.prevState[property] + this.stateDeltas[property] * this.stateEnvelope.z;
					this.currState[property] = this.uniforms[property].value;
				}
				else if(this.uniforms[property].value instanceof THREE.Vector3)
				{
					this.uniforms[property].value.x = this.prevState[property].x + this.stateDeltas[property].x * this.stateEnvelope.z;
					this.uniforms[property].value.y = this.prevState[property].y + this.stateDeltas[property].y * this.stateEnvelope.z;
					this.uniforms[property].value.z = this.prevState[property].z + this.stateDeltas[property].z * this.stateEnvelope.z;
					this.currState[property].copy(this.uniforms[property].value);
				}
				else if(this.uniforms[property].value instanceof THREE.Vector2)
				{
					this.uniforms[property].value.x = this.prevState[property].x + this.stateDeltas[property].x * this.stateEnvelope.z;
					this.uniforms[property].value.y = this.prevState[property].y + this.stateDeltas[property].y * this.stateEnvelope.z;
					this.currState[property].copy(this.uniforms[property].value);
				}
			}
		}
		else
		{
				this.changingState = false;
		}

	}
	///////////////////////////////////////////////////////REACTIONS///////////////////////////

	this.triggerReaction = function()
	{


	}

	////////////////////////////////////////////////////////////////////////////

	this.init(); //initialise the object

}
