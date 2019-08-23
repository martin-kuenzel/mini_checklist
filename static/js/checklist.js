'use strict';

// initialize the DB-Manager
const lstore = new lStore();

const create_checklist_printable = (()=>{
    let rep = `\n# checklist ${lstore.storage.title}\n\n---\n`;
    for( let kat_id in lstore.storage.checklist_items ){
        let kat = lstore.storage.checklist_items[kat_id];
        rep += `\n\n## ${kat.title}\n`;
        for( let item_id in kat.items ){
            let item = kat.items[item_id];
            if( lstore.storage.toggle_state && item.checked ) {
                continue;
            }

            let checked_mark = item.checked ? '(checked)' : '';
            rep += `\n - ${item.title} ${checked_mark}`;
        }
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
        if(dbupdate==true) lstore.storage.toggle_state = true;
    } 
    else {
        if(dbupdate==true) lstore.storage.toggle_state = false;
    }
    if(dbupdate==true) lstore.save();
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
                    
                    if( lstore.import( json ) ){
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

document.addEventListener('DOMContentLoaded', () =>{
    
    Quill.register('modules/imgcanvas', ImageToCanvas);

    create_checklist();
    
    let html = '<option style="font-weight:bold;" kat="checklist_app_DEFAULT" class="bg-warning">DEFAULT</option>';
    for( let ch in localStorage )
        if( ch.match(/^checklist_app_/) && !ch.match(/^checklist_app_(current|DEFAULT)$/) ){
            let _lstore = JSON.parse(localStorage[ch]);
            html += `
            <option ${ ch == APP_KEY ? 'selected' : '' } kat="${ch}">${html_enc(_lstore.title)}</option>
            `;
        }
    document.getElementById('saved_checklists').innerHTML = html;

    document.getElementById('vis_toggle').checked = lstore.storage.toggle_state == true ? 'checked' : null;
    set_visibility_of_checked();

    let dragged;

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
        // prevent default to allow drop
        event.preventDefault();
    }, false);

    document.addEventListener("dragenter", function( event ) {

        // get the category entered by the item being dragged
        let drop_kat = event.target.getAttribute('kat');

        // highlight potential drop target when the draggable element enters it
        if ( drop_kat ) {
            document.getElementById(drop_kat).classList.add('dragover');
        }
  
    }, false);

    document.addEventListener("dragleave", function( event ) {
        let drop_kat = event.target.getAttribute('kat');

        // reset background of potential drop target when the draggable element leaves it
        if ( drop_kat ) {
            document.getElementById(drop_kat).classList.remove('dragover');
        }
  
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
            // if the dragged item is dropped on another item in the list, add it after that item (hint: no addAfter() in plain JS)
            if( item_id ){

                // items are equal, so we wont do anything
                if( item_id == dragged.id ) return;

                dropzone.insertBefore( dragged, document.getElementById(item_id) ); // add dragged item before dropped on
                dropzone.insertBefore( document.getElementById(item_id), dragged ); // switch positions of both items

                lstore.moveItem( drag_kat, drop_kat, dragged.id, item_id );
            }
            
            // if dropping into another category, we will add the item at the end of that category
            // OR item has not been dropped on another item
            else {
                dropzone.appendChild( dragged );
                lstore.moveItem( drag_kat, drop_kat, dragged.id );
            }

            create_checklist();
        }
      
    }, false);
});
