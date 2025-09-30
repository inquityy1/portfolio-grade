import React, { forwardRef } from 'react';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  (props, ref) => (
    <textarea
      {...props}
      ref={ref}
      style={{
        width: '90%',
        padding: '12px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        background: 'white',
        color: 'black',
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'inherit',
        ...props.style
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#4CAF50';
        e.target.style.boxShadow = '0 0 0 2px rgba(76,175,80,0.25)';
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#ccc';
        e.target.style.boxShadow = 'none';
        props.onBlur?.(e);
      }}
    />
  )
);