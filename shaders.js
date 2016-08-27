var blobVertexShader = `
  void main()	{
    gl_Position = vec4( position, 1.0 );
  }
`;


var blobFragmentShader = `

#ifdef GL_ES
precision highp float;
#endif

uniform vec2 resolution;
uniform float time; // not needed
uniform vec2 mouse;
uniform float scale;

uniform float c_time;
uniform float o_time;
uniform float r_time;

//Blob characteristics

uniform float seed; //for hashable functions

uniform float slices; //theta wise repeat (outer only)
uniform float segments; //rho wise repeat
uniform float c_size; //proportional size of center
uniform float c_scale;

uniform float o_amp; //amp of noise
uniform float c_amp;
uniform float r_amp;

uniform float edge_freq;
uniform float edge_amp;

//o is symmetrical noise
uniform float o_step; //how much to step through initially
uniform float o_mul; //how much of the noise to scrub through on a cycle
uniform vec2 o_distort; //distortion of the acceleration through the noise

uniform float cell_detail; //how to spread the cells
uniform float theta_warp;

uniform vec3 bg_color;
uniform vec3 fg_color;
uniform vec3 hl_color;

uniform float fg_pow;
uniform float hl_pow;
uniform float hl_mul;

uniform float cell_detune;
uniform float c_fade;




float PI  = 3.141592653589793;
float TWO_PI = 6.283185307179586;

///////////////////////////////////HELPERS///////////////////////////////////

mat2 rotate2d(float _angle){
  return mat2(cos(_angle),-sin(_angle),
  sin(_angle),cos(_angle));
}

float hash(float x)
{
  return fract(sin(x * 12341.3784)*43758.5453123);
}



///////////////////////////////////TEXTURE FUNCTIONS//////////////////////////////////////

float drawShape(in vec2 p){

  // NB. Might interesting to play with shapes here ?
  // Wrappable circle distance. The squared distance, to be more precise.
  p = fract(p) - 0.5;
  return dot(p, p);

}

float cellTex(in vec2 p){


  float c = 1.0; // Set the maximum, bearing in mind that it is multiplied by 4.
  // Draw four overlapping shapes (circles, in this case) using the darken blend
  // at various positions on the tile

  for(int i = 0; i < 4; i++)
  {

    float r1 = -1.0 * hash(float(i) + seed) * 2.0;
    float r2 = -1.0 + hash(float(i) + seed * 2.) * 2.0;
    vec2 v = vec2(0.5 + float(i) * .25, 0.5 );
    vec2 d = vec2(r1 * cell_detune * .25, r2 * cell_detune * .25);
    float l = drawShape(p - v + d);
    c = min(c, l + float(i) * cell_detail * 0.05);

  }

  for(int i = 0; i < 4; i++)
  {
    float r1 = -1.0 * hash(float(i) + seed * 1.1) * 2.0;
    float r2 = -1.0 + hash(float(i) + seed * 2.1) * 2.0;
    vec2 v = vec2(.25 + .5 * mod(float(i),2.), .25 + .5 * floor(float(i)/2.) );
    vec2 d = vec2(r1 * cell_detune, r2 * cell_detune);
    float l = drawShape(vec2(p - v + d) * (1.25 + 0.25 * hash(seed) ) );
    c = min(c, l + float(i + 4) * cell_detail * 0.05);

  }


  return sqrt(c*4.);

}

vec3 tex2D(vec2 p){

  //calculate luminocities

  float fgl = pow(clamp(cellTex(p), 0., 1.), fg_pow);
  float hll =  dot(sin(p * hl_mul - sin(p.yx * hl_mul + fgl * hl_mul * 1.5)), vec2(.5))* hl_pow + hl_pow;

  vec3 c_mix = mix(bg_color, hl_color, hll);
  return mix(c_mix,fg_color, fgl);

}

///////////////////////////////////NOISE FUNCTIONS///////////////////////////////////

float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(in vec3 p){
  vec3 a = floor(p);
  vec3 d = p - a;
  d = d * d * (3.0 - 2.0 * d);

  vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
  vec4 k1 = perm(b.xyxy);
  vec4 k2 = perm(k1.xyxy + b.zzww);

  vec4 c = k2 + a.zzzz;
  vec4 k3 = perm(c);
  vec4 k4 = perm(c + 1.0);

  vec4 o1 = fract(k3 * (1.0 / 41.0));
  vec4 o2 = fract(k4 * (1.0 / 41.0));

  vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
  vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

  return o4.y * d.y + o4.x * (1.0 - d.y);
}




void main()	{


  //generate normalised coordinates

  vec2 trans = vec2(2.0, resolution.y * 2.0/ resolution.x) * scale;

  vec2 pos = ( gl_FragCoord.xy / resolution.xy ) - 0.5;
  pos *= trans;

  vec2 center = vec2(0.);

  //FOR DEBUGGING WITH MOUSE
  /*
  vec2 mouseP = mouse - .5;
  mouseP *= trans;
  mouseP.y *= -1.;

  float cp = 1.0 - step(0.02, distance(pos , mouseP));
  float mp = 1.0 - step(0.02, distance(pos , center));
  vec3 markers = vec3(0., cp,  0.) + vec3(mp,0., 0.);

  */

  //rotate the coordinate space around the center
  pos = rotate2d(PI/2.) * pos;

  //get polar coordinates
  float theta = atan(pos.y, pos.x);
  float rho = distance(pos, center);

  //unsigned angle for symmetry
  float ustheta = abs(theta / TWO_PI);
  float ustheta2 = pow(ustheta, theta_warp); //a bit of shaping to squash towards the bottom

  float n_rho = clamp(rho, 0., 1.); //clamp the rho

  float right_field = min( 0., cos(theta + PI/2.0)); // a distance field on the right only

  float asymmetry = .5;

  vec2 move = (vec2(sin(o_time), cos(o_time)) + 1.)/2.;
  move.x = pow(move.x, o_distort.x); // a time delay for the right hand side
  move.y = pow(move.y, o_distort.y);
  move = move * o_mul;
  move.x += right_field * asymmetry;


  float o_noise = noise(vec3(ustheta2 * o_step + move.x , ustheta2 * o_step + move.y , seed)); //symmetrical noise
  float c_noise = noise(vec3(cos(theta) + c_time, sin(theta) + c_time, 0.));
  float r_noise = noise(vec3(cos(theta) + r_time, sin(theta) + r_time, 10.));

  //edges
  float o_edge = 0.7 + o_amp * 0.3 * o_noise + r_amp * 0.3 * r_noise;
  o_edge -= sin(ustheta * PI * edge_freq)  * edge_amp;
  float c_edge = c_size * 0.7 + c_amp * 0.3 * c_size * c_noise;

  //masks with judicious blending for no gaps
  float o_lum =  1.0 - smoothstep(o_edge - 0.1, o_edge , n_rho);
  float c_lum = 1.0 - smoothstep(c_edge - 0.1, c_edge , n_rho);


  float o_nrho = clamp((n_rho - c_edge)/(o_edge - c_edge), 0., 1.);
  vec3 o_col = tex2D(vec2(o_nrho * segments, ustheta2 * slices)); //texturing

  float c_nrho = n_rho/c_edge * c_scale;
  vec3 c_col = tex2D(vec2(cos(theta) * c_nrho , sin(theta) * c_nrho )) * c_fade;

  //NB. currently using same segments for inner and outer .. this might be changed

  gl_FragColor = vec4( vec3(o_col * o_lum * (1.0 - c_lum) + c_lum * c_col),1.0);
  }
`;
