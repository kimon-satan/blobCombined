
var Graphics = function(){

	this.scene;
	this.camera;
	this.renderer;
	this.canvas;

	this.prevState;
	this.currState;
	this.stateDeltas;
	this.react;


	this.uniforms = {
		time:       { value: 1.0 },
		c_time: 		{value: 1.0 },
		o_time: 		{value: 1.0 },
		r_time: 		{value: 1.0 },
		resolution: { value: new THREE.Vector2() },
		mouse:  	{value: new THREE.Vector2(0,0) },
		scale:      {value: 2.5,  min: 1.0, max: 10.0},
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

	this.states = [
		//0
		{
			cell_detail: 4.0,
			cell_detune: 0.25,

			cell_detail: 4.0,
			slices: 1.0,
			segments: 1.0,
			theta_warp: 1.0,

			c_size: 0.8,
			c_amp: 0.15,
			c_scale: 0.5,
			c_fade: 0.52,

			o_amp: 0.15,
			o_step: 0.0,

			edge_amp: 0.0,
			edge_freq: 0.1,
			o_distort: new THREE.Vector2(1.0,1.0),

			fg_color: col1,
			bg_color: black,
			hl_color: col2,

			fg_pow: 3,
			hl_pow: 0.4,
			hl_mul: 2.5,

		},

		//1
		{
			fg_pow: 2.5,
			hl_pow: 0.3,
			hl_mul: 2.5,
			slices: 1.6,
			c_size: 0.6,
			c_scale: 0.6,
			c_fade: 1.,
			cell_detail: 0.7,
			theta_warp: 1.0,
			edge_freq: 0,
			edge_amp: 0,
			c_amp: 0.2,
			o_amp: 0,
			r_amp: 0.2,
			c_freq: 0.4,
			o_freq: 0.1,
			r_freq: 0.4,
			cell_detune: 0.5
		},

		//2
		{
			cell_detail: 0.7,
			slices: 3.7,
			fg_pow: 2.0,
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
			hl_pow: 0.3,
			hl_mul: 4.0,
			theta_warp: 1.5,
			cell_detune: 0.75
		},

		//5
		{
			theta_warp: 1.6,
			fg_pow: 2.0,
			hl_mul: 7.0,
			hl_pow: 0.7,
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
		}

	]

	this.reactions = {

			shudderOut: function(){
				this.uniforms.c_size.value = this.currState.c_size - 0.4 * env[1].z;
				this.uniforms.c_amp.value = this.currState.c_amp + 0.25 * env[1].z;
				this.uniforms.c_freq.value = this.currState.c_freq + env[1].z * 10.0;
				this.uniforms.r_freq.value = this.currState.r_freq + env[1].z * 12.0;
			}.bind(this),

			shudderIn: function(){
				this.uniforms.c_size.value = this.currState.c_size + 0.2 * env[1].z;
				this.uniforms.o_amp.value = this.currState.o_amp + 0.75 * env[1].z;
				this.uniforms.r_freq.value = this.currState.r_freq + env[1].z * 20.0;
				this.uniforms.c_freq.value = this.currState.c_freq + env[1].z * 10.0;
			}.bind(this),

			shudderThetaUp: function(){
				this.uniforms.c_size.value = this.currState.c_size + 0.2 * env[1].z;
				this.uniforms.o_amp.value = this.currState.o_amp + 0.5 * env[1].z;
				this.uniforms.r_freq.value = this.currState.r_freq + env[1].z * 20.0;
				this.uniforms.c_freq.value = this.currState.c_freq + env[1].z * 10.0;
				this.uniforms.theta_warp.value = this.currState.theta_warp * (1.0- env[1].z);
			}.bind(this),

			shudderThetaDown: function(){
				this.uniforms.c_size.value = this.currState.c_size + 0.2 * env[1].z;
				this.uniforms.o_amp.value = this.currState.o_amp + 0.5 * env[1].z;
				this.uniforms.r_freq.value = this.currState.r_freq + env[1].z * 20.0;
				this.uniforms.c_freq.value = this.currState.c_freq + env[1].z * 10.0;
				this.uniforms.theta_warp.value = this.currState.theta_warp / (1.0- env[1].z);
			}.bind(this)

	}
}
