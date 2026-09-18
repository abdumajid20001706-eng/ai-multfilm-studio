import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const run = promisify(execFile);
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PORT = process.env.PORT || 3000;
const OUT = path.join(__dirname, "public", "generated");
fs.mkdirSync(OUT, { recursive: true });

app.use(express.json({limit:"2mb"}));
app.use(express.static(path.join(__dirname,"public")));

app.post("/api/create", async (req,res)=>{
  try {
    if(!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your_api_key"))
      return res.status(400).json({error:"OPENAI_API_KEY sozlanmagan. .env fayliga API kalitingizni kiriting."});
    const {idea, style="3D Cartoon", duration="30 soniya", hero="Asosiy qahramon"} = req.body;
    if(!idea?.trim()) return res.status(400).json({error:"G‘oya kiritilmagan."});

    const prompt = `O‘zbek tilida bolalar uchun qisqa multfilm ssenariysi tuz.
G‘oya: ${idea}
Asosiy qahramon: ${hero}
Vizual uslub: ${style}
Davomiylik: ${duration}
JSON qaytar: {title:string, scenes:[{name:string,narration:string,image_prompt:string}]}.
5 ta sahna bo‘lsin. Har image_prompt ingliz tilida bo‘lsin va qahramonning tashqi ko‘rinishini har sahnada bir xil saqlashni aniq yoz.`;

    const r = await client.responses.create({
      model:"gpt-5.6-luna",
      input:prompt
    });
    const raw = r.output_text.trim().replace(/^```json\s*/,"").replace(/```$/,"");
    const data = JSON.parse(raw);
    const id = uuid();
    const dir = path.join(OUT,id);
    fs.mkdirSync(dir,{recursive:true});

    const scenes=[];
    for(let i=0;i<data.scenes.length;i++){
      const s=data.scenes[i];
      const img = await client.images.generate({
        model:"gpt-image-2",
        prompt:s.image_prompt,
        size:"1024x1024"
      });
      const b64 = img.data[0].b64_json;
      const imagePath=path.join(dir,`scene-${i+1}.png`);
      fs.writeFileSync(imagePath,Buffer.from(b64,"base64"));

      const speech = await client.audio.speech.create({
        model:"gpt-4o-mini-tts",
        voice:"alloy",
        input:s.narration
      });
      const audioPath=path.join(dir,`scene-${i+1}.mp3`);
      fs.writeFileSync(audioPath,Buffer.from(await speech.arrayBuffer()));
      scenes.push({...s,image:`/generated/${id}/scene-${i+1}.png`,audio:`/generated/${id}/scene-${i+1}.mp3`});
    }

    // Optional MP4 assembly: requires ffmpeg installed on the server.
    let video=null;
    try{
      const concat=path.join(dir,"concat.txt");
      const lines=[];
      for(let i=0;i<scenes.length;i++){
        const img=path.join(dir,`scene-${i+1}.png`).replaceAll("\\","/");
        lines.push(`file '${img}'`);
        lines.push(`duration 4`);
      }
      lines.push(`file '${path.join(dir,`scene-${scenes.length}.png`).replaceAll("\\","/")}'`);
      fs.writeFileSync(concat,lines.join("\n"));
      const mp4=path.join(dir,"preview.mp4");
      await run("ffmpeg",["-y","-f","concat","-safe","0","-i",concat,"-vf","scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2","-r","24","-pix_fmt","yuv420p",mp4]);
      video=`/generated/${id}/preview.mp4`;
    }catch(e){ console.log("ffmpeg mavjud emas yoki video assembly xatosi:",e.message); }

    res.json({id,title:data.title,scenes,video});
  } catch(e){
    console.error(e);
    res.status(500).json({error:e.message || "Server xatosi"});
  }
});

app.listen(PORT,()=>console.log(`AI Multfilm Studio: http://localhost:${PORT}`));
