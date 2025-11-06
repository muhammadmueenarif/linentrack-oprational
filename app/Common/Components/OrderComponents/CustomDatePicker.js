"use client";
import React, { useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';

const CustomDatePicker = ({ selectedDate, onDateChange, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("05:00 AM");
  
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 5; hour <= 6; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const period = hour < 12 ? 'AM' : 'PM';
        const displayHour = hour % 12 || 12;
        slots.push(`${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`);
      }
    }
    return slots;
  };

  const generateCalendarDays = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const days = [];
    
    // Previous month days
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), -i);
      days.unshift({
        date: prevDate.getDate(),
        isCurrentMonth: false,
        fullDate: prevDate
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: currentDate
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i);
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: nextDate
      });
    }
    
    return days;
  };

  const handleDateSelect = (date) => {
    const [hours, minutes, period] = selectedTime.split(/:|\s/);
    const newDate = new Date(date);
    newDate.setHours(
      period === "PM" ? (parseInt(hours) % 12) + 12 : parseInt(hours) % 12,
      parseInt(minutes),
      0
    );
    onDateChange(newDate);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-[320px]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold">Select Deliver Date</div>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <select 
            className="w-full appearance-none bg-white border rounded-md px-3 py-2 pr-8"
            value={months[currentMonth.getMonth()]}
            onChange={(e) => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(months.indexOf(e.target.value));
              setCurrentMonth(newDate);
            }}
          >
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
        
        <div className="relative flex-1">
          <select 
            className="w-full appearance-none bg-white border rounded-md px-3 py-2 pr-8"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
          >
            {generateTimeSlots().map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
          <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-sm text-blue-500 font-medium">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {generateCalendarDays().map((day, index) => (
          <button
            key={index}
            onClick={() => handleDateSelect(day.fullDate)}
            className={`
              p-2 text-center rounded-md hover:bg-blue-50
              ${day.isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
              ${day.fullDate.toDateString() === selectedDate?.toDateString() ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
            `}
          >
            {day.date}
          </button>
        ))}
      </div>
      
      <button
        onClick={onClose}
        className="w-full mt-4 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
      >
        Confirm
      </button>
    </div>
  );
};

export default CustomDatePicker;