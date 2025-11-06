import { FaBell, FaEnvelope } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';

const Navbar = () => {
  return (
    <nav style={{ position: "fixed", top: "0px", width: "100%", zIndex: "10" }} className="flex justify-between items-center p-4 bg-blue-900 text-white">
      
      {/* Hamburger menu and Admin text */}
      <div className="flex items-center space-x-3">
        <FiMenu className="text-white text-xl" />
        <span className="font-bold text-lg">Admin</span>
      </div>
      
      {/* Navigation Links */}
      <div className="flex flex-1 justify-center">
        <ul className="flex space-x-6">
          <li className="text-yellow-500 font-bold">New Order</li>
          <li>Pickup & Deliveries</li>
          <li>Cleaning</li>
          <li>Ironing & Folding</li>
          <li>Ready</li>
          <li>Details</li>
          <li>Machine</li>
        </ul>
      </div>
      
      {/* Notifications and Profile */}
      <div className="flex items-center space-x-4">
        <FaEnvelope className="text-white text-xl" />
        <FaBell className="text-white text-xl" />
        <span className="bg-yellow-500 text-black font-bold px-2 rounded-full">23</span>
        <span className="font-bold">James Supardi</span>
        <img src="https://placehold.co/40x40/png" alt="profile" className="w-10 h-10 rounded-full" />
      </div>
    </nav>
  );
};

export default Navbar;
