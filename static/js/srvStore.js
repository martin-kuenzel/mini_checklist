/**
    The Server storage DB-Manager
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
class srvStore {

    constructor(){ this.load(); console.log(`Instance of ${ this.constructor.name } initialized.`); }
    
    // reset the currently opened storage to the default state
    reset() { 
        let title_tmp = this.storage.title;
        this.storage = default_initial_storage;
        this.storage.title = title_tmp;
        this.save({reload:true});
    }
    
    // load the storage with the APP_KEY from the DB
    load(){
        localforage.getItem(APP_KEY, (err,data) => {
            if(err) throw err;
            this.storage = data ? JSON.parse(data) : default_initial_storage;
        });
    }
    
    // save the current storage to the DB
    save(options={}){
        localforage.setItem(APP_KEY, JSON.stringify(this.storage), (err) => { 
            if(err) throw err;
            console.log('saved'); 
            if(options.reload) document.location.reload(); 
            if(options.callback) options.callback.call();
        });
    }

    // import a checklist from given JSON data (for uploads)
    import(data){
        if(
            typeof data.APP_KEY != 'undefined' && 
            typeof data.toggle_state != 'undefined' && 
            typeof data.title != 'undefined' && 
            typeof data.checklist_items != 'undefined'
        ){
                
            APP_KEY = data.APP_KEY;
            
            this.storage.toggle_state = data.toggle_state;
            this.storage.APP_KEY = data.APP_KEY;
            this.storage.title = data.title;
            this.storage.checklist_items = data.checklist_items;

            localStorage['checklist_app_current'] = APP_KEY;
            
            this.save({reload:true});

            return true;
        }
    }
    
    // get a checklist item by (category,item_id)
    getItem(kat,id){
        let item = this.storage.checklist_items[kat].items.find(x => x.id == id );
        return item;
    }
    
    // add a new category to the DB
    addCategory(addAfter){
        let newKey = `${cKey()}`;
        let new_storage = {};
        for( let kat in this.storage.checklist_items ){
            new_storage[kat] = this.storage.checklist_items[kat]
            if( kat == addAfter ) new_storage[newKey] = { title: newKey, items:[] }
        }
        this.storage.checklist_items = new_storage;
        this.save();
        return newKey;
    }
    
    // rename a category in DB
    renameCategory(kat, title){
        this.storage.checklist_items[kat].title = title;
        this.storage.id_showRegister = `collapse${kat}`;
        this.save();
        return true;
    }
    
    // set currently selected category register
    setRegister(kat){
        this.storage.id_showRegister = kat;
        this.save();
    }

    // add checklist item to the DB
    addItem(kat,callback){
        let newKey = `${cKey()}`
        this.storage.checklist_items[kat].items.push({ 
            title: `new item created @${(new Date()).getTime()}`,
            id: newKey,
            checked: false
        }); 
        this.save({callback:callback}); // save with reload == true
        return newKey; 
    }

    // update the content of a checklist item in DB (title,content)
    renameItem(kat, id, title, content, callback){
        this.getItem(kat,id).title = title;
        if(content) this.getItem(kat,id).content = content;
        this.save({callback:callback}); // save with reload == true
        return true;
    }
    
    // delete checklist item from DB
    delItem(kat,id,callback){
        this.storage.checklist_items[kat].items = this.storage.checklist_items[kat].items.filter( (x,j) => x.id != id ); 
        this.save({callback:callback}); // save with reload == true
        return true;
    }

    // move checklist item from one category to another in the DB
    moveItem(from_kat, to_kat, item_id, addAfter_item_id, create_checklist){
        let item = this.getItem(from_kat,item_id);
        this.storage.checklist_items[from_kat].items = this.storage.checklist_items[from_kat].items.filter( x => x.id !== item_id );
        if(addAfter_item_id) {
            let new_items = [];
            for( let i=0; i < this.storage.checklist_items[to_kat].items.length; i++ ){
                let current_item = this.storage.checklist_items[to_kat].items[i];
                new_items.push( current_item );
                if( current_item.id == addAfter_item_id ) 
                    new_items.push(item);
            }
            this.storage.checklist_items[to_kat].items = new_items;
        }
        else {
            this.storage.checklist_items[to_kat].items.push(item);
        }

        this.save({callback:create_checklist});
        return true;
    }

    // change the toggle state of a checklist item in DB
    toggleCheck(kat,id){ 
        let item = this.getItem(kat,id); 
        item.checked = item.checked == true ? false : true;
        this.save(); 
        return true;
    }
}
