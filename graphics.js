
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

$.getScript("shaders.js", function(){
		$.getScript("graphicsDefs.js", makeGraphics);
})


function makeGraphics(){

	Graphics.prototype.init = function()
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
			fragmentShader: blobFragmentShader,
			transparent: true,
			depthWrite: false

		} );

		var mesh = new THREE.Mesh( geometry, material );


		///////////////////////////////////////////////////////

		this.exp_uniforms = {
			time:       { value: 1.0 },
			resolution: { value: new THREE.Vector2() },
			mouse:  	{value: new THREE.Vector2() },
			env_time:  	{value: 0. },

			scale:      {value: 1.0, gui: true, min: 1.0, max: 10.0},
			max_size: {value: 40.0, gui: true, min: 1.0, max: 60.0},
			color_1: {value: col1},
			color_2: {value: col2}

		};

		this.exp_uniforms.resolution.value.x = this.renderer.domElement.width;
		this.exp_uniforms.resolution.value.y = this.renderer.domElement.height;

		var exp_material = new THREE.ShaderMaterial( {
			uniforms: this.exp_uniforms,
			vertexShader: expVertexShader,
			fragmentShader: expFragmentShader,
			depthWrite: false

		} );


		this.PARTICLE_COUNT = 2000;
		this.exp_geo = new THREE.BufferGeometry();


		var particleVerts = new Float32Array(this.PARTICLE_COUNT * 3);
		var randVals = [new Float32Array(this.PARTICLE_COUNT * 4), new Float32Array(this.PARTICLE_COUNT * 4)];
		var particleColors = new Float32Array(this.PARTICLE_COUNT );

		for (var i = 0; i < this.PARTICLE_COUNT; i++)
		{

			particleVerts[i * 3 + 0] = 0; //x
			particleVerts[i * 3 + 1] = 0; //y
			particleVerts[i * 3 + 2] = i/this.PARTICLE_COUNT; //z

			particleColors[i] = i%2;

			for(var k = 0; k < 2; k++)
			{
				for(var j = 0; j < 4; j++)
				{
					randVals[k][i * 4 + j ]  = Math.random();
				}
			}
		}

		this.exp_geo.addAttribute('position', new THREE.BufferAttribute(particleVerts, 3));
		this.exp_geo.addAttribute('color_type', new THREE.BufferAttribute(particleColors, 1));
		this.exp_geo.addAttribute('rand_vals', new THREE.BufferAttribute(randVals[0], 4));
		this.exp_geo.addAttribute('rand_vals_2', new THREE.BufferAttribute(randVals[1], 4));




		var exp_mesh = new THREE.Points( this.exp_geo ,exp_material);

		this.scene.add(exp_mesh);
		this.scene.add( mesh );


		this.exp_env = new LineEnv(1.5, 0, 1);
		this.exp_geo.setDrawRange(0,1); //prevents rendering when idle

		this.initState(); //set to state zero
		this.changeState();
	}

	Graphics.prototype.updateReactions = function(envsActive, envs)
	{
		this.updateUniforms(); //reset the uniforms after any reaction jiggery

		if(envsActive && this.react != undefined)
		{
				this.react(envs);
		}
	}

	Graphics.prototype.updateExplosion = function(env)
	{

			this.uniforms.c_freq.value += (10.0 * Math.pow(env.z,4.0));

			//more later
	}

	Graphics.prototype.draw = function(ellapsedTime , mousePos){

		//update the various time uniforms last
		var delta = ellapsedTime - this.uniforms.time.value;

		this.uniforms.c_time.value += (delta * this.uniforms.c_freq.value);
		this.uniforms.o_time.value += (delta * this.uniforms.o_freq.value);
		this.uniforms.r_time.value += (delta * this.uniforms.r_freq.value);

		this.exp_uniforms.time.value = ellapsedTime;

		//this will be replaced with a linear envelope
		this.exp_uniforms.env_time.value = this.exp_env.update();

		if(this.exp_env.value == 1.0)
		{
			this.exp_env.reset();
			this.exp_geo.setDrawRange(0,1); //stop render
		}

		this.uniforms.time.value = ellapsedTime;
		this.uniforms.mouse.value.copy(mousePos);

		this.renderer.render( this.scene, this.camera );

	}



	////////////////////////////////////////////////////GROWTH STATES///////////////////////////////

	Graphics.prototype.initState = function()
	{

		this.currState = {};

		for(property in this.uniforms)
		{
			if(typeof(this.uniforms[property].value) == "number")
			{
				if(this.states[0][property] !== undefined)
				{
					this.uniforms[property].value = this.states[0][property];
				}

				this.currState[property] = this.uniforms[property].value;

			}
			else if(this.uniforms[property].value instanceof THREE.Vector3)
			{
				if(this.states[0][property] !== undefined)
				{
					this.uniforms[property].value.copy(this.states[0][property]);
				}

				this.currState[property]  = new THREE.Vector3().copy(this.uniforms[property].value);
			}
			else if(this.uniforms[property].value instanceof THREE.Vector2)
			{
				if(this.states[0][property] !== undefined)
				{

					this.uniforms[property].value.copy(this.states[0][property]);
				}

				this.currState[property] = new THREE.Vector2().copy(this.uniforms[property].value);
			}
		}

	}

	Graphics.prototype.updateUniforms = function()
	{

		//reset the uniforms after any jiggery pokery

		for(property in this.uniforms)
		{
			if(this.uniforms[property].locked)
			{
				//skip it
			}
			else if(typeof(this.uniforms[property].value) == "number")
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

	Graphics.prototype.changeState = function(idx)
	{

		//beginning a new state

		this.prevState = {};
		this.stateDeltas = {};

		for(property in this.states[idx])
		{

			if(typeof(this.uniforms[property].value) == "number")
			{
				this.prevState[property] = this.currState[property];
				this.stateDeltas[property] = this.states[idx][property] - this.currState[property];
			}
			else if(this.uniforms[property].value instanceof THREE.Vector3)
			{
				this.prevState[property] = new THREE.Vector3().copy(this.currState[property]);
				this.stateDeltas[property] = new THREE.Vector3().subVectors(this.states[idx][property],this.currState[property] );
			}
			else if(this.uniforms[property].value instanceof THREE.Vector2)
			{
				this.prevState[property] = new THREE.Vector2().copy(this.currState[property].value);
				this.stateDeltas[property] = new THREE.Vector2().subVectors(this.states[idx][property],this.currState[property] );
			}
		}

	}

	Graphics.prototype.updateState = function(stateEnvelope)
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

	Graphics.prototype.setReaction = function(r){
		if(r != undefined)
		{
			this.react = this.reactions[r];
		}
		else
		{
			this.react = undefined;
		}
	}

	Graphics.prototype.explode = function(ellapsedTime)
	{
		this.exp_env.trigger();
		this.exp_geo.setDrawRange(0,this.PARTICLE_COUNT); //start rendering
	}
}
