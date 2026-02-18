import express from "express";
import fetch from "node-fetch";

const app=express();
app.use(express.json());

app.post("/api/chat", async (req,res)=>{
const msg=req.body.message;

const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{
method:"POST",
headers:{
"Authorization":"Bearer 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",
"Content-Type":"application/json"
},
body:JSON.stringify({
model:"mistralai/mistral-7b-instruct",
messages:[{role:"user",content:msg}]
})
});

const data=await response.json();
res.json({reply:data.choices[0].message.content});
});

app.listen(3000,()=>console.log("AI Server Running"));
