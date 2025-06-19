'use client';

import 'react-phone-input-2/lib/style.css';
import PhoneInput from 'react-phone-input-2';

type Props = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
};

export default function PhoneNumberInput({ value, onChange, name = 'phone' }: Props) {
  return (
    <div className="phone-container">
      <PhoneInput
        country="mx"
        value={value}
        onChange={onChange}
        inputProps={{
          name,
          required: false,
          autoFocus: false,
        }}
        placeholder="984 210 79 70"
        isValid={(inputValue: string) => inputValue.length >= 6 && inputValue.length <= 15}
        inputClass="phone-input"
        buttonClass="phone-flag"
        containerClass="phone-container"
      />
    </div>
  );
}
