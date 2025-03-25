import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "https://dinesmart-backend.vercel.app"; // backend url

const Restaurant = () => {
  const { id } = useParams();
  const [menu, setMenu] = useState([]);
  const [reservation, setReservation] = useState({ date: "", time: "", guests: 1 });

  useEffect(() => {
    axios.get(`${API_BASE_URL}/menu-items?restaurant_id=${id}`).then((res) => setMenu(res.data));
  }, [id]);

  const handleReservation = () => {
    axios.post(`${API_BASE_URL}/reservations`, { ...reservation, restaurant_id: id })
      .then(() => alert("Reservation successful!"))
      .catch(err => alert("Error making reservation"));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Menu</h1>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {menu.map((item) => (
          <div key={item.item_id} className="border p-4 rounded-lg shadow-lg">
            <h2 className="font-bold">{item.name}</h2>
            <p>{item.description}</p>
            <p>${item.price}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-bold">Make a Reservation</h2>
        <input
          type="date"
          onChange={(e) => setReservation({ ...reservation, date: e.target.value })}
          className="block p-2 border my-2"
        />
        <input
          type="time"
          onChange={(e) => setReservation({ ...reservation, time: e.target.value })}
          className="block p-2 border my-2"
        />
        <input
          type="number"
          min="1"
          onChange={(e) => setReservation({ ...reservation, guests: e.target.value })}
          className="block p-2 border my-2"
        />
        <button onClick={handleReservation} className="bg-blue-500 text-white px-4 py-2 rounded">
          Reserve
        </button>
      </div>
    </div>
  );
};

export default Restaurant;
