

import React from 'react'

export const TextArea =({ placeholder, value, onChange, className }) => {
    return (
        <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full border p-2 rounded-md ${className}`}
        />
    )
}

