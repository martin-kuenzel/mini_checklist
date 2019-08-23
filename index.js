const express = require("express");
const app = express();

const PORT = process.env.PORT || 4242;

app.use(
    express.static('static')
);

app.get('*',(req,res)=>{
    res.redirect('checklist.html');
})

app.listen(
    PORT,()=>{ console.log(`Server listening on port ${PORT}`);
});