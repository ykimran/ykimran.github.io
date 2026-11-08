import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../private/studio.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf("fields.addEventListener('click',e=>{"),source.indexOf("editor.querySelectorAll('[data-tab]').forEach",source.indexOf("fields.addEventListener('click',e=>{")));
const changed=source.slice(source.indexOf('function changed(){'),source.indexOf('function updatePreview(){'));
const controls=source.slice(source.indexOf('function itemOrderControls('),source.indexOf('function showFields(){'));
function setup(){
 const calls={saved:[],preview:[],render:0,focus:0};let click;
 const parent={open:false},sameButton={disabled:false,focus(){calls.focus++}},item={open:false,closest:()=>parent,querySelector:()=>sameButton};
 const data={sections:[{id:'projects',items:[{title:'A',text:'edited description',url:'https://example.com/a'},{title:'B'},{title:'C'}]},{id:'research',items:[{title:'Upcoming paper'},{title:'Second paper'}]}]};
 const context={data,baseline:'baseline',DRAFT:'draft',previewTimer:0,fields:{addEventListener:(_,fn)=>{click=fn},querySelector:()=>item},message(){},localStorage:{setItem:(_,value)=>calls.saved.push(JSON.parse(value))},clearTimeout(){},setTimeout(fn){fn();return 1},updatePreview:()=>calls.preview.push(JSON.parse(JSON.stringify(data))),showFields:()=>calls.render++,esc:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
 vm.createContext(context);vm.runInContext(changed+controls+handler,context);
 return {data,calls,item,parent,context,move(value,disabled=false){click({target:{closest:()=>({dataset:{moveItem:value},disabled})}})}};
}
test('project reordering preserves edited content, saves draft, refreshes preview and restores focus',()=>{
 const t=setup(),edited=t.data.sections[0].items[0];t.move('0,0,1');
 assert.deepEqual(t.data.sections[0].items.map(x=>x.title),['B','A','C']);assert.equal(t.data.sections[0].items[1],edited);assert.equal(edited.text,'edited description');
 assert.deepEqual(t.calls.saved[0].data.sections[0].items.map(x=>x.title),['B','A','C']);assert.equal(t.calls.preview[0].sections[0].items[1].url,'https://example.com/a');
 assert.equal(t.item.open,true);assert.equal(t.parent.open,true);assert.equal(t.calls.focus,1);
 t.move('0,1,-1');assert.deepEqual(t.data.sections[0].items.map(x=>x.title),['A','B','C']);
});
test('future papers reorder independently from projects',()=>{
 const t=setup();t.move('1,1,-1');assert.deepEqual(t.data.sections[1].items.map(x=>x.title),['Second paper','Upcoming paper']);assert.deepEqual(t.data.sections[0].items.map(x=>x.title),['A','B','C']);
});
test('bounds, invalid indices and disabled controls do not alter or save data',()=>{
 const t=setup(),before=JSON.stringify(t.data);
 for(const value of ['0,0,-1','0,2,1','1,1,1','8,0,1','0,-1,1','0,1,0','0,1,2','0,no,1','0.5,0,1'])t.move(value);
 t.move('0,0,1',true);assert.equal(JSON.stringify(t.data),before);assert.equal(t.calls.saved.length,0);
 t.data.sections[1].items=[{title:'Only paper'}];t.move('1,0,1');t.move('1,0,-1');assert.equal(t.calls.saved.length,0);
});
test('controls expose position, escape titles, and disable unavailable directions',()=>{
 const t=setup();const one=t.context.itemOrderControls({items:[{}]},1,{title:'<Paper>'},0);assert.equal((one.match(/disabled/g)||[]).length,2);assert(one.includes('&lt;Paper&gt;'));assert(one.includes('1 of 1'));
 const middle=t.context.itemOrderControls(t.data.sections[0],0,t.data.sections[0].items[1],1);assert(!middle.includes('disabled'));assert(middle.includes('0,1,-1'));assert(middle.includes('0,1,1'));
});
