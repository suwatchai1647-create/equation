const $=s=>document.querySelector(s);
const FONTS={sarabunnew:['TH Sarabun New','THSarabunNew-Regular.ttf'],sarabunpsk:['TH Sarabun PSK','THSarabunPSK-Regular.ttf'],
 sarabun:['Sarabun','sarabun'],prompt:['Prompt','prompt'],kanit:['Kanit','kanit'],mitr:['Mitr','mitr'],charm:['Charm (ลายมือ)','charm'],serif:['Noto Serif Thai','noto-serif-thai'],tex:['ฟอนต์คณิตศาสตร์มาตรฐาน','THSarabunNew-Regular.ttf']};
const files=k=>FONTS[k][1].endsWith('.ttf')?[['fonts/'+FONTS[k][1],null]]:[
 [`fonts/${FONTS[k][1]}-thai-400-normal.woff2`,'U+0E00-0E7F,U+200C-200D,U+25CC'],[`fonts/${FONTS[k][1]}-latin-400-normal.woff2`,'U+0000-0E00,U+2000-206F']];
const fam=k=>'eq-'+k;
const faceCss=(k,url,range)=>`@font-face{font-family:'${fam(k)}';src:url(${url});${range?'unicode-range:'+range+';':''}}`;
document.head.appendChild(document.createElement('style')).textContent=Object.keys(FONTS).flatMap(k=>files(k).map(f=>faceCss(k,f[0],f[1]))).join('');
for(const k in FONTS)$('#font').add(new Option(FONTS[k][0],k));
MathfieldElement.fontsDirectory=new URL('fonts',location.href).href;MathfieldElement.soundsDirectory=null;

const say=t=>$('#status').textContent=t;
const store={get(){try{return JSON.parse(localStorage.eq||'{}')}catch{return{}}},set(v){try{localStorage.eq=JSON.stringify(v)}catch{}}};
let lines=[''],active=0;

/* ---------- editor ---------- */
function drawLines(focus){
 const box=$('#lines');box.textContent='';
 lines.forEach((v,i)=>{
  const d=document.createElement('div');d.className='line';
  const m=new MathfieldElement();d.append(m);box.append(d);
  m.mathVirtualKeyboardPolicy='manual';
  m.smartFence=true;m.setValue(v,{silenceNotifications:true});
  m.addEventListener('input',()=>{lines[i]=m.getValue('latex-expanded');changed()});
  m.addEventListener('focusin',()=>active=i);
  m.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&m.mode!=='latex'){e.preventDefault();lines.splice(i+1,0,'');active=i+1;drawLines(true);changed()}});
  if(lines.length>1){const x=document.createElement('button');x.textContent='✕';x.title='ลบบรรทัด';x.onclick=()=>{lines.splice(i,1);active=0;drawLines();changed()};d.append(x)}
  if(focus&&i===active)setTimeout(()=>m.focus(),50);
 });
}
const field=()=>$('#lines').querySelectorAll('math-field')[active]||$('#lines math-field');
/* ---------- แป้นกด ---------- */
const sym=(c,t)=>({show:c,tex:t||c});
const FRAC=sym('\\frac{\\square}{\\square}','\\frac{#@}{#?}'),SQ=sym('\\square^{2}','#@^{2}'),POW=sym('\\square^{\\square}','#@^{#?}'),SUB=sym('\\square_{\\square}','#@_{#?}'),
 ROOT=sym('\\sqrt{\\square}','\\sqrt{#0}'),NROOT=sym('\\sqrt[\\square]{\\square}','\\sqrt[#?]{#0}'),MIXED=sym('\\square\\frac{\\square}{\\square}','#?\\frac{#?}{#?}'),PAREN=sym('(\\square)','\\left(#0\\right)'),ABS=sym('|\\square|','\\left|#0\\right|');
const LEFT={show:'\\leftarrow',cmd:'moveToPreviousChar',name:'เลื่อนซ้าย'},RIGHT={show:'\\rightarrow',cmd:'moveToNextChar',name:'เลื่อนขวา'},DEL={label:'⌫ ลบ',cmd:'deleteBackward'},ENTER={label:'↵ บรรทัด',act:()=>$('#addLine').click()},SPACE={label:'เว้นวรรค',tex:'\;'};
const n=c=>sym(c);
/* ปุ่มเขียนสั้นๆ: 'โค้ด' หรือ 'หน้าปุ่ม@@โค้ดที่แทรก' (#@ = ตัวก่อนหน้า, #? = ช่องว่าง) */
const R=String.raw;
const keys=t=>t.trim().split('\n').map(l=>{const [a,b]=l.trim().split('@@');return sym(a.replace(/#[@?0]/g,R`\square `),b||a)});
const words=t=>t.trim().split(/\s+/).map(w=>sym(w));
const NAV=[LEFT,RIGHT,DEL,ENTER];
const PADS={
 'ตัวเลข':[n('7'),n('8'),n('9'),sym('\\div'),FRAC,MIXED,
  n('4'),n('5'),n('6'),sym('\\times'),SQ,POW,
  n('1'),n('2'),n('3'),n('-'),ROOT,NROOT,
  n('0'),n('.'),n('='),n('+'),PAREN,sym('\\pi'),
  sym('x'),sym('y'),...NAV],
 'พีชคณิต':[FRAC,SQ,POW,SUB,ROOT,NROOT,...keys(R`
  #@^{3}
  #@_{#?}^{#?}
  #@^{-1}
  \left(#?\right)
  \left[#?\right]
  \left\{#?\right\}
  \left|#?\right|
  \lfloor #?\rfloor
  \lceil #?\rceil
  \frac{#?}{#?+#?}
  \log_{#?}#?
  \ln #?
  \log #?
  e^{#?}
  10^{#?}
  #@!
  \binom{#?}{#?}
  {}^{#?}P_{#?}
  {}^{#?}C_{#?}
  \cancel{#?}
  \cdot
  a^{2}+b^{2}=c^{2}
  x=\frac{-b\pm\sqrt{b^{2}-4ac}}{2a}
  \begin{cases}#?\\#?\end{cases}@@\begin{cases}#?\\#?\end{cases}
  \begin{cases}#?\\#?\\#?\end{cases}@@\begin{cases}#?\\#?\\#?\end{cases}`),...NAV],
 'เครื่องหมาย':[...words(R`= \ne \approx \equiv \cong \sim < > \le \ge \ll \gg + - \pm \mp \times \div \cdot \ast \circ \oplus \otimes \propto : , \% \to \leftarrow \leftrightarrow \Rightarrow \Leftarrow \Leftrightarrow \mapsto \uparrow \downarrow \therefore \because \infty \dots \cdots \vdots \ddots ! ? \mid \nmid`),...NAV],
 'เรขาคณิต':[...keys(R`
  \overline{#0}
  \overleftrightarrow{#0}
  \overrightarrow{#0}
  \overset{\frown}{#0}
  \angle
  m\angle #?
  \measuredangle
  #@^{\circ}
  \triangle
  \square
  \odot
  \parallel
  \nparallel
  \perp
  \cong
  \sim
  \pi r^{2}
  2\pi r
  \frac{1}{2}bh@@\frac{1}{2}bh
  \sqrt{(x_{2}-x_{1})^{2}+(y_{2}-y_{1})^{2}}
  \left(#?,#?\right)
  #@'
  \mathrm{cm}
  \mathrm{cm}^{2}
  \mathrm{cm}^{3}
  \mathrm{m}
  \mathrm{m}^{2}
  \mathrm{km}`),...NAV],
 'ตรีโกณ':[...keys(R`
  \sin #?
  \cos #?
  \tan #?
  \cot #?
  \sec #?
  \csc #?
  \sin^{2}#?
  \cos^{2}#?
  \tan^{2}#?
  \sin^{-1}#?
  \cos^{-1}#?
  \tan^{-1}#?
  \arcsin #?
  \arccos #?
  \arctan #?
  \sinh #?
  \cosh #?
  \tanh #?`),...words(R`\theta \alpha \beta \gamma \phi \pi`),sym('\\square^{\\circ}','#@^{\\circ}'),FRAC,SQ,ROOT,PAREN,n('='),...NAV],
 'แคลคูลัส':[...keys(R`
  \lim_{#?\to#?}#?
  \lim_{x\to\infty}#?
  \lim_{x\to #?^{+}}#?
  \lim_{x\to #?^{-}}#?
  \frac{d}{dx}#?
  \frac{dy}{dx}
  \frac{d^{2}y}{dx^{2}}
  f'(x)
  f''(x)
  \frac{\partial #?}{\partial #?}
  \partial
  \nabla
  \int #?\,dx
  \int_{#?}^{#?}#?\,dx
  \iint #?\,dA
  \iiint #?\,dV
  \oint #?\,ds
  \left[#?\right]_{#?}^{#?}
  \sum_{#?}^{#?}#?
  \sum_{i=1}^{n}#?
  \prod_{#?}^{#?}#?
  f(x)
  f\left(#?\right)
  f^{-1}(x)
  (f\circ g)(x)
  \Delta x
  \infty
  \to
  \max
  \min`),...NAV],
 'เซต ตรรกะ':[...words(R`\in \notin \ni \subset \subseteq \not\subset \supset \supseteq \cup \cap \setminus \emptyset \mathbb{N} \mathbb{Z} \mathbb{Q} \mathbb{R} \mathbb{C} \mathbb{I} \wedge \vee \neg \to \leftrightarrow \equiv \forall \exists \nexists \vdash \models \mathrm{T} \mathrm{F}`),...keys(R`
  \left\{#?\right\}
  \left\{x\mid #?\right\}
  #@'
  #@^{c}
  \mathcal{P}\left(#?\right)
  n\left(#?\right)
  \bigcup_{#?}^{#?}
  \bigcap_{#?}^{#?}
  \left(#?,#?\right)
  \left[#?,#?\right)
  \left(#?,#?\right]`),...NAV],
 'เมทริกซ์ เวกเตอร์':[...keys(R`
  \begin{bmatrix}#?&#?\\#?&#?\end{bmatrix}@@\begin{bmatrix}#?&#?\\#?&#?\end{bmatrix}
  \begin{bmatrix}#?&#?&#?\\#?&#?&#?\\#?&#?&#?\end{bmatrix}@@\begin{bmatrix}#?&#?&#?\\#?&#?&#?\\#?&#?&#?\end{bmatrix}
  \begin{pmatrix}#?&#?\\#?&#?\end{pmatrix}@@\begin{pmatrix}#?&#?\\#?&#?\end{pmatrix}
  \begin{vmatrix}#?&#?\\#?&#?\end{vmatrix}@@\begin{vmatrix}#?&#?\\#?&#?\end{vmatrix}
  \begin{bmatrix}#?\\#?\end{bmatrix}@@\begin{bmatrix}#?\\#?\end{bmatrix}
  \begin{bmatrix}#?\\#?\\#?\end{bmatrix}@@\begin{bmatrix}#?\\#?\\#?\end{bmatrix}
  \begin{bmatrix}#?&#?&#?\end{bmatrix}
  \begin{array}{cc|c}#?&#?&#?\\#?&#?&#?\end{array}@@\left[\begin{array}{cc|c}#?&#?&#?\\#?&#?&#?\end{array}\right]
  #@^{T}
  #@^{-1}
  \det #?
  \vec{#?}
  \overrightarrow{#?}
  \hat{#?}
  \left\|#?\right\|
  \vec{i}
  \vec{j}
  \vec{k}
  \cdot
  \times
  \langle #?,#?\rangle`),...NAV],
 'สถิติ':[...keys(R`
  \bar{x}
  \mu
  \sigma
  \sigma^{2}
  s
  s^{2}
  \sum x
  \sum_{i=1}^{n}x_{i}
  \bar{x}=\frac{\sum x}{n}
  \sqrt{\frac{\sum (x-\bar{x})^{2}}{n-1}}
  P\left(#?\right)
  P\left(#?\mid #?\right)
  n!
  \binom{n}{r}
  E\left[#?\right]
  \mathrm{Var}\left(#?\right)
  z=\frac{x-\mu}{\sigma}
  \hat{p}
  \tilde{x}
  \chi^{2}
  x_{#?}
  f_{#?}`),...NAV],
 'จำนวนเชิงซ้อน':[...keys(R`
  i
  a+bi
  \bar{z}
  \left|z\right|
  \mathrm{Re}\left(#?\right)
  \mathrm{Im}\left(#?\right)
  e^{i\theta}
  r\left(\cos\theta+i\sin\theta\right)
  \sqrt{-#?}
  \mathbb{C}`),...NAV],
 'ตกแต่ง':[...keys(R`
  \bar{#?}
  \hat{#?}
  \tilde{#?}
  \dot{#?}
  \ddot{#?}
  \vec{#?}
  \overline{#?}
  \underline{#?}
  \overbrace{#?}^{#?}
  \underbrace{#?}_{#?}
  \overset{#?}{#?}
  \underset{#?}{#?}
  \xrightarrow{#?}
  \boxed{#?}
  \cancel{#?}
  \mathbf{#?}
  \mathrm{#?}
  \prime
  \star
  \bullet`),...NAV],
 'กรีก':[...words(R`\alpha \beta \gamma \delta \epsilon \varepsilon \zeta \eta \theta \vartheta \iota \kappa \lambda \mu \nu \xi \pi \rho \sigma \tau \upsilon \phi \varphi \chi \psi \omega \Gamma \Delta \Theta \Lambda \Xi \Pi \Sigma \Phi \Psi \Omega`),...NAV],
 'ตัวอักษร':[...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(c=>sym(c)).concat([{label:'ก ข ค',act:()=>$('#addThai').click()},SPACE,...NAV])
};
function press(k){
 if(k.act)return k.act();
 const m=field();m.focus();
 if(k.cmd)m.executeCommand(k.cmd);else m.insert(k.tex,{selectionMode:k.tex.includes('#')?'placeholder':'after',focus:true});
 lines[active]=m.getValue('latex-expanded');changed();
}
let padName='ตัวเลข';
async function drawPad(){
 await MathJax.startup.promise;
 const box=$('#tools'),nav=$('#nav');box.textContent='';nav.textContent='';box.scrollTop=0;
 for(const k of PADS[padName]){
  const b=document.createElement('button');b.type='button';
  if(k.label)b.textContent=k.label;else{b.append(MathJax.tex2svg(k.show,{display:false}).querySelector('svg'));b.setAttribute('aria-label',k.name||k.show)}
  if(/^[0-9.]$/.test(k.tex||''))b.className='num';
  if(k.cmd||k.act)b.className='ctl';
  if(k.show&&k.show.length>16&&/\\(lim|sqrt\{|int|circ g)|a\^\{2\}\+|x=|\\frac\{\\sum|z=|r\\left/.test(k.show))b.style.gridColumn='span 2';
  b.onpointerdown=b.onmousedown=e=>e.preventDefault();b.onclick=()=>press(k);(NAV.includes(k)?nav:box).append(b);
 }
 for(const t of $('#tabs').children)t.setAttribute('aria-selected',t.textContent===padName);
}
for(const name in PADS){const t=document.createElement('button');t.type='button';t.textContent=name;t.setAttribute('role','tab');t.onclick=()=>{padName=name;drawPad()};$('#tabs').append(t)}
drawPad();
$('#addLine').onclick=()=>{lines.push('');active=lines.length-1;drawLines(true);changed()};
$('#addThai').onclick=()=>{const t=$('#thaiText');if(t){t.focus();return}const i=document.createElement('input');i.id='thaiText';i.placeholder='พิมพ์ข้อความแล้วกด Enter';
 i.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){const v=i.value.replace(/[\\{}$&#^_%~]/g,'');const m=field();if(v){m.insert(`\\text{${v}}`);lines[active]=m.getValue('latex-expanded');changed()}i.remove()}};$('#addThai').after(i);i.focus()};
$('#clear').onclick=()=>{lines=[''];active=0;drawLines(true);changed()};
$('#src').oninput=e=>{lines=e.target.value.split('\n');active=0;drawLines();changed(true)};
for(const id of['font','size','color'])$('#'+id).oninput=()=>changed();

/* ---------- render ---------- */
function thaiWrap(s){ /* ครอบข้อความไทยที่อยู่นอก \text{} */
 let out='',i=0;
 while(i<s.length){
  const t=/^\\(text[a-z]*|mbox)\s*\{/.exec(s.slice(i));
  if(t){let j=i+t[0].length,d=1;while(j<s.length&&d){if(s[j]==='{')d++;if(s[j]==='}')d--;j++}out+=s.slice(i,j);i=j;continue}
  const th=/^[฀-๿](?:[฀-๿ ]*[฀-๿])?/.exec(s.slice(i));
  if(th){out+=`\\text{${th[0]}}`;i+=th[0].length;continue}
  out+=s[i++];
 }
 return out;
}
const clean=s=>thaiWrap(s.replace(/\\doubleprime/g,'\\prime\\prime ').replace(/\\tripleprime/g,'\\prime\\prime\\prime ').replace(/\\bm(?![a-zA-Z])/g,'\\boldsymbol').replace(/\\placeholder(\[[^\]]*\])?\{\}/g,'\\square '));
const used=()=>lines.map(l=>l.trim()).filter(Boolean);
const fullTex=()=>{const u=used().map(clean);return u.length<2?u[0]||'':`\\begin{gathered}${u.join('\\\\[4pt]')}\\end{gathered}`};
async function toMml(tex){
 const s=await MathJax.tex2mmlPromise(tex,{display:true});
 const bad=new DOMParser().parseFromString(s,'application/xml').querySelector('merror');
 if(bad)throw new Error('สมการยังไม่ครบ: '+bad.textContent);
 return s;
}
function useFont(mml,k){
 if(k==='tex')return mml;
 const doc=new DOMParser().parseFromString(mml,'application/xml');
 for(const n of [...doc.querySelectorAll('mn,mi')]){
  const t=n.textContent;if(!/^[A-Za-z0-9.,]+$/.test(t))continue;
  const e=doc.createElementNS(n.namespaceURI,'mtext');e.textContent=t;
  const v=n.getAttribute('mathvariant')||(n.localName==='mi'&&t.length===1?'italic':'normal');
  if(!['normal','italic','bold','bold-italic'].includes(v))continue;
  e.setAttribute('mathvariant',v);e.setAttribute('mathsize','125%');
  const gap=()=>{const g=doc.createElementNS(n.namespaceURI,'mspace');g.setAttribute('width','0.17em');return g};
  /* ครอบด้วย mrow เสมอ: MathJax คำนวณความสูงของ mtext ที่ขยาย 125% ผิดเมื่ออยู่ใต้ขีด/หมวก (เช่น x̄) ทำให้วงเล็บและรากโตเกินจริง */
  const row=doc.createElementNS(n.namespaceURI,'mrow');
  if(n.localName==='mi'&&t.length>1&&n.parentNode.localName!=='msub'&&n.parentNode.localName!=='msup')row.append(gap(),e,gap());else row.append(e);
  n.replaceWith(row);
 }
 for(const n of doc.querySelectorAll('mtext'))if(/[฀-๿]/.test(n.textContent))n.setAttribute('mathsize','125%');
 return new XMLSerializer().serializeToString(doc);
}
/* ให้ MathJax วัดความสูงตัวอักษรจากรูปร่างจริง ไม่ใช่กรอบบรรทัดของฟอนต์ (เลขยกกำลังจะได้ไม่ลอย) */
let currentFont='';
function patchMeasure(){
 const o=MathJax.startup.output;if(o.eqPatched)return;o.eqPatched=true;
 const orig=o.measureTextNode.bind(o),g=document.createElement('canvas').getContext('2d');
 o.measureTextNode=t=>{const m=orig(t),size=parseFloat(t.getAttribute('font-size'))||884;
  g.font=`${t.getAttribute('font-style')||''} ${t.getAttribute('font-weight')||''} 100px ${currentFont}`;
  const b=g.measureText(t.textContent);
  return{w:m.w,h:Math.max(0,b.actualBoundingBoxAscent)*size/1e5,d:Math.max(0,b.actualBoundingBoxDescent)*size/1e5}};
}
/* เครื่องหมายรากที่สูงมากประกอบจากหลายชิ้น หัวของมันบางกว่าเส้นขีดบน จึงเห็นเป็นขั้นบันได: ปรับเส้นให้หนาเท่าหัวราก */
function smoothLines(svg){
 for(const n of svg.querySelectorAll('[data-mml-node=msqrt],[data-mml-node=mroot]')){
  const top=n.querySelector(':scope>[data-mml-node=mo] path[data-c=E001]'),bar=n.querySelector(':scope>rect');
  if(!top||!bar)continue;
  const h=+bar.getAttribute('height'),t=40;
  if(h>t){bar.setAttribute('y',+bar.getAttribute('y')+h-t);bar.setAttribute('height',t)}
 }
 /* ตัวเอียงของฟอนต์ไทยเป็นการเอียงเทียม ขีด/หมวกด้านบน (x̄ ŷ) จึงเยื้องไปทางซ้าย: เลื่อนตามความเอียงของตัวอักษร */
 const g=document.createElement('canvas').getContext('2d');
 for(const n of svg.querySelectorAll('[data-mml-node=mover]')){
  const [base,acc]=n.children,txt=base?.querySelector('[data-mml-node=mtext]');
  if(!acc||!txt||base.querySelectorAll('[data-mml-node=mtext]').length!==1||!/italic/.test(txt.getAttribute('style')||''))continue;
  const s=/scale\(([\d.]+)\)/.exec(txt.getAttribute('transform')||'');
  g.font=`100px ${txt.style.fontFamily}`;
  const h=g.measureText(txt.textContent).actualBoundingBoxAscent*8.84*(s?+s[1]:1);
  acc.setAttribute('transform',`translate(${(h*0.22).toFixed(1)} 0) `+(acc.getAttribute('transform')||''));
 }
}
const cache={};
const dataUrl=blob=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(blob)});
const embed=k=>cache[k]??=Promise.all(files(k).map(async([u,range])=>{const r=await fetch(u);if(!r.ok)throw new Error('โหลดฟอนต์ไม่ได้');return faceCss(k,await dataUrl(await r.blob()),range)})).then(a=>a.join('')).catch(e=>{delete cache[k];throw e});
let queue=Promise.resolve();
function render(){const r=queue.then(doRender);queue=r.catch(()=>{});return r}
async function doRender(){
 const tex=fullTex();if(!tex)throw new Error('ยังไม่ได้พิมพ์สมการ');
 const k=$('#font').value,pt=Math.min(96,Math.max(8,+$('#size').value||16)),color=$('#color').value;
 await MathJax.startup.promise;
 await Promise.all([document.fonts.load(`20px '${fam(k)}'`,'กขabc123')]);
 const o=MathJax.startup.output.options;o.mtextFont=`'${fam(k)}'`;currentFont=o.mtextFont;patchMeasure();
 const mml=useFont(await toMml(tex),k);
 const node=await MathJax.mathml2svgPromise(mml,{display:true});
 const svg=node.querySelector('svg').cloneNode(true);
 smoothLines(svg);
 let [x,y,w,h]=svg.getAttribute('viewBox').split(/\s+/).map(Number);
 const pad=120;x-=pad;y-=pad;w+=2*pad;h+=2*pad;
 const wpt=w*pt/1000,hpt=h*pt/1000,depth=(y+h)*pt/1000;
 svg.setAttribute('viewBox',[x,y,w,h].join(' '));svg.setAttribute('width',wpt+'pt');svg.setAttribute('height',hpt+'pt');
 svg.removeAttribute('style');svg.setAttribute('color',color);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
 if(svg.querySelector('text')){const st=document.createElementNS('http://www.w3.org/2000/svg','style');st.textContent=await embed(k);svg.prepend(st)}
 return{svg,text:new XMLSerializer().serializeToString(svg),wpt,hpt,depth,pt,k,color};
}
async function toCanvas(r,white,dpi=600){
 const s=Math.min(dpi/72,8000/r.wpt,8000/r.hpt);
 const c=document.createElement('canvas');c.width=Math.ceil(r.wpt*s);c.height=Math.ceil(r.hpt*s);
 const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(r.text.replace(/width="[^"]+pt"/,`width="${c.width}"`).replace(/height="[^"]+pt"/,`height="${c.height}"`));
 await img.decode();await new Promise(f=>setTimeout(f,120)); /* Safari รอฟอนต์ใน SVG */
 const g=c.getContext('2d');if(white){g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height)}g.drawImage(img,0,0,c.width,c.height);
 c.dpi=s*72;return c;
}
const crcT=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
async function pngBlob(r,white){ /* ใส่ค่า DPI ให้ Word วางได้ขนาดตรงกับ pt */
 const c=await toCanvas(r,white);const b=await new Promise(f=>c.toBlob(f,'image/png'));
 const a=new Uint8Array(await b.arrayBuffer()),chunk=new Uint8Array(21),v=new DataView(chunk.buffer),ppm=Math.round(c.dpi/0.0254);
 v.setUint32(0,9);chunk.set([112,72,89,115],4);v.setUint32(8,ppm);v.setUint32(12,ppm);chunk[16]=1;
 let crc=0xffffffff;for(let i=4;i<17;i++)crc=crcT[(crc^chunk[i])&255]^(crc>>>8);v.setUint32(17,(crc^0xffffffff)>>>0);
 return new Blob([a.slice(0,33),chunk,a.slice(33)],{type:'image/png'});
}
let timer;
function changed(fromSrc){
 if(fromSrc!==true)$('#src').value=lines.join('\n');
 store.set({lines,font:$('#font').value,size:$('#size').value,color:$('#color').value});
 $('#fallback').hidden=true;clearTimeout(timer);
 timer=setTimeout(async()=>{const p=$('#preview');if(!used().length){p.textContent='';$('#align').textContent='';say('');return}
  try{const r=await render();const s=r.svg.cloneNode(true);s.style.maxWidth='100%';s.style.height='auto';s.setAttribute('width',r.wpt*1.6+'pt');s.setAttribute('height',r.hpt*1.6+'pt');p.replaceChildren(s);$('#align').textContent=`จัดให้ตรงบรรทัด: ใน Word คลิกรูป กด ⌘D → ขั้นสูง → ตำแหน่ง: ต่ำลง ${Math.round(r.depth)} pt (รูปสูง ${Math.round(r.hpt)} pt)`;say('')}catch(e){say(e.message)}},250);
}

/* ---------- export ---------- */
let downloads=null,sample=null;
async function save(filename,blob){
 if(downloads)await downloads.save({filename,data:blob});
 else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
}
const guard=f=>async e=>{try{await f(e)}catch(err){say('ไม่สำเร็จ: '+(err.message||err.code||err))}};
for(const b of document.querySelectorAll('[data-save]'))b.onclick=guard(async()=>{
 const t=b.dataset.save,white=$('#white').checked;
 if(t==='tex'){if(!used().length)throw new Error('ยังไม่ได้พิมพ์สมการ');return save('equation.tex',new Blob([fullTex()],{type:'text/plain'}))}
 const r=await render();
 if(t==='svg')return save('equation.svg',new Blob([r.text],{type:'image/svg+xml'}));
 if(t==='png')return save('equation.png',await pngBlob(r,white));
 const c=await toCanvas(r,white);const pdf=new jspdf.jsPDF({unit:'pt',format:[r.wpt,r.hpt],orientation:r.wpt>r.hpt?'l':'p'});
 pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,r.wpt,r.hpt,undefined,'FAST');await save('equation.pdf',pdf.output('blob'));
});
$('#copyPng').onclick=async()=>{
 let blob;
 try{blob=render().then(r=>pngBlob(r,$('#white').checked));
  await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);say(`คัดลอกแล้ว วางด้วย ⌘V จากนั้นตั้งตำแหน่ง "ต่ำลง ${Math.round((await render()).depth)} pt"`);
 }catch(e){try{const i=$('#fallback');i.src=await dataUrl(await blob);i.hidden=false;say('คัดลอกอัตโนมัติไม่ได้: คลิกขวาที่รูปด้านล่าง แล้วเลือก "คัดลอกรูปภาพ"')}catch(x){say(x.message)}}
};
async function copyText(t,msg){try{await navigator.clipboard.writeText(t);say(msg)}catch{$('#src').closest('details').open=true;$('#src').value=t;$('#src').select();say('คัดลอกอัตโนมัติไม่ได้: กด ⌘C เพื่อคัดลอกข้อความที่เลือกไว้')}}
$('#copyTex').onclick=guard(()=>copyText(fullTex(),'คัดลอก LaTeX แล้ว'));
$('#copyMml').onclick=guard(async()=>{if(!used().length)throw new Error('ยังไม่ได้พิมพ์สมการ');await MathJax.startup.promise;
 const out=[];for(const l of used())out.push(await toMml(clean(l)));await copyText(out.join('\n'),'คัดลอกแล้ว วางใน Word ด้วย ⌘V')});

/* ---------- Word add-in ---------- */
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const W='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"';
function pkg(body,png){
 const part=(n,type,xml)=>`<pkg:part pkg:name="${n}" pkg:contentType="${type}"><pkg:xmlData>${xml}</pkg:xmlData></pkg:part>`;
 const rels='application/vnd.openxmlformats-package.relationships+xml',R='xmlns="http://schemas.openxmlformats.org/package/2006/relationships"',T='http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
 return `<pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage">`+
 part('/_rels/.rels',rels,`<Relationships ${R}><Relationship Id="rId1" Type="${T}officeDocument" Target="word/document.xml"/></Relationships>`)+
 part('/word/document.xml','application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',`<w:document ${W}><w:body>${body}</w:body></w:document>`)+
 (png?part('/word/_rels/document.xml.rels',rels,`<Relationships ${R}><Relationship Id="rId2" Type="${T}image" Target="media/eq.png"/></Relationships>`)+`<pkg:part pkg:name="/word/media/eq.png" pkg:contentType="image/png" pkg:compression="store"><pkg:binaryData>${png}</pkg:binaryData></pkg:part>`:'')+`</pkg:package>`;
}
function picBody(r){
 const cx=Math.round(r.wpt*12700),cy=Math.round(r.hpt*12700),id=1+Math.floor(Math.random()*1e8);
 const meta=esc('EQ1:'+JSON.stringify({lines:used(),font:r.k,size:r.pt,color:r.color}));
 return `<w:p><w:r><w:rPr><w:position w:val="${-Math.round(r.depth*2)}"/></w:rPr><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Equation ${id}" descr="${meta}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="eq.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}
const WORDFONT={sarabunnew:'TH Sarabun New',sarabunpsk:'TH SarabunPSK',sarabun:'Sarabun',prompt:'Prompt',kanit:'Kanit',mitr:'Mitr',charm:'Charm',serif:'Noto Serif Thai'};
/* editable=true: ตัวอักษร ตัวเลข และข้อความไทยเป็น "ข้อความปกติ" ในสมการ จึงเลือกเปลี่ยนฟอนต์ใน Word ได้ */
function styleRuns(omml,{font,hp,color,editable}){
 const M='http://schemas.openxmlformats.org/officeDocument/2006/math',Wn='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const d=new DOMParser().parseFromString(omml,'application/xml');if(d.querySelector('parsererror'))throw new Error('แปลงเป็นสมการ Word ไม่ได้ ลองแทรกเป็นรูปแทน');
 const el=(ns,name,attrs={})=>{const e=d.createElementNS(ns,name);for(const k in attrs)e.setAttributeNS(Wn,'w:'+k,attrs[k]);return e};
 for(const r of [...d.getElementsByTagNameNS(M,'r')]){
  const t=[...r.getElementsByTagNameNS(M,'t')].map(n=>n.textContent).join('').replace(/\uE000/g,'<').replace(/\uE001/g,'&');
  const old=r.getElementsByTagNameNS(M,'rPr')[0];
  const isText=!!old?.getElementsByTagNameNS(M,'nor').length,upright=isText||[...(old?.getElementsByTagNameNS(M,'sty')||[])].some(n=>n.getAttributeNS(M,'val')==='p'||n.getAttribute('m:val')==='p');
  const parts=!editable?[t]:isText?[t]:t.match(/[A-Za-z]+|[0-9]+(?:\.[0-9]+)?|[฀-๿]+|[^A-Za-z0-9฀-๿]+/g)||[t];
  for(const p of parts){
   const normal=editable&&(isText||/^[A-Za-z0-9.฀-๿]+$/.test(p)&&p!=='.');
   const run=el(M,'m:r');
   if(normal){const m=el(M,'m:rPr');m.append(el(M,'m:nor'));run.append(m)}else if(old)run.append(old.cloneNode(true));
   const w=el(Wn,'w:rPr'),f=normal?font:'Cambria Math';
   w.append(el(Wn,'w:rFonts',{ascii:f,hAnsi:f,cs:font,eastAsia:f}));
   if(normal&&!upright&&/^[A-Za-z]+$/.test(p)&&!/^(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|arcsin|arccos|arctan|log|ln|lim|max|min|exp|det)$/.test(p))w.append(el(Wn,'w:i'));
   w.append(el(Wn,'w:color',{val:color}),el(Wn,'w:sz',{val:hp}),el(Wn,'w:szCs',{val:hp}));run.append(w);
   const mt=el(M,'m:t');mt.setAttribute('xml:space','preserve');mt.textContent=p;run.append(mt);r.before(run);
  }
  r.remove();
 }
 return new XMLSerializer().serializeToString(d.documentElement);
}
async function ommlBody(editable){
 const {mml2omml}=await import('./vendor/mml2omml.js');await MathJax.startup.promise;
 const k=$('#font').value,opt={editable:editable&&k!=='tex',font:WORDFONT[k]||'Cambria Math',hp:Math.round((+$('#size').value||16)*2),color:$('#color').value.slice(1)};
 let body='';
 for(const l of used()){const safe=(await toMml(clean(l))).replace(/&(lt|#x3C|#60);/gi,'\uE000').replace(/&(amp|#x26|#38);/gi,'\uE001');body+=`<w:p>${styleRuns(mml2omml(safe),opt)}</w:p>`};
 return body;
}
async function wordInsert(ooxml){await Word.run(async c=>{c.document.getSelection().insertOoxml(ooxml,'Replace').select('End');await c.sync()});say('ใส่ใน Word แล้ว')}
$('#insPic').onclick=guard(async()=>{const r=await render();const b64=(await dataUrl(await pngBlob(r,$('#white').checked))).split(',')[1];await wordInsert(pkg(picBody(r),b64))});
for(const [id,editable] of[['#insEq',false],['#insFont',true]])$(id).onclick=guard(async()=>{if(!used().length)throw new Error('ยังไม่ได้พิมพ์สมการ');await wordInsert(pkg(await ommlBody(editable)))});
$('#load').onclick=guard(async()=>{await Word.run(async c=>{
 const p=c.document.getSelection().inlinePictures;p.load('items/altTextDescription');await c.sync();
 const d=p.items.map(i=>i.altTextDescription).find(t=>t&&t.startsWith('EQ1:'));
 if(!d)throw new Error('คลิกเลือกรูปสมการที่สร้างจากเครื่องมือนี้ก่อน');
 apply(JSON.parse(d.slice(4)));say('ดึงมาแล้ว แก้เสร็จกด "แทรกเป็นรูป" เพื่อแทนที่รูปเดิม')})});
if(new URLSearchParams(location.search).has('word')){
 const s=document.createElement('script');s.src='https://appsforoffice.microsoft.com/lib/1/hosted/office.js';
 s.onload=()=>Office.onReady(i=>{if(i.host==='Word')$('#wordBox').hidden=false});document.head.append(s);
}

/* ---------- photo / file ---------- */
let photo=null;
/* อ่านรูป: ใน Claude ใช้ window.claude ส่วนใน Word / เบราว์เซอร์ทั่วไปใช้ API key ของผู้ใช้เรียก Claude API โดยตรง */
const keyStore={get(){try{return localStorage.eqKey||''}catch{return''}},set(v){try{v?localStorage.eqKey=v:localStorage.removeItem('eqKey')}catch{}}};
const canRead=()=>!!(sample||keyStore.get());
function setPhoto(blob){photo=blob;const i=$('#photo');i.src=URL.createObjectURL(blob);i.hidden=false;$('#ocr').hidden=!canRead();
 if(canRead())say('');else{$('#keyBox').hidden=false;$('#keyBox').open=true;say('แนบรูปแล้ว ใส่ API key ด้านล่างเพื่อเปิดใช้การอ่านสมการจากรูป')}}
$('#saveKey').onclick=()=>{const v=$('#apiKey').value.trim();if(!/^sk-ant-/.test(v))return say('API key ต้องขึ้นต้นด้วย sk-ant-');keyStore.set(v);$('#apiKey').value='';$('#keyBox').open=false;if(photo)$('#ocr').hidden=false;say('บันทึก API key แล้ว')};
$('#delKey').onclick=()=>{keyStore.set('');$('#apiKey').value='';if(!sample)$('#ocr').hidden=true;say('ลบ API key แล้ว')};
const OCR_PROMPT='The image shows handwritten or printed math, possibly with Thai text. Transcribe every equation or math line exactly as written. Do not solve or correct anything. Reply with only JSON: {"lines":["LaTeX of line 1","LaTeX of line 2"]}. No $ delimiters. Put Thai words inside \\text{}. If there is no math, reply {"lines":[]}.';
async function readWithKey(blob){
 const data=(await dataUrl(blob)).split(',')[1];
 const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':keyStore.get(),'anthropic-version':'2026-10-21','anthropic-beta':'server-side-fallback-2026-07-01','anthropic-dangerous-direct-browser-access':'true'},
  body:JSON.stringify({model:'claude-opus-5-5',max_tokens:4000,fallbacks:'default',output_config:{effort:'low',format:{type:'json_schema',schema:{type:'object',properties:{lines:{type:'array',items:{type:'string'}}},required:['lines'],additionalProperties:false}}},
   messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:blob.type||'image/jpeg',data}},{type:'text',text:OCR_PROMPT}]}]})});
 const j=await res.json().catch(()=>({}));
 if(!res.ok){const e=new Error(res.status===401?'API key ไม่ถูกต้อง':res.status===429?'ใช้งานถี่เกินไป รอสักครู่แล้วลองใหม่':j.error?.message||'HTTP '+res.status);e.code=res.status===401?'bad_key':undefined;throw e}
 if(j.stop_reason==='refusal')throw new Error('ระบบปฏิเสธการอ่านรูปนี้');
 const t=(j.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('');
 return JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1));
}
async function shrink(src,w,h){const s=Math.min(1,1600/Math.max(w,h)),c=document.createElement('canvas');c.width=w*s;c.height=h*s;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(src,0,0,c.width,c.height);return new Promise(f=>c.toBlob(f,'image/jpeg',.9))}
const script=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('โหลดตัวอ่าน PDF ไม่ได้'));document.head.append(s)});
const take=guard(async f=>{
 if(!f)return;
 if(/\.(tex|txt)$/i.test(f.name)){lines=(await f.text()).split('\n').filter(l=>l.trim());if(!lines.length)lines=[''];active=0;drawLines();changed();return}
 if(f.type==='application/pdf'){say('กำลังเปิด PDF หน้าแรก…');const base='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  if(!window.pdfjsLib){await script(base+'pdf.worker.min.js');await script(base+'pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc=base+'pdf.worker.min.js'}
  const page=await(await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise).getPage(1),v=page.getViewport({scale:2}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;
  await page.render({canvasContext:c.getContext('2d'),viewport:v}).promise;return setPhoto(await shrink(c,c.width,c.height))}
 const img=new Image();img.src=URL.createObjectURL(f);await img.decode().catch(()=>{throw new Error('เปิดไฟล์นี้ไม่ได้ (รองรับ รูป, PDF, .tex, .txt)')});
 setPhoto(await shrink(img,img.naturalWidth,img.naturalHeight));
});
for(const id of['cam','file'])$('#'+id).onchange=e=>{take(e.target.files[0]);e.target.value=''};
addEventListener('paste',e=>{const f=[...e.clipboardData.files][0];if(f){e.preventDefault();take(f)}},true);
addEventListener('dragover',e=>e.preventDefault());addEventListener('drop',e=>{e.preventDefault();take(e.dataTransfer.files[0])});
$('#ocr').onclick=async()=>{
 const b=$('#ocr');b.disabled=true;say('กำลังอ่านรูป อาจใช้เวลาสักครู่…');
 try{
  const r=sample?await sample.json(OCR_PROMPT,{images:photo}):await readWithKey(photo);
  const got=(Array.isArray(r?.lines)?r.lines:[]).map(String).filter(l=>l.trim());
  if(!got.length)say('ไม่พบสมการในรูป ลองถ่ายให้ใกล้และชัดขึ้น');
  else{lines=used().concat(got);active=0;drawLines();changed();say('อ่านแล้ว กรุณาตรวจเทียบกับรูปก่อนใช้')}
 }catch(e){if(e.code==='bad_key'){$('#keyBox').hidden=false;$('#keyBox').open=true}
  say(e.code==='not_granted'?'ยังไม่ได้อนุญาตให้ใช้ Claude อ่านรูป':'อ่านรูปไม่สำเร็จ ลองใหม่อีกครั้ง ('+(e.message||e.code)+')')}
 b.disabled=false;
};

/* ---------- start ---------- */
function apply(d){lines=Array.isArray(d.lines)&&d.lines.length?d.lines.map(String):[''];if(FONTS[d.font])$('#font').value=d.font;if(d.size)$('#size').value=d.size;if(d.color)$('#color').value=d.color;active=0;drawLines();changed()}
const saved=store.get();apply(saved.lines?saved:{lines:['x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}']});
window.claude?.use('downloads').then(d=>downloads=d);
window.claude?.use('sample').then(async s=>{if(s&&(await s.limits().catch(()=>null))?.images){sample=s;if(photo)$('#ocr').hidden=false}});
if(!window.claude)$('#keyBox').hidden=false; /* นอก Claude (เช่นใน Word) ให้ตั้งค่า API key ได้ */
window.eq={PADS,toMml,clean,render,pngBlob,ommlBody,pkg,picBody,apply};

/* แถบปรับความใสของกระจก */
{const c=$('#clarity'),set=()=>document.documentElement.style.setProperty('--glass',c.value/100);
 try{if(localStorage.eqGlass)c.value=localStorage.eqGlass}catch{}
 c.oninput=()=>{set();try{localStorage.eqGlass=c.value}catch{}};set()}
