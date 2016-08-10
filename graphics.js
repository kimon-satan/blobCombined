
var black = new THREE.Vector3(0,0,0);
var col1 = new THREE.Vector3(
	Math.random() * 0.2, //maybe make the reciprocal ?
	Math.random() * 0.2,
	Math.random() * 0.2
);

var col2 = new THREE.Vector3(
	1.0 - Math.random() * 0.3,
	1.0 - Math.random() * 0.3,
	1.0 - Math.random() * 0.3
);

var States =
[
	//0
	{
	 cell_detail: 2.0,
	 cell_detune: 0.0,
	 c_size: 0.8,
	 c_scale: 0.5,
	 slices: 1.0,
	 segments: 1.0,
	 theta_warp: 1.2,
	 fg_color: col2,
	 bg_color: black,
	 hl_color: col1,
	 fg_pow: 3,
	 hl_pow: 0,
	 c_fade: 0
	},

	//1
	{
	 c_size: 0.7,
	 cell_detune: 0.5,
	 hl_pow: 0.7,
	 hl_mul: 2.0,
	 c_fade: 0.2
 	},

	//2
	{
		cell_detail: 0.7,
		slices: 3.7,
		c_fade: 1.0
	},

	//3
	{
		cell_detail: 0.2,
		c_size: 0.6,
	},

	//4
	{
		c_scale: 0.7,
		cell_detail: 0.1,
		slices: 6.0,
		hl_pow: 1.0,
		hl_mul: 4.0,
		theta_warp: 1.5,
		cell_detune: 0.75
	},

	//5
	{
		theta_warp: 1.6,
		fg_pow: 2.0,
		hl_mul: 7.0,
		hl_pow: 1.3,
		slices: 7.0,
		c_scale: 1.0,
		cell_detail: 0.0,
		cell_detune: 0.5,
	},

	//6

	{
		fg_pow: 0.5,
		hl_pow: 0.25,
		c_size: 0.5,
		c_scale: 1.0,
		fg_color: black,
		bg_color: col1,
		hl_color: col2,
	},

	//7
	{
		fg_pow: 0.5,
		hl_pow: 0.5,
		hl_mul: 2.0
	},








]

var Graphics = function(){

	this.scene;
	this.camera;
	this.renderer;
	this.canvas;

	this.prevState;
	this.stateDeltas;
	this.stateEnvelope = new Envelope(3.5, 60);

	this.uniforms = {
		time:       { value: 1.0 },
		resolution: { value: new THREE.Vector2() },
		mouse:  	{value: new THREE.Vector2(0,0) },
		scale:      {value: 2.0, gui: true, min: 1.0, max: 10.0},
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
		move_mul:      {value: .5, gui: true, min: 0.0, max: 1.0},
		move_add:      {value: .5, gui: true, min: 0.0, max: 1.0},
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


	  document.body.appendChild( this.renderer.domElement );
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

		this.changeState(0);

	}

	this.draw = function(ellapsedTime , mousePos){

	  this.uniforms.time.value = ellapsedTime;
		this.uniforms.mouse.value = mousePos;

		if(this.changingState)this.updateState();

		this.renderer.render( this.scene, this.camera );
	}

	this.changeState = function(i)
	{

		this.prevState = {};
		this.stateDeltas = {};
		this.stateEnvelope.z = 0.0;
		this.stateEnvelope.targetVal = 1.0;
		this.changingState = true;

		for(property in States[i])
		{


			if(typeof(this.uniforms[property].value) == "number")
			{
				this.prevState[property] = this.uniforms[property].value;
				this.stateDeltas[property] = States[i][property] - this.uniforms[property].value;
			}
			else if(this.uniforms[property].value instanceof THREE.Vector3)
			{
				this.prevState[property] = new THREE.Vector3().copy(this.uniforms[property].value);
				this.stateDeltas[property] = new THREE.Vector3();
				this.stateDeltas[property].x = States[i][property].x - this.uniforms[property].value.x;
				this.stateDeltas[property].y = States[i][property].y - this.uniforms[property].value.y;
				this.stateDeltas[property].z = States[i][property].z - this.uniforms[property].value.z;
			}
			else if(this.uniforms[property].value instanceof THREE.Vector2)
			{
				this.prevState[property] = new THREE.Vector2().copy(this.uniforms[property].value);
				this.stateDeltas[property] = new THREE.Vector2();
				this.stateDeltas[property].x = States[i][property].x - this.uniforms[property].value.x;
				this.stateDeltas[property].y = States[i][property].y - this.uniforms[property].value.y;
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
				}
				else if(this.uniforms[property].value instanceof THREE.Vector3)
				{
					this.uniforms[property].value.x = this.prevState[property].x + this.stateDeltas[property].x * this.stateEnvelope.z;
					this.uniforms[property].value.y = this.prevState[property].y + this.stateDeltas[property].y * this.stateEnvelope.z;
					this.uniforms[property].value.z = this.prevState[property].z + this.stateDeltas[property].z * this.stateEnvelope.z;
				}
				else if(this.uniforms[property].value instanceof THREE.Vector2)
				{
					this.uniforms[property].value.x = this.prevState[property].x + this.stateDeltas[property].x * this.stateEnvelope.z;
					this.uniforms[property].value.y = this.prevState[property].y + this.stateDeltas[property].y * this.stateEnvelope.z;
				}
			}
		}
		else
		{
				this.changingState = false;
		}

	}

	this.init();

}
