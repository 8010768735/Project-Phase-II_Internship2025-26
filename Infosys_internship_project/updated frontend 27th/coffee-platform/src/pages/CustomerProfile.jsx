import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Customerprofile.css';

const Customerprofile = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrText, setNewAddrText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const actionsRef = useRef(null);
  const cafes = useMemo(
    () => [
      {
        id: 1,
        name: 'Aroma Brew',
        location: 'Downtown',
        rating: 4.6,
        imageUrl:
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop',
      },
      {
        id: 2,
        name: 'Mocha Haven',
        location: 'Uptown',
        rating: 4.3,
        imageUrl:
          'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop',
      },
      {
        id: 3,
        name: 'Daily Roast',
        location: 'Midtown',
        rating: 4.8,
        imageUrl:
          'https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=1200&auto=format&fit=crop',
      },
      {
        id: 4,
        name: 'Espresso Express',
        location: 'Riverside',
        rating: 4.1,
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop',
      },
      {
        id: 5,
        name: 'Sweet Spot Café',
        location: 'Old Town',
        rating: 4.4,
        imageUrl:
          'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1200&auto=format&fit=crop',
      },
      {
        id: 6,
        name: 'Brew & Grind',
        location: 'Tech Park',
        rating: 4.5,
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop',
      },
    ],
    []
  );
  const filteredCafes = useMemo(
    () =>
      cafes.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.location.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [cafes, searchTerm]
  );
  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };
  const goProfile = () => {
    navigate('/customer-account');
  };
  const goFavourites = () => {
    navigate('/customer-account?tab=favourites');
  };
  useEffect(() => {
    const raw = localStorage.getItem('savedAddresses');
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setSavedAddresses(arr);
          if (!address && arr.length > 0) {
            setAddress(arr[0].full);
          }
        }
      } catch {}
    }
  }, []);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const a = `Lat ${pos.coords.latitude.toFixed(4)}, Lon ${pos.coords.longitude.toFixed(4)}`;
          setAddress(a);
        },
        () => {
          setAddress('Using current location');
        }
      );
    } else {
      setAddress('Using current location');
    }
  };
  const handleSelectSaved = (full) => {
    setAddress(full);
  };
  const handleAddAddress = (e) => {
    e.preventDefault();
    const label = newAddrLabel.trim() || 'Address';
    const full = newAddrText.trim();
    if (!full) return;
    const next = [...savedAddresses, { label, full }];
    setSavedAddresses(next);
    localStorage.setItem('savedAddresses', JSON.stringify(next));
    setAddress(full);
    setShowAddForm(false);
    setNewAddrLabel('');
    setNewAddrText('');
  };

  return (
    <div className="customer-profile">
      <div className="profile-topbar">
        <h2 className="profile-title">Browse Cafés</h2>
        <div ref={actionsRef} className={`profile-actions has-menu ${menuOpen ? 'open' : ''}`}>
          <div
            className="profile-avatar-icon"
            title="Your profile"
            aria-label="Profile"
            onClick={() => setMenuOpen((v) => !v)}
          >
            👤
          </div>
          <ul className="profile-dropdown">
            <li onClick={goProfile}>Profile</li>
            <li onClick={goFavourites}>Favourites</li>
            <li onClick={handleLogout}>Logout</li>
          </ul>
        </div>
      </div>

      <div className="profile-header">
        <div className="address-pill has-address-menu" title="Choose address">
          <div className="address-pill-left">📍</div>
          <div className="address-pill-text" aria-label="Current address">
            {address ? address : 'Add new address'}
          </div>
          <div className="address-pill-right">▾</div>
          <div className="address-dropdown">
            <button className="dropdown-action" onClick={handleUseCurrentLocation}>
              Use my current location
            </button>
            <div className="dropdown-divider" />
            <div className="dropdown-section-title">Saved Addresses</div>
            {savedAddresses.length > 0 ? (
              <ul className="saved-addresses">
                {savedAddresses.map((a, idx) => (
                  <li key={idx} onClick={() => handleSelectSaved(a.full)}>
                    <span className="addr-icon">📍</span>
                    <span className="addr-label">{a.label}</span>
                    <span className="addr-full">· {a.full}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-address">No saved addresses</div>
            )}
            {!showAddForm ? (
              <button className="dropdown-action" onClick={() => setShowAddForm(true)}>
                Add new address
              </button>
            ) : (
              <form className="add-address-form" onSubmit={handleAddAddress}>
                <input
                  type="text"
                  className="add-input"
                  placeholder="Label (e.g., Home)"
                  value={newAddrLabel}
                  onChange={(e) => setNewAddrLabel(e.target.value)}
                />
                <input
                  type="text"
                  className="add-input"
                  placeholder="Full address"
                  value={newAddrText}
                  onChange={(e) => setNewAddrText(e.target.value)}
                />
                <div className="add-actions">
                  <button type="button" className="btn-link" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="search-button">
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        <div className="search-bar">
          <input
            className="search-input"
            type="text"
            placeholder="Search cafes by name or location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-button" type="button">Search</button>
        </div>
      </div>

      <p className="profile-subtitle">
        Discover hand-picked cafés near you. Explore menus, ratings, and more.
      </p>

      <div className="cafe-grid">
        {filteredCafes.map((cafe) => (
          <div key={cafe.id} className="cafe-card">
            <img className="cafe-image" src={cafe.imageUrl} alt={cafe.name} />
            <div className="cafe-info">
              <h3 className="cafe-name">{cafe.name}</h3>
              <p className="cafe-location">{cafe.location}</p>
              <p className="cafe-rating">Rating: {cafe.rating} ⭐</p>
              <button
                className="browse-button"
                type="button"
                onClick={() => navigate(`/dashboard/customer?cafeId=${cafe.id}`, { state: { fromBrowse: true } })}
              >
                View Café
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Customerprofile;









// import React, { useEffect, useState, useMemo, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import './Customerprofile.css';

// const CustomerProfile = () => {
//   const navigate = useNavigate();
//   const actionsRef = useRef(null);
//   const [customer, setCustomer] = useState(null);

//   const [cart, setCart] = useState(() => {
//     const stored = localStorage.getItem("cart");
//     return stored ? JSON.parse(stored) : [];
//   });

//   useEffect(() => {
//     const user = localStorage.getItem("user");
//     if (user) {
//       setCustomer(JSON.parse(user));
//     }
//   }, []);

//   // Addresses
//   const [savedAddresses, setSavedAddresses] = useState(() => {
//     const raw = localStorage.getItem("savedAddresses");
//     if (raw) {
//       try {
//         const arr = JSON.parse(raw);
//         if (Array.isArray(arr)) return arr;
//       } catch (e) {
//         console.warn("could not parse savedAddresses", e);
//       }
//     }
//     return [];
//   });

//   const [address, setAddress] = useState(() => savedAddresses[0]?.full || "");
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newAddrLabel, setNewAddrLabel] = useState("");
//   const [newAddrText, setNewAddrText] = useState("");

//   // Cafes
//   const [cafes, setCafes] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [menuOpen, setMenuOpen] = useState(false);

//   // Fetch cafes
//   useEffect(() => {
//     axios
//       .get("http://localhost:8081/api/cafe")
//       .then((res) => {
//         const cafesArray = Array.isArray(res.data) ? res.data : res.data.cafes || [];
//         const cafesWithImages = cafesArray.map((cafe, idx) => ({
//           ...cafe,
//           imageUrl:
//             cafe.imageUrl ||
//             `https://source.unsplash.com/400x300/?cafe,coffee,${idx}`,
//         }));
//         setCafes(cafesWithImages);
//       })
//       .catch((err) => console.error("failed to fetch cafes", err));
//   }, []);

//   const filteredCafes = useMemo(
//     () =>
//       cafes.filter((c) =>
//         (c.cafeName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
//         (c.address?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
//         (c.city?.toLowerCase() || "").includes(searchTerm.toLowerCase())
//       ),
//     [cafes, searchTerm]
//   );

  
//   useEffect(() => {
//   const handleClickOutside = (e) => {
//     if (actionsRef.current && !actionsRef.current.contains(e.target)) {
//       setMenuOpen(false);
//     }
//   };

//   document.addEventListener("click", handleClickOutside);

//   return () => {
//     document.removeEventListener("click", handleClickOutside);
//   };
// }, []);


//   // Address handlers
//   const handleUseCurrentLocation = () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) =>
//           setAddress(
//             `Lat ${pos.coords.latitude.toFixed(4)}, Lon ${pos.coords.longitude.toFixed(4)}`
//           ),
//         () => setAddress("Using current location")
//       );
//     } else {
//       setAddress("Using current location");
//     }
//   };

//   const handleSelectSaved = (full) => setAddress(full);

//   const handleAddAddress = (e) => {
//     e.preventDefault();
//     const label = newAddrLabel.trim() || "Address";
//     const full = newAddrText.trim();
//     if (!full) return;

//     const next = [...savedAddresses, { label, full }];
//     setSavedAddresses(next);
//     localStorage.setItem("savedAddresses", JSON.stringify(next));
//     setAddress(full);

//     setShowAddForm(false);
//     setNewAddrLabel("");
//     setNewAddrText("");
//   };

//   // Navigation
//   const handleLogout = () => {
//     localStorage.removeItem("userRole");
//     navigate("/");
//   };

//   const goProfile = () => navigate("/customer-account");
//   const goFavourites = () => navigate("/customer-account?tab=favourites");

//   // // Add to cart
//   // const addToCart = (item) => {
//   //   const updated = [...cart, item];
//   //   setCart(updated);
//   //   localStorage.setItem("cart", JSON.stringify(updated));
//   // };

//   // saving item to cart
// const user = JSON.parse(localStorage.getItem("user"));

// const addToCart = async (item) => {
//   console.log("CLICK WORKING", item);
//   const user = JSON.parse(localStorage.getItem("user"));
//   console.log("USER:", user);

//   try {
//     await axios.post("http://localhost:8081/api/cart/add", {
//       userId: user.id,
//       itemId: item.id,
//       itemName: item.name,
//       price: item.price
//     });

//     alert("Added to cart");

//   } catch (err) {
//     console.error(err);
//   }
// };

//   return (
//     <div className="customer-profile">
//       <div className="profile-topbar">
//         <h2 className="profile-title">
//           Hi {customer ? ` ${customer.firstName} ` : "customer"}
//           <br />
//           Browse Cafés
//         </h2>
//         <div className="cart-profile">
//         <div
//             className="cart-icon"
//             onClick={() => navigate("/cart")}
//           >
//             🛒 {cart.length}
//         </div>
//         <div ref={actionsRef} className={`profile-actions has-menu ${menuOpen ? 'open' : ''}`}>
          
//           <div
//             className="profile-avatar-icon"
//             title="Your profile"
//             aria-label="Profile"
//             onClick={() => setMenuOpen((v) => !v)}
//           >
//             👤
//           </div>
//             <ul className="profile-dropdown">
//               <li onClick={goProfile}>Profile</li>
//               <li onClick={goFavourites}>Favourites</li>
//               <li onClick={handleLogout}>Logout</li>
//             </ul>
//         </div>
//         </div>
//       </div>

//       {/* Header */}
//       <div className="profile-header">
//         <div className="address-pill has-address-menu">
//           <div className="address-pill-left">📍</div>
//           <div className="address-pill-text">{address || "Add new address"}</div>
//           <div className="address-pill-right">▾</div>

//           <div className="address-dropdown">
//             <button className="dropdown-action" onClick={handleUseCurrentLocation}>
//               Use my current location
//             </button>

//             <div className="dropdown-divider" />

//             <div className="dropdown-section-title">Saved Addresses</div>

//             {savedAddresses.length > 0 ? (
//               <ul className="saved-addresses">
//                 {savedAddresses.map((a, idx) => (
//                   <li key={idx} onClick={() => handleSelectSaved(a.full)}>
//                     <span className="addr-icon">📍</span>
//                     <span className="addr-label">{a.label}</span>
//                     <span className="addr-full">· {a.full}</span>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <div className="no-address">No saved addresses</div>
//             )}

//             {!showAddForm ? (
//               <button className="dropdown-action" onClick={() => setShowAddForm(true)}>
//                 Add new address
//               </button>
//             ) : (
//               <form className="add-address-form" onSubmit={handleAddAddress}>
//                 <input
//                   type="text"
//                   className="add-input"
//                   placeholder="Label (e.g., Home)"
//                   value={newAddrLabel}
//                   onChange={(e) => setNewAddrLabel(e.target.value)}
//                 />
//                 <input
//                   type="text"
//                   className="add-input"
//                   placeholder="Full address"
//                   value={newAddrText}
//                   onChange={(e) => setNewAddrText(e.target.value)}
//                 />

//                 <div className="add-actions">
//                   <button
//                     type="button"
//                     className="btn-link"
//                     onClick={() => setShowAddForm(false)}
//                   >
//                     Cancel
//                   </button>
//                   <button type="submit" className="search-button">
//                     Save
//                   </button>
//                 </div>
//               </form>
//             )}
//           </div>
//         </div>

//         <div className="search-bar">
//           <input
//             className="search-input"
//             type="text"
//             placeholder="Search cafes by name or location"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <button className="search-button" type="button">
//             Search
//           </button>
//         </div>
//       </div>

//       <p className="profile-subtitle">
//         Discover hand-picked cafés near you. Explore menus, ratings, and more.
//       </p>

//       {/* Cafes */}
//       <div className="cafe-grid">
//         {filteredCafes.length > 0 ? (
//           filteredCafes.map((cafe) => (
//             <div key={cafe.id} className="cafe-card">
//               <img
//                 className="cafe-image"
//                 src={cafe.imageUrl}
//                 alt={cafe.cafeName}
//               />
//               <div className="cafe-info">
//                 <h3 className="cafe-name">{cafe.cafeName}</h3>
//                 <p className="cafe-location">
//                   {cafe.address}, {cafe.city}
//                 </p>
//                 {cafe.rating && (
//                   <p className="cafe-rating">Rating: {cafe.rating} ⭐</p>
//                 )}

//                 <button
//                   className="browse-button"
//                   type="button"
//                   onClick={() => navigate(`/cafe/${cafe.id}`)}
//                 >
//                   View Café
//                 </button>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p>No cafes found.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CustomerProfile;






// // import React, { useEffect, useState, useMemo, useRef } from "react";
// // import { useNavigate } from "react-router-dom";
// // import axios from "axios";
// // import './Customerprofile.css';

// // const CustomerProfile = () => {
// //   const navigate = useNavigate();
// //   const actionsRef = useRef(null);
// //   const [customer, setCustomer] = useState(null);
// //   const [cart,setCart] = useState(() => {

// //   const stored = localStorage.getItem("cart");

// //   return stored ? JSON.parse(stored) : [];

// // });

// //   useEffect(() => {
// //   const user = localStorage.getItem("user");
// //   if (user) {
// //     setCustomer(JSON.parse(user));
// //   }
// // }, []);

// //   // Addresses
// //   const [savedAddresses, setSavedAddresses] = useState(() => {
// //     const raw = localStorage.getItem("savedAddresses");
// //     if (raw) {
// //       try {
// //         const arr = JSON.parse(raw);
// //         if (Array.isArray(arr)) return arr;
// //       } catch (e) {
// //         console.warn("could not parse savedAddresses", e);
// //       }
// //     }
// //     return [];
// //   });

// //   const [address, setAddress] = useState(() => savedAddresses[0]?.full || "");
// //   const [showAddForm, setShowAddForm] = useState(false);
// //   const [newAddrLabel, setNewAddrLabel] = useState("");
// //   const [newAddrText, setNewAddrText] = useState("");

// //   // Cafes
// //   const [cafes, setCafes] = useState([]);
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [menuOpen, setMenuOpen] = useState(false);

// //   // Fetch cafes from backend
// //   useEffect(() => {
// //     axios
// //       .get("http://localhost:8081/api/cafe")
// //       .then((res) => {
// //         const cafesArray = Array.isArray(res.data) ? res.data : res.data.cafes || [];
// //         // Add default image if backend does not provide one
// //         const cafesWithImages = cafesArray.map((cafe, idx) => ({
// //           ...cafe,
// //           imageUrl:
// //             cafe.imageUrl ||
// //             `https://source.unsplash.com/400x300/?cafe,coffee,${idx}`,
// //         }));
// //         setCafes(cafesWithImages);
// //       })
// //       .catch((err) => console.error("failed to fetch cafes", err));
// //   }, []);

  
// //       const filteredCafes = useMemo(() =>
// //       cafes.filter((c) =>
// //         (c.cafeName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
// //         (c.address?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
// //         (c.city?.toLowerCase() || "").includes(searchTerm.toLowerCase())
// //       ),
// //       [cafes, searchTerm]
// //     );


// //   // Click outside to close menu
// //   useEffect(() => {
// //     const handleClickOutside = (e) => {
// //       if (actionsRef.current && !actionsRef.current.contains(e.target)) {
// //         setMenuOpen(false);
// //       }
// //     };
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   // Address handlers
// //   const handleUseCurrentLocation = () => {
// //     if (navigator.geolocation) {
// //       navigator.geolocation.getCurrentPosition(
// //         (pos) => setAddress(`Lat ${pos.coords.latitude.toFixed(4)}, Lon ${pos.coords.longitude.toFixed(4)}`),
// //         () => setAddress("Using current location")
// //       );
// //     } else {
// //       setAddress("Using current location");
// //     }
// //   };

// //   const handleSelectSaved = (full) => setAddress(full);

// //   const handleAddAddress = (e) => {
// //     e.preventDefault();
// //     const label = newAddrLabel.trim() || "Address";
// //     const full = newAddrText.trim();
// //     if (!full) return;
// //     const next = [...savedAddresses, { label, full }];
// //     setSavedAddresses(next);
// //     localStorage.setItem("savedAddresses", JSON.stringify(next));
// //     setAddress(full);
// //     setShowAddForm(false);
// //     setNewAddrLabel("");
// //     setNewAddrText("");
// //   };

// //   // Navigation
// //   const handleLogout = () => {
// //     localStorage.removeItem("userRole");
// //     navigate("/");
// //   };
// //   const goProfile = () => navigate("/customer-account");
// //   const goFavourites = () => navigate("/customer-account?tab=favourites");

// //   // add to cart function
// //   const addToCart = (item) => {

// //   const updated = [...cart,item];

// //   setCart(updated);

// //   localStorage.setItem("cart",JSON.stringify(updated));

// // };




// //   return (
// //     <div className="customer-profile">
// //       {/* Top bar */}
// //       <div className="profile-topbar">
        
// //         <h2 className="profile-title">
// //           Hi {customer ? ` ${customer.firstName}  `: "customer"} 
// //           <br/>
// //           Browse Cafés
// //         </h2>





// //         <div className="profile-actions" ref={actionRef}>
// //         {/* <div ref={actionsRef} className={`profile-actions has-menu ${menuOpen ? "open" : ""}`}> */}
          

// //             <div
// //               className="cart-icon"
// //               onClick={() => navigate("/cart")}
// //             >
// //               🛒 {cart.length}
// //             </div>

// //             <div
// //               className="profile-avatar-icon"
// //               title="your profile"
// //               onClick={() => setMenuOpen(v => !v)}
// //             >
// //               👤
// //             </div>

// //             {/* <div ref={actionsRef} className="profile-actions has-menu"> */}
  
// //             {/* <div
// //                 className="cart-icon"
// //                 onClick={() => navigate("/cart")}
// //             >
// //                 🛒 {cart.length}
// //             </div>

// //             <div
// //                 className="profile-avatar-icon"
// //                 onClick={() => setMenuOpen((v) => !v)}
// //             >
// //                 👤
// //             </div> */}

// //             {menuOpen && (
// //                 <ul className="profile-dropdown">
// //                 <li onClick={goProfile}>Profile</li>
// //                 <li onClick={goFavourites}>Favourites</li>
// //                 <li onClick={handleLogout}>Logout</li>
// //                 </ul>
// //             )}
// //             </div>



// //           {/* </div> */}

// //           {/* <div className="profile-avatar-icon" title="Your profile" onClick={() => setMenuOpen((v) => !v)}>👤</div>
// //           {menuOpen && (
// //           <ul className="profile-dropdown">
// //             <li onClick={goProfile}>Profile</li>
// //             <li onClick={goFavourites}>Favourites</li>
// //             <li onClick={handleLogout}>Logout</li>
// //           </ul>
// //           )}
// //         </div>
// //       </div> */}

// //       {/* Header with addresses & search */}
// //       <div className="profile-header">
// //         <div className="address-pill has-address-menu">
// //           <div className="address-pill-left">📍</div>
// //           <div className="address-pill-text">{address || "Add new address"}</div>
// //           <div className="address-pill-right">▾</div>
// //           <div className="address-dropdown">
// //             <button className="dropdown-action" onClick={handleUseCurrentLocation}>Use my current location</button>
// //             <div className="dropdown-divider" />
// //             <div className="dropdown-section-title">Saved Addresses</div>
// //             {savedAddresses.length > 0 ? (
// //               <ul className="saved-addresses">
// //                 {savedAddresses.map((a, idx) => (
// //                   <li key={idx} onClick={() => handleSelectSaved(a.full)}>
// //                     <span className="addr-icon">📍</span>
// //                     <span className="addr-label">{a.label}</span>
// //                     <span className="addr-full">· {a.full}</span>
// //                   </li>
// //                 ))}
// //               </ul>
// //             ) : <div className="no-address">No saved addresses</div>}
// //             {!showAddForm ? (
// //               <button className="dropdown-action" onClick={() => setShowAddForm(true)}>Add new address</button>
// //             ) : (
// //               <form className="add-address-form" onSubmit={handleAddAddress}>
// //                 <input type="text" className="add-input" placeholder="Label (e.g., Home)" value={newAddrLabel} onChange={(e) => setNewAddrLabel(e.target.value)} />
// //                 <input type="text" className="add-input" placeholder="Full address" value={newAddrText} onChange={(e) => setNewAddrText(e.target.value)} />
// //                 <div className="add-actions">
// //                   <button type="button" className="btn-link" onClick={() => setShowAddForm(false)}>Cancel</button>
// //                   <button type="submit" className="search-button">Save</button>
// //                 </div>
// //               </form>
// //             )}
// //           </div>
// //         </div>

// //         <div className="search-bar">
// //           <input className="search-input" type="text" placeholder="Search cafes by name or location" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
// //           <button className="search-button" type="button">Search</button>
// //         </div>
// //       </div>

// //       <p className="profile-subtitle">Discover hand-picked cafés near you. Explore menus, ratings, and more.</p>

// //       {/* Cafes grid */}
// //       <div className="cafe-grid">
// //         {filteredCafes.length > 0 ? filteredCafes.map((cafe) => (
// //           <div key={cafe.id} className="cafe-card">
// //             <img className="cafe-image" src={cafe.imageUrl} alt={cafe.cafe_name} />
// //             <div className="cafe-info">
// //               <h3 className="cafe-name">{cafe.cafeName}</h3>
// //               <p className="cafe-location">{cafe.address}, {cafe.city}</p>
// //               {cafe.rating && <p className="cafe-rating">Rating: {cafe.rating} ⭐</p>}
// //               {/* <button className="browse-button" type="button" onClick={() => navigate(`/dashboard/customer?cafeId=${cafe.id}`)}>View Café</button> */}
// //               <button
// //                 className="browse-button"
// //                 type="button"
// //                 onClick={() => navigate(`/cafe/${cafe.id}`)}
// //               >
// //                 View Café
// //               </button>

// //             </div>
// //           </div>
// //         )) : <p>No cafes found.</p>}
// //       </div>
// //     </div>
// //   );
// // };

// // export default CustomerProfile;









