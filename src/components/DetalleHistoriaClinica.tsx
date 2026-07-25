import FichaClinicaDocumento from "./FichaClinicaDocumento";


interface Props {

  historia:any;

  paciente:any;

  onClose:()=>void;

}



function DetalleHistoriaClinica({

  historia,

  paciente,

  onClose

}:Props){



return (

<div>


<div

style={{

display:"flex",

justifyContent:"space-between",

alignItems:"center",

marginBottom:"20px"

}}

>


<h2>
👁 Detalle Historia Clínica
</h2>



<div

style={{

display:"flex",

gap:"10px"

}}

>


<button

onClick={()=>window.print()}

style={{

background:"#cc001f",

color:"#fff",

border:"none",

padding:"10px 18px",

borderRadius:"10px",

cursor:"pointer"

}}

>

🖨 Imprimir Ficha

</button>




<button

onClick={onClose}

style={{

border:"none",

background:"#eee",

padding:"10px 15px",

borderRadius:"10px",

cursor:"pointer"

}}

>

✕ Cerrar

</button>



</div>



</div>





<FichaClinicaDocumento

  paciente={paciente}

  historia={historia}

/>



</div>

);


}


export default DetalleHistoriaClinica;
