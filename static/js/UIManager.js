/**
    The UI Management functions
*/

//TODO connect callback functions with localforage


// resetting of the current checklist to DEFAULT
const checklist_reset = () => {
    srvstore.reset();
    document.getElementById('vis_toggle').checked = srvstore.storage.toggle_state == true ? 'checked' : null;
    create_checklist();
};

// editing the title of the current checklist start
const checklist_title_edit = () => {
    if( APP_KEY == default_initial_storage.APP_KEY ) 
        return alert('Title of default can not be changed');

    document.querySelectorAll(`[id*="_ed"]:not([id="title_ed"])`).forEach(x=>x.classList.add('collapse'));

    document.getElementById('title_ed').classList.toggle('collapse');
    document.getElementById('title_input').value = srvstore.storage.title;
};

// editing the title of the current checklist save
const checklist_title_edit_save = () => {
    srvstore.storage.title = document.getElementById('title_input').value;
    srvstore.save({callback:create_checklist}); // save with reload == true
    //document.location.reload();
};

// editing the title of the current checklist cancel
const checklist_title_edit_cancel = checklist_title_edit;

// deleting complete current checklist
const checklist_del_complete = () => {
    if( APP_KEY == default_initial_storage.APP_KEY ) 
        return alert('Deletion of the default list is not possible');

    localforage.removeItem(APP_KEY, (err) => {
        if(err) throw err;
        localStorage.checklist_app_current = default_initial_storage.APP_KEY;
        document.location.reload();
    });
};

// copying complete recent checklist
const checklist_add_complete = () => {
    APP_KEY = 'checklist_app_' + cKey();
    srvstore.storage.APP_KEY = APP_KEY;
    srvstore.storage.title = srvstore.storage.title + '_copy';
    localStorage.checklist_app_current = APP_KEY;
    srvstore.save({reload:true}); // save with reload = true
    //document.location.reload();
};

// adding a new checklist item
const checklist_item_add = (kat) => {
    if( !srvstore.addItem(kat,create_checklist) ) 
        return alert('Error creating new item');
    //create_checklist();
};

// deleting a checklist item
const checklist_item_del = (kat, id) => {
    if( !srvstore.delItem(kat,id, create_checklist ) )
        return alert('Error deleting item');
    //create_checklist();
};

// editing a checklist item start
const checklist_item_edit = (kat, id) => {
    document.querySelectorAll(`[id*="_ed"]:not([id="${id}_ed"])`).forEach(x=>x.classList.add('collapse'));
    document.querySelector(`#collapse${kat} [id="${id}_ed"]`).querySelector('input').value = srvstore.storage.checklist_items[kat].items.filter(x=>x.id==id)[0].title;
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
    
    if( !srvstore.renameItem(kat,id,title,content, create_checklist) ) 
        return alert('Error editing item');

    //create_checklist();
};

// editing a checklist item cancel
const checklist_item_cancel = (kat, id) => {
    checklist_item_edit(kat, id);
};

// adding a new category
const checklist_category_add = (add_after_kat) => {
    let newkat = srvstore.addCategory(add_after_kat);
    srvstore.storage.id_showRegister = `collapse${newkat}`;
    create_checklist();
};

// removing a category
const checklist_category_del = (kat) => {
    if( Object.keys(srvstore.storage.checklist_items).length == 1 ) 
        return alert('Cannot remove all categories!');
    delete srvstore.storage.checklist_items[kat];
    srvstore.save({callback:create_checklist});
};

// renaming of a category start
const checklist_category_rename = (kat) => {
    document.querySelectorAll(`[id*="_ed"]:not([id="${kat}_ed"])`).forEach(x=>x.classList.add('collapse'));

    document.querySelector(`[id="${kat}_ed"] input`).value = srvstore.storage.checklist_items[kat].title;
    document.getElementById(`${kat}_ed`).classList.toggle('collapse');
};

// renaming of a category save
const checklist_category_rename_save = (kat) => {
    let newKey = document.querySelector(`[id="${kat}_ed"] input`).value;
    srvstore.renameCategory(kat,newKey);
    create_checklist();
};

// renaming of a category cancel
const checklist_category_rename_cancel = (kat) => {
    checklist_category_rename(kat);
};

// setting the activated category register
const checklist_category_set_register = (kat) => {
    srvstore.setRegister(`collapse${kat}`);
};

// indicator to indicate whether currently opened list is the default list
let isDefaultList = APP_KEY == default_initial_storage.APP_KEY;

// this function is for toggling the status of checklist items 
// db_update: if db_update is set to false, only changes in UI will be made
const bm_check = (kat, id, db_update=true) => {
    let el = document.querySelector(`[kat="${kat}"][id="${id}"]`);
    if( el ) {
    
        // the font awesome icon at the beginning of a checklist item
        let indicator = document.getElementById(`${el.id}_indicator`)
        
        indicator.classList.remove('fa-times-circle')
        indicator.classList.remove('fa-check-circle')
    
        // if the item was checked before
        if(srvstore.getItem(kat, id).checked == true) {
            el.querySelector('input').checked = null; 
            el.classList.remove('vis');
            
            indicator.classList.add('fa-times-circle')
            
        }
        
        // if the item was not checked before
        else {
            el.querySelector('input').checked='checked'; 
            el.classList.add('vis');
            
            indicator.classList.add('fa-check-circle')
        }
        
        if(db_update==true) srvstore.toggleCheck(kat, id);

        set_visibility_of_checked(dbupdate=false);
        
    }
    else {
        console.warn(`Element ${id} does not exist !`);
        srvstore.del(id);
    }
};

// draw the checklist components
let create_checklist = () => {
    
    // set the title
    document.getElementsByTagName('title')[0].textContent =  srvstore.storage.title;
    document.getElementById('checklist_title').textContent = srvstore.storage.title;
    
    isDefaultList = APP_KEY == default_initial_storage.APP_KEY;
    
    // if the current list is the DEFAULT checklist, set a mark to visualize that it is and hide .no_default elements
    document.querySelectorAll('.no_default').forEach( x => x.style.display = null ); // initially show .no_default elements
    document.getElementById('no_default_hint').style.display = "none";
    if( isDefaultList == true ){
        document.getElementById('no_default_hint').style.display = null;
        document.querySelectorAll('.no_default').forEach( x => x.style.display = 'none' );
    }

    let html = ""; 
    let show = document.querySelector('.show') ? document.querySelector('.show').id : srvstore.storage.id_showRegister;

    // QUILL SETTINGS    
    let quill_functions = [];
    let quill_toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme

        //[{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'direction': 'rtl' }],                         // text direction

        [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        [{ 'font': [] }],
        [{ 'align': [] }],

        ['formula',{ 'script': 'sub'}, { 'script': 'super' }], // formulars, superscript/subscript

        ['clean'],                                        // remove formatting button

        ['link'], ['video','image']						  // add links, video embeds, and images

    ];
		
    for ( let kat in srvstore.storage.checklist_items ){
        let category_title = srvstore.storage.checklist_items[kat].title;
        html += `
        <div class="card category dropzone" id="${kat}" kat="${kat}">
            <div class="card-header dropzone" onclick="checklist_category_set_register('${kat}');">
                <h2 class="d-flex">
                    <button class="flex-grow-1 text-left btn btn-link" type="button" data-toggle="collapse" data-target="#collapse${kat}" aria-expanded="true" aria-controls="collapse${kat}">
                    	${html_enc(category_title)}
                  	</button>
                    <button class="btn btn-success btn-sm m-1" onclick="checklist_category_add('${kat}')">++</button>
                    <button class="btn btn-danger  btn-sm m-1" onclick="checklist_category_del('${kat}')">--</button>
                    <button class="btn btn-warning btn-sm m-1" onclick="checklist_category_rename('${kat}')">rename</button>
                </h2>
                    <div class="collapse border p-2 pr-4 m-2" id="${kat}_ed">
                        <input class="form-control m-2" type="text" value="${kat}" />
                        <div class="d-block pl-2">
                            <div class="btn btn-sm btn-info" onclick="checklist_category_rename_cancel('${kat}');">cancel</div>
                            <div class="btn btn-sm btn-danger" onclick="checklist_category_rename_save('${kat}'); ">save</div>
                        </div>
                    </div>
            </div>
            <div id="collapse${kat}" class="collapse" aria-labelledby="${kat}" data-parent="#accordionChecklist">
                <div class="card-body p-2">` + 
                srvstore.storage.checklist_items[kat].items.map( (x,i) => { 
                    let id = x.id;
                    quill_functions.push( () => {
                        // <!-- Initialize Quill editor -->
                        let quill = new Quill(`#editor_${id}`, {
                            modules: {
                                formula: true,  // Include the formula module (important!)
                                toolbar: quill_toolbarOptions,	
                                syntax: true,
                                imgcanvas: {}
                            },
                            placeholder: 'Add some further description here [optional] ...',
                            theme: 'snow'
                        });
                    });
                    return `
                    <div class="ch_item ${x.checked?'vis':''}" kat="${kat}" id="${id}">
                        <div class="noselect d-flex pl-1 mb-1">
                            <div class="m-2" onclick="bm_check('${kat}','${id}')"><i id="${id}_indicator" class="far ${x.checked?'fa-check-circle':'fa-times-circle'}"></i></div>
                            <input class="align-self-center collapse" ${x.checked?'checked="checked"':''} root="${id}" id="${id}_in" type="checkbox" />
                            <label draggable="true" ondragstart="event.dataTransfer.setData('text/plain',null)" onclick="bm_check('${kat}','${id}');" class="flex-grow-1 align-self-center ml-1 mb-1" id="${id}_in_label">${html_enc(x.title)}
                                <small class="collapse">
                                    <span class="badge badge-success ml-2 p-1">has content</span>
                                </small>
                            </label>
                            <span  class="ml-1 btn btn-sm btn-danger" onclick="checklist_item_del('${kat}','${id}')">--</span>
                            <span  class="ml-1 btn btn-sm btn-warning" onclick="checklist_item_edit('${kat}','${id}')">edit</span>
                        </div>
                        <!--<div class="pl-3 pr-5 mr-5 pb-2 collapse ${x.content?'show':''}">
                            <div class="p-1 ql-content-static border border-rounded">${x.content||''}</div>
                        </div>-->
                    </div>
                    <!-- ITEM EDITOR -->
                    <div class="collapse border p-2 m-2" id="${id}_ed">
                        <div class="pl-2 pr-2 mb-2">
                            <input placeholder="the items title (required)" class="item_title form-control" type="text" value="${html_enc(x.title)}" />
                        </div>
                        <!-- QUILL -->
                        <div class="pl-2 pr-2 mb-2">
                            <div style="height: 265px;" id="editor_${id}">${x.content||''}</div>
                        </div>
                        <!-- // END QUILL -->
                        <div class="d-block p-2">
                            <div class="btn btn-sm btn-info" onclick="create_checklist()">cancel</div>
                            <div class="btn btn-sm btn-danger" onclick="checklist_item_edit_save('${kat}','${id}')">save</div>
                        </div>
                        
                    </div>
                    <!-- //ITEM EDITOR -->
                    `;
                }).join('\n') + `
                </div>
                <div class="btn-toolbar border-top"  role="toolbar" aria-label="">
                    <div class="btn-group p-2" role="group" aria-label="">
                        <button class="btn btn-success btn-sm" onclick="checklist_item_add('${kat}')">++</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    
    document.getElementById('checklist').innerHTML = '<div class="accordion" id="accordionChecklist">' + html + '</div>';
   
    //if( !show ) document.querySelector('#checklist [data-parent="#accordionChecklist"].collapse').classList.toggle('show'); 

    // if there is an activated register in the current checklist show this register in the UI
    // else show the first one (hint: less then one register is not allowed in the APP logic)
    let registers = Array.from( document.querySelectorAll('#checklist [data-parent="#accordionChecklist"]') );
    let active_register = srvstore.storage.id_showRegister;
    if( active_register ) 
        registers.filter( x => x.id === active_register ).forEach( x => x.classList.add('show') ); // we use filter.foreach to prevent errors on not existant DOM
    else 
        registers[0].classList.add('show');

    // create editors for all items in checklist
    for( let f=0; f < quill_functions.length; f++ ){
        quill_functions[f]();
    }

    document.querySelectorAll('.ch_item').forEach( x => { 

        // add the id of the item to all subitems recursively
        x.querySelectorAll('*').forEach( ch_sub => ch_sub.setAttribute('item_id', x.id) );

        // add a badge to each of the items that have edited content to visualize it
        let ql_content = document.querySelector(`[id="${x.id}_ed"] .ql-editor:not(.ql-blank)`); 
        if(ql_content){ 
            let badge = x.querySelector(`label[id="${x.id}_in_label"] .collapse`);
            badge.classList.toggle('show');
        }

    } );

    document.querySelectorAll('.category').forEach( card => card.querySelectorAll('*').forEach( card_sub => card_sub.setAttribute( 'kat', card.id ) ) );

    checklist.querySelectorAll('.ch_item input[type="checkbox"]').forEach( x =>
        x.oninput = () => {
            let el = document.getElementById( event.target.getAttribute('root') );
            bm_check( el.getAttribute('kat'), el.id );
            //toggle_vis(true)
        }
    );
    
    // set initial checked state for all items in checklist
    /*for( let kat in srvstore.storage.checklist_items ) {
    	srvstore.storage.checklist_items[kat].items.filter( item => item.checked ).forEach( x => {
            srvstore.getItem(kat,x.id).checked = false; // must be initially set to false ( for the UI )
            bm_check(kat, x.id);
	    });
    }*/
    
    // on selection of another checklist
    document.getElementById('saved_checklists').oninput = () => { 
        APP_KEY = event.target.querySelector(':checked').getAttribute('kat'); 
        localStorage.checklist_app_current = APP_KEY;
        document.location.reload();
        //srvstore.load();
        //create_checklist(); 
    };
    
    set_visibility_of_checked(dbupdate=false);
};
