import{AdditiveBlending as x,BufferAttribute as s,BufferGeometry as f,EdgesGeometry as A,IcosahedronGeometry as E,LineBasicMaterial as T,LineSegments as m,Mesh as b,MeshBasicMaterial as D,PerspectiveCamera as z,Points as G,PointsMaterial as B,Scene as H,ShaderMaterial as C}from"three";import{COLORS as h,hex as p}from"./style.js";const c=new H,w=new z(62,1,.1,1e3);let M=1234567;const r=()=>(M=M*16807%2147483647)/2147483647,l=400,u=new Float32Array(l*6),P=new Float32Array(l*2);for(let e=0;e<l;e++){const a=6+Math.pow(r(),.8)*70,t=r()*Math.PI*2,n=[Math.cos(t)*a,Math.sin(t)*a,r()*240];u.set([...n,...n],e*6),P[e*2+1]=1}const d=new f;d.setAttribute("position",new s(u,3)),d.setAttribute("tail",new s(P,1));const g={time:{value:0}};c.add(new m(d,new C({uniforms:g,vertexShader:`
        attribute float tail;
        uniform float time;
        varying float fade;
        const float DEPTH = 240.0;
        const float SPEED = 10.0;
        const float STREAK = 1.2;
        void main() {
          float head = mod(position.z + SPEED * time, DEPTH) - DEPTH;
          float near = 1.0 + head / DEPTH;
          float z = tail > 0.5 ? max(head - STREAK * (1.0 + 3.0 * near), -DEPTH) : head;
          fade = tail > 0.5 ? 0.0 : 0.35 * min(1.0, near * 3.0) * min(1.0, -head / 12.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy, z, 1.0);
        }
      `,fragmentShader:`
        varying float fade;
        void main() {
          gl_FragColor = vec4(vec3(fade), 1.0);
        }
      `,blending:x,transparent:!0,depthWrite:!1})));const y=new Float32Array(1500*3);for(let e=0;e<1500;e++){const a=r()*2-1,t=r()*Math.PI*2,n=Math.sqrt(1-a*a);y.set([Math.cos(t)*n*600,Math.sin(t)*n*600,-Math.abs(a)*600-50],e*3)}const S=new f;S.setAttribute("position",new s(y,3)),c.add(new G(S,new B({color:4868682,size:1.6,sizeAttenuation:!1})));const v=new E(3,1),i=new b(v,new D({color:p(h.screen)}));i.add(new m(new A(v),new T({color:p(h.accent),transparent:!0,opacity:.85}))),c.add(i);let o=0;function R(e,a){o+=e,w.aspect=a,w.updateProjectionMatrix();const t=Math.PI*2/15;i.position.set(8*Math.sin(t*o),3.5*Math.sin(2*t*o),-46+12*Math.sin(t*o+1.2)),i.rotation.set(2*t*o,t*o,0),g.time.value=o}export{w as camera,i as probe,c as space,R as updateSpace};
