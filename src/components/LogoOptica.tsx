import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";


function LogoOptica(){

const [logo,setLogo] =
useState<string>("");


async function cargarLogo(){

const {data,error}=await supabase
.from("configuracion_optica")
.select("logo_url")
.limit(1)
.single();


if(!error && data){

setLogo(
data.logo_url || ""
);

}

}



async function subirLogo(
e:any
){

const archivo =
e.target.files[0];


if(!archivo)
return;



const nombreArchivo =
`logo-${Date.now()}-${archivo.name}`;



const {error} =
await supabase.storage
.from("logos-opticas")
.upload(
nombreArchivo,
archivo
);



if(error){

alert(error.message);

return;

}



const {data:urlData}=

supabase.storage
.from("logos-opticas")
.getPublicUrl(
nombreArchivo
);



await supabase
.from("configuracion_optica")
.update({

logo_url:
urlData.publicUrl

})
.eq(
"id",
1
);



setLogo(
urlData.publicUrl
);



}



useEffect(()=>{

cargarLogo();

},[]);



return (

<div>

<label

style={{

cursor:"pointer"

}}

>


{

logo ?

<img

src={logo}

alt="Logo óptica"

style={{

width:"90px",

height:"90px",

objectFit:"contain",

borderRadius:"10px"

}}

/>


:

<div

style={{

width:"90px",

height:"90px",

border:"2px dashed #ccc",

display:"flex",

alignItems:"center",

justifyContent:"center",

fontSize:"12px"

}}

>

LOGO

</div>


}



<input

type="file"

accept="image/*"

onChange={subirLogo}

style={{

display:"none"

}}

/>


</label>


</div>

);


}


export default LogoOptica;
