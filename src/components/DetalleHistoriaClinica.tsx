interface Props {

  historia:any;

  onClose:()=>void;

}


function DetalleHistoriaClinica({

  historia,

  onClose

}:Props){


return (

<div>


<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"25px"
}}
>


<h2>
📋 Detalle Historia Clínica
</h2>


<button

onClick={onClose}

style={{
border:"none",
background:"#eee",
borderRadius:"10px",
padding:"10px 15px",
cursor:"pointer"
}}

>

✕


</button>


</div>





<h3>
👁 Consulta
</h3>


<p>
<strong>Fecha:</strong>{" "}

{
historia.fecha_registro
?
new Date(historia.fecha_registro)
.toLocaleDateString("es-CL")
:
"Sin fecha"
}

</p>



<p>
<strong>Motivo:</strong>{" "}

{
historia.motivo_consulta ||
"Sin registro"
}

</p>



<p>
<strong>Antecedentes:</strong>{" "}

{
historia.antecedentes ||
"Sin registro"
}

</p>





<h3>
👓 Refracción
</h3>


<p>
OD Esfera:
{" "}
{historia.esfera_od || "-"}
</p>


<p>
OI Esfera:
{" "}
{historia.esfera_oi || "-"}
</p>


<p>
OD Cilindro:
{" "}
{historia.cilindro_od || "-"}
</p>


<p>
OI Cilindro:
{" "}
{historia.cilindro_oi || "-"}
</p>


<p>
OD Eje:
{" "}
{historia.eje_od || "-"}
</p>


<p>
OI Eje:
{" "}
{historia.eje_oi || "-"}
</p>


<p>
Adición:
{" "}
{historia.adicion || "-"}
</p>


<p>
Distancia Pupilar:
{" "}
{historia.distancia_pupilar || "-"}
</p>





<h3>
🔬 Examen Clínico
</h3>


<p>
<strong>Biomicroscopía:</strong>

<br/>

{
historia.biomicroscopia ||
"Sin registro"
}

</p>



<p>
<strong>Tonometría:</strong>

<br/>

{
historia.tonometria ||
"Sin registro"
}

</p>




<p>
<strong>Fondo de ojo:</strong>

<br/>

{
historia.fondo_ojo ||
"Sin registro"
}

</p>





<h3>
🩺 Diagnóstico
</h3>


<p>

{
historia.diagnostico ||
"Sin diagnóstico"
}

</p>





<h3>
💊 Tratamiento
</h3>


<p>

{
historia.tratamiento ||
"Sin tratamiento"
}

</p>




<h3>
📝 Observaciones
</h3>


<p>

{
historia.observaciones ||
"Sin observaciones"
}

</p>



</div>


);


}


export default DetalleHistoriaClinica;
