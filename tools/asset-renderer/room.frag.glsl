// Path-traced gallery: tall windows on the left, plaster back wall, polished concrete floor.
precision highp float; precision highp int;
out vec4 outColor;
uniform vec2 uRes; uniform float uSeed;
float hash1(inout uint s){ s=s*747796405u+2891336453u; uint w=((s>>((s>>28u)+4u))^s)*277803737u; w=(w>>22u)^w; return float(w)/4294967295.; }
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float n2(vec2 x){ vec2 i=floor(x),f=fract(x); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*n2(p); p=p*2.03+17.1; a*=.5; } return s; }
// room: x[-3.6,5], y[0,4.2], z back -2.6, front 9. left wall x=-3.6 is windows with piers.
const float LX=-3.35,RX=6.,BZ=-2.4,FZ=9.,H=4.6;
const vec3 SUN=normalize(vec3(-.80,.50,.52));
struct Hit{ float t; vec3 n; int m; vec3 p; };
void boxHit(vec3 ro,vec3 rd,vec3 c,vec3 b,int m,inout Hit h){
  vec3 o=ro-c,k=1./rd,n=k*o,q=abs(k)*b,t1=-n-q,t2=-n+q; float tn=max(max(t1.x,t1.y),t1.z),tf=min(min(t2.x,t2.y),t2.z);
  if(tn>tf||tf<1e-3) return; if(tn>1e-3&&tn<h.t){ h.t=tn; h.n=-sign(rd)*step(t1.yzx,t1)*step(t1.zxy,t1); h.m=m; } }
void scene(vec3 ro,vec3 rd,inout Hit h){
  float t;
  t=-ro.y/rd.y; if(t>1e-3&&t<h.t){ vec3 p=ro+rd*t; if(p.x>LX&&p.x<RX&&p.z>BZ&&p.z<FZ){ h.t=t;h.n=vec3(0,1,0);h.m=1; } }
  t=(BZ-ro.z)/rd.z; if(t>1e-3&&t<h.t){ vec3 p=ro+rd*t; if(p.x>LX&&p.x<RX&&p.y>0.&&p.y<H){ h.t=t;h.n=vec3(0,0,1);h.m=2; } }
  t=(H-ro.y)/rd.y; if(t>1e-3&&t<h.t){ vec3 p=ro+rd*t; if(p.x>LX&&p.x<RX&&p.z>BZ&&p.z<FZ){ h.t=t;h.n=vec3(0,-1,0);h.m=3; } }
  t=(RX-ro.x)/rd.x; if(t>1e-3&&t<h.t){ vec3 p=ro+rd*t; if(p.y>0.&&p.y<H&&p.z>BZ&&p.z<FZ){ h.t=t;h.n=vec3(-1,0,0);h.m=2; } }
  // window wall: piers, sill, header, mullions
  boxHit(ro,rd,vec3(LX+.16,H*.5,-1.02),vec3(.22,H*.5,.27),4,h);
  boxHit(ro,rd,vec3(LX-.1,H*.5,BZ+.05),vec3(.16,H*.5,.1),4,h);
  boxHit(ro,rd,vec3(LX+.06,H*.5,1.55),vec3(.2,H*.5,.2),4,h);
  boxHit(ro,rd,vec3(LX+.06,H*.5,4.2),vec3(.2,H*.5,.22),4,h);
  boxHit(ro,rd,vec3(LX+.06,H*.5,7.6),vec3(.2,H*.5,1.4),4,h);
  boxHit(ro,rd,vec3(LX-.05,H-.12,3.),vec3(.16,.14,6.),4,h);
  boxHit(ro,rd,vec3(LX-.02,.05,3.),vec3(.12,.06,6.),5,h);
  for(int i=0;i<6;i++){ float z=i==0?-1.72:i==1?.22:i==2?2.45:i==3?3.3:i==4?5.0:5.7; boxHit(ro,rd,vec3(LX-.03,H*.5,z),vec3(.04,H*.5,.028),5,h); }
  boxHit(ro,rd,vec3(LX-.03,1.02,3.),vec3(.035,.028,6.),5,h);
  boxHit(ro,rd,vec3(LX-.03,2.9,3.),vec3(.035,.028,6.),5,h);
}
vec3 sky(vec3 d){
  vec3 c=mix(vec3(.93,.96,1.),vec3(.40,.62,.92),smoothstep(.0,.55,d.y))*1.35;
  float cl=fbm(d.xy/max(abs(d.z)+.35,.2)*2.6+3.); c=mix(c,vec3(1.45),smoothstep(.48,.72,cl)*.8);
  float th=.12+.14*fbm(vec2(atan(d.z,d.x)*9.,2.)); float tr=smoothstep(th+.02,th-.03,d.y);
  vec3 g=mix(vec3(.20,.27,.14),vec3(.55,.56,.34),fbm(d.zy*vec2(16.,20.)))*.95; c=mix(c,g,tr*.85);
  return c;
}
void main(){
  uint s=uint(gl_FragCoord.x)*1973u+uint(gl_FragCoord.y)*9277u+uint(uSeed)*26699u|1u; hash1(s);hash1(s);
  vec2 uv=((gl_FragCoord.xy+vec2(hash1(s),hash1(s))-.5)*2.-uRes)/uRes.y;
  vec3 ro=vec3(0.,1.12,6.4),rd=normalize(vec3(uv.x*.262,uv.y*.262-.022,-1.));
  vec3 col=vec3(0),thr=vec3(1);
  for(int b=0;b<5;b++){
    Hit h; h.t=1e4; h.m=0; scene(ro,rd,h);
    if(h.m==0){ vec3 e=sky(rd); e*=b>0?1.2:.62; col+=thr*e; break; }
    vec3 p=ro+rd*h.t,n=h.n; vec3 alb=vec3(.74); float refl=0.,rg=0.;
    if(h.m==1){ float f=fbm(p.xz*1.4),g=fbm(p.xz*7.); alb=vec3(.60,.605,.61)*(.84+.2*f+.1*g);
      float jx=abs(fract(p.x/2.4+.5)-.5)*2.4,jz=abs(fract(p.z/2.4+.2)-.5)*2.4; alb*=1.-.22*smoothstep(.009,.003,min(jx,jz));
      float fr=pow(1.-abs(dot(rd,n)),5.); refl=.10+.55*fr; rg=.035+.06*f; }
    else if(h.m==2){ float f=fbm(p.xy*.9+9.),g=fbm(p.xy*5.); alb=vec3(.655,.665,.685)*(.93+.08*f+.04*g);
      float j=abs(p.x+.09); if(p.z<BZ+.01) alb*=1.-.10*smoothstep(.006,.002,j); if(p.y<.075) alb*=.9; }
    else if(h.m==4) alb=vec3(.82,.82,.81); else if(h.m==5) alb=vec3(.09); else if(h.m==3) alb=vec3(.82);
    if(refl>0.&&hash1(s)<refl){ vec3 j=vec3(hash1(s),hash1(s),hash1(s))-.5; rd=normalize(reflect(rd,n)+j*rg*vec3(1,.6,1)*1.6); if(rd.y<0.) rd.y=-rd.y; ro=p+n*1e-3; thr*=.95; continue; }
    thr*=alb;
    vec3 L=normalize(SUN+.030*(vec3(hash1(s),hash1(s),hash1(s))-.5)*2.); float nl=dot(n,L);
    if(nl>0.){ Hit q; q.t=1e4;q.m=0; scene(p+n*1e-3,L,q); if(q.m==0){ float leaf=1.; vec3 e=p+L*((LX-.4-p.x)/L.x); leaf=mix(.45,1.,smoothstep(.36,.56,fbm(e.zy*1.35+vec2(4.2,1.))));
       col+=thr*vec3(1.,.955,.88)*2.5*nl*leaf; } }
    // window portal light
    float z=hash1(s)*2.-1.,ph=hash1(s)*6.2831; rd=normalize(n*1.0005+vec3(sqrt(1.-z*z)*cos(ph),sqrt(1.-z*z)*sin(ph),z)); ro=p+n*1e-3;
    col+=thr*vec3(.185,.19,.20);   // soft fill standing in for the unlit half of the gallery
  }
  if(any(isnan(col))) col=vec3(0);
  outColor=vec4(min(col,vec3(4.)),1.);
}
