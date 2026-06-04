import { getCurrentUser } from "../utils/session";

const BASE_URL = "http://localhost:8081/api";

// MENU APIs
// export const addMenuItem = (data) =>
//   fetch(`${BASE_URL}/menu`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });

// export const addMenuItem = async (item) => {
//   const res = await fetch(`${BASE_URL}/menu`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(item),
//   });
  
//   if(!res.ok){
//     throw new Error("Failed to add menu item");
//   }
//   return await res.json(); // ✅ VERY IMPORTANT
// };

export const addMenuItem = async (newItem, imageFile) => {

  const formData = new FormData();

  formData.append("itemName", newItem.name);
  formData.append("price", newItem.price);
  formData.append("description", newItem.description);
  formData.append("image", imageFile);

  // ✅ DEBUG (keep this for now)
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  const response = await fetch("http://localhost:8081/api/menu", {
    method: "POST",
    body: formData, // ✅ IMPORTANT
  });

  if (!response.ok) {
    throw new Error("Failed to add menu item");
  }

  return await response.json();
};


export const getMenuItems = () =>
  fetch(`${BASE_URL}/menu`);

export const deleteMenuItem = (id) =>
  fetch(`${BASE_URL}/menu/${id}`, {
    method: "DELETE",
  });

export const updateMenuItem = (id, data) =>
  fetch(`${BASE_URL}/menu/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });


// STAFF APIs
export const addStaff = (data) =>
  fetch(`${BASE_URL}/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const deleteStaff = (id) =>
  fetch(`${BASE_URL}/staff/${id}`, {
    method: "DELETE",
  });


// ORDERS
export const updateOrderStatus = async (id, status) => {

  return fetch(`http://localhost:8081/api/orders/${id}/status?status=${status}`, {
    method: "PUT"
  });

};


  export const getOrders = () => {
  const user = getCurrentUser();
  const ownerId = user?.id;

  return fetch(`${BASE_URL}/orders/owner/${ownerId}`);
};


// BOOKINGS
export const updateReservationStatus = async (id, status) => {
  const response = await fetch(`http://localhost:8081/api/bookings/${id}?status=${encodeURIComponent(status)}`, {
    method: "PUT"
  });

  if (!response.ok) {
    throw new Error("Failed to update booking status");
  }

  return response.json();

};



