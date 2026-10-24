import sharp from "sharp";
export async function prepareAvatar(image:string){
 const bytes=Buffer.from(image,"base64");
 if(bytes.length>2097152)throw Error("upload_too_large");
 if(bytes.toString("base64")!==image)throw Error("invalid_image");
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP";
 if(!png&&!jpeg&&!webp)throw Error("invalid_image");
 try{
  const input=sharp(bytes,{limitInputPixels:16777216,failOn:"warning"});
  const meta=await input.metadata();
  if(!["jpeg","png","webp"].includes(meta.format??"")||(meta.pages??1)>1)throw Error();
  const output=await input.rotate().resize(256,256,{fit:"cover"}).webp({quality:80}).timeout({seconds:5}).toBuffer();
  if(output.length>131072)throw Error();
  return output.toString("base64");
 }catch{throw Error("invalid_image");}
}
