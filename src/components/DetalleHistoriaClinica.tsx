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





<FichaClinicaDocumento

  paciente={paciente}

  historia={historia}

/>



</div>

);


}


export default DetalleHistoriaClinica;
