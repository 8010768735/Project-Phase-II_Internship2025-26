import React,{useState} from "react";

const CafeDetails = () => {

 const [cafeDetails,setCafeDetails] = useState({
  name:"",
  address:"",
  contact:"",
  openingTime:"",
  closingTime:"",
  email:"",
  landmark:"",
  cuisine:"",
  gstin:"",
  city:"",
  state:"",
  pincode:"",
  seatingCapacity:""
 })


 const handleCafeDetailsChange = (e)=>{

  const {name,value} = e.target

  setCafeDetails({
    ...cafeDetails,
    [name]:value
  })

 }


 const handleSaveCafeDetails = async(e)=>{

  e.preventDefault()

  await fetch("http://localhost:8081/api/cafes/details",{

    method:"POST",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify(cafeDetails)

  })

  alert("Cafe details saved")

 }


 return(

  <form onSubmit={handleSaveCafeDetails}>

    <input
    name="name"
    placeholder="Cafe Name"
    onChange={handleCafeDetailsChange}
    />

    <input
    name="address"
    placeholder="Address"
    onChange={handleCafeDetailsChange}
    />

    <button type="submit">
    Save
    </button>

  </form>

 )

}

export default CafeDetails

