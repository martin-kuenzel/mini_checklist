const html_enc = (str) => {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// create a rather unique key id value
const cKey = ()=>{let ret=(new Date()).getTime();for(let i=0;i<5;i++) ret=ret+''+parseInt(Math.random()*9); return ret;}

// the default data (which is set when reset is done, or no checklists are existant)
let default_initial_storage = { 
    toggle_state:false, 
    APP_KEY: 'checklist_app_DEFAULT',
    title: "DEFAULT",
    checklist_items: {
        Kat_0: { title: "Mainstuff", items: [ { id:"0",title:"yep", /*opt*/ checked: false }, { id:"1",title:"this stuff" }, { id:"2",title:"is important" } ] },
        Kat_1: { title: "secondary Stuff", items: [ { id:"3",title:"Little" }, { id:"4",title:"side" }, { id:"5",title:"Stories" } ] }
    } 
};

let APP_KEY = localStorage.checklist_app_current || default_initial_storage.APP_KEY;
localStorage.checklist_app_current = APP_KEY;

// manager for localStorage saving and loading
class lStore {
    initial_storage(){ 
        return default_initial_storage;
    }
    constructor(){ this.load(); }
    reset() { let title_tmp = this.storage.title; localStorage[APP_KEY] = JSON.stringify(this.initial_storage()); this.load(); this.storage.title = title_tmp;  }
    load(){ 
        this.storage = localStorage[APP_KEY] ? JSON.parse(localStorage[APP_KEY]) : this.initial_storage() 
    }
    save(){ localStorage[APP_KEY] = JSON.stringify(this.storage); }
    
    getItem(kat,id){
    		let item = this.storage.checklist_items[kat].items.find(x => x.id==id );
    		return item;
    }
    
    toggleCheck(kat,id){ let item = this.getItem(kat,id); item.checked = item.checked == true ? false : true; this.save(); }
}
const lstore = new lStore();


// editing the title of the current checklist start
const checklist_title_edit = () => {
    if( APP_KEY == lstore.initial_storage().APP_KEY ) 
        return alert('Title of default can not be changed');

    document.querySelectorAll(`[id*="_ed"]:not([id="title_ed"])`).forEach(x=>x.classList.add('collapse'));

    document.getElementById('title_ed').classList.toggle('collapse');
    document.getElementById('title_input').value = lstore.storage.title;
}

// editing the title of the current checklist save
const checklist_title_edit_save = () => {
    lstore.storage.title = document.getElementById('title_input').value;
    lstore.save();
    document.location.reload()
};

// editing the title of the current checklist cancel
const checklist_title_edit_cancel = checklist_title_edit;

// deleting complete current checklist
const checklist_del_complete = () => {
    if( APP_KEY == lstore.initial_storage().APP_KEY ) 
        return alert('Deletion of the default list is not possible')

    delete localStorage[APP_KEY];
    localStorage.checklist_app_current = lstore.initial_storage().APP_KEY;
    document.location.reload()
};

// copying complete recent checklist
const checklist_add_complete = () => {
    APP_KEY = 'checklist_app_' + cKey();
    lstore.storage.APP_KEY = APP_KEY;
    lstore.storage.title = lstore.storage.title + '_copy';
    localStorage.checklist_app_current = APP_KEY;
    lstore.save();
    document.location.reload()
};

// adding a new checklist item
const checklist_item_add = (key) => {
    lstore.storage.checklist_items[key].items.push({ 
        title: `new item created @${(new Date()).getTime()}`,
        id: cKey(),
        checked: false
    }); 
    lstore.save(); 
    create_checklist();
}

// deleting a checklist item
const checklist_item_del = (key,id) => {
    lstore.storage.checklist_items[key].items = lstore.storage.checklist_items[key].items.filter( (x,j) => x.id != id ); 
    lstore.save(); 
    create_checklist();
}

// editing a checklist item start
const checklist_item_edit = (key,id) => {
    document.querySelectorAll(`[id*="_ed"]:not([id="${id}_ed"])`).forEach(x=>x.classList.add('collapse'));
    
    document.querySelector(`#collapse${key} [id="${id}_ed"]`).querySelector('input').value = lstore.storage.checklist_items[key].items.filter(x=>x.id==id)[0].title
    document.querySelector(`#collapse${key} [id="${id}_ed"]`).classList.toggle('collapse');
}

// editing a checklist item save
const checklist_item_edit_save = (key,id) => {
    lstore.storage.checklist_items[key].items.filter(x=>x.id==id)[0].title = document.querySelector(`#collapse${key} [id="${id}_ed"]`).querySelector('input').value
    lstore.save(); 
    create_checklist();
}

// editing a checklist item cancel
const checklist_item_cancel = (key,id) => {
    checklist_item_edit(key,id)
}

// adding a new category
const checklist_category_add = (add_after) => {
    let newKey = `new_category_${cKey()}`
    let new_storage = {};
    for( let item in lstore.storage.checklist_items ){
        new_storage[item] = lstore.storage.checklist_items[item]
        if(item == add_after) new_storage[newKey] = { title:newKey, items:[] }
    }
    
    document.querySelectorAll(`.card [id^="collapse"]`).forEach( x => { 
        try{ x.classList.remove('show') 
    } catch(e){}; } );

    lstore.storage.id_showRegister = `collapse${newKey}`
    lstore.storage.checklist_items = new_storage;
    lstore.save();
    create_checklist();
}

// removing a category
const checklist_category_del = (key) => {
    if( Object.keys(lstore.storage.checklist_items).length == 1 ) return alert('Cannot remove all categories!')
    delete lstore.storage.checklist_items[key];
    lstore.save();
    create_checklist();
}

// renaming of a category start
const checklist_category_rename = (key) => {
    document.querySelectorAll(`[id*="_ed"]:not([id="${key}_ed"])`).forEach(x=>x.classList.add('collapse'));

    document.querySelector(`[id="${key}_ed"] input`).value = lstore.storage.checklist_items[key].title;
    document.getElementById(`${key}_ed`).classList.toggle('collapse')			
}

// renaming of a category save
const checklist_category_rename_save = (key) => {
    let newKey = document.querySelector(`[id="${key}_ed"] input`).value
    lstore.storage.checklist_items[key].title = newKey;
    lstore.storage.id_showRegister = `collapse${key}`
    lstore.save();
    create_checklist();
}

// renaming of a category cancel
const checklist_category_rename_cancel = (key) => {
    checklist_category_rename(key);
}
    
// indicator to indicate whether currently opened list is the default list
let isDefaultList = APP_KEY == default_initial_storage.APP_KEY;
    
// draw the checklist components
let create_checklist = () => {
    
    // set the title
    document.getElementsByTagName('title')[0].textContent =  lstore.storage.title
    document.getElementById('checklist_title').textContent = lstore.storage.title
    
    isDefaultList = APP_KEY == default_initial_storage.APP_KEY;
    
    // if the current list is the DEFAULT checklist, set a mark to visualize that it is and hide .no_default elements
   	document.querySelectorAll('.no_default').forEach( x => x.style.display = null ); // initially show .no_default elements
		document.getElementById('no_default_hint').style.display = "none";
    if( isDefaultList == true ){
	    	document.getElementById('no_default_hint').style.display = null;
	    	document.querySelectorAll('.no_default').forEach( x => x.style.display = 'none' );
    }

    let html = ""; 
    let show = document.querySelector('.show') ? document.querySelector('.show').id : lstore.storage.id_showRegister
    for ( key in lstore.storage.checklist_items ){
        let category_title = lstore.storage.checklist_items[key].title
        html += `
        <div class="card">
            <div class="card-header" id="${key}" onclick="lstore.storage.id_showRegister = 'collapse${key}';lstore.save();">
                <h2>
                    <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse${key}" aria-expanded="true" aria-controls="collapse${key}">${html_enc(category_title)}</button>
                    <button class="btn btn-success btn-sm float-right m-2" onclick="checklist_category_add('${key}')">++</button>
                    <button class="btn btn-danger btn-sm float-right m-2" onclick="checklist_category_del('${key}')">--</button>
                    <button class="btn btn-warning btn-sm float-right m-2" onclick="checklist_category_rename('${key}')">rename</button>
                    <div class="collapse border p-2 pr-4 m-2" id="${key}_ed">
                        <input class="form-control m-2" type="text" value="${key}" />
                        <div class="d-block pl-2">
                            <div class="btn btn-sm btn-info" onclick="checklist_category_rename_cancel('${key}');">cancel</div>
                            <div class="btn btn-sm btn-danger" onclick="checklist_category_rename_save('${key}'); ">save</div>
                        </div>
                    </div>
                </h2>
            </div>
            <div id="collapse${key}" class="collapse ${'collapse'+key==show?'show':''}" aria-labelledby="${key}" data-parent="#accordionChecklist">
                <div class="card-body">` + lstore.storage.checklist_items[key].items.map( (x,i) => { 
                    let id = x.id;
                    return `
                    <div class="ch_item" key="${key}" id="${id}">
                        <input id="${id}_in" type="checkbox" />
                        <span class="btn btn-sm btn-danger" onclick="checklist_item_del('${key}','${id}')">--</span>
                        <span class="btn btn-sm btn-warning" onclick="checklist_item_edit('${key}','${id}')">rename</span>
                        <label for="${id}_in">${html_enc(x.title)}</label>
                        <!-- ITEM TITLE EDITOR -->
                        <div class="collapse border p-2 pr-4 m-2" id="${id}_ed">
                            <input class="form-control m-2" type="text" value="${html_enc(x.title)}" />
                            <div class="d-block pl-2">
                                <div class="btn btn-sm btn-info" onclick="create_checklist()">cancel</div>
                                <div class="btn btn-sm btn-danger" onclick="checklist_item_edit_save('${key}','${id}')">save</div>
                            </div>
                        </div>
                        <!-- //ITEM TITLE EDITOR -->
                    </div>
                    `
                }).join('\n') + `
                </div>
                <div class="btn-toolbar border-top"  role="toolbar" aria-label="">
                        <div class="btn-group p-2" role="group" aria-label="">
                            <button class="btn btn-success btn-sm" onclick="checklist_item_add('${key}')">++</button>
                        </div>
                </div>
            </div>
        </div>`
    }
    
    document.getElementById('checklist').innerHTML = '<div class="accordion noselect" id="accordionChecklist">' + html + '</div>'
    if( !show ) document.querySelector('#checklist [data-parent="#accordionChecklist"].collapse').classList.toggle('show'); 
        
    const toggle_vis = ( keep_state=false ) => {
        document.querySelectorAll('.ch_item').forEach( x => x.classList.remove('blend-out') );
        let vis = document.querySelectorAll('.vis');
        if( !keep_state ) lstore.storage.toggle_state = lstore.storage.toggle_state ? false : true;	
        lstore.storage.toggle_state ? vis.forEach( x => x.parentNode.classList.add('blend-out') ) : vis.forEach( x => x.parentNode.classList.remove('blend-out') );
        
        lstore.save()
    }

    const bm_check = (key,id,db_update=true) => {
        let el = document.querySelector(`[key="${key}"][id="${id}"]`);
        el ? (()=>{
        
        		if( !lstore.getItem(key,id).checked || lstore.getItem(key,id).checked == false ){
				        el.querySelector('input').checked='checked'; 
				        el.querySelector('label').classList.add('vis'); 
		        }
		        
		        else {
				        el.querySelector('input').checked = null; 
				        el.querySelector('label').classList.remove('vis');
		        }
		        
            if(db_update==true) lstore.toggleCheck(key,id);
            
        })() : (()=>{
            console.warn(`Element ${id} does not exist !`);
            lstore.del(id);
        })
    }
            
    checklist.querySelectorAll('.ch_item > input').forEach( x =>
        x.oninput = () => {
        		let el = event.target.parentNode;
            bm_check( el.getAttribute('key'), el.id );
            toggle_vis(true)
        }
    );
    
    // set initial checked state for all items in checklist
    for( let kat in lstore.storage.checklist_items ) {
    	lstore.storage.checklist_items[kat].items.filter( item => item.checked ).forEach( x => {
    			lstore.getItem(kat,x.id).checked = false; // must be initially set to false ( for the UI )
    			bm_check(kat, x.id);
  		});
		}
    // set css vis class for all checked items in checklist
    toggle_vis(true);
    
    // on selection of another checklist
    document.getElementById('saved_checklists').oninput = () => { 
        APP_KEY = event.target.querySelector(':checked').getAttribute('key'); 
        localStorage.checklist_app_current = APP_KEY
        lstore.load()
        create_checklist(); 
    }
}

'use strict'
        
document.addEventListener('DOMContentLoaded', () =>{
    create_checklist();
    let html = '<option style="font-weight:bold;" key="checklist_app_DEFAULT" class="bg-warning">DEFAULT</option>';
    for( let ch in localStorage )
        if( ch.match(/^checklist_app_/) && !ch.match(/^checklist_app_(current|DEFAULT)$/) ){
				    _lstore = JSON.parse(localStorage[ch]);
				    html += `
				    <option ${ ch == APP_KEY ? 'selected' : '' } key="${ch}">${html_enc(_lstore.title)}</option>
				    `;
        }
    document.getElementById('saved_checklists').innerHTML = html
});

const create_checklist_printable = (()=>{
    let rep = `\n# checklist ${lstore.storage.title}\n\n---\n`;
    for( let key in lstore.storage.checklist_items ){
        rep += `\n\n## ${lstore.storage.checklist_items[key].title}\n`
        for( let item in lstore.storage.checklist_items[key].items )
            rep += `\n - ${lstore.storage.checklist_items[key].items[item].title}`
    }

    let win = window.open()
    win.document.body.style.lineBreak = 'pre-line';
    let pre = document.createElement('pre');
    pre.textContent = rep;
    win.document.body.appendChild(pre);
});
