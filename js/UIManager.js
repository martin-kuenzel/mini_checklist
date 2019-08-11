/**
	The UI Management functions
*/


// resetting of the current checklist to DEFAULT
const checklist_reset = () => {
    lstore.reset();
    document.getElementById('vis_toggle').checked = lstore.storage.toggle_state == true ? 'checked' : null;
    create_checklist();
};

// editing the title of the current checklist start
const checklist_title_edit = () => {
    if( APP_KEY == default_initial_storage.APP_KEY ) 
        return alert('Title of default can not be changed');

    document.querySelectorAll(`[id*="_ed"]:not([id="title_ed"])`).forEach(x=>x.classList.add('collapse'));

    document.getElementById('title_ed').classList.toggle('collapse');
    document.getElementById('title_input').value = lstore.storage.title;
};

// editing the title of the current checklist save
const checklist_title_edit_save = () => {
    lstore.storage.title = document.getElementById('title_input').value;
    lstore.save();
    document.location.reload();
};

// editing the title of the current checklist cancel
const checklist_title_edit_cancel = checklist_title_edit;

// deleting complete current checklist
const checklist_del_complete = () => {
    if( APP_KEY == default_initial_storage.APP_KEY ) 
        return alert('Deletion of the default list is not possible');

    delete localStorage[APP_KEY];
    localStorage.checklist_app_current = default_initial_storage.APP_KEY;
    document.location.reload();
};

// copying complete recent checklist
const checklist_add_complete = () => {
    APP_KEY = 'checklist_app_' + cKey();
    lstore.storage.APP_KEY = APP_KEY;
    lstore.storage.title = lstore.storage.title + '_copy';
    localStorage.checklist_app_current = APP_KEY;
    lstore.save();
    document.location.reload();
};

// adding a new checklist item
const checklist_item_add = (kat) => {
    if( !lstore.addItem(kat) ) 
        return alert('Error creating new item');
    create_checklist();
};

// deleting a checklist item
const checklist_item_del = (kat, id) => {
    if( !lstore.delItem(kat,id) )
        return alert('Error deleting item');
    create_checklist();
};

// editing a checklist item start
const checklist_item_edit = (kat, id) => {
    document.querySelectorAll(`[id*="_ed"]:not([id="${id}_ed"])`).forEach(x=>x.classList.add('collapse'));
    document.querySelector(`#collapse${kat} [id="${id}_ed"]`).querySelector('input').value = lstore.storage.checklist_items[kat].items.filter(x=>x.id==id)[0].title;
    document.querySelector(`#collapse${kat} [id="${id}_ed"]`).classList.toggle('collapse');

};

// editing a checklist item save
const checklist_item_edit_save = (kat, id) => {
    let title = document.querySelector(`#collapse${kat} [id="${id}_ed"] .item_title`).value;
    if(title.length<1) {
        document.querySelector(`#collapse${kat} [id="${id}_ed"] .item_title`).focus();
        return alert('The title cannot be empty !');
    }

    let content = document.querySelector(`#collapse${kat} [id="editor_${id}"] .ql-editor`).innerHTML;
    lstore.renameItem(kat,id,title,content);
    create_checklist();
};

// editing a checklist item cancel
const checklist_item_cancel = (kat, id) => {
    checklist_item_edit(kat, id);
};

// adding a new category
const checklist_category_add = (add_after_kat) => {
    let newkat = lstore.addCategory(add_after_kat);
    lstore.storage.id_showRegister = `collapse${newkat}`;
    create_checklist();
};

// removing a category
const checklist_category_del = (key) => {
    if( Object.keys(lstore.storage.checklist_items).length == 1 ) 
        return alert('Cannot remove all categories!');
    delete lstore.storage.checklist_items[key];
    lstore.save();
    create_checklist();
};

// renaming of a category start
const checklist_category_rename = (key) => {
    document.querySelectorAll(`[id*="_ed"]:not([id="${key}_ed"])`).forEach(x=>x.classList.add('collapse'));

    document.querySelector(`[id="${key}_ed"] input`).value = lstore.storage.checklist_items[key].title;
    document.getElementById(`${key}_ed`).classList.toggle('collapse');
};

// renaming of a category save
const checklist_category_rename_save = (key) => {
    let newKey = document.querySelector(`[id="${key}_ed"] input`).value;
    lstore.renameCategory(key,newKey);
    create_checklist();
};

// renaming of a category cancel
const checklist_category_rename_cancel = (key) => {
    checklist_category_rename(key);
};

// indicator to indicate whether currently opened list is the default list
let isDefaultList = APP_KEY == default_initial_storage.APP_KEY;

/*
const toggle_vis = ( keep_state=false ) => {
    document.querySelectorAll('.ch_item').forEach( x => x.classList.remove('blend-out') );
    let vis = document.querySelectorAll('.vis');
    if( !keep_state ) lstore.storage.toggle_state = lstore.storage.toggle_state ? false : true;	
    lstore.storage.toggle_state ? vis.forEach( x => x.parentNode.classList.add('blend-out') ) : vis.forEach( x => x.parentNode.classList.remove('blend-out') );
    lstore.save()
}*/


const bm_check = (key, id,db_update=true) => {
    let el = document.querySelector(`[key="${key}"][id="${id}"]`);
    if( el ) {
    
        if( !lstore.getItem(key, id).checked || lstore.getItem(key, id).checked == false ){
            el.querySelector('input').checked='checked'; 
            el.classList.add('vis');
        }
        
        else {
            el.querySelector('input').checked = null; 
            el.classList.remove('vis');
        }
            
        if(db_update==true) lstore.toggleCheck(key, id);

        set_visibility_of_checked(dbupdate=false);
        
    }
    else {
        console.warn(`Element ${id} does not exist !`);
        lstore.del(id);
    }
};

// draw the checklist components
let create_checklist = () => {
    
    // set the title
    document.getElementsByTagName('title')[0].textContent =  lstore.storage.title;
    document.getElementById('checklist_title').textContent = lstore.storage.title;
    
    isDefaultList = APP_KEY == default_initial_storage.APP_KEY;
    
    // if the current list is the DEFAULT checklist, set a mark to visualize that it is and hide .no_default elements
   	document.querySelectorAll('.no_default').forEach( x => x.style.display = null ); // initially show .no_default elements
    document.getElementById('no_default_hint').style.display = "none";
    if( isDefaultList == true ){
        document.getElementById('no_default_hint').style.display = null;
        document.querySelectorAll('.no_default').forEach( x => x.style.display = 'none' );
    }

    let html = ""; 
    let show = document.querySelector('.show') ? document.querySelector('.show').id : lstore.storage.id_showRegister;
    let quill_functions = [];
    for ( let key in lstore.storage.checklist_items ){
        let category_title = lstore.storage.checklist_items[key].title;
        html += `
        <div class="card">
            <div class="card-header" id="${key}" onclick="lstore.storage.id_showRegister = 'collapse${key}';lstore.save();">
                <h2 class="d-flex">
                    <button class="flex-grow-1 text-left btn btn-link" type="button" data-toggle="collapse" data-target="#collapse${key}" aria-expanded="true" aria-controls="collapse${key}">
                    	${html_enc(category_title)}
                  	</button>
                    <button class="btn btn-success btn-sm m-1" onclick="checklist_category_add('${key}')">++</button>
                    <button class="btn btn-danger  btn-sm m-1" onclick="checklist_category_del('${key}')">--</button>
                    <button class="btn btn-warning btn-sm m-1" onclick="checklist_category_rename('${key}')">rename</button>
                </h2>
                    <div class="collapse border p-2 pr-4 m-2" id="${key}_ed">
                        <input class="form-control m-2" type="text" value="${key}" />
                        <div class="d-block pl-2">
                            <div class="btn btn-sm btn-info" onclick="checklist_category_rename_cancel('${key}');">cancel</div>
                            <div class="btn btn-sm btn-danger" onclick="checklist_category_rename_save('${key}'); ">save</div>
                        </div>
                    </div>
            </div>
            <div id="collapse${key}" class="collapse ${'collapse'+key==show?'show':''}" aria-labelledby="${key}" data-parent="#accordionChecklist">
                <div class="card-body p-2">` + 
                lstore.storage.checklist_items[key].items.map( (x,i) => { 
                    let id = x.id;
                    quill_functions.push( () => {
                        // <!-- Initialize Quill editor -->
                        let quill = new Quill(`#editor_${id}`, {
                            modules: {
                            toolbar: [
                                [{ header: [1, 2, false] }],
                                ['bold', 'italic', 'underline'],
                                ['image', 'code-block']
                            ]
                            },
                            placeholder: 'Add some further description here [optional] ...',
                            theme: 'snow'  // or 'bubble'
                        });
                    });
                    return `
                    <div class="ch_item" key="${key}" id="${id}">
                        <div class="d-flex pl-1 mb-1">
                            <input class="align-self-center" root="${id}" id="${id}_in" type="checkbox" />
                            <label class="flex-grow-1 align-self-center ml-1 mb-1" for="${id}_in">${html_enc(x.title)}</label>
                            <span  class="ml-1 btn btn-sm btn-danger" onclick="checklist_item_del('${key}','${id}')">--</span>
                            <span  class="ml-1 btn btn-sm btn-warning" onclick="checklist_item_edit('${key}','${id}')">rename</span>
                        </div>
                    </div>
                    <!-- ITEM TITLE EDITOR -->
                    <div class="collapse border p-2 m-2" id="${id}_ed">
                        <div class="pl-2 pr-2 mb-2">
                            <input placeholder="the items title" class="item_title form-control" type="text" value="${html_enc(x.title)}" />
                        </div>
                        <!-- QUILL WYSWYG EDITOR CONTAINER -->
                        <div class="pl-2 pr-2 mb-2">
                            <div style="height: 225px;" id="editor_${id}">${x.content||''}</div>
                        </div>
                        <!-- // END QUILL -->
                        <div class="d-block p-2">
                            <div class="btn btn-sm btn-info" onclick="create_checklist()">cancel</div>
                            <div class="btn btn-sm btn-danger" onclick="checklist_item_edit_save('${key}','${id}')">save</div>
                        </div>
                        
                    </div>
                    <!-- //ITEM TITLE EDITOR -->
                    `;
                }).join('\n') + `
                </div>
                <div class="btn-toolbar border-top"  role="toolbar" aria-label="">
                    <div class="btn-group p-2" role="group" aria-label="">
                        <button class="btn btn-success btn-sm" onclick="checklist_item_add('${key}')">++</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    
    document.getElementById('checklist').innerHTML = '<div class="accordion noselect" id="accordionChecklist">' + html + '</div>';
    if( !show ) document.querySelector('#checklist [data-parent="#accordionChecklist"].collapse').classList.toggle('show'); 


    for( let f=0; f < quill_functions.length; f++ )
        quill_functions[f]();

    const bm_check = (key, id,db_update=true) => {
        let el = document.querySelector(`[key="${key}"][id="${id}"]`);
        el ? (()=>{
        
        		if( !lstore.getItem(key, id).checked || lstore.getItem(key, id).checked == false ){
                    el.querySelector('input').checked='checked'; 
                    el.classList.add('vis');
		        }
		        
		        else {
                    el.querySelector('input').checked = null; 
                    el.classList.remove('vis');
		        }
		        
            if(db_update==true) lstore.toggleCheck(key, id);

            set_visibility_of_checked(dbupdate=false);
            
        })() : (()=>{
            console.warn(`Element ${id} does not exist !`);
            lstore.del(id);
        });
    };
            
    checklist.querySelectorAll('.ch_item input[type="checkbox"]').forEach( x =>
        x.oninput = () => {
            let el = document.getElementById( event.target.getAttribute('root') );
            bm_check( el.getAttribute('key'), el.id );
            //toggle_vis(true)
        }
    );
    
    // set initial checked state for all items in checklist
    for( let kat in lstore.storage.checklist_items ) {
    	lstore.storage.checklist_items[kat].items.filter( item => item.checked ).forEach( x => {
            lstore.getItem(kat,x.id).checked = false; // must be initially set to false ( for the UI )
            bm_check(kat, x.id);
  		});
    }
    
    // on selection of another checklist
    document.getElementById('saved_checklists').oninput = () => { 
        APP_KEY = event.target.querySelector(':checked').getAttribute('key'); 
        localStorage.checklist_app_current = APP_KEY;
        lstore.load();
        create_checklist(); 
    };
    
    set_visibility_of_checked(dbupdate=false);
};