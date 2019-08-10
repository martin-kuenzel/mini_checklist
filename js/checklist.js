// initialize the DB-Manager
const lstore = new lStore();

'use strict'

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

const set_visibility_of_checked = (dbupdate=true) => { 
    document.querySelectorAll('.ch_item').forEach( x => x.classList.remove('blend-out') );
    
    if( document.getElementById('vis_toggle').checked ) {
        document.querySelectorAll('.ch_item.vis').forEach( x => x.classList.add('blend-out') )
        if(dbupdate==true) lstore.storage.toggle_state = true;
    } 
    else {
        if(dbupdate==true) lstore.storage.toggle_state = false;
    }
    if(dbupdate==true) lstore.save();
}

const uploadChecklist = (ev) => {
    let files = ev.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    let output = [];
    for (let i = 0, f; f = files[i]; i++) {
        let reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
                try {
                    json = JSON.parse(e.target.result);
                    
                    if( lstore.import( json ) ){
                        alert(`Successfully loaded ${f.name}`);
                        document.location.reload();
                    }

                } catch (ex) { alert('there was an error while trying to read the file\n' + ex); }
            }
        })(f);
        reader.readAsText(f);
    }
}

const downloadChecklist = (name, type, data) => {
    let blob = new Blob([data], {type: type});

    if (data != null && navigator.msSaveBlob)
        return navigator.msSaveBlob( blob, name);

    let url = window.URL.createObjectURL(blob);
    
    let a = document.createElement("a") 
    a.style.display = 'none';
    a.setAttribute("href", url);
    a.setAttribute("download", name);
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.parentNode.removeChild(a);
}

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

    document.getElementById('vis_toggle').checked = lstore.storage.toggle_state == true ? 'checked' : null;
    set_visibility_of_checked();
});