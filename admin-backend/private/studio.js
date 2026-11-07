(() => {
'use strict';
const template = document.getElementById('public-template') ? JSON.parse(document.getElementById('public-template').textContent) : '<!doctype html>\n' + document.documentElement.outerHTML;
const initialData = JSON.parse(document.getElementById('portfolio-data').textContent);
let baseline = JSON.stringify(initialData), data = structuredClone(initialData);
const site = document.getElementById('site'), editor = document.getElementById('editor-root');
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL = (value, image=false) => {
 const s = String(value || '').trim();
 if(image && /^data:image\/(jpeg|png|webp);base64,[a-z\d+/=]+$/i.test(s)) return s;
 try {const u = new URL(s); return (image ? ['https:'] : ['https:','http:','mailto:','tel:']).includes(u.protocol) ? u.href : '';} catch {return '';}
};
const paragraphs = t => `<p class="prose muted">${esc(t)}</p>`;
const tags = t => t ? `<div class="tags">${String(t).split(',').filter(t=>t.trim()).map(t=>`<span class="tag">${esc(t.trim())}</span>`).join('')}</div>` : '';
const link = (item,cls='button') => safeURL(item.url) ? `<a class="${cls}" href="${esc(safeURL(item.url))}" target="_blank" rel="noopener noreferrer">${esc(item.label)} ↗</a>` : '';
function sectionHTML(s,i){
 const head=`<div class="section-head"><div><div class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(s.label)}</div><h2>${esc(s.title)}</h2></div>${paragraphs(s.description)}</div>`;
 const items=s.items.map((a,index)=>{
  const image=safeURL(a.image,true), url=a.showLink===false?'':safeURL(a.url);
  const titleLink=(a.linkTitle??(s.layout==='projects'))&&Boolean(a.title.trim());
  const newTab=a.linkNewTab??!titleLink;
  const target=newTab?' target="_blank" rel="noopener noreferrer"':'';
  const label=a.linkLabel?.trim()||(s.layout==='timeline'?'Learn more':'View project');
  const heading=a.title?`<h3>${url&&titleLink?`<a class="project-title-link" href="${esc(url)}"${target}>${esc(a.title)} <span aria-hidden="true">↗</span></a>`:esc(a.title)}</h3>`:'';
  const action=url&&!titleLink?`<a class="button" href="${esc(url)}"${target}>${esc(label)} ↗</a>`:'';
  const details=`${a.metric?`<div class="gpa">${esc(a.metric)}</div>`:''}${heading}${paragraphs(a.text)}${tags(a.tags)}${action}`;
  const body=`${a.meta?`<div class="eyebrow">${esc(a.meta)}</div>`:''}${details}`;
  if(s.layout==='projects')return `<article class="project"><div class="project-art">${image?`<img class="project-photo" src="${esc(image)}" alt="${esc(a.title)}" loading="lazy">`:`<div class="plate">PROJECT / ${String(index+1).padStart(2,'0')}</div><small>${esc(a.title)}</small>`}</div><div class="project-copy">${body}</div></article>`;
  if(s.layout==='timeline')return `<article class="entry"><div class="date">${esc(a.meta)}</div><div>${details}</div></article>`;
  return `<article class="${s.layout==='cards'?'award':'text-block'}">${image?`<img class="project-photo" src="${esc(image)}" alt="${esc(a.title)}" loading="lazy">`:''}${body}</article>`;
 }).join('');
 return `<section id="${esc(s.id)}"><div class="wrap">${head}<div class="${s.layout==='cards'?'awards':s.layout==='timeline'?'timeline':''}">${items}</div></div></section>`;
}

const fontChoices = ['Plus Jakarta Sans','Manrope','DM Sans','Inter','System'];
function applyFonts(){
 const body=fontChoices.includes(data.bodyFont)?data.bodyFont:'Plus Jakarta Sans';
 const heading=[...fontChoices,'Georgia'].includes(data.headingFont)?data.headingFont:body;
 document.documentElement.style.setProperty('--body-font',body==='System'?'system-ui, sans-serif':`"${body}", sans-serif`);
 document.documentElement.style.setProperty('--heading-font',heading==='System'?'system-ui, sans-serif':heading==='Georgia'?'Georgia, serif':`"${heading}", sans-serif`);
 const chosen=[...new Set([body,heading])].filter(f=>fontChoices.includes(f)&&f!=='System');
 let fontLink=document.getElementById('portfolio-fonts');
 if(!fontLink){fontLink=document.createElement('link');fontLink.id='portfolio-fonts';fontLink.rel='stylesheet';document.head.append(fontLink);}
 const url='https://fonts.googleapis.com/css2?'+chosen.map(f=>'family='+encodeURIComponent(f).replace(/%20/g,'+')+':wght@400;500;600;700;800').join('&')+'&display=swap';
 if(chosen.length&&fontLink.getAttribute('href')!==url)fontLink.href=url;
}

function render(){
 applyFonts();
 const visible=data.sections.filter(s=>s.visible), photo=safeURL(data.photo,true);
 site.innerHTML=`<header><nav class="wrap" aria-label="Main navigation"><a class="brand" href="#home" aria-label="Home">${esc(data.name.split(/\s+/).map(n=>n[0]).join('').slice(0,3).toLowerCase())}.</a><div class="nav-actions"><button class="theme-toggle" type="button"></button><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-links">Menu ☰</button></div><div class="links" id="nav-links"><div class="nav-links">${visible.map(s=>`<a href="#${esc(s.id)}">${esc(s.label)}</a>`).join('')}<a href="#contact">Connect ↗</a></div></div></nav></header><main><div class="hero wrap" id="home"><div class="hero-grid ${photo?'':'no-photo'}"><div><div class="eyebrow">${esc(data.eyebrow)}</div><h1>${esc(data.name)}</h1><p class="intro prose">${esc(data.intro)}</p><div class="actions">${visible.some(s=>s.id==='projects')?'<a class="button primary" href="#projects">Explore my work ↘</a>':''}${data.links.slice(0,2).map(l=>link(l)).join('')}</div></div>${photo?`<img class="profile-photo" src="${esc(photo)}" alt="${esc(data.name)}">`:''}</div><div class="hero-bottom"><span>${esc(data.tagline)}</span><span>${esc(data.education)}</span></div></div>${visible.map(sectionHTML).join('')}<section class="contact" id="contact"><div class="wrap"><div class="eyebrow">Get in touch</div><h2>${esc(data.contactTitle)}</h2>${paragraphs(data.contactText)}<div class="connect-links">${data.links.map(l=>link(l,'button primary')).join('')}</div></div></section></main><footer><div class="wrap footer-row"><span>© ${new Date().getFullYear()} ${esc(data.name)}</span><span>Electrical &amp; Electronic Engineering</span></div></footer>`;
 document.title=data.name+' | Portfolio';
 let theme='dark';try{theme=localStorage.getItem('theme')||'dark';}catch{}
 const toggle=site.querySelector('.theme-toggle');
 function apply(t){document.documentElement.dataset.theme=t;theme=t;toggle.innerHTML=t==='light'?"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M20.7 13A8.3 8.3 0 0 1 11 3.3 8.4 8.4 0 1 0 20.7 13Z\"/></svg>":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"3.5\"/><path d=\"M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42\"/></svg>";toggle.title=`Switch to ${t==='light'?'dark':'light'} mode`;toggle.setAttribute('aria-label',`Switch to ${t==='light'?'dark':'light'} mode`);toggle.setAttribute('aria-pressed',String(t==='light'));document.querySelector('meta[name="theme-color"]').content=t==='light'?'#f7f8f5':'#0b1115';}
 apply(theme);toggle.onclick=()=>{apply(theme==='dark'?'light':'dark');try{localStorage.setItem('theme',theme);}catch{}};
 const menu=site.querySelector('.menu-toggle'), nav=site.querySelector('.links');
 menu.onclick=()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));};
 nav.querySelectorAll('a').forEach(a=>a.onclick=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');});
}
function serialize(sourceTemplate=template){
 const doc=new DOMParser().parseFromString(sourceTemplate,'text/html');
 doc.getElementById('portfolio-data').textContent=JSON.stringify(data).replace(/</g,'\\u003c');
 doc.title=data.name+' | Portfolio';doc.querySelector('meta[name="description"]').content=data.intro;
 return '<!doctype html>\n'+doc.documentElement.outerHTML;
}
render();

const DRAFT='ykimran-portfolio-draft-v1';let tab='profile',token='',busy=false,previewTimer,publishOpen=false;
editor.innerHTML=`<div class="studio"><div class="studio-bar"><div class="studio-brand"><small>YK / CONTENT STUDIO</small>Your portfolio, your way.</div><div class="studio-actions"><button id="preview-mode">Full preview</button><button id="download">Export website</button><button id="publish-open" class="primary">Publish changes ↗</button><button id="exit-editor">Sign out</button></div><p class="studio-status" role="status" aria-live="polite" id="status">Draft mode · Changes are private until you publish.</p></div><div class="publish-panel studio-panel" id="publish-panel" hidden><h3>Publish your changes</h3><p>Your GitHub session will save these changes to ykimran/ykimran.github.io. The public website will update after GitHub Pages rebuilds.</p><div class="studio-actions"><button id="publish-now" class="primary">Publish to live website</button><button id="cancel-publish">Cancel</button></div></div><div class="studio-layout"><aside class="studio-tabs" aria-label="Editor categories"><button data-tab="profile">Profile</button><button data-tab="typography">Fonts & style</button><button data-tab="sections">Sections & projects</button><button data-tab="connect">Connect with me</button><button data-tab="drafts">Drafts & backup</button></aside><div id="studio-fields"></div><aside class="studio-preview phone" aria-label="Live website preview"><div class="studio-preview-title">Live preview</div><div class="studio-actions" role="group" aria-label="Preview screen size"><button id="phone-preview" aria-pressed="true">Phone</button><button id="wide-preview" aria-pressed="false">Desktop</button></div><div class="preview-shell"><iframe id="live-preview" title="Portfolio preview" sandbox="allow-scripts"></iframe></div><p class="help">Changes appear here as you edit. Use Full preview for more room. Publish changes to update your live website.</p></aside></div></div>`;
const studio=editor.querySelector('.studio'), fields=editor.querySelector('#studio-fields'), status=editor.querySelector('#status');
const $=s=>editor.querySelector(s);
function message(t){status.textContent=t;}
function field(label,path,value,kind='input'){
 const id='field-'+path.replace(/\./g,'-');
 return `<label for="${id}">${esc(label)}</label>${kind==='textarea'?`<textarea id="${id}" data-path="${path}" rows="4">${esc(value)}</textarea>`:`<input id="${id}" data-path="${path}" value="${esc(value)}" type="${kind==='url'?'url':'text'}">`}`;
}

function itemLinkFields(a,s,path){
 const checked=a.linkTitle??(s.layout==='projects');
 const newTab=a.linkNewTab??!checked;
 return `<fieldset class="item-card"><legend>Link & display</legend>${field('Destination URL (optional)',path+'.url',a.url,'url')}<label class="check-label"><input type="checkbox" data-path="${path}.showLink" ${a.showLink!==false?'checked':''}> Show link on website</label><label class="check-label"><input type="checkbox" data-path="${path}.linkTitle" ${checked?'checked':''}> Make the title clickable instead of showing a button</label>${field('Button text',path+'.linkLabel',a.linkLabel??(s.layout==='timeline'?'Learn more':'View project'))}<label class="check-label"><input type="checkbox" data-path="${path}.linkNewTab" ${newTab?'checked':''}> Open link in a new tab</label><p class="help">Uncheck “Make the title clickable” to show a button. Button text is used only in button mode. Leave the URL empty for no link. If the title is empty, a button is shown instead.</p></fieldset>`;
}

function photoField(path,value,label='Image'){
 return `<label>${label}</label>${safeURL(value,true)?`<img class="inline-photo" src="${esc(safeURL(value,true))}" alt="Current ${esc(label)}">`:''}<input type="file" accept="image/jpeg,image/png,image/webp" data-photo="${path}" aria-label="Upload ${esc(label)}">${field('Or use an HTTPS image URL',path,value.startsWith('data:')?'':value,'url')}<button type="button" data-clear="${path}">Remove image</button>`;
}
function setPath(path,value){const parts=path.split('.');let target=data;parts.slice(0,-1).forEach(p=>target=target[p]);target[parts.at(-1)]=value;}
function getPath(path){return path.split('.').reduce((o,p)=>o[p],data);}
function changed(){
 try{localStorage.setItem(DRAFT,JSON.stringify({data,baseline,savedAt:new Date().toISOString()}));message('Draft saved on this device · Not published.');}catch{message('Draft could not be stored. Export a backup before closing.');}
 clearTimeout(previewTimer);previewTimer=setTimeout(updatePreview,300);
}
function updatePreview(){render();$('#live-preview').srcdoc=serialize();}
function showFields(){
 const openKeys=new Set(Array.from(fields.querySelectorAll("details[open][data-key]")).map(d=>d.dataset.key));
 editor.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.tab===tab)));
 if(tab==='profile')fields.innerHTML=`<h2>Make it yours.</h2><p>Your introduction, photo, and the first impression.</p><div class="studio-panel">${field('Full name','name',data.name)}${field('Field / headline','eyebrow',data.eyebrow)}${field('Introduction','intro',data.intro,'textarea')}${photoField('photo',data.photo,'profile photo')}${field('Tagline','tagline',data.tagline)}${field('Education summary','education',data.education)}</div>`;
 if(tab==='typography')fields.innerHTML=`<h2>Find your type.</h2><p>Choose your fonts and see them in the live preview before publishing.</p><div class="studio-panel"><label for="body-font">Body text & navigation</label><select id="body-font" data-path="bodyFont">${fontChoices.map(f=>`<option ${data.bodyFont===f?'selected':''}>${f}</option>`).join('')}</select><label for="heading-font">Headings</label><select id="heading-font" data-path="headingFont">${[...fontChoices,'Georgia'].map(f=>`<option ${data.headingFont===f?'selected':''}>${f}</option>`).join('')}</select><p class="help">Plus Jakarta Sans: modern and geometric.<br>Manrope: clean and polished.<br>DM Sans: soft and understated.<br>Inter: crisp and practical.<br>System: your device's default font.<br>Georgia: classic serif headings.</p></div>`;
 if(tab==='connect')fields.innerHTML=`<h2>Connect with me.</h2><p>Add LinkedIn, email, GitHub, or any other contact link.</p><div class="studio-panel">${field('Section heading','contactTitle',data.contactTitle)}${field('Contact introduction','contactText',data.contactText,'textarea')}${data.links.map((l,i)=>`<div class="item-card">${field('Button label',`links.${i}.label`,l.label)}${field('URL (https://, mailto:, or tel:)',`links.${i}.url`,l.url,'url')}<button class="danger" data-remove-link="${i}">Remove link</button></div>`).join('')}<button data-add-link>+ Add contact link</button></div>`;
 if(tab==='sections')fields.innerHTML=`<h2>Shape your story.</h2><p>Edit existing sections, add projects, and arrange your page.</p>${data.sections.map((s,i)=>`<details data-key="${esc(s.id)}" class="studio-panel" ${i===0?'open':''}><summary>${esc(s.label||'Untitled section')} · ${s.items.length} item${s.items.length===1?'':'s'}</summary><div class="studio-actions"><button data-move="${i},-1" ${i===0?'disabled':''}>↑ Move up</button><button data-move="${i},1" ${i===data.sections.length-1?'disabled':''}>↓ Move down</button><button class="danger" data-remove-section="${i}">Remove section</button></div><label class="check-label"><input type="checkbox" data-path="sections.${i}.visible" ${s.visible?'checked':''}> Show on website</label>${field('Navigation label',`sections.${i}.label`,s.label)}${field('Section heading',`sections.${i}.title`,s.title)}${field('Introduction',`sections.${i}.description`,s.description,'textarea')}<label for="layout-${i}">Layout</label><select id="layout-${i}" data-path="sections.${i}.layout">${['text','projects','timeline','cards'].map(l=>`<option value="${l}" ${s.layout===l?'selected':''}>${{text:'Text',projects:'Projects with images',timeline:'Timeline',cards:'Cards'}[l]}</option>`).join('')}</select>${s.items.map((a,j)=>`<details class="item-card"><summary>${esc(a.title||'Text block '+(j+1))}</summary>${field('Title',`sections.${i}.items.${j}.title`,a.title)}${field('Date / subtitle',`sections.${i}.items.${j}.meta`,a.meta)}${field('Description',`sections.${i}.items.${j}.text`,a.text,'textarea')}${field('Tags (separate with commas)',`sections.${i}.items.${j}.tags`,a.tags)}${field('Highlight / GPA (optional)',`sections.${i}.items.${j}.metric`,a.metric||'')}${itemLinkFields(a,s,`sections.${i}.items.${j}`)}${photoField(`sections.${i}.items.${j}.image`,a.image||'','item image')}<button class="danger" data-remove-item="${i},${j}">Remove item</button></details>`).join('')}<button data-add-item="${i}">+ Add ${s.layout==='projects'?'project':'item'}</button></details>`).join('')}<button class="primary" data-add-section>+ Add new section</button>`;
 if(tab==='drafts')fields.innerHTML=`<h2>Your work, saved.</h2><p>Drafts stay on this device. Export a backup to move between devices.</p><div class="studio-panel"><h3>Local draft</h3><p>A saved draft is never loaded over the live site automatically. Restore it here when you want to continue editing.</p><div class="studio-actions"><button id="restore-draft">Restore saved draft</button><button id="discard-draft" class="danger">Discard draft & reset</button></div></div><div class="studio-panel"><h3>Backup & restore</h3><button id="backup-json">Download content backup</button><label for="import-json">Restore a content backup (.json)</label><input id="import-json" type="file" accept="application/json,.json"><p class="help">Restoring changes only this draft until you publish.</p></div>`;
 fields.querySelectorAll('details[data-key]').forEach(d=>{if(openKeys.has(d.dataset.key))d.open=true;});
}
fields.addEventListener('input',e=>{if(e.target.dataset.path){setPath(e.target.dataset.path,e.target.type==='checkbox'?e.target.checked:e.target.value);changed();}});
fields.addEventListener('change',async e=>{
 const input=e.target;if(input.dataset.photo&&input.files[0]){
  try{const file=input.files[0];if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15000000)throw Error('Choose a JPG, PNG, or WebP image under 15 MB.');
   const image=await createImageBitmap(file),canvas=document.createElement('canvas');const scale=Math.min(1,720/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);image.close();setPath(input.dataset.photo,canvas.toDataURL('image/jpeg',.82));changed();showFields();}catch(err){message(err.message);}
 }
 if(input.id==='import-json'&&input.files[0]){try{if(input.files[0].size>2000000)throw Error('Backup is too large.');const candidate=JSON.parse(await input.files[0].text());validate(candidate,true);if(!confirm('Replace this draft with the backup?'))return;data=candidate;changed();showFields();}catch(err){message('Cannot import: '+err.message);}}
});
function validate(d, allowIncomplete=false){
 if(!d||typeof d.name!=='string'||(!allowIncomplete&&!d.name.trim())||!Array.isArray(d.sections)||!Array.isArray(d.links))throw Error('Enter a name and valid sections and links.');
 for(const k of ['eyebrow','intro','photo','tagline','education','contactTitle','contactText'])if(typeof d[k]!=='string')throw Error('Missing profile field: '+k);
 if(d.bodyFont&&!fontChoices.includes(d.bodyFont))throw Error('Choose a supported body font.');if(d.headingFont&&![...fontChoices,'Georgia'].includes(d.headingFont))throw Error('Choose a supported heading font.');
 const ids=new Set(['home','contact']);
 for(const s of d.sections){if(!s||typeof s.id!=='string'||!/^[-a-z0-9]+$/.test(s.id)||ids.has(s.id)||!['text','projects','cards','timeline'].includes(s.layout)||!Array.isArray(s.items)||typeof s.visible!=='boolean')throw Error('Invalid section.');ids.add(s.id);for(const k of ['label','title','description'])if(typeof s[k]!=='string')throw Error('Invalid section text.');for(const a of s.items){for(const k of ['title','text','meta','tags','url','image'])if(typeof a[k]!=='string')throw Error('Invalid item.');for(const k of ['showLink','linkTitle','linkNewTab'])if(a[k]!==undefined&&typeof a[k]!=='boolean')throw Error('Invalid link option.');if(a.linkLabel!==undefined&&typeof a.linkLabel!=='string')throw Error('Invalid button text.');if(a.metric!==undefined&&typeof a.metric!=='string')throw Error('Invalid highlight.');if(a.url&&!safeURL(a.url))throw Error('Use a valid project link.');if(a.image&&!safeURL(a.image,true))throw Error('Use HTTPS image URLs.');}}
 if(d.photo&&!safeURL(d.photo,true))throw Error('Use an HTTPS profile photo URL or upload an image.');
 for(const l of d.links)if(typeof l.label!=='string'||typeof l.url!=='string'||(!allowIncomplete&&(!l.label.trim()||!safeURL(l.url))))throw Error('Each contact link needs a label and valid URL.');
 if(JSON.stringify(d).length>700000)throw Error('Content is too large. Use image URLs or remove some uploaded images.');
}
fields.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.clear){setPath(b.dataset.clear,'');}
 else if('addLink'in b.dataset)data.links.push({label:'New link',url:''});
 else if('removeLink'in b.dataset){if(!confirm('Remove this contact link?'))return;data.links.splice(+b.dataset.removeLink,1);}
 else if('addSection'in b.dataset){data.sections.push({id:'section-'+Date.now().toString(36),label:'New section',title:'New section',description:'',layout:'cards',visible:true,items:[]});}
 else if('removeSection'in b.dataset){if(!confirm('Remove this section and its items?'))return;data.sections.splice(+b.dataset.removeSection,1);}
 else if('move'in b.dataset){const [i,delta]=b.dataset.move.split(',').map(Number);if(i+delta<0||i+delta>=data.sections.length)return;[data.sections[i],data.sections[i+delta]]=[data.sections[i+delta],data.sections[i]];}
 else if('addItem'in b.dataset){data.sections[+b.dataset.addItem].items.push({title:'New item',text:'',meta:'',tags:'',url:'',image:'',metric:''});}
 else if('removeItem'in b.dataset){if(!confirm('Remove this item?'))return;const [i,j]=b.dataset.removeItem.split(',').map(Number);data.sections[i].items.splice(j,1);}
 else if(b.id==='restore-draft'){try{const saved=JSON.parse(localStorage.getItem(DRAFT)||'null');if(!saved)throw Error('No saved draft on this device.');validate(saved.data,true);if(!confirm('Restore the saved draft?'))return;data=saved.data;message(saved.baseline===baseline?'Draft restored.':'Draft restored from an older version. Review it against the current website before publishing.');updatePreview();showFields();}catch(err){message(err.message);}return;}
 else if(b.id==='discard-draft'){if(!confirm('Discard this device’s saved draft and reset to the version loaded when you opened the editor?'))return;data=structuredClone(initialData);try{localStorage.removeItem(DRAFT);}catch{}updatePreview();showFields();message('Draft discarded.');return;}
 else if(b.id==='backup-json'){download('portfolio-backup.json',JSON.stringify(data,null,2),'application/json');return;}
 else return;
 changed();showFields();
});
editor.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;showFields();});
function download(name,content,type='text/html'){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#download').onclick=()=>{try{validate(data);download('index.html',serialize());message('Website exported. Upload index.html to GitHub to publish manually.');}catch(err){message(err.message);}};
$('#exit-editor').onclick=()=>{if(busy)return;location.href='/api/auth/signout';};
$('#preview-mode').onclick=()=>{studio.classList.toggle('preview-only');$('#preview-mode').textContent=studio.classList.contains('preview-only')?'Back to editor':'Full preview';};
function setPreviewSize(phone){
 $('.studio-preview').classList.toggle('phone',phone);
 $('#phone-preview').setAttribute('aria-pressed',String(phone));
 $('#wide-preview').setAttribute('aria-pressed',String(!phone));
}
$('#phone-preview').onclick=()=>setPreviewSize(true);$('#wide-preview').onclick=()=>setPreviewSize(false);
$('#publish-open').onclick=()=>{publishOpen=!publishOpen;$('#publish-panel').hidden=!publishOpen;if(publishOpen)studio.scrollTo({top:0,behavior:'smooth'});};
$('#cancel-publish').onclick=()=>{if(busy)return;publishOpen=false;$('#publish-panel').hidden=true;};
const API='/api/content';
async function github(method,body){const r=await fetch(API,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(30000)});if(!r.ok){const details=await r.json().catch(()=>({}));throw Error(details.error||(r.status===401?'Your session expired. Export a backup, then sign in again.':r.status===409?'The repository changed. Export a backup and refresh the editor.':'Publishing failed. Your draft is safe.'));}return r.json();}
function decode64(s){return new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
function encode64(s){const bytes=new TextEncoder().encode(s);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);}
$('#publish-now').onclick=async()=>{
 if(busy)return;
 try{
  validate(data);
  busy=true;$('#publish-now').disabled=true;message('Checking the latest repository version…');
  const current=await github('GET'), remoteDoc=new DOMParser().parseFromString(decode64(current.content),'text/html'), remoteData=remoteDoc.getElementById('portfolio-data');
  if(!remoteData||JSON.stringify(JSON.parse(remoteData.textContent))!==baseline||Array.from(remoteDoc.querySelectorAll('script,style')).filter(s=>s.id!=='portfolio-data').map(s=>s.textContent).join('')!==Array.from(new DOMParser().parseFromString(template,'text/html').querySelectorAll('script,style')).filter(s=>s.id!=='portfolio-data').map(s=>s.textContent).join(''))throw Error('The live repository has changed. Export a backup, refresh this editor, then restore or reapply your edits to the latest version.');
  message('Saving your changes to GitHub…');
  await github('PUT',{message:'Update portfolio content from content studio',content:encode64(serialize(decode64(current.content))),sha:current.sha,branch:'main'});
  baseline=JSON.stringify(data);try{localStorage.removeItem(DRAFT);}catch{}message('Published to GitHub. Your live website will update after GitHub Pages finishes rebuilding (usually a few minutes).');
 }catch(err){message('Not published: '+(err.name==='TimeoutError'?'Request timed out. Check GitHub before retrying; your draft is safe.':err.message));}
 finally{busy=false;$('#publish-now').disabled=false;}
};
showFields();updatePreview();
try{if(localStorage.getItem(DRAFT))message('A saved draft is available. Open Drafts & backup to restore it.');}catch{}
})();
