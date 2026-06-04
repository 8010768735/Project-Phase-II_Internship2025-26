import React, { useEffect, useState } from "react";
import "./TablesManagement.css";

const initialTableState = {
tableNumber:"",
seats:"",
price:"",
tableType:"",
imageUrl:null
};

const tableThemePattern = /^[A-Za-z\s]+$/;

const TablesManagement = ({ cafeId, onSuccess }) => {

const [tables,setTables] = useState([]);
const [showPopup,setShowPopup] = useState(false);
const [editingId,setEditingId] = useState(null);

const [table,setTable] = useState(initialTableState);

const fetchTables = async () => {
if(!cafeId){
setTables([]);
return;
}

try{
console.log("Fetching tables for cafe:", cafeId);

const res = await fetch(`http://localhost:8081/api/tables/cafe/${cafeId}`);
const data = await res.json();

console.log("TABLE DATA:", data);

if(Array.isArray(data)){
setTables(data);
}else{
setTables([]);
}

}catch(err){
console.error(err);
}

};

useEffect(()=>{

fetchTables();

},[cafeId]);

const handleChange=(e)=>{

const {name,value}=e.target;
let nextValue = value;

if(name === "tableNumber" || name === "seats" || name === "price"){
nextValue = value.replace(/\D/g,"");
}

if(name === "tableType"){
nextValue = value.replace(/[^A-Za-z\s]/g,"");
}

setTable({
...table,
[name]:nextValue
});

};

const handleImageUpload=(e)=>{

const file = e.target.files[0];

if(file){

const reader = new FileReader();

reader.onloadend = () => {

setTable((prev)=>({
...prev,
imageUrl:reader.result
}));

};

reader.readAsDataURL(file);

}

};

const saveTable=async()=>{
if(!cafeId){
alert("Please select a cafe first.");
return;
}

const tableNumberValue = String(table.tableNumber ?? "").trim();
const seatsValue = String(table.seats ?? "").trim();
const priceValue = String(table.price ?? "").trim();
const tableTypeValue = String(table.tableType ?? "").trim();

if(!tableNumberValue || !/^\d+$/.test(tableNumberValue)){
alert("Table number should contain only numbers.");
return;
}

if(!seatsValue || !/^\d+$/.test(seatsValue)){
alert("Number of seats should contain only numbers.");
return;
}

if(!priceValue || !/^\d+$/.test(priceValue)){
alert("Price should contain only numbers.");
return;
}

if(!tableTypeValue || !tableThemePattern.test(tableTypeValue)){
alert("Table theme should contain only letters.");
return;
}

const url = editingId
? `http://localhost:8081/api/tables/${editingId}`
: "http://localhost:8081/api/tables";

const method = editingId ? "PUT" : "POST";

try{
const payload = {
id: editingId || undefined,
tableNumber: tableNumberValue,
seats: Number(seatsValue),
price: Number(priceValue),
tableType: tableTypeValue,
cafeId:Number(cafeId),
imageUrl: table.imageUrl || ""
};

const response = await fetch(url,{

method,
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(payload)

});

if(!response.ok){
throw new Error(editingId ? "Failed to update table." : "Failed to add table.");
}

const responseText = await response.text();
let savedTable = null;

if(responseText){
try{
savedTable = JSON.parse(responseText);
}catch(err){
console.error("Unable to parse saved table response",err);
}
}

if(!savedTable){
savedTable = {
...payload,
id: editingId || Date.now()
};
}

setTables((prev)=>
editingId
? prev.map((item)=>item.id === editingId ? savedTable : item)
: [savedTable, ...prev]
);

setTable(initialTableState);

setShowPopup(false);
setEditingId(null);

fetchTables();
onSuccess?.(editingId ? "Table updated successfully." : "Table added successfully.");
}catch(err){
console.error("Save table failed",err);
alert(err.message || "Unable to save table.");
}

};

const editTable=(t)=>{

setEditingId(t.id);

setTable({
tableNumber:String(t.tableNumber ?? ""),
seats:String(t.seats ?? ""),
price:String(t.price ?? ""),
tableType:String(t.tableType ?? ""),
imageUrl:t.imageUrl || null
});

setShowPopup(true);

};

const deleteTable = async (id) => {

const confirmDelete = window.confirm("Are you sure you want to delete this table?");

if(!confirmDelete){
return;
}

try{

await fetch(`http://localhost:8081/api/tables/${id}`,{
method:"DELETE"
});

fetchTables();
onSuccess?.("Table deleted successfully.");

}catch(err){

console.error("Delete failed",err);

}

};


return(

<div className="tables-section">

<div className="tables-header">

<h2>Tables</h2>

<button
className="add-btn"
onClick={()=>{
setTable(initialTableState);
setEditingId(null);
setShowPopup(true);
}}
>
+ Add Table
</button>

</div>

<div className="tables-grid">

{!cafeId ? (
<p>Please select a cafe to manage tables.</p>
) : tables.length === 0 ? (
<p>No tables added for this cafe yet.</p>
) : tables.map(t=>(

<div key={t.id} className="table-card">

<div className="table-image">

{t.imageUrl && (
  <img src={t.imageUrl} alt="table"/>
)}


<div className="table-actions">

<span onClick={()=>editTable(t)}>✏️</span>
<span onClick={()=>deleteTable(t.id)}>🗑</span>

</div>

</div>

<h3>{t.tableType}</h3>

<p>Table No : {t.tableNumber}</p>

<p>Seats : {t.seats}</p>

<p className="price">₹{t.price}</p>

</div>

))}

</div>

{showPopup && (

<div className="popup">

<div className="popup-content">

<h3>{editingId ? "Edit Table" : "Add Table"}</h3>

<form
className="table-popup-form"
onSubmit={(e)=>{
e.preventDefault();
saveTable();
}}
>

<input
className="table-popup-input"
name="tableNumber"
placeholder="Table Number"
value={table.tableNumber}
onChange={handleChange}
inputMode="numeric"
/>

<input
className="table-popup-input"
name="seats"
placeholder="Number of Seats"
value={table.seats}
onChange={handleChange}
inputMode="numeric"
/>

<input
className="table-popup-input"
name="price"
placeholder="Price"
value={table.price}
onChange={handleChange}
inputMode="numeric"
/>

<input
className="table-popup-input"
name="tableType"
placeholder="Table Theme (Birthday / Couple)"
value={table.tableType}
onChange={handleChange}
/>

<input
className="table-popup-file"
type="file"
accept="image/*"
onChange={handleImageUpload}
/>

<div className="popup-buttons">

<button type="submit" className="save-btn">
Save
</button>

<button type="button" className="cancel-btn" onClick={()=>setShowPopup(false)}>
Cancel
</button>

</div>

</form>

</div>

</div>

)}

</div>

);

};

export default TablesManagement;






// import React, { useEffect, useState } from "react";
// import "./TablesManagement.css";

// const TablesManagement = () => {

// const [tables,setTables] = useState([]);
// const [showPopup,setShowPopup] = useState(false);

// const cafeId = localStorage.getItem("cafeId");

// const [table,setTable] = useState({
// tableNumber:"",
// seats:"",
// price:"",
// tableType:"",
// imageUrl:""
// });

// const fetchTables = async () => {

//   try {

//     const res = await fetch(`http://localhost:8081/api/tables/cafe/${cafeId}`);

//     if (!res.ok) {
//       throw new Error("Failed to fetch tables");
//     }

//     const data = await res.json();

//     if (Array.isArray(data)) {
//       setTables(data);
//     } else {
//       setTables([]);
//     }

//   } catch (err) {

//     console.error("Table fetch error:", err);
//     setTables([]);

//   }
// };


// useEffect(()=>{

// if(cafeId){
// fetchTables();
// }

// },[cafeId]);

// const handleChange=(e)=>{

// const {name,value}=e.target;

// setTable({
// ...table,
// [name]:value
// });

// };

// const addTable=async()=>{

// await fetch("http://localhost:8081/api/tables",{

// method:"POST",
// headers:{
// "Content-Type":"application/json"
// },
// body:JSON.stringify({
// ...table,
// cafeId
// })

// });

// setShowPopup(false);

// fetchTables();

// };

// const deleteTable=async(id)=>{

// await fetch(`http://localhost:8081/api/tables/${id}`,{
// method:"DELETE"
// });

// fetchTables();

// };

// return(

// <div className="tables-section">

// <div className="tables-header">

// <h2>Tables</h2>

// <button onClick={()=>setShowPopup(true)} className="add-btn">
// Add Table
// </button>

// </div>

// <div className="tables-grid">

// {tables.map(t=>(

// <div key={t.id} className="table-card">

// <img src={t.imageUrl} alt="table"/>

// <h3>{t.tableType}</h3>

// <p>Table No: {t.tableNumber}</p>

// <p>Seats: {t.seats}</p>

// <p>Price: ₹{t.price}</p>

// <button onClick={()=>deleteTable(t.id)} className="delete-btn">
// Delete
// </button>

// </div>

// ))}

// </div>

// {showPopup && (

// <div className="popup">

// <div className="popup-content">

// <h3>Add Table</h3>

// <input
// name="tableNumber"
// placeholder="Table Number"
// onChange={handleChange}
// />

// <input
// name="seats"
// placeholder="Seats"
// onChange={handleChange}
// />

// <input
// name="price"
// placeholder="Price"
// onChange={handleChange}
// />

// <input
// name="tableType"
// placeholder="Table Theme (Birthday / Couple)"
// onChange={handleChange}
// />

// <input
// name="imageUrl"
// placeholder="Image URL"
// onChange={handleChange}
// />

// <button onClick={addTable}>Save</button>

// <button onClick={()=>setShowPopup(false)}>
// Cancel
// </button>

// </div>

// </div>

// )}

// </div>

// );

// };

// export default TablesManagement;







