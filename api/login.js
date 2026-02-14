export default function handler(req,res){
if(req.query.logout){
res.setHeader("Set-Cookie","user=; Max-Age=0; Path=/")
return res.end()
}

res.setHeader("Set-Cookie","user=1; Path=/")
res.end()
}
