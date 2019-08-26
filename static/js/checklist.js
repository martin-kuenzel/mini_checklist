'use strict';

// initialize the local storage DB-Manager
// const lstore = new lStore();

// initialize the srv storage DB-Manager
const srvstore = new srvStore();

// creates a markdown compatible report version of the current storage 
// plots the created report into a _blank window
const create_checklist_printable = (()=>{
    let rep = `\n# checklist ${srvstore.storage.title}\n\n---\n`;

    // loop through all categories
    for( let kat_id in srvstore.storage.checklist_items ){
        let kat = srvstore.storage.checklist_items[kat_id];
        let sub_rep = "";

        // loop through all items in the current category
        for( let item_id in kat.items ){
            let item = kat.items[item_id];

            // if the current item is checked and checked item are set to be blended out ignore the item for the report
            if( srvstore.storage.toggle_state && item.checked ) {
                continue;
            }

            // if the item is checked add the word (checked) after the title of the item in the report
            let checked_mark = item.checked ? '(checked)' : '';
            sub_rep += `\n - ${item.title} ${checked_mark}`;

            // if item has content, add a <tag>-stripped version of it to the report
            sub_rep += item.content && item.content.replace(/<[^>]*>/g,'').length > 0 ? `\n   - ${item.content.replace(/(<br[^>]*>)+/g,'\n').replace(/<[^>]*>/g,'')}` : '';
        }

        // if there have been items in the current category add the category to the report
        if( sub_rep.length > 0 ) rep += `\n\n## ${kat.title}\n${sub_rep}`
    }

    let win = window.open();
    win.document.body.style.lineBreak = 'pre-line';
    let pre = document.createElement('pre');
    pre.textContent = rep;
    win.document.body.appendChild(pre);
});

const set_visibility_of_checked = (dbupdate=true) => { 
    document.querySelectorAll('.ch_item').forEach( x => x.classList.remove('blend-out') );
    
    if( document.getElementById('vis_toggle').checked ) {
        document.querySelectorAll('.ch_item.vis').forEach( x => x.classList.add('blend-out') );
        if(dbupdate==true) srvstore.storage.toggle_state = true;
    } 
    else {
        if(dbupdate==true) srvstore.storage.toggle_state = false;
    }
    if(dbupdate==true) srvstore.save();
};

const uploadChecklist = (ev) => {
    let files = ev.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    let output = [];
    for (let i = 0; i<files.length; i++) {
        let f = files[i];
        let reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
                try {
                    let json = JSON.parse(e.target.result);
                    
                    if( srvstore.import( json ) ){
                        alert(`Successfully loaded ${f.name}`);
                        document.location.reload();
                    }

                } catch (ex) { alert('there was an error while trying to read the file\n' + ex); }
            };
        })(f);
        reader.readAsText(f);
    }
};

const downloadChecklist = (name, type, data) => {
    let blob = new Blob([data], {type: type});

    if (data != null && navigator.msSaveBlob)
        return navigator.msSaveBlob( blob, name);

    let url = window.URL.createObjectURL(blob);
    
    let a = document.createElement("a");
    a.style.display = 'none';
    a.setAttribute("href", url);
    a.setAttribute("download", name);
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.parentNode.removeChild(a);
};

const runr_async_sucks = () => {
 
    // wait for srv storage to be loaded
    if(!srvstore.storage) return setTimeout( runr_async_sucks, 1 );

    // register the img resizer module for Quill
    Quill.register('modules/imgcanvas', ImageToCanvas);

    // build the checklist UI
    create_checklist();

    // read the existing checklists from localforage
    localforage.keys().then( function(keys) {

        // add the default checklist to selector
        document.getElementById('saved_checklists').innerHTML = '<option style="font-weight:bold;" kat="checklist_app_DEFAULT" class="bg-warning">DEFAULT</option>';

        // for each item in localforage
        for( let i=0; i < keys.length; i++ ){

            // if item is a saved checklist and not the default (base) checklist or the key for the currently selected checklist
            if( keys[i].match(/^checklist_app_/) && !keys[i].match(/^checklist_app_(current|DEFAULT)$/) ){

                // get the saved data for the checklist with keys[i] from localforage
                localforage.getItem( keys[i], (err,data) => {

                    // read the title from the saved JSON object
                    let _srvstore = JSON.parse(data);

                    // add the item to the selector
                    document.getElementById('saved_checklists').innerHTML += `
                    <option ${ keys[i] == APP_KEY ? 'selected' : '' } kat="${keys[i]}">${html_enc(_srvstore.title)}</option>
                    `;
                });
            }
        }    
    });

    // get the currently saved state of the vis toggle checkbox from the localforage and assign it to the UI checkbox element
    document.getElementById('vis_toggle').checked = srvstore.storage.toggle_state == true ? 'checked' : null;

    // set the visibility of all checklist items according to the vis toggle's current state
    set_visibility_of_checked();

    let dragged;

    // activate the dropzones CSS status while dragging an item over it
    let dropzone_activate = (dropzone) => {

        // get the category entered by the item being dragged
        let drop_kat = dropzone.getAttribute('kat');

        // highlight potential drop target when the draggable element enters it
        if ( drop_kat ) {
            document.getElementById(drop_kat).classList.add('dragover');
        }

    };

    // deactivate the dropzones CSS status while dragging an item over it
    let dropzone_deactivate = (dropzone) => {
        // get the category entered by the item being dragged
        let drop_kat = dropzone.getAttribute('kat');

        // deacivate highlight of potential drop target when the draggable element leaves it
        if ( drop_kat ) {
            document.getElementById(drop_kat).classList.remove('dragover');
        }
    };

    /* events fired on the draggable target */
    document.addEventListener("drag", function( event ) {}, false);
    document.addEventListener("dragstart", function( event ) {
        
        // store a ref. on the dragged elem
        let item_id = event.target.getAttribute('item_id');
        dragged = document.getElementById(item_id);
        
        // make it half transparent
        dragged.classList.add('dragged');

    }, false);

    document.addEventListener("dragend", function( event ) {
        // remove the dragged class
        dragged.classList.remove('dragged');
    }, false);

    /* events fired on the drop targets */
    document.addEventListener("dragover", function( event ) {

	dropzone_activate(event.target);
        // prevent default to allow drop
        event.preventDefault();
    }, false);

    document.addEventListener("dragenter", function( event ) {
	    dropzone_activate(event.target);  
    }, false);

    document.addEventListener("dragleave", function( event ) {
	    dropzone_deactivate(event.target);
    }, false);

    document.addEventListener("drop", function( event ) {

        // prevent default action (open as link for some elements)
        event.preventDefault();

        let drop_kat = event.target.getAttribute('kat');

        // move dragged elem to the selected drop target
        if ( drop_kat ) {
            
            document.getElementById(drop_kat).classList.remove('dragover');

            let dropzone = document.getElementById(drop_kat).querySelector('.card-body');
            let drag_kat = dragged.getAttribute('kat');

            let item_id = event.target.getAttribute('item_id');

            // assuming that a list is opened up and checklist items in it are visible
            // if the dragged item is dropped on another item in the same list, add it after that item (hint: no addAfter() in plain JS)
            if( item_id ){

                // items are equal, so we wont do anything
                if( item_id == dragged.id ) return;

                // add dragged item before dropped on
                dropzone.insertBefore( dragged, document.getElementById(item_id) );

                // switch positions of both items
                dropzone.insertBefore( document.getElementById(item_id), dragged ); 

                // move the items in the checklists DB object
                srvstore.moveItem( drag_kat, drop_kat, dragged.id, item_id );
            }
            
            // if dropping into another category, we will add the item at the end of that category
            // OR item has not been dropped on another item
            else {
                dropzone.appendChild( dragged );
                srvstore.moveItem( drag_kat, drop_kat, dragged.id );
            }

            create_checklist();
        }
      
    }, false);
};

document.addEventListener('DOMContentLoaded', () => {
    runr_async_sucks();
});
