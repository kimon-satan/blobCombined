
var Graphics = function(){

	this.scene;
	this.camera;
	this.renderer;
	this.canvas;

	this.uniforms = {
		time:       { value: 1.0 },
		resolution: { value: new THREE.Vector2() },
		mouse:  	{value: new THREE.Vector2(0,0) },
		scale:      {value: 2.0, gui: true, min: 1.0, max: 10.0},
		seed:      {value: 0.01, gui: true, min: 0., max: 1., step: 0.01},
		slices:      {value: 8.0, gui: true, min: 1.0, max: 20.0},
		segments:      {value: 1.0, gui: true, min: 1.0, max: 10.0},
		c_size:      {value: 0.5, gui: true, min: 0.1, max: 0.8},
		o_amp:      {value: 0.1, gui: true, min: 0.0, max: 0.8}, //needs changing
		o_step:      {value: 20.0, gui: true, min: 0.0, max: 30.0},
		c_amp:      {value: 0.1, gui: true, min: 0.0, max: 1.0},
		theta_warp:      {value: 1.5, gui: true, min: 0.0, max: 4.0},
		move_mul:      {value: .5, gui: true, min: 0.0, max: 1.0},
		move_add:      {value: .5, gui: true, min: 0.0, max: 1.0},
		move_freq:      {value: 2., gui: true, min: 0.01, max: 10.0},
		move_distort: 	{value: new THREE.Vector2(.4,2.), gui: true, min: 0.0, max: 4.0},
		bg_color:        {value: new THREE.Vector3(1.,1.,1.), gui: true, type: "color"},
		fg_color:        {value: new THREE.Vector3(1.,1.,1.), gui: true, type: "color"},
		hl_color:        {value: new THREE.Vector3(0.,0.,0.), gui: true, type: "color"},
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

	}

	this.draw = function(ellapsedTime , mousePos){

	  this.uniforms.time.value = ellapsedTime;
		this.uniforms.mouse.value = mousePos;

		this.renderer.render( this.scene, this.camera );
	}

	this.init();

}
