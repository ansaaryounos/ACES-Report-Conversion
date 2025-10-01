const elToCapture = document.getElementById("myHeader");
html2canvas(elToCapture, {
    allowTaint:true
}).then((canvas)=> {
    document.body.append(canvas);
})
