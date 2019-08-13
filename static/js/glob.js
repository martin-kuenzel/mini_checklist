// encode html_entities (similar to php)
const html_enc = (str) => {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// create a rather unique key id value
const cKey = ()=>{let ret=(new Date()).getTime();for(let i=0;i<5;i++) ret=ret+''+parseInt(Math.random()*9); return ret;}
