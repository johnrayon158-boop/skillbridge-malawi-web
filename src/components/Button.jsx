import React from 'react';

export default function Button({children,onClick,variant='primary',type='button',disabled=false}){
  return <button disabled={disabled} type={type} onClick={onClick} className={'btn '+variant}>{children}</button>
}
