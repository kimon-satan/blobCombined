
//ideally this won't be global
var States =
[
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
