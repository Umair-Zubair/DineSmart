import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Restaurant from "./pages/Restaurant";
import Reservation from "./pages/Reservation";
import Header from "./components/Header";

const App = () => {
  return (
    <Router>
      <Header/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/restaurant/:restaurant_id" element={<Restaurant />} />
        <Route path="/restaurant/:restaurant_id/reserve" element={<Reservation />} />
      </Routes>
    </Router>
  );
};

export default App;