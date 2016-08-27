
var black = new THREE.Vector3(0,0,0);
var col1 = new THREE.Vector3(.53,.53,.53);
var col2 = new THREE.Vector3(.59,0,0);

//var colseed = Math.random();
//var colseed2 = (colseed + (0.3 + Math.random() * 0.3))%1.;

//var col1 = lightColorPalette(colseed);
//var col2 = lightColorPalette(colseed2);

//TODO replace with similar shades of red and pink

// function darkColorPalette(seed)
// {
//
// 	var h = (.25 + seed * .85)%1.0;
// 	var s = .9;
// 	var l = .15 + .1 * Math.pow(seed, 2.0) ;
//
// 	var rgb = hslToRgb(h,s,l);
// 	var c = new THREE.Vector3(rgb[0], rgb[1], rgb[2]);
//
// 	return c;
// }
//
// function lightColorPalette(seed)
// {
//
// 	var bump = Math.sin(Math.PI * seed);
// 	var h = seed;
// 	var s = .5 + bump * .5;
// 	var l = 0.6;
//
// 	var rgb = hslToRgb(h,s,l);
// 	var c = new THREE.Vector3(rgb[0], rgb[1], rgb[2]);
//
// 	return c;
// }



var Graphics = function(){

	this.scene;
	this.camera;
	this.renderer;
	this.canvas;

	this.prevState;
	this.currState;
	this.stateDeltas;

	this.currentGesture = 0;


	this.uniforms = {
		time:       { value: 1.0 },
		c_time: 		{value: 1.0 },
		o_time: 		{value: 1.0 },
		r_time: 		{value: 1.0 },
		resolution: { value: new THREE.Vector2() },
		mouse:  	{value: new THREE.Vector2(0,0) },
		scale:      {value: 1.0,  min: 1.0, max: 10.0},
		seed:      {value: 0.01,  min: 0., max: 1., step: 0.01},
		slices:      {value: 8.0,  min: 1.0, max: 20.0},
		segments:      {value: 1.0,  min: 1.0, max: 10.0},
		cell_detail:   {value: 0.0,  min: 0.0, max: 4.0},
		theta_warp:      {value: 1.5,  min: 0.0, max: 4.0},
		cell_detune:      {value: .25,  min: 0., max: 1., step: 0.01},
		c_size:      {value: 0.5,  min: 0.1, max: 0.8},
		c_scale:      {value: 1.0,  min: 0.1, max: 1.0},
		c_freq:      {value: 1.0,  min: 0.1, max: 10.0, },
		c_fade:      {value: 0.0,  min: 0.0, max: 1.0},
		c_amp:      {value: 0.1,  min: 0.0, max: 1.0},
		r_amp:      {value: 0.1,  min: 0.0, max: 0.8},
		r_freq:      {value: 1.0,  min: 0.1, max: 10.0, },

		o_amp:      {value: 0.1,  min: 0.0, max: 0.8},
		o_step:      {value: 20.0,  min: 0.0, max: 30.0},
		o_freq:      {value: 1.0,  min: 0.1, max: 10.0, },

		edge_amp:      {value: 0.,  min: 0.0, max: 1.0},
		edge_freq:      {value: 2.,  min: 0.01, max: 10.0},
		o_distort: 	{value: new THREE.Vector2(.4,2.),  min: 0.0, max: 4.0},

		bg_color:        {value: new THREE.Vector3(0.13, 0.13, 0.13),  type: "color"},
		fg_color:        {value: new THREE.Vector3(0.98,0.43,0.43),  type: "color"},
		hl_color:        {value: new THREE.Vector3(0.51,0.,0.),  type: "color"},
		fg_pow:      {value: 1.,  min: 0.01, max: 3.0},
		hl_pow:      {value: 1.,  min: 0.01, max: 3.0},
		hl_mul:      {value: 4.,  min: 2., max: 15.},


	};


	this.init = function()
	{


	  //the graphics renderer
	  this.renderer = new THREE.WebGLRenderer();

		//maybe reduce size to improve performance
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

		this.initState(); //set to state zero
		this.changeState();
	}

	this.draw = function(ellapsedTime , mousePos){

		this.updateUniforms(); //reset the uniforms after any jiggery

		if(envsActive)
		{
			if(currentGesture == 1) //maybe change with envsActive ?
			{
				//NB. will this cause an abrupt cut
				this.uniforms.c_size.value = this.currState.c_size - 0.4 * env[1].z;
				this.uniforms.c_amp.value = this.currState.c_amp + 0.25 * env[1].z;
				this.uniforms.c_freq.value = this.currState.c_freq + env[1].z * 10.0;
				this.uniforms.r_freq.value = this.currState.r_freq + env[1].z * 12.0;
			}
			else if(currentGesture == 2)
			{
				//do something else
				this.uniforms.c_size.value = this.currState.c_size + 0.2 * env[1].z;
				this.uniforms.o_amp.value = this.currState.o_amp + 0.75 * env[1].z;
				this.uniforms.r_freq.value = this.currState.r_freq + env[1].z * 20.0;
				this.uniforms.c_freq.value = this.currState.c_freq + env[1].z * 10.0;

			}
			else if(currentGesture == 3)
			{
				//do something else
				this.uniforms.c_size.value = this.currState.c_size + 0.2 * env[1].z;
				this.uniforms.o_amp.value = this.currState.o_amp + 0.5 * env[1].z;
				this.uniforms.r_freq.value = this.currState.r_freq + env[1].z * 20.0;
				this.uniforms.c_freq.value = this.currState.c_freq + env[1].z * 10.0;
				this.uniforms.theta_warp.value = this.currState.theta_warp * (1.0- env[1].z);
			}
			else if (currentGesture == 4)
			{
				//do something else
				this.uniforms.c_size.value = this.currState.c_size + 0.2 * env[1].z;
				this.uniforms.o_amp.value = this.currState.o_amp + 0.5 * env[1].z;
				this.uniforms.r_freq.value = this.currState.r_freq + env[1].z * 20.0;
				this.uniforms.c_freq.value = this.currState.c_freq + env[1].z * 10.0;
				this.uniforms.theta_warp.value = this.currState.theta_warp / (1.0- env[1].z);
			}
		}

		if(isGesture)
		{
			this.updateState();
		}

		//update the various time uniforms last
		var delta = ellapsedTime - this.uniforms.time.value;
		this.uniforms.c_time.value += delta * this.uniforms.c_freq.value;
		this.uniforms.o_time.value += delta * this.uniforms.o_freq.value;
		this.uniforms.r_time.value += delta * this.uniforms.r_freq.value;

		this.uniforms.time.value = ellapsedTime;
		this.uniforms.mouse.value.copy(mousePos);


		this.renderer.render( this.scene, this.camera );

	}



////////////////////////////////////////////////////GROWTH STATES///////////////////////////////

	this.initState = function()
	{

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

	this.updateUniforms = function()
	{

		//reset the uniforms after any jiggery pokery

		for(property in this.uniforms)
		{
			if(typeof(this.uniforms[property].value) == "number")
			{
				this.uniforms[property].value = this.currState[property];
			}
			else if(this.uniforms[property].value instanceof THREE.Vector3)
			{
			 	this.uniforms[property].value.copy(this.currState[property]);
			}
			else if(this.uniforms[property].value instanceof THREE.Vector2)
			{
				 this.uniforms[property].value.copy(this.currState[property]);
			}
		}

	}

	this.changeState = function()
	{

		//beginning a new state

		this.prevState = {};
		this.stateDeltas = {};

		for(property in States[stateIndex])
		{

			if(typeof(this.uniforms[property].value) == "number")
			{
				this.prevState[property] = this.currState[property];
				this.stateDeltas[property] = States[stateIndex][property] - this.currState[property];
			}
			else if(this.uniforms[property].value instanceof THREE.Vector3)
			{
				this.prevState[property] = new THREE.Vector3().copy(this.currState[property]);
				this.stateDeltas[property] = new THREE.Vector3().subVectors(States[stateIndex][property],this.currState[property] );
			}
			else if(this.uniforms[property].value instanceof THREE.Vector2)
			{
				this.prevState[property] = new THREE.Vector2().copy(this.currState[property].value);
				this.stateDeltas[property] = new THREE.Vector2().subVectors(States[stateIndex][property],this.currState[property] );
			}
		}

	}

	this.updateState = function()
	{

		//increment the current state

		for(property in this.prevState)
		{
			if(typeof(this.uniforms[property].value) == "number")
			{
				this.currState[property] = this.prevState[property] + this.stateDeltas[property] * stateEnvelope.z;
			}
			else if(this.uniforms[property].value instanceof THREE.Vector3)
			{
				this.currState[property].x = this.prevState[property].x + this.stateDeltas[property].x * stateEnvelope.z;
				this.currState[property].y = this.prevState[property].y + this.stateDeltas[property].y * stateEnvelope.z;
				this.currState[property].z = this.prevState[property].z + this.stateDeltas[property].z * stateEnvelope.z;
			}
			else if(this.uniforms[property].value instanceof THREE.Vector2)
			{
				this.currState[property].x = this.prevState[property].x + this.stateDeltas[property].x * stateEnvelope.z;
				this.currState[property].y = this.prevState[property].y + this.stateDeltas[property].y * stateEnvelope.z;
			}
		}

	}

	////////////////////////////////////////////////////////////////////////////

	this.init(); //initialise the object

}
