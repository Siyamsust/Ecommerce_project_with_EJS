const http = require('http');
const server= http.createServer((req,res)=>{
    const url=req.url;
    if(url ==='/')
    {
        res.write('<html>')
        res.write('<head><title>Message</title></head>');
        res.write('<body><form action="/message" method="POST"><input type="text"><button type="submit">submit</button></form></body>');
        res.write('</html>')
        return res.end();
    }
    res.setHeader('Content-Type','text/html');
    res.write('<html>')
    res.write('<head><title>Page</title></head>');
    res.write('<body><h1>Hello nodejs</h1></body>');
    res.write('</html>')
    res.end();
   
});
server.listen(3000);