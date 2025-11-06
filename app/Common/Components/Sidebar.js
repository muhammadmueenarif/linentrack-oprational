"use client"
import { useState } from 'react';
import { FaTshirt, FaSoap, FaTruck, FaReceipt } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
    style={{position:"fixed",left:"0px",height:"100%"}}
    className={`bg-blue-900 text-white p-4 ${isOpen ? 'w-64' : 'w-14'} transition-width duration-300`}>
      <div className="flex items-center mb-6">
        <FiMenu className="text-white text-2xl mr-2 cursor-pointer" onClick={toggleSidebar} />
        {/*  */}
      </div>
      <ul>
        {isOpen && <h2 className="text-2xl font-bold m-4 mt-8">POS</h2>}
        <li className="mb-4"><FaTshirt className="inline-block mr-2" /> {isOpen && 'Dry Cleaning'}</li>
        <li className="mb-4"><FaSoap className="inline-block mr-2" /> {isOpen && 'Laundromat'}</li>
        <li className="mb-4"><FaTruck className="inline-block mr-2" /> {isOpen && 'Bulk Laundry'}</li>
        <li className="mb-4"><FaReceipt className="inline-block mr-2" /> {isOpen && 'Rental'}</li>
      </ul>
    </div>
  );
};

export default Sidebar;
