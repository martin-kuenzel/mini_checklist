/**
	The local Storage DB-Manager
*/

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

    constructor(){ this.load(); }
    
    reset() { 
        let title_tmp = this.storage.title; 
        localStorage[APP_KEY] = JSON.stringify(default_initial_storage); 
        this.load(); 
        this.storage.title = title_tmp;
    }
    
    load(){ 
        this.storage = localStorage[APP_KEY] ? JSON.parse(localStorage[APP_KEY]) : default_initial_storage;
    }
    
    save(){ 
        localStorage[APP_KEY] = JSON.stringify(this.storage); 
    }
    
    getItem(kat,id){
        let item = this.storage.checklist_items[kat].items.find(x => x.id==id );
        return item;
    }
    
    addCategory(addAfter){
        let newKey = `${cKey()}`
        let new_storage = {};
        for( let kat in this.storage.checklist_items ){
            new_storage[kat] = this.storage.checklist_items[kat]
            if( kat == addAfter ) new_storage[newKey] = { title: newKey, items:[] }
        }
        this.storage.checklist_items = new_storage;
        this.save();
        return newKey;
    }
    renameCategory(kat, title){
        this.storage.checklist_items[key].title = title;
        this.storage.id_showRegister = `collapse${kat}`
        this.save();
        return true;
    }

    addItem(kat){
        let newKey = `${cKey()}`
        this.storage.checklist_items[kat].items.push({ 
            title: `new item created @${(new Date()).getTime()}`,
            id: newKey,
            checked: false
        }); 
        this.save();
        return newKey; 
    }
    renameItem(kat,id, title){
        this.getItem(kat,id).title = title;
        this.save();
        return true;
    }
    delItem(kat,id){
        this.storage.checklist_items[kat].items = this.storage.checklist_items[kat].items.filter( (x,j) => x.id != id ); 
        this.save(); 
        return true;
    }
    toggleCheck(kat,id){ 
        let item = this.getItem(kat,id); 
        item.checked = item.checked == true ? false : true; 
        this.save(); 
        return true;
    }
}
