import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./MenuManagement.css";

const menuItemNamePattern = /^[A-Za-z\s]+$/;
const seasonalOfferOptions = [
  { value: "", label: "No Seasonal Offer" },
  { value: "SUMMER", label: "Summer" },
  { value: "MONSOON", label: "Monsoon" },
  { value: "WINTER", label: "Winter" },
  { value: "FESTIVE", label: "Festive" },
];
const MENU_OFFERS_CACHE_KEY = "menu_seasonal_offers_cache";

const emptyMenuItem = {
  name: "",
  price: "",
  description: "",
  seasonalOfferSeason: "",
  seasonalOfferPercentage: "",
  image: null,
};

const getOfferPreviewLabel = (item) => {
  const season = String(item?.seasonalOfferSeason || "").trim().toUpperCase();
  const percentage = Number(item?.seasonalOfferPercentage || 0);

  if (percentage <= 0) {
    return "No seasonal offer";
  }

  if (!season) {
    return `Offer: ${percentage}% OFF`;
  }

  return `Offer: ${season} ${percentage}% OFF`;
};

const readOffersCache = () => {
  try {
    const raw = localStorage.getItem(MENU_OFFERS_CACHE_KEY) || "{}";
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeOffersCache = (cache) => {
  try {
    localStorage.setItem(MENU_OFFERS_CACHE_KEY, JSON.stringify(cache));
    window.dispatchEvent(new Event("menuSeasonalOffersChanged"));
  } catch {}
};

const mergeCachedOffer = (item, cafeId, cache) => {
  const cafeKey = String(cafeId ?? "");
  const itemKey = String(item?.id ?? "");
  const cached = cache?.[cafeKey]?.[itemKey];

  if (!cached) {
    return item;
  }

  return {
    ...item,
    seasonalOfferSeason: item?.seasonalOfferSeason || cached.seasonalOfferSeason || "",
    seasonalOfferPercentage:
      Number(item?.seasonalOfferPercentage || 0) > 0
        ? item.seasonalOfferPercentage
        : cached.seasonalOfferPercentage || 0,
  };
};

const MenuManagement = ({ cafeId, onSuccess }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState(emptyMenuItem);
  const [showMenuPopup, setShowMenuPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchMenu = async () => {
    if (!cafeId) return;

    const response = await fetch(`http://localhost:8081/api/menu/cafe/${cafeId}`);
    const data = await response.json();

    if (Array.isArray(data)) {
      const cache = readOffersCache();
      setMenuItems(data.map((item) => mergeCachedOffer(item, cafeId, cache)).reverse());
    } else {
      console.error("Menu API returned error:", data);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [cafeId]);

  useEffect(() => {
    const syncOffers = () => fetchMenu();
    window.addEventListener("menuSeasonalOffersChanged", syncOffers);
    return () => window.removeEventListener("menuSeasonalOffersChanged", syncOffers);
  }, [cafeId]);

  const handleAddItem = async (e) => {
    e.preventDefault();

    const itemNameValue = String(newItem.name ?? "").trim();
    const itemPriceValue = String(newItem.price ?? "").trim();
    const itemDescriptionValue = String(newItem.description ?? "");
    const itemSeasonValue = String(newItem.seasonalOfferSeason ?? "").trim();
    const itemOfferValue = String(newItem.seasonalOfferPercentage ?? "").trim();

    if (!itemNameValue || !menuItemNamePattern.test(itemNameValue)) {
      alert("Item name should contain only letters.");
      return;
    }

    if (!itemPriceValue || !/^\d+$/.test(itemPriceValue)) {
      alert("Price should contain only numbers.");
      return;
    }

    if (itemOfferValue && !/^\d+$/.test(itemOfferValue)) {
      alert("Seasonal offer should contain only numbers.");
      return;
    }

    const formData = new FormData();
    formData.append("itemName", itemNameValue);
    formData.append("price", itemPriceValue);
    formData.append("description", itemDescriptionValue);
    formData.append("seasonalOfferSeason", itemSeasonValue);
    formData.append("seasonalOfferPercentage", itemOfferValue || "0");

    if (newItem.image) {
      formData.append("image", newItem.image);
    }

    try {
      const url = isEditing
        ? `http://localhost:8081/api/menu/${editId}`
        : `http://localhost:8081/api/menu/cafe/${cafeId}`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(isEditing ? "Failed to update menu item." : "Failed to add menu item.");
      }

      const responseText = await response.text();
      let savedItem = null;

      if (responseText) {
        try {
          savedItem = JSON.parse(responseText);
        } catch (error) {
          console.error("Unable to parse menu response", error);
        }
      }

      if (savedItem) {
        const savedItemId = savedItem.id ?? editId;
        const cache = readOffersCache();
        const cafeKey = String(cafeId ?? "");
        const itemKey = String(savedItemId ?? "");
        const nextCache = {
          ...cache,
          [cafeKey]: {
            ...(cache[cafeKey] || {}),
            [itemKey]: {
              seasonalOfferSeason: itemSeasonValue,
              seasonalOfferPercentage: Number(itemOfferValue || 0),
            },
          },
        };
        writeOffersCache(nextCache);

        const hydratedItem = mergeCachedOffer(savedItem, cafeId, nextCache);
        setMenuItems((prev) =>
          isEditing
            ? prev.map((item) => (item.id === editId ? hydratedItem : item))
            : [hydratedItem, ...prev]
        );
      } else {
        fetchMenu();
      }

      onSuccess?.(isEditing ? "Menu item updated successfully." : "Menu item added successfully.");
      setNewItem(emptyMenuItem);
      setIsEditing(false);
      setEditId(null);
      setShowMenuPopup(false);
    } catch (error) {
      console.error("Save menu item failed", error);
      alert(error.message || "Unable to save menu item.");
    }
  };

  const handleEditItem = (item) => {
    setNewItem({
      name: String(item.itemName ?? ""),
      price: String(item.price ?? ""),
      description: String(item.description ?? ""),
      seasonalOfferSeason: String(item.seasonalOfferSeason ?? ""),
      seasonalOfferPercentage: String(item.seasonalOfferPercentage ?? ""),
      image: null,
    });

    setEditId(item.id);
    setIsEditing(true);
    setShowMenuPopup(true);
  };

  const handleDeleteItem = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this item ?");
    if (!confirmDelete) return;

    await fetch(`http://localhost:8081/api/menu/${id}`, {
      method: "DELETE",
    });

    const cache = readOffersCache();
    const cafeKey = String(cafeId ?? "");
    const itemKey = String(id ?? "");
    if (cache[cafeKey]?.[itemKey]) {
      const nextCafeCache = { ...(cache[cafeKey] || {}) };
      delete nextCafeCache[itemKey];
      writeOffersCache({
        ...cache,
        [cafeKey]: nextCafeCache,
      });
    }

    fetchMenu();
    onSuccess?.("Menu item deleted successfully.");
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      setNewItem({
        ...newItem,
        image: files[0],
      });
      return;
    }

    let nextValue = value;

    if (name === "name") {
      nextValue = value.replace(/[^A-Za-z\s]/g, "");
    }

    if (name === "price" || name === "seasonalOfferPercentage") {
      nextValue = value.replace(/\D/g, "");
    }

    setNewItem({
      ...newItem,
      [name]: nextValue,
    });
  };

  return (
    <div className="menu-management-section">
      <div className="menu-header">
        <h3 className="menu-title">Menu Items</h3>

        <button
          className="menu-add-btn"
          onClick={() => {
            setNewItem(emptyMenuItem);
            setIsEditing(false);
            setEditId(null);
            setShowMenuPopup(true);
          }}
        >
          Add Menu
        </button>
      </div>

      {showMenuPopup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{isEditing ? "Edit Menu Item" : "Add Menu Item"}</h3>

            <form onSubmit={handleAddItem} className="menu-popup-form">
              <input
                className="menu-input"
                name="name"
                placeholder="Item Name"
                value={newItem.name}
                onChange={handleInputChange}
              />

              <input
                className="menu-input"
                name="price"
                placeholder="Price"
                value={newItem.price}
                onChange={handleInputChange}
                inputMode="numeric"
              />

              <textarea
                className="menu-input"
                name="description"
                placeholder="Description"
                value={newItem.description}
                onChange={handleInputChange}
              />

              <select
                className="menu-input"
                name="seasonalOfferSeason"
                value={newItem.seasonalOfferSeason}
                onChange={handleInputChange}
              >
                {seasonalOfferOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <input
                className="menu-input"
                name="seasonalOfferPercentage"
                placeholder="Seasonal Offer %"
                value={newItem.seasonalOfferPercentage}
                onChange={handleInputChange}
                inputMode="numeric"
              />

              <input
                type="file"
                name="image"
                className="menu-input"
                onChange={handleInputChange}
              />

              <div className="modal-actions">
                <button type="submit" className="menu-add-btn">
                  {isEditing ? "Update Item" : "Add Item"}
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowMenuPopup(false);
                    setNewItem(emptyMenuItem);
                    setIsEditing(false);
                    setEditId(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="menu-grid">
        {menuItems.map((item) => (
          <div key={item.id} className="menu-card">
            <img
              src={item.imageUrl?.startsWith("http")
                ? item.imageUrl
                : `http://localhost:8081${item.imageUrl}`}
              alt={item.itemName}
              className="menu-image"
            />

            <div className="menu-card-info">
              <span className="menu-card-name">{item.itemName}</span>
              <span className="menu-card-price">Rs. {item.price}</span>
              <span className="menu-card-offer">{getOfferPreviewLabel(item)}</span>
            </div>

            <div className="menu-card-actions">
              <FaEdit onClick={() => handleEditItem(item)} />
              <FaTrash onClick={() => handleDeleteItem(item.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuManagement;
