// import React, { useMemo, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import './CafeDetail.css';

// const CafeDetail = ({ cafe, onBack, onAddToOrder }) => {
//   const navigate = useNavigate();
//   const [selectedCustomizations, setSelectedCustomizations] = useState({});
//   const [selectedDate, setSelectedDate] = useState('');
//   const [selectedTime, setSelectedTime] = useState('');
//   const [selectedTable, setSelectedTable] = useState(null);
//   const [openCategories, setOpenCategories] = useState(() => {
//     const dict = {};
//     (cafe.menu || []).forEach(item => {
//       const cat = item.category || 'Others';
//       dict[cat] = true;
//     });
//     return dict;
//   });
//   const [openSubcategories, setOpenSubcategories] = useState(() => {
//     const seenCat = {};
//     const dict = {};
//     (cafe.menu || []).forEach(item => {
//       const cat = item.category || 'Others';
//       const sub = item.subCategory || 'General';
//       const key = `${cat}:${sub}`;
//       if (!seenCat[cat]) {
//         dict[key] = true;
//         seenCat[cat] = true;
//       }
//     });
//     return dict;
//   });
//   const [filters, setFilters] = useState({ veg: false, nonveg: false, bestseller: false });
//   const toggleFilter = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));
//   const [menuSearch, setMenuSearch] = useState('');

//   const handleCustomizationChange = (itemId, optionType, value) => {
//     setSelectedCustomizations(prev => ({
//       ...prev,
//       [itemId]: {
//         ...(prev[itemId] || {}),
//         [optionType]: value,
//       },
//     }));
//   };

//   const handleAddToOrder = (item) => {
//     const customizations = selectedCustomizations[item.id] || {};
//     onAddToOrder({ ...item, customizations });
//   };

//   const groupedMenu = useMemo(() => {
//     const items = (cafe.menu || []).filter(i => {
//       if (menuSearch && !i.name.toLowerCase().includes(menuSearch.toLowerCase())) return false;
//       if (filters.veg && !i.veg) return false;
//       if (filters.nonveg && i.veg) return false;
//       if (filters.bestseller && !i.bestseller) return false;
//       return true;
//     });
//     const byCat = {};
//     items.forEach(item => {
//       const cat = item.category || 'Others';
//       const sub = item.subCategory || 'General';
//       if (!byCat[cat]) byCat[cat] = {};
//       if (!byCat[cat][sub]) byCat[cat][sub] = [];
//       byCat[cat][sub].push(item);
//     });
//     return byCat;
//   }, [cafe.menu, menuSearch, filters]);

//   const toggleCategory = (cat) => {
//     setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
//   };
//   const toggleSubcategory = (cat, sub) => {
//     const key = `${cat}:${sub}`;
//     setOpenSubcategories(prev => ({ ...prev, [key]: !prev[key] }));
//   };
//   const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');
//   const categoriesList = useMemo(() => Object.keys(groupedMenu), [groupedMenu]);
//   const scrollToCat = (cat) => {
//     const el = document.getElementById(`cat-${slug(cat)}`);
//     if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
//   };

//   const handleTableBooking = () => {
//     if (selectedTable && selectedDate && selectedTime) {
//       alert(`Table ${selectedTable.id} booked for ${selectedDate} at ${selectedTime}!`);
//       // In a real application, you would send this data to a backend
//     } else {
//       alert('Please select a date, time, and table.');
//     }
//   };

//   if (!cafe) {
//     return null;
//   }

//   return (
//     <div className="cafe-detail-container">
//       <button onClick={onBack} className="back-to-search-button">← Back to Cafes</button>
//       <div className="cafe-detail-header">
//         <img src={cafe.imageUrl} alt={cafe.name} className="cafe-detail-image" />
//         <div className="cafe-detail-info">
//           <h2>{cafe.name}</h2>
//           <p className="cafe-detail-location">{cafe.location}</p>
//           <p className="cafe-detail-rating">Rating: {cafe.rating} ⭐</p>
//           <p className="cafe-detail-description">{cafe.description}</p>
//         </div>
//       </div>

//       <div className="cafe-menu-section">
//         <h3>Menu</h3>
//         <div className="sticky-tabs menu-toolbar">
//           <input
//             className="menu-search-input"
//             type="text"
//             placeholder="Search items"
//             value={menuSearch}
//             onChange={(e) => setMenuSearch(e.target.value)}
//           />
//           <div className="filter-chips">
//             <button
//               className={`chip ${filters.veg ? 'active' : ''}`}
//               onClick={() => toggleFilter('veg')}
//             >Veg</button>
//             <button
//               className={`chip ${filters.nonveg ? 'active' : ''}`}
//               onClick={() => toggleFilter('nonveg')}
//             >Non-veg</button>
//             <button
//               className={`chip ${filters.bestseller ? 'active' : ''}`}
//               onClick={() => toggleFilter('bestseller')}
//             >Bestseller</button>
//           </div>
//           <button
//             className="floating-book-button"
//             onClick={() => {
//               try {
//                 localStorage.setItem('selectedCafe', JSON.stringify(cafe));
//               } catch {}
//               navigate(`/booking/${cafe.id}`, { state: { cafe } });
//             }}
//           >
//             Book Table
//           </button>
//         </div>

//         {Object.keys(groupedMenu).length > 0 ? (
//           <div className="menu-layout">
//             <aside className="menu-category-rail">
//               {categoriesList.map(cat => (
//                 <button key={cat} className="rail-pill" onClick={() => scrollToCat(cat)}>
//                   {cat}
//                 </button>
//               ))}
//             </aside>
//             <div className="menu-content">
//             {Object.entries(groupedMenu).map(([cat, subs]) => {
//               const count = Object.values(subs).reduce((acc, arr) => acc + arr.length, 0);
//               const open = !!openCategories[cat];
//               return (
//                 <div key={cat} className="menu-category" id={`cat-${slug(cat)}`}>
//                   <button className="menu-category-header" onClick={() => toggleCategory(cat)}>
//                     <div className="menu-category-title">{cat}</div>
//                     <div className="menu-category-count">({count})</div>
//                     <div className="menu-category-chevron">{open ? '▾' : '▸'}</div>
//                   </button>
//                   {open && (
//                     <div className="menu-subcategory">
//                       {Object.entries(subs).map(([sub, items]) => {
//                         const skey = `${cat}:${sub}`;
//                         const sopen = !!openSubcategories[skey];
//                         return (
//                           <div key={sub}>
//                             <button className="subcategory-row" onClick={() => toggleSubcategory(cat, sub)}>
//                               <div className="subcategory-title">{sub}</div>
//                               <div className="subcategory-count">({items.length})</div>
//                               <div className="subcategory-chevron">{sopen ? '▾' : '▸'}</div>
//                             </button>
//                             {sopen && (
//                               <div className="menu-grid">
//                                 {items.map((item) => (
//                                   <div key={item.id} className="menu-card">
//                                     <div className="menu-card-image-wrap">
//                                       <img className="menu-card-image" src={item.imageUrl} alt={item.name} />
//                                       {!item.inStock && <div className="sold-out-badge">Sold Out</div>}
//                                       {item.bestseller && <div className="bestseller-badge">Bestseller</div>}
//                                       {item.discountPercent ? <div className="offer-badge">-{item.discountPercent}%</div> : null}
//                                     </div>
//                                     <div className="menu-card-body">
//                                       <div className="menu-card-top">
//                                         <span className={`veg-dot ${item.veg ? 'veg' : 'nonveg'}`} />
//                                         <div className="menu-card-title">{item.name}</div>
//                                         <div className="menu-card-price">{item.inStock ? `$${item.price.toFixed(2)}` : '-'}</div>
//                                       </div>
//                                       {item.description && <div className="menu-card-desc">{item.description}</div>}
//                                       {item.inStock && item.customizationOptions && item.customizationOptions.length > 0 && (
//                                         <div className="customization-options">
//                                           {item.customizationOptions.map(option => (
//                                             <div key={option.type} className="customization-group">
//                                               <label>{option.type}</label>
//                                               <select
//                                                 value={selectedCustomizations[item.id]?.[option.type] || option.default}
//                                                 onChange={(e) => handleCustomizationChange(item.id, option.type, e.target.value)}
//                                               >
//                                                 {option.options.map(opt => (
//                                                   <option key={opt} value={opt}>{opt}</option>
//                                                 ))}
//                                               </select>
//                                             </div>
//                                           ))}
//                                         </div>
//                                       )}
//                                     </div>
//                                     <div className="menu-card-actions">
//                                       {item.inStock ? (
//                                         <button className="add-to-order-button pill" onClick={() => handleAddToOrder(item)}>Add</button>
//                                       ) : (
//                                         <button className="add-to-order-button pill" disabled>Unavailable</button>
//                                       )}
//                                     </div>
//                                   </div>
//                                 ))}
//                               </div>
//                             )}
//                           </div>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//             </div>
//           </div>
//         ) : (
//           <p>No menu items available for this cafe.</p>
//         )}
//       </div>

      
//     </div>
//   );
// };

// export default CafeDetail;




// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import "./CafeDetail.css";

// const CafeDetailsPage = () => {
//   const { id } = useParams();
//   const [cafe, setCafe] = useState(null);

//   useEffect(() => {
//     fetch(`http://localhost:8081/api/cafes/${id}`)
//       .then(res => res.json())
//       .then(data => {
//         console.log("Cafe details:", data);
//         setCafe(data);
//       })
//       .catch(err => console.error(err));
//   }, [id]);

//   if (!cafe) return <p>Loading...</p>;

//   return (
//   <div className="cafe-detail-container">

//     <div className="cafe-detail-header">

//       <img
//         src={cafe.imageUrl}
//         alt={cafe.cafeName}
//         className="cafe-detail-image"
//       />

//       <div className="cafe-detail-info">

//         <h2>{cafe.cafeName}</h2>

//         <p className="cafe-detail-location">
//           {cafe.location}
//         </p>

//         <p className="cafe-detail-description">
//           {cafe.description}
//         </p>

//       </div>

//     </div>

//     <div className="cafe-menu-section">

//       <h3>Menu</h3>

//       {cafe.menuItems && cafe.menuItems.length > 0 ? (

//         <ul className="menu-list">

//           {cafe.menuItems.map(item => (

//             <li key={item.id} className="menu-item">

//               <span className="menu-item-name">
//                 {item.itemName}
//               </span>

//               <span className="menu-item-price">
//                 ₹{item.price}
//               </span>

//             </li>

//           ))}

//         </ul>

//       ) : (

//         <p>No items available</p>

//       )}

//     </div>

//   </div>
// );
// };

// export default CafeDetailsPage;



import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const CafeDetail = () => {
  const { cafeId } = useParams();
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    if (cafeId) {
      axios.get(`/api/cafe/${cafeId}/menu`)
        .then(res => setMenu(res.data))
        .catch(err => console.error(err));
    }
  }, [cafeId]);

  return (
    <div className="menu-list">
      <h2>Menu</h2>
      {menu.map(item => (
        <div key={item.id} className="menu-item">
          <h4>{item.name}</h4>
          <p>{item.description}</p>
          <p>₹{item.price}</p>
          <button>Add to Cart</button>
        </div>
      ))}
    </div>
  );
};

export default CafeDetail;

