// Original SDF studio scene for the placeholder catalogue.
// Every layer is rendered with the same camera so the web app can stack them.
// Defines injected by render.mjs: LAYER (0 body,1 bottom,2 outerwear,3 shoes,4 accessory), STYLE, PRODUCT
precision highp float; precision highp int;
out vec4 outColor;
uniform vec2 uRes; uniform float uSeed; uniform vec3 uRo, uTa; uniform float uTan;
uniform vec3 uC0, uC1, uC2, uC3;

float hash1(inout uint s){ s=s*747796405u+2891336453u; uint w=((s>>((s>>28u)+4u))^s)*277803737u; w=(w>>22u)^w; return float(w)/4294967295.; }
float h31(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.-2.*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ return noise(p)*.55+noise(p*2.1+3.1)*.28+noise(p*4.3+7.7)*.17; }
float smin(float a,float b,float k){ float h=max(k-abs(a-b),0.)/k; return min(a,b)-h*h*k*.25; }
float smax(float a,float b,float k){ return -smin(-a,-b,k); }
vec2 U(vec2 a,vec2 b){ return a.x<b.x?a:b; }
float ell(vec3 p,vec3 r){ float a=length(p/r),b=length(p/(r*r)); return a*(a-1.)/max(b,1e-5); }
float cap(vec3 p,vec3 a,vec3 b,float ra,float rb){ vec3 q=p-a,e=b-a; float h=clamp(dot(q,e)/dot(e,e),0.,1.); return length(q-e*h)-mix(ra,rb,h); }
float capT(vec3 p,vec3 a,vec3 b){ vec3 e=b-a; return dot(p-a,e)/dot(e,e); }
float rbox(vec3 p,vec3 b,float r){ vec3 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r; }
float torus(vec3 p,float R,float r){ return length(vec2(length(p.xz)-R,p.y))-r; }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }

const vec3 SH=vec3(.146,1.362,-.015), EL=vec3(.209,1.095,-.03), WR=vec3(.244,.868,.02);
const float HX=-.032; // hand offset that follows the wrist

// ---------- body ----------
float sdHand(vec3 q){ q.x-=HX;
  float d=ell(q-vec3(.284,.806,.033),vec3(.019,.05,.034));
  for(int i=0;i<4;i++){ float f=float(i);
    vec3 a=vec3(.287,.78-abs(f-1.5)*.004,.008+f*.0165), b=vec3(.281,.722-(f==1.||f==2.?.008:0.),.016+f*.0155);
    d=smin(d,cap(q,a,b,.0105,.0085),.007);
    d=smin(d,cap(q,b,b+vec3(-.010,-.03,.004),.0088,.0068),.005); }
  d=smin(d,cap(q,vec3(.278,.83,.056),vec3(.268,.785,.079),.013,.0105),.014);
  d=smin(d,cap(q,vec3(.268,.785,.079),vec3(.262,.757,.079),.0105,.008),.006);
  return d;
}
const float HY=.022; // head drop
float sdSkin(vec3 p0){ vec3 p=p0; if(p.y>1.44) p.y+=HY*smoothstep(1.44,1.50,p0.y);
  vec3 q=vec3(abs(p.x),p.yz);
  float head=1e3;
  if(p.y>1.38){
    head=ell(p-vec3(0,1.648,-.014),vec3(.075,.094,.09));
    head=smin(head,ell(p-vec3(0,1.602,.022),vec3(.0545,.082,.063)),.035);
    head=smin(head,ell(p-vec3(0,1.5405,.052),vec3(.019,.019,.024)),.04);
    head=smin(head,ell(q-vec3(.0385,1.597,.054),vec3(.018,.018,.018)),.03);      // cheeks
    head=smax(head,-ell(q-vec3(.0305,1.6265,.1),vec3(.022,.0125,.0215)),.02);   // sockets
    head=smin(head,ell(q-vec3(.0305,1.6245,.0715),vec3(.0155,.0105,.013)),.006); // lids
    head=smin(head,cap(p,vec3(0,1.628,.0815),vec3(0,1.599,.0945),.0055,.0078),.016); // nose
    head=smin(head,ell(q-vec3(.0078,1.5965,.087),vec3(.0062,.005,.008)),.007);
    head=smin(head,cap(q,vec3(.013,1.645,.081),vec3(.034,1.646,.07),.006,.004),.02); // brow ridge
    float lip=min(ell(q-vec3(.0052,1.5725,.0815),vec3(.0145,.0042,.0072)),ell(p-vec3(0,1.566,.0815),vec3(.0145,.0048,.0082)));
    head=smin(head,lip,.009);
    head=smin(head,ell(q-vec3(.0725,1.612,-.016),vec3(.0065,.025,.015)),.008);
    head=smin(head,cap(p,vec3(0,1.40,-.018),vec3(0,1.56,-.016),.052,.05),.03);
  }
  float d=head;
  d=smin(d,ell(p-vec3(0,1.26,0),vec3(.132,.17,.09)),.05);
  d=smin(d,ell(p-vec3(0,1.08,0),vec3(.104,.15,.08)),.06);
  d=smin(d,ell(p-vec3(0,.93,0),vec3(.128,.12,.092)),.06);
  d=smin(d,cap(q,SH,EL,.041,.035),.04);
  d=smin(d,cap(q,EL,WR,.034,.024),.02);
  d=smin(d,sdHand(q),.018);
  d=smin(d,cap(q,vec3(.072,.88,0),vec3(.1,.5,.012),.06,.047),.04);
  d=smin(d,cap(q,vec3(.1,.5,.012),vec3(.108,.1,-.012),.047,.032),.02);
  d=smin(d,cap(q,vec3(.108,.05,-.02),vec3(.12,.028,.12),.034,.026),.02);
  return d;
}
float hairLine(vec3 p){ return ell(p-vec3(0,1.598,.094),vec3(.066,.094,.084)); }
float sdHair(vec3 p0){ vec3 p=p0; p.y+=HY;
  if(p.y<1.42) return 1e3;
  vec3 q=vec3(abs(p.x),p.yz);
  float d=ell(p-vec3(0,1.654,-.0155),vec3(.0805,.0975,.0955));
  d=smin(d,cap(q,vec3(.064,1.655,.014),vec3(.064,1.60,-.026),.014,.012),.03);  // swept over the ears
  d=smin(d,cap(q,vec3(.064,1.60,-.026),vec3(.034,1.535,-.07),.012,.012),.025);
  d=smin(d,ell(p-vec3(0,1.60,-.075),vec3(.055,.07,.04)),.04);
  d=smin(d,ell(p-vec3(0,1.57,-.118),vec3(.04,.042,.034)),.012);
  d=smax(d,-hairLine(p),.012);
  float fl=atan(p.y-1.69,q.x+.02)*38.+length(p.yz-vec2(1.69,.03))*130.;
  d-=sin(fl+noise(p*55.)*4.)*.0003+sin(fl*3.1+noise(p*110.)*3.)*.0002;
  d+=.0026*exp(-p.x*p.x*1.6e5)*smoothstep(1.67,1.70,p.y);
  return d;
}
vec2 mapBody(vec3 p){ return vec2(sdSkin(p),1.); }   // the head comes from head.webp

// ---------- outerwear ----------
float puff(float v){ float f=abs(fract(v)*2.-1.); return sqrt(max(1.-f*f,0.)); }
float sdSleeve(vec3 q,float k){ float a=cap(q,SH,EL,.060*k,.055*k), b=cap(q,EL,WR,.055*k,.043*k); return smin(a,b,.03); }
vec2 gSleeve;
float jacketBase(vec3 p,float fat,float hem,out float sl,out float tor){
  vec3 q=vec3(abs(p.x),p.yz);
  float y=p.y;
  float rx=mix(.163,.138,smoothstep(hem,1.06,y)); rx=mix(rx,.156,smoothstep(1.04,1.24,y)); rx=mix(rx,.11,smoothstep(1.28,1.47,y));
  float rz=mix(.12,.108,smoothstep(hem,1.06,y)); rz=mix(rz,.122,smoothstep(1.04,1.24,y)); rz=mix(rz,.085,smoothstep(1.28,1.46,y));
  rx*=fat; rz*=fat;
  float e=length(p.xz/vec2(rx,rz)); tor=(e-1.)*min(rx,rz)*.95;
  tor=smax(tor,y-1.43,.05); tor=smax(tor,hem-y,.018);
  float yoke=cap(q,vec3(.03,1.425,-.02),SH,.055,.058*fat);
  tor=smin(tor,yoke,.05);
  sl=sdSleeve(q,fat);
  // cuff end
  vec3 dir=normalize(WR-EL); sl=smax(sl,dot(q-WR,dir)-.004,.012);
  return smin(tor,sl,.016);
}
float sdCollar(vec3 p){
  float r=.073+.02*smoothstep(1.46,1.36,p.y);
  float front=1.437+.03*smoothstep(.05,-.1,p.z);
  vec3 c=p-vec3(0,1.40,-.012);
  float tube=abs(length(c.xz*vec2(1.,.96))-r)-.011;
  tube=smax(tube,p.y-front-.018,.02); tube=smax(tube,1.36-p.y,.02);
  return tube*.9;
}
float sdHoodDown(vec3 p){
  vec3 q=p-vec3(0,1.452,-.034); q.yz=rot(.42)*q.yz;
  float r=.034+.014*smoothstep(.03,-.09,q.z)-.016*smoothstep(.0,.1,q.z);
  float a=atan(q.x,-q.z);
  float d=length(vec2(length(q.xz*vec2(.96,.9))-.09,q.y*1.08))-r;
  d=smin(d,ell(p-vec3(0,1.44,-.125),vec3(.098,.07,.058)),.05);
  d=smax(d,-(p.y>1.2?cap(p,vec3(0,1.38,.16),vec3(0,1.6,.12),.028,.06):1e3),.03);
  return d*.9;
}
vec2 mapJacket(vec3 p){
  if(p.y<.76||p.y>1.62) return vec2(max(max(.76-p.y,p.y-1.62),.02),10.);
  vec3 q=vec3(abs(p.x),p.yz);
  float sl,tor;
#if STYLE==1
  float fat=1.03, hem=.83;
#else
  float fat=1., hem=.865;
#endif
  float d=jacketBase(p,fat,hem,sl,tor);
  float ts=capT(q,SH,EL)*.28; if(ts>.28) ts=.28+capT(q,EL,WR)*.23;
  float mat=10., dT, dS;
#if STYLE==0
  float vT=p.y*17.2+.5-abs(p.x)*2.6, vS=ts*18.+.3, amp=.0115;
#elif STYLE==2
  float ch=abs(fract(p.x*4.4+.5)-.5)*1.5;
  float vT=p.y*21.5+ch*1.35, vS=ts*22.+abs(q.z+.01)*8., amp=.0095;
#endif
#if STYLE!=1
  float wob=(fbm(p*9.)-.5)*.16, soft=(fbm(p*vec3(16,10,16))-.5)*.007;
  float pT=puff(vT+wob), pS=puff(vS+wob), cr=(fbm(p*vec3(52,22,52))-.5)*.0055;
  float mT=smoothstep(hem+.012,hem+.04,p.y), mS=smoothstep(.478,.462,ts);
  dT=(amp*pT+cr*(1.15-pT)+soft)*mT-.004*(1.-mT)-.004*exp(-pow(p.x/.011,2.))*step(0.,p.z);
  dS=(amp*.85*pS+cr*(1.15-pS)+soft)*mS-.004*(1.-mS);
#else
  float fold=(fbm(p*vec3(9,4.5,9)+vec3(0,p.x*7.,0))-.5)*.016+(fbm(p*vec3(21,10,21)+4.)-.5)*.004;
  float elbow=exp(-pow((ts-.27)/.07,2.));
  dS=fold+sin(ts*105.+q.z*40.+fbm(q*20.)*4.)*.0035*elbow;
  dT=fold+sin(p.y*64.+abs(p.x)*30.+fbm(p*12.)*5.)*.0012*smoothstep(1.05,.92,p.y);
  dT-=.0035*exp(-pow(p.x/.007,2.))*step(0.,p.z);
  float yl=1.295-abs(p.x)*.2; dT-=.0024*exp(-pow((p.y-yl)/.0035,2.));
#endif
  d=smin(tor-dT,sl-dS,.005);
  float hood=sdHoodDown(p);
#if STYLE!=1
  hood-=.006*puff(length(p.xz-vec2(0,-.03))*28.+p.y*16.)+(fbm(p*38.)-.5)*.006;
#else
  hood-=(fbm(p*14.)-.5)*.010;
#endif
  float col=sdCollar(p);
  float hc=smin(hood,col,.012);
  d=smin(d,hc,.014);
  // neck opening, so the ghost product shot is hollow
  float hole=cap(p,vec3(0,1.37,-.012),vec3(0,1.75,-.012),.058,.066);
  float inn=-hole; if(inn>d){ d=smax(d,inn,.008); mat=14.; }
  // pockets
  vec3 pk=q-vec3(.096,1.0,.0); pk.xy=rot(.28)*pk.xy;
  if(p.z>0.&&abs(pk.y)<.062&&abs(pk.x)<.008) { d+=.0025*smoothstep(.007,.002,abs(pk.x)); }
  return vec2(d*.72,mat);
}

// ---------- bottoms ----------
vec2 mapPants(vec3 p){
  if(p.y>1.06) return vec2(max(p.y-1.06,.02),20.);
  vec3 q=vec3(abs(p.x),p.yz);
  float s=p.x<0.?1.7:0.;
#if STYLE==0
  float rh=.074,rk=.060,ra=.050,hemY=.085;
#elif STYLE==1
  float rh=.078,rk=.074,ra=.06,hemY=.08;
#else
  float rh=.079,rk=.088,ra=.097,hemY=.045;
#endif
  vec3 K=vec3(.101,.5,.012),A=vec3(.108,.07,-.008);
  float hip=(length(p.xz/vec2(.118+.030*smoothstep(1.03,.88,p.y),.100+.014*smoothstep(1.02,.88,p.y)))-1.)*.108;
  hip=smax(hip,.83-p.y,.07); hip=smax(hip,p.y-1.03,.01);
  float leg=cap(q,vec3(.073,.87,0),K,rh,rk); float lo=cap(q,K,A,rk,ra);
  leg=smin(leg,lo,.03); leg=smax(leg,p.y-.96,.05);
  leg=smax(leg,hemY-p.y,.012);
  float d=smin(hip,leg,.035);
  d=smax(d,.004-q.x*1.-smoothstep(.79,.83,p.y)*.2,.02);
  float crotch=exp(-pow((p.y-.82)/.07,2.));
  float knee=exp(-pow((p.y-.5)/.09,2.)), ank=smoothstep(.3,.1,p.y);
  float w=(fbm(p*vec3(15,6,15)+s)-.5)*.014;
  w+=sin(p.y*88.+q.x*60.*(crotch)+fbm(p*13.+s)*7.)*(.0026*ank+.0018*knee+.0016*crotch);
#if STYLE==2
  w*=.32; float cr=exp(-pow((q.x-.1)/.006,2.))*step(0.,p.z)*smoothstep(.95,.8,p.y); w+=.006*cr; w+=sin(atan(q.x-.104,p.z)*5.+p.y*3.)*.0035*smoothstep(.8,.2,p.y);
#endif
  d-=w;
#if STYLE==1
  vec3 c=q-vec3(.171,.6,.005); c.xy=rot(-.02)*c.xy;
  float pk=rbox(c,vec3(.02,.085,.06),.012)-(fbm(p*30.)-.5)*.004; float fl=rbox(c-vec3(.004,.066,0),vec3(.022,.026,.064),.01);
  d=smin(d,min(pk,fl),.008);
#endif
  d+=.002*exp(-pow((p.y-.985)/.003,2.));
  float mat=20.;
  float hole=ell(p-vec3(0,1.06,0),vec3(.112,.075,.09)); if(-hole>d){ d=smax(d,-hole,.006); mat=24.; }
  return vec2(d*.75,mat);
}

// ---------- shoes ----------
float unevenCap(vec2 p,float r1,float r2,float h){ p.x=abs(p.x); float b=(r1-r2)/h,a=sqrt(1.-b*b),k=dot(p,vec2(-b,a)); if(k<0.)return length(p)-r1; if(k>a*h)return length(p-vec2(0,h))-r2; return dot(p,vec2(a,b))-r1; }
vec2 shoe(vec3 p){
  float H,sh;
#if STYLE==0
  H=.152; sh=.032;
#elif STYLE==1
  H=.098; sh=.027;
#else
  H=.112; sh=.04;
#endif
  vec3 q=p; q.y-=2.*pow(clamp(q.z-.085,0.,.1),2.);
#if STYLE==2
  q.y+=0.;
#endif
  float o=unevenCap(vec2(q.x-.004*smoothstep(0.,.1,q.z),q.z+.05),.037,.0475,.152);
#if STYLE==2
  o-=.004+.004*sin(q.z*46.+1.)*smoothstep(.04,.0,q.y);
#endif
  vec2 w=vec2(o,abs(q.y-sh*.5)-sh*.5); float sole=min(max(w.x+.006,w.y+.006),0.)+length(max(w+.006,0.))-.006;
#if STYLE!=1
  // heel lift
  sole=min(sole,max(o+.002,abs(q.y-sh*.6)-sh*.6-.006*smoothstep(.02,-.08,q.z)));
#endif
  float u=ell(q-vec3(0,sh+.004,.088),vec3(.044,.04,.064));
  u=smin(u,cap(q,vec3(0,sh+.016,.082),vec3(0,.09,.0),.029,.036),.03);
  u=smin(u,ell(q-vec3(0,.062,-.042),vec3(.0385,.062,.043)),.03);
  u=smin(u,cap(q,vec3(0,.075,-.028),vec3(0,H,-.03),.041,.0405+.004*step(.14,H)),.025);
  u=smax(u,o-.001,.012); u=smax(u,sh*.6-q.y,.004);
  // collar line dips at the ankle sides and rises at tongue / heel
  float rim=H-.012+.016*smoothstep(-.04,-.075,q.z)+.03*smoothstep(-.01,.03,q.z);
  u=smax(u,q.y-rim,.012);
  float mat=30.;
  float hole=cap(q,vec3(0,.085,-.026),vec3(0,.25,-.032),.028,.034);
  if(-hole>u){ u=smax(u,-hole,.008); mat=33.; }
  // tongue + laces
  vec3 t=q-vec3(0,H-.012,H>.14?.012:.018); t.yz=rot(.85)*t.yz;
  float tg=rbox(t-vec3(0,.0,-.004),vec3(.022,.006,.036),.006);
  if(tg<u){ u=smin(u,tg,.004); }
  float seam=abs(q.z-.052-q.y*.35+.5*pow(q.x*9.,2.)*.05);
  u+=.0016*smoothstep(.0035,0.,abs(seam-.0))*step(sh,q.y);
  u+=.0014*smoothstep(.003,0.,abs(q.z+.028+q.y*.25))*step(sh,q.y);
  vec2 r=vec2(u,mat);
  r=U(r,vec2(sole,q.y<sh*.32?32.:31.));
  vec3 va=vec3(0,sh+.046,.08), vb=vec3(0,H*.62+.04,.022); vec3 vd=normalize(vb-va); float al=dot(q-va,vd)/length(vb-va);
#if STYLE!=2
  for(int i=0;i<5;i++){ float f=float(i)/4.; float l=max(max(abs(u)-.0035,abs(al-f)*length(vb-va)-.0032),max(abs(q.x)-.024,sh+.03-q.y)); r=U(r,vec2(l,34.)); }
#else
  for(int i=0;i<2;i++){ float f=float(i); float l=smax(smax(abs(u)-.0038,abs(al-.15-f*.75)*length(vb-va)-.0115,.003),sh+.016-q.y,.004); r=U(r,vec2(l,34.)); }
  float pod=ell(q-vec3(0,sh*.5,-.055),vec3(.047,.017,.042)); r=U(r,vec2(pod,35.));
#endif
  return vec2(r.x*.8,r.y);
}
vec2 mapShoes(vec3 p){
#if PRODUCT==1
  return shoe(p);
#else
  if(p.y>.3) return vec2(max(p.y-.3,.02),30.);
  float sx=p.x<0.?-1.:1.;
  vec3 q=vec3(abs(p.x)-.11,p.y,p.z+.005); q.xz=rot(.16)*q.xz; q.x*=sx>0.?1.:1.;
  return shoe(q);
#endif
}

// ---------- accessories (held in the figure's right hand, image-left) ----------

vec2 mapAcc(vec3 p){ p.x+=HX;
  vec2 r=vec2(1e3,40.);
#if STYLE==0
  vec3 c=p-vec3(-.345,.315,.06); c.xz=rot(-.16)*c.xz;
  vec3 b=vec3(.165,.25,.105);
  float rib=0.; float d=rbox(c,b,.038);
  float f=abs(fract(c.x*22.)-.5); if(abs(c.x)<.135&&abs(c.y)<.215) d+=.0045*smoothstep(.22,.06,f)*smoothstep(.215,.2,abs(c.y));
  d+=.004*smoothstep(.004,.0015,abs(c.z));
  r=vec2(d,40.);
  // corner guards + handle plate
  vec3 ac=abs(c); float g=rbox(ac-(b-vec3(.018)),vec3(.03),.028); r=U(r,vec2(smax(g,d-.004,.004),41.));
  float plate=rbox(c-vec3(0,.15,.105),vec3(.036,.02,.005),.004); r=U(r,vec2(plate,42.));
  for(int i=0;i<2;i++){ for(int j=0;j<2;j++){ vec3 w=c-vec3(i==0?-.118:.118,-.278,j==0?-.07:.07);
    float wh=length(vec2(max(abs(w.x)-.011,0.),length(w.yz)-.02))-.005; r=U(r,vec2(wh,43.));
    r=U(r,vec2(rbox(w-vec3(0,.022,0),vec3(.022,.016,.02),.006),43.)); } }
  // telescopic handle reaches the palm
  vec3 h=c; float y0=.25,y1=.772-.315;
  float post=length(vec2(abs(h.x-.062)-.058,h.z+.03))-.0062; post=max(post,max(y0-h.y,h.y-y1)); r=U(r,vec2(post,42.));
  float grip=cap(h,vec3(.0,y1,-.03),vec3(.124,y1,-.03),.0125,.0125); r=U(r,vec2(grip,43.));
  float top=length(vec2(length(vec2(c.x,(c.y-.258)*1.9))-.055,c.z-.045))-.007; top=max(top,.25-c.y); r=U(r,vec2(top,43.));
#elif STYLE==1
  vec3 c=p-vec3(-.303,.5,.05);
  float y=c.y; float rr=mix(.108,.118,smoothstep(-.12,-.02,y)); rr=mix(rr,.066,smoothstep(.02,.115,y)); rr=mix(rr,.088,smoothstep(.115,.15,y));
  float an=atan(c.x,c.z);
  float gath=sin(an*22.)*.005*smoothstep(.02,.11,y);
  float d=length(c.xz*vec2(1.,1.12))-rr-gath; d=smax(d,-.125-y,.035); d=smax(d,y-.15,.008);
  float ql=max(puff(an*3.2+y*9.),0.)*max(puff(an*3.2-y*9.),0.);
  d-=.0075*ql*smoothstep(.06,.01,y)*smoothstep(-.125,-.09,y); d-=(fbm(c*26.)-.5)*.005;
  float in_=length(c.xz)-.052; if(y>.1){ d=smax(d,-max(in_,.11-y),.006); }
  r=vec2(d*.6,40.);
  float cord=torus(c-vec3(0,.112,0),.071,.0055); r=U(r,vec2(cord,42.));
  float tas=cap(c,vec3(.02,.11,.072),vec3(.032,.02,.112),.0045,.0045); r=U(r,vec2(tas,42.));
  r=U(r,vec2(cap(c,vec3(.032,.02,.112),vec3(.034,-.015,.115),.009,.006),42.));
  // strap through the hand
  vec3 s=c-vec3(.01,.12,-.01); float R=.148; vec2 e=vec2(s.x*2.4,s.y); float ring=abs(length(e)-R)*.5-.002; 
  float st=max(max(abs(length(vec2(s.x*2.35,s.y))-R)*.5-.0042,abs(s.z)-.011),-s.y); r=U(r,vec2(st*.8,41.));
#else
  vec3 c=p-vec3(-.335,.545,.075); c.xz=rot(-.45)*c.xz;
  float L=.17, rr=.098;
  float cyl=length(c.yz*vec2(1.,1.))-rr; vec2 w=vec2(cyl,abs(c.x)-L); float d=min(max(w.x+.02,w.y+.02),0.)+length(max(w+.02,0.))-.02;
  d-=(fbm(c*vec3(9,16,16))-.5)*.011; d+=.003*smoothstep(.004,.001,abs(abs(c.x)-.138)); 
  d+=.003*smoothstep(.004,.001,abs(c.z-.012))*step(0.,c.y);
  r=vec2(d*.8,40.);
  for(int i=0;i<2;i++){ float sx=i==0?-.075:.075;
    float band=max(max(abs(cyl)-.0065,abs(c.x-sx)-.0125),.02-c.y-.12); r=U(r,vec2(band*.8,41.)); }
  for(int i=0;i<2;i++){ float sz=i==0?-.028:.028; vec3 h=c-vec3(0,.085,sz); 
    float hd=length(vec2(length(vec2(h.x*1.0,h.y*.56))-.0745,h.z*(1.)+h.y*(i==0?-.16:.16)))-.0062; hd=max(hd,-h.y); r=U(r,vec2(hd*.56,41.)); }
  r=U(r,vec2(length(c-vec3(.172,0,0))-.011,42.)); 
#endif
  return r;
}

vec2 mapLayer(vec3 p){
#if LAYER==0
  return mapBody(p);
#elif LAYER==1
  return mapPants(p);
#elif LAYER==2
  return mapJacket(p);
#elif LAYER==3
  return mapShoes(p);
#else
  return mapAcc(p);
#endif
}
// target layer plus hold-outs that punch transparent holes
vec2 map(vec3 p){
  vec2 r=mapLayer(p);
#if PRODUCT==0
 #if LAYER==2
  r=U(r,vec2(sdSkin(p),100.));
 #elif LAYER==4
  float s=sdSkin(p); r=U(r,vec2(s,100.));
 #endif
#endif
  return r;
}
// cheap blockers used only for light transport, so layers shade each other
float mapShadow(vec3 p){
  float d=map(p).x;
#if PRODUCT==0
 #if LAYER!=2
  { float a,b; d=min(d,jacketBase(p,.98,.87,a,b)*.8); }
 #endif
 #if LAYER==3
  { vec3 q=vec3(abs(p.x),p.yz); d=min(d,cap(q,vec3(.1,.5,.01),vec3(.108,.1,-.01),.06,.05)); }
 #endif
 #if LAYER==0
  d=min(d, p.y>1.36&&p.y<1.6 ? sdHoodDown(p) : 1e3);
 #endif
#endif
  return d;
}
float trace(vec3 ro,vec3 rd,float t0,float t1,out float m){
  float t=t0; m=-1.;
  for(int i=0;i<150;i++){ vec2 h=map(ro+rd*t); if(h.x<.0004){ m=h.y; return t; } t+=h.x*.85; if(t>t1) break; }
  return -1.;
}
float occl(vec3 ro,vec3 rd,float t1){
  float t=.006; for(int i=0;i<44;i++){ float h=mapShadow(ro+rd*t); if(h<.0008) return 0.; t+=max(h*.9,.003); if(t>t1) break; } 
  if(rd.y<0.){ } return 1.;
}
vec3 normal(vec3 p){ vec2 e=vec2(1,-1)*.0009; return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x); }
vec3 env(vec3 d){
  vec3 c=mix(vec3(.62,.61,.60),vec3(.80,.84,.90),smoothstep(-.2,.6,d.y));
  c+=vec3(1.,.98,.94)*1.15*smoothstep(.1,.95,dot(d,normalize(vec3(-.95,.35,.35))));   // window wall
  c+=vec3(1.)*.35*smoothstep(.5,.95,dot(d,normalize(vec3(.75,.2,.6))));               // fill card
  c*=mix(.8,1.,smoothstep(-1.,-.1,d.y));
  return c;
}
vec3 pal(float t){ return .5+.5*cos(6.2831*(t+vec3(.0,.33,.62))); }

void material(vec3 p,vec3 n,vec3 v,float m,out vec3 alb,out float rough,out float spec,out float sheen){
  vec3 q=vec3(abs(p.x),p.yz); alb=uC0; rough=.6; spec=.04; sheen=.0;
  if(m==1.){ if(p.y>1.5){ p.y+=HY; q.y+=HY; } alb=vec3(.715,.485,.36); rough=.5; spec=.03;
    float lip=min(ell(q-vec3(.0052,1.5725,.0815),vec3(.0152,.0046,.011)),ell(p-vec3(0,1.566,.0815),vec3(.0150,.0052,.012)));
    alb=mix(alb,vec3(.66,.33,.29),smoothstep(.003,-.002,lip)*.7);
    float ck=exp(-dot(pow((q-vec3(.043,1.592,.06))/vec3(.024,.02,.03),vec3(2)),vec3(1))); alb=mix(alb,vec3(.72,.40,.32),ck*.35);
    float fr=step(.04,p.z);
    float bx=(q.x-.0305)/.0175, by=q.y-(1.6515+.0030*(1.-bx*bx)+.0005*bx);
    float br=smoothstep(.0030,.0012,abs(by)*(1.+.35*max(bx,0.)))*smoothstep(1.02,.75,abs(bx))*fr;
    alb=mix(alb,vec3(.16,.105,.08),br*.7*(.65+.35*noise(p*vec3(900,300,300))));
    float ex=(q.x-.0305)/.0155, k=max(1.-ex*ex,0.), up=.0049*k+.0009*ex, lo=-.0036*k+.0009*ex, ey=q.y-1.6255;
    float ins=smoothstep(.0006,-.0004,max(ey-up,lo-ey))*fr*step(abs(ex),1.);
    vec2 ic=vec2((p.x>0.?1.:1.)*(q.x-.0302),ey-.0006); float ir=length(ic);
    vec3 eye=mix(vec3(.72,.67,.64),vec3(.20,.115,.07),smoothstep(.0056,.0048,ir)); eye=mix(eye,vec3(.02),smoothstep(.0028,.0022,ir));
    eye=mix(eye,vec3(.02),smoothstep(.0056,.005,ir)*smoothstep(.0042,.0052,ir)*.6); eye*=mix(.62,1.,smoothstep(.0,.0035,up-ey));
    if(length(vec2(p.x-(p.x>0.?.0302:-.0302)+.0016,ey-.0024))<.0011) eye=vec3(1.1);
    alb=mix(alb,eye,ins); if(ins>.5){ rough=.18; }
    float lash=smoothstep(.0013,.0004,abs(ey-up-.0003))*smoothstep(1.16,.95,abs(ex))*fr; alb=mix(alb,vec3(.05,.035,.03),lash*.92);
    float crease=smoothstep(.0012,.0,abs(ey-up-.0038))*smoothstep(1.1,.7,abs(ex))*fr; alb*=1.-.18*crease;
    alb*=1.-.10*smoothstep(.0010,.0,abs(ey-lo))*smoothstep(1.,.8,abs(ex))*fr;
    float hl=hairLine(p); alb=mix(alb,vec3(.10,.07,.06),smoothstep(-.007,.004,hl)*step(1.655,p.y)*.75);
    if(q.y<1.36&&q.y>.87&&q.x<.2) alb=vec3(.55,.55,.56);
  } else if(m==2.){ alb=vec3(.115,.068,.046)*(.8+.45*noise(vec3(atan(p.y-1.67,abs(p.x)+.02)*60.,length(p.xy-vec2(0,1.67))*9.,3.))); rough=.42; spec=.05; }
  else if(m==10.){
    float sl,tor; jacketBase(p,1.,.86,sl,tor); float isSl=step(0.,tor-sl);
    alb=uC0; rough=.36; spec=.045; sheen=.12;
#if STYLE==1
    rough=.52; spec=.035;
    float yl=1.295-abs(p.x)*.2; bool yoke=p.y>yl; bool hoodz=p.y>1.425;
    float sideX=.092+.045*pow(abs(p.y-1.06)/.24,2.)*.6;
    if(isSl>.5||yoke||hoodz) alb=uC1; else if(q.x>sideX) alb=uC2;
    alb*=.97+.06*noise(p*900.);
#endif
    if(abs(p.x)<.0055&&p.z>.0&&isSl<.5&&p.y<1.475){ alb=mix(uC3,alb,.0); rough=.3; spec=.08; alb*=.6+.4*step(.5,fract(p.y*260.)); }
    vec3 pk=q-vec3(.096,1.0,.0); pk.xy=rot(.28)*pk.xy; if(p.z>0.&&isSl<.5&&abs(pk.y)<.06&&abs(pk.x)<.0028) alb=uC3*.8;
  } else if(m==14.){ alb=uC3*.55+uC0*.1; rough=.8; spec=.02; }
  else if(m==20.){ alb=uC0*(.93+.12*noise(p*vec3(800,500,800))); rough=.78; spec=.025; sheen=.1;
    if(p.y>.99){ alb*=.86; } 
#if STYLE==1
    float st=abs(abs(q.x-.171)); 
#endif
    if(p.z>0.&&abs(p.x)<.003&&p.y>.86) alb*=.7; }
  else if(m==24.){ alb=uC0*.45; rough=.9; spec=.01; }
  else if(m==30.){
    alb=uC0; rough=.5; spec=.045;
#if STYLE==0
    float toe=smoothstep(.0,.002,p.z-.128+pow(abs(p.x)*9.,2.)*.1); 
    float heel=step(p.z,-.048+p.y*.12); float coll=step(.128,p.y);
    alb=mix(alb,uC1,max(heel*step(.04,p.y)*step(p.y,.112),coll)); alb=mix(alb,uC0*.93,toe);
    float perf=length(fract(vec2(p.x,p.z)*120.)-.5); if(p.z>.105&&p.z<.145&&abs(p.x)<.02) alb*=mix(.55,1.,smoothstep(.18,.26,perf));
    float q1=abs(p.z-.036+(p.y-.06)*.55); if(q1<.004&&p.y<.1) alb=uC2; float q2=abs(p.z+.024-(p.y-.06)*.35); if(q2<.004&&p.y<.125) alb=uC2;
#elif STYLE==1
    float t=dot(n,normalize(vec3(.4,.6,.7)))*.55+p.z*3.2+p.y*2.4; alb=mix(uC0*.7,pal(t)*vec3(.50,.46,.62),.62); rough=.26; spec=.12;
    if(p.z<-.05&&p.y>.05) alb=uC1;
#else
    float mesh=sin(p.z*900.)*sin(p.y*900.+p.x*500.); alb=uC0*(.94+.08*mesh); rough=.75;
    if(p.z<-.046+p.y*.2) alb=uC1; if(p.z>.15) alb=uC2*.9;
#endif
  } else if(m==31.){ alb=uC3; rough=.55;
#if STYLE==0
    if(p.y<.017&&p.z>.02) alb=uC2; if(p.z<.0&&p.y>.012&&p.y<.026) alb=uC2;
#elif STYLE==1
    alb=uC3; if(p.y>.019) alb=uC1;
#else
    float wv=.02+.006*sin(p.z*46.+1.); if(p.y<wv) alb=uC1; 
#endif
  } else if(m==32.){ alb=uC2; rough=.6; }
  else if(m==33.){ alb=uC1*.35; rough=.9; spec=.01; }
  else if(m==34.){ alb=STYLE==1?uC1:(STYLE==2?uC2:vec3(.93)); rough=.7; }
  else if(m==35.){ alb=uC1; rough=.25; spec=.1; }
  else if(m==40.){ alb=uC0;
#if STYLE==0
    rough=.28; spec=.06; alb*=.97+.05*noise(p*500.);
#elif STYLE==1
    rough=.5; spec=.045;
#else
    rough=.42; spec=.05; alb*=.92+.14*noise(p*vec3(220,220,220));
#endif
  } else if(m==41.){ alb=uC1; rough=.45; spec=.05; }
  else if(m==42.){ alb=uC2; rough=.22; spec=.35; }
  else if(m==43.){ alb=vec3(.045); rough=.5; }
}
void main(){
  uint s=uint(gl_FragCoord.x)*1973u+uint(gl_FragCoord.y)*9277u+uint(uSeed)*26699u|1u;
  hash1(s);hash1(s);
  vec2 jit=vec2(hash1(s),hash1(s));
  vec2 uv=((gl_FragCoord.xy+jit-.5)*2.-uRes)/uRes.y;
  vec3 f=normalize(uTa-uRo),r=normalize(cross(f,vec3(0,1,0))),u=cross(r,f);
  vec3 rd=normalize(f+uTan*(uv.x*r+uv.y*u));
  float dist=length(uTa-uRo); float m; float t=trace(uRo,rd,max(dist-1.2,.1),dist+1.2,m);
  if(t<0.||m>=100.){ outColor=vec4(0); return; }
  vec3 p=uRo+rd*t,n=normal(p),v=-rd; float nv=clamp(dot(n,v),0.,1.);
  vec3 alb; float rough,spec,sheen; material(p,n,v,m,alb,rough,spec,sheen);
  alb=pow(alb,vec3(2.2)); 
  vec3 L=normalize(vec3(-.62,.62,.62)); L=normalize(L+.16*(vec3(hash1(s),hash1(s),hash1(s))-.5));
  float nl=max(dot(n,L),0.); vec3 col=vec3(0); vec3 sp=p+n*.0025;
  vec3 sunC=vec3(1.,.95,.88)*1.75;
  if(nl>0.){ float sh=occl(sp,L,1.2); vec3 h=normalize(L+v); float a=rough*rough; float nh=max(dot(n,h),0.); float D=a*a/(3.14159*pow(nh*nh*(a*a-1.)+1.,2.));
    float F=spec+(1.-spec)*pow(1.-max(dot(h,v),0.),5.); float Vt=.25/(mix(nl,1.,a*.5)*mix(nv,1.,a*.5)+.02);
    col+=sunC*sh*nl*(alb*.62+min(D,9.)*F*Vt*.8); }
  float z=hash1(s)*2.-1.,ph=hash1(s)*6.2831; vec3 d=normalize(n*1.001+vec3(sqrt(1.-z*z)*cos(ph),sqrt(1.-z*z)*sin(ph),z));
  float o=occl(sp,d,.45); vec3 amb=o>0.?env(d):alb*.22*env(n);
  if(d.y<0.&&p.y+d.y*.45<0.) amb*=mix(.35,1.,smoothstep(0.,.3,p.y));
  col+=alb*amb*.8;
  vec3 rr=reflect(-v,n); rr=normalize(rr+rough*rough*1.1*(vec3(hash1(s),hash1(s),hash1(s))-.5)*2.); 
  float F=spec+(max(1.-rough,spec)-spec)*pow(1.-nv,5.); if(dot(rr,n)>0.) col+=env(rr)*F*occl(sp,rr,.3)*mix(1.,.5,rough);
  col+=sheen*alb*pow(1.-nv,3.)*.9;
  if(m==1.) col+=alb*vec3(.10,.03,.015)*pow(1.-nv,2.);
  if(any(isnan(col))) col=vec3(0);
  outColor=vec4(min(col,vec3(6.)),1.);
}
